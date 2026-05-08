// MiniMax API client (OpenAI-compatible).
//
// Endpoint:  https://api.minimaxi.chat/v1/text/chatcompletion_v2  (international)
//            https://api.minimax.chat/v1/text/chatcompletion_v2   (China)
// Will's account is `sk-cp-...` which is the standard global key.
// Model used: MiniMax-M1 (long-context reasoning) for insights/chat.

export interface MiniMaxEnv {
  MINIMAX_API_KEY: string;
  MINIMAX_BASE?: string;
  MINIMAX_MODEL?: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  temperature?: number;
  max_tokens?: number;
  response_format?: 'text' | 'json_object';
}

export interface ChatResponse {
  ok: boolean;
  text?: string;
  raw?: unknown;
  error?: string;
  duration_ms: number;
  tokens_in?: number;
  tokens_out?: number;
}

const DEFAULT_BASE = 'https://api.minimaxi.chat';
const DEFAULT_MODEL = 'MiniMax-M1';

export async function chat(env: MiniMaxEnv, messages: ChatMessage[], opts: ChatOptions = {}): Promise<ChatResponse> {
  const start = Date.now();
  if (!env.MINIMAX_API_KEY) {
    return { ok: false, error: 'MINIMAX_API_KEY not configured', duration_ms: 0 };
  }
  const base = env.MINIMAX_BASE || DEFAULT_BASE;
  const model = env.MINIMAX_MODEL || DEFAULT_MODEL;
  try {
    const res = await fetch(`${base}/v1/text/chatcompletion_v2`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.MINIMAX_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: opts.temperature ?? 0.3,
        max_tokens: opts.max_tokens ?? 1500,
        ...(opts.response_format === 'json_object'
          ? { response_format: { type: 'json_object' } }
          : {}),
      }),
    });
    const text = await res.text();
    let parsed: Record<string, unknown> | null = null;
    try { parsed = text ? JSON.parse(text) : null; } catch { /* leave null */ }
    if (!res.ok) {
      return {
        ok: false,
        error: `MiniMax ${res.status}: ${text.slice(0, 400)}`,
        raw: parsed,
        duration_ms: Date.now() - start,
      };
    }
    const choices = (parsed?.choices as Array<{ message?: { content?: string } }>) || [];
    const out = choices[0]?.message?.content || '';
    const usage = (parsed?.usage as { total_tokens?: number; prompt_tokens?: number; completion_tokens?: number }) || {};
    return {
      ok: true,
      text: out,
      raw: parsed,
      duration_ms: Date.now() - start,
      tokens_in: usage.prompt_tokens,
      tokens_out: usage.completion_tokens,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      duration_ms: Date.now() - start,
    };
  }
}
