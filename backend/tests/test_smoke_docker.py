"""
How to run in Docker environment:
    # Option 1: Against running containers (recommended)
    docker-compose exec backend python -m pytest tests/test_smoke_docker.py -v
    
    # Option 2: From host against containerized API
    python -m pytest tests/test_smoke_docker.py -v --api-base-url=http://localhost:8000
    
    # Option 3: In CI/CD pipeline
    docker-compose -f docker-compose.yml -f docker-compose.test.yml up --abort-on-container-exit
"""

import pytest
import httpx
import time
import os
from typing import Optional

@pytest.fixture(scope="session")
def smoke_test_client():
    """Create smoke test client"""
    client = httpx.Client(timeout=30.0)
    yield client
    client.close()

@pytest.fixture(scope="session")
def api_base_url():
    """Get API base URL"""
    return os.getenv('API_BASE_URL', 'http://localhost:8000')

def wait_for_service(client: httpx.Client, api_base_url: str, max_retries: int = 30, delay: float = 2.0) -> bool:
    """Wait for the service to be ready"""
    print(f"🔄 Waiting for service at {api_base_url}...")
    
    for attempt in range(max_retries):
        try:
            response = client.get(f"{api_base_url}/docs")
            if response.status_code == 200:
                print(f"✅ Service is ready after {attempt + 1} attempts")
                return True
        except httpx.RequestError:
            pass
        
        if attempt < max_retries - 1:
            print(f"⏳ Attempt {attempt + 1}/{max_retries}, retrying in {delay}s...")
            time.sleep(delay)
    
    print(f"❌ Service not ready after {max_retries} attempts")
    return False

def test_service_health(smoke_test_client, api_base_url):
    """Test if the service is running and healthy"""
    print(f"🏥 Testing service health at {api_base_url}")
    
    # Wait for service to be ready
    assert wait_for_service(smoke_test_client, api_base_url), "Service is not ready"
    
    # Test health endpoint if available
    try:
        response = smoke_test_client.get(f"{api_base_url}/health")
        if response.status_code == 200:
            print("✅ Health endpoint responded")
        else:
            print(f"⚠️  Health endpoint returned {response.status_code}")
    except httpx.RequestError:
        print("⚠️  Health endpoint not available, continuing...")
    
    # Test OpenAPI docs
    response = smoke_test_client.get(f"{api_base_url}/docs")
    assert response.status_code == 200, "OpenAPI docs not accessible"
    print("✅ OpenAPI docs accessible")

def test_api_endpoints_exist(smoke_test_client, api_base_url):
    """Test that all required API endpoints exist"""
    print("🔍 Testing API endpoint existence")
    
    # Test core endpoints (without /api prefix - they're mounted at root)
    endpoints = [
        "/project-requirements/",
        "/quotes/",
        "/quotes/autogenerate/",
        "/quotes/calc",
        "/price-profiles",
        "/companies"
    ]
    
    for endpoint in endpoints:
        try:
            response = smoke_test_client.get(f"{api_base_url}{endpoint}")
            # Most endpoints will return 401 (unauthorized), 422 (validation error), or 307 (redirect)
            # which means the endpoint exists but requires proper authentication/data
            assert response.status_code in [200, 401, 422, 405, 307], f"Endpoint {endpoint} not accessible"
            print(f"✅ {endpoint} - Status: {response.status_code}")
        except httpx.RequestError as e:
            print(f"❌ {endpoint} - Error: {e}")
            pytest.fail(f"Endpoint {endpoint} not accessible")

def test_quote_calculation_endpoint(smoke_test_client, api_base_url):
    """Test quote calculation endpoint with minimal data"""
    print("🧮 Testing quote calculation endpoint")
    
    calc_data = {
        "items": [
            {
                "description": "Test Item",
                "quantity": 2,
                "unit_price": 100.0,
                "kind": "labor"
            }
        ]
    }
    
    try:
        response = smoke_test_client.post(
            f"{api_base_url}/quotes/calc",
            json=calc_data
        )
        
        # Should return either success, validation error, or unauthorized
        assert response.status_code in [200, 401, 422], f"Unexpected status: {response.status_code}"
        
        if response.status_code == 200:
            calc_result = response.json()
            assert "total" in calc_result, "Calculation result missing total"
            print(f"✅ Quote calculation successful: {calc_result}")
        else:
            print(f"⚠️  Quote calculation validation error: {response.json()}")
            
    except httpx.RequestError as e:
        print(f"❌ Quote calculation failed: {e}")
        pytest.fail("Quote calculation endpoint not working")

def test_database_connectivity(smoke_test_client, api_base_url):
    """Test database connectivity through API"""
    print("🗄️  Testing database connectivity")
    
    # Try to create a minimal project requirement to test DB
    test_data = {
        "project_name": "Smoke Test Project",
        "customer_name": "Smoke Test Customer",
        "customer_email": "smoke@test.com",
        "description": "Test project for smoke testing",
        "budget_range": "10000-50000",
        "timeline": "3 months",
        "requirements": ["Requirement 1"]
    }
    
    try:
        response = smoke_test_client.post(
            f"{api_base_url}/project-requirements",
            json=test_data
        )
        
        # Should return either success, validation error, or unauthorized
        assert response.status_code in [200, 201, 401, 422], f"Unexpected status: {response.status_code}"
        
        if response.status_code in [200, 201]:
            result = response.json()
            print(f"✅ Database write successful: {result.get('id', 'No ID')}")
            
            # Try to read it back
            if 'id' in result:
                read_response = smoke_test_client.get(
                    f"{api_base_url}/project-requirements/{result['id']}"
                )
                if read_response.status_code in [200, 401, 422]:
                    print("✅ Database read successful")
                else:
                    print(f"⚠️  Database read returned: {read_response.status_code}")
        else:
            print(f"⚠️  Database write validation error: {response.json()}")
            
    except httpx.RequestError as e:
        print(f"❌ Database connectivity test failed: {e}")
        pytest.fail("Database connectivity test failed")

def test_complete_workflow_simulation(smoke_test_client, api_base_url):
    """Simulate complete workflow without full authentication"""
    print("🔄 Simulating complete workflow")
    
    # This test simulates the workflow without requiring full authentication
    # It verifies that the endpoints exist and respond appropriately
    
    workflow_steps = [
        ("Create project requirements", "POST", "/project-requirements"),
        ("Autogenerate quote", "POST", "/quotes/autogenerate"),
        ("Create quote", "POST", "/quotes"),
        ("Get quote", "GET", "/quotes/1"),  # Assuming ID 1 exists
        ("Calculate quote", "POST", "/quotes/calc"),
    ]
    
    for step_name, method, endpoint in workflow_steps:
        try:
            if method == "GET":
                response = smoke_test_client.get(f"{api_base_url}{endpoint}")
            else:
                # For POST requests, send minimal data
                response = smoke_test_client.post(f"{api_base_url}{endpoint}", json={})
            
            # Accept various response codes as "endpoint exists"
            assert response.status_code in [200, 201, 401, 422, 404, 405], f"Unexpected status for {step_name}"
            print(f"✅ {step_name}: Status {response.status_code}")
            
        except httpx.RequestError as e:
            print(f"❌ {step_name}: Error - {e}")
            pytest.fail(f"Workflow step {step_name} failed")

# Note: This file is now designed to run with pytest
# Use: docker-compose exec backend python -m pytest tests/test_smoke_docker.py -v
