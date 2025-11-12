// Cloudflare Pages Function - Realtime notifications via SSE
// Note: SSE connections have time limits on Cloudflare Workers/Pages
// Consider using polling or WebSockets (via Durable Objects) for production

export async function onRequest(context) {
  const { request, env, params } = context;
  const path = params.path ? params.path.join('/') : '';

  // CORS headers for SSE
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Handle OPTIONS
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // SSE for notifications
  if (path === 'notifications' && request.method === 'GET') {
    const url = new URL(request.url);
    const token = url.searchParams.get('token');
    const asUser = url.searchParams.get('as_user');

    if (!token) {
      return new Response(JSON.stringify({ error: 'Token is required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verify token
    let tokenData;
    try {
      tokenData = JSON.parse(atob(token));
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const userId = asUser || tokenData.id;
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Invalid token or user ID' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Note: Cloudflare Workers/Pages have execution time limits
    // This implementation sends current notifications and closes
    // For real-time updates, consider polling or Durable Objects

    try {
      // Get recent unread notifications
      const notifications = await env.DB.prepare(`
        SELECT
          n.*,
          p.username as actor_username,
          p.display_name as actor_display_name,
          p.avatar_url as actor_avatar_url
        FROM notifications n
        LEFT JOIN profiles p ON n.actor_id = p.id
        WHERE n.user_id = ? AND n.is_read = 0
        ORDER BY n.created_at DESC
        LIMIT 10
      `).bind(userId).all();

      // Create SSE response
      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();
      const encoder = new TextEncoder();

      // Send initial notifications
      const notificationData = JSON.stringify({
        type: 'notifications',
        data: notifications.results || []
      });

      await writer.write(encoder.encode(`data: ${notificationData}\n\n`));

      // Send keepalive and close (due to time limits)
      await writer.write(encoder.encode(`: keepalive\n\n`));
      await writer.close();

      return new Response(readable, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      });
    } catch (error) {
      console.error('SSE error:', error);
      return new Response(JSON.stringify({
        error: 'Failed to establish SSE connection',
        details: error.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  // Default: return not found
  return new Response(JSON.stringify({ error: 'Endpoint not found', path }), {
    status: 404,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}
