from datetime import datetime

class PriorityEngine:
    """
    Intelligent Explainable Priority Scoring Engine according to PRD Module 4.
    Formula:
      Priority Score = Severity Score + Affected Users Score + Pending Time Score
      - Severity Score (0-40) = Severity Level (1-5) * 8
      - Affected Users Score (0-30) = MIN(Affected Users * 3, 30)
      - Pending Time Score (0-30) = MIN((Pending Hours / 24) * 5, 30)
      
      Score 0-30: Low
      Score 31-60: Medium
      Score 61-80: High
      Score 81-100: Critical
    """

    CRITICAL_SAFETY_KEYWORDS = [
        "exposed wire", "exposed wiring", "sparking", "gas leak", 
        "fire hazard", "structural collapse", "ceiling collapse", 
        "flooding", "high voltage", "electric shock"
    ]

    @classmethod
    def calculate_priority(cls, severity: int, affected_users: int, created_at: datetime, title: str = "", description: str = ""):
        # Severity calculation (0 - 40)
        sev = max(1, min(5, int(severity or 1)))
        severity_score = sev * 8

        # Affected users calculation (0 - 30)
        users = max(1, int(affected_users or 1))
        affected_users_score = min(users * 3, 30)

        # Pending time calculation (0 - 30)
        if not created_at:
            created_at = datetime.utcnow()
        pending_hours = max(0.0, (datetime.utcnow() - created_at).total_seconds() / 3600.0)
        pending_time_score = min((pending_hours / 24.0) * 5.0, 30.0)

        # Check safety hazard escalation
        text_corpus = f"{title} {description}".lower()
        is_safety_escalation = any(k in text_corpus for k in cls.CRITICAL_SAFETY_KEYWORDS) or sev == 5

        # Raw total score
        raw_score = severity_score + affected_users_score + pending_time_score
        
        # If safety hazard is escalated and score is lower, raise minimum baseline to 75 (High/Critical)
        if is_safety_escalation and raw_score < 75.0:
            final_score = 75.0
        else:
            final_score = min(100.0, max(0.0, raw_score))

        final_score = round(final_score, 1)

        # Priority level classification
        if final_score <= 30.0:
            level = 'low'
            level_display = 'Low'
        elif final_score <= 60.0:
            level = 'medium'
            level_display = 'Medium'
        elif final_score <= 80.0:
            level = 'high'
            level_display = 'High'
        else:
            level = 'critical'
            level_display = 'Critical'

        # Generate explainable reasons
        reasons = []
        
        # Severity explanation
        sev_labels = {1: "Minor", 2: "Low", 3: "Moderate", 4: "High", 5: "Critical"}
        reasons.append(f"Severity level {sev}/5 ({sev_labels.get(sev, 'Moderate')}) contributes {severity_score}/40 points.")

        # Affected users explanation
        if users == 1:
            reasons.append(f"1 student affected (creator), contributing {affected_users_score}/30 points.")
        else:
            reasons.append(f"{users} students affected (creator + supporters), contributing {affected_users_score}/30 points.")

        # Pending time explanation
        if pending_hours < 1:
            reasons.append(f"Just reported (< 1 hr ago), contributing {round(pending_time_score, 1)}/30 points.")
        elif pending_hours < 24:
            reasons.append(f"Pending for {round(pending_hours, 1)} hours, contributing {round(pending_time_score, 1)}/30 points.")
        else:
            days = round(pending_hours / 24.0, 1)
            reasons.append(f"Pending for {days} days ({round(pending_hours, 1)} hrs), contributing {round(pending_time_score, 1)}/30 points.")

        if is_safety_escalation:
            reasons.append("Safety Escalation: Identified potential hazard requiring prompt attention.")

        summary_explanation = f"{level_display} Priority (Score {final_score}/100) — {sev_labels.get(sev)} severity, {users} affected student(s), pending for {round(pending_hours, 1)} hours."

        return {
            'priority_score': final_score,
            'priority_level': level,
            'priority_level_display': level_display,
            'breakdown': {
                'severity_score': severity_score,
                'severity_max': 40,
                'affected_users_score': affected_users_score,
                'affected_users_max': 30,
                'pending_time_score': round(pending_time_score, 1),
                'pending_time_max': 30,
                'pending_hours': round(pending_hours, 1)
            },
            'reasons': reasons,
            'summary_explanation': summary_explanation,
            'is_safety_escalated': is_safety_escalation
        }

    @classmethod
    def update_complaint_priority(cls, complaint):
        """
        Recalculates and updates priority fields on a Complaint model instance.
        """
        result = cls.calculate_priority(
            severity=complaint.severity,
            affected_users=complaint.affected_users_count,
            created_at=complaint.created_at,
            title=complaint.title,
            description=complaint.description
        )
        complaint.priority_score = result['priority_score']
        complaint.priority_level = result['priority_level']
        return result
