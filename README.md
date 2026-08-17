# Carbon Footprint Estimator for Software Codebases

A developer-centric tool for estimating, analyzing, and reducing the carbon footprint of software execution.

## Project Overview

Every software program consumes computational resources such as CPU, RAM, and, where available, GPU resources. These resources consume electrical energy, which indirectly contributes to carbon emissions.

### Core Workflow

```text
Code Execution
      ↓
Resource Usage
(CPU / RAM / GPU)
      ↓
Energy Consumption
      ↓
Carbon Intensity
      ↓
CO₂ Emissions
      ↓
Hotspot Detection
      ↓
Green Code Recommendations
```

### Major Capabilities

1. Function-level and line-level carbon profiling
2. India-specific state-wise carbon intensity analysis
3. Green code optimization recommendations
4. Carbon budget monitoring
5. Machine-learning-based pre-execution emission prediction

---

## Key Features

### 1. Carbon & Energy Profiling

The Python profiling engine analyzes target programs and collects:

- Execution time
- CPU utilization
- RAM utilization
- GPU information where supported
- Estimated energy consumption
- Estimated CO₂ emissions

Energy model:

```text
Energy (kWh) =
(Power (Watts) × Execution Time (Hours)) / 1000
```

### 2. Function-Level and Line-Level Profiling

The system identifies:

- Carbon contribution by function
- Carbon contribution by source-code line
- Execution time per function/line
- High-carbon hotspots

Example:

```text
Function          CO₂ Contribution
-----------------------------------
preprocess()      0.019 g   76%
sort()            0.003 g   12%
plot()            0.002 g    8%
```

Line-level values are attributed/estimated emissions based on execution/resource shares rather than direct physical measurements at an individual source-code line.

### 3. India-Specific Carbon Intensity

The system supports localized carbon calculations using state-wise electricity-grid carbon intensity data.

```text
Emissions (g CO₂) =
Energy (kWh) × Grid Carbon Intensity (g CO₂/kWh)
```

The project proposes maintaining a state-wise India dataset using sources such as Central Electricity Authority (CEA) reports.

> Grid-intensity values should be verified against the exact source/version used for the final implementation and project report.

### 4. Green Code Advisor

A Python AST-based static analyzer examines source code before execution and identifies selected inefficient patterns:

- Unvectorized numerical loops
- High-complexity nested loops such as O(n²)
- I/O operations inside loops

Example recommendation:

```text
Detected:
Unvectorized numerical loop

Recommendation:
Consider NumPy/vectorized operations.

Reason:
Vectorized operations may reduce Python-level loop overhead
and CPU utilization.
```

### 5. Carbon Budget Monitoring

Developers can define a carbon budget for a project or application.

The system can:

- Track cumulative emissions
- Compare consumption against a defined limit
- Display budget utilization
- Trigger alerts when thresholds are reached

Example:

```text
Carbon Budget
────────────────────────────
Used       : 3,850 g
Limit      : 5,000 g
Usage      : 77%
Status     : Within Budget
```

### 6. ML-Based Pre-Execution Prediction

The ML module attempts to estimate energy consumption and carbon emissions before executing computationally expensive code.

Potential features:

- AST depth
- AST tree size
- Cyclomatic complexity
- Number of loops
- Nested loop depth
- Estimated memory allocation
- Input data size

Candidate algorithms:

- Random Forest Regressor
- XGBoost Regressor

---

## System Architecture

