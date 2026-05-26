# Tempo Apps Script Web App

Copy `Code.gs` into a new Google Apps Script project, bind it to a spreadsheet or set `SPREADSHEET_ID`, then deploy as a Web App.

## Setup

1. Create a Google Spreadsheet with 5 tabs named:
   - `shifts`
   - `students`
   - `attendances`
   - `payments`
   - `users`
2. Open Google Apps Script and paste `Code.gs`.
3. Optional but recommended:
   - In Script Properties, set `SHEETS_API_TOKEN` to a secret string.
   - In `Code.gs`, set `CONFIG.SPREADSHEET_ID` if you are not using a bound spreadsheet.
4. Deploy > New deployment > Web app.
   - Execute as: Me
   - Who has access: Anyone with the link
5. Copy the Web App URL into `.env.local`:
   - `VITE_DATA_BACKEND=sheets`
   - `VITE_SHEETS_API_URL=https://script.google.com/macros/s/your-web-app-id/exec`
   - `VITE_SHEETS_API_TOKEN=your-secret-token`

## One-click demo seed

After pasting both `Code.gs` and `Seed.gs` into the same Apps Script project, you can seed the spreadsheet in one click:

1. Save the project.
2. If the script is bound to the spreadsheet, reload the sheet and use the `Tempo` menu.
3. Click `Seed demo data` to create/update sample rows, or `Force reseed demo data` to wipe rows 2+ and reseed.
4. You can also run `seedTempoDemoData()` directly from the Apps Script editor.

## Contract

The frontend sends:

```json
{
  "action": "getAll | upsert | upsertMany | delete",
  "token": "optional-token",
  "payload": {}
}
```

The Apps Script returns:

```json
{
  "ok": true,
  "data": {}
}
```

## Notes

- Arrays/objects are stored as JSON strings in the sheet with a `__JSON__:` prefix.
- The script auto-creates headers if a tab is empty.
- `users/{id}` is the role source for the app, so keep the `id` column equal to the Firebase/Auth UID or the Google profile UID you use in the app.
