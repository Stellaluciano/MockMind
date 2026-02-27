interface Env {
  OPENAI_API_KEY?: string;
  OPENAI_TEXT_MODEL?: string;
  OPENAI_TTS_MODEL?: string;
  OPENAI_VOICE?: string;
  OPENAI_IMAGE_MODEL?: string;
}

export async function generateInterviewerText(prompt: string, env: Env): Promise<string> {
  if (!env.OPENAI_API_KEY) return fallbackText(prompt);

  const resp = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: env.OPENAI_TEXT_MODEL || 'gpt-4o-mini',
      input: prompt,
      temperature: 0.7,
      max_output_tokens: 260
    })
  });

  if (!resp.ok) return fallbackText(prompt);
  const data = (await resp.json()) as any;
  const out = data.output_text || data.output?.map((o: any) => o?.content?.[0]?.text).join(' ');
  return out?.trim() || fallbackText(prompt);
}

export async function generateTtsDataUrl(text: string, env: Env): Promise<string | null> {
  if (!env.OPENAI_API_KEY) return null;

  const resp = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: env.OPENAI_TTS_MODEL || 'gpt-4o-mini-tts',
      input: text,
      voice: env.OPENAI_VOICE || 'alloy',
      format: 'mp3'
    })
  });

  if (!resp.ok) return null;
  const bytes = new Uint8Array(await resp.arrayBuffer());
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return `data:audio/mp3;base64,${btoa(binary)}`;
}

export async function generateAvatarDataUrl(prompt: string, env: Env): Promise<string | null> {
  if (!env.OPENAI_API_KEY) return null;

  const resp = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: env.OPENAI_IMAGE_MODEL || 'gpt-image-1',
      prompt,
      size: '1024x1024'
    })
  });

  if (!resp.ok) return null;
  const data = (await resp.json()) as any;
  const image = data.data?.[0];
  const b64 = image?.b64_json;
  if (b64) return `data:image/png;base64,${b64}`;

  const imageUrl = image?.url;
  return typeof imageUrl === 'string' ? imageUrl : null;
}

function fallbackText(prompt: string): string {
  if (prompt.includes('next question')) {
    return 'Great. Next question: Describe a failure in production, how you diagnosed it, and what you changed in your process afterwards.';
  }
  return 'Thanks for sharing. Can you walk me through your architecture decisions, the trade-offs you made, and measurable outcomes?';
}
