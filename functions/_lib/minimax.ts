// MiniMax API client (OpenAI-compatible-ish — see notes below).
//
// Endpoint:  https://api.minimaxi.chat/v1/text/chatcompletion_v2  (international)
// Will's account: confirmed working with model `MiniMax-M2.7` (reasoning).
//
// Reasoning-model nuance: M2.7 returns chain-of-thought in
// `choices[0].message.reasoning_content` and the final user-facing answer
// in `choices[0].message.content`. With a small max_tokens budget the
// reasoning eats all the room and content comes back empty. We pass
// large max_tokens (default 6000) and prefer `content` but fall back to
// `reasoning_content` so the user always sees something.

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
const DEFAULT_MODEL = 'MiniMax-M2.7';

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
        // Reasoning models (M2.x) need a generous budget so reasoning AND
        // content both fit. Default 6000.
        max_tokens: opts.max_tokens ?? 6000,
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
    // MiniMax responds with HTTP 200 even for semantic errors — check base_resp.
    const baseResp = parsed?.base_resp as { status_code?: number; status_msg?: string } | undefined;
    if (baseResp && baseResp.status_code && baseResp.status_code !== 0) {
      return {
        ok: false,
        error: `MiniMax ${baseResp.status_code}: ${baseResp.status_msg || 'unknown'}`,
        raw: parsed,
        duration_ms: Date.now() - start,
      };
    }
    const choices =
      (parsed?.choices as Array<{
        message?: { content?: string; reasoning_content?: string };
        finish_reason?: string;
      }>) || [];
    const msg = choices[0]?.message;
    // Prefer content; fall back to reasoning_content if content is empty
    // (happens when max_tokens is too tight for the reasoning step).
    const out = (msg?.content && msg.content.trim()) || msg?.reasoning_content || '';
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
