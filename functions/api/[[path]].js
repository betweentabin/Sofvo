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

    if (path === 'railway-users/profile') {
      const userId = new URL(request.url).searchParams.get('user_id');

      if (!userId) {
        return new Response(JSON.stringify({ error: 'user_id is required' }), {
          status: 400,
          headers: corsHeaders
        });
      }

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
      const userId = new URL(request.url).searchParams.get('user_id');

      if (!userId) {
        return new Response(JSON.stringify({ error: 'user_id is required' }), {
          status: 400,
          headers: corsHeaders
        });
      }

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
      const userId = new URL(request.url).searchParams.get('user_id');
      const limit = new URL(request.url).searchParams.get('limit') || 5;

      if (!userId) {
        return new Response(JSON.stringify({ error: 'user_id is required' }), {
          status: 400,
          headers: corsHeaders
        });
      }

      const tournaments = await env.DB.prepare(`
        SELECT
          t.id,
          t.name,
          t.start_date,
          t.end_date,
          t.location,
          t.sport_type,
          tr.rank,
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
      const asUserId = new URL(request.url).searchParams.get('as_user');
      const limit = new URL(request.url).searchParams.get('limit') || 10;

      if (!asUserId) {
        return new Response(JSON.stringify({ error: 'as_user is required' }), {
          status: 400,
          headers: corsHeaders
        });
      }

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

    if (path === 'railway-chat/conversations') {
      const asUserId = new URL(request.url).searchParams.get('as_user');

      if (!asUserId) {
        return new Response(JSON.stringify({ error: 'as_user is required' }), {
          status: 400,
          headers: corsHeaders
        });
      }

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
      const asUserId = new URL(request.url).searchParams.get('as_user');

      if (!asUserId) {
        return new Response(JSON.stringify({ error: 'as_user is required' }), {
          status: 400,
          headers: corsHeaders
        });
      }

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
      const { user_id, username, display_name, bio, sport_type, phone, furigana, avatar_url } = await request.json();

      if (!user_id) {
        return new Response(JSON.stringify({ error: 'user_id is required' }), {
          status: 400,
          headers: corsHeaders
        });
      }

      const now = new Date().toISOString();

      await env.DB.prepare(`
        UPDATE profiles
        SET username = COALESCE(?, username),
            display_name = COALESCE(?, display_name),
            bio = COALESCE(?, bio),
            sport_type = COALESCE(?, sport_type),
            phone = COALESCE(?, phone),
            furigana = COALESCE(?, furigana),
            avatar_url = COALESCE(?, avatar_url),
            updated_at = ?
        WHERE id = ?
      `).bind(username, display_name, bio, sport_type, phone, furigana, avatar_url, now, user_id).run();

      const profile = await env.DB.prepare('SELECT * FROM profiles WHERE id = ?')
        .bind(user_id).first();

      return new Response(JSON.stringify(profile), { headers: corsHeaders });
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
