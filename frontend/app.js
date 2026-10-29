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
// STATE & AUTHENTICATION
// ─────────────────────────────────────────────
let selectedFiles = [];
let currentUser = null;
let currentAuthMode = 'login'; // 'login' or 'register'

function getAuthToken() {
  return localStorage.getItem('cfe_jwt_token');
}

function getAuthHeaders(extraHeaders = {}) {
  const token = getAuthToken();
  const headers = { ...extraHeaders };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

function getCurrentProjectId() {
  return currentUser && currentUser.default_project_id ? currentUser.default_project_id : 'default';
}

// ─────────────────────────────────────────────
// THREE.JS 3D SILICON DIE & CARBON FLUX CLOUD
// (Hardware Microprocessor & Atmospheric CO₂ Emission Visualization)
// ─────────────────────────────────────────────
let threeScene, threeCamera, threeRenderer;
let siliconGroup, cpuDieMesh, cpuCoreMeshes = [], carbonParticles, dataBuses;
let isGlobeDragging = false, prevMouseX = 0, prevMouseY = 0;
let siliconRotVelX = 0.003, siliconRotVelY = 0.001;
let siliconHotspotMode = false;
let particleVelocityArray;

function initThreeGlobe() {
  const canvas = document.getElementById('threeGlobeCanvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const container = canvas.parentElement;
  const width = container.clientWidth || 400;
  const height = container.clientHeight || 380;

  threeScene = new THREE.Scene();
  threeCamera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  threeCamera.position.set(0, 70, 220);
  threeCamera.lookAt(0, 0, 0);

  try {
    threeRenderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    threeRenderer.setSize(width, height);
    threeRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  } catch (e) {
    console.warn('WebGL init error:', e);
    return;
  }

  siliconGroup = new THREE.Group();
  // Tilt chip slightly forward for dramatic perspective
  siliconGroup.rotation.x = 0.45;
  threeScene.add(siliconGroup);

  // 1. Silicon CPU Base Substrate (Motherboard Carrier)
  const substrateGeo = new THREE.BoxGeometry(78, 4, 78);
  const substrateMat = new THREE.MeshBasicMaterial({
    color: 0x111318,
    wireframe: false,
  });
  const substrateMesh = new THREE.Mesh(substrateGeo, substrateMat);
  siliconGroup.add(substrateMesh);

  // Substrate Outer Neon Rim
  const rimGeo = new THREE.EdgesGeometry(substrateGeo);
  const rimMat = new THREE.LineBasicMaterial({ color: 0x00b4d8, transparent: true, opacity: 0.45 });
  const rimLine = new THREE.LineSegments(rimGeo, rimMat);
  siliconGroup.add(rimLine);

  // 2. Central Silicon Die (Compute Cores)
  const dieGeo = new THREE.BoxGeometry(42, 6, 42);
  const dieMat = new THREE.MeshBasicMaterial({ color: 0x181a24 });
  cpuDieMesh = new THREE.Mesh(dieGeo, dieMat);
  cpuDieMesh.position.y = 4;
  siliconGroup.add(cpuDieMesh);

  const dieRimGeo = new THREE.EdgesGeometry(dieGeo);
  const dieRimMat = new THREE.LineBasicMaterial({ color: 0x00b4d8, transparent: true, opacity: 0.85 });
  const dieRimLine = new THREE.LineSegments(dieRimGeo, dieRimMat);
  cpuDieMesh.add(dieRimLine);

  // 3. Quad Execution Cores (Core 0 to Core 3)
  const corePositions = [
    [-11, 4, -11],
    [ 11, 4, -11],
    [-11, 4,  11],
    [ 11, 4,  11],
  ];
  cpuCoreMeshes = [];
  corePositions.forEach((pos, idx) => {
    const cGeo = new THREE.BoxGeometry(16, 3, 16);
    const cMat = new THREE.MeshBasicMaterial({
      color: idx % 2 === 0 ? 0x00b4d8 : 0x0096c7,
      transparent: true,
      opacity: 0.65,
    });
    const cMesh = new THREE.Mesh(cGeo, cMat);
    cMesh.position.set(pos[0], pos[1], pos[2]);
    siliconGroup.add(cMesh);

    const cWire = new THREE.LineSegments(
      new THREE.EdgesGeometry(cGeo),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 })
    );
    cMesh.add(cWire);
    cpuCoreMeshes.push(cMesh);
  });

  // 4. Radiating Copper/Gold Bus Traces (Data Lines)
  const busGeo = new THREE.BufferGeometry();
  const busLines = [];
  for (let i = -30; i <= 30; i += 10) {
    // West to East traces
    busLines.push(-38, 3, i, -20, 3, i);
    busLines.push(20, 3, i, 38, 3, i);
    // North to South traces
    busLines.push(i, 3, -38, i, 3, -20);
    busLines.push(i, 3, 20, i, 3, 38);
  }
  busGeo.setAttribute('position', new THREE.Float32BufferAttribute(busLines, 3));
  const busMat = new THREE.LineBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.5 });
  dataBuses = new THREE.LineSegments(busGeo, busMat);
  siliconGroup.add(dataBuses);

  // 5. Thermal Carbon Dissipation Cloud (Volumetric CO₂ Particles)
  const pCount = 380;
  const pGeo = new THREE.BufferGeometry();
  const pPos = new Float32Array(pCount * 3);
  const pColors = new Float32Array(pCount * 3);
  particleVelocityArray = new Float32Array(pCount * 3);

  for (let i = 0; i < pCount; i++) {
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    const r = 55 + Math.random() * 55;

    pPos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    pPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.7; // slightly flattened
    pPos[i * 3 + 2] = r * Math.cos(phi);

    // Initial blue/cyan particles (eco idle state)
    pColors[i * 3]     = 0.0;
    pColors[i * 3 + 1] = 0.7;
    pColors[i * 3 + 2] = 0.85;

    particleVelocityArray[i * 3]     = (Math.random() - 0.5) * 0.08;
    particleVelocityArray[i * 3 + 1] = (Math.random() - 0.5) * 0.08;
    particleVelocityArray[i * 3 + 2] = (Math.random() - 0.5) * 0.08;
  }

  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  pGeo.setAttribute('color', new THREE.BufferAttribute(pColors, 3));

  const pMat = new THREE.PointsMaterial({
    size: 3.2,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
  });
  carbonParticles = new THREE.Points(pGeo, pMat);
  siliconGroup.add(carbonParticles);

  // Mouse drag & perspective tilt
  canvas.addEventListener('mousedown', (e) => {
    isGlobeDragging = true;
    prevMouseX = e.clientX;
    prevMouseY = e.clientY;
  });
  window.addEventListener('mouseup', () => { isGlobeDragging = false; });
  window.addEventListener('mousemove', (e) => {
    if (!isGlobeDragging || !siliconGroup) return;
    const deltaX = e.clientX - prevMouseX;
    const deltaY = e.clientY - prevMouseY;
    siliconGroup.rotation.y += deltaX * 0.007;
    siliconGroup.rotation.x += deltaY * 0.007;
    prevMouseX = e.clientX;
    prevMouseY = e.clientY;
  });

  // Touch support
  canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      isGlobeDragging = true;
      prevMouseX = e.touches[0].clientX;
      prevMouseY = e.touches[0].clientY;
    }
  }, { passive: true });
  canvas.addEventListener('touchmove', (e) => {
    if (!isGlobeDragging || !siliconGroup || e.touches.length !== 1) return;
    const deltaX = e.touches[0].clientX - prevMouseX;
    const deltaY = e.touches[0].clientY - prevMouseY;
    siliconGroup.rotation.y += deltaX * 0.007;
    siliconGroup.rotation.x += deltaY * 0.007;
    prevMouseX = e.touches[0].clientX;
    prevMouseY = e.touches[0].clientY;
  }, { passive: true });
  canvas.addEventListener('touchend', () => { isGlobeDragging = false; });

  // Animation Loop
  let clockTick = 0;
  function animateSiliconChamber() {
    requestAnimationFrame(animateSiliconChamber);
    clockTick += 0.025;

    if (!isGlobeDragging && siliconGroup) {
      siliconGroup.rotation.y += siliconRotVelX;
    }

    // Pulse cores
    cpuCoreMeshes.forEach((core, i) => {
      const pulseVal = 0.5 + 0.3 * Math.sin(clockTick * 2.5 + i * 1.5);
      core.material.opacity = pulseVal;
      if (siliconHotspotMode) {
        core.material.color.setHex(i % 2 === 0 ? 0xff2d78 : 0xf59e0b);
      } else {
        core.material.color.setHex(0x00b4d8);
      }
    });

    // Particle turbulence
    if (carbonParticles) {
      const pos = carbonParticles.geometry.attributes.position.array;
      const speedMult = siliconHotspotMode ? 2.5 : 1.0;
      for (let i = 0; i < pCount; i++) {
        pos[i * 3]     += particleVelocityArray[i * 3] * speedMult;
        pos[i * 3 + 1] += particleVelocityArray[i * 3 + 1] * speedMult;
        pos[i * 3 + 2] += particleVelocityArray[i * 3 + 2] * speedMult;

        // Wrap around bounding shell
        const d = Math.sqrt(pos[i * 3]**2 + pos[i * 3 + 1]**2 + pos[i * 3 + 2]**2);
        if (d > 115 || d < 45) {
          particleVelocityArray[i * 3]     *= -1;
          particleVelocityArray[i * 3 + 1] *= -1;
          particleVelocityArray[i * 3 + 2] *= -1;
        }
      }
      carbonParticles.geometry.attributes.position.needsUpdate = true;
    }

    if (threeRenderer && threeScene && threeCamera) {
      threeRenderer.render(threeScene, threeCamera);
    }
  }
  animateSiliconChamber();

  window.addEventListener('resize', onGlobeResize);
}

