from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_comparison():
    response = client.get("/api/v1/comparison/?usernames=xenon_iit&usernames=theabeerexperience")
    assert response.status_code == 200
    data = response.json()
    print(data)
    assert "xenon_iit" in data["comparisons"]
    assert "theabeerexperience" in data["comparisons"]
    print("Comparison tests passed!")

if __name__ == "__main__":
    test_comparison()
