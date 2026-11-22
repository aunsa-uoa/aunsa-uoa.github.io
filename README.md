# AUNSA website

The website for AUNSA, the Auckland Neurodivergent Students Association.
It's hosted free on GitHub Pages. Execs sign in with Google to edit it in the exec dashboard (`admin.html`), and the president controls who can edit what.

- **Execs:** read [HANDOVER.md](HANDOVER.md).
- **First-time setup** of Google sign-in: read [SETUP.md](SETUP.md).

## How it fits together

| Where | What's in it |
|---|---|
| `*.html` | Public pages: Home, Events, Meet the team, Resources, guide page, Contact us |
| `admin.html` | The exec dashboard |
| `assets/js/firebase-config.js` | Connects the site to the club's Firebase project (filled in during setup) |
| `firestore.rules` | Security rules: who can edit what. Pasted into Firebase during setup. |
| `assets/js/data.js` | Loads content for the public pages |
| `assets/js/app.js` | Builds the public pages |
| `assets/js/admin.js` | The exec dashboard |
| `assets/css/` | Styles. Brand colours are set once at the top of `styles.css`. |
| `data/*.json` | Starter content, imported into Firebase during setup. Also shown if Firebase can't be reached. |
| `assets/img/logo/` | The AUNSA logo |

## Updating the code

Execs edit content in the dashboard, not in these files. If you change a `.css` or `.js` file, also change the `?v=` number after it in every `.html` file (for example `?v=20261122b` to `?v=20261201a`). Otherwise visitors' browsers can keep showing the old version for up to 10 minutes.

## Previewing on your computer

From this folder, run `python -m http.server 8080`, then open http://localhost:8080.
(Double-clicking the HTML files won't load the content, because browsers block that.)

## Publishing on GitHub Pages

1. Create a free GitHub **organisation** for the club and make at least two execs owners. It only hosts the files: execs don't need GitHub to edit content.
2. Create a repository called `<organisation-name>.github.io` and upload all these files, including `.nojekyll`.
3. In **Settings → Pages**, set **Source** to *Deploy from a branch*, choose `main` and `/ (root)`, and save.
4. Then follow [SETUP.md](SETUP.md) to switch on Google sign-in.

## Accessibility

- Body text uses Atkinson Hyperlegible, a font designed to be easy to read. Headings use Fredoka.
- Visitors can use the comfort button for larger text, extra spacing, or calm mode.
- The carousel never moves on its own.
- When adding content: describe photos for screen readers, avoid ALL CAPS paragraphs, and keep sentences short.
