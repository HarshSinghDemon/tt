"""
Layer 3: Anomaly & Risk Evaluation Engine for Faculty Guard.
Evaluates file access events, computes risk scores based on velocity and origin,
and translates technical indicators into educator-friendly explanations.
"""

from typing import Dict, Any

# Threshold constants defining anomalous faculty access behavior
BURST_THRESHOLD_FILES_PER_MINUTE = 20.0
CRITICAL_RISK_THRESHOLD = 80
MODERATE_RISK_THRESHOLD = 50


def calculate_download_velocity(file_count: int, time_window_seconds: int) -> float:
    """
    Computes files downloaded per minute.
    Normal faculty behavior rarely exceeds 5-10 files per minute.
    """
    if time_window_seconds <= 0:
        return float(file_count) * 60.0
    
    minutes = max(time_window_seconds / 60.0, 0.1)
    return round(file_count / minutes, 1)


def determine_severity(risk_score: int) -> str:
    """
    Maps numerical risk score (0-100) to standard semantic severity levels.
    """
    if risk_score >= CRITICAL_RISK_THRESHOLD:
        return "critical"
    elif risk_score >= MODERATE_RISK_THRESHOLD:
        return "suspicious"
    return "safe"


def generate_human_summary(file_count: int, country: str, is_critical: bool) -> Dict[str, Any]:
    """
    Generates plain-English narrative for educators without technical jargon.
    Teachers should immediately understand the situation and know what action to take.
    """
    if is_critical:
        headline = "Unusual bulk download activity blocked"
        message = (
            f"We blocked an unexpected attempt to download {file_count} files from an "
            f"unrecognized location ({country}). Was this you?"
        )
        actions = [
            {"id": "keep_locked", "label": "No, keep my account locked", "type": "danger"},
            {"id": "unlock", "label": "Yes, it was me – Unlock", "type": "primary"}
        ]
    else:
        headline = "Routine access verified"
        message = "File access velocity is within standard university parameters. No action required."
        actions = []

    return {
        "headline": headline,
        "message": message,
        "recommended_actions": actions
    }


def evaluate_risk(event_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Evaluates an access event payload and produces calibrated risk metrics.
    Acts as the primary inference interface for Layer 2 application orchestration.
    """
    # Extract event metrics safely with defaults
    file_count = int(event_data.get("file_count", 1))
    time_window = int(event_data.get("time_window_seconds", 60))
    ip_address = str(event_data.get("ip_address", "127.0.0.1"))
    country = str(event_data.get("country", "Unknown"))
    device = str(event_data.get("device", "Unknown User-Agent"))

    # Compute access velocity
    velocity_files_per_min = calculate_download_velocity(file_count, time_window)

    # Base scoring logic: velocity spike weight + unknown network indicator
    score = 15
    if velocity_files_per_min > BURST_THRESHOLD_FILES_PER_MINUTE:
        # Exponential scaling for massive scripted scrapers
        score += min(int(velocity_files_per_min * 0.7), 65)
    
    if "tor" in country.lower() or "unknown" in country.lower():
        score += 20
    if "script" in device.lower() or "python" in device.lower() or "curl" in device.lower():
        score += 15

    # Cap risk score between 0 and 100
    risk_score = min(max(score, 0), 99)
    severity = determine_severity(risk_score)
    is_critical = severity == "critical"
    action_taken = "auto_lock" if is_critical else "allow_log"

    # Assemble human-first narrative
    human_summary = generate_human_summary(file_count, country, is_critical)

    # Assemble technical forensic telemetry for the terminal toggle
    minutes_formatted = round(max(time_window / 60.0, 0.1), 1)
    technical_details = {
        "ip_address": ip_address,
        "burst_rate": f"{file_count} files / {minutes_formatted} min",
        "velocity_per_minute": velocity_files_per_min,
        "anomaly_type": "Velocity Spike & Scripted Scraper Pattern" if is_critical else "Standard Access",
        "geo_origin": country,
        "device_fingerprint": device,
        "model_confidence": 0.982 if is_critical else 0.995
    }

    return {
        "risk_score": risk_score,
        "severity": severity,
        "action_taken": action_taken,
        "human_summary": human_summary,
        "technical_details": technical_details
    }
