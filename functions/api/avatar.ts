import { pickAvatar } from '../_lib/avatars';
import { generateAvatarDataUrl } from '../_lib/openai';

export const onRequestPost: PagesFunction<{ OPENAI_API_KEY?: string }> = async ({ request, env }) => {
  const body = (await request.json().catch(() => ({}))) as { session_id?: string; settings?: { rolePreset?: string } };

  const prompt = `Hyper-realistic portrait photo of a professional interviewer, neutral office background, cinematic lighting, looking at camera.`;
  const generated = await generateAvatarDataUrl(prompt, env);

  if (generated) {
    return Response.json({ avatar_url: generated, source: 'generated' });
  }

  const fallback = pickAvatar(body.session_id);
  return Response.json({ avatar_url: fallback, source: 'bundled' });
};
