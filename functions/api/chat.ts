import { generateInterviewerText, generateTtsDataUrl } from '../_lib/openai';

interface ChatPayload {
  session_id: string;
  conversation_history: Array<{ speaker: string; text: string }>;
  candidate_message: string;
  settings: {
    rolePreset: string;
    difficulty: string;
    style: string;
  };
  action?: string;
}

function streamChunks(text: string) {
  const tokens = text.split(/(\s+)/).filter(Boolean);
  return tokens;
}

export const onRequestPost: PagesFunction<{ OPENAI_API_KEY?: string; OPENAI_TEXT_MODEL?: string; OPENAI_TTS_MODEL?: string; OPENAI_VOICE?: string }> = async ({ request, env }) => {
  const body = (await request.json()) as ChatPayload;

  const history = body.conversation_history
    .slice(-8)
    .map((m) => `${m.speaker}: ${m.text}`)
    .join('\n');

  const prompt = `You are a realistic technical interviewer.\nRole: ${body.settings.rolePreset}\nDifficulty: ${body.settings.difficulty}\nStyle: ${body.settings.style}\nCandidate says: ${body.candidate_message}\nHistory:\n${history}\nRespond with one concise interview turn (max 120 words).`;

  const interviewerText = await generateInterviewerText(prompt, env);
  const audioUrl = await generateTtsDataUrl(interviewerText, env);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for (const token of streamChunks(interviewerText)) {
          controller.enqueue(encoder.encode(`${JSON.stringify({ type: 'text', chunk: token })}\n`));
          await new Promise((resolve) => setTimeout(resolve, 45));
        }

        if (audioUrl) {
          controller.enqueue(encoder.encode(`${JSON.stringify({ type: 'audio', audio_url: audioUrl })}\n`));
        } else {
          controller.enqueue(encoder.encode(`${JSON.stringify({ type: 'error', message: 'Audio unavailable: text-only mode.' })}\n`));
        }

        controller.enqueue(encoder.encode(`${JSON.stringify({ type: 'done' })}\n`));
      } catch (err) {
        controller.enqueue(
          encoder.encode(`${JSON.stringify({ type: 'error', message: (err as Error).message || 'Streaming failed.' })}\n`)
        );
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
};