function toggle3DSiliconMode() {
  siliconHotspotMode = !siliconHotspotMode;
  const btn = document.getElementById('btnToggle3DMode');
  const label = document.getElementById('globeModeLabel');
  const pill = document.getElementById('globeStatusPill');
  const stateTxt = document.getElementById('globeStateText');

  if (carbonParticles) {
    const col = carbonParticles.geometry.attributes.color.array;
    const count = col.length / 3;
    for (let i = 0; i < count; i++) {
      if (siliconHotspotMode) {
        // Neon Rose / Hotspot Amber thermal dissipation
        const isRose = (i % 3 === 0);
        col[i * 3]     = 1.0;
        col[i * 3 + 1] = isRose ? 0.17 : 0.62;
        col[i * 3 + 2] = isRose ? 0.47 : 0.05;
      } else {
        // Cerulean Blue / Green Eco State
        col[i * 3]     = 0.0;
        col[i * 3 + 1] = 0.7;
        col[i * 3 + 2] = 0.85;
      }
    }
    carbonParticles.geometry.attributes.color.needsUpdate = true;
  }

  if (siliconHotspotMode) {
    if (btn) {
      btn.innerHTML = '<i class="fa-solid fa-leaf"></i> Eco Mode';
      btn.style.borderColor = 'var(--rose-hi)';
      btn.style.color = 'var(--rose)';
    }
    if (label) label.textContent = 'Silicon Hotspot: Thermal Surge Active';
    if (pill) pill.innerHTML = '<span style="color:var(--rose);">●</span> Thermal Surge';
    siliconRotVelX = 0.0075;
    pulseGlobeAnimation();
    showToast('Thermal Surge Mode', 'Displaying execution thermal dissipation & hotspot carbon flux', 'warn');
  } else {
    if (btn) {
      btn.innerHTML = '<i class="fa-solid fa-fire"></i> Hotspot Surge';
      btn.style.borderColor = '';
      btn.style.color = '';
    }
    if (label) label.textContent = '3D Silicon Die & CO₂ Cloud';
    if (pill) pill.innerHTML = '<span style="color:var(--cerulean);">●</span> Silicon Active';
    siliconRotVelX = 0.003;
    showToast('Eco Energy Mode', 'Hardware idle: minimum carbon footprint active', 'info');
  }
}

function pulseGlobeAnimation() {
  if (!siliconGroup) return;
  let frame = 0;
  const origScale = 1;
  const maxScale = 1.18;
  const id = setInterval(() => {
    frame++;
    if (frame <= 10) {
      const s = origScale + (maxScale - origScale) * (frame / 10);
      siliconGroup.scale.set(s, s, s);
    } else if (frame <= 22) {
      const s = maxScale - (maxScale - origScale) * ((frame - 10) / 12);
      siliconGroup.scale.set(s, s, s);
    } else {
      siliconGroup.scale.set(origScale, origScale, origScale);
      clearInterval(id);
    }
  }, 16);
}

function resetGlobeView() {
  if (!siliconGroup) return;
  siliconGroup.rotation.set(0.45, 0, 0);
  siliconGroup.scale.set(1, 1, 1);
  showToast('Perspective Reset', 'Silicon processor perspective re-aligned', 'info');
}

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  checkBackendHealth();
  checkDbStatus();
  initAuth();
  loadGridData();
  fetchBudgetStatus();
  initThreeGlobe();

  // Route according to URL hash if provided
  const hash = (window.location.hash || '').replace('#', '').trim();
  if (hash) {
    switchTab(hash, false);
  } else {
    switchTab('overview', false);
  }
});

// ─────────────────────────────────────────────
// TAB SWITCHER (SPA Router)
// ─────────────────────────────────────────────
function switchTab(tabId, updateHash = true) {
  // Normalize tabId
  const validTabs = ['overview', 'auth', 'profiler', 'ml', 'grid', 'budget', 'advisor', 'history'];
  if (!validTabs.includes(tabId)) {
    tabId = 'overview';
  }

  // Update nav buttons
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.getElementById(`tabNav-${tabId}`) || document.querySelector(`.tab-btn[onclick*="'${tabId}'"]`);
  if (activeBtn) activeBtn.classList.add('active');

  // Update tab content panes
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  const targetTab = document.getElementById(`tab-${tabId}`);
  if (targetTab) targetTab.classList.add('active');

  if (updateHash) {
    try {
      history.replaceState(null, '', `#${tabId}`);
    } catch (_) {}
  }

  // Lifecycle hooks for specific views
  if (tabId === 'overview') {
    setTimeout(onGlobeResize, 60);
  } else if (tabId === 'history') {
    fetchRunHistory();
  } else if (tabId === 'grid') {
    loadGridData();
  } else if (tabId === 'budget') {
    fetchBudgetStatus();
  } else if (tabId === 'auth') {
    updateAuthNavUI(currentUser);
  }
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
  if (!badge) return;
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (res.ok) {
      badge.querySelector('span').innerText = 'Backend Connected';
      badge.querySelector('.dot').style.backgroundColor = 'var(--cerulean)';
    } else throw new Error();
  } catch {
    badge.querySelector('span').innerText = 'Backend Offline';
    badge.querySelector('.dot').style.backgroundColor = 'var(--rose)';
  }
}

let isMongoConnectedState = false;

