# MusicHub

A premium, full-stack music streaming platform — original branding and UX,
built with React (Vite) on the frontend and Django REST Framework + MySQL
on the backend.

> **Build status:** All 15 phases complete, plus a bonus feature round and
> deployment prep. MusicHub is a fully working, tested full-stack music
> streaming platform — every page is real (no mockups), every button works,
> and the entire user journey (register → browse → search → play → like →
> build a playlist → manage your profile) plus the full Admin Dashboard have
> been verified end-to-end against the live backend. On top of the core
> build: **Live Lyrics** (LRC-timed, karaoke-style sync), an **Audio
> Waveform Visualizer** (4 modes, driven by a real Web Audio AnalyserNode),
> and a real **5-band Equalizer with presets + Sleep Timer** (an actual Web
> Audio filter chain, not a cosmetic slider). The project is now
> deployment-ready for **PythonAnywhere (backend) + Netlify (frontend)** —
> production security settings, `CSRF_TRUSTED_ORIGINS`, a `netlify.toml`
> with the SPA redirect React Router needs, and a full step-by-step deploy
> guide are all in place and verified (`ALLOWED_HOSTS` enforcement,
> `collectstatic`, and the production env all boot cleanly).

## Features (target scope)

- Browse, search (songs/artists/albums/playlists), and play music
- Global player that keeps running across page navigation (HTML5 Audio)
- Live Lyrics — LRC-timed sync with karaoke-style line highlighting and click-to-seek
- Audio Waveform Visualizer — 4 modes (Bars/Wave/Circular/Particles) reacting to real frequency data
- 5-band Equalizer (with presets) and a Sleep Timer, both backed by the Web Audio API
- Playlists: create, rename, delete, add/remove/reorder songs
- Liked songs, library, recently played
- Artist and album detail pages
- JWT authentication: register, login, logout, forgot password
- User profile & settings
- Admin dashboard: manage songs, artists, albums, playlists, users, genres, featured content

## Tech stack

- **Frontend:** React 19 (Vite), React Router, Axios, Context API (auth + player state), Bootstrap 5, react-toastify, lucide-react icons
- **Backend:** Django, Django REST Framework, Simple JWT, django-cors-headers, django-filter
- **Database:** MySQL (SQLite fallback for zero-config local dev)
- **Audio:** HTML5 Audio API

## Project structure

```
MusicHub/
  backend/
    config/          # Django project settings, root urls
    accounts/        # Custom User model, auth
    music/           # Artist, Album, Song, Genre (Phase 3)
    playlists/       # Playlists, likes, recently played (Phase 4)
    api/             # API root + shared routing
    requirements.txt
    .env.example
  frontend/
    src/
      components/    # MusicPlayer, cards, etc.
      pages/         # One file per route (16 pages)
      layouts/       # Sidebar, MobileNav, Header, MainLayout
      context/       # AuthContext, PlayerContext
      services/      # axios API client (JWT attach + refresh)
      hooks/
      utils/
    .env.example
```

## Backend setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

pip install -r requirements.txt
```

Create a MySQL database and copy the env file:

```bash
copy .env.example .env        # Windows
# cp .env.example .env        # macOS/Linux
```

Edit `.env`:

```
DB_ENGINE=mysql
DB_NAME=musichub_db
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_HOST=localhost
DB_PORT=3306
```

> Set `DB_ENGINE=sqlite` instead if you just want to run it immediately
> without setting up MySQL — no other changes needed.

```bash
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Backend runs at `http://127.0.0.1:8000`. API root: `http://127.0.0.1:8000/api/v1/`.

## Frontend setup

```bash
cd frontend
npm install
copy .env.example .env    # Windows, then edit if your backend runs elsewhere
npm run dev
```

Frontend runs at `http://localhost:5173`.

## Environment variables

**backend/.env**
| Variable | Purpose |
|---|---|
| `SECRET_KEY` | Django secret key |
| `DEBUG` | `True`/`False` |
| `ALLOWED_HOSTS` | Comma-separated hosts |
| `DB_ENGINE` | `mysql` or `sqlite` |
| `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` | MySQL connection |
| `CORS_ALLOWED_ORIGINS` | Frontend origin(s) allowed to call the API |

**frontend/.env**
| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Base URL of the backend API |

## API structure (so far)

```
GET   /api/v1/                        → API root / health check

Auth
POST  /api/v1/auth/register/
POST  /api/v1/auth/login/             → { identifier, password } — username OR email
POST  /api/v1/auth/logout/            → blacklists the refresh token
GET   /api/v1/auth/me/  | PATCH
POST  /api/v1/auth/change-password/
POST  /api/v1/auth/forgot-password/
POST  /api/v1/auth/reset-password/
POST  /api/v1/auth/refresh/

Music (read = public, write = staff/admin only)
/api/v1/genres/            (list, retrieve, CRUD)
/api/v1/artists/           (list, retrieve by slug, CRUD)
  /artists/{slug}/follow/   POST  (auth required)
  /artists/{slug}/unfollow/ POST  (auth required)
  /artists/featured/        GET
/api/v1/albums/            (list, retrieve by slug, CRUD)
  /albums/new_releases/     GET
/api/v1/songs/             (list, retrieve, CRUD)
  /songs/trending/          GET
  /songs/featured/          GET
  /songs/{id}/play/         POST  (increments global play_count, public)
  /songs/{id}/like-toggle/  POST (like) / DELETE (unlike)  — auth required
```

