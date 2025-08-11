
const promptEl = document.getElementById("prompt");
const systemEl = document.getElementById("system");
const outEl = document.getElementById("out");
const modelEl = document.getElementById("model");
const presetEl = document.getElementById("preset");
const siteLabel = document.getElementById("siteLabel");
const memoryToggle = document.getElementById("memoryToggle");
const themeEl = document.getElementById("theme");
const MAX_MEM = 12;

function setTheme(val) {
  if (val === "light") document.documentElement.classList.add("light");
  else document.documentElement.classList.remove("light");
}
(async function initTheme(){
  const { theme = "dark" } = await chrome.storage.sync.get("theme");
  themeEl.value = theme; setTheme(theme);
  themeEl.addEventListener("change", async () => {
    const v = themeEl.value; setTheme(v); await chrome.storage.sync.set({ theme: v });
  });
})();

function escapeHtml(s){ return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function toHtml(md){
  let safe = escapeHtml(md);
  safe = safe.replace(/```([\s\S]*?)```/g, (_, code) => `<pre><code>${code}</code></pre>`);
  safe = safe.replace(/`([^`]+)`/g, (_, code) => `<code>${code}</code>`);
  return safe;
}

function portAsk(prompt, history=[]) {
  outEl.innerHTML = "";
  outEl.classList.remove("small");
  const port = chrome.runtime.connect({ name: "gpt" });
  let buffer = "";
  port.onMessage.addListener((msg) => {
    if (msg.type === "chunk") {
      buffer += msg.text;
      outEl.innerHTML = toHtml(buffer);
    } else if (msg.type === "error") {
      outEl.textContent = "Error: " + msg.message;
    } else if (msg.type === "done") {
      saveToMemory(prompt, buffer).catch(console.error);
    }
  });
  port.postMessage({ type:"ask", prompt, model: modelEl.value, system: systemEl.value || undefined, history });
}

async function getActiveOrigin() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  let origin = "chrome://popup";
  if (tab?.url) { try { origin = new URL(tab.url).origin; } catch {} }
  return { origin, tabId: tab?.id };
}

async function loadPresets() {
  const defaults = [
    { name: "ELI5", text: "Explain this like I am five years old, with a simple example." },
    { name: "Debug my code", text: "Read this code, find bugs, and propose a minimal fix:\n\n" },
    { name: "Unit tests", text: "Write unit tests for this function using Jest, then explain edge cases:\n\n" },
    { name: "Summarize", text: "Summarize into 5 key bullets and a 2-sentence TL;DR:\n\n" },
    { name: "Docs writer", text: "Turn this into clear documentation with examples:\n\n" }
  ];
  const { presets } = await chrome.storage.sync.get("presets");
  const list = (Array.isArray(presets) && presets.length) ? presets : defaults;
  presetEl.innerHTML = '<option value="">Presets…</option>';
  for (const p of list) {
    const opt = document.createElement("option");
    opt.value = p.text; opt.textContent = p.name;
    presetEl.appendChild(opt);
  }
}
function insertAtCursor(textarea, snippet) {
  const start = textarea.selectionStart ?? textarea.value.length;
  const end = textarea.selectionEnd ?? textarea.value.length;
  textarea.value = textarea.value.slice(0, start) + snippet + textarea.value.slice(end);
  textarea.selectionStart = textarea.selectionEnd = start + snippet.length;
  textarea.focus();
}
document.getElementById("usePreset").addEventListener("click", () => {
  const val = presetEl.value; if (val) insertAtCursor(promptEl, val);
});

document.getElementById("askBtn").addEventListener("click", async () => {
  const text = promptEl.value.trim(); if (!text) return;
  const history = memoryToggle.checked ? await getMemoryHistory() : [];
  portAsk(text, history);
});

document.getElementById("summarizeBtn").addEventListener("click", async () => {
  const { tabId } = await getActiveOrigin(); if (!tabId) return;
  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => document.body.innerText.slice(0, 20000)
  });
  const history = memoryToggle.checked ? await getMemoryHistory() : [];
  portAsk("Summarize this page in 8 bullets with a 2-sentence TL;DR, then list 3 follow-up questions.\n\nPAGE CONTENT:\n" + result, history);
});

document.getElementById("copyPlain").addEventListener("click", async () => {
  await navigator.clipboard.writeText(outEl.textContent);
});
document.getElementById("copyCode").addEventListener("click", async () => {
  await navigator.clipboard.writeText("```text\n" + outEl.textContent + "\n```");
});
document.getElementById("clearMem").addEventListener("click", async () => {
  const { origin } = await getActiveOrigin();
  await chrome.storage.local.remove("mem::" + origin);
  siteLabel.textContent = origin.replace(/^https?:\/\//,"") + " — memory cleared";
  setTimeout(()=> siteLabel.textContent = origin.replace(/^https?:\/\//,""), 1500);
});

memoryToggle.addEventListener("change", async () => {
  const { origin } = await getActiveOrigin();
  siteLabel.textContent = origin.replace(/^https?:\/\//,"") + (memoryToggle.checked ? " — memory ON" : " — memory OFF");
});

async function getMemoryHistory() {
  const { origin } = await getActiveOrigin();
  const key = "mem::" + origin; const obj = await chrome.storage.local.get(key);
  const messages = obj[key] || [];
  return messages.slice(-MAX_MEM).map(m => ({ role: m.role, content: m.content }));
}
async function saveToMemory(userText, assistantText) {
  if (!memoryToggle.checked) return;
  const { origin } = await getActiveOrigin();
  const key = "mem::" + origin; const obj = await chrome.storage.local.get(key);
  const arr = Array.isArray(obj[key]) ? obj[key] : [];
  const now = Date.now();
  arr.push({ role:"user", content:userText, ts: now });
  arr.push({ role:"assistant", content:assistantText, ts: now+1 });
  await chrome.storage.local.set({ [key]: arr.slice(-MAX_MEM) });
}

(async function init() {
  await loadPresets();
  const { origin } = await getActiveOrigin();
  siteLabel.textContent = origin.replace(/^https?:\/\//,"");
  const { siteMemoryEnabled } = await chrome.storage.sync.get("siteMemoryEnabled");
  memoryToggle.checked = !!siteMemoryEnabled;
  memoryToggle.addEventListener("change", async () => {
    await chrome.storage.sync.set({ siteMemoryEnabled: memoryToggle.checked });
  });
})();
