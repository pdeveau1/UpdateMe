# test_register.py
from fastapi import status
from bson import ObjectId
from fastapi.security import OAuth2PasswordRequestForm

def test_register_new_user(client):
    new_user = {
        "email": "test@example.com",
        "password": "test_password",
        "first_name": "Test",
        "last_name": "User",
        "notification_on": False,
    }
    response = client.post("/register", json=new_user)
    assert response.status_code == status.HTTP_201_CREATED
    assert "user_id" in response.json()
    assert ObjectId.is_valid(response.json()["user_id"])

def test_register_existing_user(client):
    existing_user = {
        "email": "test@example.com",
        "password": "test_password",
        "first_name": "Test",
        "last_name": "User",
        "notification_on": False,
    }
    client.post("/register", json=existing_user)  # First, create a user to simulate an existing user
    response = client.post("/register", json=existing_user)
    assert response.status_code == status.HTTP_409_CONFLICT
    assert response.json() == {"detail": "User already exists"}

# test_login.py

def test_login_valid_credentials(client):
    # Register a new user
    new_user = {
        "email": "test_login@example.com",
        "password": "test_password",
        "first_name": "Test",
        "last_name": "User",
        "notification_on": False,
    }
    client.post("/register", json=new_user)

    # Test login with valid credentials
    form_data = {
        "username": "test_login@example.com",
        "password": "test_password",
        "grant_type": "password",
        "scope": "",
    }
    response = client.post("/login", data=form_data)
    assert response.status_code == status.HTTP_200_OK
    assert "access_token" in response.json()
    assert response.json()["token_type"] == "bearer"

def test_login_invalid_email(client):
    form_data = {
        "username": "invalid_email@example.com",
        "password": "test_password",
        "grant_type": "password",
        "scope": "",
    }
    response = client.post("/login", data=form_data)
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json() == {"detail": "User not found"}

def test_login_invalid_password(client):
    form_data = {
        "username": "test_login@example.com",
        "password": "invalid_password",
        "grant_type": "password",
        "scope": "",
    }
    response = client.post("/login", data=form_data)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert response.json() == {"detail": "Incorrect password"}