async function checkDbStatus() {
  const dot = document.getElementById('mongoDot');
  const text = document.getElementById('mongoStatusText');
  const badge = document.getElementById('mongoStatusBadge');
  const kpiDb = document.getElementById('kpiDbStatus');
  try {
    const res = await fetch(`${API_BASE}/api/auth/status`);
    if (res.ok) {
      const data = await res.json();
      isMongoConnectedState = !!data.mongo_connected;
      if (data.mongo_connected) {
        if (dot) dot.style.backgroundColor = 'var(--cerulean)';
        if (text) text.innerText = 'MongoDB Connected';
        if (badge) badge.title = 'Live MongoDB replica / instance active';
        if (kpiDb) kpiDb.innerText = 'MongoDB Live';
      } else {
        if (dot) dot.style.backgroundColor = 'var(--amber)';
        if (text) text.innerText = 'DB: Memory Fallback';
        if (badge) badge.title = 'Running in resilient in-memory mode (MongoDB server offline)';
        if (kpiDb) kpiDb.innerText = 'Memory Mode';
      }
    }
  } catch (err) {
    if (dot) dot.style.backgroundColor = 'var(--rose)';
    if (text) text.innerText = 'DB Offline';
    if (kpiDb) kpiDb.innerText = 'Offline';
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
    chip.style.cssText = 'display:inline-flex;align-items:center;gap:0.35rem;background:var(--cerulean-dim);border:1px solid var(--cerulean-mid);color:var(--cerulean);font-family:var(--font-mono);font-size:0.75rem;padding:0.25rem 0.6rem;border-radius:20px;';
    chip.innerHTML = `<i class="fa-solid fa-file-code" style="font-size:0.7rem;"></i>${escapeHtml(f.name)} <span style="font-size:0.65rem;opacity:0.85;background:rgba(255,255,255,0.08);padding:0.1rem 0.35rem;border-radius:6px;">${lang}</span>`;
    bar.appendChild(chip);
  });

  const clearBtn = document.createElement('button');
  clearBtn.textContent = '✕ Clear';
  clearBtn.style.cssText = 'background:var(--rose-dim);border:1px solid var(--rose-mid);color:var(--rose);font-family:var(--font-mono);font-size:0.75rem;padding:0.25rem 0.6rem;border-radius:20px;cursor:pointer;';
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
    showToast('Input Required', 'Please enter code to profile.', 'amber');
    return;
  }

  const editorWrap = document.getElementById('codeEditorWrap');
  if (editorWrap) editorWrap.classList.add('scanning');

  setSpinner(true, 'Profiling execution & carbon footprint...');
  document.getElementById('singleFileResults').style.display = '';
  document.getElementById('multiFileResults').style.display = 'none';

  try {
    const res = await fetch(`${API_BASE}/api/profile/run`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ scriptContent: code, region, projectId: getCurrentProjectId(), language })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Profiling execution failed.');
    }

    const data = await res.json();
    renderProfileResults(data);
    fetchBudgetStatus();
    pulseGlobeAnimation();
  } catch (err) {
    showToast('Execution Error', err.message, 'rose');
  } finally {
    if (editorWrap) editorWrap.classList.remove('scanning');
    setSpinner(false);
  }
}

// ─────────────────────────────────────────────
// MULTI-FILE PROFILING
// ─────────────────────────────────────────────
async function runMultiFileProfiling() {
  const region = document.getElementById('regionSelect').value;
  setSpinner(true, `Profiling ${selectedFiles.length} files across languages...`);

  const editorWrap = document.getElementById('codeEditorWrap');
  if (editorWrap) editorWrap.classList.add('scanning');

  document.getElementById('singleFileResults').style.display = 'none';
  document.getElementById('multiFileResults').style.display = 'none';

  try {
    const formData = new FormData();
    selectedFiles.forEach(f => formData.append('files', f, f.name));
    formData.append('region', region);
    formData.append('projectId', getCurrentProjectId());

    const res = await fetch(`${API_BASE}/api/profile/multi`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Multi-file profiling failed.');
    }

    const data = await res.json();
    renderMultiFileResults(data, region);
    fetchBudgetStatus();
    pulseGlobeAnimation();
  } catch (err) {
    showToast('Batch Execution Error', err.message, 'rose');
    document.getElementById('singleFileResults').style.display = '';
  } finally {
    if (editorWrap) editorWrap.classList.remove('scanning');
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
  const co2 = m.emissions_g_co2 || 0;
  animateNumberCount('valEmissions', 0, co2, 600, 4, ' g CO\u2082');
  document.getElementById('valEmissionsMg').innerText = `${(m.emissions_mg_co2 || (co2 * 1000)).toFixed(2)} mg CO\u2082`;

  const rt = m.execution_time_s || 0;
  animateNumberCount('valRuntime', 0, rt, 500, 3, ' s');
  document.getElementById('valCpu').innerText = `CPU: ${(m.cpu_percent || 0).toFixed(1)}% | RAM: ${(m.memory_rss_mb || 0).toFixed(1)} MB`;

  const en = m.energy_wh || 0;
  animateNumberCount('valEnergy', 0, en, 600, 6, ' Wh');
  document.getElementById('valPower').innerText = `Power: ${(m.power_watts || 0).toFixed(1)} W`;

  const eq = m.equivalencies || {};
  animateNumberCount('valEquiv', 0, eq.smartphone_charges || 0, 700, 4, ' Charges');
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
  showToast('Profile Succeeded', `Attributed ${(m.emissions_g_co2 || 0).toFixed(4)} g CO₂ in ${(m.execution_time_s || 0).toFixed(3)}s`, 'info');
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
  wrapper.style.marginBottom = '0.85rem';

  const statusColor = fileResult.status === 'ok' ? 'var(--cerulean)' : fileResult.status === 'error' ? 'var(--rose)' : 'var(--text-3)';
  const statusIcon  = fileResult.status === 'ok' ? 'fa-circle-check' : fileResult.status === 'error' ? 'fa-circle-xmark' : 'fa-circle-minus';
  const m = fileResult.metrics || {};
  const emissions = (m.emissions_g_co2 || 0).toFixed(4);
  const runtime   = (m.execution_time_s || 0).toFixed(3);

  const headerId = `mf-header-${idx}`;
  const bodyId   = `mf-body-${idx}`;

  const langTag = fileResult.languageDisplay || fileResult.language
    ? `<span style="font-family:var(--font-mono);font-size:0.68rem;background:var(--cerulean-dim);border:1px solid var(--cerulean-hi);color:var(--cerulean);padding:0.15rem 0.5rem;border-radius:99px;">${escapeHtml(fileResult.languageDisplay || fileResult.language)}</span>`
    : '';

  wrapper.innerHTML = `
    <div id="${headerId}" onclick="toggleAccordion('${bodyId}', '${headerId}')"
      style="display:flex;justify-content:space-between;align-items:center;cursor:pointer;flex-wrap:wrap;gap:0.5rem;">
      <div style="display:flex;align-items:center;gap:10px;">
        <i class="fa-solid ${statusIcon}" style="color:${statusColor};font-size:0.9rem;"></i>
        <span style="font-family:var(--font-mono);font-size:0.85rem;font-weight:500;color:var(--text-1);">${escapeHtml(fileResult.filename)}</span>
        ${langTag}
        ${fileResult.error ? `<span style="font-family:var(--font-mono);font-size:0.75rem;color:var(--rose);">${escapeHtml(fileResult.error)}</span>` : ''}
      </div>
      <div style="display:flex;align-items:center;gap:1rem;">
        ${m.emissions_g_co2 !== undefined ? `
          <span style="font-family:var(--font-mono);font-size:0.78rem;color:var(--text-3);">
            <strong style="color:var(--cerulean);">${emissions}</strong> g CO&#8322; &bull; ${runtime}s
          </span>` : ''}
        <i class="fa-solid fa-chevron-down" id="${headerId}-chevron" style="color:var(--text-3);font-size:0.78rem;transition:transform 0.2s;"></i>
      </div>
    </div>

    <div id="${bodyId}" style="display:none;margin-top:1.1rem;border-top:1px solid var(--border);padding-top:1rem;">
      ${m.emissions_g_co2 !== undefined ? `
      <!-- Mini metrics bar -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:0.55rem;margin-bottom:1rem;">
        <div class="mini-metric" style="text-align:center;">
          <div class="metric-label">Emissions</div>
          <div style="font-family:var(--font-ui);font-size:1rem;font-weight:700;color:var(--cerulean);">${emissions} g</div>
        </div>
        <div class="mini-metric" style="text-align:center;">
          <div class="metric-label">Runtime</div>
          <div style="font-family:var(--font-ui);font-size:1rem;font-weight:700;color:var(--text-1);">${runtime} s</div>
        </div>
        <div class="mini-metric" style="text-align:center;">
          <div class="metric-label">Energy</div>
          <div style="font-family:var(--font-ui);font-size:1rem;font-weight:700;color:var(--text-2);">${(m.energy_wh || 0).toFixed(4)} Wh</div>
        </div>
        <div class="mini-metric" style="text-align:center;">
          <div class="metric-label">CPU / RAM</div>
          <div style="font-family:var(--font-mono);font-size:0.82rem;font-weight:500;color:var(--text-3);">${(m.cpu_percent || 0).toFixed(0)}% / ${(m.memory_rss_mb || 0).toFixed(1)}MB</div>
        </div>
      </div>` : ''}

      <!-- Function hotspots for this file -->
      <div style="margin-bottom:1rem;">
        <div style="font-family:var(--font-mono);font-size:0.68rem;text-transform:uppercase;letter-spacing:0.06em;color:var(--text-3);margin-bottom:0.5rem;">
          Function Hotspots
        </div>
        <div class="table-container" style="max-height:180px;">
          ${buildHotspotTableHtml(fileResult.hotspots || [])}
        </div>
      </div>

      <!-- Line stats for this file -->
      <div style="margin-bottom:1rem;">
        <div style="font-family:var(--font-mono);font-size:0.68rem;text-transform:uppercase;letter-spacing:0.06em;color:var(--text-3);margin-bottom:0.5rem;">
          Line Attributions
        </div>
        <div class="table-container" style="max-height:180px;">
          ${buildLineStatsTableHtml(fileResult.line_stats || [])}
        </div>
      </div>

      ${fileResult.stdout || fileResult.stderr ? `
      <div>
        <div style="font-family:var(--font-mono);font-size:0.68rem;text-transform:uppercase;letter-spacing:0.06em;color:var(--text-3);margin-bottom:0.35rem;">stdout</div>
        <pre style="max-height:120px;overflow-y:auto;">${escapeHtml(fileResult.stdout || fileResult.stderr)}</pre>
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
  const funcEl = document.getElementById('functionHotspotContainer');
  const lineEl = document.getElementById('lineStatsContainer');
  if (funcEl) funcEl.style.display = isFunc ? 'block' : 'none';
  if (lineEl) lineEl.style.display = isFunc ? 'none' : 'block';
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
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-3);padding:1.5rem;font-family:var(--font-mono);font-size:0.8rem;">No function hotspots detected.</td></tr>';
    return;
  }

  hotspots.forEach(h => {
    const tr = document.createElement('tr');
    if (h.is_hotspot) tr.className = 'hotspot-glow-row';
    tr.innerHTML = `
      <td><strong>${escapeHtml(h.function)}</strong> <span style="color:var(--text-3);font-family:var(--font-mono);font-size:0.75rem;">(${escapeHtml(h.filename || 'script')}:${h.lineno})</span></td>
      <td style="font-family:var(--font-mono);">${h.ncalls != null ? h.ncalls : 1}</td>
      <td style="font-family:var(--font-mono);">${(h.cumtime_s || 0).toFixed(4)}s</td>
      <td>
        <div style="display:flex;align-items:center;gap:0.5rem;">
          <div style="flex:1;background:rgba(255,255,255,0.08);border-radius:3px;height:6px;overflow:hidden;">
            <div style="width:${Math.min(100, (h.contribution_pct || 0)).toFixed(1)}%;height:100%;background:${h.is_hotspot ? 'var(--rose)' : 'var(--cerulean)'};"></div>
          </div>
          <span style="font-family:var(--font-mono);font-size:0.78rem;min-width:38px;">${(h.contribution_pct || 0).toFixed(1)}%</span>
        </div>
      </td>
      <td><strong style="font-family:var(--font-mono);color:${h.is_hotspot ? 'var(--rose)' : 'var(--text-1)'};">${(h.attributed_co2_g || 0).toFixed(5)}</strong> g</td>
    `;
    tbody.appendChild(tr);
  });
}

