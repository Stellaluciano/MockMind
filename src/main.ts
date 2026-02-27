import './styles.css';

type RolePreset = 'ML Engineer' | 'Infra' | 'Research' | 'Quant';
type Difficulty = 'easy' | 'medium' | 'hard';
type Style = 'friendly' | 'neutral' | 'strict';
type Speaker = 'interviewer' | 'candidate';

interface SessionSettings {
  rolePreset: RolePreset;
  difficulty: Difficulty;
  style: Style;
}

interface ChatMessage {
  id: string;
  speaker: Speaker;
  text: string;
}

interface SessionResponse {
  session_id: string;
  avatar_url: string;
  avatar_source?: 'generated' | 'bundled';
  greeting_text: string;
  interviewer_name: string;
}

interface StreamChunk {
  type: 'text' | 'audio' | 'done' | 'error';
  chunk?: string;
  audio_url?: string;
  message?: string;
}

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('App container not found');

app.innerHTML = `
  <div class="layout">
    <aside class="left-panel">
      <img id="avatar" class="avatar" src="/avatars/avatar-1.svg" alt="Interviewer avatar" />
      <h2 id="interviewerName">Interviewer</h2>
      <div id="wave" class="wave">● ● ●</div>
      <button id="generateAvatar" class="secondary-btn">Generate new avatar</button>
      <p class="privacy-note">Privacy: If microphone is used, browser speech recognition or edge processing may transcribe audio. No server-side storage is used.</p>
      <div class="shortcuts">
        <strong>Shortcuts:</strong>
        <div>Enter: send</div>
        <div>M: mute/unmute</div>
        <div>N: next question</div>
      </div>
    </aside>

    <main class="chat-panel">
      <section class="session-config" id="sessionConfig">
        <h1>GPT Voice Mock Interviewer</h1>
        <label>Role preset
          <select id="rolePreset">
            <option>ML Engineer</option>
            <option>Infra</option>
            <option>Research</option>
            <option>Quant</option>
          </select>
        </label>
        <label>Difficulty
          <select id="difficulty">
            <option value="easy">Easy</option>
            <option value="medium" selected>Medium</option>
            <option value="hard">Hard</option>
          </select>
        </label>
        <label>Interview style
          <select id="style">
            <option value="friendly">Friendly</option>
            <option value="neutral" selected>Neutral</option>
            <option value="strict">Strict</option>
          </select>
        </label>
        <button id="startSession" class="primary-btn">Start Session</button>
      </section>

      <section id="chatLog" class="chat-log" aria-live="polite"></section>

      <section class="controls">
        <button id="muteBtn" class="secondary-btn">Mute</button>
        <button id="pauseBtn" class="secondary-btn">Pause</button>
        <button id="repeatBtn" class="secondary-btn">Repeat question</button>
        <button id="nextBtn" class="secondary-btn">Next question</button>
      </section>

      <section id="captions" class="captions" aria-live="assertive">Captions will appear here...</section>

      <form id="inputForm" class="input-bar">
        <button type="button" id="micBtn" class="secondary-btn">🎙️ Mic</button>
        <input id="candidateInput" type="text" placeholder="Type your answer..." autocomplete="off" />
        <button type="submit" class="primary-btn">Send</button>
      </form>
    </main>
  </div>
`;

const state = {
  sessionId: '',
  messages: [] as ChatMessage[],
  avatarUrl: '/avatars/avatar-1.svg',
  interviewerName: 'Interviewer',
  settings: {
    rolePreset: 'ML Engineer' as RolePreset,
    difficulty: 'medium' as Difficulty,
    style: 'neutral' as Style
  },
  isMuted: false,
  isPaused: false,
  isSpeaking: false,
  lastInterviewerText: '',
  audioEl: null as HTMLAudioElement | null,
  recognition: null as SpeechRecognition | null
};

