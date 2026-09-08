"""
Layer 4 / Service Mock: Audit Logging Service for Faculty Guard.
Retrieves immutable historical access records and incident logs.
"""

from typing import List, Dict, Any
from datetime import datetime, timezone, timedelta


def generate_sample_audit_events() -> List[Dict[str, Any]]:
    """
    Returns verified audit history for testing and UI demonstration.
    Demonstrates clean segregation between routine access and flagged anomalies.
    """
    now = datetime.now(timezone.utc)
    
    return [
        {
            "event_id": "evt_991823_04",
            "timestamp": (now - timedelta(minutes=14)).isoformat(),
            "user_id": "usr_991823",
            "action": "bulk_download",
            "resource": "Exams/Fall2026/CS101_Final_Master.pdf",
            "file_count": 412,
            "ip_address": "172.56.21.94",
            "geo_country": "Unknown ASN / TOR Exit Node",
            "status": "BLOCKED",
            "risk_score": 94,
            "anomaly_flagged": True,
            "human_summary": "Attempted download of 412 files in 4 minutes blocked from unrecognized network."
        },
        {
            "event_id": "evt_991823_03",
            "timestamp": (now - timedelta(hours=3)).isoformat(),
            "user_id": "usr_991823",
            "action": "mfa_verification",
            "resource": "Auth/TOTP",
            "file_count": 1,
            "ip_address": "128.197.34.12",
            "geo_country": "United States (Campus Wi-Fi)",
            "status": "ALLOWED",
            "risk_score": 12,
            "anomaly_flagged": False,
            "human_summary": "Routine two-factor authentication successful from Faculty Hall."
        },
        {
            "event_id": "evt_991823_02",
            "timestamp": (now - timedelta(days=1)).isoformat(),
            "user_id": "usr_991823",
            "action": "file_view",
            "resource": "Grades/Midterm_Submissions.xlsx",
            "file_count": 1,
            "ip_address": "128.197.34.12",
            "geo_country": "United States (Campus Wi-Fi)",
            "status": "ALLOWED",
            "risk_score": 8,
            "anomaly_flagged": False,
            "human_summary": "Standard single-file preview opened on verified campus device."
        }
    ]


def fetch_audit_logs(user_id: str = None, limit: int = 10) -> List[Dict[str, Any]]:
    """
    Fetches audit trail records filtered optionally by user_id.
    """
    events = generate_sample_audit_events()
    if user_id:
        events = [e for e in events if e.get("user_id") == user_id]
    return events[:limit]
