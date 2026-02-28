# Payfirm

A Chrome extension that scans your Gmail inbox for payment notification emails, matches each payer's real name against an uploaded CSV of Reddit usernames, and exports aggregated totals per person.

---

## Table of Contents

1. [Quick install (no dev environment needed)](#quick-install-no-dev-environment-needed)
2. [Install from source](#install-from-source)
3. [Load the extension in Chrome](#load-the-extension-in-chrome)
4. [Prepare your CSV](#prepare-your-csv)
5. [Using the extension](#using-the-extension)
6. [Supported platforms](#supported-platforms)
7. [Development commands](#development-commands)
8. [Troubleshooting](#troubleshooting)
9. [Project structure](#project-structure)

---

## Quick install (no dev environment needed)

1. Go to the [Releases page](https://github.com/Boisterous716/payfirm/releases) and download the latest `payfirm-dist.zip`
2. Unzip it anywhere on your computer
3. Follow the [Load the extension in Chrome](#load-the-extension-in-chrome) steps below, selecting the unzipped folder

That's it — no Node.js, no terminal, no build step required.

---

## Install from source

If you want to build from source or contribute to development.

**Prerequisites:**

| Requirement | Version | Download |
|-------------|---------|----------|
| Google Chrome (or any Chromium browser) | Any modern version | [chrome.google.com](https://www.google.com/chrome) |
| Node.js | 18 or higher | [nodejs.org](https://nodejs.org) — choose the **LTS** release |
| Git | Any | [git-scm.com](https://git-scm.com) |

```bash
git clone https://github.com/Boisterous716/payfirm.git
cd payfirm
npm install
npm run build
```

The compiled extension is now in the `dist/` folder.

> **After any code change:** run `npm run build` again, then go to `chrome://extensions` and click the **↺ refresh** icon on the Payfirm card.

---

## Load the extension in Chrome

1. Open Chrome and navigate to `chrome://extensions`
2. Enable **Developer mode** using the toggle in the **top-right corner**
3. Click **Load unpacked**
4. Select the `dist` folder (from the unzipped release, or from your build output)
5. Payfirm appears in your extension list

**Pin the extension to your toolbar:**

1. Click the puzzle-piece icon in the Chrome toolbar
2. Find **Payfirm** and click the pin icon next to it
3. The Payfirm icon now appears permanently in the toolbar

---

## Prepare your CSV

The extension matches payer names to Reddit usernames using a CSV file you supply. The CSV must have at minimum these two columns (header names are case-insensitive):

| Column | Aliases accepted | Description |
|--------|-----------------|-------------|
| `reddit_username` | `username` | Reddit handle — do **not** include `u/` |
| `full_name` | `name` | Full name exactly as it appears in payment emails |

**Example:**

```csv
reddit_username,full_name
johndoe,John Doe
janedoe,Jane Doe
alice99,Alice Smith
```

Save this file with a `.csv` extension. Extra columns are ignored.

---

## Using the extension

### Opening Payfirm

Click the **Payfirm** icon in your Chrome toolbar. The extension opens as a **side panel** on the right side of your browser — it stays open even when you click elsewhere on the page.

### First-time setup

1. Open Gmail in Chrome at `https://mail.google.com/mail`
2. Click the **Payfirm** icon to open the side panel
3. Click **Upload CSV** and select your Reddit username CSV file
   - The CSV is cached locally — you will not need to re-upload it on future sessions
4. To switch to a different CSV, click **Upload CSV** again or **Clear CSV** to start fresh

### Running a match

1. Make sure Gmail is your active tab (`https://mail.google.com/mail`)
2. Set the **From** and **To** datetime filters to the period you want to scan (defaults to the last 7 days)
3. *(Optional)* Check **Auto-scroll to load all emails** if your inbox has many pages — this is slower but ensures all emails in the date range are captured
4. Click **Match Payments**
5. Results appear in a table showing:
   - Reddit username
   - Full name
   - Payment platform(s)
   - Total amount (USD)
   - Number of payments
   - A **Total** row at the bottom
6. Any payer names that couldn't be matched appear in the **Unmatched Payers** section — add them to your CSV and re-run if needed
7. Click **Export CSV** to download the results as a `.csv` file

### Refreshing without starting over

If new payment emails arrive while the side panel is open, click **Refresh** instead of starting over. Payfirm re-scans Gmail and adds any newly detected payments to the existing results — already-counted payments are never duplicated.

### Viewing history

Every successful run is automatically saved. Click the **History** tab to see all past runs. Each entry shows the run timestamp, totals, and filter range used. You can expand any run to see its full results table and export it.

---

## Supported platforms

| Platform | Status | Detected by |
|----------|--------|-------------|
| PayPal | ✅ Supported | Emails from `*@paypal.com` |
| Venmo | ✅ Supported | Emails from `*@venmo.com` |
| Wise | ✅ Supported | Emails from `*@wise.com` / `*@transferwise.com` |

The extension automatically identifies the payment platform from the sender email address — no configuration required.

---

## Development commands

| Command | Description |
|---------|-------------|
| `npm install` | Install all dependencies |
| `npm run build` | Build the extension into `dist/` |
| `npm run dev` | Start Vite dev server (for UI development only) |
| `npm test` | Run unit tests in watch mode |
| `npm run test:run` | Run unit tests once and exit |

---

## Troubleshooting

**"Please navigate to https://mail.google.com/mail and try again"**
The active tab must be a Gmail tab when you click Match Payments. Switch to your Gmail tab first, then click Match Payments.

**"Could not establish connection" or "Scraping returned no data"**
- Make sure you are on the Gmail inbox page (not inside a specific email thread or Settings)
- Try reloading the Gmail tab, then click Match Payments again
- If the issue persists, go to `chrome://extensions`, find Payfirm, click **↺ refresh**, then reload Gmail

**Zero results after a successful scrape**
- Your payer names may not match any entries in your CSV — check the **Unmatched Payers** list
- The date filter may be too narrow — widen the From/To range and try again
- Make sure both read and unread payment emails are visible in your Gmail inbox view

**CSV upload error**
- Ensure your file is saved as plain `.csv` (not `.xlsx`)
- The file must have `reddit_username` (or `username`) and `full_name` (or `name`) columns
- Open the file in a text editor to confirm it is comma-separated and has a header row

**Extension not appearing after Load unpacked**
- Make sure you selected the `dist/` folder (or the unzipped release folder), not the root project folder
- Confirm the build completed without errors by checking the terminal output

---

## Project structure

```
payfirm/
├── manifest.json                   Chrome Extension manifest (MV3)
├── index.html                      Side panel HTML entry point
├── vite.config.ts                  Vite + @crxjs build config
├── vitest.config.ts                Unit test config
├── package.json
├── tsconfig.json
├── .gitignore
├── public/
│   └── icons/                      Extension icons (16, 48, 128 px)
├── docs/
│   └── architecture.md             UML architecture diagrams
└── src/
    ├── types/
    │   └── index.ts                Shared TypeScript types
    ├── background/
    │   └── service-worker.ts       Opens side panel when extension icon is clicked
    ├── test/
    │   └── setup.ts                Vitest global setup + chrome API mock
    └── popup/
        ├── main.tsx                React entry point
        ├── App.tsx                 Top-level state machine
        ├── App.css                 Side panel styles
        ├── components/
        │   ├── CsvUploader.tsx     File input + PapaParse trigger
        │   ├── HistoryView.tsx     Collapsible past-run list
        │   ├── ResultsTable.tsx    Matched results + total row
        │   └── UnmatchedList.tsx   Payer names with no CSV match
        └── utils/
            ├── csvCache.ts         Save/load CSV via chrome.storage.local
            ├── exportResultsCsv.ts Build RFC 4180 CSV string + trigger download
            ├── matchAndAggregate.ts 3-strategy name matching + amount aggregation
            ├── parseCsv.ts         PapaParse wrapper with header normalisation
            ├── runHistory.ts       Save/load per-run results (max 50)
            └── scrapeTab.ts        Inject scraping function into Gmail tab
```
