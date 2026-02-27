export const BUNDLED_AVATARS = Array.from({ length: 8 }, (_, i) => `/avatars/avatar-${i + 1}.svg`);

export function pickAvatar(seed?: string) {
  const raw = seed || crypto.randomUUID();
  let hash = 0;
  for (let i = 0; i < raw.length; i += 1) hash = (hash * 31 + raw.charCodeAt(i)) >>> 0;
  return BUNDLED_AVATARS[hash % BUNDLED_AVATARS.length];
}

export function randomInterviewerName() {
  const names = ['Dr. Rivera', 'Samira Cole', 'Alex Chen', 'Jordan Hale', 'Priya Nair', 'Noah Park'];
  return names[Math.floor(Math.random() * names.length)];
}
