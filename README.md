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


## Local AI — MVP setup

The Local AI Analyst runs Qwen through Ollama on the customer's own computer. The setup wizard detects macOS, Windows, Linux or another operating system, recommends a conservative model based on the customer's RAM selection, and provides the operating-system-specific Ollama download page.

Because a browser page hosted on GitHub Pages is a different origin from Ollama's local API, the wizard also provides a **one-time `OLLAMA_ORIGINS` setup step**. This allows the customer's browser to connect to Ollama at `localhost:11434`. The wizard uses the current CRM website origin plus the local development origin and does not recommend a wildcard (`*`) origin.

For the MVP, this is intentionally a guided customer step rather than a desktop installer. The customer does not need an API key. The actual CRM AI request remains local when Local AI is used.

Official Ollama downloads: https://ollama.com/download
Official Ollama origin configuration: https://docs.ollama.com/faq#how-can-i-allow-additional-web-origins-to-access-ollama

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

## AI Analyst — v5.2 privacy-first design

The AI Analyst page now presents three AI paths:

- **Local AI — Ollama:** enabled in the MVP. The browser can connect to Ollama running on the user's own computer at its local API endpoint. The app sends only the analytics context and question to the local Ollama service.
- **Bring Your Own AI Key (BYOK):** intentionally not enabled yet. API-key handling requires careful browser-side credential protection, provider-specific controls, explicit data-flow disclosure, and security testing.
- **Managed Cloud AI:** intentionally not enabled yet. A secure backend/gateway, authentication, provider controls, cost management, and explicit cloud-data processing safeguards are required.

The product deliberately prefers an unavailable feature over an incomplete integration that could expose business data or credentials. Users interested in BYOK or managed cloud AI are directed to contact the project team.

Ollama's local API is documented by Ollama at `http://localhost:11434/api` after installation and startup.

## Local AI setup

The AI Analyst page does **not** ship or execute a custom Ollama installer. This is intentional: users download Ollama directly from the official Ollama website and install it themselves. The page then guides the user to open Ollama and checks the local API at `http://localhost:11434/api`.

The setup flow is: **Download Official Ollama → Open Ollama → Check Connection → Detect local models → Use Local AI Analyst**. The site never receives the user's Ollama credentials and does not upload CRM/Excel data to the project.

Ollama documents the local API and its local-origin configuration in its official documentation.


## AI Analyst — v5.3
The AI Analyst is organized into three sub-pages under the existing **Data & Intelligence → AI Analyst** navigation item:
- `local-ai.html` — **Local AI — Maximum Privacy** (enabled with Ollama)
- `byok.html` — **Bring Your Own AI Key** (not yet enabled; security-first explanation)
- `managed-cloud-ai.html` — **Managed Cloud AI** (not yet enabled; secure gateway architecture explanation)

The main `ai.html` page is the AI Analyst choice/overview page. BYOK and Managed Cloud AI are intentionally informational only until the required security architecture is implemented and tested.

## Local AI setup wizard

The Local AI page now uses a hardware-aware setup wizard rather than asking users to choose a Qwen model manually.

- Detects operating system and browser CPU concurrency.
- Asks for RAM when desktop browser APIs do not expose it reliably.
- Recommends an official Qwen 3.5 model conservatively:
  - 8 GB → `qwen3.5:2b`
  - 16 GB → `qwen3.5:4b`
  - 24–32 GB → `qwen3.5:9b`
  - 64 GB+ → `qwen3.5:27b` (higher-resource option)
  - Not sure → `qwen3.5:2b` fallback
- Provides the official Ollama download page for the detected operating system.
- Offers a user-initiated local model pull through Ollama when the local API permits it, with a command-line fallback.
- Verifies Ollama and opens the dedicated `local-ai-chat.html` workspace only after a local model is detected.
- Stores only the selected local model name in browser `localStorage`; no CRM data is sent to the web application server.

These model-size recommendations are conservative application guidance, not official Ollama hardware requirements. Larger models can materially increase local RAM/CPU/GPU usage.

## v5.5 — Controlled Local Supporting Files

Local AI Analyst can accept a user-selected supporting file of **any file type**, with a hard **10 MB maximum**. The file is processed in the browser and is not uploaded to a CRM server or cloud AI provider.

To protect customer systems:
- Maximum file size: 10 MB
- One supporting file per message
- File contents are kept in memory only for the current chat session
- Extracted context sent to Ollama is capped to a compact 12,000-character context
- Text, CSV/TSV, JSON/XML/Markdown/code/text formats are extracted directly
- Excel workbooks are summarized through the existing browser-side SheetJS parser
- PDF and DOCX text extraction is attempted locally when the bundled browser parser is available
- Unsupported binary formats are represented by metadata only rather than loading arbitrary binary content into the model
- No folder upload, background indexing, permanent file storage, or model training is performed

The 10 MB limit is intentionally independent of the user's model size so that attachment handling remains predictable on local machines.
