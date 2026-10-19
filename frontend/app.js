const API_BASE = window.location.port === '8000' ? '' : 'http://localhost:8000';

// ─────────────────────────────────────────────
// PRESETS ACROSS MULTIPLE LANGUAGES
// ─────────────────────────────────────────────
const PRESETS = {
  python_loop: `# Heavy computation loop in Python
def process_data(n=400000):
    total = 0
    for i in range(n):
        total += i * i
    return total

print("Python processing result:", process_data())`,

  js_matrix: `// Matrix multiplication in JavaScript / Node.js
function multiplyMatrix(n = 90) {
    const A = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => i + j));
    const B = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => i * j));
    const C = Array.from({ length: n }, () => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            for (let k = 0; k < n; k++) {
                C[i][j] += A[i][k] * B[k][j];
            }
        }
    }
    return C[0][0];
}

console.log("JavaScript matrix result:", multiplyMatrix());`,

  cpp_fib: `// C++ computationally heavy loop workload
#include <iostream>

long long heavy_computation(int n = 1500000) {
    long long sum = 0;
    for (int i = 0; i < n; i++) {
        sum += (long long)i * 3 + (i % 7);
    }
    return sum;
}

int main() {
    std::cout << "C++ result: " << heavy_computation() << std::endl;
    return 0;
}`,

  java_loop: `// Java computationally intensive loop
public class Main {
    public static long compute(int n) {
        long total = 0;
        for (int i = 0; i < n; i++) {
            total += (long) i * i;
        }
        return total;
    }

    public static void main(String[] args) {
        System.out.println("Java result: " + compute(300000));
    }
}`,

  io_loop: `# File I/O inside loop
def file_io_loop():
    total = 0
    for i in range(50):
        with open("temp_test.txt", "w") as f:
            f.write(f"Iteration {i}")
        total += i
    return total

print("I/O completed:", file_io_loop())`,

  // Backwards compatibility aliases
  matrix: `# Matrix multiplication O(N^3)
def matrix_multiply(n=120):
    A = [[i + j for j in range(n)] for i in range(n)]
    B = [[i * j for j in range(n)] for i in range(n)]
    C = [[0]*n for _ in range(n)]

    for i in range(n):
        for j in range(n):
            for k in range(n):
                C[i][j] += A[i][k] * B[k][j]
    return C[0][0]

print("Matrix result:", matrix_multiply())`,

  loop: `# Heavy single loop O(N)
def heavy_loop(n=500000):
    total = 0
    for i in range(n):
        total += i * i
    return total

print("Sum result:", heavy_loop())`,

  io: `# File I/O inside loop
def file_io_loop():
    total = 0
    for i in range(50):
        with open("temp_test.txt", "w") as f:
            f.write(f"Iteration {i}")
        total += i
    return total

print("I/O completed:", file_io_loop())`
};

// ─────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────
let selectedFiles = [];

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  checkBackendHealth();
  loadGridData();
  fetchBudgetStatus();
});

// ─────────────────────────────────────────────
// TAB SWITCHER
// ─────────────────────────────────────────────
function switchTab(tabId) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  if (event && event.currentTarget) {
    event.currentTarget.classList.add('active');
  }
  const tabEl = document.getElementById(`tab-${tabId}`);
  if (tabEl) tabEl.classList.add('active');
}

// ─────────────────────────────────────────────
// PRESET LOADER
// ─────────────────────────────────────────────
function loadPreset(key) {
  if (PRESETS[key]) {
    clearFileSelection();
    document.getElementById('codeEditor').value = PRESETS[key];
    
    // Auto-update language selector
    const langSel = document.getElementById('languageSelect');
    if (langSel) {
      if (key.startsWith('js_')) langSel.value = 'javascript';
      else if (key.startsWith('cpp_')) langSel.value = 'cpp';
      else if (key.startsWith('java_')) langSel.value = 'java';
      else if (key.startsWith('python_') || key === 'matrix' || key === 'loop' || key === 'io' || key === 'io_loop') langSel.value = 'python';
      else langSel.value = 'auto';
    }

    // Update preset pills active styling
    document.querySelectorAll('.preset-pills .pill').forEach(p => p.classList.remove('active'));
    if (event && event.currentTarget) {
      event.currentTarget.classList.add('active');
    }
  }
}

