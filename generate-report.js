#!/usr/bin/env node
/**
 * generate-report.js
 * Parses Playwright JSON output and produces a styled standalone HTML report.
 *
 * Usage:
 *   npx playwright test --reporter=json 2>/dev/null | node generate-report.js
 *   node generate-report.js --input=test-results.json --output=reports/my-report.html
 *   node generate-report.js   # auto-discovers playwright-report/results.json
 */

const fs   = require('fs');
const path = require('path');

// ─── CLI args ──────────────────────────────────────────────────────────────────
const args = Object.fromEntries(
  process.argv.slice(2)
    .filter(a => a.startsWith('--'))
    .map(a => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; })
);

// ─── Resolve input ─────────────────────────────────────────────────────────────
// Priority: --input flag > stdin pipe > auto-discover
let jsonData;
if (args.input) {
  // Explicit file path always wins
  if (!fs.existsSync(args.input)) {
    console.error(`[generate-report] Input file not found: ${args.input}`);
    process.exit(1);
  }
  jsonData = JSON.parse(fs.readFileSync(args.input, 'utf8'));
} else if (process.stdin.isTTY === false) {
  // Only read stdin when it is genuinely a pipe (isTTY is strictly false, not undefined)
  jsonData = JSON.parse(fs.readFileSync('/dev/stdin', 'utf8'));
} else {
  const inputPath = 'playwright-report/results.json';
  if (!fs.existsSync(inputPath)) {
    console.error(`[generate-report] No input found. Provide one of:`);
    console.error('  node generate-report.js --input=<path-to-results.json>');
    console.error('  npx playwright test --reporter=json 2>/dev/null | node generate-report.js');
    process.exit(1);
  }
  jsonData = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
}

// ─── Resolve output ────────────────────────────────────────────────────────────
const now        = new Date();
const dd         = String(now.getDate()).padStart(2, '0');
const mm         = String(now.getMonth() + 1).padStart(2, '0');
const yyyy       = now.getFullYear();
const hh         = String(now.getHours()).padStart(2, '0');
const min        = String(now.getMinutes()).padStart(2, '0');
const ss         = String(now.getSeconds()).padStart(2, '0');
const featureName = args.feature ?? deriveFeatureName(jsonData);
const defaultOut  = path.join('reports', `${featureName}_${dd}_${mm}_${yyyy}_${hh}_${min}_${ss}.html`);
const outputPath  = args.output ?? defaultOut;

fs.mkdirSync(path.dirname(outputPath), { recursive: true });

// ─── Parse JSON ────────────────────────────────────────────────────────────────
const parsed = parsePlaywrightJson(jsonData);

// ─── Render & write ────────────────────────────────────────────────────────────
const html = renderHtml(parsed, { featureName, generatedAt: now.toISOString() });
fs.writeFileSync(outputPath, html, 'utf8');
console.log(`[generate-report] Report written → ${outputPath}`);

// ══════════════════════════════════════════════════════════════════════════════
// PARSER
// ══════════════════════════════════════════════════════════════════════════════
function parsePlaywrightJson(data) {
  const stats    = data.stats ?? {};
  const config   = data.config ?? {};
  const projects = data.config?.projects ?? [];

  // ── Collect suites ──────────────────────────────────────────────────────────
  const suites = [];
  let totalFlaky = 0;

  function walkSuites(suiteList, parentFile) {
    for (const suite of (suiteList ?? [])) {
      const file = suite.file ?? parentFile ?? suite.title ?? 'Unknown File';

      // Leaf specs inside this suite
      if (suite.specs?.length) {
        const tests = [];
        for (const spec of suite.specs) {
          for (const test of (spec.tests ?? [])) {
            const t = buildTest(spec, test, suite.title);
            if (t.status === 'flaky') totalFlaky++;
            tests.push(t);
          }
        }
        if (tests.length) {
          suites.push({ file, title: suite.title, tests });
        }
      }

      // Recurse into nested suites
      if (suite.suites?.length) {
        walkSuites(suite.suites, file);
      }
    }
  }

  walkSuites(data.suites ?? []);

  // ── Global counters ─────────────────────────────────────────────────────────
  const passed   = stats.expected   ?? 0;
  const failed   = stats.unexpected ?? 0;
  const skipped  = stats.skipped    ?? 0;
  const total    = passed + failed + skipped + totalFlaky;
  const duration = stats.duration   ?? 0;
  const startTime = stats.startTime ?? new Date().toISOString();

  const browser  = projects[0]?.use?.browserName ?? projects[0]?.name ?? 'chromium';
  const baseURL  = config.use?.baseURL ?? projects[0]?.use?.baseURL ?? '—';
  const os       = process.platform;

  return {
    summary: { total, passed, failed, skipped, flaky: totalFlaky, duration, startTime },
    meta:    { browser, baseURL, os },
    suites,
  };
}

