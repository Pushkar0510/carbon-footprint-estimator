"""Python Profiling & Carbon Estimation Engine.

Executes target code/callable, measures CPU/RAM utilization and function runtimes,
and attributes energy consumption and CO2 emissions.
"""
import cProfile
import pstats
import time
import psutil
import os
import io
from typing import Dict, Any, Optional, Callable

from engine.energy import calculate_energy_kwh
from engine.carbon import get_grid_intensity, calculate_emissions
from engine.hotspot import analyze_hotspots


def profile_callable(
    func: Callable,
    args: tuple = (),
    kwargs: Optional[dict] = None,
    region: Optional[str] = "Maharashtra",
    runs: int = 1,
    power_watts: float = 50.0,
) -> Dict[str, Any]:
    """Profile a Python callable and return detailed execution, energy, carbon, and hotspot report."""
    if kwargs is None:
        kwargs = {}

    proc = psutil.Process(os.getpid())
    grid_intensity = get_grid_intensity(region)

    # Function-level profiling with cProfile
    profiler = cProfile.Profile()
    
    start_rss = proc.memory_info().rss
    start_time = time.time()
    
    profiler.enable()
    res = None
    for _ in range(runs):
        res = func(*args, **kwargs)
    profiler.disable()

    end_time = time.time()
    end_rss = proc.memory_info().rss
    
    elapsed_s = max(0.000001, (end_time - start_time) / float(runs))
    avg_rss_bytes = max(start_rss, end_rss)
    cpu_percent = psutil.cpu_percent(interval=None) or 45.0

    # Energy & Carbon
    energy_data = calculate_energy_kwh(
        execution_time_s=elapsed_s,
        cpu_percent=cpu_percent,
        memory_bytes=avg_rss_bytes,
        baseline_power_watts=power_watts,
    )

    carbon_data = calculate_emissions(
        energy_kwh=energy_data["energy_kwh"],
        grid_intensity_g_per_kwh=grid_intensity,
    )

    # Process cProfile stats for hotspots
    s = io.StringIO()
    ps = pstats.Stats(profiler, stream=s).sort_stats("cumulative")
    
    func_stats = []
    for func_tuple, (cc, nc, tt, ct, callers) in ps.stats.items():
        filename, line, func_name = func_tuple
        # Filter internal profiler calls
        if "profiler" in filename or "cProfile" in filename:
            continue
        func_stats.append({
            "function": func_name,
            "filename": os.path.basename(filename),
            "lineno": line,
            "ncalls": nc,
            "cumtime": ct,
            "tottime": tt,
        })

    hotspots = analyze_hotspots(func_stats, carbon_data["emissions_g_co2"])

    return {
        "region": region,
        "runs": runs,
        "metrics": {
            "execution_time_s": elapsed_s,
            "cpu_percent": cpu_percent,
            "memory_rss_mb": round(avg_rss_bytes / (1024.0 * 1024.0), 2),
            "power_watts": energy_data["total_power_watts"],
            "energy_wh": energy_data["energy_wh"],
            "energy_kwh": energy_data["energy_kwh"],
            "grid_intensity_g_per_kwh": grid_intensity,
            "emissions_g_co2": carbon_data["emissions_g_co2"],
            "emissions_mg_co2": carbon_data["emissions_mg_co2"],
            "equivalencies": carbon_data["equivalencies"],
        },
        "hotspots": hotspots[:10],  # top 10 hotspots
    }


def example_workload(n: int = 500000) -> int:
    """Sample computational workload."""
    total = 0
    for i in range(n):
        total += i
    return total


if __name__ == "__main__":
    report = profile_callable(example_workload, args=(500000,), region="Maharashtra")
    print("=== Carbon Footprint Profile Report ===")
    print(f"Region: {report['region']}")
    print(f"Execution Time: {report['metrics']['execution_time_s']} s")
    print(f"CPU Utilization: {report['metrics']['cpu_percent']}%")
    print(f"Memory (RSS): {report['metrics']['memory_rss_mb']} MB")
    print(f"Energy: {report['metrics']['energy_wh']} Wh")
    print(f"CO2 Emissions: {report['metrics']['emissions_g_co2']} g CO2")
    print(f"Top Hotspots: {len(report['hotspots'])}")