// ─────────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────────
async function checkBackendHealth() {
  const badge = document.getElementById('apiStatusBadge');
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (res.ok) {
      badge.querySelector('span').innerText = 'Backend Connected';
      badge.querySelector('.dot').style.backgroundColor = '#10b981';
    } else throw new Error();
  } catch {
    badge.querySelector('span').innerText = 'Backend Offline';
    badge.querySelector('.dot').style.backgroundColor = '#ef4444';
  }
}

// ─────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────
function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function detectLanguageFromFilename(filename) {
  if (!filename) return 'code';
  const ext = filename.split('.').pop().toLowerCase();
  const map = {
    py: 'python',
    pyw: 'python',
    js: 'javascript',
    mjs: 'javascript',
    cjs: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    c: 'c',
    h: 'c',
    cpp: 'cpp',
    cc: 'cpp',
    cxx: 'cpp',
    hpp: 'cpp',
    java: 'java',
    go: 'go',
    rs: 'rust',
    sh: 'bash',
    bash: 'bash',
    ps1: 'powershell',
    php: 'php',
    rb: 'ruby',
    r: 'r',
    cs: 'csharp',
    sql: 'sql',
    html: 'html',
    css: 'css',
  };
  return map[ext] || 'generic';
}

// ─────────────────────────────────────────────
// FILE SELECTION HANDLER (ACCEPTS ALL LANGUAGES)
// ─────────────────────────────────────────────
function handleFileSelect(event) {
  const files = Array.from(event.target.files || []).filter(f => {
    const name = f.name;
    return !name.startsWith('.') || name.includes('.');
  });

  if (files.length === 0) {
    alert('No files found in selection.');
    return;
  }

  selectedFiles = files;
  renderFileChips();

  const label = document.getElementById('profileBtnLabel');
  const icon  = document.getElementById('profileBtnIcon');

  if (files.length === 1) {
    label.textContent = `Profile 1 File`;
    icon.className = 'fa-solid fa-file-code';

    // Auto-update language dropdown
    const detected = detectLanguageFromFilename(files[0].name);
    const langSel = document.getElementById('languageSelect');
    if (langSel && detected && detected !== 'generic') {
      langSel.value = detected;
    }

    // Load preview into editor
    const reader = new FileReader();
    reader.onload = e => {
      document.getElementById('codeEditor').value = e.target.result;
    };
    reader.readAsText(files[0]);
  } else {
    label.textContent = `Profile ${files.length} Files`;
    icon.className = 'fa-solid fa-folder-tree';
  }

  event.target.value = '';
}

function clearFileSelection() {
  selectedFiles = [];
  const bar = document.getElementById('fileChipsBar');
  if (bar) {
    bar.style.display = 'none';
    bar.innerHTML = '';
  }
  document.getElementById('profileBtnLabel').textContent = 'Profile Execution';
  document.getElementById('profileBtnIcon').className = 'fa-solid fa-play';
}

function renderFileChips() {
  const bar = document.getElementById('fileChipsBar');
  if (!bar) return;
  bar.style.display = 'flex';
  bar.innerHTML = '';

  selectedFiles.forEach((f) => {
    const chip = document.createElement('span');
    const lang = detectLanguageFromFilename(f.name);
    chip.style.cssText = 'display:inline-flex;align-items:center;gap:0.35rem;background:rgba(59,130,246,0.12);border:1px solid rgba(59,130,246,0.3);color:#93c5fd;font-family:var(--font-code);font-size:0.75rem;padding:0.25rem 0.6rem;border-radius:20px;';
    chip.innerHTML = `<i class="fa-solid fa-file-code" style="font-size:0.7rem;"></i>${escapeHtml(f.name)} <span style="font-size:0.65rem;opacity:0.8;background:rgba(255,255,255,0.1);padding:0.1rem 0.35rem;border-radius:6px;">${lang}</span>`;
    bar.appendChild(chip);
  });

  const clearBtn = document.createElement('button');
  clearBtn.textContent = '✕ Clear';
  clearBtn.style.cssText = 'background:rgba(239,68,68,0.12);border:1px solid rgba(239,68,68,0.3);color:#f87171;font-size:0.75rem;padding:0.25rem 0.6rem;border-radius:20px;cursor:pointer;';
  clearBtn.onclick = () => {
    clearFileSelection();
    document.getElementById('singleFileResults').style.display = '';
    document.getElementById('multiFileResults').style.display = 'none';
  };
  bar.appendChild(clearBtn);
}

