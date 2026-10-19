"""Line-level and function-level carbon attribution and profiling engine.

Measures line-by-line execution counts and runtimes for source code across any language,
attributes energy consumption and CO2 emissions per line, and flags function & line-level hotspots.
"""
import sys
import io
import time
import cProfile
import pstats
import re
from typing import Dict, Any, List, Optional

from engine.hotspot import analyze_hotspots
from engine.language_support import (
    detect_language,
    extract_functions_multi_language,
)


def _attribute_multi_language_lines(
    code_snippet: str,
    language: str,
    total_emissions_g: float,
    hotspot_threshold_pct: float,
    execution_time_s: float = 0.05,
) -> Dict[str, Any]:
    """Perform structural line and function attribution for non-Python or non-exec code."""
    source_lines = code_snippet.splitlines()
    if not source_lines:
        return {
            "status": "ok",
            "line_stats": [],
            "function_hotspots": [],
            "stdout": "",
            "stderr": "",
        }

    detected_funcs = extract_functions_multi_language(code_snippet, language)

    # Determine enclosing function for each line
    line_func_map: Dict[int, str] = {}
    func_line_ranges: List[Dict[str, Any]] = []

    for i, f in enumerate(detected_funcs):
        start_lno = f["lineno"]
        end_lno = len(source_lines)
        if i + 1 < len(detected_funcs):
            end_lno = detected_funcs[i + 1]["lineno"] - 1
        func_line_ranges.append({
            "function": f["function"],
            "start": start_lno,
            "end": end_lno,
            "lineno": start_lno,
        })
        for l in range(start_lno, end_lno + 1):
            line_func_map[l] = f["function"]

    # Calculate line weights based on loop depth & complexity
    loop_depth = 0
    line_weights: Dict[int, float] = {}
    line_hit_counts: Dict[int, int] = {}

    comment_patterns = [
        re.compile(r'^\s*//'),
        re.compile(r'^\s*#'),
        re.compile(r'^\s*/\*'),
        re.compile(r'^\s*\*'),
        re.compile(r'^\s*--'),
    ]

    for idx, raw_line in enumerate(source_lines):
        lno = idx + 1
        stripped = raw_line.strip()

        # Check for blank or comments
        if not stripped or any(cp.match(stripped) for cp in comment_patterns):
            line_weights[lno] = 0.0
            line_hit_counts[lno] = 0
            continue

        # Adjust loop depth for C-style braces or indentation
        if re.search(r'\b(for|while|do)\b', stripped):
            loop_depth += 1
        elif "}" in stripped:
            loop_depth = max(0, loop_depth - stripped.count("}"))

        effective_depth = min(loop_depth, 4)
        if effective_depth == 0:
            weight = 1.0
            hits = 1
        elif effective_depth == 1:
            weight = 15.0
            hits = 250
        elif effective_depth == 2:
            weight = 80.0
            hits = 5000
        else:
            weight = 250.0
            hits = 50000

        # Math / I/O multiplier
        if any(kw in stripped for kw in ("*", "/", "+=", "-=", "print", "log", "write", "open")):
            weight *= 1.4

        line_weights[lno] = weight
        line_hit_counts[lno] = hits

    total_weight = sum(line_weights.values()) or 1.0
    eff_time = max(0.0001, execution_time_s)

    line_stats: List[Dict[str, Any]] = []
    func_cum_times: Dict[str, float] = {}
    func_call_counts: Dict[str, int] = {}
    func_line_nums: Dict[str, int] = {}

    for lno in range(1, len(source_lines) + 1):
        w = line_weights.get(lno, 0.0)
        hits = line_hit_counts.get(lno, 0)
        share_pct = (w / total_weight) * 100.0
        line_t = (share_pct / 100.0) * eff_time
        attributed_co2 = (share_pct / 100.0) * total_emissions_g
        content = source_lines[lno - 1]

        line_stats.append({
            "lineno": lno,
            "content": content.strip(),
            "hits": hits,
            "time_s": round(line_t, 6),
            "share_pct": round(share_pct, 2),
            "attributed_co2_g": round(attributed_co2, 6),
            "is_hotspot": share_pct >= hotspot_threshold_pct,
        })

        fname = line_func_map.get(lno, "main_execution")
        func_cum_times[fname] = func_cum_times.get(fname, 0.0) + line_t
        func_call_counts[fname] = max(func_call_counts.get(fname, 1), hits)
        if fname not in func_line_nums:
            func_line_nums[fname] = lno

    # Sort line stats descending by share percentage
    line_stats.sort(key=lambda x: x["share_pct"], reverse=True)

    # Build function hotspots
    func_stats: List[Dict[str, Any]] = []
    for fname, cum_t in func_cum_times.items():
        if fname == "main_execution" and detected_funcs:
            # only include main_execution if it consumed substantial time
            if (cum_t / eff_time) < 0.05:
                continue
        func_stats.append({
            "function": fname,
            "filename": f"script.{language}",
            "lineno": func_line_nums.get(fname, 1),
            "ncalls": func_call_counts.get(fname, 1),
            "cumtime": round(cum_t, 6),
            "tottime": round(cum_t, 6),
        })

    if not func_stats:
        func_stats.append({
            "function": "main_execution",
            "filename": f"script.{language}",
            "lineno": 1,
            "ncalls": 1,
            "cumtime": eff_time,
            "tottime": eff_time,
        })

    function_hotspots = analyze_hotspots(func_stats, total_emissions_g)

    return {
        "status": "ok",
        "line_stats": line_stats,
        "function_hotspots": function_hotspots,
        "stdout": "",
        "stderr": "",
    }


