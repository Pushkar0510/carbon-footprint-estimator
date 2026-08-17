"""FastAPI backend integration and endpoint tests."""
import sys
import os

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

import unittest
from fastapi.testclient import TestClient
from backend.app.main import app


class TestBackendAPI(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_health_check(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok"})

    def test_profile_run_endpoint(self):
        code = "x = sum(range(10000))"
        response = self.client.post(
            "/api/profile/run",
            json={"scriptContent": code, "region": "Maharashtra", "projectId": "test_proj"},
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "ok")
        self.assertIn("metrics", data)
        self.assertEqual(data["metrics"]["grid_intensity_g_per_kwh"], 790.0)
        self.assertIn("emissions_g_co2", data["metrics"])

    def test_grid_states_endpoint(self):
        response = self.client.get("/api/grid/india/states")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("states", data)
        self.assertEqual(data["states"]["Maharashtra"], 790.0)
        self.assertEqual(data["states"]["Karnataka"], 580.0)

    def test_grid_live_endpoint(self):
        response = self.client.get("/api/grid/india/live?region=Karnataka")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["region"], "Karnataka")
        self.assertEqual(data["grid_intensity_g_per_kwh"], 580.0)

    def test_budget_endpoints(self):
        res_set = self.client.post("/api/budget/set", json={"projectId": "proj_a", "monthlyLimitGrams": 100.0})
        self.assertEqual(res_set.status_code, 200)
        set_data = res_set.json()
        self.assertEqual(set_data["monthlyLimitGrams"], 100.0)

        res_stat = self.client.get("/api/budget/status/proj_a")
        self.assertEqual(res_stat.status_code, 200)
        stat_data = res_stat.json()
        self.assertEqual(stat_data["projectId"], "proj_a")
        self.assertIn("status", stat_data)

    def test_intelligence_recommend_endpoint(self):
        code = "for i in range(100):\n    for j in range(100):\n        pass"
        response = self.client.post("/api/intelligence/recommend", json={"codeSnippet": code})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertGreaterEqual(data["count"], 1)
        self.assertEqual(data["recommendations"][0]["pattern"], "High-Complexity Nested Loop")

    def test_predict_emission_endpoint(self):
        code = "for i in range(10000):\n    s = i * i"
        response = self.client.post("/api/predict/emission", json={"codeSnippet": code, "expectedInputSize": 10000})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("predicted_emissions_g_co2", data)
        self.assertIn("complexity_class", data)


if __name__ == "__main__":
    unittest.main()
