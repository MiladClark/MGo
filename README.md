# MGo

A modern, bilingual chat interface for **local LLMs** powered by [LM Studio](https://lmstudio.ai/). Built with **Tauri 2** and **React**, MGo offers a polished desktop experience with first-class **Persian (RTL)** and **English** support.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Tauri](https://img.shields.io/badge/Tauri-2-24C8DB?logo=tauri)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)

![MGo — Persian RTL chat UI for LM Studio](docs/screenshot-home.png)

---

## Features

- **LM Studio integration** — OpenAI-compatible API (`/v1/models`, streaming chat completions)
- **Streaming responses** — Real-time token streaming with stop generation
- **Multiple conversations** — Create, rename, delete, and switch chats; persisted locally
- **Persian-first UX** — RTL layout, Vazirmatn font, default Persian system prompts
- **Bilingual UI** — Persian and English (i18n via `react-i18next`)
- **Dark & light themes** — System-aware styling with smooth transitions
- **Attachments** — Images and text files in chat (vision-capable models)
- **Markdown rendering** — GFM, syntax highlighting for code blocks
- **Settings panel** — Connection, model, inference params, locale, and theme
- **Cross-platform desktop** — Windows, macOS, and Linux via Tauri 2
- **Browser dev mode** — Vite dev server with CORS proxy for local LM Studio

---

## Screenshots

The home screen above shows the Persian RTL layout: sidebar, model selector, connection status, and suggestion prompts.

---

## Tech Stack

| Layer | Technologies |
|--------|----------------|
| Desktop | [Tauri 2](https://v2.tauri.app/), Rust |
| Frontend | React 19, TypeScript, Vite 7 |
| Styling | Tailwind CSS v4, Radix UI primitives |
| State | Zustand |
| i18n | react-i18next |
| Markdown | react-markdown, remark-gfm, rehype-highlight |
| Persistence | `localStorage` (browser) / Tauri plugin-store (desktop) |

---

## Prerequisites

### All platforms

- [Node.js](https://nodejs.org/) 20+
- [LM Studio](https://lmstudio.ai/) with **Developer → Start Server** enabled (default: `http://127.0.0.1:1234`)

### Desktop build (Tauri)

- [Rust](https://rustup.rs/) (latest stable)
- **Windows:** [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) with **Desktop development with C++** (MSVC + Windows SDK)
- **macOS:** Xcode Command Line Tools
- **Linux:** See [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/)

---

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/mgo.git
cd mgo
npm install
```

### 2. Start LM Studio

1. Open LM Studio and load a model.
2. Go to **Developer** → **Start Server**.
3. Confirm the server URL (default): `http://127.0.0.1:1234`

### 3. Run in the browser (development)

```bash
npm run mgo
```

Open [http://localhost:1420](http://localhost:1420).

While `mgo` is running, API calls to local LM Studio are proxied through `/api/lmstudio` to avoid browser CORS issues.

### 4. Run as a desktop app (development)

```bash
npm run tauri dev
```

---

## Build

### Web (static assets)

```bash
npm run build
npm run preview   # optional: preview production build
```

Output: `dist/`

### Desktop installer

```bash
npm run tauri build
```

Installers are generated under:

```
src-tauri/target/release/bundle/
```

(e.g. `.msi` / `.exe` on Windows, `.dmg` on macOS, `.AppImage` / `.deb` on Linux)

---

## Configuration

Open **Settings** from the sidebar (slides in from the right in Persian, from the left in English).

| Setting | Default | Description |
|---------|---------|-------------|
| **Base URL** | `http://127.0.0.1:1234/v1` | LM Studio OpenAI-compatible endpoint |
| **API Key** | *(empty)* | Optional; leave blank for local LM Studio |
| **Default model** | — | Selected from loaded models after connection test |
| **Temperature / Max tokens / Top P** | 0.7 / 2048 / 0.95 | Inference parameters |
| **Language** | Persian (`fa`) | UI language and document direction |
| **Theme** | Dark | Light or dark mode |

Settings are saved automatically (`mgo:settings` in browser storage, Tauri store on desktop).

---

## Project Structure

```
mgo/
├── src/
│   ├── app/              # App shell layout
│   ├── assets/           # MGo logos (PNG)
│   ├── components/       # Shared UI (Logo, ThemeToggle, shadcn-style)
│   ├── features/
│   │   ├── chat/         # ChatArea, MessageBubble, ChatInput
│   │   ├── conversations/# Sidebar, conversation list
│   │   └── settings/     # SettingsPanel (slide-over)
│   ├── lib/
│   │   ├── lmstudio/     # API client, SSE streaming, dev proxy URL resolver
│   │   ├── i18n/         # Locales (fa, en)
│   │   ├── persist.ts    # Storage abstraction
│   │   └── persian.ts    # RTL prompts and text helpers
│   └── stores/           # Zustand (settings, chat, conversations, UI)
├── src-tauri/            # Tauri Rust backend
├── public/               # Static assets (favicons)
└── vite.config.ts        # Dev server + LM Studio proxy
```

---

## Development Notes

### CORS in the browser

Browsers block direct requests from `localhost:1420` to `127.0.0.1:1234`. In development, `resolveApiBase()` routes local LM Studio URLs through the Vite proxy:

```
/api/lmstudio/v1 → http://127.0.0.1:1234/v1
```

Production Tauri builds talk to LM Studio directly (no CORS in the webview).

### Persian / RTL

- Document `dir` and `lang` follow the selected locale (`fa` → RTL, `en` → LTR).
- Assistant replies use RTL by default; code blocks remain LTR.
- Sidebar is positioned on the **right** in RTL layout.

### Streaming scroll behavior

While the model is streaming, the chat does **not** force-scroll to the bottom. You can scroll up freely; auto-follow only resumes when you scroll near the bottom or send a new message.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run mgo` | Start MGo dev server (Vite) on port `1420` |
| `npm run build` | Type-check and build frontend to `dist/` |
| `npm run preview` | Preview production build |
| `npm run tauri dev` | Run Tauri app in development (uses `npm run mgo` internally) |
| `npm run tauri build` | Build desktop installers |

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| **Connection failed** | Ensure LM Studio server is running; check Base URL ends with `/v1` |
| **`link.exe` not found** (Windows) | Install Visual Studio C++ Build Tools |
| **Port 1420 in use** | Stop other dev servers or change port in `vite.config.ts` |
| **No models in dropdown** | Click **Test connection** in Settings; load a model in LM Studio |
| **Black / loading screen** | Hard refresh; clear `localStorage` keys prefixed with `mgo:` |

---

## Contributing

Contributions are welcome. Please open an issue or pull request with a clear description of changes.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-change`)
3. Commit your changes
4. Push and open a PR

---

## License

This project is licensed under the [MIT License](LICENSE).

---

## Acknowledgments

- [LM Studio](https://lmstudio.ai/) for local inference
- [Tauri](https://v2.tauri.app/) for the desktop shell
- [Vazirmatn](https://github.com/rastikerdar/vazirmatn) — Persian typeface (loaded via Google Fonts)
