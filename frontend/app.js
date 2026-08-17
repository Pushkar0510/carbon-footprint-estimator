const API_BASE = 'http://localhost:8000';

// Preset Python Code Snippets
const PRESETS = {
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

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  checkBackendHealth();
  loadGridData();
  fetchBudgetStatus();
});

// Tab Switcher
function switchTab(tabId) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

  event.currentTarget.classList.add('active');
  document.getElementById(`tab-${tabId}`).classList.add('active');
}

// Preset Loader
function loadPreset(key) {
  if (PRESETS[key]) {
    document.getElementById('codeEditor').value = PRESETS[key];
  }
}

// Health Check
async function checkBackendHealth() {
  const badge = document.getElementById('apiStatusBadge');
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (res.ok) {
      badge.querySelector('span').innerText = 'Backend Connected';
      badge.querySelector('.dot').style.backgroundColor = '#10b981';
    } else {
      throw new Error();
    }
  } catch (err) {
    badge.querySelector('span').innerText = 'Backend Offline';
    badge.querySelector('.dot').style.backgroundColor = '#ef4444';
  }
}

// 1. Run Profiling
async function runProfiling() {
  const code = document.getElementById('codeEditor').value;
  const region = document.getElementById('regionSelect').value;

  if (!code.trim()) {
    alert('Please enter Python code to profile.');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/profile/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scriptContent: code, region: region, projectId: 'default' })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Profiling execution failed.');
    }

    const data = await res.json();
    renderProfileResults(data);
    fetchBudgetStatus(); // refresh budget status after run
  } catch (err) {
    alert(`Execution Error: ${err.message}`);
  }
}

