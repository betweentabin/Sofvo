export const config = { runtime: 'edge' };

// Prefer env on Vercel, but allow a safe default so that
// /api works even if the env var isn't configured yet.
// NOTE: Change DEFAULT_ORIGIN to your Railway Node API origin if different.
const DEFAULT_ORIGIN = 'https://sofvo-api-production.up.railway.app';
const TARGET_ORIGIN = process.env.RAILWAY_API_ORIGIN || DEFAULT_ORIGIN;

export default async function handler(req) {
  try {
    // Defensive: basic validation for origin format
    if (!/^https?:\/\//.test(TARGET_ORIGIN)) {
      return new Response(JSON.stringify({
        message: 'Invalid upstream origin',
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