// ─────────────────────────────────────────────
// MAIN PROFILE ACTION
// ─────────────────────────────────────────────
async function runProfileAction() {
  if (selectedFiles.length > 1) {
    await runMultiFileProfiling();
  } else {
    await runProfiling();
  }
}

// ─────────────────────────────────────────────
// SINGLE-FILE / CODE EDITOR PROFILING
// ─────────────────────────────────────────────
async function runProfiling() {
  let code;
  let filename = null;
  if (selectedFiles.length === 1) {
    code = await selectedFiles[0].text();
    filename = selectedFiles[0].name;
  } else {
    code = document.getElementById('codeEditor').value;
  }
  const region = document.getElementById('regionSelect').value;
  const langSel = document.getElementById('languageSelect');
  const language = langSel ? langSel.value : 'auto';

  if (!code.trim()) {
    alert('Please enter code to profile.');
    return;
  }

  setSpinner(true, 'Profiling execution & carbon footprint...');
  document.getElementById('singleFileResults').style.display = '';
  document.getElementById('multiFileResults').style.display = 'none';

  try {
    const res = await fetch(`${API_BASE}/api/profile/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scriptContent: code, region, projectId: 'default', language })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Profiling execution failed.');
    }

    const data = await res.json();
    renderProfileResults(data);
    fetchBudgetStatus();
  } catch (err) {
    alert(`Execution Error: ${err.message}`);
  } finally {
    setSpinner(false);
  }
}

// ─────────────────────────────────────────────
// MULTI-FILE PROFILING
// ─────────────────────────────────────────────
async function runMultiFileProfiling() {
  const region = document.getElementById('regionSelect').value;
  setSpinner(true, `Profiling ${selectedFiles.length} files across languages...`);

  document.getElementById('singleFileResults').style.display = 'none';
  document.getElementById('multiFileResults').style.display = 'none';

  try {
    const formData = new FormData();
    selectedFiles.forEach(f => formData.append('files', f, f.name));
    formData.append('region', region);
    formData.append('projectId', 'default');

    const res = await fetch(`${API_BASE}/api/profile/multi`, {
      method: 'POST',
      body: formData
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Multi-file profiling failed.');
    }

    const data = await res.json();
    renderMultiFileResults(data, region);
    fetchBudgetStatus();
  } catch (err) {
    alert(`Batch Execution Error: ${err.message}`);
    document.getElementById('singleFileResults').style.display = '';
  } finally {
    setSpinner(false);
  }
}

// ─────────────────────────────────────────────
// SPINNER
// ─────────────────────────────────────────────
function setSpinner(show, label = 'Profiling...') {
  const el = document.getElementById('profilingSpinner');
  const btn = document.getElementById('profileBtn');
  if (el) el.style.display = show ? 'block' : 'none';
  const lbl = document.getElementById('spinnerLabel');
  if (lbl) lbl.textContent = label;
  if (btn) {
    btn.disabled = show;
    btn.style.opacity = show ? '0.6' : '1';
  }
}

// ─────────────────────────────────────────────
// RENDER SINGLE-FILE RESULTS
// ─────────────────────────────────────────────
function renderProfileResults(data) {
  const m = data.metrics || {};
  document.getElementById('valEmissions').innerHTML = `${(m.emissions_g_co2 || 0).toFixed(4)} <span style="font-size:0.9rem;">g CO&#8322;</span>`;
  document.getElementById('valEmissionsMg').innerText = `${(m.emissions_mg_co2 || 0).toFixed(2)} mg CO&#8322;`;
  document.getElementById('valRuntime').innerHTML = `${(m.execution_time_s || 0).toFixed(3)} <span style="font-size:0.9rem;">s</span>`;
  document.getElementById('valCpu').innerText = `CPU: ${(m.cpu_percent || 0).toFixed(1)}% | RAM: ${(m.memory_rss_mb || 0).toFixed(1)} MB`;
  document.getElementById('valEnergy').innerHTML = `${(m.energy_wh || 0).toFixed(6)} <span style="font-size:0.9rem;">Wh</span>`;
  document.getElementById('valPower').innerText = `Power: ${(m.power_watts || 0).toFixed(1)} W`;
  const eq = m.equivalencies || {};
  document.getElementById('valEquiv').innerHTML = `${(eq.smartphone_charges || 0).toFixed(4)} <span style="font-size:0.8rem;">Charges</span>`;
  document.getElementById('valCar').innerText = `${(eq.car_meters_driven || 0).toFixed(2)} meters driven`;
  document.getElementById('stdoutConsole').innerText = data.stdout || data.stderr || 'No output.';

  // Show language tag badge
  const langBadge = document.getElementById('singleResultLangBadge');
  if (langBadge) {
    langBadge.style.display = 'inline-flex';
    langBadge.innerHTML = `<i class="fa-solid fa-code" style="margin-right:0.3rem;"></i>${escapeHtml(data.languageDisplay || data.language || 'Code')}`;
  }
  const topTag = document.getElementById('detectedLangTag');
  if (topTag) {
    topTag.style.display = 'inline-block';
    topTag.textContent = data.languageDisplay || data.language || 'Code';
  }

  renderHotspotTable('hotspotTableBody', data.hotspots || []);
  renderLineStatsTable('lineStatsTableBody', data.line_stats || []);
}

// ─────────────────────────────────────────────
// RENDER MULTI-FILE RESULTS
// ─────────────────────────────────────────────
function renderMultiFileResults(data, region) {
  document.getElementById('multiFileResults').style.display = '';
  document.getElementById('mfTotalEmissions').textContent = `${(data.totalEmissionsG || 0).toFixed(4)} g CO\u2082`;
  document.getElementById('mfFileCount').textContent = `${data.successCount} / ${data.totalFiles}`;
  document.getElementById('mfRegion').textContent = region;

  const list = document.getElementById('mfFileList');
  list.innerHTML = '';

  (data.files || []).forEach((fileResult, idx) => {
    const card = buildFileAccordion(fileResult, idx);
    list.appendChild(card);
  });
}

function buildFileAccordion(fileResult, idx) {
  const wrapper = document.createElement('div');
  wrapper.className = 'card';
  wrapper.style.marginBottom = '1rem';

  const statusColor = fileResult.status === 'ok' ? '#10b981' : fileResult.status === 'error' ? '#ef4444' : '#6b7280';
  const statusIcon  = fileResult.status === 'ok' ? 'fa-circle-check' : fileResult.status === 'error' ? 'fa-circle-xmark' : 'fa-circle-minus';
  const m = fileResult.metrics || {};
  const emissions = (m.emissions_g_co2 || 0).toFixed(4);
  const runtime   = (m.execution_time_s || 0).toFixed(3);

  const headerId = `mf-header-${idx}`;
  const bodyId   = `mf-body-${idx}`;

  const langTag = fileResult.languageDisplay || fileResult.language
    ? `<span style="font-size:0.7rem;background:rgba(59,130,246,0.15);border:1px solid rgba(59,130,246,0.3);color:#93c5fd;padding:0.15rem 0.5rem;border-radius:12px;">${escapeHtml(fileResult.languageDisplay || fileResult.language)}</span>`
    : '';

  wrapper.innerHTML = `
    <div id="${headerId}" onclick="toggleAccordion('${bodyId}', '${headerId}')"
      style="display:flex;justify-content:space-between;align-items:center;cursor:pointer;flex-wrap:wrap;gap:0.5rem;">
      <div style="display:flex;align-items:center;gap:0.7rem;">
        <i class="fa-solid ${statusIcon}" style="color:${statusColor};font-size:1rem;"></i>
        <span style="font-family:var(--font-code);font-size:0.9rem;font-weight:600;">${escapeHtml(fileResult.filename)}</span>
        ${langTag}
        ${fileResult.error ? `<span style="font-size:0.75rem;color:#f87171;">${escapeHtml(fileResult.error)}</span>` : ''}
      </div>
      <div style="display:flex;align-items:center;gap:1.2rem;">
        ${m.emissions_g_co2 !== undefined ? `
          <span style="font-size:0.8rem;color:var(--text-muted);">
            <strong style="color:var(--primary-emerald);">${emissions}</strong> g CO&#8322; &bull; ${runtime}s
          </span>` : ''}
        <i class="fa-solid fa-chevron-down" id="${headerId}-chevron" style="color:var(--text-dim);font-size:0.8rem;transition:transform 0.2s;"></i>
      </div>
    </div>

    <div id="${bodyId}" style="display:none;margin-top:1.2rem;border-top:1px solid var(--border-color);padding-top:1rem;">
      ${m.emissions_g_co2 !== undefined ? `
      <!-- Mini metrics bar -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:0.6rem;margin-bottom:1rem;">
        <div style="background:rgba(255,255,255,0.02);border:1px solid var(--border-color);border-radius:8px;padding:0.6rem;text-align:center;">
          <div style="font-size:0.72rem;color:var(--text-muted);">Emissions</div>
          <div style="font-size:1rem;font-weight:700;color:var(--primary-emerald);">${emissions} g</div>
        </div>
        <div style="background:rgba(255,255,255,0.02);border:1px solid var(--border-color);border-radius:8px;padding:0.6rem;text-align:center;">
          <div style="font-size:0.72rem;color:var(--text-muted);">Runtime</div>
          <div style="font-size:1rem;font-weight:700;color:#60a5fa;">${runtime} s</div>
        </div>
        <div style="background:rgba(255,255,255,0.02);border:1px solid var(--border-color);border-radius:8px;padding:0.6rem;text-align:center;">
          <div style="font-size:0.72rem;color:var(--text-muted);">Energy</div>
          <div style="font-size:1rem;font-weight:700;color:#c084fc;">${(m.energy_wh || 0).toFixed(4)} Wh</div>
        </div>
        <div style="background:rgba(255,255,255,0.02);border:1px solid var(--border-color);border-radius:8px;padding:0.6rem;text-align:center;">
          <div style="font-size:0.72rem;color:var(--text-muted);">CPU / RAM</div>
          <div style="font-size:0.85rem;font-weight:600;color:var(--text-dim);">${(m.cpu_percent || 0).toFixed(0)}% / ${(m.memory_rss_mb || 0).toFixed(1)}MB</div>
        </div>
      </div>` : ''}

      <!-- Function hotspots for this file -->
      <div style="margin-bottom:1rem;">
        <div style="font-size:0.82rem;font-weight:600;color:var(--text-muted);margin-bottom:0.5rem;">
          <i class="fa-solid fa-fire-flame-curved" style="color:#f59e0b;margin-right:0.3rem;"></i>Function Hotspots
        </div>
        <div class="table-container" style="max-height:180px;">
          ${buildHotspotTableHtml(fileResult.hotspots || [])}
        </div>
      </div>

      <!-- Line stats for this file -->
      <div style="margin-bottom:1rem;">
        <div style="font-size:0.82rem;font-weight:600;color:var(--text-muted);margin-bottom:0.5rem;">
          <i class="fa-solid fa-list-ol" style="color:#60a5fa;margin-right:0.3rem;"></i>Top Line Attributions
        </div>
        <div class="table-container" style="max-height:180px;">
          ${buildLineStatsTableHtml(fileResult.line_stats || [])}
        </div>
      </div>

      ${fileResult.stdout || fileResult.stderr ? `
      <div>
        <div style="font-size:0.78rem;color:var(--text-dim);margin-bottom:0.3rem;">Console Output:</div>
        <pre class="console-box" style="max-height:120px;font-size:0.75rem;">${escapeHtml(fileResult.stdout || fileResult.stderr)}</pre>
      </div>` : ''}
    </div>
  `;

  return wrapper;
}

function toggleAccordion(bodyId, headerId) {
  const body = document.getElementById(bodyId);
  const chevron = document.getElementById(`${headerId}-chevron`);
  if (!body) return;
  const isOpen = body.style.display !== 'none';
  body.style.display = isOpen ? 'none' : 'block';
  if (chevron) {
    chevron.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
  }
}

// ─────────────────────────────────────────────
// VIEW SWITCHER (Hotspots vs Lines)
// ─────────────────────────────────────────────
function switchImpactView(view) {
  const isFunc = view === 'function';
  document.getElementById('viewFunctionSection').style.display = isFunc ? 'block' : 'none';
  document.getElementById('viewLineSection').style.display = isFunc ? 'none' : 'block';
  document.getElementById('tabViewFunction').className = isFunc ? 'pill active' : 'pill';
  document.getElementById('tabViewLine').className = isFunc ? 'pill' : 'pill active';
}

// ─────────────────────────────────────────────
// RENDER HOTSPOT TABLE (Safe DOM Construction)
// ─────────────────────────────────────────────
function renderHotspotTable(tbodyId, hotspots) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;
  tbody.innerHTML = '';

  if (!hotspots || hotspots.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-dim);padding:1.5rem;">No function hotspots detected.</td></tr>';
    return;
  }

  hotspots.forEach(h => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${escapeHtml(h.function)}</strong> <span style="color:var(--text-dim);font-size:0.75rem;">(${escapeHtml(h.filename || 'script')}:${h.lineno})</span></td>
      <td>${h.ncalls != null ? h.ncalls : 1}</td>
      <td>${(h.cumtime_s || 0).toFixed(4)}s</td>
      <td>
        <div style="display:flex;align-items:center;gap:0.5rem;">
          <div style="flex:1;background:rgba(255,255,255,0.08);border-radius:3px;height:6px;overflow:hidden;">
            <div style="width:${Math.min(100, (h.contribution_pct || 0)).toFixed(1)}%;height:100%;background:${h.is_hotspot ? '#ef4444' : 'var(--primary-emerald)'};"></div>
          </div>
          <span style="font-size:0.8rem;min-width:38px;">${(h.contribution_pct || 0).toFixed(1)}%</span>
        </div>
      </td>
      <td><strong style="color:${h.is_hotspot ? '#f87171' : 'var(--text-main)'};">${(h.attributed_co2_g || 0).toFixed(5)}</strong> g</td>
    `;
    tbody.appendChild(tr);
  });
}

function buildHotspotTableHtml(hotspots) {
  if (!hotspots || hotspots.length === 0) {
    return `<table class="carbon-table">
      <thead><tr><th>Function</th><th>Calls</th><th>Time</th><th>Contribution</th><th>Attributed CO&#8322;</th></tr></thead>
      <tbody><tr><td colspan="5" style="text-align:center;color:var(--text-dim);padding:1.2rem;">No function hotspots detected.</td></tr></tbody>
    </table>`;
  }
  const rows = hotspots.map(h => `
    <tr>
      <td><strong>${escapeHtml(h.function)}</strong> <span style="color:var(--text-dim);font-size:0.75rem;">(${escapeHtml(h.filename || 'script')}:${h.lineno})</span></td>
      <td>${h.ncalls != null ? h.ncalls : 1}</td>
      <td>${(h.cumtime_s || 0).toFixed(4)}s</td>
      <td>
        <div style="display:flex;align-items:center;gap:0.4rem;">
          <div style="flex:1;background:rgba(255,255,255,0.08);border-radius:3px;height:5px;overflow:hidden;">
            <div style="width:${Math.min(100, (h.contribution_pct || 0)).toFixed(1)}%;height:100%;background:${h.is_hotspot ? '#ef4444' : 'var(--primary-emerald)'};"></div>
          </div>
          <span style="font-size:0.78rem;min-width:36px;">${(h.contribution_pct || 0).toFixed(1)}%</span>
        </div>
      </td>
      <td><strong style="color:${h.is_hotspot ? '#f87171' : 'var(--text-main)'};">${(h.attributed_co2_g || 0).toFixed(5)}</strong> g</td>
    </tr>
  `).join('');

  return `<table class="carbon-table">
    <thead><tr><th>Function</th><th>Calls</th><th>Time</th><th>Contribution</th><th>Attributed CO&#8322;</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

// ─────────────────────────────────────────────
// RENDER LINE STATS TABLE (Safe DOM Construction)
// ─────────────────────────────────────────────
function renderLineStatsTable(tbodyId, lineStats) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;
  tbody.innerHTML = '';

  if (!lineStats || lineStats.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-dim);padding:1.5rem;">No line attribution recorded.</td></tr>';
    return;
  }

  lineStats.forEach(ls => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>Line ${ls.lineno}</td>
      <td><code class="code-font" style="font-size:0.8rem;color:#93c5fd;">${escapeHtml(ls.content)}</code></td>
      <td>${ls.hits || 0}</td>
      <td>
        <div style="display:flex;align-items:center;gap:0.5rem;">
          <div style="flex:1;background:rgba(255,255,255,0.08);border-radius:3px;height:6px;overflow:hidden;">
            <div style="width:${Math.min(100, (ls.share_pct || 0)).toFixed(1)}%;height:100%;background:${ls.is_hotspot ? '#ef4444' : '#60a5fa'};"></div>
          </div>
          <span style="font-size:0.8rem;min-width:38px;">${(ls.share_pct || 0).toFixed(1)}%</span>
        </div>
      </td>
      <td><strong style="color:${ls.is_hotspot ? '#f87171' : 'var(--text-main)'};">${(ls.attributed_co2_g || 0).toFixed(6)}</strong> g</td>
    `;
    tbody.appendChild(tr);
  });
}

function buildLineStatsTableHtml(lineStats) {
  if (!lineStats || lineStats.length === 0) {
    return `<table class="carbon-table">
      <thead><tr><th>Line #</th><th>Code Snippet</th><th>Hits</th><th>Share</th><th>Attributed CO&#8322;</th></tr></thead>
      <tbody><tr><td colspan="5" style="text-align:center;color:var(--text-dim);padding:1.2rem;">No line attribution recorded.</td></tr></tbody>
    </table>`;
  }
  const rows = lineStats.slice(0, 50).map(ls => `
    <tr>
      <td>Line ${ls.lineno}</td>
      <td><code class="code-font" style="font-size:0.78rem;color:#93c5fd;">${escapeHtml(ls.content)}</code></td>
      <td>${ls.hits || 0}</td>
      <td>
        <div style="display:flex;align-items:center;gap:0.4rem;">
          <div style="flex:1;background:rgba(255,255,255,0.08);border-radius:3px;height:5px;overflow:hidden;">
            <div style="width:${Math.min(100, (ls.share_pct || 0)).toFixed(1)}%;height:100%;background:${ls.is_hotspot ? '#ef4444' : '#60a5fa'};"></div>
          </div>
          <span style="font-size:0.78rem;min-width:36px;">${(ls.share_pct || 0).toFixed(1)}%</span>
        </div>
      </td>
      <td><strong style="color:${ls.is_hotspot ? '#f87171' : 'var(--text-main)'};">${(ls.attributed_co2_g || 0).toFixed(6)}</strong> g</td>
    </tr>
  `).join('');

  return `<table class="carbon-table">
    <thead><tr><th>Line #</th><th>Code Snippet</th><th>Hits</th><th>Share</th><th>Attributed CO&#8322;</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

// ─────────────────────────────────────────────
// GRID DATA
// ─────────────────────────────────────────────
async function loadGridData() {
  const container = document.getElementById('gridStatesList');
  if (!container) return;
  try {
    const res = await fetch(`${API_BASE}/api/grid/india/states`);
    const data = await res.json();
    const states = data.states || {};
    container.innerHTML = '';
    Object.keys(states).sort().forEach(state => {
      const intensity = states[state];
      const isHigh = intensity > 750;
      const isLow = intensity < 500;
      const badgeClass = isLow ? 'badge-low' : (isHigh ? 'badge-high' : 'badge-med');
      const div = document.createElement('div');
      div.className = 'grid-state-card';
      div.innerHTML = `
        <div class="state-name">${escapeHtml(state)}</div>
        <div class="state-intensity">${intensity} <span class="unit">g/kWh</span></div>
        <div class="badge ${badgeClass}" style="margin-top:0.3rem;">${isLow ? 'Low Carbon' : (isHigh ? 'High Carbon' : 'Moderate')}</div>
      `;
      container.appendChild(div);
    });
  } catch (err) {
    console.error('Grid data fetch failed:', err);
  }
}

// ─────────────────────────────────────────────
// BUDGET MANAGEMENT
// ─────────────────────────────────────────────
async function setMonthlyBudget() {
  const limit = parseFloat(document.getElementById('budgetInput').value);
  if (!limit || limit <= 0) {
    alert('Please enter a valid monthly limit greater than 0.');
    return;
  }
  try {
    const res = await fetch(`${API_BASE}/api/budget/set`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: 'default', monthlyLimitGrams: limit })
    });
    if (!res.ok) throw new Error('Budget update failed');
    fetchBudgetStatus();
    alert('Carbon budget successfully updated!');
  } catch (err) {
    alert(err.message);
  }
}

