"""Hotspot detection and carbon attribution module.

Identifies high-carbon functions and source code hotspots by analyzing
execution profiles and attributing energy/emissions proportionally.
"""
from typing import List, Dict, Any


def analyze_hotspots(function_stats: List[Dict[str, Any]], total_emissions_g: float) -> List[Dict[str, Any]]:
    """Attribute emissions to functions based on execution time shares and identify hotspots.

    function_stats format:
    [
        {"function": "preprocess", "cumtime": 1.75, "ncalls": 1, "filename": "script.py", "lineno": 12},
        {"function": "sort", "cumtime": 0.28, "ncalls": 5, "filename": "script.py", "lineno": 25},
    ]
    """
    if not function_stats:
        return []

    total_time = sum(stat.get("cumtime", 0.0) for stat in function_stats)
    if total_time <= 0:
        total_time = 0.000001  # avoid div zero

    hotspots = []
    for stat in function_stats:
        func_name = stat.get("function", "<unknown>")
        cumtime = stat.get("cumtime", 0.0)
        ncalls = stat.get("ncalls", 1)
        filename = stat.get("filename", "")
        lineno = stat.get("lineno", 0)

        share_pct = (cumtime / total_time) * 100.0
        attributed_co2_g = (cumtime / total_time) * total_emissions_g

        is_hotspot = share_pct >= 10.0  # Functions taking >= 10% execution time

        hotspots.append({
            "function": func_name,
            "filename": filename,
            "lineno": lineno,
            "ncalls": ncalls,
            "cumtime_s": round(cumtime, 4),
            "contribution_pct": round(share_pct, 2),
            "attributed_co2_g": round(attributed_co2_g, 6),
            "is_hotspot": is_hotspot,
        })

    # Sort descending by contribution percentage
    hotspots.sort(key=lambda x: x["contribution_pct"], reverse=True)
    return hotspots
