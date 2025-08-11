
let panel, output, input, sysInput, modelSel, memoryOn = false;
function getThemeSync() { return new Promise(r=>chrome.storage.sync.get("theme", v=>r(v.theme||"dark"))); }
function styleBtn(b){ b.style.cssText="border:0;background:linear-gradient(180deg,#12afa9,#0e8f8b);color:#fff;border-radius:12px;padding:8px 12px;cursor:pointer;font-weight:600;box-shadow:0 6px 16px rgba(18,175,169,.25)"; }
function styleGhost(b){ b.style.cssText="border:1px solid #1e2a36;background:#121b25;color:#e6eef7;border-radius:12px;padding:8px 12px;cursor:pointer;font-weight:600"; }
function escapeHtml(s){ return s.replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function mdLite(md){ let safe=escapeHtml(md); safe=safe.replace(/```([\s\S]*?)```/g,(_,c)=>`<pre><code>${c}</code></pre>`); safe=safe.replace(/`([^`]+)`/g,(_,c)=>`<code>${c}</code>`); return safe; }
async function ensurePanel(){
  if (panel && document.body.contains(panel)) return panel;
  const light = (await getThemeSync()) === "light";
  panel = document.createElement("div");
  Object.assign(panel.style,{position:"fixed",top:"0",right:"0",width:"480px",height:"62vh",maxHeight:"90vh",
    background:light?"#ffffff":"#0f1720",borderLeft:"1px solid "+(light?"#e6ecf2":"#1e2a36"),borderBottom:"1px solid "+(light?"#e6ecf2":"#1e2a36"),
    boxShadow:light?"0 8px 22px rgba(0,0,0,.12)":"-8px 0 24px rgba(0,0,0,.35)",zIndex:2147483647,display:"flex",flexDirection:"column",
    color:light?"#0b0f14":"#e6eef7",fontFamily:"ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, Noto Sans, Helvetica Neue, sans-serif"});
  const header=document.createElement("div");
  header.style.cssText="display:flex;align-items:center;justify-content:space-between;padding:10px;border-bottom:1px solid "+(light?"#e6ecf2":"#1e2a36")+";background:linear-gradient(180deg,#12afa9,#0e8f8b);color:#fff";
  const title=document.createElement("div"); title.textContent="PRO ChatGPT Chrome Extension"; title.style.fontWeight="800";
  const tools=document.createElement("div"); tools.style.display="flex"; tools.style.gap="8px"; tools.style.alignItems="center";
  const handle=document.createElement("div"); handle.textContent="⋮⋮"; handle.title="Drag to resize"; handle.style.cssText="cursor:ew-resize;background:rgba(255,255,255,.18);padding:3px 6px;border-radius:8px";
  const close=document.createElement("button"); close.textContent="×"; close.style.cssText="border:0;background:rgba(255,255,255,.18);color:#fff;font-size:18px;border-radius:8px;cursor:pointer;padding:2px 8px";
  tools.appendChild(handle); tools.appendChild(close); header.appendChild(title); header.appendChild(tools); panel.appendChild(header);
  const controls=document.createElement("div");
  controls.style.cssText="display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:10px;border-bottom:1px solid "+(light?"#e6ecf2":"#1e2a36");
  const model=document.createElement("select"); model.innerHTML=`<option value="gpt-5-mini">gpt-5-mini</option><option value="gpt-5">gpt-5</option>`;
  model.style.cssText="border:1px solid "+(light?"#e6ecf2":"#1e2a36")+";background:"+ (light?"#f2f5f8":"#121b25")+";color:inherit;border-radius:10px;padding:6px";
  const memLbl=document.createElement("label"); memLbl.textContent="Memory"; memLbl.style.marginLeft="4px";
  const mem=document.createElement("input"); mem.type="checkbox"; mem.style.marginRight="6px"; memLbl.prepend(mem);
  const useSel=document.createElement("button"); useSel.textContent="Insert Selection"; styleGhost(useSel);
  const summarize=document.createElement("button"); summarize.textContent="Summarize Page"; styleGhost(summarize);
  const copyBtn=document.createElement("button"); copyBtn.textContent="Copy"; styleGhost(copyBtn);
  const codeBtn=document.createElement("button"); codeBtn.textContent="Copy code"; styleGhost(codeBtn);
  controls.appendChild(model); controls.appendChild(memLbl); controls.appendChild(useSel); controls.appendChild(summarize); controls.appendChild(copyBtn); controls.appendChild(codeBtn);
  panel.appendChild(controls);
  sysInput=document.createElement("input"); sysInput.placeholder="System style (optional)…";
  sysInput.style.cssText="margin:10px;border:1px solid "+(light?"#e6ecf2":"#1e2a36")+";border-radius:10px;padding:8px;background:"+ (light?"#f2f5f8":"#121b25")+";color:inherit";
  panel.appendChild(sysInput);
  input=document.createElement("textarea"); input.placeholder="Ask about this page, code, or anything…";
  input.style.cssText="margin:0 10px 10px 10px;height:96px;border:1px solid "+(light?"#e6ecf2":"#1e2a36")+";border-radius:10px;padding:10px;resize:vertical;background:"+ (light?"#f2f5f8":"#121b25")+";color:inherit";
  panel.appendChild(input);
  const ask=document.createElement("button"); ask.textContent="Ask"; styleBtn(ask); ask.style.margin="0 10px 10px 10px"; panel.appendChild(ask);
  output=document.createElement("div"); output.style.cssText="flex:1;border-top:1px solid "+(light?"#e6ecf2":"#1e2a36")+";padding:10px;overflow:auto;white-space:pre-wrap"; output.textContent="Ready."; panel.appendChild(output);
  let dragging=false; handle.addEventListener("mousedown",e=>{dragging=true;e.preventDefault();});
  window.addEventListener("mousemove",e=>{ if(!dragging) return; const nw=Math.max(320, Math.min(760, window.innerWidth - e.clientX)); panel.style.width=nw+"px"; });
  window.addEventListener("mouseup",()=>dragging=false);
  close.addEventListener("click",()=>panel.remove()); mem.addEventListener("change",()=>memoryOn=mem.checked);
  useSel.addEventListener("click",()=>{ const sel=getSelection()?.toString()||""; if(sel){ const s=input.selectionStart??input.value.length; const e=input.selectionEnd??input.value.length; input.value=input.value.slice(0,s)+sel+input.value.slice(e); input.selectionStart=input.selectionEnd=s+sel.length; }});
  summarize.addEventListener("click",()=>{ const text=document.body.innerText.slice(0,20000); askWithHistory("Summarize this page in 8 bullets with a 2-sentence TL;DR, then list 3 follow-up questions.\n\nPAGE CONTENT:\n"+text); });
  copyBtn.addEventListener("click", async()=>await navigator.clipboard.writeText(output.textContent));
  codeBtn.addEventListener("click", async()=>await navigator.clipboard.writeText("```text\n"+output.textContent+"\n```"));
  ask.addEventListener("click",()=>{ const q=input.value.trim(); if(!q) return; askWithHistory(q); });
  modelSel=model; document.body.appendChild(panel); return panel;
}
function getOriginKey(){ return "mem::"+(location.origin||"inline"); }
function getMem(){ const k=getOriginKey(); return new Promise(r=>chrome.storage.local.get(k,o=>r(Array.isArray(o[k])?o[k]:[]))); }
function setMem(arr){ const k=getOriginKey(); return new Promise(r=>chrome.storage.local.set({[k]:arr}, r)); }
function toApiHistory(arr){ return arr.slice(-12).map(m=>({role:m.role, content:m.content})); }
function askWithHistory(prompt){
  ensurePanel(); output.innerHTML=""; const port=chrome.runtime.connect({name:"gpt-inline"});
  const system=sysInput.value||undefined; const model=modelSel.value;
  (async()=>{
    const hist=memoryOn?toApiHistory(await getMem()):[];
    port.postMessage({type:"ask", prompt, model, system, history: hist});
    let buffer=""; port.onMessage.addListener(async(msg)=>{
      if(msg.type==="chunk"){ buffer+=msg.text; output.innerHTML=mdLite(buffer); }
      else if(msg.type==="error"){ output.textContent="Error: "+msg.message; }
      else if(msg.type==="done"){ if(memoryOn){ const arr=await getMem(); const now=Date.now(); arr.push({role:"user",content:prompt,ts:now}); arr.push({role:"assistant",content:buffer,ts:now+1}); await setMem(arr.slice(-12)); } }
    });
  })();
}
chrome.runtime.onMessage.addListener((msg)=>{
  if(msg?.type==="JB_TOGGLE_PANEL"){
    ensurePanel().then(()=>{
      if(msg.preset){ const s=input.selectionStart??input.value.length; const e=input.selectionEnd??input.value.length; input.value=input.value.slice(0,s)+msg.preset+input.value.slice(e); input.selectionStart=input.selectionEnd=s+msg.preset.length; }
      else { panel.style.display = "flex"; }
    });
  }
});
