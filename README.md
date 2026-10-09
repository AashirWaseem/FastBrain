# FastBrain

A private, offline brain-training app with six exercises. No account, no paywall, no waiting between sets.

## Start

Double-click **`Start FastBrain.bat`**, or open `index.html` in Chrome or Edge. Nothing to install and no internet needed.

Tip: bookmark the page, or in Edge/Chrome use *⋯ → Apps → Install this site as an app* for a desktop icon.

## Put it on your phone (one-time setup)

FastBrain is an installable web app. Host it once on GitHub Pages (free), install it from Chrome, and it then works offline like a normal app.

1. **GitHub Desktop:** *File → Add local repository…* → choose `C:\Apps\FastBrain` → it says it isn't a repository yet → click **create a repository** → **Create repository**.
2. Click **Publish repository**, **untick "Keep this code private"** (free GitHub Pages needs a public repo), then **Publish**.
3. On github.com open the repo → **Settings → Pages** → *Source: Deploy from a branch* → Branch **main**, folder **/ (root)** → **Save**. After about a minute the page shows your link, e.g. `https://YOUR-NAME.github.io/FastBrain/`.
4. On the phone, open that link in **Chrome** → **⋮ menu → Add to home screen → Install**.

To push updates later: commit in GitHub Desktop and click **Push origin**. The installed app picks up the new version the next time it opens online.

Progress is stored separately on each device. To move it, use **Progress → Export backup**, then **Import backup** on the other device.

## Exercises

| Exercise | Types | Levels |
|---|---|---|
| Dual N-Back | Any mix of Position, Audio, Color, Shape, Number (Single → Penta), with optional async | N = 1–30 |
| CWM (complex working memory) | Verbal, Spatial, Combined | 1–30 rounds |
| Mental Math | + − × ÷ and Mixed | 1.1 → 14.14 (digits per operand) |
| Corsi Block Tapping | Classic, Reverse, Sticky Classic, Sticky Reverse | 1–20 blocks |
| Memory Span | Digit / Letter, forward, reverse, sorted | 1–100 symbols |
| PASAT | Sum of the last N numbers heard | N = 2–25 |

Keys: `Space` starts a set, `Esc` cancels. N-Back uses `A` (position) and `L` (sound), plus `F`/`J`/`K` for color/shape/number.
CWM uses `A` = yes and `L` = no. All keys can be changed in each exercise's **All settings**.

## Your data

Progress is saved in your browser's local storage. Use **Progress → Export backup** to save a copy, and **Import backup** to restore it.
Use the same browser each time, because each browser keeps its own copy.

## Files

- `index.html`: entry point
- `css/app.css`: all styling
- `js/util.js`: storage, timers, speech, sounds
- `js/ui.js`: menu, router, settings and the shared exercise page
- `js/pages.js`: dashboard, progress, about and info pages
- `js/games/*.js`: one file per exercise
- `js/data/words.js`: word list for Verbal CWM
