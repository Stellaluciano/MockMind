import { pickAvatar } from '../_lib/avatars';
import { generateAvatarDataUrl } from '../_lib/openai';

export const onRequestPost: PagesFunction<{ OPENAI_API_KEY?: string }> = async ({ request, env }) => {
  const body = (await request.json().catch(() => ({}))) as { session_id?: string; settings?: { rolePreset?: string } };

  const role = body.settings?.rolePreset || 'ML Engineer';
  const prompt = `Ultra-realistic professional headshot of an AI interviewer for a ${role} interview, natural skin texture, studio photo quality, neutral office background, 85mm lens, sharp eyes, soft cinematic lighting, no illustration, no cartoon, no painting, no text, no watermark.`;
  const generated = await generateAvatarDataUrl(prompt, env);

  if (generated) {
    return Response.json({ avatar_url: generated, source: 'generated' });
  }

  const fallback = pickAvatar(body.session_id);
  return Response.json({ avatar_url: fallback, source: 'bundled' });
};