function buildTest(spec, test, suiteTitle) {
  const results  = test.results ?? [];
  const attempts = results.length;

  // Determine status
  let status = 'unknown';
  if (attempts === 0) {
    status = 'skipped';
  } else if (attempts > 1) {
    const hasFailure = results.slice(0, -1).some(r => r.status !== 'passed');
    const lastPassed = results[results.length - 1].status === 'passed';
    if (hasFailure && lastPassed) {
      status = 'flaky';
    } else if (results.every(r => r.status === 'passed')) {
      status = 'passed';
    } else {
      status = 'failed';
    }
  } else {
    const s = results[0]?.status ?? 'skipped';
    status = s === 'expected' ? 'passed'
           : s === 'unexpected' ? 'failed'
           : s === 'skipped' ? 'skipped'
           : s;
  }

  const lastResult   = results[results.length - 1] ?? {};
  const duration     = results.reduce((sum, r) => sum + (r.duration ?? 0), 0);
  const errors       = results.flatMap(r => r.errors ?? []);
  const attachments  = results.flatMap(r => r.attachments ?? []);
  const steps        = lastResult.steps ?? [];
  const projectName  = test.projectName ?? test.projectId ?? '';
  const browser      = projectName || 'chromium';

  return {
    id:          `t_${Math.random().toString(36).slice(2, 9)}`,
    title:       spec.title ?? 'Untitled',
    suite:       suiteTitle ?? '',
    status,
    browser,
    duration,
    attempts,
    errors:      errors.map(e => ({
      message: e.message ?? '',
      stack:   e.stack   ?? '',
    })),
    attachments: attachments.map(a => ({
      name:        a.name        ?? '',
      contentType: a.contentType ?? '',
      path:        a.path        ?? a.body ?? '',
    })),
    steps: flattenSteps(steps),
  };
}

function flattenSteps(steps, depth = 0) {
  const result = [];
  for (const step of (steps ?? [])) {
    result.push({
      title:    step.title    ?? '',
      duration: step.duration ?? 0,
      error:    step.error    ?? null,
      depth,
    });
    if (step.steps?.length) {
      result.push(...flattenSteps(step.steps, depth + 1));
    }
  }
  return result;
}