function buildHotspotTableHtml(hotspots) {
  if (!hotspots || hotspots.length === 0) {
    return `<table class="carbon-table">
      <thead><tr><th>Function</th><th>Calls</th><th>Time</th><th>Contribution</th><th>Attributed CO&#8322;</th></tr></thead>
      <tbody><tr><td colspan="5" style="text-align:center;color:var(--text-3);padding:1.2rem;font-family:var(--font-mono);font-size:0.8rem;">No function hotspots detected.</td></tr></tbody>
    </table>`;
  }
  const rows = hotspots.map(h => `
    <tr class="${h.is_hotspot ? 'hotspot-glow-row' : ''}">
      <td><strong>${escapeHtml(h.function)}</strong> <span style="color:var(--text-3);font-family:var(--font-mono);font-size:0.75rem;">(${escapeHtml(h.filename || 'script')}:${h.lineno})</span></td>
      <td style="font-family:var(--font-mono);">${h.ncalls != null ? h.ncalls : 1}</td>
      <td style="font-family:var(--font-mono);">${(h.cumtime_s || 0).toFixed(4)}s</td>
      <td>
        <div style="display:flex;align-items:center;gap:0.4rem;">
          <div style="flex:1;background:rgba(255,255,255,0.08);border-radius:3px;height:5px;overflow:hidden;">
            <div style="width:${Math.min(100, (h.contribution_pct || 0)).toFixed(1)}%;height:100%;background:${h.is_hotspot ? 'var(--rose)' : 'var(--cerulean)'};"></div>
          </div>
          <span style="font-family:var(--font-mono);font-size:0.78rem;min-width:36px;">${(h.contribution_pct || 0).toFixed(1)}%</span>
        </div>
      </td>
      <td><strong style="font-family:var(--font-mono);color:${h.is_hotspot ? 'var(--rose)' : 'var(--text-1)'};">${(h.attributed_co2_g || 0).toFixed(5)}</strong> g</td>
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
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-3);padding:1.5rem;font-family:var(--font-mono);font-size:0.8rem;">No line attribution recorded.</td></tr>';
    return;
  }

  lineStats.forEach(ls => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-family:var(--font-mono);font-size:0.8rem;color:var(--text-3);">Line ${ls.lineno}</td>
      <td><code style="font-family:var(--font-mono);font-size:0.8rem;color:var(--cerulean);">${escapeHtml(ls.content)}</code></td>
      <td style="font-family:var(--font-mono);">${ls.hits || 0}</td>
      <td>
        <div style="display:flex;align-items:center;gap:0.5rem;">
          <div style="flex:1;background:rgba(255,255,255,0.08);border-radius:3px;height:6px;overflow:hidden;">
            <div style="width:${Math.min(100, (ls.share_pct || 0)).toFixed(1)}%;height:100%;background:${ls.is_hotspot ? 'var(--rose)' : 'var(--cerulean)'};"></div>
          </div>
          <span style="font-family:var(--font-mono);font-size:0.78rem;min-width:38px;">${(ls.share_pct || 0).toFixed(1)}%</span>
        </div>
      </td>
      <td><strong style="font-family:var(--font-mono);color:${ls.is_hotspot ? 'var(--rose)' : 'var(--text-1)'};">${(ls.attributed_co2_g || 0).toFixed(6)}</strong> g</td>
    `;
    tbody.appendChild(tr);
  });
}

