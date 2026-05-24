export async function generateToolkit(prompt: string): Promise<string> {
  const res = await fetch('/api/toolkit/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Generation failed');
  return data.text as string;
}