```text
┌───────────────────────────────────────────────────────┐
│                 React Dashboard                       │
│                                                       │
│  • Profiling Results                                  │
│  • Carbon Hotspots                                    │
│  • Charts & History                                   │
│  • India State Selection                              │
│  • Carbon Budget                                      │
│  • Recommendations                                    │
└──────────────────────────┬────────────────────────────┘
                           │
                           │ HTTP / REST
                           ▼
┌───────────────────────────────────────────────────────┐
│              Node.js + Express Backend                │
│                                                       │
│  • Authentication                                     │
│  • Project Management                                 │
│  • REST APIs                                          │
│  • Carbon Budget Management                           │
│  • Python Process Orchestration                       │
└───────────────┬───────────────────────┬───────────────┘
                │                       │
                ▼                       ▼
┌────────────────────────┐   ┌──────────────────────────┐
│       MongoDB          │   │     Python Engine        │
│                        │   │                          │
│ • Users                │   │ • CodeCarbon             │
│ • Projects             │   │ • cProfile               │
│ • Execution Runs       │   │ • line_profiler          │
│ • Carbon Budgets       │   │ • psutil                 │
│ • India Grid Data      │   │ • PyNVML                 │
└────────────────────────┘   │ • AST Analyzer           │
                             │ • ML Predictor            │
                             └──────────────────────────┘
```

---

## Technology Stack

### Backend & Execution

- Node.js
- Express.js
- TypeScript
- MongoDB
- Mongoose
- Python 3.10+

### Python Profiling & Intelligence

- CodeCarbon
- cProfile
- line_profiler
- psutil
- PyNVML
- Python `ast`
- NumPy
- pandas
- Scikit-Learn
- XGBoost

### Frontend

- React.js
- Vite
- Tailwind CSS
- Recharts / Chart.js
- Lucide React

### Testing

- pytest
- Jest
- Supertest

---

## Project Structure

Recommended top-level layout and suggested files for frontend and backend modules.

```text
carbon-footprint-estimator/
│
├── engine/                         # Python profiling & estimator engine
│   ├── profiler.py
│   ├── executor.py
│   ├── energy.py
│   ├── carbon.py
│   ├── hotspot.py
│   ├── requirements.txt
│   └── tests/
│       ├── test_profiler.py
│       └── test_executor.py
│
├── backend/                        # Python FastAPI backend
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                 # FastAPI app instance
│   │   ├── routers/                # APIRouter modules
│   │   │   └── profile.py
│   │   ├── services/               # business logic & engine adapters
│   │   │   └── profiling_service.py
│   │   ├── models/                 # pydantic schemas
│   │   │   └── schemas.py
│   │   └── utils/                  # helpers (logging, temp files)
│   ├── tests/                      # pytest tests
│   │   └── test_profile.py
│   ├── requirements.txt
│   ├── .env.example
│   ├── Dockerfile
│   └── README.md
│
├── frontend/                       # React + Vite UI
│   ├── src/
│   │   ├── main.tsx                # app entry
│   │   ├── App.tsx
│   │   ├── pages/                  # views / routes
│   │   │   ├── Dashboard.tsx
│   │   │   └── RunProfiler.tsx
│   │   ├── components/             # reusable components
│   │   │   ├── ProfileCard.tsx
│   │   │   └── HotspotTable.tsx
│   │   ├── services/               # API clients
│   │   │   └── api.ts              # axios/fetch wrappers
│   │   ├── hooks/                  # custom react hooks
│   │   │   └── useProfileRuns.ts
│   │   ├── stores/                 # optional state management (Zustand/Redux)
│   │   ├── styles/                 # global styles / tailwind config reference
│   │   └── assets/
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
│
├── data/
│   └── india_grid.json             # state-wise carbon intensity data
│
├── infra/                          # optional infra-as-code, compose files
│   ├── docker-compose.yml
│   └── nginx.conf
│
├── tests/                          # cross-cutting tests & e2e
├── docs/                           # design docs, APIs, contributors
└── README.md
```

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js
- npm
- MongoDB
- Git
- VS Code or another development environment

GPU monitoring through PyNVML requires compatible NVIDIA hardware. The system should continue to work when an NVIDIA GPU is unavailable.

### 1. Clone the Repository

```bash
git clone <YOUR_REPOSITORY_URL>
cd carbon-footprint-estimator
```

### 2. Set Up Python