function buildLineStatsTableHtml(lineStats) {
  if (!lineStats || lineStats.length === 0) {
    return `<table class="carbon-table">
      <thead><tr><th>Line #</th><th>Code Snippet</th><th>Hits</th><th>Share</th><th>Attributed CO&#8322;</th></tr></thead>
      <tbody><tr><td colspan="5" style="text-align:center;color:var(--text-3);padding:1.2rem;font-family:var(--font-mono);font-size:0.8rem;">No line attribution recorded.</td></tr></tbody>
    </table>`;
  }
  const rows = lineStats.slice(0, 50).map(ls => `
    <tr>
      <td style="font-family:var(--font-mono);font-size:0.78rem;color:var(--text-3);">Line ${ls.lineno}</td>
      <td><code style="font-family:var(--font-mono);font-size:0.78rem;color:var(--cerulean);">${escapeHtml(ls.content)}</code></td>
      <td style="font-family:var(--font-mono);">${ls.hits || 0}</td>
      <td>
        <div style="display:flex;align-items:center;gap:0.4rem;">
          <div style="flex:1;background:rgba(255,255,255,0.08);border-radius:3px;height:5px;overflow:hidden;">
            <div style="width:${Math.min(100, (ls.share_pct || 0)).toFixed(1)}%;height:100%;background:${ls.is_hotspot ? 'var(--rose)' : 'var(--cerulean)'};"></div>
          </div>
          <span style="font-family:var(--font-mono);font-size:0.78rem;min-width:36px;">${(ls.share_pct || 0).toFixed(1)}%</span>
        </div>
      </td>
      <td><strong style="font-family:var(--font-mono);color:${ls.is_hotspot ? 'var(--rose)' : 'var(--text-1)'};">${(ls.attributed_co2_g || 0).toFixed(6)}</strong> g</td>
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
  const container = document.getElementById('stateGridContainer') || document.getElementById('gridStatesList');
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
        <div class="badge ${badgeClass}">${isLow ? 'Low Carbon' : (isHigh ? 'High Carbon' : 'Moderate')}</div>
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
  const inputEl = document.getElementById('budgetLimitInput') || document.getElementById('budgetInput');
  const limit = inputEl ? parseFloat(inputEl.value) : NaN;
  if (!limit || limit <= 0) {
    alert('Please enter a valid monthly limit greater than 0.');
    return;
  }
  try {
    const projInput = document.getElementById('budgetIdInput');
    const projectId = (projInput && projInput.value.trim()) ? projInput.value.trim() : getCurrentProjectId();
    const res = await fetch(`${API_BASE}/api/budget/set`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ projectId, monthlyLimitGrams: limit })
    });
    if (!res.ok) throw new Error('Budget update failed');
    fetchBudgetStatus();
    alert('Carbon budget successfully updated!');
  } catch (err) {
    alert(err.message);
  }
}

function updateBudget() {
  return setMonthlyBudget();
}

async function fetchBudgetStatus() {
  try {
    const projInput = document.getElementById('budgetIdInput');
    const projectId = (projInput && projInput.value.trim()) ? projInput.value.trim() : getCurrentProjectId();
    const res = await fetch(`${API_BASE}/api/budget/status/${projectId}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) return;
    const data = await res.json();

    const pct = Math.min(100, Math.max(0, data.usagePercent || 0));
    document.getElementById('budgetUsageLabel').innerText = `${(data.usedGrams || 0).toFixed(2)} / ${(data.monthlyLimitGrams || 5000).toFixed(2)} g CO\u2082`;
    document.getElementById('budgetPercentLabel').innerText = `${pct.toFixed(1)}% Utilized`;
    const fill = document.getElementById('progressBarFill');
    fill.style.width = `${pct}%`;
    if (pct > 90) fill.style.background = 'var(--rose)';
    else if (pct > 70) fill.style.background = 'var(--amber)';
    else fill.style.background = 'var(--cerulean)';

    const badge = document.getElementById('budgetStatusBadge');
    if (badge) {
      badge.innerText = data.status.toUpperCase();
      if (data.status === 'exceeded') {
        badge.style.background = 'var(--rose-dim)';
        badge.style.color = 'var(--rose)';
        badge.style.borderColor = 'var(--rose-mid)';
      } else if (data.status === 'warning') {
        badge.style.background = 'var(--amber-dim)';
        badge.style.color = 'var(--amber)';
        badge.style.borderColor = 'rgba(245,158,11,0.3)';
      } else {
        badge.style.background = 'var(--cerulean-dim)';
        badge.style.color = 'var(--cerulean)';
        badge.style.borderColor = 'var(--cerulean-hi)';
      }
    }
  } catch (err) {
    console.error('Budget status error:', err);
  }
}

// ─────────────────────────────────────────────
// GREEN CODE ADVISOR (MULTI-LANGUAGE)
// ─────────────────────────────────────────────
async function runGreenAdvisor() {
  const code = document.getElementById('advisorCodeInput').value;
  const langSel = document.getElementById('advisorLanguageSelect') || document.getElementById('languageSelect');
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
      container.innerHTML = '<div style="color:var(--cerulean);text-align:center;padding:2.5rem;"><i class="fa-solid fa-circle-check" style="font-size:1.6rem;margin-bottom:0.5rem;display:block;"></i><span style="font-family:var(--font-mono);font-size:0.82rem;">No carbon-inefficient patterns detected</span></div>';
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
// AI / LLM PREDICTOR & GREEN OPTIMIZER
// ─────────────────────────────────────────────
async function runMLPrediction() {
  const code = document.getElementById('mlCodeInput').value;
  const inputSize = parseInt(document.getElementById('mlInputSize').value) || 1000;
  const region = document.getElementById('mlRegionSelect') ? document.getElementById('mlRegionSelect').value : 'Maharashtra';
  const langSel = document.getElementById('languageSelect');
  const language = langSel ? langSel.value : 'auto';
  const btn = document.getElementById('mlPredictBtn');

  if (!code.trim()) {
    alert('Please enter a code snippet to forecast and optimize.');
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> AI Reasoning...';
  }

  try {
    const res = await fetch(`${API_BASE}/api/predict/emission`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codeSnippet: code, expectedInputSize: inputSize, region, language })
    });
    if (!res.ok) throw new Error('AI Emission Prediction failed.');
    const data = await res.json();

    document.getElementById('mlPredCo2').innerHTML = `${(data.predicted_emissions_g_co2 || 0).toFixed(4)} <span style="font-size:0.8rem;">g</span>`;
    document.getElementById('mlPredTime').innerHTML = `${(data.predicted_time_s || 0).toFixed(4)} <span style="font-size:0.8rem;">s</span>`;
    document.getElementById('mlComplexity').innerText = data.complexity_class || 'O(1)';
    document.getElementById('mlConfidence').innerText = `${((data.confidence_score || 0) * 100).toFixed(0)}%`;

    // Provider tag
    const providerBadge = document.getElementById('mlProviderBadge');
    if (providerBadge && data.provider) {
      providerBadge.textContent = data.provider;
    }

    // Analysis text
    const analysisEl = document.getElementById('mlAnalysisText');
    if (analysisEl) {
      analysisEl.innerHTML = escapeHtml(data.analysis || 'Analysis complete.');
    }

    // Green Optimized Code section
    const optSection = document.getElementById('mlOptimizedSection');
    const optCodeBox = document.getElementById('mlOptimizedCodeBox');
    const savingsBadge = document.getElementById('mlSavingsBadge');
    const tipsList = document.getElementById('mlTipsList');

    if (data.optimized_code && optSection && optCodeBox) {
      optSection.style.display = 'block';
      optCodeBox.textContent = data.optimized_code;

      if (savingsBadge) {
        savingsBadge.style.display = 'inline-block';
        const pct = data.potential_savings_pct != null ? data.potential_savings_pct.toFixed(0) : '60';
        savingsBadge.textContent = `~${pct}% CO₂ Reduction`;
      }

      if (tipsList && Array.isArray(data.optimization_tips)) {
        tipsList.innerHTML = data.optimization_tips.map(tip => `<div>&bull; ${escapeHtml(tip)}</div>`).join('');
      }
    }
  } catch (err) {
    alert(err.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> AI Forecast &amp; Optimize';
    }
  }
}

