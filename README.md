
# PRO ChatGPT Chrome Extension — v1.2

New in this build
- **Inline streaming sidebar panel** injected into any page (toggle with **Alt+J** or context menu “Ask in Jberry-GPT sidebar”). Streams tokens live, supports site memory, copy/copy-as-code, and “Insert Selection” / “Summarize Page” actions.
- **Resizable panel**: drag the turquoise handle (⋮⋮) in the header to resize, 300–720px width.
- **Hotkey**: Alt+J toggles the panel on the current tab.

Setup
1) Load unpacked via `chrome://extensions` (Developer mode).
2) Open **Options** to paste your API key.
3) Use Alt+J or right‑click to open the inline panel; the toolbar popup from v1.1 still works.

Notes
- The inline panel connects to the background with a Port named `gpt-inline` for token streaming.
- Per‑site memory is stored under `mem::<origin>` in `chrome.storage.local`.