function deriveFeatureName(data) {
  const first = data.suites?.[0];
  if (!first) return 'test-report';
  const raw = first.file ?? first.title ?? 'test-report';
  return path.basename(raw, path.extname(raw))
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

// ══════════════════════════════════════════════════════════════════════════════
// HTML RENDERER
// ══════════════════════════════════════════════════════════════════════════════
function renderHtml({ summary, meta, suites }, { featureName, generatedAt }) {
  const passRate = summary.total
    ? Math.round((summary.passed / summary.total) * 100)
    : 0;

  const fmtDur = ms => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
  };

  const execDate = new Date(summary.startTime).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });

  const statusIcon = s => ({
    passed:  '✓',
    failed:  '✕',
    flaky:   '⚡',
    skipped: '–',
  }[s] ?? '?');

  const statusColor = s => ({
    passed:  'text-emerald-400',
    failed:  'text-red-400',
    flaky:   'text-amber-400',
    skipped: 'text-slate-400',
  }[s] ?? 'text-slate-400');

  const statusBadge = s => ({
    passed:  'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
    failed:  'bg-red-500/20 text-red-300 border border-red-500/30',
    flaky:   'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    skipped: 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
  }[s] ?? 'bg-slate-500/20 text-slate-400');

  const statusDot = s => ({
    passed:  'bg-emerald-500',
    failed:  'bg-red-500',
    flaky:   'bg-amber-400',
    skipped: 'bg-slate-500',
  }[s] ?? 'bg-slate-500');

  const escHtml = str => String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  // ── KPI cards ───────────────────────────────────────────────────────────────
  const kpiCards = [
    { label: 'Total',    value: summary.total,    color: 'from-slate-700 to-slate-800',   icon: '📋', text: 'text-white'         },
    { label: 'Passed',   value: summary.passed,   color: 'from-emerald-600 to-emerald-800', icon: '✓', text: 'text-emerald-100'  },
    { label: 'Failed',   value: summary.failed,   color: 'from-red-600 to-red-800',         icon: '✕', text: 'text-red-100'      },
    { label: 'Flaky',    value: summary.flaky,    color: 'from-amber-500 to-amber-700',     icon: '⚡', text: 'text-amber-100'  },
    { label: 'Skipped',  value: summary.skipped,  color: 'from-slate-600 to-slate-700',     icon: '–', text: 'text-slate-200'    },
    { label: 'Duration', value: fmtDur(summary.duration), color: 'from-blue-600 to-blue-800', icon: '⏱', text: 'text-blue-100' },
  ].map(({ label, value, color, icon, text }) => `
    <div class="bg-gradient-to-br ${color} rounded-2xl p-5 shadow-lg flex flex-col gap-1">
      <div class="flex items-center justify-between">
        <span class="text-xs font-semibold uppercase tracking-widest ${text} opacity-70">${label}</span>
        <span class="text-xl">${icon}</span>
      </div>
      <div class="text-4xl font-black ${text}">${value}</div>
    </div>`).join('');

  // ── Suite rows ───────────────────────────────────────────────────────────────
  const suiteHtml = suites.map((suite, si) => {
    const suitePass    = suite.tests.filter(t => t.status === 'passed').length;
    const suiteFail    = suite.tests.filter(t => t.status === 'failed').length;
    const suiteFlaky   = suite.tests.filter(t => t.status === 'flaky').length;
    const suiteSkipped = suite.tests.filter(t => t.status === 'skipped').length;
    const suiteDur     = suite.tests.reduce((s, t) => s + t.duration, 0);
    const suiteStatus  = suiteFail > 0 ? 'failed' : suiteFlaky > 0 ? 'flaky' : 'passed';

    const testRows = suite.tests.map((t, ti) => {
      const expandable = t.status === 'failed' || t.status === 'flaky';
      const rowId = `row_${si}_${ti}`;

      const stepsHtml = t.steps.length ? `
        <div class="mt-3">
          <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Steps</p>
          <div class="space-y-1">
            ${t.steps.map(step => `
              <div class="flex items-start gap-2 text-xs font-mono" style="padding-left: ${step.depth * 16}px">
                <span class="${step.error ? 'text-red-400' : 'text-slate-500'}">${step.error ? '✕' : '›'}</span>
                <span class="${step.error ? 'text-red-300' : 'text-slate-300'}">${escHtml(step.title)}</span>
                <span class="ml-auto text-slate-500 shrink-0">${fmtDur(step.duration)}</span>
              </div>`).join('')}
          </div>
        </div>` : '';

      const errorsHtml = t.errors.length ? t.errors.map(e => `
        <div class="mt-3 rounded-xl bg-red-950/60 border border-red-800/40 p-4">
          <p class="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2">Error</p>
          <pre class="text-xs text-red-200 whitespace-pre-wrap break-all leading-relaxed">${escHtml(e.message)}</pre>
          ${e.stack ? `
            <details class="mt-2">
              <summary class="text-xs text-red-400 cursor-pointer hover:text-red-300 select-none">Stack trace</summary>
              <pre class="mt-2 text-xs text-slate-400 whitespace-pre-wrap break-all">${escHtml(e.stack)}</pre>
            </details>` : ''}
        </div>`).join('') : '';

      const screenshots = t.attachments.filter(a => a.contentType?.startsWith('image/'));
      const videos      = t.attachments.filter(a => a.contentType?.startsWith('video/'));

      const attachHtml = (screenshots.length || videos.length) ? `
        <div class="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
          ${screenshots.map(a => `
            <div>
              <p class="text-xs text-slate-400 mb-1">📷 ${escHtml(a.name)}</p>
              <img src="${escHtml(a.path)}" alt="${escHtml(a.name)}"
                   class="rounded-lg border border-slate-700 max-h-64 object-contain bg-slate-900 w-full"
                   onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
              <div class="hidden rounded-lg border border-dashed border-slate-600 h-24 items-center justify-center text-slate-500 text-xs">
                Screenshot not available
              </div>
            </div>`).join('')}
          ${videos.map(a => `
            <div>
              <p class="text-xs text-slate-400 mb-1">🎬 ${escHtml(a.name)}</p>
              <video src="${escHtml(a.path)}" controls
                     class="rounded-lg border border-slate-700 max-h-64 w-full bg-slate-900">
                <div class="rounded-lg border border-dashed border-slate-600 h-24 flex items-center justify-center text-slate-500 text-xs">
                  Video not available
                </div>
              </video>
            </div>`).join('')}
        </div>` : '';

      const detailPanel = expandable ? `
        <div id="${rowId}_detail" class="hidden mt-2 ml-10 rounded-xl bg-slate-900/80 border border-slate-700/50 p-4">
          ${stepsHtml}${errorsHtml}${attachHtml}
          ${!stepsHtml && !errorsHtml && !attachHtml
            ? '<p class="text-slate-500 text-xs italic">No additional details available.</p>'
            : ''}
        </div>` : '';

      return `
        <div class="group">
          <div class="${expandable ? 'cursor-pointer hover:bg-slate-700/30' : ''} rounded-xl px-4 py-3 flex items-center gap-3 transition-colors"
               ${expandable ? `onclick="toggleDetail('${rowId}_detail', this)"` : ''}>
            <div class="w-5 h-5 rounded-full ${statusDot(t.status)} flex items-center justify-center text-white text-xs font-bold shrink-0">
              ${statusIcon(t.status)}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-slate-200 truncate">${escHtml(t.title)}</p>
            </div>
            <div class="flex items-center gap-3 shrink-0">
              ${t.attempts > 1 ? `<span class="text-xs text-slate-500">${t.attempts} attempts</span>` : ''}
              <span class="text-xs font-mono text-slate-400 w-14 text-right">${fmtDur(t.duration)}</span>
              <span class="text-xs px-2 py-0.5 rounded-full font-semibold ${statusBadge(t.status)}">${t.status}</span>
              ${expandable ? `<span class="text-slate-500 text-xs expand-caret transition-transform">▶</span>` : ''}
            </div>
          </div>
          ${detailPanel}
        </div>`;
    }).join('');

    return `
      <div class="bg-slate-800/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden shadow-lg">
        <!-- Suite header -->
        <div class="flex items-center justify-between px-5 py-4 border-b border-slate-700/50 cursor-pointer hover:bg-slate-700/20 transition-colors"
             onclick="toggleSuite('suite_${si}')">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-2 h-2 rounded-full ${statusDot(suiteStatus)} shrink-0"></div>
            <div class="min-w-0">
              <p class="text-xs text-slate-400 font-mono truncate">${escHtml(suite.file)}</p>
              ${suite.title !== suite.file ? `<p class="text-sm font-semibold text-slate-100 truncate">${escHtml(suite.title)}</p>` : ''}
            </div>
          </div>
          <div class="flex items-center gap-2 shrink-0 ml-4">
            ${suitePass    ? `<span class="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">${suitePass}✓</span>` : ''}
            ${suiteFail    ? `<span class="text-xs bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-0.5 rounded-full">${suiteFail}✕</span>` : ''}
            ${suiteFlaky   ? `<span class="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">${suiteFlaky}⚡</span>` : ''}
            ${suiteSkipped ? `<span class="text-xs bg-slate-500/20 text-slate-400 border border-slate-500/30 px-2 py-0.5 rounded-full">${suiteSkipped}–</span>` : ''}
            <span class="text-xs text-slate-500 font-mono">${fmtDur(suiteDur)}</span>
            <span class="text-slate-500 text-xs suite-caret transition-transform">▼</span>
          </div>
        </div>
        <!-- Test list -->
        <div id="suite_${si}" class="divide-y divide-slate-700/30 px-2 py-2">
          ${testRows}
        </div>
      </div>`;
  }).join('');

  // ── Donut chart inline SVG ───────────────────────────────────────────────────
  const donutHtml = buildDonut(summary);

  // ── Full HTML ────────────────────────────────────────────────────────────────
  return `<!DOCTYPE html>
<html lang="en" class="h-full">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${escHtml(featureName)} — Test Report</title>
<script src="https://cdn.tailwindcss.com"></script>
<style>
  body { background: #0f172a; }
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: #1e293b; }
  ::-webkit-scrollbar-thumb { background: #475569; border-radius: 3px; }
  pre { font-family: 'Cascadia Code', 'Fira Code', monospace; }
  .expand-caret.open { transform: rotate(90deg); }
  .suite-caret.closed { transform: rotate(-90deg); }
</style>
</head>
<body class="min-h-full text-slate-100 font-sans antialiased">

<!-- ── Top bar ── -->
<header class="sticky top-0 z-50 bg-slate-900/95 backdrop-blur border-b border-slate-700/60 px-6 py-3 flex items-center justify-between">
  <div class="flex items-center gap-3">
    <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-black text-sm">PW</div>
    <div>
      <p class="text-sm font-bold text-slate-100">${escHtml(featureName)}</p>
      <p class="text-xs text-slate-400">Playwright Automation Report</p>
    </div>
  </div>
  <div class="flex items-center gap-4">
    <div class="text-right">
      <p class="text-xs text-slate-400">Generated</p>
      <p class="text-xs font-mono text-slate-300">${execDate}</p>
    </div>
    <div class="w-px h-8 bg-slate-700"></div>
    <div class="text-right">
      <p class="text-xs text-slate-400">Pass Rate</p>
      <p class="text-lg font-black ${passRate === 100 ? 'text-emerald-400' : passRate >= 80 ? 'text-amber-400' : 'text-red-400'}">${passRate}%</p>
    </div>
  </div>
</header>

<main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

  <!-- ── Summary Dashboard ── -->
  <section>
    <h2 class="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">Summary Dashboard</h2>
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      ${kpiCards}
    </div>
  </section>

  <!-- ── Environment + Donut ── -->
  <section class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div class="lg:col-span-2 bg-slate-800/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-5 shadow-lg">
      <h2 class="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">Environment</h2>
      <dl class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        ${[
          ['Browser',  meta.browser],
          ['Platform', meta.os],
          ['Base URL', meta.baseURL],
          ['Executed', execDate],
        ].map(([k, v]) => `
          <div class="bg-slate-900/60 rounded-xl p-3">
            <dt class="text-xs text-slate-500 font-medium mb-1">${k}</dt>
            <dd class="text-sm font-semibold text-slate-200 break-all">${escHtml(v)}</dd>
          </div>`).join('')}
      </dl>
    </div>
    <div class="bg-slate-800/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-5 shadow-lg flex flex-col items-center justify-center">
      <h2 class="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4 self-start">Distribution</h2>
      ${donutHtml}
    </div>
  </section>

  <!-- ── Filter bar ── -->
  <section class="flex flex-wrap items-center gap-3">
    <h2 class="text-xs font-semibold uppercase tracking-widest text-slate-500 mr-2">Filter</h2>
    ${['all', 'passed', 'failed', 'flaky', 'skipped'].map((f, i) => `
      <button onclick="filterTests('${f}')"
              class="filter-btn px-3 py-1.5 rounded-full text-xs font-semibold border transition-all
                     ${i === 0
                       ? 'bg-blue-600 border-blue-500 text-white active'
                       : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-500'}"
              data-filter="${f}">
        ${f.charAt(0).toUpperCase() + f.slice(1)}
      </button>`).join('')}
    <div class="ml-auto">
      <input type="search" id="searchInput" placeholder="Search tests…"
             oninput="searchTests(this.value)"
             class="bg-slate-800 border border-slate-600 rounded-full px-4 py-1.5 text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:border-blue-500 w-52 transition-colors"/>
    </div>
  </section>

  <!-- ── Detailed Results ── -->
  <section id="resultsContainer" class="space-y-4">
    <h2 class="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">Test Results</h2>
    ${suiteHtml || '<p class="text-slate-500 text-sm text-center py-12">No test results found.</p>'}
  </section>

</main>

<footer class="text-center text-xs text-slate-600 py-8">
  Generated by <span class="text-slate-500 font-mono">generate-report.js</span> · ${escHtml(generatedAt)}
</footer>

<script>
function toggleDetail(id, btn) {
  const el = document.getElementById(id);
  if (!el) return;
  const caret = btn.querySelector('.expand-caret');
  const hidden = el.classList.toggle('hidden');
  if (caret) caret.classList.toggle('open', !hidden);
}

function toggleSuite(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const header = el.previousElementSibling;
  const caret  = header?.querySelector('.suite-caret');
  const hidden = el.classList.toggle('hidden');
  if (caret) caret.classList.toggle('closed', hidden);
}

function filterTests(status) {
  document.querySelectorAll('.filter-btn').forEach(b => {
    const active = b.dataset.filter === status;
    b.classList.toggle('bg-blue-600',    active);
    b.classList.toggle('border-blue-500', active);
    b.classList.toggle('text-white',     active);
    b.classList.toggle('bg-slate-800',   !active);
    b.classList.toggle('border-slate-600', !active);
    b.classList.toggle('text-slate-400', !active);
  });

  document.querySelectorAll('#resultsContainer > div').forEach(suiteEl => {
    const rows = suiteEl.querySelectorAll('.group');
    let anyVisible = false;
    rows.forEach(row => {
      const badge = row.querySelector('[class*="rounded-full"][class*="font-semibold"]');
      const rowStatus = badge?.textContent?.trim()?.toLowerCase() ?? '';
      const show = status === 'all' || rowStatus === status;
      row.style.display = show ? '' : 'none';
      if (show) anyVisible = true;
    });
    suiteEl.style.display = anyVisible || status === 'all' ? '' : 'none';
  });
}

function searchTests(query) {
  const q = query.toLowerCase().trim();
  document.querySelectorAll('#resultsContainer > div').forEach(suiteEl => {
    const rows = suiteEl.querySelectorAll('.group');
    let anyVisible = false;
    rows.forEach(row => {
      const title = row.querySelector('p.text-sm')?.textContent?.toLowerCase() ?? '';
      const show = !q || title.includes(q);
      row.style.display = show ? '' : 'none';
      if (show) anyVisible = true;
    });
    suiteEl.style.display = anyVisible ? '' : 'none';
  });
}
</script>

</body>
</html>`;
}