const dom = {
  avatar: document.querySelector<HTMLImageElement>('#avatar')!,
  interviewerName: document.querySelector<HTMLElement>('#interviewerName')!,
  wave: document.querySelector<HTMLElement>('#wave')!,
  chatLog: document.querySelector<HTMLElement>('#chatLog')!,
  captions: document.querySelector<HTMLElement>('#captions')!,
  inputForm: document.querySelector<HTMLFormElement>('#inputForm')!,
  input: document.querySelector<HTMLInputElement>('#candidateInput')!,
  micBtn: document.querySelector<HTMLButtonElement>('#micBtn')!,
  muteBtn: document.querySelector<HTMLButtonElement>('#muteBtn')!,
  pauseBtn: document.querySelector<HTMLButtonElement>('#pauseBtn')!,
  repeatBtn: document.querySelector<HTMLButtonElement>('#repeatBtn')!,
  nextBtn: document.querySelector<HTMLButtonElement>('#nextBtn')!,
  generateAvatar: document.querySelector<HTMLButtonElement>('#generateAvatar')!,
  startSession: document.querySelector<HTMLButtonElement>('#startSession')!,
  rolePreset: document.querySelector<HTMLSelectElement>('#rolePreset')!,
  difficulty: document.querySelector<HTMLSelectElement>('#difficulty')!,
  style: document.querySelector<HTMLSelectElement>('#style')!,
  sessionConfig: document.querySelector<HTMLElement>('#sessionConfig')!
};

function createId() {
  return crypto.randomUUID();
}

function appendMessage(message: ChatMessage) {
  state.messages.push(message);
  const bubble = document.createElement('article');
  bubble.className = `bubble ${message.speaker}`;
  bubble.textContent = message.text;
  dom.chatLog.appendChild(bubble);
  dom.chatLog.scrollTop = dom.chatLog.scrollHeight;
}

function setSpeaking(speaking: boolean) {
  state.isSpeaking = speaking;
  dom.wave.classList.toggle('active', speaking);
}

async function startSession() {
  state.settings = {
    rolePreset: dom.rolePreset.value as RolePreset,
    difficulty: dom.difficulty.value as Difficulty,
    style: dom.style.value as Style
  };

  const res = await fetch('/api/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(state.settings)
  });

  if (!res.ok) throw new Error('Failed to start session');
  const data: SessionResponse = await res.json();

  state.sessionId = data.session_id;
  state.avatarUrl = data.avatar_url;
  state.interviewerName = data.interviewer_name;

  dom.avatar.src = state.avatarUrl;
  dom.interviewerName.textContent = state.interviewerName;
  if (data.avatar_source === 'bundled') {
    dom.captions.textContent = 'Using bundled avatar fallback. Configure OPENAI_API_KEY to enable photorealistic generation.';
  }
  dom.sessionConfig.classList.add('hidden');
  dom.chatLog.innerHTML = '';
  state.messages = [];

  await handleInterviewerResponse(data.greeting_text, true);
}

async function handleInterviewerResponse(candidateMessage: string, isInitial = false) {
  if (!isInitial) {
    appendMessage({ id: createId(), speaker: 'candidate', text: candidateMessage });
  }

  const interviewerBubble: ChatMessage = { id: createId(), speaker: 'interviewer', text: '' };
  appendMessage(interviewerBubble);

  const reqBody = {
    session_id: state.sessionId,
    candidate_message: candidateMessage,
    conversation_history: state.messages,
    settings: state.settings,
    action: isInitial ? 'greeting' : 'respond'
  };

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reqBody)
    });

    if (!res.ok || !res.body) throw new Error('Realtime endpoint unavailable');

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let textAcc = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;
        const chunk: StreamChunk = JSON.parse(line);
        if (chunk.type === 'text' && chunk.chunk) {
          textAcc += chunk.chunk;
          const bubbles = dom.chatLog.querySelectorAll('.bubble.interviewer');
          const last = bubbles[bubbles.length - 1] as HTMLElement;
          if (last) last.textContent = textAcc;
          dom.captions.textContent = textAcc;
          state.lastInterviewerText = textAcc;
        }

        if (chunk.type === 'audio' && chunk.audio_url) {
          await playAudio(chunk.audio_url);
        }

        if (chunk.type === 'error') {
          dom.captions.textContent = chunk.message || 'Text-only fallback active.';
        }
      }
    }
  } catch (_error) {
    const fallback = 'I can continue in text-only mode. Please describe your previous project impact in measurable terms.';
    const bubbles = dom.chatLog.querySelectorAll('.bubble.interviewer');
    const last = bubbles[bubbles.length - 1] as HTMLElement;
    if (last) last.textContent = fallback;
    dom.captions.textContent = fallback;
    state.lastInterviewerText = fallback;
  }
}