function renderProfileResults(data) {
  const m = data.metrics || {};
  document.getElementById('valEmissions').innerHTML = `${(m.emissions_g_co2 || 0).toFixed(4)} <span style="font-size: 0.9rem;">g CO₂</span>`;
  document.getElementById('valEmissionsMg').innerText = `${(m.emissions_mg_co2 || 0).toFixed(2)} mg CO₂`;

  document.getElementById('valRuntime').innerHTML = `${(m.execution_time_s || 0).toFixed(3)} <span style="font-size: 0.9rem;">s</span>`;
  document.getElementById('valCpu').innerText = `CPU: ${(m.cpu_percent || 0).toFixed(1)}% | RAM: ${(m.memory_rss_mb || 0).toFixed(1)} MB`;

  document.getElementById('valEnergy').innerHTML = `${(m.energy_wh || 0).toFixed(6)} <span style="font-size: 0.9rem;">Wh</span>`;
  document.getElementById('valPower').innerText = `Power: ${(m.power_watts || 0).toFixed(1)} W`;

  const eq = m.equivalencies || {};
  document.getElementById('valEquiv').innerHTML = `${(eq.smartphone_charges || 0).toFixed(4)} <span style="font-size: 0.8rem;">Charges</span>`;
  document.getElementById('valCar').innerText = `${(eq.car_meters_driven || 0).toFixed(2)} meters driven`;

  document.getElementById('stdoutConsole').innerText = data.stdout || data.stderr || 'No output.';

  // Hotspots
  const tbody = document.getElementById('hotspotTableBody');
  tbody.innerHTML = '';

  const hotspots = data.hotspots || [];
  if (hotspots.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-dim);">No hotspots detected.</td></tr>';
    return;
  }

  hotspots.forEach(h => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${h.function}</strong> <span style="color: var(--text-dim); font-size: 0.75rem;">(${h.filename}:${h.lineno})</span></td>
      <td>${h.cumtime_s} s</td>
      <td>${h.contribution_pct}%</td>
      <td>${h.attributed_co2_g} g</td>
      <td>${h.is_hotspot ? '<span class="tag-hotspot">HOTSPOT</span>' : '<span style="color: var(--text-muted);">Normal</span>'}</td>
    `;
    tbody.appendChild(tr);
  });
}

// 2. Load India Grid Data
async function loadGridData() {
  try {
    const res = await fetch(`${API_BASE}/api/grid/india/states`);
    if (!res.ok) return;
    const data = await res.json();
    
    const container = document.getElementById('stateGridContainer');
    container.innerHTML = '';

    const states = data.states || {};
    Object.keys(states).forEach(state => {
      const card = document.createElement('div');
      card.className = 'state-card';
      card.onclick = () => {
        document.getElementById('regionSelect').value = state;
        switchTab('profiler');
      };
      card.innerHTML = `
        <div class="state-name">${state}</div>
        <div class="state-val">${states[state]}</div>
        <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.2rem;">g CO₂ / kWh</div>
      `;
      container.appendChild(card);
    });
  } catch (err) {
    console.error('Grid data fetch failed:', err);
  }
}

// 3. Carbon Budget
async function updateBudget() {
  const limit = parseFloat(document.getElementById('budgetLimitInput').value);
  const projectId = document.getElementById('budgetIdInput').value || 'default';

  try {
    const res = await fetch(`${API_BASE}/api/budget/set`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: projectId, monthlyLimitGrams: limit })
    });
    if (res.ok) {
      fetchBudgetStatus();
      alert('Budget limit saved.');
    }
  } catch (err) {
    alert('Failed to update budget.');
  }
}

async function fetchBudgetStatus() {
  const projectId = document.getElementById('budgetIdInput') ? document.getElementById('budgetIdInput').value : 'default';
  try {
    const res = await fetch(`${API_BASE}/api/budget/status/${projectId}`);
    if (!res.ok) return;
    const data = await res.json();

    document.getElementById('budgetUsageLabel').innerText = `${data.usedGrams} / ${data.monthlyLimitGrams} g CO₂`;
    document.getElementById('budgetPercentLabel').innerText = `${data.usagePercent}% Utilized`;
    document.getElementById('progressBarFill').style.width = `${Math.min(100, data.usagePercent)}%`;

    const badge = document.getElementById('budgetStatusBadge');
    badge.innerText = data.status;
    if (data.usagePercent >= 100) {
      badge.style.background = 'rgba(239, 68, 68, 0.2)';
      badge.style.color = '#ef4444';
    } else if (data.usagePercent >= 75) {
      badge.style.background = 'rgba(245, 158, 11, 0.2)';
      badge.style.color = '#f59e0b';
    } else {
      badge.style.background = 'rgba(16, 185, 129, 0.12)';
      badge.style.color = '#10b981';
    }
  } catch (err) {
    console.error('Budget status error:', err);
  }
}

// 4. Green Code Advisor
async function runGreenAdvisor() {
  const code = document.getElementById('advisorCodeInput').value;
  try {
    const res = await fetch(`${API_BASE}/api/intelligence/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codeSnippet: code })
    });
    if (!res.ok) throw new Error('AST Analysis failed');
    const data = await res.json();

    const container = document.getElementById('advisorResultsContainer');
    container.innerHTML = '';

    const recs = data.recommendations || [];
    if (recs.length === 0) {
      container.innerHTML = '<div style="color: #10b981; text-align: center; padding: 2rem;"><i class="fa-solid fa-circle-check" style="font-size: 2rem; margin-bottom: 0.5rem; display: block;"></i>Great job! No carbon-inefficient AST patterns detected.</div>';
      return;
    }

    recs.forEach(r => {
      const div = document.createElement('div');
      div.className = `rec-box ${r.severity}`;
      div.innerHTML = `
        <div class="rec-header">
          <span class="rec-title">${r.pattern} (Line ${r.line})</span>
          <span class="badge-sev ${r.severity}">${r.severity}</span>
        </div>
        <div class="rec-desc">${r.recommendation}</div>
        <div class="rec-reason"><i class="fa-solid fa-circle-info"></i> ${r.reason}</div>
      `;
      container.appendChild(div);
    });
  } catch (err) {
    alert(err.message);
  }
}

// 5. ML Predictor
async function runMLPrediction() {
  const code = document.getElementById('mlCodeInput').value;
  const inputSize = parseInt(document.getElementById('mlInputSize').value) || 1000;

  try {
    const res = await fetch(`${API_BASE}/api/predict/emission`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codeSnippet: code, expectedInputSize: inputSize, region: 'Maharashtra' })
    });
    if (!res.ok) throw new Error('ML Prediction failed');
    const data = await res.json();

    document.getElementById('mlPredCo2').innerHTML = `${(data.predicted_emissions_g_co2 || 0).toFixed(4)} <span style="font-size: 0.8rem;">g</span>`;
    document.getElementById('mlPredTime').innerHTML = `${(data.predicted_time_s || 0).toFixed(4)} <span style="font-size: 0.8rem;">s</span>`;
    document.getElementById('mlComplexity').innerText = data.complexity_class || 'O(1)';
    document.getElementById('mlConfidence').innerText = `${((data.confidence_score || 0) * 100).toFixed(0)}%`;
  } catch (err) {
    alert(err.message);
  }
}
