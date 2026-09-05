# CRM Intelligence — Demo-Ready MVP

A privacy-first, GitHub Pages-ready CRM analytics prototype.

## Demo-first experience

The app opens with a fully populated demo dashboard using `data/ (demo datasets)`.

Customers can:
1. Explore all dashboard pages with realistic dummy data.
2. Download the exact demo dataset.
3. Open it in Excel and change values/add records.
4. Save the modified file as CSV/XLSX.
5. Go to **Connect Your Data** and select the modified file.
6. The same dashboard pages update using their file.

## Pages

- `dashboard.html` — executive dashboard
- `customers.html` — customer intelligence
- `pipeline.html` — pipeline analysis
- `sales.html` — salesperson performance
- `reports.html` — report examples
- `data.html` — demo download + local data connection
- `ai.html` — AI capability preview

## Privacy

CSV/Excel processing happens in the browser. This MVP has no server-side upload endpoint.

**Do not put real customer data into a public GitHub repository.** GitHub Pages publishes repository site content publicly. Customers should select their real CSV/Excel files locally through the web app.

The current browser session retains the selected dataset using `sessionStorage` so navigation between pages continues to use it. Closing the browser/session clears it.

## Test data

`data/ (demo datasets)` contains 300 dummy CRM opportunities.

A standalone copy is included outside the project as `CRM_Intelligence_Demo_Data.csv`.

## GitHub Pages

1. Create a GitHub repository.
2. Upload the contents of this folder to the repository root.
3. Go to Settings → Pages.
4. Choose **Deploy from a branch**, select `main` and `/ (root)`, then Save.

An optional GitHub Actions workflow is included under `.github/workflows/deploy.yml`.

## Technical note

Chart.js and SheetJS are loaded from public CDNs in this MVP. The CRM data itself is processed locally in the browser. For fully offline/on-premise distribution, vendor these libraries into the repository.

## Next priorities

1. Visual column mapping
2. Data type detection/validation
3. Global filters
4. KPI/chart drill-down
5. Pivot/cohort/Pareto/RFM analysis
6. Export to PDF/Excel
7. Explicit AI opt-in
8. Odoo/Zoho/HubSpot/Salesforce connectors


## Opening the project locally

The demo dashboard is designed to work even when you double-click `index.html` and the browser uses a `file://` URL. A browser security rule can block JavaScript from fetching a separate local CSV file. To avoid a blank demo dashboard, the demo dataset is also embedded in `js/demo-data.js` as a local fallback.

When deployed on GitHub Pages, the app first reads `data/ (demo datasets)`; the embedded copy remains as a fallback.

For the most realistic development experience, you can also run a local web server (for example VS Code Live Server).


## v3 local-file fix

The demo dataset is embedded in `js/demo-data.js` and is loaded **before** `app.js`.
This is intentional: when `index.html` is opened directly with `file://`, browsers may block
`fetch("./data/ (demo datasets)")`. The application therefore uses the embedded demo dataset
first, and uses the relative `./data/ (demo datasets)` path when running under a web server such
as GitHub Pages.

If an older browser session contains an empty dataset, the app now ignores it and loads the demo.

## KPI-rich demo

The demo now includes five linked data domains:
- Customers
- Opportunities
- Marketing
- Service
- Financial

The Executive Dashboard surfaces examples across four KPI groups:
- Sales: pipeline, win rate, average deal size
- Marketing: lead conversion, CPL, CAC, campaign attribution, email CTR
- Customer Service: retention, churn, CSAT, response time, self-service
- Financial/Operational: MRR, MRR growth, churn and interaction cost

The Excel demo workbook contains five editable sheets and is the recommended test format.

### Pipeline Velocity
The demo now calculates Pipeline Velocity as a directional sales-velocity KPI using the standard components of qualified pipeline count, average won deal size, win rate and average sales-cycle duration. Because the MVP does not yet contain historical stage-transition timestamps, this is an **expected/indicative velocity**, not a measured stage-to-stage velocity. A future release should add stage-history events for a more rigorous calculation.

## Google Forms / lead connection

The Connect My Data gate sends only lead metadata (Name, Company Name, optional Business Email, contact preference and purpose) to the configured Google Apps Script web app. The customer's Excel/CSV file is not included in that request and remains local to the browser.

Before publishing this release, update the Apps Script deployment with the code in `Google Apps Script lead endpoint (configured in js/app.js)` and deploy it as the existing web app. The deployed web app must accept public POST requests and execute as the Google account that owns the Form.

Feedback and 2-Minute Diagnostic buttons open their respective Google Forms. Do not put customer Excel/CSV data into those Forms or their response Sheets.


## v5.1 data robustness
- Probability values in common 0–100 percentage format are normalized to 0–1 before calculations.
- Uploads should be checked for missing/invalid values; the app does not upload CRM files to the lead-capture form.
- Unknown sales stages are surfaced as a data warning rather than silently treated as a valid stage.
- A domain with no uploaded rows should be treated as **No data**, not as a business result of zero.


## v5.1.1 visual update
- Sidebar section headings use the same branded title-case visual language as the CRM Intelligence identity.
- Navigation structure, active states, and functionality are unchanged.