```bash
python -m venv venv
```

Windows:

```bash
venv\Scripts\activate
```

Linux/macOS:

```bash
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r engine/requirements.txt
```

### 3. Python Dependencies

```text
codecarbon>=2.3.0
line-profiler>=4.1.0
nvidia-ml-py3>=11.525.0
psutil>=5.9.0
scikit-learn>=1.3.0
pandas>=2.0.0
numpy>=1.24.0
pytest>=7.4.0
```

### 4. Backend Setup

```bash
cd backend
npm install
```

The backend is responsible for REST APIs, project management, Python process orchestration, carbon budgets, and communication with the frontend.

### 5. Frontend Setup

```bash
cd frontend
npm install
```

Start the Vite development server using the configured development command.

---

## Core API Endpoints

### Profiling

```http
POST /api/profile/run
```

Executes submitted Python code and returns profiling and carbon information.

Example:

```json
{
  "scriptContent": "print('Hello World')",
  "region": "Maharashtra"
}
```

```http
POST /api/profile/file
```

Accepts a Python file for profiling.

```http
GET /api/profile/history/:projectId
```

Returns historical carbon-emission runs.

```http
GET /api/profile/run/:runId
```

Returns detailed profiling information for a previous run.

### India Grid

```http
GET /api/grid/india/states
GET /api/grid/india/live
```

## Quick Start - Run the Measurement Engine

This repository includes a minimal, local profiling engine to measure CPU, memory and estimate energy/carbon for short Python workloads. It is intended as a starting point for the full system described above.

1. Create and activate a Python 3.10+ virtual environment inside the project root.

```bash
python -m venv venv
# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate
```

2. Install the engine dependencies:

```bash
pip install -r engine/requirements.txt
```

3. Run the simple profiler example (from project root):

```bash
python -m engine.profiler
```

This prints a small report including execution time, memory usage, an energy estimate (kWh), and a CO₂ estimate (grams). Configure `power_watts` and `grid_intensity_g_per_kwh` in `engine/profiler.py` for more accurate local estimates.


### Carbon Budget

```http
POST /api/budget/set
GET /api/budget/status/:projectId
```

Example:

```json
{
  "projectId": "PROJECT_ID",
  "monthlyLimitGrams": 5000
}
```

### Intelligence

```http
POST /api/intelligence/recommend
```

### ML Prediction

```http
POST /api/predict/emission
```

Example:

```json
{
  "codeSnippet": "for i in range(1000000): ...",
  "expectedInputSize": 100000
}
```

### Authentication & Projects

```http
POST /api/auth/register
POST /api/auth/login
GET /api/projects
POST /api/projects/create
```

---

## External Data Sources

### Electricity Maps

Proposed for live and historical regional carbon-intensity information.

### Central Electricity Authority (CEA)

Proposed source for India-specific grid-emission factors.

For reproducibility, record:

- Source/report name
- Publication/version date
- Factor
- Unit
- Region/state
- Retrieval date

### Our World in Data

Can be used as an additional research/data source for historical electricity-generation information.

---

## Development Roadmap

### Month 1 — Core Python Profiling Engine

#### Week 1
- Set up repository
- Implement execution wrapper
- Integrate CodeCarbon
- Collect CPU/RAM/GPU information
- Establish baseline measurements

#### Week 2
- Integrate cProfile
- Integrate line_profiler
- Develop function-level profiling
- Develop line-level attribution
- Standardize JSON output

#### Week 3
- Build India grid dataset
- Implement regional carbon calculations
- Add state selection

#### Week 4
- Write unit tests
- Benchmark different workloads
- Validate profiling results

### Month 2 — MERN Integration

#### Week 5
- MongoDB architecture
- Express backend
- Mongoose schemas
- Python process orchestration

#### Week 6
- REST APIs
- Historical profiling
- Carbon budget logic
- Threshold alerts

