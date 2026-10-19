"""Multi-language detection, syntax extraction, and runtime dispatch support."""
import os
import re
from typing import Dict, Any, List, Optional, Tuple

# Mapping of file extensions to canonical language identifiers
EXTENSION_MAP: Dict[str, str] = {
    ".py": "python",
    ".pyw": "python",
    ".ipynb": "python",
    ".js": "javascript",
    ".mjs": "javascript",
    ".cjs": "javascript",
    ".jsx": "javascript",
    ".ts": "typescript",
    ".tsx": "typescript",
    ".c": "c",
    ".h": "c",
    ".cpp": "cpp",
    ".cc": "cpp",
    ".cxx": "cpp",
    ".hpp": "cpp",
    ".hxx": "cpp",
    ".java": "java",
    ".go": "go",
    ".rs": "rust",
    ".sh": "bash",
    ".bash": "bash",
    ".zsh": "bash",
    ".ps1": "powershell",
    ".php": "php",
    ".rb": "ruby",
    ".r": "r",
    ".kt": "kotlin",
    ".kts": "kotlin",
    ".swift": "swift",
    ".cs": "csharp",
    ".scala": "scala",
    ".pl": "perl",
    ".lua": "lua",
    ".sql": "sql",
    ".html": "html",
    ".css": "css",
}

LANGUAGE_DISPLAY_NAMES: Dict[str, str] = {
    "python": "Python",
    "javascript": "JavaScript (Node.js)",
    "typescript": "TypeScript",
    "c": "C",
    "cpp": "C++",
    "java": "Java",
    "go": "Go",
    "rust": "Rust",
    "bash": "Bash / Shell",
    "powershell": "PowerShell",
    "php": "PHP",
    "ruby": "Ruby",
    "r": "R",
    "csharp": "C#",
    "kotlin": "Kotlin",
    "swift": "Swift",
    "scala": "Scala",
    "perl": "Perl",
    "lua": "Lua",
    "sql": "SQL",
    "generic": "Generic Code",
}

DEFAULT_EXTENSIONS: Dict[str, str] = {
    "python": ".py",
    "javascript": ".js",
    "typescript": ".ts",
    "c": ".c",
    "cpp": ".cpp",
    "java": ".java",
    "go": ".go",
    "rust": ".rs",
    "bash": ".sh",
    "powershell": ".ps1",
    "php": ".php",
    "ruby": ".rb",
    "r": ".r",
    "csharp": ".cs",
    "kotlin": ".kt",
    "swift": ".swift",
    "scala": ".scala",
    "generic": ".txt",
}


def detect_language(code: str = "", filename: str = "", explicit_lang: Optional[str] = None) -> str:
    """Detect programming language from explicit preference, filename extension, or code heuristics."""
    if explicit_lang and explicit_lang.lower() not in ("auto", "auto-detect", "", "all"):
        canon = explicit_lang.lower().strip()
        if canon in LANGUAGE_DISPLAY_NAMES:
            return canon
        if canon in ("node", "nodejs", "js"):
            return "javascript"
        if canon in ("ts",):
            return "typescript"
        if canon in ("shell", "sh"):
            return "bash"

    if filename:
        _, ext = os.path.splitext(filename.lower())
        if ext in EXTENSION_MAP:
            return EXTENSION_MAP[ext]

    if not code:
        return "python"

    # Shebang inspection
    first_line = code.splitlines()[0] if code.splitlines() else ""
    if first_line.startswith("#!"):
        lower_shebang = first_line.lower()
        if "node" in lower_shebang:
            return "javascript"
        if "python" in lower_shebang:
            return "python"
        if "bash" in lower_shebang or "sh" in lower_shebang:
            return "bash"
        if "php" in lower_shebang:
            return "php"
        if "ruby" in lower_shebang:
            return "ruby"

    # Syntax heuristics
    code_sample = code[:2000]

    # C / C++
    if re.search(r'#include\s*<[a-zA-Z0-9_.]+>', code_sample):
        if any(w in code_sample for w in ("std::", "cout", "cin", "class ", "iostream", "vector", "string", "namespace", "template")):
            return "cpp"
        return "c"

    # Java
    if re.search(r'\bpublic\s+class\s+[A-Za-z0-9_]+', code_sample) or "System.out.println" in code_sample:
        return "java"

    # Go
    if re.search(r'\bpackage\s+[a-zA-Z0-9_]+', code_sample) and ("func " in code_sample or "import (" in code_sample):
        return "go"

    # Rust
    if re.search(r'\bfn\s+main\s*\(\s*\)', code_sample) or "println!" in code_sample or "let mut " in code_sample:
        return "rust"

    # PHP
    if "<?php" in code_sample:
        return "php"

    # JavaScript / TypeScript
    if (
        "console.log" in code_sample
        or re.search(r'\b(const|let|var)\s+[a-zA-Z0-9_]+\s*=', code_sample)
        or re.search(r'\bfunction\s+[a-zA-Z0-9_]+\s*\(', code_sample)
        or "=>" in code_sample
        or "document." in code_sample
        or "require(" in code_sample
    ):
        return "javascript"

    # Python
    if (
        re.search(r'^\s*def\s+[a-zA-Z0-9_]+\s*\(', code, re.MULTILINE)
        or "import " in code_sample
        or "print(" in code_sample
        or "elif " in code_sample
        or "__name__" in code_sample
    ):
        return "python"

    # PowerShell
    if "Write-Host" in code_sample or "$PSScriptRoot" in code_sample or "Get-Process" in code_sample:
        return "powershell"

    # Shell
    if "echo " in code_sample and ("done" in code_sample or "fi" in code_sample or "then" in code_sample):
        return "bash"

    # Default to Python if indentation-based or generic
    return "python"


