
// content.js — injects a resizable/streaming sidebar panel on demand
let panel, output, input, sysInput, modelSel, memoryOn = false, siteKey, history = [];

function ensurePanel() {
  if (panel && document.body.contains(panel)) return panel;
  panel = document.createElement("div");
  panel.id = "jb-inline-panel";
  Object.assign(panel.style, {
    position: "fixed", top: "0", right: "0",
    width: "420px", height: "60vh", maxHeight: "90vh",
    background: "white", borderLeft: "1px solid #e5e7eb", borderBottom: "1px solid #e5e7eb",
    boxShadow: "-8px 0 24px rgba(0,0,0,.15)",
    zIndex: 2147483647, display: "flex", flexDirection: "column"
  });

  // Header
  const header = document.createElement("div");
  header.style.cssText = "display:flex;align-items:center;justify-content:space-between;background:#111827;color:#fff;padding:8px 10px;";
  const title = document.createElement("div"); title.textContent = "Jberry-GPT Sidebar";
  title.style.fontWeight = "700";
  const btns = document.createElement("div"); btns.style.display = "flex"; btns.style.gap = "8px";
  const resize = document.createElement("div"); resize.textContent = "⋮⋮"; resize.title = "Drag left/right to resize";
  resize.style.cssText = "cursor: ew-resize; user-select:none; padding:4px 6px; background:#0ea5a4; border-radius:8px;";
  const close = document.createElement("button"); close.textContent = "×";
  Object.assign(close.style, { border:"none", background:"#0ea5a4", color:"#fff", fontSize:"18px", borderRadius:"8px", cursor:"pointer", padding:"2px 8px" });
  btns.appendChild(resize); btns.appendChild(close);
  header.appendChild(title); header.appendChild(btns);
  panel.appendChild(header);

  // Controls
  const controls = document.createElement("div");
  controls.style.cssText = "display:flex;gap:6px;align-items:center;padding:8px;flex-wrap:wrap;border-bottom:1px solid #eee;";
  modelSel = document.createElement("select");
  modelSel.innerHTML = `<option value="gpt-5.1-mini">gpt-5.1-mini</option><option value="gpt-5.1">gpt-5.1</option>`;
  const memLbl = document.createElement("label"); memLbl.style.display = "inline-flex"; memLbl.style.alignItems = "center"; memLbl.style.gap = "6px";
  const memChk = document.createElement("input"); memChk.type = "checkbox"; memLbl.appendChild(memChk); memLbl.appendChild(document.createTextNode("Memory"));
  const useSel = document.createElement("button"); useSel.textContent = "Insert Selection"; styleBtn(useSel);
  const summarize = document.createElement("button"); summarize.textContent = "Summarize Page"; styleBtn(summarize);
  const copyBtn = document.createElement("button"); copyBtn.textContent = "Copy"; styleBtn(copyBtn);
  const codeBtn = document.createElement("button"); codeBtn.textContent = "Copy code"; styleBtn(codeBtn);
  controls.appendChild(modelSel); controls.appendChild(memLbl); controls.appendChild(useSel); controls.appendChild(summarize); controls.appendChild(copyBtn); controls.appendChild(codeBtn);
  panel.appendChild(controls);

  // Inputs
  sysInput = document.createElement("input"); sysInput.placeholder = "System style (optional)…";
  sysInput.style.cssText = "margin:8px;border:1px solid #e5e7eb;border-radius:8px;padding:6px;";
  panel.appendChild(sysInput);
  input = document.createElement("textarea"); input.placeholder = "Ask about this page, code, or anything…";
  input.style.cssText = "margin:0 8px 8px 8px;height:96px;border:1px solid #e5e7eb;border-radius:10px;padding:8px;resize:vertical;";
  panel.appendChild(input);
  const ask = document.createElement("button"); ask.textContent = "Ask"; styleBtn(ask); ask.style.margin = "0 8px 8px 8px";
  ask.style.background = "#111827"; ask.style.color="#fff";
  panel.appendChild(ask);

  // Output
  output = document.createElement("div");
  output.style.cssText = "flex:1;border-top:1px solid #eee;padding:10px;overflow:auto;white-space:pre-wrap;";
  output.textContent = "Ready.";
  panel.appendChild(output);

  // Resizing logic
  let resizing = false;
  resize.addEventListener("mousedown", (e) => { resizing = true; e.preventDefault(); });
  window.addEventListener("mousemove", (e) => {
    if (!resizing) return;
    const newWidth = Math.max(300, Math.min(720, window.innerWidth - e.clientX));
    panel.style.width = newWidth + "px";
  });
  window.addEventListener("mouseup", () => { resizing = false; });

  // Close
  close.addEventListener("click", () => panel.remove());

  // Memory
  memChk.addEventListener("change", async () => {
    memoryOn = memChk.checked;
  });

  // Buttons
  useSel.addEventListener("click", () => {
    const sel = getSelection()?.toString() || "";
    if (sel) insertAtCursor(input, sel);
  });
  summarize.addEventListener("click", () => {
    const text = document.body.innerText.slice(0, 20000);
    askWithHistory("Summarize this page in 8 bullets with a 2-sentence TL;DR, then list 3 follow-up questions.\n\nPAGE CONTENT:\n" + text);
  });
  copyBtn.addEventListener("click", async () => {
    await navigator.clipboard.writeText(output.textContent);
  });
  codeBtn.addEventListener("click", async () => {
    await navigator.clipboard.writeText("```text\n" + output.textContent + "\n```");
  });

  // Ask
  ask.addEventListener("click", () => {
    const q = input.value.trim(); if (!q) return;
    askWithHistory(q);
  });

  document.body.appendChild(panel);
  return panel;
}