#### Week 7
- React dashboard
- Summary cards
- Charts
- Hotspot viewer

#### Week 8
- India map/state selection
- Carbon budget visualization
- Integration testing

### Month 3 — Intelligence & Final Delivery

#### Week 9
- AST analyzer
- Green code rules
- Optimization recommendations

#### Week 10
- Generate ML training dataset
- Train regression model
- Integrate prediction API

#### Week 11
- End-to-end testing
- Performance optimization
- Report generation

#### Week 12
- Documentation
- Architecture diagrams
- Demonstration
- Deployment/submission package

---

## First Development Milestone

The first milestone is a working Python profiling engine.

The intended workflow is:

```bash
python engine/profiler.py test_program.py --region Maharashtra
```

Example report:

```text
========================================
      CARBON FOOTPRINT REPORT
========================================

Program              : test_program.py
Region               : Maharashtra

Execution Time       : 2.31 sec

CPU Usage
Average              : 72.4 %
Peak                 : 91.2 %

Memory
Average              : 420 MB
Peak                 : 510 MB

GPU                  : Not Available

Energy               : 0.00031 kWh

Grid Intensity       : 790 g CO₂/kWh

Estimated Emissions  : 0.245 g CO₂

========================================
```

The values above are illustrative; actual values must come from the profiling engine.

---

## Recommended Development Order

```text
1. Python execution
        ↓
2. Resource monitoring
        ↓
3. Energy measurement
        ↓
4. Carbon calculation
        ↓
5. JSON report
        ↓
6. Function profiling
        ↓
7. Line profiling
        ↓
8. India grid integration
        ↓
9. Node.js API
        ↓
10. MongoDB
        ↓
11. React dashboard
        ↓
12. Carbon budget
        ↓
13. AST advisor
        ↓
14. ML predictor
        ↓
15. Testing & deployment
```

---

## Security Considerations

Because the application executes user-provided code, execution must be isolated.

The project should implement:

- Execution timeouts
- Memory limits
- Temporary workspaces
- Restricted permissions
- Process termination
- Container-based sandboxing for stronger isolation

Never expose unrestricted `exec()` or shell execution to the public internet.

---

## Technical Considerations

### Carbon values are estimates

The system estimates emissions from energy/resource measurements and grid carbon-intensity factors. Line-level values should be presented as attributed estimates.

### GPU availability

GPU monitoring depends on compatible hardware. CPU/RAM-only environments must remain supported.

### Profiling overhead

Benchmark:

```text
Normal execution
vs.
Profiled execution
```

to measure the overhead introduced by profiling.

### Reproducibility

Record:

- Hardware
- Operating system
- Python version
- Input size
- Number of runs
- Region/grid factor
- Date/time
- Profiling configuration

---

## Research References

The project is based on concepts and resources including:

- Green Software Foundation — Software Carbon Intensity (SCI)
- CodeCarbon
- Green Algorithms
- Central Electricity Authority (CEA) data
- Electricity Maps
- Python profiling tools
- Scikit-Learn / XGBoost

---

## Project Goal

The ultimate goal is to provide developers with actionable visibility into the environmental impact of software.

Instead of only reporting:

```text
Your program emitted 0.25 g CO₂.
```

the system should eventually provide information such as:

```text
Your program emitted approximately 0.25 g CO₂.

Main hotspot:
preprocess() → 76% of attributed emissions.

Highest-impact source line:
Line 42 → 51%.

Recommendation:
Consider replacing the numerical Python loop
with a vectorized NumPy operation.

Carbon budget:
77% utilized.
```

This transforms the project from a simple carbon calculator into a developer-oriented software sustainability and optimization platform.

---

## Current Status

🚧 **Development Started**

### Current Priority

> Build and validate the Python profiling engine before beginning full MERN integration.

---

## Contributors

```text
1. Name — Role
2. Name — Role
3. Name — Role
4. Name — Role
```

---

## License

Add the project's chosen license before public release.
