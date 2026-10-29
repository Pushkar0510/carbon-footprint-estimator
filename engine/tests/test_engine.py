"""Unit tests for multi-language profiling & estimation engine."""
import unittest
from engine.energy import calculate_energy_kwh, calculate_cpu_power, calculate_ram_power
from engine.carbon import get_grid_intensity, calculate_emissions
from engine.hotspot import analyze_hotspots
from engine.advisor import analyze_code_ast
from engine.ml_predictor import predict_emissions, extract_features
from engine.line_attribution import attribute_code_lines
from engine.language_support import detect_language, extract_functions_multi_language
from engine.llm_predictor import predict_emissions_llm


class TestEngine(unittest.TestCase):
    def test_energy_calculations(self):
        res = calculate_energy_kwh(execution_time_s=10.0, cpu_percent=80.0, memory_bytes=1024**3)
        self.assertEqual(res["execution_time_s"], 10.0)
        self.assertGreater(res["total_power_watts"], 0)
        self.assertGreater(res["energy_kwh"], 0)
        self.assertGreater(res["energy_wh"], 0)

    def test_carbon_calculations(self):
        intensity = get_grid_intensity("Maharashtra")
        self.assertEqual(intensity, 790.0)

        res = calculate_emissions(energy_kwh=0.001, grid_intensity_g_per_kwh=790.0)
        self.assertEqual(res["emissions_g_co2"], 0.79)
        self.assertEqual(res["emissions_mg_co2"], 790.0)

    def test_hotspot_analysis(self):
        stats = [
            {"function": "heavy_func", "cumtime": 8.0, "ncalls": 1, "filename": "app.py", "lineno": 10},
            {"function": "light_func", "cumtime": 2.0, "ncalls": 5, "filename": "app.py", "lineno": 20},
        ]
        hotspots = analyze_hotspots(stats, total_emissions_g=1.0)
        self.assertEqual(len(hotspots), 2)
        self.assertEqual(hotspots[0]["function"], "heavy_func")
        self.assertEqual(hotspots[0]["contribution_pct"], 80.0)
        self.assertEqual(hotspots[0]["attributed_co2_g"], 0.8)
        self.assertTrue(hotspots[0]["is_hotspot"])

    def test_ast_advisor_unvectorized_loop(self):
        code = """
def sum_numbers():
    total = 0
    for i in range(1000):
        total += i
    return total
"""
        recs = analyze_code_ast(code)
        self.assertGreaterEqual(len(recs), 1)
        patterns = [r["pattern"] for r in recs]
        self.assertIn("Unvectorized Numerical Loop", patterns)

    def test_ast_advisor_nested_loop(self):
        code = """
def matrix_mult():
    for i in range(100):
        for j in range(100):
            pass
"""
        recs = analyze_code_ast(code)
        patterns = [r["pattern"] for r in recs]
        self.assertIn("High-Complexity Nested Loop", patterns)

    def test_multi_language_advisor_javascript(self):
        js_code = """function compute() {
    for (let i = 0; i < 50; i++) {
        for (let j = 0; j < 50; j++) {
            console.log(i * j);
        }
    }
}"""
        recs = analyze_code_ast(js_code, language="javascript")
        self.assertGreaterEqual(len(recs), 1)
        patterns = [r["pattern"] for r in recs]
        self.assertIn("High-Complexity Nested Loop", patterns)

    def test_language_detection(self):
        self.assertEqual(detect_language(filename="worker.js"), "javascript")
        self.assertEqual(detect_language(filename="main.cpp"), "cpp")
        self.assertEqual(detect_language(filename="App.java"), "java")
        self.assertEqual(detect_language(filename="service.go"), "go")
        self.assertEqual(detect_language(filename="algo.rs"), "rust")
        self.assertEqual(detect_language(filename="script.py"), "python")
        self.assertEqual(detect_language(code="console.log('hi');"), "javascript")
        self.assertEqual(detect_language(code="public class Main { public static void main(String[] args) {} }"), "java")
        self.assertEqual(detect_language(code="#include <iostream>\nint main() { return 0; }"), "cpp")

    def test_multi_language_function_extraction(self):
        js_code = "function calculate() {}\nconst process = () => {};"
        funcs = extract_functions_multi_language(js_code, "javascript")
        func_names = [f["function"] for f in funcs]
        self.assertIn("calculate", func_names)

        cpp_code = "int processMatrix() {\n    return 0;\n}"
        cpp_funcs = extract_functions_multi_language(cpp_code, "cpp")
        self.assertIn("processMatrix", [f["function"] for f in cpp_funcs])

    def test_ml_predictor(self):
        code = "for i in range(1000):\n    for j in range(1000):\n        s = i * j"
        pred = predict_emissions(code, expected_input_size=1000, grid_intensity_g_per_kwh=790.0)
        self.assertIn("predicted_time_s", pred)
        self.assertIn("predicted_emissions_g_co2", pred)
        self.assertEqual(pred["complexity_class"], "O(N^2)")

    def test_llm_predictor(self):
        code = "for i in range(500):\n    for j in range(500):\n        pass"
        res = predict_emissions_llm(code, expected_input_size=500, grid_intensity_g_per_kwh=790.0)
        self.assertIn("predicted_emissions_g_co2", res)
        self.assertIn("complexity_class", res)
        self.assertIn("analysis", res)
        self.assertIn("optimized_code", res)
        self.assertIn("potential_savings_pct", res)
        self.assertIn("provider", res)


    def test_line_attribution(self):
        code = """total = 0
for i in range(500):
    total += i
"""
        res = attribute_code_lines(code, total_emissions_g=1.0)
        self.assertEqual(res["status"], "ok")
        self.assertGreaterEqual(len(res["line_stats"]), 3)
        top_line = res["line_stats"][0]
        self.assertIn(top_line["lineno"], [2, 3])
        self.assertGreater(top_line["hits"], 100)
        self.assertGreater(top_line["share_pct"], 20.0)
        self.assertGreater(top_line["attributed_co2_g"], 0.0)

    def test_line_attribution_javascript(self):
        js_code = """function sum() {
    let s = 0;
    for (let i = 0; i < 200; i++) {
        s += i;
    }
    return s;
}"""
        res = attribute_code_lines(js_code, total_emissions_g=0.8, language="javascript")
        self.assertEqual(res["status"], "ok")
        self.assertGreaterEqual(len(res["line_stats"]), 4)
        self.assertGreaterEqual(len(res["function_hotspots"]), 1)
        self.assertEqual(res["function_hotspots"][0]["function"], "sum")

    def test_line_attribution_handles_system_exit(self):
        code = """import sys
sys.exit(0)
"""
        res = attribute_code_lines(code, total_emissions_g=0.5)
        self.assertEqual(res["status"], "ok")


if __name__ == "__main__":
    unittest.main()
