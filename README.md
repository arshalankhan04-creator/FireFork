# FireFork

FireFork is a restaurant website built with a vanilla HTML/CSS/JS frontend and a Node.js backend. The backend uses Node's raw `http.createServer` (no Express) and stores data — reservations, menu items — in a SQLite database via `better-sqlite3`. There is no frontend build step; HTML files are served as static files.

---

## Folder Structure

```
FIREFORK/
├── assets/           # Images, fonts
├── components/       # Shared HTML components
├── scripts/          # Frontend JS (config.js, form.js, pos.js, etc.)
├── styles/           # CSS files
├── backend/
│   ├── database/     # SQL schema and seed files
│   ├── routes/       # API route handlers
│   ├── scripts/      # DB init scripts
│   ├── utils/        # Utilities
│   ├── config.js
│   ├── db.js
│   ├── db-sqlite.js
│   ├── server.js
│   └── package.json
├── index.html
├── menu.html
├── form.html
├── pos.html
├── bill.html
├── story.html
├── experience.html
├── render.yaml
└── README.md
```

---

## Tech Stack

| Layer    | Technology                                      |
|----------|-------------------------------------------------|
| Frontend | Vanilla HTML, CSS, JavaScript (no build step)   |
| Backend  | Node.js, raw `http.createServer` (no Express)   |
| Database | SQLite via `better-sqlite3`                     |
| Config   | `dotenv`                                        |

---

## Local Development

1. **Clone the repo**
   ```bash
   git clone https://github.com/arshalankhan04-creator/FireFork.git
   cd FireFork
   ```

2. **Install backend dependencies**
   ```bash
   cd backend && npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and set any required variables (e.g. `PORT`, `FRONTEND_URL`).

4. **Initialize the SQLite database**
   ```bash
   node scripts/init-db.js
   ```

5. **Start the backend**
   ```bash
   node server.js
   ```
   The API listens on `http://localhost:3000`.

6. **Open the frontend**
   Open `index.html` directly in a browser. No server or build step required.

> `scripts/config.js` sets `apiBase` to `http://localhost:3000/api` for local development.

---

## Render Deployment

The repo includes a `render.yaml` Blueprint that provisions two services automatically.

1. **Push the repo to GitHub.**

2. **Create a Blueprint on Render**
   Go to [render.com](https://render.com) → New → Blueprint → connect the repo.
   Render will read `render.yaml` and create:
   - `firefork-api` — the Node.js backend service
   - `firefork-frontend` — the static site service

3. **Set environment variables** (after the first deploy)
   In the `firefork-api` service dashboard, add:
   - `FRONTEND_URL` → your static site URL (e.g. `https://firefork.onrender.com`)
   - `CORS_ALLOWED_ORIGINS` → same URL

4. **Point the frontend at the deployed API**
   In `scripts/config.js`, update `apiBase` to:
   ```
   https://firefork-api.onrender.com/api
   ```

5. **Commit and push** — the frontend static service redeploys automatically.

---

## SQLite on Free Tier

Render's free tier does not include persistent disk storage. SQLite data (reservations, etc.) **resets on every deploy or restart**.

To keep data between restarts:
- Uncomment the `disk` block in `render.yaml`
- Upgrade to a paid Render plan
- Set `DB_PATH=/var/data/firefork.db` in the `firefork-api` service dashboard