def get_default_extension(language: str) -> str:
    """Return default file extension for a language."""
    return DEFAULT_EXTENSIONS.get(language, ".txt")


def get_language_name(language: str) -> str:
    """Return human-readable display name for language."""
    return LANGUAGE_DISPLAY_NAMES.get(language, language.capitalize())


def extract_functions_multi_language(code: str, language: str) -> List[Dict[str, Any]]:
    """Extract function definitions, line numbers, and names across any language."""
    lines = code.splitlines()
    funcs: List[Dict[str, Any]] = []

    # Patterns by language family
    if language == "python":
        pattern = re.compile(r'^\s*def\s+([a-zA-Z0-9_]+)\s*\(')
    elif language in ("javascript", "typescript"):
        pattern = re.compile(
            r'^\s*(?:async\s+)?function\s+([a-zA-Z0-9_]+)\s*\(|'
            r'^\s*(?:const|let|var)\s+([a-zA-Z0-9_]+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>|'
            r'^\s*([a-zA-Z0-9_]+)\s*\([^)]*\)\s*\{'
        )
    elif language in ("c", "cpp", "csharp", "java"):
        # Match e.g. int foo(...) {, void run(...) {, public static void main(...) {
        pattern = re.compile(
            r'^\s*(?:[A-Za-z0-9_<>*&]+\s+)+([a-zA-Z0-9_]+)\s*\([^;]*\)\s*(?:const)?\s*\{'
        )
    elif language == "go":
        pattern = re.compile(r'^\s*func\s+(?:\([^)]*\)\s*)?([a-zA-Z0-9_]+)\s*\(')
    elif language == "rust":
        pattern = re.compile(r'^\s*(?:pub\s+)?(?:async\s+)?fn\s+([a-zA-Z0-9_]+)\s*\(')
    elif language in ("ruby", "php"):
        pattern = re.compile(r'^\s*(?:def|function)\s+([a-zA-Z0-9_]+)\s*[\(\{]?')
    elif language in ("bash", "powershell"):
        pattern = re.compile(r'^\s*(?:function\s+)?([a-zA-Z0-9_]+)\s*\(\s*\)\s*\{|^\s*function\s+([a-zA-Z0-9_]+)\s*\{')
    else:
        # Generic function heuristic
        pattern = re.compile(r'^\s*(?:function\s+|def\s+|fn\s+)?([a-zA-Z0-9_]+)\s*\([^)]*\)\s*\{?')

    for idx, line in enumerate(lines):
        m = pattern.search(line)
        if m:
            # find first non-empty group
            fname = next((g for g in m.groups() if g), None)
            if fname and fname not in ("if", "for", "while", "switch", "catch"):
                funcs.append({
                    "function": fname,
                    "lineno": idx + 1,
                    "line_content": line.strip(),
                })

    return funcs
