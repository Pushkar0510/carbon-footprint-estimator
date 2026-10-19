"""AST-based & Structural Static Green Code Analyzer & Advisor.

Examines Python AST and multi-language source patterns (JavaScript, C, C++, Java, Go, Rust, etc.)
to detect inefficient code patterns and provide actionable sustainability recommendations.
"""
import ast
import re
from typing import List, Dict, Any, Optional

from engine.language_support import detect_language


class GreenCodeVisitor(ast.NodeVisitor):
    def __init__(self):
        self.recommendations: List[Dict[str, Any]] = []
        self.loop_depth = 0
        self.in_loop = False

    def visit_For(self, node: ast.For):
        self.loop_depth += 1
        prev_in_loop = self.in_loop
        self.in_loop = True

        # Check for nested loops O(n^2)+
        if self.loop_depth >= 2:
            self.recommendations.append({
                "line": node.lineno,
                "pattern": "High-Complexity Nested Loop",
                "severity": "HIGH" if self.loop_depth >= 3 else "MEDIUM",
                "recommendation": f"Nested loop detected (depth {self.loop_depth}). Consider algorithm refactoring or vectorization.",
                "reason": "Nested loops increase time complexity to O(n^2) or higher, causing exponential CPU overhead and carbon footprint."
            })

        # Check for unvectorized numerical loops using range()
        if isinstance(node.iter, ast.Call):
            if isinstance(node.iter.func, ast.Name) and node.iter.func.id == "range":
                for stmt in node.body:
                    if isinstance(stmt, ast.AugAssign) and isinstance(stmt.op, (ast.Add, ast.Mult, ast.Sub)):
                        self.recommendations.append({
                            "line": node.lineno,
                            "pattern": "Unvectorized Numerical Loop",
                            "severity": "MEDIUM",
                            "recommendation": "Consider replacing manual Python loop with NumPy / vectorized operations.",
                            "reason": "Python-level loop iterations incur high interpreter overhead compared to compiled C-vectorized operations."
                        })
                        break

        self.generic_visit(node)
        self.loop_depth -= 1
        self.in_loop = prev_in_loop

    def visit_While(self, node: ast.While):
        self.loop_depth += 1
        prev_in_loop = self.in_loop
        self.in_loop = True

        if self.loop_depth >= 2:
            self.recommendations.append({
                "line": node.lineno,
                "pattern": "High-Complexity Nested Loop",
                "severity": "MEDIUM",
                "recommendation": f"Nested loop detected (depth {self.loop_depth}). Consider optimizing condition evaluation or vectorizing.",
                "reason": "Nested loops multiply iteration counts, significantly extending runtime and energy usage."
            })

        self.generic_visit(node)
        self.loop_depth -= 1
        self.in_loop = prev_in_loop

    def visit_Call(self, node: ast.Call):
        if self.in_loop:
            func_name = ""
            if isinstance(node.func, ast.Name):
                func_name = node.func.id
            elif isinstance(node.func, ast.Attribute):
                func_name = node.func.attr

            if func_name in ("print", "open", "read", "write", "writelines"):
                self.recommendations.append({
                    "line": node.lineno,
                    "pattern": "I/O Operation inside Loop",
                    "severity": "HIGH" if func_name in ("open", "write") else "LOW",
                    "recommendation": f"Avoid repeated I/O operation '{func_name}' inside loop. Batch I/O operations outside loop.",
                    "reason": "Disk and terminal I/O inside loops introduce blocking latency and keep CPU idling in high power states."
                })

        self.generic_visit(node)


def _analyze_multi_language_patterns(code_snippet: str, language: str) -> List[Dict[str, Any]]:
    """Analyze source code of any language for green code anti-patterns."""
    lines = code_snippet.splitlines()
    recs: List[Dict[str, Any]] = []
    loop_depth = 0

    io_keywords = [
        "console.log", "printf", "cout", "System.out.println", "System.out.print",
        "fmt.Println", "fmt.Printf", "puts", "echo", "Write-Host", "FileWriter",
        "FileOutputStream", "fopen", "fwrite", "fprintf", "fs.writeFileSync",
    ]

    for idx, raw_line in enumerate(lines):
        lineno = idx + 1
        stripped = raw_line.strip()

        # Track braces / loops
        if re.search(r'\b(for|while|forEach|loop)\b', stripped):
            loop_depth += 1
            if loop_depth >= 2:
                recs.append({
                    "line": lineno,
                    "pattern": "High-Complexity Nested Loop",
                    "severity": "HIGH" if loop_depth >= 3 else "MEDIUM",
                    "recommendation": f"Nested loop detected (depth {loop_depth}) in {language.capitalize()}. Consider optimizing loop invariants or algorithm complexity.",
                    "reason": "Nested loops lead to polynomial or exponential CPU cycles, substantially elevating energy consumption and carbon emissions."
                })
        elif "}" in stripped:
            loop_depth = max(0, loop_depth - stripped.count("}"))

        if loop_depth > 0:
            for io_kw in io_keywords:
                if io_kw in stripped:
                    recs.append({
                        "line": lineno,
                        "pattern": "I/O Operation inside Loop",
                        "severity": "HIGH" if any(w in io_kw.lower() for w in ("file", "write")) else "LOW",
                        "recommendation": f"Repeated I/O statement '{io_kw}' inside loop. Buffer or batch operations outside the loop.",
                        "reason": "I/O operations block processor execution pipelines and cause CPU cores to remain energized in higher P-states."
                    })
                    break

    return recs


def analyze_code_ast(code_snippet: str, language: Optional[str] = None) -> List[Dict[str, Any]]:
    """Analyze source code string using AST visitor or structural analyzer across any language."""
    if not code_snippet.strip():
        return []

    detected_lang = detect_language(code=code_snippet, explicit_lang=language)

    # For Python, try AST visitor first
    if detected_lang == "python":
        try:
            tree = ast.parse(code_snippet)
            visitor = GreenCodeVisitor()
            visitor.visit(tree)

            seen = set()
            unique_recs = []
            for rec in visitor.recommendations:
                key = (rec["line"], rec["pattern"])
                if key not in seen:
                    seen.add(key)
                    unique_recs.append(rec)
            return unique_recs
        except SyntaxError:
            # Fall back to multi-language structural pattern analyzer
            pass

    # Multi-language structural pattern analysis
    recs = _analyze_multi_language_patterns(code_snippet, detected_lang)
    seen = set()
    unique = []
    for r in recs:
        key = (r["line"], r["pattern"])
        if key not in seen:
            seen.add(key)
            unique.append(r)
    return unique
