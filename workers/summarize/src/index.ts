export interface Env {
  ANTHROPIC_API_KEY: string;
  RATE: KVNamespace;
  DAILY_SPEND_CAP_USD: string;
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
    if (new URL(req.url).pathname !== '/api/summarize') return new Response('Not Found', { status: 404 });
    return new Response('not implemented', { status: 501 });
  },
};
