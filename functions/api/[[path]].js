// Cloudflare Pages Function - API Proxy to Railway
const RAILWAY_API_BASE = 'https://sofvo-api-production.up.railway.app/api';

export async function onRequest(context) {
  const { request, params } = context;
  const path = params.path ? params.path.join('/') : '';
  const url = new URL(request.url);
  const targetUrl = `${RAILWAY_API_BASE}/${path}${url.search}`;

  // Clone the request to avoid consuming the body stream
  const proxyRequest = new Request(targetUrl, {
    method: request.method,
    headers: request.headers,
    body: request.method !== 'GET' && request.method !== 'HEAD' ? await request.clone().arrayBuffer() : null,
    redirect: 'follow'
  });

  try {
    const response = await fetch(proxyRequest);
    const newResponse = new Response(response.body, response);

    newResponse.headers.set('Access-Control-Allow-Origin', '*');
    newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    newResponse.headers.set('Access-Control-Max-Age', '86400');

    return newResponse;
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Proxy error', message: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Max-Age': '86400'
    }
  });
}
