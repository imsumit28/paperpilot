import { NextRequest, NextResponse } from 'next/server';

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
  if (!res.ok) throw new Error(await res.text());
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
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

export async function POST(req: NextRequest) {
  const { prompt } = (await req.json()) as { prompt: string };
  if (!prompt?.trim()) {
    return NextResponse.json({ error: 'Prompt is required.' }, { status: 400 });
  }

  const deepseekKey = process.env.DEEPSEEK_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (!deepseekKey && !geminiKey) {
    return NextResponse.json(
      { error: 'No AI key configured. Add DEEPSEEK_API_KEY or GEMINI_API_KEY to your .env file.' },
      { status: 500 },
    );
  }

  try {
    const text = deepseekKey
      ? await callDeepSeek(deepseekKey, prompt)
      : await callGemini(geminiKey!, prompt);
    return NextResponse.json({ text });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
