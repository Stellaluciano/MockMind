import fs from 'node:fs/promises';

const TARGET = new URL('../QUESTION_BANK.md', import.meta.url);
const SOURCES = [
  'https://raw.githubusercontent.com/Stellaluciano/LLM-Interview-Question-Bank/main/QUESTION_BANK.md',
  'https://cdn.jsdelivr.net/gh/Stellaluciano/LLM-Interview-Question-Bank@main/QUESTION_BANK.md'
];

async function fetchText(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'MockMind-question-bank-sync/1.0' }
  });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.text();
}

let lastError = null;
for (const url of SOURCES) {
  try {
    const text = await fetchText(url);
    if (!text.trim().startsWith('#')) throw new Error(`${url} -> empty/invalid markdown`);
    await fs.writeFile(TARGET, text, 'utf8');
    console.log(`Synced QUESTION_BANK.md from: ${url}`);
    process.exit(0);
  } catch (error) {
    lastError = error;
  }
}

console.error('Failed to sync QUESTION_BANK.md from all sources.');
if (lastError) console.error(String(lastError));
process.exit(1);
