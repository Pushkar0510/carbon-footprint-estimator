"""FastAPI backend integration and endpoint tests across multiple languages."""
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
        data = response.json()
        self.assertEqual(data["status"], "ok")
        self.assertIn("mongo_connected", data)


    def test_profile_run_endpoint_python(self):
        code = "total = 0\nfor i in range(500):\n    total += i"
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
        self.assertIn("line_stats", data)
        self.assertGreaterEqual(len(data["line_stats"]), 2)

    def test_profile_run_endpoint_javascript(self):
        js_code = "let total = 0;\nfor (let i = 0; i < 1000; i++) {\n    total += i * i;\n}\nconsole.log('JS total:', total);"
        response = self.client.post(
            "/api/profile/run",
            json={"scriptContent": js_code, "region": "Maharashtra", "language": "javascript"},
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "ok")
        self.assertEqual(data["language"], "javascript")
        self.assertIn("metrics", data)
        self.assertGreater(data["metrics"]["execution_time_s"], 0)
        self.assertGreaterEqual(len(data["line_stats"]), 2)

    def test_profile_file_endpoint(self):
        file_content = b"total = sum(i * 2 for i in range(1000))\nprint('Done', total)\n"
        response = self.client.post(
            "/api/profile/file",
            files={"file": ("workload.py", file_content, "text/x-python")},
            data={"region": "Karnataka", "projectId": "file_proj"},
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "ok")
        self.assertIn("metrics", data)
        self.assertEqual(data["metrics"]["grid_intensity_g_per_kwh"], 580.0)
        self.assertIn("line_stats", data)

    def test_profile_multi_mixed_languages(self):
        py_content = b"def py_task():\n    return sum(i for i in range(500))\npy_task()\n"
        js_content = b"function jsTask() {\n    let s = 0;\n    for(let i=0; i<500; i++) s += i;\n    return s;\n}\nconsole.log(jsTask());\n"
        cpp_content = b"#include <iostream>\nint main() {\n    long long s = 0;\n    for(int i=0; i<500; i++) s += i;\n    std::cout << s << std::endl;\n    return 0;\n}\n"

        files = [
            ("files", ("worker.py", py_content, "text/x-python")),
            ("files", ("process.js", js_content, "text/javascript")),
            ("files", ("fast.cpp", cpp_content, "text/x-c")),
        ]
        response = self.client.post(
            "/api/profile/multi",
            files=files,
            data={"region": "Maharashtra", "projectId": "multi_lang_proj"},
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "ok")
        self.assertEqual(data["totalFiles"], 3)
        self.assertEqual(data["successCount"], 3)
        self.assertGreater(data["totalEmissionsG"], 0)

        # Ensure all files succeeded without being skipped
        filenames = [f["filename"] for f in data["files"]]
        self.assertIn("worker.py", filenames)
        self.assertIn("process.js", filenames)
        self.assertIn("fast.cpp", filenames)
        for f in data["files"]:
            self.assertEqual(f["status"], "ok")
            self.assertGreaterEqual(len(f["hotspots"]), 1)
            self.assertGreaterEqual(len(f["line_stats"]), 1)

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

    def test_intelligence_recommend_javascript(self):
        js_nested = """function processMatrix() {
    for (let i = 0; i < 50; i++) {
        for (let j = 0; j < 50; j++) {
            console.log("val:", i * j);
        }
    }
}"""
        response = self.client.post(
            "/api/intelligence/recommend",
            json={"codeSnippet": js_nested, "language": "javascript"},
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertGreaterEqual(data["count"], 1)
        patterns = [r["pattern"] for r in data["recommendations"]]
        self.assertIn("High-Complexity Nested Loop", patterns)

    def test_predict_emission_endpoint(self):
        code = "for i in range(10000):\n    s = i * i"
        response = self.client.post("/api/predict/emission", json={"codeSnippet": code, "expectedInputSize": 10000})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("predicted_emissions_g_co2", data)
        self.assertIn("complexity_class", data)
        self.assertIn("analysis", data)
        self.assertIn("optimized_code", data)
        self.assertIn("potential_savings_pct", data)
        self.assertIn("provider", data)

    def test_auth_status_endpoint(self):
        response = self.client.get("/api/auth/status")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("mongodb_connected", data)
        self.assertIn("status", data)

    def test_auth_register_login_and_me(self):
        import uuid
        uname = f"user_{uuid.uuid4().hex[:8]}"
        email = f"{uname}@example.com"
        password = "GreenPassword456!"

        # Register
        reg_res = self.client.post(
            "/api/auth/register",
            json={"username": uname, "email": email, "password": password},
        )
        self.assertEqual(reg_res.status_code, 201)
        reg_data = reg_res.json()
        self.assertIn("access_token", reg_data)
        self.assertEqual(reg_data["username"], uname)
        token = reg_data["access_token"]


        # Duplicate register fails
        dup_res = self.client.post(
            "/api/auth/register",
            json={"username": uname, "email": email, "password": password},
        )
        self.assertEqual(dup_res.status_code, 400)

        # Login with correct password
        login_res = self.client.post(
            "/api/auth/login",
            json={"username": uname, "password": password},
        )
        self.assertEqual(login_res.status_code, 200)
        login_data = login_res.json()
        self.assertIn("access_token", login_data)

        # Login with invalid password
        bad_login = self.client.post(
            "/api/auth/login",
            json={"username": uname, "password": "WrongPassword"},
        )
        self.assertEqual(bad_login.status_code, 401)

        # GET /api/auth/me with Bearer token
        me_res = self.client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(me_res.status_code, 200)
        me_data = me_res.json()
        self.assertEqual(me_data["username"], uname)
        self.assertEqual(me_data["email"], email)

        # GET /api/auth/me without token -> 401
        unauth_res = self.client.get("/api/auth/me")
        self.assertEqual(unauth_res.status_code, 401)

        # Authenticated profile run
        auth_profile = self.client.post(
            "/api/profile/run",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "scriptContent": "total = sum(i for i in range(100))",
                "region": "Maharashtra",
                "projectId": uname,
            },
        )
        self.assertEqual(auth_profile.status_code, 200)
        prof_data = auth_profile.json()
        self.assertEqual(prof_data["status"], "ok")


if __name__ == "__main__":
    unittest.main()

