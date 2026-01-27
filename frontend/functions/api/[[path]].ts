export async function onRequest(context: { request: Request; env: { API_ORIGIN?: string } }) {
  const { request, env } = context;
  const apiOrigin = env.API_ORIGIN;

  if (!apiOrigin) {
    return new Response('Missing API_ORIGIN env var', { status: 500 });
  }

  const incomingUrl = new URL(request.url);
  const targetBase = new URL(apiOrigin);
  const targetUrl = new URL(incomingUrl.pathname + incomingUrl.search, targetBase);

  const headers = new Headers(request.headers);
  headers.delete('host');

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: 'manual'
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = await request.arrayBuffer();
  }

  const response = await fetch(targetUrl, init);
  const responseHeaders = new Headers(response.headers);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders
  });
}
