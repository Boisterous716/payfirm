# Payfirm

A Chrome extension that scans your Gmail inbox for PayPal payment notification emails, matches each payer's real name against an uploaded CSV of Reddit usernames, and exports aggregated totals per person.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Clone the repository](#clone-the-repository)
3. [Install dependencies & build](#install-dependencies--build)
4. [Load the extension in Chrome](#load-the-extension-in-chrome)
5. [Prepare your CSV](#prepare-your-csv)
6. [Using the extension](#using-the-extension)
7. [Supported platforms](#supported-platforms)
8. [Development commands](#development-commands)
9. [Troubleshooting](#troubleshooting)
10. [Project structure](#project-structure)

---

## Prerequisites

Before you begin, make sure you have the following installed:

| Requirement | Version | Download |
|-------------|---------|----------|
| Google Chrome (or any Chromium browser) | Any modern version | [chrome.google.com](https://www.google.com/chrome) |
| Node.js | 18 or higher | [nodejs.org](https://nodejs.org) — choose the **LTS** release |
| Git | Any | [git-scm.com](https://git-scm.com) |

To verify Node.js is installed, open a terminal and run:

```bash
node --version   # should print v18.x.x or higher
npm --version    # should print 9.x.x or higher
```

---

## Clone the repository

```bash
git clone https://github.com/your-org/payfirm.git
cd payfirm
```

> Replace the URL above with the actual repository URL.

---

## Install dependencies & build

### macOS

Open **Terminal** and run:

```bash
# Install project dependencies
npm install

# Build the extension — output goes to the dist/ folder
npm run build
```

> **Node.js not installed?** Install it via Homebrew:
> ```bash
> brew install node
> ```
> Then re-run the commands above.

### Windows

Open **Command Prompt** or **PowerShell** and run:

```powershell
# Install project dependencies
npm install

# Build the extension — output goes to the dist\ folder
npm run build
```

> **Node.js not installed?** Download and run the LTS installer from [nodejs.org](https://nodejs.org), restart your terminal, then re-run the commands above.

When the build succeeds you will see output ending with:

```
✓ built in Xms
```

The compiled extension is now in the `dist/` folder.

---

## Load the extension in Chrome

1. Open Chrome and navigate to `chrome://extensions`
2. Enable **Developer mode** using the toggle in the **top-right corner**
3. Click **Load unpacked**
4. In the file picker, navigate to the `payfirm` project folder and select the **`dist`** subfolder
5. Payfirm appears in your extension list

**Pin the extension to your toolbar** (recommended):

1. Click the puzzle-piece icon (🧩) in the Chrome toolbar
2. Find **Payfirm** and click the pin icon next to it
3. The Payfirm icon now appears permanently in the toolbar for easy access

> **After any code change:** run `npm run build` again, then go to `chrome://extensions` and click the **↺ refresh** icon on the Payfirm card.

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

### First-time setup

1. Open Gmail in Chrome at `https://mail.google.com/mail` and make sure you can see your inbox
2. Click the **Payfirm** icon in your Chrome toolbar
3. Click **Upload CSV** and select your Reddit username CSV file
   - The CSV is cached locally — you will not need to re-upload it on future sessions
4. If you want to re-upload a different CSV, click **Upload CSV** again or **Clear CSV** to start fresh

### Running a match

1. Navigate to Gmail (`https://mail.google.com/mail`) — Payfirm **must** be run from an active Gmail tab
2. Click the **Payfirm** toolbar icon
3. Set the **From** and **To** datetime filters to the period you want to scan
   - Defaults to the last 7 days
4. *(Optional)* Check **Auto-scroll to load all emails** if your inbox has many pages — this is slower but ensures all emails in the date range are captured
5. Click **Match Payments**
6. Results appear in a table showing:
   - Reddit username
   - Full name
   - Payment platform(s)
   - Total amount (USD)
   - Number of payments
   - A **Total** row at the bottom
7. Any payer names that couldn't be matched to your CSV appear in the **Unmatched Payers** section — add them to your CSV and re-run if needed
8. Click **Export CSV** to download the results as a `.csv` file

### Viewing history

Every successful run is automatically saved. Click the **History** tab to see all past runs. Each entry shows the run timestamp, totals, and filter range used. You can expand any run to see its full results table and export it.

---

## Supported platforms

| Platform | Status | Detected by |
|----------|--------|-------------|
| PayPal | ✅ Fully implemented | Emails from `*@paypal.com` |
| Venmo | 🚧 Coming soon | Emails from `*@venmo.com` |
| Wise | 🚧 Coming soon | Emails from `*@wise.com` / `*@transferwise.com` |

The extension automatically identifies the payment platform from the sender email address — no configuration required.

---

## Development commands

| Command | Description |
|---------|-------------|
| `npm install` | Install all dependencies |
| `npm run build` | Build the extension into `dist/` |
| `npm run dev` | Start Vite dev server (for popup UI development only) |
| `npm test` | Run unit tests in watch mode |
| `npm run test:run` | Run unit tests once and exit |

---

## Troubleshooting

**"Please navigate to https://mail.google.com/mail and try again"**
The active tab must be a Gmail tab when you click Match Payments. Switch to your Gmail tab first, then click the extension icon.

**"Could not establish connection" or "Scraping returned no data"**
- Make sure you are on the Gmail inbox page (not a specific email thread or Settings)
- Try reloading the Gmail tab, then click Match Payments again
- If the issue persists, go to `chrome://extensions`, find Payfirm, and click **↺ refresh**, then reload Gmail

**Zero results after a successful scrape**
- Your payer names may not match any entries in your CSV — check the **Unmatched Payers** list
- The date filter may be too narrow — widen the From/To range and try again
- PayPal email subjects must match the format `{Name} sent you $X.XX USD` — if PayPal has changed their email template, update `tryPayPal()` in `src/popup/utils/scrapeTab.ts`

**CSV upload error**
- Ensure your file is saved as plain `.csv` (not `.xlsx`)
- The file must have `reddit_username` (or `username`) and `full_name` (or `name`) columns
- Open the file in a text editor to confirm it is comma-separated and has a header row

**Extension not appearing after Load unpacked**
- Make sure you selected the `dist/` folder, not the root project folder
- Confirm the build completed without errors by checking the terminal output

---

## Project structure

```
payfirm/
├── manifest.json                   Chrome Extension manifest (MV3)
├── index.html                      Popup HTML entry point
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
    │   └── service-worker.ts       MV3 service worker stub (required by manifest)
    ├── test/
    │   └── setup.ts                Vitest global setup + chrome API mock
    └── popup/
        ├── main.tsx                React entry point
        ├── App.tsx                 Top-level state machine
        ├── App.css                 Popup styles
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
