"""Line-level carbon attribution and profiling engine.

Measures line-by-line execution counts and runtimes for source code,
attributes energy consumption and CO2 emissions per line, and flags line-level hotspots.
"""
import sys
import io
import time
import cProfile
import pstats
from typing import Dict, Any, List, Optional
from engine.hotspot import analyze_hotspots


def attribute_code_lines(
    code_snippet: str,
    total_emissions_g: float = 0.0,
    hotspot_threshold_pct: float = 15.0,
) -> Dict[str, Any]:
    """Execute code_snippet with line-level and function-level profiling.

    Attributes cumulative runtime, percentage share, and CO2 emissions
    to individual source lines and functions.
    """
    if not code_snippet or not code_snippet.strip():
        return {
            "status": "ok",
            "line_stats": [],
            "function_hotspots": [],
            "stdout": "",
            "stderr": "",
        }

    source_lines = code_snippet.splitlines()
    target_filename = "<target_script>"

    try:
        compiled_code = compile(code_snippet, target_filename, "exec")
    except SyntaxError as e:
        return {
            "status": "error",
            "line_stats": [],
            "function_hotspots": [],
            "stdout": "",
            "stderr": f"SyntaxError at line {e.lineno}: {str(e)}",
        }
    except Exception as e:
        return {
            "status": "error",
            "line_stats": [],
            "function_hotspots": [],
            "stdout": "",
            "stderr": f"Compilation error: {str(e)}",
        }

    line_hits: Dict[int, int] = {}
    line_times: Dict[int, float] = {}
    last_time = time.perf_counter()
    last_line: Optional[int] = None
    last_filename: Optional[str] = None

    def line_tracer(frame, event, arg):
        nonlocal last_time, last_line, last_filename
        now = time.perf_counter()
        # Attribute elapsed delta to the preceding active line
        if last_line is not None and last_filename == target_filename:
            dt = max(0.0, now - last_time)
            line_times[last_line] = line_times.get(last_line, 0.0) + dt

        if event == "line" and frame.f_code.co_filename == target_filename:
            lno = frame.f_lineno
            line_hits[lno] = line_hits.get(lno, 0) + 1
            last_line = lno
            last_filename = target_filename
            last_time = now

        return line_tracer

    # Capture stdout and stderr
    old_stdout = sys.stdout
    old_stderr = sys.stderr
    buf_stdout = io.StringIO()
    buf_stderr = io.StringIO()
    sys.stdout = buf_stdout
    sys.stderr = buf_stderr

    # Combined cProfile for function stats
    profiler = cProfile.Profile()
    exec_globals = {
        "__name__": "__main__",
        "__file__": target_filename,
    }

    old_trace = sys.gettrace()
    error_msg = ""
    status = "ok"

    try:
        sys.settrace(line_tracer)
        last_time = time.perf_counter()
        profiler.enable()
        exec(compiled_code, exec_globals)
    except Exception as e:
        status = "error"
        error_msg = f"{type(e).__name__}: {str(e)}"
    finally:
        profiler.disable()
        sys.settrace(old_trace)
        captured_stdout = buf_stdout.getvalue()
        captured_stderr = buf_stderr.getvalue()
        sys.stdout = old_stdout
        sys.stderr = old_stderr

    if error_msg and not captured_stderr:
        captured_stderr = error_msg

    # 1. Process Line Stats
    total_line_time = sum(line_times.values())
    if total_line_time <= 0:
        total_line_time = 0.000001

    line_stats: List[Dict[str, Any]] = []
    for lno, hits in line_hits.items():
        t = line_times.get(lno, 0.0)
        share_pct = (t / total_line_time) * 100.0
        attributed_co2 = (share_pct / 100.0) * total_emissions_g
        content = source_lines[lno - 1] if 0 <= lno - 1 < len(source_lines) else ""

        line_stats.append({
            "lineno": lno,
            "content": content.strip(),
            "hits": hits,
            "time_s": round(t, 6),
            "share_pct": round(share_pct, 2),
            "attributed_co2_g": round(attributed_co2, 6),
            "is_hotspot": share_pct >= hotspot_threshold_pct,
        })

    # Sort descending by share percentage
    line_stats.sort(key=lambda x: x["share_pct"], reverse=True)

    # 2. Process Function Stats from cProfile
    stream = io.StringIO()
    ps = pstats.Stats(profiler, stream=stream).sort_stats("cumulative")
    func_stats = []
    for func_tuple, (cc, nc, tt, ct, callers) in ps.stats.items():
        filename, line, func_name = func_tuple
        if filename != target_filename or func_name in ("<module>", "exec"):
            continue
        func_stats.append({
            "function": func_name,
            "filename": "script.py",
            "lineno": line,
            "ncalls": nc,
            "cumtime": ct,
            "tottime": tt,
        })

    function_hotspots = analyze_hotspots(func_stats, total_emissions_g)

    return {
        "status": status,
        "line_stats": line_stats,
        "function_hotspots": function_hotspots,
        "stdout": captured_stdout,
        "stderr": captured_stderr,
    }