async function fetchBudgetStatus() {
  try {
    const res = await fetch(`${API_BASE}/api/budget/status/default`);
    if (!res.ok) return;
    const data = await res.json();
    const pct = Math.min(100, Math.max(0, data.usagePercent || 0));
    document.getElementById('budgetUsageLabel').innerText = `${(data.usedGrams || 0).toFixed(2)} / ${(data.monthlyLimitGrams || 5000).toFixed(2)} g CO\u2082`;
    document.getElementById('budgetPercentLabel').innerText = `${pct.toFixed(1)}% Utilized`;
    const fill = document.getElementById('progressBarFill');
    fill.style.width = `${pct}%`;
    if (pct > 90) fill.style.background = '#ef4444';
    else if (pct > 70) fill.style.background = '#f59e0b';
    else fill.style.background = 'var(--primary-emerald)';

    const badge = document.getElementById('budgetStatusBadge');
    badge.innerText = data.status.toUpperCase();
    if (data.status === 'exceeded') { badge.style.background = 'rgba(239,68,68,0.2)'; badge.style.color = '#ef4444'; }
    else if (data.status === 'warning') { badge.style.background = 'rgba(245,158,11,0.2)'; badge.style.color = '#f59e0b'; }
    else { badge.style.background = 'rgba(16,185,129,0.12)'; badge.style.color = '#10b981'; }
  } catch (err) {
    console.error('Budget status error:', err);
  }
}

