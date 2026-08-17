"""Unit tests for Python profiling & estimation engine."""
import unittest
from engine.energy import calculate_energy_kwh, calculate_cpu_power, calculate_ram_power
from engine.carbon import get_grid_intensity, calculate_emissions
from engine.hotspot import analyze_hotspots
from engine.advisor import analyze_code_ast
from engine.ml_predictor import predict_emissions, extract_features


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

    def test_ml_predictor(self):
        code = "for i in range(1000):\n    for j in range(1000):\n        s = i * j"
        pred = predict_emissions(code, expected_input_size=1000, grid_intensity_g_per_kwh=790.0)
        self.assertIn("predicted_time_s", pred)
        self.assertIn("predicted_emissions_g_co2", pred)
        self.assertEqual(pred["complexity_class"], "O(N^2)")


if __name__ == "__main__":
    unittest.main()
