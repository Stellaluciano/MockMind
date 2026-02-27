import { pickAvatar, randomInterviewerName } from '../_lib/avatars';

interface Payload {
  rolePreset?: string;
  difficulty?: string;
  style?: string;
}

export const onRequestPost: PagesFunction = async ({ request }) => {
  const body = (await request.json().catch(() => ({}))) as Payload;
  const role = body.rolePreset || 'ML Engineer';
  const difficulty = body.difficulty || 'medium';
  const style = body.style || 'neutral';

  const session_id = crypto.randomUUID();
  const avatar_url = pickAvatar(session_id);
  const interviewer_name = randomInterviewerName();
  const greeting_text = `Hi, I am ${interviewer_name}. Welcome to your ${difficulty} ${role} mock interview. I will keep a ${style} tone. Please introduce yourself in 60 seconds.`;

  return Response.json({ session_id, avatar_url, interviewer_name, greeting_text });
};