async function playAudio(audioUrl: string) {
  if (state.isMuted) return;
  if (state.audioEl) {
    state.audioEl.pause();
  }

  const audio = new Audio(audioUrl);
  state.audioEl = audio;
  audio.onplay = () => setSpeaking(true);
  audio.onended = () => setSpeaking(false);
  audio.onpause = () => setSpeaking(false);
  await audio.play();
}

function toggleMicInput() {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) {
    dom.captions.textContent = 'Speech recognition is unavailable. Please type your answer.';
    return;
  }

  if (state.recognition) {
    state.recognition.stop();
    state.recognition = null;
    dom.micBtn.textContent = '🎙️ Mic';
    return;
  }

  const recognition = new Recognition();
  recognition.lang = 'en-US';
  recognition.interimResults = true;

  recognition.onresult = (event) => {
    let transcript = '';
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      transcript += event.results[i][0].transcript;
    }
    dom.input.value = transcript;
  };

  recognition.onerror = () => {
    dom.captions.textContent = 'Mic permission denied or unavailable. Continue with typing.';
  };

  recognition.onend = () => {
    state.recognition = null;
    dom.micBtn.textContent = '🎙️ Mic';
  };

  recognition.start();
  state.recognition = recognition;
  dom.micBtn.textContent = '⏹ Stop Mic';
}

async function generateAvatar() {
  try {
    const res = await fetch('/api/avatar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: state.sessionId, settings: state.settings })
    });
    if (!res.ok) throw new Error('avatar failed');
    const data = await res.json();
    state.avatarUrl = data.avatar_url;
    dom.avatar.src = state.avatarUrl;
    if (data.source === 'bundled') {
      dom.captions.textContent = 'Avatar generation unavailable. Kept bundled avatar fallback.';
    }
  } catch {
    const fallbackIndex = Math.floor(Math.random() * 8) + 1;
    state.avatarUrl = `/avatars/avatar-${fallbackIndex}.svg`;
    dom.avatar.src = state.avatarUrl;
  }
}

dom.startSession.addEventListener('click', async () => {
  try {
    await startSession();
  } catch {
    dom.captions.textContent = 'Could not start edge session. Running local text-only demo.';
    dom.sessionConfig.classList.add('hidden');
    appendMessage({ id: createId(), speaker: 'interviewer', text: 'Welcome! Tell me about a project you are proud of.' });
  }
});

dom.inputForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const text = dom.input.value.trim();
  if (!text) return;
  dom.input.value = '';
  await handleInterviewerResponse(text);
});

dom.muteBtn.addEventListener('click', () => {
  state.isMuted = !state.isMuted;
  dom.muteBtn.textContent = state.isMuted ? 'Unmute' : 'Mute';
  if (state.isMuted && state.audioEl) state.audioEl.pause();
});

dom.pauseBtn.addEventListener('click', () => {
  if (!state.audioEl) return;
  state.isPaused = !state.isPaused;
  if (state.isPaused) state.audioEl.pause();
  else void state.audioEl.play();
  dom.pauseBtn.textContent = state.isPaused ? 'Resume' : 'Pause';
});

dom.repeatBtn.addEventListener('click', async () => {
  if (!state.lastInterviewerText) return;
  dom.captions.textContent = state.lastInterviewerText;
  if (state.audioEl?.src) {
    await playAudio(state.audioEl.src);
  } else if ('speechSynthesis' in window) {
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(state.lastInterviewerText));
  }
});

dom.nextBtn.addEventListener('click', async () => {
  await handleInterviewerResponse('Please ask the next question.');
});

dom.generateAvatar.addEventListener('click', () => {
  void generateAvatar();
});

dom.micBtn.addEventListener('click', () => {
  toggleMicInput();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'm' || event.key === 'M') dom.muteBtn.click();
  if (event.key === 'n' || event.key === 'N') dom.nextBtn.click();
});
