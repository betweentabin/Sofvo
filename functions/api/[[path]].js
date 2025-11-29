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
      const { email, password, username, display_name, phone, furigana } = await request.json();

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

      // Check if username is already taken
      const existingUsername = await env.DB.prepare('SELECT id FROM profiles WHERE username = ?').bind(username).first();
      if (existingUsername) {
        return new Response(JSON.stringify({
          errors: [{ msg: 'Username already exists', path: 'username' }]
        }), {
          status: 400,
          headers: corsHeaders
        });
      }

      // Generate UUID and hash password
      const userId = generateUUID();
      const hashedPassword = await hashPassword(password);
      const now = new Date().toISOString();

      console.log('Creating user:', { userId, email, username });

      try {
        // Insert user and profile in a batch transaction
        const results = await env.DB.batch([
          env.DB.prepare('INSERT INTO users (id, email, encrypted_password, created_at, updated_at) VALUES (?, ?, ?, ?, ?)')
            .bind(userId, email, hashedPassword, now, now),
          env.DB.prepare('INSERT INTO profiles (id, username, display_name, phone, furigana, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
            .bind(userId, username, display_name || username, phone || null, furigana || null, now, now)
        ]);

        console.log('User and profile created successfully:', results);

        // Verify that the profile was created
        const verifyProfile = await env.DB.prepare('SELECT id, username, display_name FROM profiles WHERE id = ?')
          .bind(userId).first();

        if (!verifyProfile) {
          console.error('Profile verification failed - profile not found');
          throw new Error('Failed to create user profile');
        }

        console.log('Profile verified:', verifyProfile);

        // Generate token
        const token = btoa(JSON.stringify({ id: userId, email, username, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 }));

        return new Response(JSON.stringify({
          success: true,
          user: { 
            id: userId, 
            email, 
            username, 
            display_name: display_name || username,
            phone: phone || null,
            furigana: furigana || null
          },
          token
        }), { headers: corsHeaders });

      } catch (error) {
        console.error('Error creating user:', error);
        console.error('Error details:', error.message, error.stack);
        
        // Clean up if user was created but profile failed
        try {
          await env.DB.prepare('DELETE FROM users WHERE id = ?').bind(userId).run();
          console.log('Cleaned up user record after error');
        } catch (cleanupError) {
          console.error('Failed to clean up user record:', cleanupError);
        }

        return new Response(JSON.stringify({
          errors: [{ 
            msg: 'Failed to create account. Please try again.', 
            path: 'submit',
            details: error.message 
          }]
        }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }

    if (path === 'railway-auth/login' && request.method === 'POST') {
      const { email, password } = await request.json();

      console.log('Login attempt for:', email);

      const user = await env.DB.prepare(
        'SELECT u.*, p.username, p.display_name, p.phone, p.furigana FROM users u LEFT JOIN profiles p ON u.id = p.id WHERE u.email = ?'
      ).bind(email).first();

      if (!user) {
        console.log('User not found:', email);
        return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
          status: 401,
          headers: corsHeaders
        });
      }

      // Verify password
      const hashedInput = await hashPassword(password);
      if (hashedInput !== user.encrypted_password) {
        console.log('Invalid password for:', email);
        return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
          status: 401,
          headers: corsHeaders
        });
      }

      console.log('Login successful for:', email);

      // Simple token (in production, use proper JWT)
      const token = btoa(JSON.stringify({ id: user.id, email: user.email, username: user.username, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 }));

      return new Response(JSON.stringify({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          display_name: user.display_name,
          phone: user.phone || null,
          furigana: user.furigana || null
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
        'SELECT u.*, p.username, p.display_name, p.avatar_url, p.bio, p.phone, p.furigana FROM users u LEFT JOIN profiles p ON u.id = p.id WHERE u.id = ?'
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
          bio: user.bio,
          phone: user.phone || null,
          furigana: user.furigana || null
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

    // Get recommended users
    if (path === 'railway-users/recommended') {
      const limit = new URL(request.url).searchParams.get('limit') || 20;
      let asUser = new URL(request.url).searchParams.get('as_user');

      // Remove whitespace from as_user
      if (asUser) {
        asUser = asUser.trim().replace(/[\r\n\t]/g, '');
      }

      // Get recommended users: users not followed by current user, ordered by followers count
      let query;
      if (asUser) {
        query = `
          SELECT p.id, p.username, p.display_name, p.avatar_url, p.followers_count
          FROM profiles p
          WHERE p.id != ?
          AND p.id NOT IN (
            SELECT following_id FROM follows WHERE follower_id = ?
          )
          ORDER BY p.followers_count DESC, p.created_at DESC
          LIMIT ?
        `;
        const results = await env.DB.prepare(query).bind(asUser, asUser, limit).all();
        return new Response(JSON.stringify(results.results || []), { headers: corsHeaders });
      } else {
        // No user logged in, just show popular users
        query = `
          SELECT id, username, display_name, avatar_url, followers_count
          FROM profiles
          ORDER BY followers_count DESC, created_at DESC
          LIMIT ?
        `;
        const results = await env.DB.prepare(query).bind(limit).all();
        return new Response(JSON.stringify(results.results || []), { headers: corsHeaders });
      }
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

    // Get followers list
    if (path === 'railway-users/followers' && request.method === 'GET') {
      const userId = new URL(request.url).searchParams.get('user_id');
      const limit = new URL(request.url).searchParams.get('limit') || 50;

      if (!userId) {
        return new Response(JSON.stringify({ error: 'user_id is required' }), {
          status: 400,
          headers: corsHeaders
        });
      }

      const followers = await env.DB.prepare(`
        SELECT
          p.id,
          p.username,
          p.display_name,
          p.avatar_url,
          p.bio,
          p.location,
          p.followers_count,
          p.following_count
        FROM follows f
        JOIN profiles p ON f.follower_id = p.id
        WHERE f.following_id = ?
        ORDER BY f.created_at DESC
        LIMIT ?
      `).bind(userId, limit).all();

      return new Response(JSON.stringify(followers.results || []), { headers: corsHeaders });
    }

    // Get following list
    if (path === 'railway-users/following' && request.method === 'GET') {
      const userId = new URL(request.url).searchParams.get('user_id');
      const limit = new URL(request.url).searchParams.get('limit') || 50;

      if (!userId) {
        return new Response(JSON.stringify({ error: 'user_id is required' }), {
          status: 400,
          headers: corsHeaders
        });
      }

      const following = await env.DB.prepare(`
        SELECT
          p.id,
          p.username,
          p.display_name,
          p.avatar_url,
          p.bio,
          p.location,
          p.followers_count,
          p.following_count
        FROM follows f
        JOIN profiles p ON f.following_id = p.id
        WHERE f.follower_id = ?
        ORDER BY f.created_at DESC
        LIMIT ?
      `).bind(userId, limit).all();

      return new Response(JSON.stringify(following.results || []), { headers: corsHeaders });
    }

    if (path === 'railway-users/profile' && request.method === 'GET') {
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

      // Parse privacy_settings if it's a string
      if (profile.privacy_settings && typeof profile.privacy_settings === 'string') {
        try {
          profile.privacy_settings = JSON.parse(profile.privacy_settings);
        } catch (e) {
          // If parsing fails, set default privacy settings
          profile.privacy_settings = {
            username: "public",
            age: "public",
            gender: "public",
            experience: "public",
            team: "public",
            location: "public"
          };
        }
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

      // Get tournaments user has participated in (from tournament_participants)
      const tournaments = await env.DB.prepare(`
        SELECT
          tp.id as participant_id,
          tp.tournament_id,
          tp.mode,
          tp.registered_at,
          t.id,
          t.name,
          t.start_date,
          t.end_date,
          t.location,
          t.sport_type,
          t.status,
          tr.position,
          tr.points
        FROM tournament_participants tp
        JOIN tournaments t ON tp.tournament_id = t.id
        LEFT JOIN tournament_results tr ON tr.tournament_id = t.id AND tr.user_id = tp.user_id
        WHERE tp.user_id = ? AND tp.status = 'registered'
        ORDER BY t.start_date DESC
        LIMIT ?
      `).bind(userId, limit).all();

      // Transform data to match frontend expectations
      const formattedTournaments = (tournaments.results || []).map(item => ({
        tournament_id: item.tournament_id,
        mode: item.mode,
        registered_at: item.registered_at,
        tournaments: {
          id: item.id,
          name: item.name,
          start_date: item.start_date,
          end_date: item.end_date,
          location: item.location,
          sport_type: item.sport_type,
          status: item.status
        },
        tournament_results: item.position ? [{
          position: item.position,
          points: item.points || 0
        }] : []
      }));

      return new Response(JSON.stringify(formattedTournaments), { headers: corsHeaders });
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

      // Parse image_urls and structure profile data
      const postsWithImages = (posts.results || []).map(post => {
        if (post.image_urls && typeof post.image_urls === 'string') {
          try {
            post.image_urls = JSON.parse(post.image_urls);
          } catch (e) {
            post.image_urls = [];
          }
        }
        // Structure profile data for PostCard component
        post.profiles = {
          id: post.user_id,
          username: post.username,
          display_name: post.display_name,
          avatar_url: post.avatar_url
        };
        return post;
      });

      return new Response(JSON.stringify(postsWithImages), { headers: corsHeaders });
    }

    // Get posts by user ID
    if (path === 'railway-posts/by-user') {
      const userId = new URL(request.url).searchParams.get('user_id');
      const limit = new URL(request.url).searchParams.get('limit') || 10;

      if (!userId) {
        return new Response(JSON.stringify({ error: 'user_id is required' }), {
          status: 400,
          headers: corsHeaders
        });
      }

      const posts = await env.DB.prepare(`
        SELECT
          p.*,
          pr.username,
          pr.display_name,
          pr.avatar_url
        FROM posts p
        LEFT JOIN profiles pr ON p.user_id = pr.id
        WHERE p.user_id = ?
        ORDER BY p.created_at DESC
        LIMIT ?
      `).bind(userId, limit).all();

      // Parse image_urls and structure profile data
      const postsWithImages = (posts.results || []).map(post => {
        if (post.image_urls && typeof post.image_urls === 'string') {
          try {
            post.image_urls = JSON.parse(post.image_urls);
          } catch (e) {
            post.image_urls = [];
          }
        }
        // Structure profile data for PostCard component
        post.profiles = {
          id: post.user_id,
          username: post.username,
          display_name: post.display_name,
          avatar_url: post.avatar_url
        };
        return post;
      });

      return new Response(JSON.stringify(postsWithImages), { headers: corsHeaders });
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

        // Convert image_urls array to JSON string
        const imageUrlsJson = Array.isArray(image_urls) ? JSON.stringify(image_urls) : null;

        await env.DB.prepare(`
          INSERT INTO posts (id, user_id, content, visibility, file_url, image_urls, like_count, comment_count, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, 0, 0, ?, ?)
        `).bind(postId, as_user, content, visibility, file_url, imageUrlsJson, now, now).run();

        const post = await env.DB.prepare(`
          SELECT p.*, pr.username, pr.display_name, pr.avatar_url
          FROM posts p
          LEFT JOIN profiles pr ON p.user_id = pr.id
          WHERE p.id = ?
        `).bind(postId).first();

        // Parse image_urls from JSON string to array and structure profile data
        if (post && post.image_urls && typeof post.image_urls === 'string') {
          try {
            post.image_urls = JSON.parse(post.image_urls);
          } catch (e) {
            post.image_urls = [];
          }
        }

        // Structure profile data for PostCard component
        if (post) {
          post.profiles = {
            id: post.user_id,
            username: post.username,
            display_name: post.display_name,
            avatar_url: post.avatar_url
          };
        }

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

    // Post like/unlike (POST/DELETE /railway-posts/:id/like)
    if (path.match(/^railway-posts\/([^/]+)\/like$/) && (request.method === 'POST' || request.method === 'DELETE')) {
      const parts = path.split('/');
      const postId = parts[1];

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
        const tokenData = JSON.parse(atob(token));
        userId = tokenData.id;
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

      if (request.method === 'POST') {
        const existing = await env.DB.prepare(
          'SELECT * FROM post_likes WHERE post_id = ? AND user_id = ?'
        ).bind(postId, userId).first();

        if (existing) {
          return new Response(JSON.stringify({ error: 'Already liked' }), {
            status: 400,
            headers: corsHeaders
          });
        }

        const likeId = generateUUID();
        await env.DB.prepare(`
          INSERT INTO post_likes (id, post_id, user_id, created_at)
          VALUES (?, ?, ?, datetime('now'))
        `).bind(likeId, postId, userId).run();

        await env.DB.prepare(`
          UPDATE posts SET like_count = like_count + 1 WHERE id = ?
        `).bind(postId).run();

        return new Response(JSON.stringify({ success: true, message: 'Liked' }), {
          headers: corsHeaders
        });
      } else {
        const result = await env.DB.prepare(
          'DELETE FROM post_likes WHERE post_id = ? AND user_id = ?'
        ).bind(postId, userId).run();

        if (result.meta.changes > 0) {
          await env.DB.prepare(`
            UPDATE posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = ?
          `).bind(postId).run();

          return new Response(JSON.stringify({ success: true, message: 'Unliked' }), {
            headers: corsHeaders
          });
        }

        return new Response(JSON.stringify({ error: 'Not liked' }), {
          status: 404,
          headers: corsHeaders
        });
      }
    }

    // Get post comments (GET /railway-posts/:id/comments)
    if (path.match(/^railway-posts\/([^/]+)\/comments$/) && request.method === 'GET') {
      const parts = path.split('/');
      const postId = parts[1];

      const comments = await env.DB.prepare(`
        SELECT
          c.*,
          p.username,
          p.display_name,
          p.avatar_url
        FROM comments c
        LEFT JOIN profiles p ON c.user_id = p.id
        WHERE c.post_id = ?
        ORDER BY c.created_at ASC
      `).bind(postId).all();

      return new Response(JSON.stringify(comments.results || []), { headers: corsHeaders });
    }

    // Create post comment (POST /railway-posts/:id/comments)
    if (path.match(/^railway-posts\/([^/]+)\/comments$/) && request.method === 'POST') {
      const parts = path.split('/');
      const postId = parts[1];

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
        const tokenData = JSON.parse(atob(token));
        userId = tokenData.id;
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

      try {
        const { content } = await request.json();

        if (!content) {
          return new Response(JSON.stringify({ error: 'Content is required' }), {
            status: 400,
            headers: corsHeaders
          });
        }

        const commentId = generateUUID();
        const now = new Date().toISOString();

        await env.DB.prepare(`
          INSERT INTO comments (id, post_id, user_id, content, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(commentId, postId, userId, content, now, now).run();

        // Update comment count
        await env.DB.prepare(`
          UPDATE posts SET comment_count = comment_count + 1 WHERE id = ?
        `).bind(postId).run();

        const comment = await env.DB.prepare(`
          SELECT
            c.*,
            p.username,
            p.display_name,
            p.avatar_url
          FROM comments c
          LEFT JOIN profiles p ON c.user_id = p.id
          WHERE c.id = ?
        `).bind(commentId).first();

        return new Response(JSON.stringify(comment), { headers: corsHeaders });
      } catch (error) {
        return new Response(JSON.stringify({
          error: 'Failed to create comment',
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

      // Parse image_urls from JSON string to array and structure profile data
      const postsWithImages = (posts.results || []).map(post => {
        if (post.image_urls && typeof post.image_urls === 'string') {
          try {
            post.image_urls = JSON.parse(post.image_urls);
          } catch (e) {
            post.image_urls = [];
          }
        }
        // Structure profile data for PostCard component
        post.profiles = {
          id: post.user_id,
          username: post.username,
          display_name: post.display_name,
          avatar_url: post.avatar_url
        };
        return post;
      });

      return new Response(JSON.stringify(postsWithImages), { headers: corsHeaders });
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
      const sport_type = url.searchParams.get('sport_type') || url.searchParams.get('type');
      const location = url.searchParams.get('location') || url.searchParams.get('area');
      const status = url.searchParams.get('status');
      const start_date = url.searchParams.get('start_date');
      const end_date = url.searchParams.get('end_date');
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

      // Date range filter (year-month filter from frontend)
      if (start_date && end_date) {
        query += ' AND start_date >= ? AND start_date <= ?';
        bindings.push(start_date, end_date);
      } else if (start_date) {
        query += ' AND start_date >= ?';
        bindings.push(start_date);
      } else if (end_date) {
        query += ' AND start_date <= ?';
        bindings.push(end_date);
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

      query += ' ORDER BY start_date ASC LIMIT ?';
      bindings.push(limit);

      const stmt = env.DB.prepare(query);
      const tournaments = await stmt.bind(...bindings).all();

      return new Response(JSON.stringify(tournaments.results || []), { headers: corsHeaders });
    }

    // Tournament apply endpoint
    if (path.match(/^railway-tournaments\/([^/]+)\/apply$/) && request.method === 'POST') {
      const parts = path.split('/');
      const tournamentId = parts[1];

      console.log('=== Tournament Apply Request ===');
      console.log('Tournament ID:', tournamentId);

      // Get mode and team_id from request body first
      const body = await request.json();
      const mode = body.mode || 'individual';
      const teamId = body.team_id || null;
      
      console.log('Request body:', { mode, teamId, user_id: body.user_id });

      // Get user ID from JWT or request body (flexible authentication)
      let userId;
      const authHeader = request.headers.get('Authorization');
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        // Try JWT authentication first
        const token = authHeader.substring(7);
        try {
          const tokenData = JSON.parse(atob(token));
          userId = tokenData.id;
          
          // Check token expiration
          if (tokenData.exp && tokenData.exp < Date.now()) {
            console.log('Token expired');
            return new Response(JSON.stringify({ error: 'Token expired' }), {
              status: 401,
              headers: corsHeaders
            });
          }
          
          console.log('User ID from JWT:', userId);
        } catch (e) {
          console.error('JWT parsing error:', e);
          // Fall through to body.user_id
        }
      }
      
      // Fallback to user_id from request body
      if (!userId && body.user_id) {
        userId = body.user_id;
        console.log('User ID from request body:', userId);
      }
      
      // If still no userId, return error
      if (!userId) {
        console.error('No user ID provided');
        return new Response(JSON.stringify({ 
          error: 'Unauthorized',
          message: 'Please provide Authorization header or user_id in request body'
        }), {
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

      // Check if already applied with the same mode
      let existing;
      if (mode === 'team' && teamId) {
        existing = await env.DB.prepare(
          'SELECT * FROM tournament_participants WHERE tournament_id = ? AND team_id = ? AND mode = ?'
        ).bind(tournamentId, teamId, mode).first();
      } else {
        existing = await env.DB.prepare(
          'SELECT * FROM tournament_participants WHERE tournament_id = ? AND user_id = ? AND mode = ?'
        ).bind(tournamentId, userId, mode).first();
      }

      if (existing) {
        return new Response(JSON.stringify({ error: `Already applied to this tournament as ${mode}` }), {
          status: 400,
          headers: corsHeaders
        });
      }

      // Note: Team member overlap check removed
      // Allows same user to be member of multiple teams that participate in the same tournament
      // This is common in real-world scenarios (e.g., different age groups, mixed teams, etc.)
      // Only the team-level duplicate check (above) prevents the same team from registering twice

      // Check capacity limit
      if (tournament.max_participants && tournament.max_participants > 0) {
        const currentCount = await env.DB.prepare(
          `SELECT COUNT(*) as count FROM tournament_participants
           WHERE tournament_id = ? AND mode = ? AND status = 'registered'`
        ).bind(tournamentId, mode).first();

        const count = currentCount?.count || 0;

        if (count >= tournament.max_participants) {
          return new Response(JSON.stringify({
            error: mode === 'team'
              ? 'この大会のチーム枠は定員に達しています'
              : 'この大会の個人枠は定員に達しています'
          }), {
            status: 400,
            headers: corsHeaders
          });
        }
      }

      // Create participant entry
      const participantId = generateUUID();
      await env.DB.prepare(`
        INSERT INTO tournament_participants (id, tournament_id, user_id, team_id, mode, status, registered_at)
        VALUES (?, ?, ?, ?, ?, 'registered', datetime('now'))
      `).bind(participantId, tournamentId, userId, teamId, mode).run();

      // Check if capacity has been reached and auto-generate matches
      let matchesGenerated = false;
      if (tournament.max_participants && tournament.max_participants > 0) {
        const updatedCount = await env.DB.prepare(
          `SELECT COUNT(*) as count FROM tournament_participants
           WHERE tournament_id = ? AND status = 'registered'`
        ).bind(tournamentId).first();

        const totalCount = updatedCount?.count || 0;

        // If capacity reached, auto-generate matches
        if (totalCount >= tournament.max_participants) {
          // Check if matches already exist
          const existingMatches = await env.DB.prepare(
            'SELECT COUNT(*) as count FROM tournament_matches WHERE tournament_id = ?'
          ).bind(tournamentId).first();

          if (!existingMatches || existingMatches.count === 0) {
            // Get all participants
            const participants = await env.DB.prepare(`
              SELECT * FROM tournament_participants
              WHERE tournament_id = ? AND status = 'registered'
              ORDER BY registered_at ASC
            `).bind(tournamentId).all();

            const participantsList = participants.results || [];

            // Filter only team participants
            const teamParticipants = participantsList.filter(p => p.mode === 'team' && p.team_id);

            if (teamParticipants.length >= 2) {
              // Shuffle participants for random matchups
              const shuffledParticipants = [...teamParticipants];
              for (let i = shuffledParticipants.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffledParticipants[i], shuffledParticipants[j]] = [shuffledParticipants[j], shuffledParticipants[i]];
              }

              // Generate round-robin matches (team only)
              let matchNumber = 1;
              const phase = 'qualifier';

              for (let i = 0; i < shuffledParticipants.length; i++) {
                for (let j = i + 1; j < shuffledParticipants.length; j++) {
                  const participant1 = shuffledParticipants[i];
                  const participant2 = shuffledParticipants[j];

                  const matchId = generateUUID();
                  await env.DB.prepare(`
                    INSERT INTO tournament_matches
                    (id, tournament_id, match_number, round, phase, team1_id, team2_id, player1_id, player2_id, score1, score2, status, scheduled_time, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
                  `).bind(
                    matchId,
                    tournamentId,
                    matchNumber,
                    1, // round
                    phase,
                    participant1.team_id,
                    participant2.team_id,
                    null, // player1_id
                    null, // player2_id
                    null, // score1
                    null, // score2
                    'scheduled', // status
                    null // scheduled_time
                  ).run();

                  matchNumber++;
                }
              }

              matchesGenerated = true;

              // Send notifications to all participants about match schedule (1 day before)
              if (tournament.start_date) {
                const tournamentStartDate = new Date(tournament.start_date);
                const oneDayBefore = new Date(tournamentStartDate);
                oneDayBefore.setDate(oneDayBefore.getDate() - 1);

                const allParticipants = await env.DB.prepare(`
                  SELECT DISTINCT tp.user_id
                  FROM tournament_participants tp
                  WHERE tp.tournament_id = ? AND tp.status = 'registered'
                `).bind(tournamentId).all();

                const matchNotificationTitle = '明日の大会について';
                const matchNotificationContent = `「${tournament.name}」が明日開催されます。\n\n対戦表:\n試合数: ${matchNumber - 1}試合\n\n開催情報:\n開催日: ${tournament.start_date}\n場所: ${tournament.location || '未定'}`;

                const matchNotificationData = JSON.stringify({
                  tournament_id: tournamentId,
                  tournament_name: tournament.name,
                  phase: 'qualifier',
                  match_count: matchNumber - 1,
                  start_date: tournament.start_date,
                  location: tournament.location,
                  notification_date: oneDayBefore.toISOString()
                });

                for (const participant of (allParticipants.results || [])) {
                  const notificationId = generateUUID();
                  await env.DB.prepare(`
                    INSERT INTO notifications (id, user_id, type, title, content, data, read, created_at)
                    VALUES (?, ?, 'match_schedule', ?, ?, ?, 0, ?)
                  `).bind(
                    notificationId,
                    participant.user_id,
                    matchNotificationTitle,
                    matchNotificationContent,
                    matchNotificationData,
                    oneDayBefore.toISOString()
                  ).run();
                }
              }
            }
          }
        }
      }

      // Create notification for tournament start (1 day before) - only if matches not generated yet
      // If matches were generated, notification with match schedule was already created above
      if (tournament.start_date && !matchesGenerated) {
        const tournamentStartDate = new Date(tournament.start_date);
        const oneDayBefore = new Date(tournamentStartDate);
        oneDayBefore.setDate(oneDayBefore.getDate() - 1);

        // Check if matches already exist
        const existingMatches = await env.DB.prepare(
          'SELECT COUNT(*) as count FROM tournament_matches WHERE tournament_id = ?'
        ).bind(tournamentId).first();

        const matchCount = existingMatches?.count || 0;

        const notificationTitle = '明日の大会について';
        let notificationContent = `「${tournament.name}」が明日開催されます。\n\n`;

        if (matchCount > 0) {
          notificationContent += `対戦表:\n試合数: ${matchCount}試合\n\n`;
        }

        notificationContent += `開催情報:\n開催日: ${tournament.start_date}\n場所: ${tournament.location || '未定'}`;

        const notificationData = JSON.stringify({
          tournament_id: tournamentId,
          tournament_name: tournament.name,
          start_date: tournament.start_date,
          location: tournament.location,
          mode: mode,
          team_id: teamId,
          match_count: matchCount,
          notification_date: oneDayBefore.toISOString()
        });

        // Create notification for the user who registered
        const notificationId = generateUUID();
        await env.DB.prepare(`
          INSERT INTO notifications (id, user_id, type, title, content, data, read, created_at)
          VALUES (?, ?, 'match_schedule', ?, ?, ?, 0, ?)
        `).bind(
          notificationId,
          userId,
          notificationTitle,
          notificationContent,
          notificationData,
          oneDayBefore.toISOString()
        ).run();

        // If team mode, create notifications for all team members
        if (mode === 'team' && teamId) {
          const teamMembers = await env.DB.prepare(
            'SELECT user_id FROM team_members WHERE team_id = ? AND user_id != ?'
          ).bind(teamId, userId).all();

          if (teamMembers.results && teamMembers.results.length > 0) {
            for (const member of teamMembers.results) {
              const memberNotificationId = generateUUID();
              await env.DB.prepare(`
                INSERT INTO notifications (id, user_id, type, title, content, data, read, created_at)
                VALUES (?, ?, 'match_schedule', ?, ?, ?, 0, ?)
              `).bind(
                memberNotificationId,
                member.user_id,
                notificationTitle,
                notificationContent,
                notificationData,
                oneDayBefore.toISOString()
              ).run();
            }
          }
        }
      }

      return new Response(JSON.stringify({
        success: true,
        message: matchesGenerated
          ? 'Successfully applied to tournament. Matches have been auto-generated as capacity was reached.'
          : 'Successfully applied to tournament',
        participant: {
          id: participantId,
          tournament_id: tournamentId,
          user_id: userId,
          team_id: teamId,
          mode: mode,
          status: 'registered'
        },
        matches_generated: matchesGenerated
      }), { headers: corsHeaders });
    }

    // Tournament withdraw endpoint (DELETE /railway-tournaments/:id/apply)
    if (path.match(/^railway-tournaments\/([^/]+)\/apply$/) && request.method === 'DELETE') {
      const parts = path.split('/');
      const tournamentId = parts[1];

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
        const tokenData = JSON.parse(atob(token));
        userId = tokenData.id;
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

      // Get mode and team_id from request body
      const body = await request.json().catch(() => ({}));
      const mode = body.mode || 'individual';
      const teamId = body.team_id || null;

      // Find and delete participant entry
      let participant;
      if (mode === 'team' && teamId) {
        participant = await env.DB.prepare(
          'SELECT * FROM tournament_participants WHERE tournament_id = ? AND team_id = ? AND mode = ?'
        ).bind(tournamentId, teamId, mode).first();

        if (!participant) {
          return new Response(JSON.stringify({ error: 'Team not participating in this tournament' }), {
            status: 404,
            headers: corsHeaders
          });
        }

        await env.DB.prepare(
          'DELETE FROM tournament_participants WHERE tournament_id = ? AND team_id = ? AND mode = ?'
        ).bind(tournamentId, teamId, mode).run();
      } else {
        participant = await env.DB.prepare(
          'SELECT * FROM tournament_participants WHERE tournament_id = ? AND user_id = ? AND mode = ?'
        ).bind(tournamentId, userId, mode).first();

        if (!participant) {
          return new Response(JSON.stringify({ error: 'Not participating in this tournament' }), {
            status: 404,
            headers: corsHeaders
          });
        }

        await env.DB.prepare(
          'DELETE FROM tournament_participants WHERE tournament_id = ? AND user_id = ? AND mode = ?'
        ).bind(tournamentId, userId, mode).run();
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'Successfully withdrew from tournament'
      }), { headers: corsHeaders });
    }

    // Check tournament participation status (GET /railway-tournaments/:id/is-participating)
    if (path.match(/^railway-tournaments\/([^/]+)\/is-participating$/) && request.method === 'GET') {
      const parts = path.split('/');
      const tournamentId = parts[1];

      const url = new URL(request.url);
      const mode = url.searchParams.get('mode') || 'individual';
      const teamId = url.searchParams.get('team_id');

      const authHeader = request.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ participating: false }), {
          headers: corsHeaders
        });
      }

      const token = authHeader.substring(7);
      let userId;
      try {
        const tokenData = JSON.parse(atob(token));
        userId = tokenData.id;
        if (!userId) {
          return new Response(JSON.stringify({ participating: false }), {
            headers: corsHeaders
          });
        }
      } catch (e) {
        return new Response(JSON.stringify({ participating: false }), {
          headers: corsHeaders
        });
      }

      let participant;
      if (mode === 'team' && teamId) {
        participant = await env.DB.prepare(
          'SELECT status FROM tournament_participants WHERE tournament_id = ? AND team_id = ? AND mode = ?'
        ).bind(tournamentId, teamId, mode).first();
      } else {
        participant = await env.DB.prepare(
          'SELECT status FROM tournament_participants WHERE tournament_id = ? AND user_id = ? AND mode = ?'
        ).bind(tournamentId, userId, mode).first();
      }

      return new Response(JSON.stringify({
        participating: !!participant,
        status: participant?.status || null
      }), { headers: corsHeaders });
    }

    // Get tournament participants (GET /railway-tournaments/:id/participants)
    if (path.match(/^railway-tournaments\/([^/]+)\/participants$/) && request.method === 'GET') {
      const parts = path.split('/');
      const tournamentId = parts[1];

      const participants = await env.DB.prepare(`
        SELECT
          tp.*,
          p.username,
          p.display_name,
          p.avatar_url,
          p.sport_type
        FROM tournament_participants tp
        LEFT JOIN profiles p ON tp.user_id = p.id
        WHERE tp.tournament_id = ?
        ORDER BY tp.registered_at DESC
      `).bind(tournamentId).all();

      return new Response(JSON.stringify(participants.results || []), { headers: corsHeaders });
    }

    // Tournament like/unlike (POST/DELETE /railway-tournaments/:id/like)
    if (path.match(/^railway-tournaments\/([^/]+)\/like$/) && (request.method === 'POST' || request.method === 'DELETE')) {
      const parts = path.split('/');
      const tournamentId = parts[1];

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
        const tokenData = JSON.parse(atob(token));
        userId = tokenData.id;
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

      if (request.method === 'POST') {
        const existing = await env.DB.prepare(
          'SELECT * FROM tournament_likes WHERE tournament_id = ? AND user_id = ?'
        ).bind(tournamentId, userId).first();

        if (existing) {
          return new Response(JSON.stringify({ error: 'Already liked' }), {
            status: 400,
            headers: corsHeaders
          });
        }

        const likeId = generateUUID();
        await env.DB.prepare(`
          INSERT INTO tournament_likes (id, tournament_id, user_id, created_at)
          VALUES (?, ?, ?, datetime('now'))
        `).bind(likeId, tournamentId, userId).run();

        await env.DB.prepare(`
          UPDATE tournaments SET like_count = like_count + 1 WHERE id = ?
        `).bind(tournamentId).run();

        return new Response(JSON.stringify({ success: true, message: 'Liked' }), {
          headers: corsHeaders
        });
      } else {
        const result = await env.DB.prepare(
          'DELETE FROM tournament_likes WHERE tournament_id = ? AND user_id = ?'
        ).bind(tournamentId, userId).run();

        if (result.meta.changes > 0) {
          await env.DB.prepare(`
            UPDATE tournaments SET like_count = GREATEST(like_count - 1, 0) WHERE id = ?
          `).bind(tournamentId).run();

          return new Response(JSON.stringify({ success: true, message: 'Unliked' }), {
            headers: corsHeaders
          });
        }

        return new Response(JSON.stringify({ error: 'Not liked' }), {
          status: 404,
          headers: corsHeaders
        });
      }
    }

    // Generate round-robin matches (POST /railway-tournaments/:id/generate-matches)
    if (path.match(/^railway-tournaments\/([^/]+)\/generate-matches$/) && request.method === 'POST') {
      const parts = path.split('/');
      const tournamentId = parts[1];

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
        const tokenData = JSON.parse(atob(token));
        userId = tokenData.id;
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

      // Check if user is tournament organizer
      const tournament = await env.DB.prepare(
        'SELECT * FROM tournaments WHERE id = ? AND organizer_id = ?'
      ).bind(tournamentId, userId).first();

      if (!tournament) {
        return new Response(JSON.stringify({ error: 'Only tournament organizer can generate matches' }), {
          status: 403,
          headers: corsHeaders
        });
      }

      // Get request body to check phase
      const body = await request.json().catch(() => ({}));
      const phase = body.phase || 'qualifier'; // 'qualifier' or 'tournament'

      // Get all participants
      const participants = await env.DB.prepare(`
        SELECT * FROM tournament_participants
        WHERE tournament_id = ? AND status = 'registered'
        ORDER BY registered_at ASC
      `).bind(tournamentId).all();

      const participantsList = participants.results || [];

      if (participantsList.length < 2) {
        return new Response(JSON.stringify({ error: 'At least 2 participants required' }), {
          status: 400,
          headers: corsHeaders
        });
      }

      // Check if matches already exist for this phase
      const existingMatches = await env.DB.prepare(
        'SELECT COUNT(*) as count FROM tournament_matches WHERE tournament_id = ? AND phase = ?'
      ).bind(tournamentId, phase).first();

      if (existingMatches && existingMatches.count > 0) {
        return new Response(JSON.stringify({ error: `Matches already generated for ${phase} phase` }), {
          status: 400,
          headers: corsHeaders
        });
      }

      // Filter only team participants (no individual participants)
      const teamParticipants = participantsList.filter(p => p.mode === 'team' && p.team_id);

      if (teamParticipants.length < 2) {
        return new Response(JSON.stringify({ error: 'At least 2 teams required' }), {
          status: 400,
          headers: corsHeaders
        });
      }

      // Shuffle participants for random matchups
      const shuffledParticipants = [...teamParticipants];
      for (let i = shuffledParticipants.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledParticipants[i], shuffledParticipants[j]] = [shuffledParticipants[j], shuffledParticipants[i]];
      }

      // Generate round-robin matches (team only)
      const matches = [];
      let matchNumber = 1;

      for (let i = 0; i < shuffledParticipants.length; i++) {
        for (let j = i + 1; j < shuffledParticipants.length; j++) {
          const participant1 = shuffledParticipants[i];
          const participant2 = shuffledParticipants[j];

          const matchId = generateUUID();
          const match = {
            id: matchId,
            tournament_id: tournamentId,
            match_number: matchNumber,
            round: 1,
            phase: phase,
            team1_id: participant1.team_id,
            team2_id: participant2.team_id,
            player1_id: null,
            player2_id: null,
            score1: null,
            score2: null,
            status: 'scheduled',
            scheduled_time: null
          };

          matches.push(match);
          matchNumber++;

          // Insert match into database
          await env.DB.prepare(`
            INSERT INTO tournament_matches
            (id, tournament_id, match_number, round, phase, team1_id, team2_id, player1_id, player2_id, score1, score2, status, scheduled_time, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
          `).bind(
            match.id,
            match.tournament_id,
            match.match_number,
            match.round,
            match.phase,
            match.team1_id,
            match.team2_id,
            null, // player1_id
            null, // player2_id
            match.score1,
            match.score2,
            match.status,
            match.scheduled_time
          ).run();
        }
      }

      // Send notifications to all participants about match schedule (1 day before tournament)
      if (matches.length > 0) {
        // Get tournament info
        const tournamentInfo = await env.DB.prepare(
          'SELECT * FROM tournaments WHERE id = ?'
        ).bind(tournamentId).first();

        // Only schedule notification if tournament has a start date
        if (tournamentInfo.start_date) {
          const tournamentStartDate = new Date(tournamentInfo.start_date);
          const oneDayBefore = new Date(tournamentStartDate);
          oneDayBefore.setDate(oneDayBefore.getDate() - 1);

          // Get all participants
          const allParticipants = await env.DB.prepare(`
            SELECT DISTINCT tp.user_id, tp.team_id
            FROM tournament_participants tp
            WHERE tp.tournament_id = ? AND tp.status = 'registered'
          `).bind(tournamentId).all();

          const notificationTitle = '明日の大会について';
          const notificationContent = `「${tournamentInfo.name}」が明日開催されます。\n\n対戦表:\n試合数: ${matches.length}試合\n\n開催情報:\n開催日: ${tournamentInfo.start_date}\n場所: ${tournamentInfo.location || '未定'}`;

          const notificationData = JSON.stringify({
            tournament_id: tournamentId,
            tournament_name: tournamentInfo.name,
            phase: phase,
            match_count: matches.length,
            start_date: tournamentInfo.start_date,
            location: tournamentInfo.location,
            notification_date: oneDayBefore.toISOString()
          });

          // Create notifications for all participants (scheduled for 1 day before)
          for (const participant of (allParticipants.results || [])) {
            const notificationId = generateUUID();
            await env.DB.prepare(`
              INSERT INTO notifications (id, user_id, type, title, content, data, read, created_at)
              VALUES (?, ?, 'match_schedule', ?, ?, ?, 0, ?)
            `).bind(
              notificationId,
              participant.user_id,
              notificationTitle,
              notificationContent,
              notificationData,
              oneDayBefore.toISOString()
            ).run();
          }
        }
      }

      return new Response(JSON.stringify({
        success: true,
        message: `${phase === 'qualifier' ? 'Qualifier' : 'Tournament'} matches generated successfully`,
        count: matches.length,
        matches: matches,
        phase: phase
      }), { headers: corsHeaders });
    }

    // Get tournament matches (GET /railway-tournaments/:id/matches)
    if (path.match(/^railway-tournaments\/([^/]+)\/matches$/) && request.method === 'GET') {
      const parts = path.split('/');
      const tournamentId = parts[1];
      const url = new URL(request.url);
      const phase = url.searchParams.get('phase'); // Optional phase filter

      let query = `
        SELECT
          tm.*,
          t1.name as team1_name,
          t2.name as team2_name,
          p1.username as player1_username,
          p1.display_name as player1_display_name,
          p2.username as player2_username,
          p2.display_name as player2_display_name
        FROM tournament_matches tm
        LEFT JOIN teams t1 ON tm.team1_id = t1.id
        LEFT JOIN teams t2 ON tm.team2_id = t2.id
        LEFT JOIN profiles p1 ON tm.player1_id = p1.id
        LEFT JOIN profiles p2 ON tm.player2_id = p2.id
        WHERE tm.tournament_id = ?
      `;

      const bindings = [tournamentId];

      if (phase) {
        query += ' AND tm.phase = ?';
        bindings.push(phase);
      }

      query += ' ORDER BY tm.match_number ASC';

      const matches = await env.DB.prepare(query).bind(...bindings).all();

      return new Response(JSON.stringify(matches.results || []), { headers: corsHeaders });
    }

    // Update match result (PUT /railway-tournaments/:tournamentId/matches/:matchId)
    if (path.match(/^railway-tournaments\/([^/]+)\/matches\/([^/]+)$/) && request.method === 'PUT') {
      const parts = path.split('/');
      const tournamentId = parts[1];
      const matchId = parts[3];

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
        const tokenData = JSON.parse(atob(token));
        userId = tokenData.id;
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

      const body = await request.json();
      const { score1, score2, status } = body;

      // Get match details
      const match = await env.DB.prepare(
        'SELECT * FROM tournament_matches WHERE id = ? AND tournament_id = ?'
      ).bind(matchId, tournamentId).first();

      if (!match) {
        return new Response(JSON.stringify({ error: 'Match not found' }), {
          status: 404,
          headers: corsHeaders
        });
      }

      // Check if user is tournament organizer OR a participant in this match
      const tournament = await env.DB.prepare(
        'SELECT * FROM tournaments WHERE id = ?'
      ).bind(tournamentId).first();

      let isAuthorized = false;

      // Check if organizer
      if (tournament.organizer_id === userId) {
        isAuthorized = true;
      } else {
        // Check if participant in the match
        if (match.team1_id || match.team2_id) {
          // Team match - check if user is member of either team
          const teamMembership = await env.DB.prepare(`
            SELECT * FROM team_members
            WHERE user_id = ? AND (team_id = ? OR team_id = ?)
          `).bind(userId, match.team1_id, match.team2_id).first();

          if (teamMembership) {
            isAuthorized = true;
          }
        } else {
          // Individual match - check if user is one of the players
          if (match.player1_id === userId || match.player2_id === userId) {
            isAuthorized = true;
          }
        }
      }

      if (!isAuthorized) {
        return new Response(JSON.stringify({ error: 'Not authorized to update this match' }), {
          status: 403,
          headers: corsHeaders
        });
      }

      // Update match
      await env.DB.prepare(`
        UPDATE tournament_matches
        SET score1 = ?, score2 = ?, status = ?, updated_at = datetime('now')
        WHERE id = ?
      `).bind(score1, score2, status || 'completed', matchId).run();

      const updatedMatch = await env.DB.prepare(
        'SELECT * FROM tournament_matches WHERE id = ?'
      ).bind(matchId).first();

      return new Response(JSON.stringify(updatedMatch), { headers: corsHeaders });
    }

    // Get qualifier standings (GET /railway-tournaments/:id/qualifier-standings)
    if (path.match(/^railway-tournaments\/([^/]+)\/qualifier-standings$/) && request.method === 'GET') {
      const parts = path.split('/');
      const tournamentId = parts[1];

      // Get all qualifier matches
      const matches = await env.DB.prepare(`
        SELECT * FROM tournament_matches
        WHERE tournament_id = ? AND phase = 'qualifier' AND status = 'completed'
      `).bind(tournamentId).all();

      // Get all participants
      const participants = await env.DB.prepare(`
        SELECT * FROM tournament_participants
        WHERE tournament_id = ? AND status = 'registered'
      `).bind(tournamentId).all();

      // Calculate standings
      const standings = {};

      participants.results?.forEach(p => {
        const key = p.mode === 'team' ? `team_${p.team_id}` : `player_${p.user_id}`;
        standings[key] = {
          participant_id: p.id,
          mode: p.mode,
          team_id: p.team_id,
          user_id: p.user_id,
          wins: 0,
          losses: 0,
          draws: 0,
          points: 0,
          goals_for: 0,
          goals_against: 0,
          goal_difference: 0
        };
      });

      // Process matches
      matches.results?.forEach(m => {
        const team1Key = m.team1_id ? `team_${m.team1_id}` : `player_${m.player1_id}`;
        const team2Key = m.team2_id ? `team_${m.team2_id}` : `player_${m.player2_id}`;

        if (standings[team1Key] && standings[team2Key]) {
          const score1 = m.score1 || 0;
          const score2 = m.score2 || 0;

          standings[team1Key].goals_for += score1;
          standings[team1Key].goals_against += score2;
          standings[team2Key].goals_for += score2;
          standings[team2Key].goals_against += score1;

          if (score1 > score2) {
            standings[team1Key].wins += 1;
            standings[team1Key].points += 3;
            standings[team2Key].losses += 1;
          } else if (score2 > score1) {
            standings[team2Key].wins += 1;
            standings[team2Key].points += 3;
            standings[team1Key].losses += 1;
          } else {
            standings[team1Key].draws += 1;
            standings[team1Key].points += 1;
            standings[team2Key].draws += 1;
            standings[team2Key].points += 1;
          }
        }
      });

      // Calculate goal difference and sort
      const standingsArray = Object.values(standings).map(s => ({
        ...s,
        goal_difference: s.goals_for - s.goals_against
      })).sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goal_difference !== a.goal_difference) return b.goal_difference - a.goal_difference;
        return b.goals_for - a.goals_for;
      });

      return new Response(JSON.stringify(standingsArray), { headers: corsHeaders });
    }

    // Generate tournament bracket (POST /railway-tournaments/:id/generate-bracket)
    if (path.match(/^railway-tournaments\/([^/]+)\/generate-bracket$/) && request.method === 'POST') {
      const parts = path.split('/');
      const tournamentId = parts[1];

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
        const tokenData = JSON.parse(atob(token));
        userId = tokenData.id;
      } catch (e) {
        return new Response(JSON.stringify({ error: 'Invalid token' }), {
          status: 401,
          headers: corsHeaders
        });
      }

      // Check if user is tournament organizer
      const tournament = await env.DB.prepare(
        'SELECT * FROM tournaments WHERE id = ? AND organizer_id = ?'
      ).bind(tournamentId, userId).first();

      if (!tournament) {
        return new Response(JSON.stringify({ error: 'Only tournament organizer can generate bracket' }), {
          status: 403,
          headers: corsHeaders
        });
      }

      // Get request body for seeding configuration
      const body = await request.json().catch(() => ({}));
      const { advancing_teams = 8, seeding = [] } = body;

      // If no custom seeding provided, use qualifier standings
      let seeds = seeding;
      if (!seeds || seeds.length === 0) {
        // Get qualifier standings directly from database
        const matches = await env.DB.prepare(`
          SELECT * FROM tournament_matches
          WHERE tournament_id = ? AND phase = 'qualifier' AND status = 'completed'
        `).bind(tournamentId).all();

        const participants = await env.DB.prepare(`
          SELECT * FROM tournament_participants
          WHERE tournament_id = ? AND status = 'registered'
        `).bind(tournamentId).all();

        // Calculate standings
        const standings = {};
        participants.results?.forEach(p => {
          const key = p.mode === 'team' ? `team_${p.team_id}` : `player_${p.user_id}`;
          standings[key] = {
            participant_id: p.id,
            mode: p.mode,
            team_id: p.team_id,
            user_id: p.user_id,
            wins: 0,
            points: 0,
            goals_for: 0,
            goals_against: 0
          };
        });

        // Process matches
        matches.results?.forEach(m => {
          const team1Key = m.team1_id ? `team_${m.team1_id}` : `player_${m.player1_id}`;
          const team2Key = m.team2_id ? `team_${m.team2_id}` : `player_${m.player2_id}`;

          if (standings[team1Key] && standings[team2Key]) {
            const score1 = m.score1 || 0;
            const score2 = m.score2 || 0;

            standings[team1Key].goals_for += score1;
            standings[team1Key].goals_against += score2;
            standings[team2Key].goals_for += score2;
            standings[team2Key].goals_against += score1;

            if (score1 > score2) {
              standings[team1Key].wins += 1;
              standings[team1Key].points += 3;
            } else if (score2 > score1) {
              standings[team2Key].wins += 1;
              standings[team2Key].points += 3;
            } else {
              standings[team1Key].points += 1;
              standings[team2Key].points += 1;
            }
          }
        });

        // Sort and create seeds
        const standingsArray = Object.values(standings)
          .map(s => ({
            ...s,
            goal_difference: s.goals_for - s.goals_against
          }))
          .sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (b.goal_difference !== a.goal_difference) return b.goal_difference - a.goal_difference;
            return b.goals_for - a.goals_for;
          });

        seeds = standingsArray.slice(0, advancing_teams).map((s, idx) => ({
          seed: idx + 1,
          participant_id: s.participant_id,
          team_id: s.team_id,
          user_id: s.user_id
        }));
      }

      // Calculate tournament rounds
      const numTeams = seeds.length;
      const rounds = Math.ceil(Math.log2(numTeams));

      // Generate bracket matches
      const matches = [];
      let matchNumber = 1;

      // First round pairings (1 vs 8, 2 vs 7, 3 vs 6, 4 vs 5 for 8 teams)
      for (let i = 0; i < numTeams / 2; i++) {
        const seed1 = seeds[i];
        const seed2 = seeds[numTeams - 1 - i];

        const matchId = generateUUID();
        const match = {
          id: matchId,
          tournament_id: tournamentId,
          match_number: matchNumber,
          round: 1,
          phase: 'tournament',
          team1_id: seed1.team_id || null,
          team2_id: seed2.team_id || null,
          player1_id: seed1.user_id || null,
          player2_id: seed2.user_id || null,
          score1: null,
          score2: null,
          status: 'scheduled',
          scheduled_time: null
        };

        matches.push(match);

        await env.DB.prepare(`
          INSERT INTO tournament_matches
          (id, tournament_id, match_number, round, phase, team1_id, team2_id, player1_id, player2_id, score1, score2, status, scheduled_time, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `).bind(
          match.id,
          match.tournament_id,
          match.match_number,
          match.round,
          match.phase,
          match.team1_id,
          match.team2_id,
          match.player1_id,
          match.player2_id,
          match.score1,
          match.score2,
          match.status,
          match.scheduled_time
        ).run();

        matchNumber++;
      }

      // Create placeholder matches for subsequent rounds
      for (let round = 2; round <= rounds; round++) {
        const matchesInRound = Math.pow(2, rounds - round);
        for (let i = 0; i < matchesInRound; i++) {
          const matchId = generateUUID();
          const match = {
            id: matchId,
            tournament_id: tournamentId,
            match_number: matchNumber,
            round: round,
            phase: 'tournament',
            team1_id: null,
            team2_id: null,
            player1_id: null,
            player2_id: null,
            score1: null,
            score2: null,
            status: 'pending',
            scheduled_time: null
          };

          matches.push(match);

          await env.DB.prepare(`
            INSERT INTO tournament_matches
            (id, tournament_id, match_number, round, phase, team1_id, team2_id, player1_id, player2_id, score1, score2, status, scheduled_time, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
          `).bind(
            match.id,
            match.tournament_id,
            match.match_number,
            match.round,
            match.phase,
            match.team1_id,
            match.team2_id,
            match.player1_id,
            match.player2_id,
            match.score1,
            match.score2,
            match.status,
            match.scheduled_time
          ).run();

          matchNumber++;
        }
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'Tournament bracket generated successfully',
        rounds: rounds,
        total_matches: matches.length,
        matches: matches
      }), { headers: corsHeaders });
    }

    // Update bracket seeding (PUT /railway-tournaments/:id/update-bracket-seeding)
    if (path.match(/^railway-tournaments\/([^/]+)\/update-bracket-seeding$/) && request.method === 'PUT') {
      const parts = path.split('/');
      const tournamentId = parts[1];

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
        const tokenData = JSON.parse(atob(token));
        userId = tokenData.id;
      } catch (e) {
        return new Response(JSON.stringify({ error: 'Invalid token' }), {
          status: 401,
          headers: corsHeaders
        });
      }

      // Check if user is tournament organizer
      const tournament = await env.DB.prepare(
        'SELECT * FROM tournaments WHERE id = ? AND organizer_id = ?'
      ).bind(tournamentId, userId).first();

      if (!tournament) {
        return new Response(JSON.stringify({ error: 'Only tournament organizer can update bracket seeding' }), {
          status: 403,
          headers: corsHeaders
        });
      }

      // Get request body with match updates
      const body = await request.json();
      const { match_updates = [] } = body;

      // Update each match
      for (const update of match_updates) {
        const { match_id, team1_id, team2_id, player1_id, player2_id } = update;

        await env.DB.prepare(`
          UPDATE tournament_matches
          SET team1_id = ?, team2_id = ?, player1_id = ?, player2_id = ?, updated_at = datetime('now')
          WHERE id = ? AND tournament_id = ? AND phase = 'tournament' AND status = 'scheduled'
        `).bind(
          team1_id || null,
          team2_id || null,
          player1_id || null,
          player2_id || null,
          match_id,
          tournamentId
        ).run();
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'Bracket seeding updated successfully',
        updated_count: match_updates.length
      }), { headers: corsHeaders });
    }

    if (path.startsWith('railway-tournaments/') && path !== 'railway-tournaments/search' && path !== 'railway-tournaments/create' && path !== 'railway-tournaments/my-hosted' && path !== 'railway-tournaments/my-participating' && request.method === 'GET') {
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

      // Count current participants by mode
      const teamCount = await env.DB.prepare(
        `SELECT COUNT(*) as count FROM tournament_participants
         WHERE tournament_id = ? AND mode = 'team' AND status = 'registered'`
      ).bind(tournamentId).first();

      const individualCount = await env.DB.prepare(
        `SELECT COUNT(*) as count FROM tournament_participants
         WHERE tournament_id = ? AND mode = 'individual' AND status = 'registered'`
      ).bind(tournamentId).first();

      // Calculate remaining slots
      const maxParticipants = tournament.max_participants || 0;
      const currentTeam = teamCount?.count || 0;
      const currentIndividual = individualCount?.count || 0;

      // Add remaining slots to tournament data
      const tournamentWithSlots = {
        ...tournament,
        remaining_team: maxParticipants > 0 ? Math.max(0, maxParticipants - currentTeam) : null,
        remaining_individual: maxParticipants > 0 ? Math.max(0, maxParticipants - currentIndividual) : null,
        current_team_count: currentTeam,
        current_individual_count: currentIndividual
      };

      return new Response(JSON.stringify(tournamentWithSlots), { headers: corsHeaders });
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

        // For direct messages, check follow relationship and block status
        if (type === 'direct' && participant_ids.length === 1) {
          const targetUserId = participant_ids[0];

          // Check if either user has blocked the other
          const blockCheck = await env.DB.prepare(`
            SELECT id FROM blocks
            WHERE (blocker_id = ? AND blocked_id = ?)
               OR (blocker_id = ? AND blocked_id = ?)
          `).bind(as_user, targetUserId, targetUserId, as_user).first();

          if (blockCheck) {
            return new Response(JSON.stringify({
              error: 'メッセージを送信できません。',
              code: 'BLOCKED'
            }), {
              status: 403,
              headers: corsHeaders
            });
          }

          // Check if users follow each other (mutual follow required)
          const followCheck = await env.DB.prepare(`
            SELECT
              (SELECT id FROM follows WHERE follower_id = ? AND following_id = ?) as user_follows_target,
              (SELECT id FROM follows WHERE follower_id = ? AND following_id = ?) as target_follows_user
          `).bind(as_user, targetUserId, targetUserId, as_user).first();

          const isMutualFollow = followCheck.user_follows_target && followCheck.target_follows_user;

          if (!isMutualFollow) {
            return new Response(JSON.stringify({
              error: 'メッセージを送信するには、お互いにフォローしている必要があります。',
              code: 'NOT_MUTUAL_FOLLOW'
            }), {
              status: 403,
              headers: corsHeaders
            });
          }
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

        // Get other participants in the conversation to check for blocks
        const otherParticipants = await env.DB.prepare(`
          SELECT user_id FROM conversation_participants
          WHERE conversation_id = ? AND user_id != ?
        `).bind(conversation_id, as_user).all();

        // Check if any participant has blocked the sender or vice versa
        for (const otherUser of otherParticipants.results || []) {
          const blockCheck = await env.DB.prepare(`
            SELECT id FROM blocks
            WHERE (blocker_id = ? AND blocked_id = ?)
               OR (blocker_id = ? AND blocked_id = ?)
          `).bind(as_user, otherUser.user_id, otherUser.user_id, as_user).first();

          if (blockCheck) {
            return new Response(JSON.stringify({
              error: 'メッセージを送信できません。',
              code: 'BLOCKED'
            }), {
              status: 403,
              headers: corsHeaders
            });
          }
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
      console.log('=== Tournament Create Request ===');

      try {
        const body = await request.json();
        console.log('Request body:', JSON.stringify(body, null, 2));

        const { as_user, name, description, sport_type, location, start_date, end_date, max_participants, registration_deadline } = body;

        if (!as_user || !name || !sport_type) {
          console.error('Missing required fields:', { as_user: !!as_user, name: !!name, sport_type: !!sport_type });
          return new Response(JSON.stringify({ error: 'as_user, name, and sport_type are required' }), {
            status: 400,
            headers: corsHeaders
          });
        }

        const tournamentId = generateUUID();
        const now = new Date().toISOString();

        console.log('Creating tournament with ID:', tournamentId);

        // Convert undefined to null for optional fields
        const safeDescription = description || null;
        const safeLocation = location || null;
        const safeStartDate = start_date || null;
        const safeEndDate = end_date || null;
        const safeMaxParticipants = max_participants || null;
        const safeRegistrationDeadline = registration_deadline || null;

        await env.DB.prepare(`
          INSERT INTO tournaments (
            id, name, description, sport_type, location, start_date, end_date,
            max_participants, registration_deadline, status, created_by, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'upcoming', ?, ?, ?)
        `).bind(
          tournamentId, name, safeDescription, sport_type, safeLocation, safeStartDate, safeEndDate,
          safeMaxParticipants, safeRegistrationDeadline, as_user, now, now
        ).run();

        const tournament = await env.DB.prepare('SELECT * FROM tournaments WHERE id = ?')
          .bind(tournamentId).first();

        console.log('Tournament created successfully:', tournamentId);

        return new Response(JSON.stringify(tournament), { headers: corsHeaders });
      } catch (error) {
        console.error('Tournament creation error:', error);
        console.error('Error stack:', error.stack);
        return new Response(JSON.stringify({
          error: 'Failed to create tournament',
          details: error.message
        }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }

    // Auto-generate matches for tournaments past registration deadline (Batch job endpoint)
    if (path === 'railway-tournaments/auto-generate-matches' && request.method === 'POST') {
      try {
        // Get current date/time
        const now = new Date().toISOString();

        // Find tournaments that:
        // 1. Have passed registration deadline
        // 2. Have at least 2 participants
        // 3. Don't have matches generated yet
        // 4. Have max_participants = 0 or NULL (no capacity limit that would trigger auto-generation)
        const eligibleTournaments = await env.DB.prepare(`
          SELECT DISTINCT t.*
          FROM tournaments t
          WHERE t.registration_deadline IS NOT NULL
            AND t.registration_deadline < ?
            AND t.status = 'upcoming'
            AND t.id NOT IN (
              SELECT DISTINCT tournament_id FROM tournament_matches
            )
            AND (t.max_participants IS NULL OR t.max_participants = 0)
            AND (
              SELECT COUNT(*) FROM tournament_participants tp
              WHERE tp.tournament_id = t.id AND tp.status = 'registered'
            ) >= 2
        `).bind(now).all();

        const results = [];

        for (const tournament of (eligibleTournaments.results || [])) {
          // Get all participants for this tournament
          const participants = await env.DB.prepare(`
            SELECT * FROM tournament_participants
            WHERE tournament_id = ? AND status = 'registered'
            ORDER BY registered_at ASC
          `).bind(tournament.id).all();

          const participantsList = participants.results || [];

          // Filter only team participants
          const teamParticipants = participantsList.filter(p => p.mode === 'team' && p.team_id);

          if (teamParticipants.length >= 2) {
            // Shuffle participants for random matchups
            const shuffledParticipants = [...teamParticipants];
            for (let i = shuffledParticipants.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [shuffledParticipants[i], shuffledParticipants[j]] = [shuffledParticipants[j], shuffledParticipants[i]];
            }

            // Generate round-robin matches (team only)
            let matchNumber = 1;
            const phase = 'qualifier';
            let matchesCreated = 0;

            for (let i = 0; i < shuffledParticipants.length; i++) {
              for (let j = i + 1; j < shuffledParticipants.length; j++) {
                const participant1 = shuffledParticipants[i];
                const participant2 = shuffledParticipants[j];

                const matchId = generateUUID();
                await env.DB.prepare(`
                  INSERT INTO tournament_matches
                  (id, tournament_id, match_number, round, phase, team1_id, team2_id, player1_id, player2_id, score1, score2, status, scheduled_time, created_at, updated_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
                `).bind(
                  matchId,
                  tournament.id,
                  matchNumber,
                  1, // round
                  phase,
                  participant1.team_id,
                  participant2.team_id,
                  null, // player1_id
                  null, // player2_id
                  null, // score1
                  null, // score2
                  'scheduled', // status
                  null // scheduled_time
                ).run();

                matchNumber++;
                matchesCreated++;
              }
            }

            // Send notifications to all participants about match schedule (1 day before)
            if (tournament.start_date) {
              const tournamentStartDate = new Date(tournament.start_date);
              const oneDayBefore = new Date(tournamentStartDate);
              oneDayBefore.setDate(oneDayBefore.getDate() - 1);

              const allParticipants = await env.DB.prepare(`
                SELECT DISTINCT tp.user_id
                FROM tournament_participants tp
                WHERE tp.tournament_id = ? AND tp.status = 'registered'
              `).bind(tournament.id).all();

              const matchNotificationTitle = '明日の大会について';
              const matchNotificationContent = `「${tournament.name}」が明日開催されます。\n\n対戦表:\n試合数: ${matchesCreated}試合\n\n開催情報:\n開催日: ${tournament.start_date}\n場所: ${tournament.location || '未定'}`;

              const matchNotificationData = JSON.stringify({
                tournament_id: tournament.id,
                tournament_name: tournament.name,
                phase: 'qualifier',
                match_count: matchesCreated,
                start_date: tournament.start_date,
                location: tournament.location,
                notification_date: oneDayBefore.toISOString()
              });

              for (const participant of (allParticipants.results || [])) {
                const notificationId = generateUUID();
                await env.DB.prepare(`
                  INSERT INTO notifications (id, user_id, type, title, content, data, read, created_at)
                  VALUES (?, ?, 'match_schedule', ?, ?, ?, 0, ?)
                `).bind(
                  notificationId,
                  participant.user_id,
                  matchNotificationTitle,
                  matchNotificationContent,
                  matchNotificationData,
                  oneDayBefore.toISOString()
                ).run();
              }
            }

            results.push({
              tournament_id: tournament.id,
              tournament_name: tournament.name,
              participants: teamParticipants.length,
              matches_created: matchesCreated
            });
          }
        }

        return new Response(JSON.stringify({
          success: true,
          processed: results.length,
          tournaments: results
        }), { headers: corsHeaders });
      } catch (error) {
        console.error('Auto-generate matches error:', error);
        return new Response(JSON.stringify({
          error: 'Failed to auto-generate matches',
          details: error.message
        }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }

    // Get user's hosted tournaments
    if (path === 'railway-tournaments/my-hosted' && request.method === 'GET') {
      const url = new URL(request.url);
      const asUser = url.searchParams.get('as_user');

      if (!asUser) {
        return new Response(JSON.stringify({ error: 'as_user is required' }), {
          status: 400,
          headers: corsHeaders
        });
      }

      try {
        const tournaments = await env.DB.prepare(`
          SELECT
            t.*,
            COUNT(DISTINCT tp.id) as participant_count
          FROM tournaments t
          LEFT JOIN tournament_participants tp ON t.id = tp.tournament_id
          WHERE t.created_by = ?
          GROUP BY t.id
          ORDER BY t.created_at DESC
        `).bind(asUser).all();

        return new Response(JSON.stringify(tournaments.results || []), { headers: corsHeaders });
      } catch (error) {
        console.error('Get hosted tournaments error:', error);
        return new Response(JSON.stringify({
          error: 'Failed to get hosted tournaments',
          details: error.message
        }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }

    // Get user's participating tournaments
    if (path === 'railway-tournaments/my-participating' && request.method === 'GET') {
      const url = new URL(request.url);
      const asUser = url.searchParams.get('as_user');

      if (!asUser) {
        return new Response(JSON.stringify({ error: 'as_user is required' }), {
          status: 400,
          headers: corsHeaders
        });
      }

      try {
        const tournaments = await env.DB.prepare(`
          SELECT
            t.*,
            tp.status as participation_status,
            tp.registered_at as joined_at
          FROM tournaments t
          INNER JOIN tournament_participants tp ON t.id = tp.tournament_id
          WHERE tp.user_id = ?
          ORDER BY t.start_date ASC
        `).bind(asUser).all();

        return new Response(JSON.stringify(tournaments.results || []), { headers: corsHeaders });
      } catch (error) {
        console.error('Get participating tournaments error:', error);
        return new Response(JSON.stringify({
          error: 'Failed to get participating tournaments',
          details: error.message
        }), {
          status: 500,
          headers: corsHeaders
        });
      }
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

    // Get recommended teams
    if (path === 'railway-teams/recommended') {
      const limit = new URL(request.url).searchParams.get('limit') || 10;

      // Get teams ordered by creation date (newest first)
      const teams = await env.DB.prepare(`
        SELECT
          t.id,
          t.name,
          t.description,
          t.sport_type,
          t.logo_url,
          t.created_at,
          COUNT(tm.id) as member_count
        FROM teams t
        LEFT JOIN team_members tm ON t.id = tm.team_id
        GROUP BY t.id
        ORDER BY t.created_at DESC
        LIMIT ?
      `).bind(limit).all();

      return new Response(JSON.stringify(teams.results || []), { headers: corsHeaders });
    }

    if (path === 'railway-teams/owner') {
      console.log('=== Get Owner Team Request ===');
      let asUserId = new URL(request.url).searchParams.get('as_user');

      if (!asUserId) {
        console.error('as_user is missing');
        return new Response(JSON.stringify({ error: 'as_user is required' }), {
          status: 400,
          headers: corsHeaders
        });
      }

      // Remove any whitespace characters (including newlines) from as_user
      asUserId = asUserId.trim().replace(/[\r\n\t]/g, '');
      console.log('Looking for owner team for user:', asUserId);

      const team = await env.DB.prepare(`
        SELECT t.* FROM teams t
        JOIN team_members tm ON t.id = tm.team_id
        WHERE tm.user_id = ? AND tm.role = 'owner'
        LIMIT 1
      `).bind(asUserId).first();

      console.log('Found owner team:', team ? team.id : 'None');

      return new Response(JSON.stringify(team || null), { headers: corsHeaders });
    }

    // Get user's teams (teams where user is a member)
    if (path === 'railway-teams/my-teams') {
      const userId = new URL(request.url).searchParams.get('user_id');

      if (!userId) {
        return new Response(JSON.stringify({ error: 'user_id is required' }), {
          status: 400,
          headers: corsHeaders
        });
      }

      try {
        const teams = await env.DB.prepare(`
          SELECT
            t.*,
            tm.role as user_role,
            tm.joined_at as user_joined_at,
            COUNT(DISTINCT tm2.id) as member_count
          FROM team_members tm
          JOIN teams t ON tm.team_id = t.id
          LEFT JOIN team_members tm2 ON t.id = tm2.team_id
          WHERE tm.user_id = ?
          GROUP BY t.id, tm.role, tm.joined_at
          ORDER BY tm.joined_at DESC
        `).bind(userId).all();

        return new Response(JSON.stringify(teams.results || []), { headers: corsHeaders });
      } catch (error) {
        console.error('Get user teams error:', error);
        return new Response(JSON.stringify({
          error: 'Failed to get user teams',
          details: error.message
        }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }

    if (path === 'railway-teams/members') {
      console.log('=== Get Team Members Request ===');
      const teamId = new URL(request.url).searchParams.get('team_id');

      if (!teamId) {
        console.error('team_id is missing');
        return new Response(JSON.stringify({ error: 'team_id is required' }), {
          status: 400,
          headers: corsHeaders
        });
      }

      console.log('Getting members for team:', teamId);

      const members = await env.DB.prepare(`
        SELECT
          tm.*,
          p.username,
          p.display_name,
          p.avatar_url,
          p.age,
          p.gender,
          p.experience_years,
          p.location
        FROM team_members tm
        LEFT JOIN profiles p ON tm.user_id = p.id
        WHERE tm.team_id = ?
        ORDER BY
          CASE tm.role
            WHEN 'owner' THEN 1
            WHEN 'admin' THEN 2
            ELSE 3
          END,
          tm.joined_at ASC
      `).bind(teamId).all();

      console.log('Found members:', members.results?.length || 0);

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
          const payload = JSON.parse(atob(token.split('.')[1]));
          userId = payload.user?.id || payload.id;
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
        const mimeType = file.type || 'application/octet-stream';

        // Generate unique filename
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(7);
        const extension = file.name.split('.').pop();
        const filename = `${timestamp}-${random}.${extension}`;

        // Check if R2 is available (only in production)
        if (env.IMAGES) {
          // Upload to R2
          await env.IMAGES.put(filename, buffer, {
            httpMetadata: {
              contentType: mimeType,
            },
          });

          // Generate public URL using the same domain with /api/media/ path
          const url = new URL(request.url);
          const imageUrl = `${url.protocol}//${url.host}/api/media/${filename}`;

          return new Response(JSON.stringify({
            url: imageUrl,
            filename: file.name,
            size: buffer.byteLength,
            type: mimeType
          }), { headers: corsHeaders });
        } else {
          // Fallback to base64 data URL for development
          const uint8Array = new Uint8Array(buffer);
          let binary = '';
          const chunkSize = 8192;
          for (let i = 0; i < uint8Array.length; i += chunkSize) {
            const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
            binary += String.fromCharCode(...chunk);
          }
          const base64 = btoa(binary);
          const dataUrl = `data:${mimeType};base64,${base64}`;

          return new Response(JSON.stringify({
            url: dataUrl,
            filename: file.name,
            size: buffer.byteLength,
            type: mimeType
          }), { headers: corsHeaders });
        }
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
          'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read = 0'
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
          'UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?'
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
          'UPDATE notifications SET read = 1 WHERE user_id = ? AND read = 0'
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

    // Realtime chat SSE endpoint
    if (path === 'realtime/chat' && request.method === 'GET') {
      const url = new URL(request.url);
      const conversationId = url.searchParams.get('conversation_id');
      const asUser = url.searchParams.get('as_user');
      const token = url.searchParams.get('token');

      if (!conversationId || !asUser) {
        return new Response(JSON.stringify({ error: 'conversation_id and as_user are required' }), {
          status: 400,
          headers: corsHeaders
        });
      }

      // Verify token
      if (token) {
        try {
          const tokenData = JSON.parse(atob(token));
          if (tokenData.id !== asUser) {
            return new Response(JSON.stringify({ error: 'Invalid token for user' }), {
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
      }

      // Create SSE response
      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();
      const encoder = new TextEncoder();

      // Send initial connection message
      const connectionMsg = `data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`;
      await writer.write(encoder.encode(connectionMsg));

      // Keep-alive and poll for new messages
      let lastCheck = new Date().toISOString();
      const intervalId = setInterval(async () => {
        try {
          // Check for new messages since last check
          const messages = await env.DB.prepare(`
            SELECT m.*, p.username, p.display_name, p.avatar_url
            FROM messages m
            LEFT JOIN profiles p ON m.sender_id = p.id
            WHERE m.conversation_id = ?
            AND m.created_at > ?
            ORDER BY m.created_at ASC
          `).bind(conversationId, lastCheck).all();

          if (messages.results && messages.results.length > 0) {
            for (const msg of messages.results) {
              const data = `data: ${JSON.stringify({
                type: 'message',
                message: {
                  ...msg,
                  sender: {
                    id: msg.sender_id,
                    username: msg.username,
                    display_name: msg.display_name,
                    avatar_url: msg.avatar_url
                  }
                }
              })}\n\n`;
              await writer.write(encoder.encode(data));
            }
            lastCheck = messages.results[messages.results.length - 1].created_at;
          }

          // Send keep-alive ping
          await writer.write(encoder.encode(': ping\n\n'));
        } catch (error) {
          console.error('SSE polling error:', error);
          clearInterval(intervalId);
          await writer.close();
        }
      }, 3000); // Poll every 3 seconds

      // Clean up on connection close
      request.signal.addEventListener('abort', () => {
        clearInterval(intervalId);
        writer.close();
      });

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
        }
      });
    }

    // Get image from R2
    if (path.startsWith('media/')) {
      const filename = path.replace('media/', '');

      if (env.IMAGES) {
        try {
          const object = await env.IMAGES.get(filename);

          if (!object) {
            return new Response('Image not found', { status: 404 });
          }

          const headers = new Headers();
          object.writeHttpMetadata(headers);
          headers.set('etag', object.httpEtag);
          headers.set('Cache-Control', 'public, max-age=31536000, immutable');
          headers.set('Access-Control-Allow-Origin', '*');

          return new Response(object.body, { headers });
        } catch (error) {
          console.error('Error fetching image from R2:', error);
          return new Response('Error fetching image', { status: 500 });
        }
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
