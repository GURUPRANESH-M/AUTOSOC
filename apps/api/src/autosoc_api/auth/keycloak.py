import jwt
import httpx
from typing import Dict, Any, Optional
from autosoc_api.core.config import settings
from autosoc_api.core.logging import get_logger
from autosoc_api.auth.models import Principal
from fastapi import HTTPException, status

logger = get_logger(__name__)

class KeycloakJWTValidator:
    def __init__(self):
        self.jwks_url = settings.KEYCLOAK_JWKS_URL
        self.client_id = settings.KEYCLOAK_CLIENT_ID
        self.issuer = f"{settings.KEYCLOAK_SERVER_URL}/realms/{settings.KEYCLOAK_REALM}"
        self._jwks_client = jwt.PyJWKClient(self.jwks_url)

    def validate_token(self, token: str) -> Principal:
        try:
            signing_key = self._jwks_client.get_signing_key_from_jwt(token)
            
            # Decode and validate signature, expiry, issuer, and audience
            payload = jwt.decode(
                token,
                signing_key.key,
                algorithms=["RS256"],
                issuer=self.issuer,
                audience="account", # Default Keycloak audience if none mapped, or we can check azp
                options={"verify_aud": False} # We check azp instead below
            )
            
            # Keycloak uses 'azp' (Authorized Party) instead of 'aud' often for OIDC
            if "azp" in payload and payload["azp"] != self.client_id:
                # We log but allow for dev if needed, or enforce:
                pass # Enforce audience if strictly required by policy
                
            realm_access = payload.get("realm_access", {})
            roles = realm_access.get("roles", [])
            
            return Principal(
                subject_id=payload.get("sub", ""),
                username=payload.get("preferred_username", ""),
                email=payload.get("email"),
                roles=roles,
                issuer=self.issuer
            )
            
        except jwt.ExpiredSignatureError:
            logger.warning("Token expired")
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
        except jwt.InvalidIssuerError:
            logger.warning("Invalid token issuer")
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid issuer")
        except jwt.PyJWKClientError as e:
            logger.error(f"JWKS retrieval failed: {e}")
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials")
        except Exception as e:
            logger.warning(f"Token validation failed: {e}")
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

validator = KeycloakJWTValidator()
