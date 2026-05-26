<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/c9895624-d29f-45c4-93df-949bbacc1f31

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Data backend modes

The app can run with either Firebase or Google Sheets as its data backend.

### Environment variables

Create `.env.local` and set one of these modes:

```bash
# sheets | firebase
VITE_DATA_BACKEND=sheets

# Required when VITE_DATA_BACKEND=sheets
VITE_SHEETS_API_URL=https://script.google.com/macros/s/your-web-app-id/exec

# Optional shared secret sent to Apps Script
VITE_SHEETS_API_TOKEN=your-secret-token
```

If `VITE_DATA_BACKEND=sheets` but `VITE_SHEETS_API_URL` is missing, the app automatically falls back to Firebase.

### Expected Apps Script API contract

The frontend sends JSON `POST` requests with this shape:

```json
{
   "action": "getAll | upsert | upsertMany | delete",
   "token": "optional-token",
   "payload": {}
}
```

Expected JSON response:

```json
{
   "ok": true,
   "data": {}
}
```

On failure:

```json
{
   "ok": false,
   "error": "message"
}
```

### Apps Script starter bundle

A ready-to-copy Google Apps Script Web App implementation is available in [apps-script/Code.gs](apps-script/Code.gs) with setup notes in [apps-script/README.md](apps-script/README.md).

The one-click demo seed script is in [apps-script/Seed.gs](apps-script/Seed.gs).
