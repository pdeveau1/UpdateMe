# conftest.py
import pytest
from fastapi.testclient import TestClient

from main import app  # Assuming your FastAPI app is defined in main.py

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c
