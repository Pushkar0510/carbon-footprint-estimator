"""Energy measurement and estimation module.

Calculates power draw (Watts) and total energy consumed (kWh)
from computational resource usage metrics (CPU %, RAM, GPU, execution runtime).
"""


def calculate_cpu_power(cpu_percent: float, baseline_watts: float = 30.0, max_watts: float = 120.0) -> float:
    """Estimate CPU power draw (Watts) based on utilization percentage."""
    normalized_cpu = max(0.0, min(100.0, cpu_percent)) / 100.0
    return baseline_watts + (max_watts - baseline_watts) * normalized_cpu


def calculate_ram_power(memory_bytes: int, watts_per_gb: float = 0.38) -> float:
    """Estimate RAM power draw (Watts) based on allocated memory."""
    memory_gb = memory_bytes / (1024.0 ** 3)
    return max(0.0, memory_gb * watts_per_gb)


def calculate_energy_kwh(
    execution_time_s: float,
    cpu_percent: float = 50.0,
    memory_bytes: int = 512 * 1024 * 1024,
    baseline_power_watts: float = 40.0,
    gpu_power_watts: float = 0.0,
) -> dict:
    """Calculate total energy consumption in kWh and Wh.

    Formula: Energy (kWh) = (Power (Watts) * Execution Time (Hours)) / 1000
    """
    if execution_time_s < 0:
        execution_time_s = 0.0

    cpu_watts = calculate_cpu_power(cpu_percent, baseline_watts=baseline_power_watts * 0.4, max_watts=baseline_power_watts * 1.5)
    ram_watts = calculate_ram_power(memory_bytes)
    total_watts = cpu_watts + ram_watts + gpu_power_watts

    execution_hours = execution_time_s / 3600.0
    energy_kwh = (total_watts * execution_hours) / 1000.0
    energy_wh = energy_kwh * 1000.0

    return {
        "execution_time_s": round(execution_time_s, 4),
        "total_power_watts": round(total_watts, 2),
        "cpu_power_watts": round(cpu_watts, 2),
        "ram_power_watts": round(ram_watts, 4),
        "gpu_power_watts": round(gpu_power_watts, 2),
        "energy_wh": round(energy_wh, 6),
        "energy_kwh": round(energy_kwh, 9),
    }