function copyOptimizedCode() {
  const codeBox = document.getElementById('mlOptimizedCodeBox');
  if (!codeBox) return;
  const text = codeBox.textContent;
  navigator.clipboard.writeText(text).then(() => {
    alert('Optimized Green Code copied to clipboard!');
  }).catch(() => {
    alert('Could not copy automatically. Please select and copy manually.');
  });
}

// ─────────────────────────────────────────────
// AUTHENTICATION MANAGEMENT
// ─────────────────────────────────────────────
async function initAuth() {
  const token = getAuthToken();
  if (!token) {
    updateAuthNavUI(null);
    return;
  }
  try {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const user = await res.json();
      currentUser = user;
      updateAuthNavUI(user);
    } else {
      // Invalid/expired token
      localStorage.removeItem('cfe_jwt_token');
      currentUser = null;
      updateAuthNavUI(null);
    }
  } catch (err) {
    console.warn('Auth check error:', err);
    updateAuthNavUI(null);
  }
}

function updateAuthNavUI(user) {
  const navText = document.getElementById('authNavText');
  const navIcon = document.getElementById('authNavIcon');
  const navBtn  = document.getElementById('authNavBtn');
  const scopeBadge = document.getElementById('historyScopeBadge');

  const guestView = document.getElementById('authPageGuestView');
  const userView = document.getElementById('authPageUserView');

  if (user) {
    if (navText) navText.textContent = user.username;
    if (navIcon) navIcon.className = 'fa-solid fa-user-check';
    if (navBtn) {
      navBtn.title = `Signed in as ${user.username} (${user.email}). Click to view account.`;
      navBtn.style.borderColor = 'var(--cerulean-hi)';
      navBtn.style.background = 'var(--cerulean-dim)';
      navBtn.style.color = 'var(--cerulean)';
    }
    if (scopeBadge) scopeBadge.textContent = `Scope: ${user.username} (Personal)`;

    // Update dedicated Auth Page elements
    if (guestView) guestView.style.display = 'none';
    if (userView) userView.style.display = 'flex';
    const initials = (user.username || 'US').slice(0, 2).toUpperCase();
    const avatarEl = document.getElementById('profileAvatarInitials');
    if (avatarEl) avatarEl.textContent = initials;
    const uEl = document.getElementById('profileUsername');
    if (uEl) uEl.textContent = user.username;
    const eEl = document.getElementById('profileEmail');
    if (eEl) eEl.textContent = user.email || `${user.username}@carbon-estimator.local`;
    const sEl = document.getElementById('profileProjectScope');
    if (sEl) sEl.textContent = user.default_project_id || user.username;
    const dbEl = document.getElementById('profileDbState');
    if (dbEl) dbEl.textContent = isMongoConnectedState ? 'MongoDB Live' : 'Memory Resilient Fallback';

  } else {
    if (navText) navText.textContent = 'Sign In / Register';
    if (navIcon) navIcon.className = 'fa-solid fa-user-circle';
    if (navBtn) {
      navBtn.title = 'Sign in or register an account';
      navBtn.style.borderColor = 'var(--border-2)';
      navBtn.style.background = 'var(--black-3)';
      navBtn.style.color = 'var(--text-2)';
    }
    if (scopeBadge) scopeBadge.textContent = 'Scope: Default Project (Guest)';

    // Update dedicated Auth Page elements
    if (guestView) guestView.style.display = 'block';
    if (userView) userView.style.display = 'none';
  }
}

function handleAuthNavClick() {
  switchTab('auth');
}

// ─────────────────────────────────────────────
// DEDICATED AUTH PAGE HANDLERS
// ─────────────────────────────────────────────
let currentAuthPageMode = 'login';

function switchAuthPageMode(mode) {
  currentAuthPageMode = mode;
  const tabLogin = document.getElementById('authPageTabLogin');
  const tabReg   = document.getElementById('authPageTabRegister');
  const emailGrp = document.getElementById('authPageEmailGroup');
  const strengthWrap = document.getElementById('authPasswordStrengthWrap');
  const submitBtn = document.getElementById('authPageSubmitBtn');
  const title = document.getElementById('authPageTitle');
  const emailInput = document.getElementById('authPageEmail');
  const alertEl = document.getElementById('authPageAlert');

  if (alertEl) alertEl.style.display = 'none';

  if (mode === 'register') {
    if (tabLogin) tabLogin.classList.remove('active');
    if (tabReg)   tabReg.classList.add('active');
    if (emailGrp) emailGrp.style.display = 'flex';
    if (emailInput) emailInput.required = true;
    if (strengthWrap) strengthWrap.style.display = 'block';
    if (title) title.textContent = 'Create Climate-Tech Account';
    if (submitBtn) submitBtn.innerHTML = '<i class="fa-solid fa-user-plus"></i> Create Account';
  } else {
    if (tabReg)   tabReg.classList.remove('active');
    if (tabLogin) tabLogin.classList.add('active');
    if (emailGrp) emailGrp.style.display = 'none';
    if (emailInput) emailInput.required = false;
    if (strengthWrap) strengthWrap.style.display = 'none';
    if (title) title.textContent = 'Developer Access Portal';
    if (submitBtn) submitBtn.innerHTML = '<i class="fa-solid fa-arrow-right-to-bracket"></i> Sign In';
  }
}

function checkPasswordStrength(password) {
  let score = 0;
  const hasLength = password.length >= 8;
  const hasNumber = /[0-9]/.test(password);
  const hasCase = /[A-Z]/.test(password) && /[a-z]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  if (hasLength) score++;
  if (hasNumber) score++;
  if (hasCase) score++;
  if (hasSpecial) score++;

  const colors = ['var(--black-4)', 'var(--rose)', 'var(--amber)', 'var(--cerulean)', '#10b981'];
  const labels = ['Empty', 'Weak Entropy', 'Moderate', 'Strong', 'Cryptographically Secure'];

  for (let i = 1; i <= 4; i++) {
    const bar = document.getElementById(`strBar${i}`);
    if (bar) {
      bar.style.background = i <= score ? colors[score] : 'var(--black-4)';
    }
  }

  const txt = document.getElementById('strengthText');
  if (txt) {
    txt.textContent = labels[score] || 'Weak';
    txt.style.color = colors[score] || 'var(--text-3)';
  }

  // Update dynamic checklist items
  updateCheckItem('chkLength', hasLength);
  updateCheckItem('chkNumber', hasNumber);
  updateCheckItem('chkCase', hasCase);
  updateCheckItem('chkSpecial', hasSpecial);
}

function updateCheckItem(id, valid) {
  const el = document.getElementById(id);
  if (!el) return;
  if (valid) {
    el.classList.add('valid');
    const icon = el.querySelector('i');
    if (icon) icon.className = 'fa-solid fa-circle-check';
  } else {
    el.classList.remove('valid');
    const icon = el.querySelector('i');
    if (icon) icon.className = 'fa-regular fa-circle';
  }
}

// ─────────────────────────────────────────────
// CYBER SENTINEL & 3D CARD INTERACTION
// ─────────────────────────────────────────────
function setSentinelShield(shielded) {
  const sentinel = document.getElementById('cyberSentinel');
  if (sentinel) {
    if (shielded) {
      sentinel.classList.add('shielded');
    } else {
      sentinel.classList.remove('shielded');
    }
  }
}