function styleBtn(b) { b.style.cssText = "border:none;background:#0ea5a4;color:#fff;border-radius:10px;padding:6px 10px;cursor:pointer;"; }

function insertAtCursor(el, text) {
  const start = el.selectionStart ?? el.value.length;
  const end = el.selectionEnd ?? el.value.length;
  el.value = el.value.slice(0,start) + text + el.value.slice(end);
  el.selectionStart = el.selectionEnd = start + text.length;
  el.focus();
}

function getOriginKey() {
  const origin = location.origin || "inline";
  return "mem::" + origin;
}

async function getMem() {
  const key = getOriginKey();
  const obj = await chrome.storage.local.get(key);
  return Array.isArray(obj[key]) ? obj[key] : [];
}
async function setMem(arr) {
  const key = getOriginKey();
  await chrome.storage.local.set({ [key]: arr });
}

function toApiHistory(arr) {
  return arr.slice(-12).map(m => ({ role: m.role, content: m.content }));
}

function askWithHistory(prompt) {
  ensurePanel();
  output.textContent = "";
  const port = chrome.runtime.connect({ name: "gpt-inline" });
  const system = sysInput.value || undefined;
  const model = modelSel.value;
  (async () => {
    const hist = memoryOn ? toApiHistory(await getMem()) : [];
    port.postMessage({ type:"ask", prompt, model, system, history: hist });
    // Also append to memory after streaming ends
    let buffer = "";
    port.onMessage.addListener(async (msg) => {
      if (msg.type === "chunk") { buffer += msg.text; output.textContent += msg.text; }
      else if (msg.type === "error") { output.textContent = "Error: " + msg.message; }
      else if (msg.type === "done") {
        if (memoryOn) {
          const arr = await getMem();
          const now = Date.now();
          arr.push({ role:"user", content: prompt, ts: now });
          arr.push({ role:"assistant", content: buffer, ts: now+1 });
          await setMem(arr.slice(-12));
        }
      }
    });
  })();
}

// Listen for background toggle or preset insert
chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === "JB_TOGGLE_PANEL") {
    ensurePanel();
    if (msg.preset) insertAtCursor(input, msg.preset);
    else if (panel && panel.parentElement) {
      // if already open with no preset, toggle close
      // simple toggle: if focused and empty, close; else bring to front
      if (panel.style.display === "none") panel.style.display = "flex";
      else if (document.activeElement === input && !input.value.trim()) panel.remove();
      else panel.style.display = "flex";
    }
  }
});
