# Face Swap Booth

End-to-end guide to run the React/Vite frontend, the Flask backend, and expose the API through a Cloudflare Tunnel.

## Prerequisites
- Node.js 18 or newer and `npm`
- `pyenv` (recommended) with Python 3.11.x available, or a system-wide Python 3.11
- `cloudflared` CLI for tunneling (install via `brew install cloudflared` on macOS)
- macOS or Linux terminal; commands assume zsh/bash

## 1. Clone & Install Frontend Dependencies
```bash
npm install
```
This installs all packages declared in `package.json` (React, Vite, Tailwind, etc.).

## 2. Prepare Python 3.11 Environment
Using `pyenv` keeps the project pinned to Python 3.11 while other versions (like 3.13) remain available.
```bash
pyenv install 3.11.8          # skip if already installed
pyenv local 3.11.8            # writes .python-version inside the repo
python -m venv .venv          # creates virtual env with the pyenv-selected interpreter
source .venv/bin/activate     # activate the venv (Windows: .venv\Scripts\activate)
pip install --upgrade pip
pip install -r src/server/requirements.txt
```
If `python` is still not found after `pyenv local`, confirm `eval "$(pyenv init -)"` exists at the end of `~/.zshrc`, then restart the shell.

## 3. Configure API Base URL (optional but recommended)
The frontend talks to the Flask API via `API_BASE_URL` in `src/server/api.jsx`. For a local-only environment set:
```js
const API_BASE_URL = "http://127.0.0.1:5000/api";
```
Switch this value to your Cloudflare tunnel URL once the API is exposed.

## 4. Run the Flask Backend
In one terminal (venv active):
```bash
python src/server/app.py
```
The server listens on `http://127.0.0.1:5000` with REST endpoints under `/api`.

## 5. Run the Vite Frontend
In a separate terminal:
```bash
npm run dev
```
Vite serves the React app (default `http://localhost:5173`). The UI reads the QR/print configuration and calls the API base you set in step 3.

## 6. Expose the API with Cloudflare Tunnel (Quick Tunnel)
For the fastest option without DNS setup, run:
```bash
cloudflared tunnel --url http://localhost:5000
```
Cloudflare prints a temporary `.trycloudflare.com` URL you can drop into `API_BASE_URL` while it runs.

## 7. Updating the Frontend to Use the Tunnel
When the tunnel URL is ready, set `API_BASE_URL` in `src/server/api.jsx` to the tunnel origin (e.g., `https://faceswap.example.com/api` or the `.trycloudflare.com` host). Rebuild/restart the frontend if it was running.

If the Vite dev server still proxies to `http://127.0.0.1:5000`, update `vite.config.js` so the `/api` proxy target matches your Cloudflare URL, for example:

```js
// vite.config.js
"/api": {
  target: "https://faceswap.trycloudflare.com",
  changeOrigin: true
}
```

## Troubleshooting
- **Python still reports 3.13**: Ensure `.python-version` exists and pyenv is initialized in the shell profile. Running `pyenv which python` should return a 3.11 path inside `~/.pyenv/versions/3.11.x/`.
- **`pip install` fails on `pycups`**: Install system dependencies (`brew install cups` on macOS) or skip printing features by commenting them in `src/server/requirements.txt`.
- **Cloudflare tunnel can’t start**: Verify the credentials file path matches `cloudflared tunnel info pvm-faceswap` output, and that the chosen hostname has a DNS record managed by Cloudflare.
- For overseas phone numbers, you must use `+`

With these steps completed, the React frontend runs locally, the Flask backend serves data at port 5000, and Cloudflare tunnels your API for remote access.