function onUsernameInputChange(val) {
  const trimmed = val.trim();
  const passUser = document.getElementById('passUsername');
  const passScope = document.getElementById('passScope');
  const passAvatar = document.getElementById('passAvatar');

  if (passUser) passUser.textContent = trimmed || 'guest_coder';
  if (passScope) passScope.textContent = trimmed ? `${trimmed}_project` : 'guest_project';

  if (passAvatar) {
    if (trimmed.length > 0) {
      passAvatar.textContent = trimmed.slice(0, 2).toUpperCase();
      // Generate consistent neon gradient from string hash
      let hash = 0;
      for (let i = 0; i < trimmed.length; i++) hash = trimmed.charCodeAt(i) + ((hash << 5) - hash);
      const hue1 = Math.abs(hash % 360);
      const hue2 = (hue1 + 60) % 360;
      passAvatar.style.background = `linear-gradient(135deg, hsl(${hue1}, 85%, 55%), hsl(${hue2}, 85%, 50%))`;
    } else {
      passAvatar.innerHTML = '<i class="fa-solid fa-terminal"></i>';
      passAvatar.style.background = 'linear-gradient(135deg, var(--cerulean), var(--rose))';
    }
  }
}

function onEmailInputChange(val) {
  const passRank = document.getElementById('passRank');
  if (passRank && val.includes('@')) {
    passRank.innerHTML = `<i class="fa-solid fa-award"></i> Verified Climate Identity`;
  }
}

function generateRandomHandle() {
  const prefixes = ['cyber', 'green', 'zero', 'carbon', 'eco', 'quantum', 'solar', 'kernel'];
  const suffixes = ['leaf', 'loop', 'coder', 'flux', 'byte', 'spark', 'node', 'watt'];
  const num = Math.floor(10 + Math.random() * 89);
  const p = prefixes[Math.floor(Math.random() * prefixes.length)];
  const s = suffixes[Math.floor(Math.random() * suffixes.length)];
  const handle = `${p}_${s}_${num}`;

  const uInput = document.getElementById('authPageUsername');
  if (uInput) {
    uInput.value = handle;
    onUsernameInputChange(handle);
  }
  showToast('Handle Generated', `Assigned: ${handle}`, 'info');
}

function fillQuickDemoAccount() {
  const uInput = document.getElementById('authPageUsername');
  const pInput = document.getElementById('authPagePassword');
  const eInput = document.getElementById('authPageEmail');

  if (uInput) {
    uInput.value = 'eco_engineer';
    onUsernameInputChange('eco_engineer');
  }
  if (pInput) {
    pInput.value = 'GreenCloud#2026';
    checkPasswordStrength('GreenCloud#2026');
  }
  if (eInput) {
    eInput.value = 'eco.engineer@climate-tech.org';
  }
  showToast('Demo Credentials Loaded', 'Ready to sign in as eco_engineer', 'info');
}

// Global Mouse tracking for Cyber Sentinel eye and 3D card tilt
document.addEventListener('mousemove', (e) => {
  // 1. Pupil tracking
  const sentinel = document.getElementById('cyberSentinel');
  const pupil = document.getElementById('sentinelPupil');
  if (sentinel && pupil && !sentinel.classList.contains('shielded')) {
    const rect = sentinel.getBoundingClientRect();
    const eyeCenterX = rect.left + rect.width / 2;
    const eyeCenterY = rect.top + rect.height / 2;
    const rad = Math.atan2(e.clientY - eyeCenterY, e.clientX - eyeCenterX);
    const dist = Math.min(6, Math.hypot(e.clientX - eyeCenterX, e.clientY - eyeCenterY) / 30);
    const px = Math.cos(rad) * dist;
    const py = Math.sin(rad) * dist;
    pupil.style.transform = `translate(${px}px, ${py}px)`;
  }

  // 2. 3D card tilt on #authCardTiltBox
  const tiltCard = document.getElementById('authCardTiltBox');
  if (tiltCard) {
    const rect = tiltCard.getBoundingClientRect();
    if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
      const xRel = (e.clientX - rect.left) / rect.width - 0.5;
      const yRel = (e.clientY - rect.top) / rect.height - 0.5;
      tiltCard.style.transform = `rotateY(${xRel * 12}deg) rotateX(${-yRel * 12}deg)`;
    }
  }
});

const tiltBoxEl = document.getElementById('authCardTiltBox');
if (tiltBoxEl) {
  tiltBoxEl.addEventListener('mouseleave', () => {
    tiltBoxEl.style.transform = 'rotateY(0deg) rotateX(0deg)';
  });
}

