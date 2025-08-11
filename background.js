
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({ id: "ask-gpt", title: 'Ask Jberry-GPT about: "%s"', contexts: ["selection"] });
  chrome.contextMenus.create({ id: "ask-gpt-inline", title: "Ask in Jberry-GPT sidebar", contexts: ["selection","page"] });
});

async function getApiKey() {
  const { OPENAI_API_KEY } = await chrome.storage.sync.get("OPENAI_API_KEY");
  if (!OPENAI_API_KEY) throw new Error("No API key set. Open Options to add your API key.");
  return OPENAI_API_KEY;
}
async function askOnce(prompt, model = "gpt-5.1-mini", system = "You are a helpful assistant.") {
  const key = await getApiKey();
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages: [{ role:"system", content: system }, { role:"user", content: prompt }], stream:false })
  });
  const data = await r.json();
  if (data.error) throw new Error(data.error.message || "OpenAI error");
  return data.choices?.[0]?.message?.content || "No answer.";
}
function streamToPort(port, { model, messages }) {
  (async () => {
    let key;
    try { key = await getApiKey(); } catch (e) { port.postMessage({ type:"error", message: e.message }); return; }
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: model || "gpt-5.1-mini", messages, stream: true })
      });
      if (!res.ok || !res.body) { port.postMessage({ type:"error", message: "HTTP " + res.status }); return; }
      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let done = false, buffer = "";
      while (!done) {
        const r = await reader.read();
        done = r.done;
        buffer += decoder.decode(r.value || new Uint8Array(), { stream: !done });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";
        for (const part of parts) {
          const line = part.trim();
          if (!line) continue;
          if (line.startsWith("data: ")) {
            const dataStr = line.replace(/^data:\s*/, "");
            if (dataStr === "[DONE]") { port.postMessage({ type:"done" }); return; }
            try {
              const data = JSON.parse(dataStr);
              const delta = data.choices?.[0]?.delta?.content;
              if (delta) port.postMessage({ type:"chunk", text: delta });
            } catch {}
          }
        }
      }
      port.postMessage({ type:"done" });
    } catch (err) {
      port.postMessage({ type:"error", message: err.message || String(err) });
    }
  })();
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "ask-gpt") {
    try {
      const answer = await askOnce(info.selectionText || "Explain this page.");
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (text) => {
          let box = document.getElementById("jb-gpt-box");
          if (!box) {
            box = document.createElement("div");
            box.id = "jb-gpt-box";
            Object.assign(box.style, {
              position: "fixed", top: "12px", right: "12px", width: "380px", maxHeight: "72vh", overflow: "auto",
              background: "white", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "12px",
              boxShadow: "0 10px 30px rgba(0,0,0,.2)", fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
              fontSize: "14px", lineHeight: "1.5", zIndex: 2147483647
            });
            const bar = document.createElement("div");
            bar.style.cssText = "display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;";
            const title = document.createElement("strong"); title.textContent = "Jberry-GPT";
            const close = document.createElement("button"); close.textContent = "×";
            Object.assign(close.style, { border:"none", background:"transparent", fontSize:"20px", cursor:"pointer" });
            close.addEventListener("click", () => box.remove());
            bar.appendChild(title); bar.appendChild(close);
            box.appendChild(bar);
            const content = document.createElement("div"); content.id = "jb-gpt-content";
            box.appendChild(content);
            document.body.appendChild(box);
          }
          document.getElementById("jb-gpt-content").textContent = text;
        },
        args: [answer]
      });
    } catch(e) { console.error(e); }
  } else if (info.menuItemId === "ask-gpt-inline") {
    chrome.tabs.sendMessage(tab.id, { type: "JB_TOGGLE_PANEL", preset: info.selectionText || "" });
  }
});

chrome.commands.onCommand.addListener(async (command, tab) => {
  if (command === "toggle_inline_panel") {
    if (!tab || !tab.id) {
      const [active] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (active?.id) chrome.tabs.sendMessage(active.id, { type: "JB_TOGGLE_PANEL" });
    } else {
      chrome.tabs.sendMessage(tab.id, { type: "JB_TOGGLE_PANEL" });
    }
  }
});

chrome.runtime.onConnect.addListener((port) => {
  port.onMessage.addListener((msg) => {
    if (msg.type !== "ask") return;
    const { prompt, model, system, history } = msg;
    const messages = [];
    if (system) messages.push({ role:"system", content: system });
    if (Array.isArray(history)) messages.push(...history);
    messages.push({ role:"user", content: prompt });
    streamToPort(port, { model, messages });
  });
});
