import { pickAvatar, randomInterviewerName } from '../_lib/avatars';
import { generateAvatarDataUrl } from '../_lib/openai';

interface Payload {
  rolePreset?: string;
  difficulty?: string;
  style?: string;
}

export const onRequestPost: PagesFunction<{ OPENAI_API_KEY?: string }> = async ({ request, env }) => {
  const body = (await request.json().catch(() => ({}))) as Payload;
  const role = body.rolePreset || 'ML Engineer';
  const difficulty = body.difficulty || 'medium';
  const style = body.style || 'neutral';

  const session_id = crypto.randomUUID();
  const avatarPrompt = `Ultra-realistic professional headshot of an AI interview coach for a ${role} interview, natural skin texture, studio photo quality, neutral office background, 85mm lens, sharp eyes, soft cinematic light, no illustration, no cartoon, no watermark, no text.`;
  const generatedAvatar = await generateAvatarDataUrl(avatarPrompt, env);
  const avatar_url = generatedAvatar || pickAvatar(session_id);
  const interviewer_name = randomInterviewerName();
  const greeting_text = `Hi, I am ${interviewer_name}. Welcome to your ${difficulty} ${role} mock interview. I will keep a ${style} tone. Please introduce yourself in 60 seconds.`;

  return Response.json({ session_id, avatar_url, interviewer_name, greeting_text });
};