// ─────────────────────────────────────────────
// GREEN CODE ADVISOR (MULTI-LANGUAGE)
// ─────────────────────────────────────────────
async function runGreenAdvisor() {
  const code = document.getElementById('advisorCodeInput').value;
  const langSel = document.getElementById('languageSelect');
  const language = langSel ? langSel.value : 'auto';

  try {
    const res = await fetch(`${API_BASE}/api/intelligence/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codeSnippet: code, language })
    });
    if (!res.ok) throw new Error('Static Analysis failed');
    const data = await res.json();
    const container = document.getElementById('advisorResultsContainer');
    container.innerHTML = '';
    const recs = data.recommendations || [];
    if (recs.length === 0) {
      container.innerHTML = '<div style="color:#10b981;text-align:center;padding:2rem;"><i class="fa-solid fa-circle-check" style="font-size:2rem;margin-bottom:0.5rem;display:block;"></i>Great job! No carbon-inefficient patterns detected.</div>';
      return;
    }
    recs.forEach(r => {
      const div = document.createElement('div');
      div.className = `rec-box ${r.severity}`;
      div.innerHTML = `
        <div class="rec-header">
          <span class="rec-title">${escapeHtml(r.pattern)} (Line ${r.line})</span>
          <span class="badge-sev ${r.severity}">${r.severity}</span>
        </div>
        <div class="rec-desc">${escapeHtml(r.recommendation)}</div>
        <div class="rec-reason"><i class="fa-solid fa-circle-info"></i> ${escapeHtml(r.reason)}</div>
      `;
      container.appendChild(div);
    });
  } catch (err) {
    alert(err.message);
  }
}

// ─────────────────────────────────────────────
// ML PREDICTOR (MULTI-LANGUAGE)
// ─────────────────────────────────────────────
async function runMLPrediction() {
  const code = document.getElementById('mlCodeInput').value;
  const inputSize = parseInt(document.getElementById('mlInputSize').value) || 1000;
  const langSel = document.getElementById('languageSelect');
  const language = langSel ? langSel.value : 'auto';

  try {
    const res = await fetch(`${API_BASE}/api/predict/emission`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codeSnippet: code, expectedInputSize: inputSize, region: 'Maharashtra', language })
    });
    if (!res.ok) throw new Error('ML Prediction failed');
    const data = await res.json();
    document.getElementById('mlPredCo2').innerHTML = `${(data.predicted_emissions_g_co2 || 0).toFixed(4)} <span style="font-size:0.8rem;">g</span>`;
    document.getElementById('mlPredTime').innerHTML = `${(data.predicted_time_s || 0).toFixed(4)} <span style="font-size:0.8rem;">s</span>`;
    document.getElementById('mlComplexity').innerText = data.complexity_class || 'O(1)';
    document.getElementById('mlConfidence').innerText = `${((data.confidence_score || 0) * 100).toFixed(0)}%`;
  } catch (err) {
    alert(err.message);
  }
}
