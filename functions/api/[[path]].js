// Cloudflare Pages Function - Direct D1 API

// UUID v4 generator
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Simple password hashing (use bcrypt in production)
async function hashPassword(password) {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function onRequest(context) {
  const { request, env, params } = context;
  const path = params.path ? params.path.join('/') : '';

  // Set CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  // Handle OPTIONS
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // Route handling
    if (path === 'railway-home/recommended') {
      // Get recommended posts
      const limit = new URL(request.url).searchParams.get('limit') || 10;
      const results = await env.DB.prepare(`
        SELECT
          p.*,
          json_object(
            'id', pr.id,
            'username', pr.username,
            'display_name', pr.display_name,
            'avatar_url', pr.avatar_url
          ) as profiles,
          json_object(
            'id', t.id,
            'name', t.name,
            'start_date', t.start_date,
            'end_date', t.end_date,
            'location', t.location,
            'sport_type', t.sport_type
          ) as tournaments
        FROM tournament_results p
        LEFT JOIN profiles pr ON p.user_id = pr.id
        LEFT JOIN tournaments t ON p.tournament_id = t.id
        ORDER BY p.created_at DESC
        LIMIT ?
      `).bind(limit).all();

      const posts = results.results.map(row => ({
        ...row,
        profiles: row.profiles ? JSON.parse(row.profiles) : null,
        tournaments: row.tournaments ? JSON.parse(row.tournaments) : null
      }));

      return new Response(JSON.stringify(posts), { headers: corsHeaders });
    }

    if (path === 'railway-auth/register' && request.method === 'POST') {
      const { email, password, username, display_name } = await request.json();

      if (!email || !password || !username) {
        return new Response(JSON.stringify({
          errors: [{ msg: 'Email, password, and username are required', path: 'email' }]
        }), {
          status: 400,
          headers: corsHeaders
        });
      }

      // Check if user exists
      const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
      if (existing) {
        return new Response(JSON.stringify({
          errors: [{ msg: 'Email already exists', path: 'email' }]
        }), {
          status: 400,
          headers: corsHeaders
        });
      }

      // Generate UUID and hash password
      const userId = generateUUID();
      const hashedPassword = await hashPassword(password);
      const now = new Date().toISOString();

      // Insert user and profile
      await env.DB.batch([
        env.DB.prepare('INSERT INTO users (id, email, encrypted_password, created_at, updated_at) VALUES (?, ?, ?, ?, ?)')
          .bind(userId, email, hashedPassword, now, now),
        env.DB.prepare('INSERT INTO profiles (id, username, display_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)')
          .bind(userId, username, display_name || username, now, now)
      ]);

      const token = btoa(JSON.stringify({ id: userId, email, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 }));

      return new Response(JSON.stringify({
        user: { id: userId, email, username, display_name: display_name || username },
        token
      }), { headers: corsHeaders });
    }

    if (path === 'railway-auth/login' && request.method === 'POST') {
      const { email, password } = await request.json();

      const user = await env.DB.prepare(
        'SELECT u.*, p.username, p.display_name FROM users u LEFT JOIN profiles p ON u.id = p.id WHERE u.email = ?'
      ).bind(email).first();

      if (!user) {
        return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
          status: 401,
          headers: corsHeaders
        });
      }

      // Verify password
      const hashedInput = await hashPassword(password);
      if (hashedInput !== user.encrypted_password) {
        return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
          status: 401,
          headers: corsHeaders
        });
      }

      // Simple token (in production, use proper JWT)
      const token = btoa(JSON.stringify({ id: user.id, email: user.email, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 }));

      return new Response(JSON.stringify({
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          display_name: user.display_name
        },
        token
      }), { headers: corsHeaders });
    }

    if (path === 'railway-auth/me' && request.method === 'GET') {
      // Get token from Authorization header
      const authHeader = request.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Missing or invalid Authorization header' }), {
          status: 401,
          headers: corsHeaders
        });
      }

      const token = authHeader.slice(7);
      let tokenData;
      try {
        tokenData = JSON.parse(atob(token));
      } catch (e) {
        return new Response(JSON.stringify({ error: 'Invalid token' }), {
          status: 401,
          headers: corsHeaders
        });
      }

      // Check token expiration
      if (tokenData.exp && tokenData.exp < Date.now()) {
        return new Response(JSON.stringify({ error: 'Token expired' }), {
          status: 401,
          headers: corsHeaders
        });
      }

      const userId = tokenData.id;
      if (!userId) {
        return new Response(JSON.stringify({ error: 'Invalid token' }), {
          status: 401,
          headers: corsHeaders
        });
      }

      // Get user profile
      const user = await env.DB.prepare(
        'SELECT u.*, p.username, p.display_name, p.avatar_url, p.bio FROM users u LEFT JOIN profiles p ON u.id = p.id WHERE u.id = ?'
      ).bind(userId).first();

      if (!user) {
        return new Response(JSON.stringify({ error: 'User not found' }), {
          status: 404,
          headers: corsHeaders
        });
      }

      return new Response(JSON.stringify({
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          display_name: user.display_name,
          avatar_url: user.avatar_url,
          bio: user.bio
        }
      }), { headers: corsHeaders });
    }

    if (path === 'railway-users/search') {
      const term = new URL(request.url).searchParams.get('term') || '';
      const limit = new URL(request.url).searchParams.get('limit') || 10;

      const results = await env.DB.prepare(`
        SELECT id, username, display_name, avatar_url
        FROM profiles
        WHERE username LIKE ? OR display_name LIKE ?
        LIMIT ?
      `).bind(`%${term}%`, `%${term}%`, limit).all();

      return new Response(JSON.stringify(results.results), { headers: corsHeaders });
    }

    // Get follow status
    if (path === 'railway-users/follow-status' && request.method === 'GET') {
      const url = new URL(request.url);
      let asUser = url.searchParams.get('as_user');
      let targetId = url.searchParams.get('target_id');

      if (!asUser || !targetId) {
        return new Response(JSON.stringify({ error: 'as_user and target_id are required' }), {
          status: 400,
          headers: corsHeaders
        });
      }

      // Clean up whitespace
      asUser = asUser.trim().replace(/[\r\n\t]/g, '');
      targetId = targetId.trim().replace(/[\r\n\t]/g, '');

      // Check if following
      const follow = await env.DB.prepare(`
        SELECT id FROM follows
        WHERE follower_id = ? AND following_id = ?
      `).bind(asUser, targetId).first();

      return new Response(JSON.stringify({
        isFollowing: !!follow
      }), { headers: corsHeaders });
    }

    // Follow user
    if (path === 'railway-users/follow' && request.method === 'POST') {
      try {
        const { as_user, target_id } = await request.json();

        if (!as_user || !target_id) {
          return new Response(JSON.stringify({ error: 'as_user and target_id are required' }), {
            status: 400,
            headers: corsHeaders
          });
        }

        // Prevent self-follow
        if (as_user === target_id) {
          return new Response(JSON.stringify({ error: 'Cannot follow yourself' }), {
            status: 400,
            headers: corsHeaders
          });
        }

        const followId = generateUUID();
        const now = new Date().toISOString();

        // Check if already following
        const existing = await env.DB.prepare(`
          SELECT id FROM follows WHERE follower_id = ? AND following_id = ?
        `).bind(as_user, target_id).first();

        if (existing) {
          return new Response(JSON.stringify({ error: 'Already following this user' }), {
            status: 400,
            headers: corsHeaders
          });
        }

        // Create follow relationship
        await env.DB.prepare(`
          INSERT INTO follows (id, follower_id, following_id, created_at)
          VALUES (?, ?, ?, ?)
        `).bind(followId, as_user, target_id, now).run();

        // Update follower counts
        await env.DB.batch([
          env.DB.prepare(`
            UPDATE profiles SET following_count = following_count + 1 WHERE id = ?
          `).bind(as_user),
          env.DB.prepare(`
            UPDATE profiles SET followers_count = followers_count + 1 WHERE id = ?
          `).bind(target_id)
        ]);

        return new Response(JSON.stringify({ success: true, isFollowing: true }), { headers: corsHeaders });
      } catch (error) {
        console.error('Error following user:', error);
        return new Response(JSON.stringify({
          error: 'Failed to follow user',
          details: error.message
        }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }

    // Unfollow user
    if (path === 'railway-users/follow' && request.method === 'DELETE') {
      try {
        const { as_user, target_id } = await request.json();

        if (!as_user || !target_id) {
          return new Response(JSON.stringify({ error: 'as_user and target_id are required' }), {
            status: 400,
            headers: corsHeaders
          });
        }

        // Delete follow relationship
        const result = await env.DB.prepare(`
          DELETE FROM follows WHERE follower_id = ? AND following_id = ?
        `).bind(as_user, target_id).run();

        if (result.meta.changes === 0) {
          return new Response(JSON.stringify({ error: 'Not following this user' }), {
            status: 400,
            headers: corsHeaders
          });
        }

        // Update follower counts
        await env.DB.batch([
          env.DB.prepare(`
            UPDATE profiles SET following_count = GREATEST(0, following_count - 1) WHERE id = ?
          `).bind(as_user),
          env.DB.prepare(`
            UPDATE profiles SET followers_count = GREATEST(0, followers_count - 1) WHERE id = ?
          `).bind(target_id)
        ]);

        return new Response(JSON.stringify({ success: true, isFollowing: false }), { headers: corsHeaders });
      } catch (error) {
        console.error('Error unfollowing user:', error);
        return new Response(JSON.stringify({
          error: 'Failed to unfollow user',
          details: error.message
        }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }

    if (path === 'railway-users/profile') {
      let userId = new URL(request.url).searchParams.get('user_id');

      if (!userId) {
        return new Response(JSON.stringify({ error: 'user_id is required' }), {
          status: 400,
          headers: corsHeaders
        });
      }

      // Remove any whitespace characters (including newlines) from user_id
      userId = userId.trim().replace(/[\r\n\t]/g, '');

      const profile = await env.DB.prepare(`
        SELECT
          p.*,
          u.email,
          u.created_at as user_created_at
        FROM profiles p
        LEFT JOIN users u ON p.id = u.id
        WHERE p.id = ?
      `).bind(userId).first();

      if (!profile) {
        return new Response(JSON.stringify({ error: 'Profile not found' }), {
          status: 404,
          headers: corsHeaders
        });
      }

      return new Response(JSON.stringify(profile), { headers: corsHeaders });
    }

    if (path === 'railway-users/stats') {
      let userId = new URL(request.url).searchParams.get('user_id');

      if (!userId) {
        return new Response(JSON.stringify({ error: 'user_id is required' }), {
          status: 400,
          headers: corsHeaders
        });
      }

      // Remove any whitespace characters (including newlines) from user_id
      userId = userId.trim().replace(/[\r\n\t]/g, '');

      // Get profile for follower counts
      const profile = await env.DB.prepare(
        'SELECT followers_count, following_count FROM profiles WHERE id = ?'
      ).bind(userId).first();

      // Get tournament count
      const tournamentCount = await env.DB.prepare(
        'SELECT COUNT(*) as count FROM tournament_results WHERE user_id = ?'
      ).bind(userId).first();

      // Get team count
      const teamCount = await env.DB.prepare(
        'SELECT COUNT(DISTINCT team_id) as count FROM team_members WHERE user_id = ?'
      ).bind(userId).first();

      // Get total points from tournament results
      const points = await env.DB.prepare(
        'SELECT COALESCE(SUM(points), 0) as total FROM tournament_results WHERE user_id = ?'
      ).bind(userId).first();

      const stats = {
        yearlyPoints: 0, // TODO: Calculate based on current year
        totalPoints: points?.total || 0,
        followingCount: profile?.following_count || 0,
        followersCount: profile?.followers_count || 0,
        tournamentCount: tournamentCount?.count || 0,
        teamCount: teamCount?.count || 0,
        awardsCount: 0, // TODO: Implement awards system
        badgesCount: 0  // TODO: Implement badges system
      };

      return new Response(JSON.stringify(stats), { headers: corsHeaders });
    }

    if (path === 'railway-users/tournaments') {
      let userId = new URL(request.url).searchParams.get('user_id');
      const limit = new URL(request.url).searchParams.get('limit') || 5;

      if (!userId) {
        return new Response(JSON.stringify({ error: 'user_id is required' }), {
          status: 400,
          headers: corsHeaders
        });
      }

      // Remove any whitespace characters (including newlines) from user_id
      userId = userId.trim().replace(/[\r\n\t]/g, '');

      const tournaments = await env.DB.prepare(`
        SELECT
          t.id,
          t.name,
          t.start_date,
          t.end_date,
          t.location,
          t.sport_type,
          tr.position,
          tr.points
        FROM tournament_results tr
        JOIN tournaments t ON tr.tournament_id = t.id
        WHERE tr.user_id = ?
        ORDER BY t.start_date DESC
        LIMIT ?
      `).bind(userId, limit).all();

      return new Response(JSON.stringify(tournaments.results || []), { headers: corsHeaders });
    }

    if (path === 'railway-posts/latest') {
      const limit = new URL(request.url).searchParams.get('limit') || 30;

      const posts = await env.DB.prepare(`
        SELECT
          p.*,
          pr.username,
          pr.display_name,
          pr.avatar_url
        FROM posts p
        LEFT JOIN profiles pr ON p.user_id = pr.id
        ORDER BY p.created_at DESC
        LIMIT ?
      `).bind(limit).all();

      return new Response(JSON.stringify(posts.results || []), { headers: corsHeaders });
    }

    if (path === 'railway-posts/create' && request.method === 'POST') {
      try {
        const { as_user, content, visibility = 'public', file_url = null, image_urls = [] } = await request.json();

        if (!as_user || !content) {
          return new Response(JSON.stringify({ error: 'as_user and content are required' }), {
            status: 400,
            headers: corsHeaders
          });
        }

        const postId = generateUUID();
        const now = new Date().toISOString();

        await env.DB.prepare(`
          INSERT INTO posts (id, user_id, content, visibility, file_url, like_count, comment_count, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, 0, 0, ?, ?)
        `).bind(postId, as_user, content, visibility, file_url, now, now).run();

        // TODO: Handle image_urls if needed (requires post_images table)

        const post = await env.DB.prepare(`
          SELECT p.*, pr.username, pr.display_name, pr.avatar_url
          FROM posts p
          LEFT JOIN profiles pr ON p.user_id = pr.id
          WHERE p.id = ?
        `).bind(postId).first();

        return new Response(JSON.stringify(post), { headers: corsHeaders });
      } catch (error) {
        console.error('Error creating post:', error);
        return new Response(JSON.stringify({
          error: 'Failed to create post',
          details: error.message
        }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }

    if (path === 'railway-home/following') {
      let asUserId = new URL(request.url).searchParams.get('as_user');
      const limit = new URL(request.url).searchParams.get('limit') || 10;

      if (!asUserId) {
        return new Response(JSON.stringify({ error: 'as_user is required' }), {
          status: 400,
          headers: corsHeaders
        });
      }

      // Remove any whitespace characters (including newlines) from as_user
      asUserId = asUserId.trim().replace(/[\r\n\t]/g, '');

      // Get posts from users that asUserId follows
      const posts = await env.DB.prepare(`
        SELECT
          p.*,
          pr.username,
          pr.display_name,
          pr.avatar_url
        FROM posts p
        LEFT JOIN profiles pr ON p.user_id = pr.id
        WHERE p.user_id IN (
          SELECT following_id FROM follows WHERE follower_id = ?
        )
        ORDER BY p.created_at DESC
        LIMIT ?
      `).bind(asUserId, limit).all();

      return new Response(JSON.stringify(posts.results || []), { headers: corsHeaders });
    }

    if (path === 'railway-home/recommended-diaries') {
      const limit = new URL(request.url).searchParams.get('limit') || 3;

      // Get recommended profiles (users with most followers)
      const profiles = await env.DB.prepare(`
        SELECT
          id,
          username,
          display_name,
          avatar_url,
          bio,
          sport_type,
          followers_count
        FROM profiles
        WHERE bio IS NOT NULL
        ORDER BY followers_count DESC
        LIMIT ?
      `).bind(limit).all();

      return new Response(JSON.stringify(profiles.results || []), { headers: corsHeaders });
    }

    if (path === 'railway-tournaments/search') {
      const url = new URL(request.url);
      const sport_type = url.searchParams.get('sport_type');
      const location = url.searchParams.get('location');
      const status = url.searchParams.get('status');
      const limit = url.searchParams.get('limit') || 20;

      let query = 'SELECT * FROM tournaments WHERE 1=1';
      const bindings = [];

      if (sport_type) {
        query += ' AND sport_type = ?';
        bindings.push(sport_type);
      }

      if (location) {
        query += ' AND location LIKE ?';
        bindings.push(`%${location}%`);
      }

      if (status) {
        const now = new Date().toISOString();
        if (status === 'upcoming') {
          query += ' AND start_date > ?';
          bindings.push(now);
        } else if (status === 'ongoing') {
          query += ' AND start_date <= ? AND end_date >= ?';
          bindings.push(now, now);
        } else if (status === 'finished') {
          query += ' AND end_date < ?';
          bindings.push(now);
        }
      }

      query += ' ORDER BY start_date DESC LIMIT ?';
      bindings.push(limit);

      const stmt = env.DB.prepare(query);
      const tournaments = await stmt.bind(...bindings).all();

      return new Response(JSON.stringify(tournaments.results || []), { headers: corsHeaders });
    }

    // Tournament apply endpoint
    if (path.match(/^railway-tournaments\/([^/]+)\/apply$/) && request.method === 'POST') {
      const parts = path.split('/');
      const tournamentId = parts[1];

      // Get user ID from JWT
      const authHeader = request.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: corsHeaders
        });
      }

      const token = authHeader.substring(7);
      let userId;
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        userId = payload.user?.id;
        if (!userId) {
          return new Response(JSON.stringify({ error: 'Invalid token' }), {
            status: 401,
            headers: corsHeaders
          });
        }
      } catch (e) {
        return new Response(JSON.stringify({ error: 'Invalid token' }), {
          status: 401,
          headers: corsHeaders
        });
      }

      // Check if tournament exists
      const tournament = await env.DB.prepare('SELECT * FROM tournaments WHERE id = ?')
        .bind(tournamentId).first();

      if (!tournament) {
        return new Response(JSON.stringify({ error: 'Tournament not found' }), {
          status: 404,
          headers: corsHeaders
        });
      }

      // Check if already applied
      const existing = await env.DB.prepare(
        'SELECT * FROM tournament_participants WHERE tournament_id = ? AND user_id = ?'
      ).bind(tournamentId, userId).first();

      if (existing) {
        return new Response(JSON.stringify({ error: 'Already applied to this tournament' }), {
          status: 400,
          headers: corsHeaders
        });
      }

      // Create participant entry
      const participantId = generateUUID();
      await env.DB.prepare(`
        INSERT INTO tournament_participants (id, tournament_id, user_id, status, created_at)
        VALUES (?, ?, ?, 'pending', datetime('now'))
      `).bind(participantId, tournamentId, userId).run();

      return new Response(JSON.stringify({
        success: true,
        message: 'Successfully applied to tournament',
        participant: {
          id: participantId,
          tournament_id: tournamentId,
          user_id: userId,
          status: 'pending'
        }
      }), { headers: corsHeaders });
    }

    if (path.startsWith('railway-tournaments/') && path !== 'railway-tournaments/search' && path !== 'railway-tournaments/create' && request.method === 'GET') {
      // Extract tournament ID from path (e.g., railway-tournaments/{id})
      const parts = path.split('/');
      const tournamentId = parts[1];
      
      if (!tournamentId) {
        return new Response(JSON.stringify({ error: 'Tournament ID is required' }), {
          status: 400,
          headers: corsHeaders
        });
      }

      const tournament = await env.DB.prepare('SELECT * FROM tournaments WHERE id = ?')
        .bind(tournamentId).first();

      if (!tournament) {
        return new Response(JSON.stringify({ error: 'Tournament not found' }), {
          status: 404,
          headers: corsHeaders
        });
      }

      return new Response(JSON.stringify(tournament), { headers: corsHeaders });
    }

    if (path === 'railway-meta') {
      // Return metadata for search filters
      const sportTypes = await env.DB.prepare(`
        SELECT DISTINCT sport_type FROM tournaments WHERE sport_type IS NOT NULL
      `).all();

      const locations = await env.DB.prepare(`
        SELECT DISTINCT location FROM tournaments WHERE location IS NOT NULL LIMIT 50
      `).all();

      const meta = {
        sport_types: sportTypes.results.map(r => r.sport_type),
        locations: locations.results.map(r => r.location),
        statuses: ['upcoming', 'ongoing', 'finished']
      };

      return new Response(JSON.stringify(meta), { headers: corsHeaders });
    }

    // Get test accounts
    if (path === 'railway-chat/test-accounts' && request.method === 'GET') {
      const testAccounts = await env.DB.prepare(`
        SELECT id, username, display_name, avatar_url
        FROM profiles
        WHERE username IN ('testuser', 'cfuser', 'sofvo_official', 'soccerstar', 'tennisace', 'baseballpro')
        ORDER BY username
      `).all();

      return new Response(JSON.stringify(testAccounts.results || []), { headers: corsHeaders });
    }

    // Get conversations (GET)
    if (path === 'railway-chat/conversations' && request.method === 'GET') {
      let asUserId = new URL(request.url).searchParams.get('as_user');

      if (!asUserId) {
        return new Response(JSON.stringify({ error: 'as_user is required' }), {
          status: 400,
          headers: corsHeaders
        });
      }

      // Remove any whitespace characters (including newlines) from as_user
      asUserId = asUserId.trim().replace(/[\r\n\t]/g, '');

      // Get conversations where user is a participant
      const conversations = await env.DB.prepare(`
        SELECT
          c.id,
          c.type,
          c.name,
          c.created_at,
          c.updated_at,
          (
            SELECT content
            FROM messages
            WHERE conversation_id = c.id
            ORDER BY created_at DESC
            LIMIT 1
          ) as last_message,
          (
            SELECT created_at
            FROM messages
            WHERE conversation_id = c.id
            ORDER BY created_at DESC
            LIMIT 1
          ) as last_message_at
        FROM conversations c
        WHERE c.id IN (
          SELECT conversation_id
          FROM conversation_participants
          WHERE user_id = ?
        )
        ORDER BY last_message_at DESC
      `).bind(asUserId).all();

      return new Response(JSON.stringify(conversations.results || []), { headers: corsHeaders });
    }

    // Create conversation (POST)
    if (path === 'railway-chat/conversations' && request.method === 'POST') {
      try {
        const { as_user, participant_ids = [], type = 'direct', name = null } = await request.json();

        if (!as_user) {
          return new Response(JSON.stringify({ error: 'as_user is required' }), {
            status: 400,
            headers: corsHeaders
          });
        }

        const conversationId = generateUUID();
        const now = new Date().toISOString();

        // Create conversation
        await env.DB.prepare(`
          INSERT INTO conversations (id, type, name, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?)
        `).bind(conversationId, type, name, now, now).run();

        // Add creator as participant
        const creatorParticipantId = generateUUID();
        await env.DB.prepare(`
          INSERT INTO conversation_participants (id, conversation_id, user_id, joined_at, last_read_at)
          VALUES (?, ?, ?, ?, ?)
        `).bind(creatorParticipantId, conversationId, as_user, now, now).run();

        // Add other participants
        for (const participantId of participant_ids) {
          const participantUUID = generateUUID();
          await env.DB.prepare(`
            INSERT INTO conversation_participants (id, conversation_id, user_id, joined_at, last_read_at)
            VALUES (?, ?, ?, ?, ?)
          `).bind(participantUUID, conversationId, participantId, now, now).run();
        }

        // Get the created conversation with participant info
        const conversation = await env.DB.prepare(`
          SELECT * FROM conversations WHERE id = ?
        `).bind(conversationId).first();

        // Return both conversation object and conversation_id for compatibility
        return new Response(JSON.stringify({
          ...conversation,
          conversation_id: conversationId,
          id: conversationId
        }), { headers: corsHeaders });
      } catch (error) {
        console.error('Error creating conversation:', error);
        return new Response(JSON.stringify({
          error: 'Failed to create conversation',
          details: error.message
        }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }

    // Get messages for a conversation
    if (path.match(/^railway-chat\/conversations\/[^/]+\/messages$/) && request.method === 'GET') {
      const conversationId = path.split('/')[2];
      const url = new URL(request.url);
      const asUserId = url.searchParams.get('as_user');
      const limit = parseInt(url.searchParams.get('limit') || '50');
      const offset = parseInt(url.searchParams.get('offset') || '0');

      if (!asUserId) {
        return new Response(JSON.stringify({ error: 'as_user is required' }), {
          status: 400,
          headers: corsHeaders
        });
      }

      // Verify user is a participant
      const participant = await env.DB.prepare(`
        SELECT id FROM conversation_participants
        WHERE conversation_id = ? AND user_id = ?
      `).bind(conversationId, asUserId).first();

      if (!participant) {
        return new Response(JSON.stringify({ error: 'User is not a participant of this conversation' }), {
          status: 403,
          headers: corsHeaders
        });
      }

      // Get messages with sender info
      const messages = await env.DB.prepare(`
        SELECT
          m.id,
          m.conversation_id,
          m.sender_id,
          m.content,
          m.type,
          m.file_url,
          m.created_at,
          p.username,
          p.display_name,
          p.avatar_url
        FROM messages m
        LEFT JOIN profiles p ON m.sender_id = p.id
        WHERE m.conversation_id = ?
        ORDER BY m.created_at DESC
        LIMIT ? OFFSET ?
      `).bind(conversationId, limit, offset).all();

      return new Response(JSON.stringify(messages.results || []), { headers: corsHeaders });
    }

    // Send message
    if (path === 'railway-chat/send' && request.method === 'POST') {
      try {
        const { as_user, conversation_id, content, type = 'text', file_url = null } = await request.json();

        if (!as_user || !conversation_id || !content) {
          return new Response(JSON.stringify({ error: 'as_user, conversation_id, and content are required' }), {
            status: 400,
            headers: corsHeaders
          });
        }

        // Verify user is a participant
        const participant = await env.DB.prepare(`
          SELECT id FROM conversation_participants
          WHERE conversation_id = ? AND user_id = ?
        `).bind(conversation_id, as_user).first();

        if (!participant) {
          return new Response(JSON.stringify({ error: 'User is not a participant of this conversation' }), {
            status: 403,
            headers: corsHeaders
          });
        }

        const messageId = generateUUID();
        const now = new Date().toISOString();

        // Insert message
        await env.DB.prepare(`
          INSERT INTO messages (id, conversation_id, sender_id, content, type, file_url, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(messageId, conversation_id, as_user, content, type, file_url, now).run();

        // Update conversation updated_at
        await env.DB.prepare(`
          UPDATE conversations SET updated_at = ? WHERE id = ?
        `).bind(now, conversation_id).run();

        // Get the created message with sender info
        const message = await env.DB.prepare(`
          SELECT
            m.id,
            m.conversation_id,
            m.sender_id,
            m.content,
            m.type,
            m.file_url,
            m.created_at,
            p.username,
            p.display_name,
            p.avatar_url
          FROM messages m
          LEFT JOIN profiles p ON m.sender_id = p.id
          WHERE m.id = ?
        `).bind(messageId).first();

        return new Response(JSON.stringify(message), { headers: corsHeaders });
      } catch (error) {
        console.error('Error sending message:', error);
        return new Response(JSON.stringify({
          error: 'Failed to send message',
          details: error.message
        }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }

    if (path === 'railway-tournaments/create' && request.method === 'POST') {
      const { as_user, name, description, sport_type, location, start_date, end_date, max_participants, registration_deadline } = await request.json();

      if (!as_user || !name || !sport_type) {
        return new Response(JSON.stringify({ error: 'as_user, name, and sport_type are required' }), {
          status: 400,
          headers: corsHeaders
        });
      }

      const tournamentId = generateUUID();
      const now = new Date().toISOString();

      await env.DB.prepare(`
        INSERT INTO tournaments (
          id, name, description, sport_type, location, start_date, end_date,
          max_participants, registration_deadline, status, created_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'upcoming', ?, ?, ?)
      `).bind(
        tournamentId, name, description, sport_type, location, start_date, end_date,
        max_participants, registration_deadline, as_user, now, now
      ).run();

      const tournament = await env.DB.prepare('SELECT * FROM tournaments WHERE id = ?')
        .bind(tournamentId).first();

      return new Response(JSON.stringify(tournament), { headers: corsHeaders });
    }

    if (path === 'railway-teams/create' && request.method === 'POST') {
      const { as_user, name, description, sport_type } = await request.json();

      if (!as_user || !name) {
        return new Response(JSON.stringify({ error: 'as_user and name are required' }), {
          status: 400,
          headers: corsHeaders
        });
      }

      const teamId = generateUUID();
      const memberId = generateUUID();
      const now = new Date().toISOString();

      try {
        // Create team and add creator as owner
        await env.DB.batch([
          env.DB.prepare(`
            INSERT INTO teams (id, name, description, sport_type, created_by, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).bind(teamId, name, description || null, sport_type || null, as_user, now, now),
          env.DB.prepare(`
            INSERT INTO team_members (id, team_id, user_id, role, joined_at)
            VALUES (?, ?, ?, 'owner', ?)
          `).bind(memberId, teamId, as_user, now)
        ]);

        const team = await env.DB.prepare('SELECT * FROM teams WHERE id = ?')
          .bind(teamId).first();

        return new Response(JSON.stringify(team), { headers: corsHeaders });
      } catch (error) {
        console.error('railway-teams/create error:', error);
        return new Response(JSON.stringify({ error: error.message || 'Failed to create team' }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }

    if (path === 'railway-teams/owner') {
      let asUserId = new URL(request.url).searchParams.get('as_user');

      if (!asUserId) {
        return new Response(JSON.stringify({ error: 'as_user is required' }), {
          status: 400,
          headers: corsHeaders
        });
      }

      // Remove any whitespace characters (including newlines) from as_user
      asUserId = asUserId.trim().replace(/[\r\n\t]/g, '');

      const team = await env.DB.prepare(`
        SELECT t.* FROM teams t
        JOIN team_members tm ON t.id = tm.team_id
        WHERE tm.user_id = ? AND tm.role = 'owner'
        LIMIT 1
      `).bind(asUserId).first();

      return new Response(JSON.stringify(team || null), { headers: corsHeaders });
    }

    if (path === 'railway-teams/members') {
      const teamId = new URL(request.url).searchParams.get('team_id');

      if (!teamId) {
        return new Response(JSON.stringify({ error: 'team_id is required' }), {
          status: 400,
          headers: corsHeaders
        });
      }

      const members = await env.DB.prepare(`
        SELECT tm.*, p.username, p.display_name, p.avatar_url
        FROM team_members tm
        LEFT JOIN profiles p ON tm.user_id = p.id
        WHERE tm.team_id = ?
      `).bind(teamId).all();

      return new Response(JSON.stringify(members.results || []), { headers: corsHeaders });
    }

    if (path === 'railway-teams/update' && request.method === 'PUT') {
      const { as_user, team_id, name, description, sport_type, logo_url } = await request.json();

      if (!as_user || !team_id) {
        return new Response(JSON.stringify({ error: 'as_user and team_id are required' }), {
          status: 400,
          headers: corsHeaders
        });
      }

      const now = new Date().toISOString();

      await env.DB.prepare(`
        UPDATE teams
        SET name = COALESCE(?, name),
            description = COALESCE(?, description),
            sport_type = COALESCE(?, sport_type),
            logo_url = COALESCE(?, logo_url),
            updated_at = ?
        WHERE id = ? AND created_by = ?
      `).bind(name, description, sport_type, logo_url, now, team_id, as_user).run();

      const team = await env.DB.prepare('SELECT * FROM teams WHERE id = ?')
        .bind(team_id).first();

      return new Response(JSON.stringify(team), { headers: corsHeaders });
    }

    if (path === 'railway-teams/stats') {
      const teamId = new URL(request.url).searchParams.get('team_id');

      if (!teamId) {
        return new Response(JSON.stringify({ error: 'team_id is required' }), {
          status: 400,
          headers: corsHeaders
        });
      }

      // Get member count
      const memberCount = await env.DB.prepare(
        'SELECT COUNT(*) as count FROM team_members WHERE team_id = ?'
      ).bind(teamId).first();

      // Get tournament count
      const tournamentCount = await env.DB.prepare(
        'SELECT COUNT(*) as count FROM tournament_participants WHERE team_id = ?'
      ).bind(teamId).first();

      const stats = {
        memberCount: memberCount?.count || 0,
        tournamentCount: tournamentCount?.count || 0
      };

      return new Response(JSON.stringify(stats), { headers: corsHeaders });
    }

    if (path === 'railway-users/profile' && request.method === 'PUT') {
      // Get user_id from token or request body
      let userId = null;
      const authHeader = request.headers.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.slice(7);
        try {
          const tokenData = JSON.parse(atob(token));
          userId = tokenData.id;
        } catch (e) {
          console.error('Token parsing error:', e);
          // Token parsing failed, will try request body
        }
      }

      const body = await request.json();
      console.log('Update profile request body:', JSON.stringify(body, null, 2));

      const { user_id: bodyUserId, username, display_name, bio, sport_type, phone, furigana, avatar_url, age, gender, experience_years, team_name, location, privacy_settings } = body;

      // Use user_id from body if provided, otherwise use token
      userId = bodyUserId || userId;

      console.log('Resolved userId:', userId);

      if (!userId) {
        console.error('Missing user_id - authHeader:', !!authHeader, 'bodyUserId:', bodyUserId);
        return new Response(JSON.stringify({ error: 'user_id is required' }), {
          status: 400,
          headers: corsHeaders
        });
      }

      // Remove any whitespace characters (including newlines) from user_id
      userId = userId.trim().replace(/[\r\n\t]/g, '');

      const now = new Date().toISOString();

      // Build dynamic UPDATE query based on provided fields
      const updates = [];
      const values = [];

      if (username !== undefined) {
        updates.push('username = ?');
        values.push(username);
      }
      if (display_name !== undefined) {
        updates.push('display_name = ?');
        values.push(display_name);
      }
      if (bio !== undefined) {
        updates.push('bio = ?');
        values.push(bio);
      }
      if (sport_type !== undefined) {
        updates.push('sport_type = ?');
        values.push(sport_type);
      }
      if (phone !== undefined) {
        updates.push('phone = ?');
        values.push(phone);
      }
      if (furigana !== undefined) {
        updates.push('furigana = ?');
        values.push(furigana);
      }
      if (avatar_url !== undefined) {
        updates.push('avatar_url = ?');
        values.push(avatar_url);
      }
      if (age !== undefined) {
        updates.push('age = ?');
        values.push(age);
      }
      if (gender !== undefined) {
        updates.push('gender = ?');
        values.push(gender);
      }
      if (experience_years !== undefined) {
        updates.push('experience_years = ?');
        values.push(experience_years);
      }
      if (team_name !== undefined) {
        updates.push('team_name = ?');
        values.push(team_name);
      }
      if (location !== undefined) {
        updates.push('location = ?');
        values.push(location);
      }
      if (privacy_settings !== undefined) {
        updates.push('privacy_settings = ?');
        values.push(typeof privacy_settings === 'string' ? privacy_settings : JSON.stringify(privacy_settings));
      }

      console.log('Updates array:', updates, 'Values:', values);

      if (updates.length === 0) {
        console.error('No fields to update - body keys:', Object.keys(body));
        return new Response(JSON.stringify({
          error: 'No fields to update',
          receivedFields: Object.keys(body)
        }), {
          status: 400,
          headers: corsHeaders
        });
      }

      updates.push('updated_at = ?');
      values.push(now);
      values.push(userId);

      console.log('Executing UPDATE with:', updates.join(', '));

      try {
        await env.DB.prepare(`
          UPDATE profiles
          SET ${updates.join(', ')}
          WHERE id = ?
        `).bind(...values).run();

        const profile = await env.DB.prepare('SELECT * FROM profiles WHERE id = ?')
          .bind(userId).first();

        console.log('Profile updated successfully');
        return new Response(JSON.stringify(profile), { headers: corsHeaders });
      } catch (error) {
        console.error('Database error updating profile:', error);
        return new Response(JSON.stringify({
          error: 'Database error',
          details: error.message
        }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }

    if (path === 'media/upload' && request.method === 'POST') {
      try {
        const formData = await request.formData();
        const file = formData.get('file');

        if (!file) {
          return new Response(JSON.stringify({ error: 'No file provided' }), {
            status: 400,
            headers: corsHeaders
          });
        }

        // Read file as array buffer
        const buffer = await file.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
        const mimeType = file.type || 'application/octet-stream';

        // Create data URL
        const dataUrl = `data:${mimeType};base64,${base64}`;

        // For now, return the data URL
        // In production, you should upload to R2 or another storage service
        return new Response(JSON.stringify({
          url: dataUrl,
          filename: file.name,
          size: buffer.byteLength,
          type: mimeType
        }), { headers: corsHeaders });
      } catch (error) {
        console.error('Media upload error:', error);
        return new Response(JSON.stringify({
          error: 'Failed to upload file',
          details: error.message
        }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }

    if (path === 'users/me' && request.method === 'DELETE') {
      // Get token from Authorization header
      const authHeader = request.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Missing or invalid Authorization header' }), {
          status: 401,
          headers: corsHeaders
        });
      }

      const token = authHeader.slice(7);
      let tokenData;
      try {
        tokenData = JSON.parse(atob(token));
      } catch (e) {
        return new Response(JSON.stringify({ error: 'Invalid token' }), {
          status: 401,
          headers: corsHeaders
        });
      }

      // Check token expiration
      if (tokenData.exp && tokenData.exp < Date.now()) {
        return new Response(JSON.stringify({ error: 'Token expired' }), {
          status: 401,
          headers: corsHeaders
        });
      }

      const userId = tokenData.id;
      if (!userId) {
        return new Response(JSON.stringify({ error: 'Invalid token' }), {
          status: 401,
          headers: corsHeaders
        });
      }

      try {
        // Delete related data in order (due to foreign key constraints)
        // 1. Delete tournament results
        await env.DB.prepare('DELETE FROM tournament_results WHERE user_id = ?').bind(userId).run();

        // 2. Delete posts/diaries
        await env.DB.prepare('DELETE FROM posts WHERE user_id = ?').bind(userId).run();

        // 3. Delete chat messages
        await env.DB.prepare('DELETE FROM messages WHERE sender_id = ? OR recipient_id = ?').bind(userId, userId).run();

        // 4. Delete conversations
        await env.DB.prepare('DELETE FROM conversations WHERE user1_id = ? OR user2_id = ?').bind(userId, userId).run();

        // 5. Delete team memberships
        await env.DB.prepare('DELETE FROM team_members WHERE user_id = ?').bind(userId).run();

        // 6. Delete teams owned by user
        await env.DB.prepare('DELETE FROM teams WHERE owner_id = ?').bind(userId).run();

        // 7. Delete profile
        await env.DB.prepare('DELETE FROM profiles WHERE id = ?').bind(userId).run();

        // 8. Finally, delete user account
        await env.DB.prepare('DELETE FROM users WHERE id = ?').bind(userId).run();

        return new Response(JSON.stringify({
          success: true,
          message: 'Account deleted successfully'
        }), {
          status: 200,
          headers: corsHeaders
        });
      } catch (error) {
        console.error('Account deletion error:', error);
        return new Response(JSON.stringify({
          error: 'Failed to delete account',
          details: error.message
        }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }

    // Block user
    if (path.match(/^users\/([^/]+)\/block$/) && request.method === 'POST') {
      const blockedId = path.match(/^users\/([^/]+)\/block$/)[1];

      // Get token from Authorization header
      const authHeader = request.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Missing or invalid Authorization header' }), {
          status: 401,
          headers: corsHeaders
        });
      }

      const token = authHeader.slice(7);
      let tokenData;
      try {
        tokenData = JSON.parse(atob(token));
      } catch (e) {
        return new Response(JSON.stringify({ error: 'Invalid token' }), {
          status: 401,
          headers: corsHeaders
        });
      }

      const blockerId = tokenData.id;
      if (!blockerId) {
        return new Response(JSON.stringify({ error: 'Invalid token' }), {
          status: 401,
          headers: corsHeaders
        });
      }

      // Cannot block yourself
      if (blockerId === blockedId) {
        return new Response(JSON.stringify({ error: 'Cannot block yourself' }), {
          status: 400,
          headers: corsHeaders
        });
      }

      try {
        const { reason } = await request.json().catch(() => ({}));

        // Check if already blocked
        const existing = await env.DB.prepare(
          'SELECT id FROM blocks WHERE blocker_id = ? AND blocked_id = ?'
        ).bind(blockerId, blockedId).first();

        if (existing) {
          return new Response(JSON.stringify({
            success: true,
            message: 'User already blocked',
            isBlocked: true
          }), {
            headers: corsHeaders
          });
        }

        const blockId = generateUUID();
        const now = new Date().toISOString();

        await env.DB.prepare(`
          INSERT INTO blocks (id, blocker_id, blocked_id, reason, created_at)
          VALUES (?, ?, ?, ?, ?)
        `).bind(blockId, blockerId, blockedId, reason || null, now).run();

        return new Response(JSON.stringify({
          success: true,
          message: 'User blocked successfully',
          isBlocked: true
        }), {
          status: 200,
          headers: corsHeaders
        });
      } catch (error) {
        console.error('Block user error:', error);
        return new Response(JSON.stringify({
          error: 'Failed to block user',
          details: error.message
        }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }

    // Unblock user
    if (path.match(/^users\/([^/]+)\/block$/) && request.method === 'DELETE') {
      const blockedId = path.match(/^users\/([^/]+)\/block$/)[1];

      // Get token from Authorization header
      const authHeader = request.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Missing or invalid Authorization header' }), {
          status: 401,
          headers: corsHeaders
        });
      }

      const token = authHeader.slice(7);
      let tokenData;
      try {
        tokenData = JSON.parse(atob(token));
      } catch (e) {
        return new Response(JSON.stringify({ error: 'Invalid token' }), {
          status: 401,
          headers: corsHeaders
        });
      }

      const blockerId = tokenData.id;
      if (!blockerId) {
        return new Response(JSON.stringify({ error: 'Invalid token' }), {
          status: 401,
          headers: corsHeaders
        });
      }

      try {
        const result = await env.DB.prepare(
          'DELETE FROM blocks WHERE blocker_id = ? AND blocked_id = ?'
        ).bind(blockerId, blockedId).run();

        if (result.meta.changes === 0) {
          return new Response(JSON.stringify({
            success: true,
            message: 'User was not blocked',
            isBlocked: false
          }), {
            headers: corsHeaders
          });
        }

        return new Response(JSON.stringify({
          success: true,
          message: 'User unblocked successfully',
          isBlocked: false
        }), {
          status: 200,
          headers: corsHeaders
        });
      } catch (error) {
        console.error('Unblock user error:', error);
        return new Response(JSON.stringify({
          error: 'Failed to unblock user',
          details: error.message
        }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }

    // Check if user is blocked
    if (path.match(/^users\/([^/]+)\/block\/status$/) && request.method === 'GET') {
      const targetUserId = path.match(/^users\/([^/]+)\/block\/status$/)[1];

      // Get token from Authorization header
      const authHeader = request.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Missing or invalid Authorization header' }), {
          status: 401,
          headers: corsHeaders
        });
      }

      const token = authHeader.slice(7);
      let tokenData;
      try {
        tokenData = JSON.parse(atob(token));
      } catch (e) {
        return new Response(JSON.stringify({ error: 'Invalid token' }), {
          status: 401,
          headers: corsHeaders
        });
      }

      const currentUserId = tokenData.id;
      if (!currentUserId) {
        return new Response(JSON.stringify({ error: 'Invalid token' }), {
          status: 401,
          headers: corsHeaders
        });
      }

      try {
        const block = await env.DB.prepare(
          'SELECT id FROM blocks WHERE blocker_id = ? AND blocked_id = ?'
        ).bind(currentUserId, targetUserId).first();

        return new Response(JSON.stringify({
          isBlocked: !!block
        }), {
          headers: corsHeaders
        });
      } catch (error) {
        console.error('Check block status error:', error);
        return new Response(JSON.stringify({
          error: 'Failed to check block status',
          details: error.message
        }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }

    // Report user or content
    if (path === 'reports' && request.method === 'POST') {
      // Get token from Authorization header
      const authHeader = request.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Missing or invalid Authorization header' }), {
          status: 401,
          headers: corsHeaders
        });
      }

      const token = authHeader.slice(7);
      let tokenData;
      try {
        tokenData = JSON.parse(atob(token));
      } catch (e) {
        return new Response(JSON.stringify({ error: 'Invalid token' }), {
          status: 401,
          headers: corsHeaders
        });
      }

      const reporterId = tokenData.id;
      if (!reporterId) {
        return new Response(JSON.stringify({ error: 'Invalid token' }), {
          status: 401,
          headers: corsHeaders
        });
      }

      try {
        const { reported_type, reported_id, reason, description } = await request.json();

        if (!reported_type || !reported_id || !reason) {
          return new Response(JSON.stringify({
            error: 'Missing required fields: reported_type, reported_id, reason'
          }), {
            status: 400,
            headers: corsHeaders
          });
        }

        const validTypes = ['user', 'post', 'comment', 'team', 'tournament'];
        const validReasons = ['spam', 'harassment', 'inappropriate', 'fake', 'violence', 'hate_speech', 'other'];

        if (!validTypes.includes(reported_type)) {
          return new Response(JSON.stringify({
            error: `Invalid reported_type. Must be one of: ${validTypes.join(', ')}`
          }), {
            status: 400,
            headers: corsHeaders
          });
        }

        if (!validReasons.includes(reason)) {
          return new Response(JSON.stringify({
            error: `Invalid reason. Must be one of: ${validReasons.join(', ')}`
          }), {
            status: 400,
            headers: corsHeaders
          });
        }

        const reportId = generateUUID();
        const now = new Date().toISOString();

        await env.DB.prepare(`
          INSERT INTO reports (id, reporter_id, reported_type, reported_id, reason, description, status, created_at)
          VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)
        `).bind(reportId, reporterId, reported_type, reported_id, reason, description || null, now).run();

        return new Response(JSON.stringify({
          success: true,
          message: 'Report submitted successfully',
          reportId
        }), {
          status: 201,
          headers: corsHeaders
        });
      } catch (error) {
        console.error('Submit report error:', error);
        return new Response(JSON.stringify({
          error: 'Failed to submit report',
          details: error.message
        }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }

    // ===== Notifications API =====

    // Get notifications list
    if (path === 'railway-notifications' && request.method === 'GET') {
      const authHeader = request.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Missing or invalid Authorization header' }), {
          status: 401,
          headers: corsHeaders
        });
      }

      const token = authHeader.slice(7);
      let tokenData;
      try {
        tokenData = JSON.parse(atob(token));
      } catch (e) {
        return new Response(JSON.stringify({ error: 'Invalid token' }), {
          status: 401,
          headers: corsHeaders
        });
      }

      const userId = tokenData.id;
      if (!userId) {
        return new Response(JSON.stringify({ error: 'Invalid token' }), {
          status: 401,
          headers: corsHeaders
        });
      }

      const url = new URL(request.url);
      const limit = parseInt(url.searchParams.get('limit') || '50');
      const offset = parseInt(url.searchParams.get('offset') || '0');

      try {
        const notifications = await env.DB.prepare(`
          SELECT
            n.*,
            p.username as actor_username,
            p.display_name as actor_display_name,
            p.avatar_url as actor_avatar_url
          FROM notifications n
          LEFT JOIN profiles p ON n.actor_id = p.id
          WHERE n.user_id = ?
          ORDER BY n.created_at DESC
          LIMIT ? OFFSET ?
        `).bind(userId, limit, offset).all();

        return new Response(JSON.stringify(notifications.results || []), {
          headers: corsHeaders
        });
      } catch (error) {
        console.error('Get notifications error:', error);
        return new Response(JSON.stringify({
          error: 'Failed to get notifications',
          details: error.message
        }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }

    // Get unread count
    if (path === 'railway-notifications/unread-count' && request.method === 'GET') {
      const authHeader = request.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Missing or invalid Authorization header' }), {
          status: 401,
          headers: corsHeaders
        });
      }

      const token = authHeader.slice(7);
      let tokenData;
      try {
        tokenData = JSON.parse(atob(token));
      } catch (e) {
        return new Response(JSON.stringify({ error: 'Invalid token' }), {
          status: 401,
          headers: corsHeaders
        });
      }

      const userId = tokenData.id;
      if (!userId) {
        return new Response(JSON.stringify({ error: 'Invalid token' }), {
          status: 401,
          headers: corsHeaders
        });
      }

      try {
        const result = await env.DB.prepare(
          'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0'
        ).bind(userId).first();

        return new Response(JSON.stringify({ count: result?.count || 0 }), {
          headers: corsHeaders
        });
      } catch (error) {
        console.error('Get unread count error:', error);
        return new Response(JSON.stringify({
          error: 'Failed to get unread count',
          details: error.message
        }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }

    // Mark notification as read
    if (path.match(/^railway-notifications\/([^/]+)\/read$/) && request.method === 'PUT') {
      const notificationId = path.match(/^railway-notifications\/([^/]+)\/read$/)[1];

      const authHeader = request.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Missing or invalid Authorization header' }), {
          status: 401,
          headers: corsHeaders
        });
      }

      const token = authHeader.slice(7);
      let tokenData;
      try {
        tokenData = JSON.parse(atob(token));
      } catch (e) {
        return new Response(JSON.stringify({ error: 'Invalid token' }), {
          status: 401,
          headers: corsHeaders
        });
      }

      const userId = tokenData.id;
      if (!userId) {
        return new Response(JSON.stringify({ error: 'Invalid token' }), {
          status: 401,
          headers: corsHeaders
        });
      }

      try {
        await env.DB.prepare(
          'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?'
        ).bind(notificationId, userId).run();

        return new Response(JSON.stringify({ success: true }), {
          headers: corsHeaders
        });
      } catch (error) {
        console.error('Mark read error:', error);
        return new Response(JSON.stringify({
          error: 'Failed to mark notification as read',
          details: error.message
        }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }

    // Mark all notifications as read
    if (path === 'railway-notifications/read-all' && request.method === 'PUT') {
      const authHeader = request.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Missing or invalid Authorization header' }), {
          status: 401,
          headers: corsHeaders
        });
      }

      const token = authHeader.slice(7);
      let tokenData;
      try {
        tokenData = JSON.parse(atob(token));
      } catch (e) {
        return new Response(JSON.stringify({ error: 'Invalid token' }), {
          status: 401,
          headers: corsHeaders
        });
      }

      const userId = tokenData.id;
      if (!userId) {
        return new Response(JSON.stringify({ error: 'Invalid token' }), {
          status: 401,
          headers: corsHeaders
        });
      }

      try {
        await env.DB.prepare(
          'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0'
        ).bind(userId).run();

        return new Response(JSON.stringify({ success: true }), {
          headers: corsHeaders
        });
      } catch (error) {
        console.error('Mark all read error:', error);
        return new Response(JSON.stringify({
          error: 'Failed to mark all notifications as read',
          details: error.message
        }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }

    // Delete notification
    if (path.match(/^railway-notifications\/([^/]+)$/) && request.method === 'DELETE') {
      const notificationId = path.match(/^railway-notifications\/([^/]+)$/)[1];

      const authHeader = request.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Missing or invalid Authorization header' }), {
          status: 401,
          headers: corsHeaders
        });
      }

      const token = authHeader.slice(7);
      let tokenData;
      try {
        tokenData = JSON.parse(atob(token));
      } catch (e) {
        return new Response(JSON.stringify({ error: 'Invalid token' }), {
          status: 401,
          headers: corsHeaders
        });
      }

      const userId = tokenData.id;
      if (!userId) {
        return new Response(JSON.stringify({ error: 'Invalid token' }), {
          status: 401,
          headers: corsHeaders
        });
      }

      try {
        await env.DB.prepare(
          'DELETE FROM notifications WHERE id = ? AND user_id = ?'
        ).bind(notificationId, userId).run();

        return new Response(JSON.stringify({ success: true }), {
          headers: corsHeaders
        });
      } catch (error) {
        console.error('Delete notification error:', error);
        return new Response(JSON.stringify({
          error: 'Failed to delete notification',
          details: error.message
        }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }

    // Clear all notifications
    if (path === 'railway-notifications/clear-all' && request.method === 'DELETE') {
      const authHeader = request.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Missing or invalid Authorization header' }), {
          status: 401,
          headers: corsHeaders
        });
      }

      const token = authHeader.slice(7);
      let tokenData;
      try {
        tokenData = JSON.parse(atob(token));
      } catch (e) {
        return new Response(JSON.stringify({ error: 'Invalid token' }), {
          status: 401,
          headers: corsHeaders
        });
      }

      const userId = tokenData.id;
      if (!userId) {
        return new Response(JSON.stringify({ error: 'Invalid token' }), {
          status: 401,
          headers: corsHeaders
        });
      }

      try {
        await env.DB.prepare(
          'DELETE FROM notifications WHERE user_id = ?'
        ).bind(userId).run();

        return new Response(JSON.stringify({ success: true }), {
          headers: corsHeaders
        });
      } catch (error) {
        console.error('Clear all notifications error:', error);
        return new Response(JSON.stringify({
          error: 'Failed to clear all notifications',
          details: error.message
        }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }

    // Device token management
    if (path === 'railway-notifications/device-tokens' && request.method === 'POST') {
      const authHeader = request.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Missing or invalid Authorization header' }), {
          status: 401,
          headers: corsHeaders
        });
      }

      const token = authHeader.slice(7);
      let tokenData;
      try {
        tokenData = JSON.parse(atob(token));
      } catch (e) {
        return new Response(JSON.stringify({ error: 'Invalid token' }), {
          status: 401,
          headers: corsHeaders
        });
      }

      const userId = tokenData.id;
      if (!userId) {
        return new Response(JSON.stringify({ error: 'Invalid token' }), {
          status: 401,
          headers: corsHeaders
        });
      }

      try {
        const { token: deviceToken, platform, device_info } = await request.json();

        if (!deviceToken) {
          return new Response(JSON.stringify({ error: 'Device token is required' }), {
            status: 400,
            headers: corsHeaders
          });
        }

        const tokenId = generateUUID();
        const now = new Date().toISOString();

        // Upsert device token
        await env.DB.prepare(`
          INSERT INTO device_tokens (id, user_id, token, platform, device_info, created_at)
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(token) DO UPDATE SET user_id = ?, platform = ?, device_info = ?
        `).bind(tokenId, userId, deviceToken, platform || null, device_info ? JSON.stringify(device_info) : null, now, userId, platform || null, device_info ? JSON.stringify(device_info) : null).run();

        return new Response(JSON.stringify({ success: true }), {
          headers: corsHeaders
        });
      } catch (error) {
        console.error('Save device token error:', error);
        return new Response(JSON.stringify({
          error: 'Failed to save device token',
          details: error.message
        }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }

    // Delete device token
    if (path === 'railway-notifications/device-tokens' && request.method === 'DELETE') {
      const authHeader = request.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Missing or invalid Authorization header' }), {
          status: 401,
          headers: corsHeaders
        });
      }

      const token = authHeader.slice(7);
      let tokenData;
      try {
        tokenData = JSON.parse(atob(token));
      } catch (e) {
        return new Response(JSON.stringify({ error: 'Invalid token' }), {
          status: 401,
          headers: corsHeaders
        });
      }

      const userId = tokenData.id;
      if (!userId) {
        return new Response(JSON.stringify({ error: 'Invalid token' }), {
          status: 401,
          headers: corsHeaders
        });
      }

      try {
        const { token: deviceToken } = await request.json();

        if (!deviceToken) {
          return new Response(JSON.stringify({ error: 'Device token is required' }), {
            status: 400,
            headers: corsHeaders
          });
        }

        await env.DB.prepare(
          'DELETE FROM device_tokens WHERE token = ? AND user_id = ?'
        ).bind(deviceToken, userId).run();

        return new Response(JSON.stringify({ success: true }), {
          headers: corsHeaders
        });
      } catch (error) {
        console.error('Delete device token error:', error);
        return new Response(JSON.stringify({
          error: 'Failed to delete device token',
          details: error.message
        }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }

    // Get notification settings
    if (path === 'railway-notifications/settings' && request.method === 'GET') {
      const authHeader = request.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Missing or invalid Authorization header' }), {
          status: 401,
          headers: corsHeaders
        });
      }

      const token = authHeader.slice(7);
      let tokenData;
      try {
        tokenData = JSON.parse(atob(token));
      } catch (e) {
        return new Response(JSON.stringify({ error: 'Invalid token' }), {
          status: 401,
          headers: corsHeaders
        });
      }

      const userId = tokenData.id;
      if (!userId) {
        return new Response(JSON.stringify({ error: 'Invalid token' }), {
          status: 401,
          headers: corsHeaders
        });
      }

      try {
        let settings = await env.DB.prepare(
          'SELECT * FROM notification_settings WHERE user_id = ?'
        ).bind(userId).first();

        // Create default settings if none exist
        if (!settings) {
          const settingsId = generateUUID();
          const now = new Date().toISOString();

          await env.DB.prepare(`
            INSERT INTO notification_settings (id, user_id, push_enabled, email_enabled, tournament_updates, team_updates, message_updates, created_at, updated_at)
            VALUES (?, ?, 1, 1, 1, 1, 1, ?, ?)
          `).bind(settingsId, userId, now, now).run();

          settings = await env.DB.prepare(
            'SELECT * FROM notification_settings WHERE user_id = ?'
          ).bind(userId).first();
        }

        return new Response(JSON.stringify(settings), {
          headers: corsHeaders
        });
      } catch (error) {
        console.error('Get notification settings error:', error);
        return new Response(JSON.stringify({
          error: 'Failed to get notification settings',
          details: error.message
        }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }

    // Update notification settings
    if (path === 'railway-notifications/settings' && request.method === 'PUT') {
      const authHeader = request.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Missing or invalid Authorization header' }), {
          status: 401,
          headers: corsHeaders
        });
      }

      const token = authHeader.slice(7);
      let tokenData;
      try {
        tokenData = JSON.parse(atob(token));
      } catch (e) {
        return new Response(JSON.stringify({ error: 'Invalid token' }), {
          status: 401,
          headers: corsHeaders
        });
      }

      const userId = tokenData.id;
      if (!userId) {
        return new Response(JSON.stringify({ error: 'Invalid token' }), {
          status: 401,
          headers: corsHeaders
        });
      }

      try {
        const { push_enabled, email_enabled, tournament_updates, team_updates, message_updates } = await request.json();
        const now = new Date().toISOString();

        const updates = [];
        const values = [];

        if (push_enabled !== undefined) {
          updates.push('push_enabled = ?');
          values.push(push_enabled ? 1 : 0);
        }
        if (email_enabled !== undefined) {
          updates.push('email_enabled = ?');
          values.push(email_enabled ? 1 : 0);
        }
        if (tournament_updates !== undefined) {
          updates.push('tournament_updates = ?');
          values.push(tournament_updates ? 1 : 0);
        }
        if (team_updates !== undefined) {
          updates.push('team_updates = ?');
          values.push(team_updates ? 1 : 0);
        }
        if (message_updates !== undefined) {
          updates.push('message_updates = ?');
          values.push(message_updates ? 1 : 0);
        }

        if (updates.length === 0) {
          return new Response(JSON.stringify({ error: 'No fields to update' }), {
            status: 400,
            headers: corsHeaders
          });
        }

        updates.push('updated_at = ?');
        values.push(now);
        values.push(userId);

        await env.DB.prepare(`
          UPDATE notification_settings
          SET ${updates.join(', ')}
          WHERE user_id = ?
        `).bind(...values).run();

        const settings = await env.DB.prepare(
          'SELECT * FROM notification_settings WHERE user_id = ?'
        ).bind(userId).first();

        return new Response(JSON.stringify(settings), {
          headers: corsHeaders
        });
      } catch (error) {
        console.error('Update notification settings error:', error);
        return new Response(JSON.stringify({
          error: 'Failed to update notification settings',
          details: error.message
        }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }

    // Default: return not found
    return new Response(JSON.stringify({ error: 'Endpoint not found', path }), {
      status: 404,
      headers: corsHeaders
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: corsHeaders
    });
  }
}
