"""Subprocess Executor with Safety Controls & Profiling Support.

Executes target script in an isolated subprocess, enforcing execution timeouts,
capturing stdout/stderr, measuring resource consumption, and calculating carbon emissions.
"""
import sys
import subprocess
import time
import psutil
import os
from typing import Dict, Any, Optional

from engine.energy import calculate_energy_kwh
from engine.carbon import get_grid_intensity, calculate_emissions


def run_script(path: str, region: Optional[str] = "Maharashtra", timeout: int = 30) -> Dict[str, Any]:
    """Execute Python script at `path` in a subprocess with resource monitoring and carbon estimation."""
    if not os.path.exists(path):
        return {
            "returncode": 1,
            "stdout": "",
            "stderr": f"File not found: {path}",
            "elapsed_s": 0.0,
            "metrics": {},
        }

    start_time = time.time()
    grid_intensity = get_grid_intensity(region)

    try:
        proc = subprocess.Popen(
            [sys.executable, path],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )

        ps_proc = None
        try:
            ps_proc = psutil.Process(proc.pid)
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            pass

        max_mem_bytes = 0
        cpu_samples = []

        # Monitor during execution
        while proc.poll() is None:
            if time.time() - start_time > timeout:
                proc.kill()
                return {
                    "returncode": -1,
                    "stdout": "",
                    "stderr": f"Execution timed out after {timeout} seconds.",
                    "elapsed_s": timeout,
                    "metrics": {},
                }
            if ps_proc:
                try:
                    mem = ps_proc.memory_info().rss
                    if mem > max_mem_bytes:
                        max_mem_bytes = mem
                    cpu = ps_proc.cpu_percent(interval=0.05)
                    cpu_samples.append(cpu)
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    pass
            time.sleep(0.05)

        stdout, stderr = proc.communicate(timeout=2)
        end_time = time.time()
        elapsed_s = max(0.000001, end_time - start_time)

        avg_cpu = sum(cpu_samples) / len(cpu_samples) if cpu_samples else 40.0
        avg_mem = max(max_mem_bytes, 20 * 1024 * 1024)

        energy_data = calculate_energy_kwh(
            execution_time_s=elapsed_s,
            cpu_percent=avg_cpu,
            memory_bytes=avg_mem,
        )

        carbon_data = calculate_emissions(
            energy_kwh=energy_data["energy_kwh"],
            grid_intensity_g_per_kwh=grid_intensity,
        )

        return {
            "returncode": proc.returncode,
            "stdout": stdout,
            "stderr": stderr,
            "elapsed_s": round(elapsed_s, 4),
            "region": region,
            "metrics": {
                "execution_time_s": round(elapsed_s, 4),
                "cpu_percent": round(avg_cpu, 1),
                "memory_rss_mb": round(avg_mem / (1024.0 * 1024.0), 2),
                "power_watts": energy_data["total_power_watts"],
                "energy_wh": energy_data["energy_wh"],
                "energy_kwh": energy_data["energy_kwh"],
                "grid_intensity_g_per_kwh": grid_intensity,
                "emissions_g_co2": carbon_data["emissions_g_co2"],
                "emissions_mg_co2": carbon_data["emissions_mg_co2"],
                "equivalencies": carbon_data["equivalencies"],
            },
        }

    except Exception as e:
        return {
            "returncode": 1,
            "stdout": "",
            "stderr": f"Execution error: {str(e)}",
            "elapsed_s": 0.0,
            "metrics": {},
        }


if __name__ == "__main__":
    if len(sys.argv) > 1:
        res = run_script(sys.argv[1])
        print("Subprocess Execution Result:", res)
