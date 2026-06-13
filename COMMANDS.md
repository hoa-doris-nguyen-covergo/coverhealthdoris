# CoverHealth Playwright Automation — Command Reference

Quick reference for all commands used in this project. Add new entries as new scripts or features are introduced.

---

## 1. Authentication Setup

Run once before executing any tests to save the auth session to `auth.json`.

```bash
npx playwright test tests/auth.setup.ts --project=setup
```

---

## 2. Running Tests

### Run all tests
```bash
npx playwright test
```

### Run headlessly (no browser window)
Tests run headlessly by default when `headless: true` is set in `playwright.config.ts`.
```bash
npx playwright test
```

### Run a specific spec file
```bash
npx playwright test tests/proposal/01-list-search-filter.spec.ts
```

### Run by project
```bash
npx playwright test --project=proposal
npx playwright test --project=offer
```

### Run individual feature scripts (npm shortcuts)
```bash
npm run test:list        # Proposal list / search / filter
npm run test:create      # Create proposal
npm run test:offer-mgmt  # Offer management
npm run test:offer-detail
npm run test:member
npm run test:lifecycle
```

---

## 3. Generating the Custom HTML Report

### Step 1 — Run tests and export JSON output

Run a specific spec and redirect the JSON reporter output to a file:

```bash
npx playwright test tests/proposal/01-list-search-filter.spec.ts \
  --reporter=json 2>/dev/null > /tmp/pw-results.json
```

> `--reporter=json` writes clean JSON to stdout. `2>/dev/null` suppresses stderr noise.
> Swap the spec path for any other file you want to report on.

### Step 2 — Generate the styled HTML report

```bash
node generate-report.js \
  --input=/tmp/pw-results.json \
  --feature=list-search-filter
```

**Output:** `reports/list-search-filter_DD_MM_YYYY_HH_MM_SS.html`

| Flag | Required | Description |
|------|----------|-------------|
| `--input` | Yes | Path to the Playwright JSON results file |
| `--feature` | No | Feature name prefix for the output file (defaults to first suite filename) |
| `--output` | No | Override the full output path, e.g. `--output=reports/my-report.html` |

### Step 3 — Open the report

```bash
open reports/list-search-filter_$(date +%d_%m_%Y_%H_%M_%S).html   # macOS
```

### One-liner: run + generate report in one command

```bash
npx playwright test tests/proposal/01-list-search-filter.spec.ts \
  --reporter=json 2>/dev/null > /tmp/pw-results.json \
  && node generate-report.js --input=/tmp/pw-results.json --feature=list-search-filter \
  && open reports/list-search-filter_$(date +%d_%m_%Y_%H_%M_%S).html
```

### npm shortcut

```bash
npm run report:list
```

---

## 4. Feature → Command Map

Add a new row here each time a new spec file + report command is introduced.

| Feature | Spec File | JSON Export Command | Report Command |
|---------|-----------|---------------------|----------------|
| Proposal List / Search / Filter | `tests/proposal/01-list-search-filter.spec.ts` | `npx playwright test tests/proposal/01-list-search-filter.spec.ts --reporter=json 2>/dev/null > /tmp/pw-results.json` | `node generate-report.js --input=/tmp/pw-results.json --feature=list-search-filter` |

---

## 5. Viewing the Playwright Built-in Report

Playwright also generates its own HTML report in `playwright-report/`. View it with:

```bash
npx playwright show-report
# or
npm run test:report
```

---

## 6. Debugging a Failing Test

```bash
# Run in headed mode with Playwright Inspector
npx playwright test tests/proposal/01-list-search-filter.spec.ts --debug

# View trace from a failed run
npx playwright show-trace test-results/<test-folder>/trace.zip
```

---

## 7. Reports Folder Convention

All custom HTML reports are saved under `reports/` using the naming convention:

```
reports/<feature-name>_DD_MM_YYYY_HH_MM_SS.html
```

Example: `reports/list-search-filter_13_06_2026_14_35_22.html`
