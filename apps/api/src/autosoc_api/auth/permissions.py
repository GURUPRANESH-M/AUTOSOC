from typing import List, Dict

class Permissions:
    USERS_READ = "users:read"
    USERS_MANAGE = "users:manage"
    DATASOURCES_READ = "datasources:read"
    DATASOURCES_MANAGE = "datasources:manage"
    RULES_READ = "rules:read"
    RULES_MANAGE = "rules:manage"
    ALERTS_READ = "alerts:read"
    ALERTS_UPDATE = "alerts:update"
    INCIDENTS_READ = "incidents:read"
    INCIDENTS_UPDATE = "incidents:update"
    PREDICTIONS_READ = "predictions:read"
    AGENTS_READ = "agents:read"
    RESPONSES_READ = "responses:read"
    RESPONSES_APPROVE = "responses:approve"
    RESPONSES_RECOMMEND = "responses:recommend"
    RESPONSES_EXECUTE = "responses:execute"
    RESPONSES_MANAGE = "responses:manage"
    REPORTS_READ = "reports:read"
    REPORTS_EXPORT = "reports:export"
    AUDIT_READ = "audit:read"
    SETTINGS_READ = "settings:read"
    SETTINGS_MANAGE = "settings:manage"

ROLE_PERMISSIONS: Dict[str, List[str]] = {
    "administrator": [
        Permissions.USERS_READ, Permissions.USERS_MANAGE,
        Permissions.DATASOURCES_READ, Permissions.DATASOURCES_MANAGE,
        Permissions.RULES_READ, Permissions.RULES_MANAGE,
        Permissions.ALERTS_READ, Permissions.ALERTS_UPDATE,
        Permissions.INCIDENTS_READ, Permissions.INCIDENTS_UPDATE,
        Permissions.SETTINGS_READ, Permissions.SETTINGS_MANAGE,
        Permissions.AUDIT_READ, Permissions.RESPONSES_MANAGE,
    ],
    "soc_analyst": [
        Permissions.ALERTS_READ, Permissions.INCIDENTS_READ, Permissions.INCIDENTS_UPDATE,
        Permissions.PREDICTIONS_READ, Permissions.AGENTS_READ, Permissions.RESPONSES_READ,
        Permissions.RESPONSES_RECOMMEND, Permissions.RESPONSES_EXECUTE,
        Permissions.DATASOURCES_READ, Permissions.RULES_READ, Permissions.SETTINGS_READ
    ],
    "security_manager": [
        Permissions.ALERTS_READ, Permissions.INCIDENTS_READ, Permissions.REPORTS_READ,
        Permissions.REPORTS_EXPORT, Permissions.DATASOURCES_READ, Permissions.RULES_READ,
        Permissions.SETTINGS_READ, Permissions.RESPONSES_READ, Permissions.RESPONSES_APPROVE,
        Permissions.RESPONSES_EXECUTE
    ],
    "auditor": [
        Permissions.AUDIT_READ, Permissions.INCIDENTS_READ, Permissions.REPORTS_READ,
        Permissions.ALERTS_READ
    ]
}

def get_permissions_for_roles(roles: List[str]) -> List[str]:
    perms = set()
    for role in roles:
        perms.update(ROLE_PERMISSIONS.get(role, []))
    return list(perms)