// ─────────────────────────────────────────────
// TOAST NOTIFICATIONS & NUMBER COUNTER ROLLERS
// ─────────────────────────────────────────────
function showToast(title, desc = '', type = 'info', duration = 3800) {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  const typeClass = type === 'warn' ? 'toast-rose' : (type === 'amber' ? 'toast-amber' : '');
  const icon = type === 'warn' ? 'fa-triangle-exclamation' : (type === 'amber' ? 'fa-circle-exclamation' : 'fa-circle-check');

  toast.className = `toast-item ${typeClass}`;
  toast.innerHTML = `
    <i class="fa-solid ${icon} toast-icon"></i>
    <div class="toast-msg-wrap">
      <div class="toast-title">${escapeHtml(title)}</div>
      ${desc ? `<div class="toast-desc">${escapeHtml(desc)}</div>` : ''}
    </div>
    <div class="toast-timer-bar" style="animation-duration:${duration}ms;"></div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'opacity 0.25s, transform 0.25s';
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(40px)';
    setTimeout(() => {
      if (toast.parentElement) toast.remove();
    }, 260);
  }, duration);
}

function animateNumberCount(elementId, startVal, endVal, duration = 800, decimals = 4, suffix = '') {
  const el = document.getElementById(elementId);
  if (!el) return;
  const startTime = performance.now();
  function update(now) {
    const elapsed = now - startTime;
    const progress = Math.min(1, elapsed / duration);
    // Ease-out cubic curve
    const easeProgress = 1 - Math.pow(1 - progress, 3);
    const curr = startVal + (endVal - startVal) * easeProgress;
    el.innerText = `${curr.toFixed(decimals)}${suffix}`;
    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }
  requestAnimationFrame(update);
}

async function handleAuthPageSubmit(event) {
  event.preventDefault();
  const username = document.getElementById('authPageUsername').value.trim();
  const password = document.getElementById('authPagePassword').value;
  const email    = document.getElementById('authPageEmail').value.trim();
  const submitBtn = document.getElementById('authPageSubmitBtn');

  if (!username || !password) {
    showToast('Missing Credentials', 'Please enter both username and password.', 'warn');
    return;
  }
  if (currentAuthPageMode === 'register' && !email) {
    showToast('Email Required', 'Please enter an email address for registration.', 'warn');
    return;
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Authenticating...';
  }

  try {
    const endpoint = currentAuthPageMode === 'register' ? '/api/auth/register' : '/api/auth/login';
    const payload = currentAuthPageMode === 'register'
      ? { username, email, password }
      : { username, password };

    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Authentication request failed.');
    }

    // Save token
    localStorage.setItem('cfe_jwt_token', data.access_token);
    currentUser = {
      id: data.id,
      username: data.username,
      email: data.email,
      default_project_id: data.default_project_id || data.username,
    };

    updateAuthNavUI(currentUser);
    fetchBudgetStatus();
    fetchRunHistory();
    pulseGlobeAnimation();

    showToast('Session Established', `Authenticated as ${data.username}`, 'info');
    setTimeout(() => {
      switchTab('overview');
    }, 1000);

  } catch (err) {
    showToast('Authentication Failed', err.message, 'warn');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = currentAuthPageMode === 'register'
        ? '<i class="fa-solid fa-user-plus"></i> Create Account'
        : '<i class="fa-solid fa-arrow-right-to-bracket"></i> Sign In';
    }
  }
}

function showAuthPageAlert(msg, isError = true) {
  showToast(isError ? 'Security Notice' : 'Success', msg, isError ? 'warn' : 'info');
}

function openAuthModal(mode = 'login') {
  const modal = document.getElementById('authModal');
  if (modal) modal.style.display = 'flex';
  switchAuthMode(mode);
}

function closeAuthModal() {
  const modal = document.getElementById('authModal');
  if (modal) modal.style.display = 'none';
  const alertEl = document.getElementById('authAlert');
  if (alertEl) alertEl.style.display = 'none';
}

function handleModalBackdropClick(event) {
  if (event.target && event.target.id === 'authModal') {
    closeAuthModal();
  }
}

function switchAuthMode(mode) {
  currentAuthMode = mode;
  const tabLogin = document.getElementById('authTabLogin');
  const tabReg   = document.getElementById('authTabRegister');
  const emailGrp = document.getElementById('authEmailGroup');
  const submitBtn = document.getElementById('authSubmitBtn');
  const title = document.getElementById('authModalTitle');
  const emailInput = document.getElementById('authEmail');
  const alertEl = document.getElementById('authAlert');

  if (alertEl) alertEl.style.display = 'none';

  if (mode === 'register') {
    if (tabLogin) tabLogin.classList.remove('active');
    if (tabReg)   tabReg.classList.add('active');
    if (emailGrp) emailGrp.style.display = 'flex';
    if (emailInput) emailInput.required = true;
    if (title) title.textContent = 'Create Developer Account';
    if (submitBtn) submitBtn.innerHTML = '<i class="fa-solid fa-user-plus"></i> Create Account';
  } else {
    if (tabReg)   tabReg.classList.remove('active');
    if (tabLogin) tabLogin.classList.add('active');
    if (emailGrp) emailGrp.style.display = 'none';
    if (emailInput) emailInput.required = false;
    if (title) title.textContent = 'Sign In to Carbon Estimator';
    if (submitBtn) submitBtn.innerHTML = '<i class="fa-solid fa-arrow-right-to-bracket"></i> Sign In';
  }
}

async function handleAuthSubmit(event) {
  event.preventDefault();
  const username = document.getElementById('authUsername').value.trim();
  const password = document.getElementById('authPassword').value;
  const email    = document.getElementById('authEmail').value.trim();
  const alertEl  = document.getElementById('authAlert');
  const submitBtn = document.getElementById('authSubmitBtn');

  if (!username || !password) {
    showAuthAlert('Username and password are required', true);
    return;
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Processing...';
  }

  try {
    let url = `${API_BASE}/api/auth/login`;
    let payload = { username, password };

    if (currentAuthMode === 'register') {
      url = `${API_BASE}/api/auth/register`;
      payload = { username, email: email || `${username}@example.com`, password };
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Authentication failed');
    }

    // Save token
    localStorage.setItem('cfe_jwt_token', data.access_token);
    currentUser = {
      id: data.id,
      username: data.username,
      email: data.email,
      default_project_id: data.default_project_id
    };

    updateAuthNavUI(currentUser);
    closeAuthModal();
    fetchBudgetStatus();
    fetchRunHistory();

    const welcomeMsg = currentAuthMode === 'register' 
      ? `Account created! Welcome, ${data.username}.`
      : `Welcome back, ${data.username}!`;
    alert(welcomeMsg);

  } catch (err) {
    showAuthAlert(err.message, true);
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = currentAuthMode === 'register'
        ? '<i class="fa-solid fa-user-plus"></i> Create Account'
        : '<i class="fa-solid fa-arrow-right-to-bracket"></i> Sign In';
    }
  }
}

function showAuthAlert(msg, isError = true) {
  const alertEl = document.getElementById('authAlert');
  if (!alertEl) return;
  alertEl.style.display = 'block';
  alertEl.style.background = isError ? 'var(--rose-dim)' : 'var(--cerulean-dim)';
  alertEl.style.border = isError ? '1px solid var(--rose-mid)' : '1px solid var(--cerulean-hi)';
  alertEl.style.color = isError ? 'var(--rose)' : 'var(--cerulean)';
  alertEl.textContent = msg;
}

function logoutUser() {
  localStorage.removeItem('cfe_jwt_token');
  currentUser = null;
  updateAuthNavUI(null);
  fetchBudgetStatus();
  fetchRunHistory();
  alert('You have been signed out.');
}

// ─────────────────────────────────────────────
// RUN HISTORY (MONGODB PERSISTENCE)
// ─────────────────────────────────────────────
async function fetchRunHistory() {
  const tbody = document.getElementById('historyTableBody');
  if (!tbody) return;

  const projectId = getCurrentProjectId();
  try {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center;padding:1.5rem;color:var(--text-3);font-family:var(--font-mono);font-size:0.8rem;">
          <i class="fa-solid fa-circle-notch fa-spin"></i> Fetching runs from database...
        </td>
      </tr>
    `;

    const res = await fetch(`${API_BASE}/api/profile/history/${projectId}?limit=25`, {
      headers: getAuthHeaders()
    });

    if (!res.ok) {
      throw new Error('Failed to load execution history');
    }

    const data = await res.json();
    const runs = data.runs || [];
    renderHistoryTable(runs);

  } catch (err) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center;padding:1.5rem;color:var(--rose);font-family:var(--font-mono);font-size:0.8rem;">
          <i class="fa-solid fa-triangle-exclamation"></i> Error loading history: ${escapeHtml(err.message)}
        </td>
      </tr>
    `;
  }
}

function renderHistoryTable(runs) {
  const tbody = document.getElementById('historyTableBody');
  if (!tbody) return;

  if (!runs || runs.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center;padding:2rem;color:var(--text-3);font-family:var(--font-mono);font-size:0.82rem;">
          <i class="fa-solid fa-folder-open" style="font-size:1.8rem;margin-bottom:0.5rem;display:block;color:var(--text-3);"></i>
          No execution runs found yet. Profile some code to persist records in MongoDB.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = runs.map(run => {
    const ts = run.timestamp ? new Date(run.timestamp).toLocaleString() : 'N/A';
    const lang = escapeHtml(run.language || 'python');
    const time = run.execution_time_s != null ? `${Number(run.execution_time_s).toFixed(4)}s` : '-';
    const energy = run.energy_j != null ? Number(run.energy_j).toFixed(4) : '-';
    const co2 = run.emissions_g_co2 != null ? Number(run.emissions_g_co2).toFixed(6) : '-';
    const rating = run.rating || 'A';
    const hotspots = run.hotspots_count != null ? run.hotspots_count : 0;

    return `
      <tr class="history-row">
        <td style="font-family:var(--font-mono);font-size:0.8rem;color:var(--text-3);">${ts}</td>
        <td>
          <span class="pill" style="font-size:0.75rem;padding:0.15rem 0.5rem;text-transform:capitalize;">${lang}</span>
        </td>
        <td style="font-family:var(--font-mono);">${time}</td>
        <td style="font-family:var(--font-mono);">${energy}</td>
        <td style="font-family:var(--font-mono);color:var(--cerulean);font-weight:600;">${co2}</td>
        <td>
          <span class="history-rating-badge history-rating-${rating}">${rating}</span>
        </td>
        <td>
          <span style="font-family:var(--font-mono);color:${hotspots > 0 ? 'var(--rose)' : 'var(--text-3)'};font-weight:${hotspots > 0 ? '600' : '400'};">
            ${hotspots} hotspot${hotspots === 1 ? '' : 's'}
          </span>
        </td>
      </tr>
    `;
  }).join('');
}


