
# PRO ChatGPT Chrome Extension

A modern, professional browser extension that brings ChatGPT directly into your workflow.  
Stream responses in a sleek popup or on-demand inline panel, save site-specific memory, manage presets, and more.

---

## Features

- **Modern UI** — Dark/Light themes, rounded corners, subtle shadows, and polished layouts.
- **Streaming Responses** — See ChatGPT's output in real-time.
- **Presets** — Save and quickly reuse your favorite prompts.
- **Copy Helpers** — Copy entire responses or just formatted code blocks.
- **Context Menu Integration** — Highlight text on any webpage and right-click to send it to ChatGPT.
- **Site Memory** — Save notes and data tied to specific domains (removed in v1.3.1 for review compliance).
- **Keyboard Shortcut** — (Alt+J) to open inline panel (removed in v1.3.1 for review compliance).
- **Options Page** — Configure API key, theme, and presets easily.

---

## Installation (Developer Mode)

1. Download the latest release ZIP from the [Releases](#) section.
2. Unzip the file.
3. Open `chrome://extensions` in your browser.
4. Enable **Developer Mode** in the top-right corner.
5. Click **Load unpacked** and select the unzipped folder.

---

## Permissions

- **storage** — Save settings locally.
- **activeTab** — Access the current tab's content on user action.
- **scripting** — Inject scripts when needed for context menu or summarization.
- **contextMenus** — Add right-click menu options.
- **tabs** — Required for tab info when using activeTab actions.

---

## Data Usage

The extension:
- Stores your **OpenAI API key** locally in Chrome storage (never sent anywhere except OpenAI).
- Sends only the text you explicitly provide (or select) to the OpenAI API.
- Does not collect analytics or sell user data.
- Does not run scripts automatically on pages without user interaction.

---

## Version Log

### v1.3.1 — Review-Friendly Build
- **Removed host_permissions** to comply with Chrome Web Store review guidelines.
- Removed always-on content scripts and inline panel feature.
- Kept popup, presets, theme switching, context menu actions, and summarize-page function.
- Manifest cleaned to only request permissions on explicit user action.

### v1.3 — Modern UI Upgrade
- Complete visual redesign with CSS variables for easy theming.
- Added Dark/Light theme toggle.
- Refined inline panel with gradient header and draggable resize.
- Markdown rendering for code blocks.
- Kept streaming, site memory, and presets.

### v1.2 — Feature Expansion
- Added site-specific memory system.
- Added Alt+J shortcut to toggle inline panel.
- Added copy-as-code-block option.
- Added Summarize Page context menu item.

### v1.1 — Streaming & Presets
- Introduced streaming responses for both popup and inline panel.
- Added preset management for reusable prompts.

### v1.0 — Initial Release
- Basic popup UI.
- Connect to OpenAI API with your API key.
- Send prompts and receive responses.
- Minimal styling.

---

## License
This project is licensed under the [MIT License](LICENSE).

