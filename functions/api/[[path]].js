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
