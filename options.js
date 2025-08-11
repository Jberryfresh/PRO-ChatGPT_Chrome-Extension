
const keyEl = document.getElementById("key"); const keyMsg = document.getElementById("keyMsg"); const themeEl = document.getElementById("theme");
async function loadKey(){ const { OPENAI_API_KEY } = await chrome.storage.sync.get("OPENAI_API_KEY"); if (OPENAI_API_KEY) keyEl.value = OPENAI_API_KEY; }
document.getElementById("saveKey").addEventListener("click", async () => { await chrome.storage.sync.set({ OPENAI_API_KEY: keyEl.value.trim() }); keyMsg.textContent = "Saved API key."; });
(async function initTheme(){ const { theme = "dark" } = await chrome.storage.sync.get("theme"); themeEl.value = theme; themeEl.addEventListener("change", async () => { await chrome.storage.sync.set({ theme: themeEl.value }); }); })();
const presetTableBody = document.querySelector("#presetTable tbody"); const pname = document.getElementById("pname"); const ptext = document.getElementById("ptext"); const presetMsg = document.getElementById("presetMsg");
const DEFAULTS = [
  { name: "ELI5", text: "Explain this like I am five years old, with a simple example." },
  { name: "Debug my code", text: "Read this code, find bugs, and propose a minimal fix:\n\n" },
  { name: "Unit tests", text: "Write unit tests for this function using Jest, then explain edge cases:\n\n" },
  { name: "Summarize", text: "Summarize into 5 key bullets and a 2-sentence TL;DR:\n\n" },
  { name: "Docs writer", text: "Turn this into clear documentation with examples:\n\n" }
];
async function loadPresets(){ const { presets } = await chrome.storage.sync.get("presets"); return (Array.isArray(presets) && presets.length) ? presets : DEFAULTS; }
function renderPresets(list){
  presetTableBody.innerHTML = "";
  list.forEach((p, idx) => {
    const tr = document.createElement("tr");
    const td1 = document.createElement("td"); const td2 = document.createElement("td"); const td3 = document.createElement("td");
    const in1 = document.createElement("input"); in1.value = p.name; in1.style.width = "100%";
    const in2 = document.createElement("textarea"); in2.value = p.text; in2.rows = 3; in2.style.width = "100%";
    const del = document.createElement("button"); del.textContent = "Delete"; del.className = "ghost";
    del.addEventListener("click", async () => { list.splice(idx,1); await chrome.storage.sync.set({ presets: list }); renderPresets(list); });
    in1.addEventListener("change", async () => { p.name = in1.value; await chrome.storage.sync.set({ presets: list }); });
    in2.addEventListener("change", async () => { p.text = in2.value; await chrome.storage.sync.set({ presets: list }); });
    td1.appendChild(in1); td2.appendChild(in2); td3.appendChild(del); tr.appendChild(td1); tr.appendChild(td2); tr.appendChild(td3); presetTableBody.appendChild(tr);
  });
}
document.getElementById("addPreset").addEventListener("click", async () => {
  const name = pname.value.trim(); const text = ptext.value.trim();
  if (!name || !text) { presetMsg.textContent = "Name and text required."; return; }
  const list = await loadPresets();
  list.push({ name, text }); await chrome.storage.sync.set({ presets: list });
  pname.value = ""; ptext.value = ""; renderPresets(list); presetMsg.textContent = "Preset added.";
});
document.getElementById("resetDefaults").addEventListener("click", async () => { await chrome.storage.sync.set({ presets: DEFAULTS }); renderPresets([...DEFAULTS]); presetMsg.textContent = "Reset to defaults."; });
(async function init(){ await loadKey(); const presets = await loadPresets(); renderPresets(presets); })();