Playlists, likes, recently played, search
```
/api/v1/playlists/                    (list: own + public, retrieve, CRUD — owner only for write)
  /playlists/mine/                     GET   (auth required)
  /playlists/{id}/add_song/            POST  { song }
  /playlists/{id}/remove_song/         POST  { song }
  /playlists/{id}/reorder/             POST  { song_ids: [...] }
  /playlists/{id}/like/                POST
  /playlists/{id}/unlike/              POST
/api/v1/liked-songs/                   GET   (auth required)
/api/v1/recently-played/               GET   (auth required)
  /recently-played/record/             POST  { song }  — upserts, bumps play_count
  /recently-played/clear/              DELETE
/api/v1/search/?q=&type=songs|artists|albums|playlists   (omit type to search all four)

Admin (staff or is_admin_user only)
/api/v1/admin/users/           GET (list), PATCH (is_active / is_admin_user), DELETE
/api/v1/admin/playlists/       GET (list, any owner/visibility), DELETE (moderation)
```

All list endpoints support `?search=`, plus filtering/ordering (e.g.
`/albums/?album_type=single&ordering=-release_year`, `/songs/?artist=1`).

### Seed data

```bash
python manage.py seed_music
```

Populates a handful of original sample artists/albums/songs (with royalty-free
placeholder audio URLs) so the API and frontend have something real to show
while building. Two tracks ("Chrome Skyline", "Paper Lanterns") also get
sample timed lyrics so the Live Lyrics panel has something to demonstrate.

### Adding lyrics to a song

The Admin Dashboard's Songs tab has a Lyrics field that accepts simple
LRC-style timed text — one line per row:

```
[0:05] Yeah... I've been tryna call
[0:12] I've been on my own for long enough
[1:03.5] Maybe you can show me how to love, maybe
```

`[mm:ss]` or `[mm:ss.cc]` timestamps are both supported. Lines without a
valid `[time]` prefix are ignored. Leave the field blank and the Now
Playing / floating Lyrics panel will show "Lyrics aren't available for this
track yet" instead of guessing.

## Build plan (15 phases)

1. ✅ Project architecture & setup
2. ✅ Backend + frontend: Auth (register/login/logout/forgot-password, JWT)
3. ✅ Backend: Music core (Artist/Album/Song/Genre models + CRUD APIs)
4. ✅ Backend: Playlists, likes, recently played, search
5. ✅ Frontend: Home page (hero, sections, cards) — done ahead of app-shell polish since it needed the same components
6. ✅ Frontend: Global music player polish + Now Playing screen
7. ✅ Frontend: Search page
8. ✅ Frontend: Artist / Album / Playlist detail pages
9. ✅ Frontend: Library, Liked Songs, Recently Played (+ Playlists list, Explore)
11. ✅ Frontend: Auth pages, Profile, Settings
12. ✅ Frontend: Admin dashboard
13. ✅ Polish — animations, loading/empty states, toasts, responsive pass
14. ✅ Testing + finalize README + deployment notes
15. ✅ Final packaging

## Deployment — PythonAnywhere (backend) + Netlify (frontend)

This is the exact path this project is set up for. It's free-tier friendly:
SQLite instead of a paid MySQL add-on, no server config beyond what's below.

### Backend — PythonAnywhere

1. **Get the code onto PythonAnywhere.** Easiest: push `backend/` to a GitHub
   repo, then in a PythonAnywhere **Bash console**:
   ```bash
   git clone https://github.com/lalitsaini27/MusicHub.git
   cd MusicHub/backend   # or wherever backend/ ended up
   ```
   (No GitHub repo yet? Zip `backend/` and upload it via the **Files** tab instead, then unzip in a Bash console.)

2. **Create a virtualenv and install dependencies:**
   ```bash
   mkvirtualenv --python=python3.10 musichub-env
   pip install -r requirements.txt
   ```

3. **Create `.env`** in the same folder as `manage.py` (copy `.env.example` and edit):
   ```
   SECRET_KEY=<generate one — see below>
   DEBUG=False
   ALLOWED_HOSTS=lalitsaini01.pythonanywhere.com
   DB_ENGINE=sqlite
   CORS_ALLOWED_ORIGINS=https://<your-netlify-site>.netlify.app
   CSRF_TRUSTED_ORIGINS=https://lalitsaini01.pythonanywhere.com
   FRONTEND_URL=https://<your-netlify-site>.netlify.app
   ```
   Generate a real `SECRET_KEY` with:
   ```bash
   python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
   ```

