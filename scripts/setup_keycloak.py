import os
import requests
import time
import sys

KEYCLOAK_URL = "http://localhost:8080"
ADMIN_USER = "admin"
ADMIN_PASS = "admin"

REALM_NAME = "autosoc"
CLIENT_ID = "autosoc-frontend"
CLIENT_SECRET = "jcJtUripYvhWVOV2gwtooiWqgdcEP2WS"

def get_admin_token():
    url = f"{KEYCLOAK_URL}/realms/master/protocol/openid-connect/token"
    payload = {
        "client_id": "admin-cli",
        "username": ADMIN_USER,
        "password": ADMIN_PASS,
        "grant_type": "password"
    }
    try:
        response = requests.post(url, data=payload)
        response.raise_for_status()
        return response.json()["access_token"]
    except Exception as e:
        print(f"Failed to get admin token: {e}")
        if 'response' in locals():
            print(response.text)
        return None

def create_realm(token):
    url = f"{KEYCLOAK_URL}/admin/realms"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    payload = {
        "realm": REALM_NAME,
        "enabled": True,
        "registrationAllowed": True,
        "loginWithEmailAllowed": True,
        "resetPasswordAllowed": True,
        "verifyEmail": False
    }
    resp = requests.post(url, headers=headers, json=payload)
    if resp.status_code == 201:
        print(f"Realm '{REALM_NAME}' created successfully.")
    elif resp.status_code == 409:
        print(f"Realm '{REALM_NAME}' already exists.")
    else:
        print(f"Failed to create realm: {resp.status_code} {resp.text}")

def create_client(token):
    url = f"{KEYCLOAK_URL}/admin/realms/{REALM_NAME}/clients"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    payload = {
        "clientId": CLIENT_ID,
        "secret": CLIENT_SECRET,
        "enabled": True,
        "publicClient": False,
        "directAccessGrantsEnabled": True,
        "standardFlowEnabled": True,
        "implicitFlowEnabled": False,
        "redirectUris": ["http://localhost:3000/*"],
        "webOrigins": ["http://localhost:3000"]
    }
    resp = requests.post(url, headers=headers, json=payload)
    if resp.status_code == 201:
        print(f"Client '{CLIENT_ID}' created successfully.")
    elif resp.status_code == 409:
        print(f"Client '{CLIENT_ID}' already exists.")
    else:
        print(f"Failed to create client: {resp.status_code} {resp.text}")

def create_test_user(token):
    url = f"{KEYCLOAK_URL}/admin/realms/{REALM_NAME}/users"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    payload = {
        "username": "admin",
        "email": "admin@autosoc.local",
        "firstName": "AutoSOC",
        "lastName": "Admin",
        "enabled": True,
        "credentials": [{
            "type": "password",
            "value": "admin",
            "temporary": False
        }]
    }
    resp = requests.post(url, headers=headers, json=payload)
    if resp.status_code == 201:
        print(f"User 'admin@autosoc.local' created successfully (password: admin).")
    elif resp.status_code == 409:
        print(f"User 'admin@autosoc.local' already exists.")
    else:
        print(f"Failed to create user: {resp.status_code} {resp.text}")

def assign_roles(token):
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    # 1. Create administrator role
    role_url = f"{KEYCLOAK_URL}/admin/realms/{REALM_NAME}/roles"
    requests.post(role_url, headers=headers, json={"name": "administrator"})
    
    # 2. Get role ID
    role_info = requests.get(f"{role_url}/administrator", headers=headers).json()
    role_id = role_info["id"]

    # 3. Get user ID for 'admin'
    users_url = f"{KEYCLOAK_URL}/admin/realms/{REALM_NAME}/users"
    users = requests.get(f"{users_url}?username=admin", headers=headers).json()
    if not users:
        print("User admin not found for role mapping")
        return
    user_id = users[0]["id"]

    # 4. Assign role to user
    mapping_url = f"{KEYCLOAK_URL}/admin/realms/{REALM_NAME}/users/{user_id}/role-mappings/realm"
    requests.post(mapping_url, headers=headers, json=[{"id": role_id, "name": "administrator"}])
    print("Role 'administrator' assigned to user 'admin'.")

def main():
    token = get_admin_token()
    if not token:
        sys.exit(1)

    create_realm(token)
    create_client(token)
    create_test_user(token)
    assign_roles(token)
    print("Keycloak setup complete.")

if __name__ == "__main__":
    main()
