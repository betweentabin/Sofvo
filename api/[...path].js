export const config = { runtime: 'edge' };
const TARGET_ORIGIN = process.env.RAILWAY_API_ORIGIN;

export default async function handler(req) {
  try {
    if (!TARGET_ORIGIN) {
      return new Response(JSON.stringify({
        message: 'Missing RAILWAY_API_ORIGIN env. Set it to your Railway Node API origin (e.g., https://<your-backend>.up.railway.app)'
      }), { status: 500, headers: { 'content-type': 'application/json' } });
    }
    const url = new URL(req.url);
    // Preserve the full /api/... path and query when proxying
    const targetUrl = new URL(url.pathname + url.search, TARGET_ORIGIN);

    // Create a new Request to the upstream, preserving method, headers, and body
    const upstreamReq = new Request(targetUrl.toString(), req);
    const upstreamRes = await fetch(upstreamReq, { redirect: 'manual' });

    // Stream the response back to the client as-is
    const resHeaders = new Headers(upstreamRes.headers);
    // Ensure no CORS headers are leaked/altered; same-origin fetch doesn't require them
    resHeaders.delete('access-control-allow-origin');
    resHeaders.delete('access-control-allow-headers');
    resHeaders.delete('access-control-allow-methods');

    return new Response(upstreamRes.body, {
      status: upstreamRes.status,
      statusText: upstreamRes.statusText,
      headers: resHeaders,
    });
  } catch (err) {
    return new Response(JSON.stringify({ message: 'Proxy error', error: String(err) }), {
      status: 502,
      headers: { 'content-type': 'application/json' },
    });
  }
}
