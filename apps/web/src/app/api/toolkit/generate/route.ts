import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function readKey(name: string): string {
  const raw = process.env[name];
  if (!raw) return '';
  return raw.trim().replace(/^['"]|['"]$/g, '');
}

async function callDeepSeek(key: string, prompt: string): Promise<string> {
  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 4096,
    }),
  });
  if (!res.ok) throw new Error(`DeepSeek ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

async function callGemini(key: string, prompt: string): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    },
  );
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

export async function POST(req: NextRequest) {
  const { prompt } = (await req.json()) as { prompt?: string };
  if (!prompt?.trim()) {
    return NextResponse.json({ error: 'Prompt is required.' }, { status: 400 });
  }

  const deepseekKey = readKey('DEEPSEEK_API_KEY');
  const geminiKey = readKey('GEMINI_API_KEY');

  if (!deepseekKey && !geminiKey) {
    return NextResponse.json(
      {
        error:
          'AI provider not configured. Set DEEPSEEK_API_KEY (or GEMINI_API_KEY) in your hosting platform\'s environment variables (Vercel/Netlify/Render dashboard) and redeploy. For local dev, add it to apps/web/.env and restart `pnpm dev`.',
      },
      { status: 500 },
    );
  }

  const providers: Array<{ name: string; run: () => Promise<string> }> = [];
  if (deepseekKey) providers.push({ name: 'DeepSeek', run: () => callDeepSeek(deepseekKey, prompt) });
  if (geminiKey) providers.push({ name: 'Gemini', run: () => callGemini(geminiKey, prompt) });

  const failures: string[] = [];
  for (const provider of providers) {
    try {
      const text = await provider.run();
      if (text?.trim()) return NextResponse.json({ text });
      failures.push(`${provider.name}: empty response`);
    } catch (err) {
      failures.push(`${provider.name}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return NextResponse.json(
    { error: `Generation failed. ${failures.join(' | ')}` },
    { status: 502 },
  );
}
