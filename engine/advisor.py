"""AST-based Static Green Code Analyzer & Advisor.

Examines Python source code AST to detect inefficient code patterns
and provide actionable sustainability and optimization recommendations.
"""
import ast
from typing import List, Dict, Any


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
                # Inspect loop body for manual numerical accumulation or element operations
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
        # Check for I/O calls inside loops
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


def analyze_code_ast(code_snippet: str) -> List[Dict[str, Any]]:
    """Analyze Python code string using AST visitor and return green code recommendations."""
    if not code_snippet.strip():
        return []

    try:
        tree = ast.parse(code_snippet)
    except SyntaxError as e:
        return [{
            "line": e.lineno or 1,
            "pattern": "Syntax Error",
            "severity": "HIGH",
            "recommendation": "Fix code syntax error before static analysis.",
            "reason": str(e)
        }]

    visitor = GreenCodeVisitor()
    visitor.visit(tree)

    # Deduplicate recommendations by (line, pattern)
    seen = set()
    unique_recs = []
    for rec in visitor.recommendations:
        key = (rec["line"], rec["pattern"])
        if key not in seen:
            seen.add(key)
            unique_recs.append(rec)

    return unique_recs