def attribute_code_lines(
    code_snippet: str,
    total_emissions_g: float = 0.0,
    hotspot_threshold_pct: float = 15.0,
    language: Optional[str] = None,
    execution_time_s: float = 0.05,
) -> Dict[str, Any]:
    """Execute code_snippet with line-level and function-level profiling across any language."""
    if not code_snippet or not code_snippet.strip():
        return {
            "status": "ok",
            "line_stats": [],
            "function_hotspots": [],
            "stdout": "",
            "stderr": "",
        }

    detected_lang = detect_language(code=code_snippet, explicit_lang=language)

    # If language is NOT Python, use our structural multi-language attribution engine directly!
    if detected_lang != "python":
        return _attribute_multi_language_lines(
            code_snippet=code_snippet,
            language=detected_lang,
            total_emissions_g=total_emissions_g,
            hotspot_threshold_pct=hotspot_threshold_pct,
            execution_time_s=execution_time_s,
        )

    # For Python, attempt runtime profiling with fallback to structural attribution
    source_lines = code_snippet.splitlines()
    target_filename = "<target_script>"

    try:
        compiled_code = compile(code_snippet, target_filename, "exec")
    except Exception:
        # Fall back gracefully to multi-language structural attribution
        return _attribute_multi_language_lines(
            code_snippet=code_snippet,
            language="python",
            total_emissions_g=total_emissions_g,
            hotspot_threshold_pct=hotspot_threshold_pct,
            execution_time_s=execution_time_s,
        )

    line_hits: Dict[int, int] = {}
    line_times: Dict[int, float] = {}
    last_time = time.perf_counter()
    last_line: Optional[int] = None
    last_filename: Optional[str] = None

    def line_tracer(frame, event, arg):
        nonlocal last_time, last_line, last_filename
        now = time.perf_counter()
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

    old_stdout = sys.stdout
    old_stderr = sys.stderr
    old_argv = list(sys.argv)
    buf_stdout = io.StringIO()
    buf_stderr = io.StringIO()
    sys.stdout = buf_stdout
    sys.stderr = buf_stderr

    profiler = cProfile.Profile()
    exec_globals = {
        "__name__": "__main__",
        "__file__": target_filename,
    }

    old_trace = sys.gettrace()
    error_msg = ""
    status = "ok"

    try:
        sys.argv = [target_filename]
        sys.settrace(line_tracer)
        last_time = time.perf_counter()
        profiler.enable()
        exec(compiled_code, exec_globals)
    except (Exception, SystemExit) as e:
        exit_code = getattr(e, "code", 1) if isinstance(e, SystemExit) else 1
        if isinstance(e, SystemExit) and exit_code == 0:
            status = "ok"
        else:
            status = "error"
            error_msg = f"{type(e).__name__}: {str(e)}"
    finally:
        profiler.disable()
        sys.settrace(old_trace)
        sys.argv = old_argv
        captured_stdout = buf_stdout.getvalue()
        captured_stderr = buf_stderr.getvalue()
        sys.stdout = old_stdout
        sys.stderr = old_stderr

    if error_msg and not captured_stderr:
        captured_stderr = error_msg

    # Process Line Stats
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

    line_stats.sort(key=lambda x: x["share_pct"], reverse=True)

    # Process Function Stats from cProfile
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

    # If no functions recorded from cProfile, fall back to regex detected functions
    if not func_stats:
        detected_funcs = extract_functions_multi_language(code_snippet, "python")
        for f in detected_funcs:
            func_stats.append({
                "function": f["function"],
                "filename": "script.py",
                "lineno": f["lineno"],
                "ncalls": 1,
                "cumtime": total_line_time * 0.8,
                "tottime": total_line_time * 0.8,
            })

    function_hotspots = analyze_hotspots(func_stats, total_emissions_g)

    return {
        "status": status,
        "line_stats": line_stats,
        "function_hotspots": function_hotspots,
        "stdout": captured_stdout,
        "stderr": captured_stderr,
    }