4. **Migrate, seed (optional), create an admin, collect static files:**
   ```bash
   python manage.py migrate
   python manage.py seed_music        # optional — sample catalog to demo with
   python manage.py createsuperuser
   python manage.py collectstatic --noinput
   ```

5. **Web tab → Add a new web app → Manual configuration → Python 3.10.**
   Set the virtualenv path to the one you made in step 2.

6. **Edit the WSGI file** PythonAnywhere generated (linked at the top of the
   Web tab) — replace its contents with:
   ```python
   import sys, os
   path = '/home/lalitsaini01/MusicHub/backend'
   if path not in sys.path:
       sys.path.insert(0, path)
   os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
   from django.core.wsgi import get_wsgi_application
   application = get_wsgi_application()
   ```

7. **Static/Media files table** (Web tab, scroll down) — add two rows so
   Django admin's CSS and any uploaded images/audio actually load (WSGI apps
   here don't serve these paths the way `runserver` does locally):
   | URL | Directory |
   |---|---|
   | `/static/` | `/home/lalitsaini01/MusicHub/backend/staticfiles` |
   | `/media/` | `/home/lalitsaini01/MusicHub/backend/media` |

8. Hit the green **Reload** button on the Web tab. Your API is now live at
   `https://lalitsaini01.pythonanywhere.com/api/v1/`.

### Frontend — Netlify

`netlify.toml` (already in `frontend/`) handles the build command, publish
directory, and the SPA redirect React Router needs — you shouldn't need to
touch Netlify's build settings manually.

1. Push `frontend/` to GitHub (same repo as the backend or its own — either works).
2. Netlify → **Add new site → Import an existing project**, pick the repo.
   If it's a monorepo, set **Base directory** to `frontend`.
3. Before the first deploy (or after, then redeploy): **Site configuration →
   Environment variables** → add
   ```
   VITE_API_URL = https://lalitsaini01.pythonanywhere.com/api/v1
   ```
4. Deploy. Your frontend is live at `https://<your-site-name>.netlify.app`.
5. **Go back and update the backend's `.env`** (`CORS_ALLOWED_ORIGINS`,
   `CSRF_TRUSTED_ORIGINS`, `FRONTEND_URL`) with this real Netlify URL if you
   used a placeholder in step 3 above, then Reload the PythonAnywhere web app.

### Troubleshooting

- **`Could not find a version that satisfies the requirement Django==...` /
  `No matching distribution found for Django`** — your virtualenv's Python
  version is older than what the pinned Django version requires. This repo's
  `requirements.txt` pins `Django<6.0,>=5.0`, which supports Python 3.10+, so
  this shouldn't happen with a fresh clone — but if you edited the pin or
  used an older Python (3.8/3.9), either recreate the virtualenv with
  `mkvirtualenv --python=python3.10 musichub-env` or loosen the Django
  constraint in `requirements.txt` to match your Python version, then rerun
  `pip install -r requirements.txt`.

### After deploying

- Log into `/admin/` (Django admin) or your app's `/admin` (MusicHub's own
  dashboard, once you've PATCHed your user's `is_admin_user` to `true` via
  Django admin or the API) to start adding real songs/artists/albums.
- Free-tier PythonAnywhere apps sleep after a period of inactivity — the
  first request after a while will be slow to wake up. This is normal.
- **Media files** (avatars, cover art, uploaded audio) live on
  PythonAnywhere's disk with this setup, which is fine for a portfolio demo.
  For real production traffic, point `MEDIA_URL`/`DEFAULT_FILE_STORAGE` at
  an object store (S3, Cloudinary, Backblaze) instead — the model fields
  (`ImageField`/`FileField`) are already storage-backend-agnostic, so
  swapping `DEFAULT_FILE_STORAGE` in `settings.py` is the only change needed.

## Testing checklist

Everything below has been manually verified end-to-end against the live backend during development:

- [x] Register, login (by username or email), logout, forgot/reset password
- [x] Search (songs/artists/albums/playlists, category filters, debounce)
- [x] Song playback, play/pause, next/previous, shuffle, repeat, seek, volume
- [x] Like/unlike songs and playlists; add/remove/reorder playlist songs
- [x] Create, rename, delete playlists (owner-only, confirmed with a non-owner rejection test)
- [x] Follow/unfollow artists
- [x] Recently played tracking (upserts, doesn't duplicate) and clearing history
- [x] Profile edit, avatar upload, change password (old password stops working, new one logs in)
- [x] Responsive layout: sidebar hidden and bottom nav shown under 992px; player bar never overlaps the sidebar
- [x] Admin Dashboard: full CRUD for songs/artists/albums/genres (incl. image/audio uploads), playlist moderation, user management with self-protection guards
- [x] Permission boundaries: non-admin blocked from write endpoints and `/admin/*`, non-owner blocked from editing others' playlists

## Notes on originality

MusicHub's UX (layout structure, player behavior, page hierarchy) was
designed with inspiration from a reference product, but the branding, logo,
color identity, copy, and all code are original. No third-party trademarks,
logos, or copyrighted assets are used. Audio playback during development
should use royalty-free or clearly-labeled placeholder tracks only.