// ── Donut SVG ──────────────────────────────────────────────────────────────────
function buildDonut({ total, passed, failed, flaky, skipped }) {
  if (total === 0) return '<p class="text-slate-500 text-xs">No data</p>';

  const r = 60, cx = 80, cy = 80, stroke = 18;
  const circ = 2 * Math.PI * r;

  const segments = [
    { value: passed,  color: '#10b981', label: 'Passed'  },
    { value: failed,  color: '#ef4444', label: 'Failed'  },
    { value: flaky,   color: '#f59e0b', label: 'Flaky'   },
    { value: skipped, color: '#64748b', label: 'Skipped' },
  ].filter(s => s.value > 0);

  let offset = 0;
  const paths = segments.map(s => {
    const dash = (s.value / total) * circ;
    const gap  = circ - dash;
    const el   = `<circle cx="${cx}" cy="${cy}" r="${r}"
      fill="none" stroke="${s.color}" stroke-width="${stroke}"
      stroke-dasharray="${dash.toFixed(2)} ${gap.toFixed(2)}"
      stroke-dashoffset="${(-offset).toFixed(2)}"
      transform="rotate(-90 ${cx} ${cy})" opacity="0.9"/>`;
    offset += dash;
    return el;
  });

  const passRate = Math.round((passed / total) * 100);

  return `
    <div class="flex flex-col items-center gap-3 w-full">
      <svg viewBox="0 0 160 160" class="w-32 h-32">
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#1e293b" stroke-width="${stroke}"/>
        ${paths.join('')}
        <text x="${cx}" y="${cy - 6}" text-anchor="middle" fill="white" font-size="20" font-weight="900" font-family="sans-serif">${passRate}%</text>
        <text x="${cx}" y="${cy + 12}" text-anchor="middle" fill="#94a3b8" font-size="9" font-family="sans-serif">pass rate</text>
      </svg>
      <div class="flex flex-wrap justify-center gap-x-4 gap-y-1">
        ${segments.map(s => `
          <div class="flex items-center gap-1.5">
            <div class="w-2.5 h-2.5 rounded-full" style="background:${s.color}"></div>
            <span class="text-xs text-slate-400">${s.label} (${s.value})</span>
          </div>`).join('')}
      </div>
    </div>`;
}
