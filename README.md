# gpt-voice-mock-interviewer

A stateless Cloudflare Pages + Functions mock interview web app with streaming interviewer captions + voice, browser mic input (Web Speech API), typed fallback, and bundled realistic avatars.

## Features

- **Session setup**: role preset (ML Engineer/Infra/Research/Quant), difficulty, style.
- **Chat UX**: interviewer + candidate bubbles with pinned live captions.
- **Interviewer voice**: edge endpoint returns streaming text chunks and an audio payload for each turn.
- **Candidate input**:
  - Browser microphone speech-to-text (Web Speech API, if available)
  - Typed text fallback
- **Controls**: mute/unmute, pause/resume, repeat question, next question.
- **Accessibility**: always-visible captions, keyboard shortcuts (Enter/M/N).
- **Privacy note**: no login, no DB, stateless edge processing only.
- **Avatar system**:
  - 8 bundled avatars in `public/avatars`
  - optional generated avatar via `/api/avatar` if image generation is configured

## Architecture

- **Frontend**: Vite + TypeScript + vanilla CSS (`src/`)
- **Edge API**: Cloudflare Pages Functions (`functions/api/*`)
- **Security**: OpenAI key only in Cloudflare secrets/env, never in browser bundle

## API Endpoints

- `POST /api/session`
  - input: `{ rolePreset, difficulty, style }`
  - output: `{ session_id, avatar_url, interviewer_name, greeting_text }`
- `POST /api/chat` (streaming NDJSON fallback transport)
  - input: `{ session_id, conversation_history, candidate_message, settings }`
  - output stream chunks:
    - `{ type: "text", chunk }`
    - `{ type: "audio", audio_url }` (if TTS available)
    - `{ type: "error", message }`
    - `{ type: "done" }`
- `POST /api/avatar`
  - output: generated avatar data URL if configured, otherwise bundled avatar path

## Local Development

```bash
npm install
npm run dev
```

This runs the static Vite app. For full Cloudflare Function integration locally, use:

```bash
npm run build
npx wrangler pages dev dist
```


## Scripts

- `npm run dev` - Vite local dev
- `npm run build` - Production build
- `npm run preview` - Preview static build
- `npm run typecheck` - TypeScript check
- `npm run lint` - ESLint

## Notes

- If mic permission is denied/unavailable, app gracefully falls back to typing.
- If edge realtime/audio generation fails, app continues in text-only mode.
- No user data is persisted server-side.
