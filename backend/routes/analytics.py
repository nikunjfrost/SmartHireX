from flask import Blueprint, jsonify

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/recruiter', methods=['GET'])
def recruiter_analytics():
    # Provide robust mock data suitable for rich visual charts
    return jsonify({
        "status": "success",
        "data": {
            "metrics": {
                "total_resumes_analyzed": 1248,
                "average_match_score": 76.4,
                "shortlisted_candidates": 182,
                "interviews_scheduled": 45
            },
            "charts": {
                "rejection_reasons": [
                    {"reason": "Low ATS Score", "count": 312},
                    {"reason": "Missing Skills", "count": 285},
                    {"reason": "Lack of Experience", "count": 145},
                    {"reason": "Location Mismatch", "count": 89},
                    {"reason": "Other", "count": 42}
                ],
                "applications_over_time": [
                    {"month": "Jan", "applications": 120, "shortlisted": 15},
                    {"month": "Feb", "applications": 180, "shortlisted": 22},
                    {"month": "Mar", "applications": 250, "shortlisted": 40},
                    {"month": "Apr", "applications": 210, "shortlisted": 35},
                    {"month": "May", "applications": 380, "shortlisted": 55},
                    {"month": "Jun", "applications": 108, "shortlisted": 15}
                ],
                "candidate_sources": [
                    {"name": "LinkedIn", "value": 45},
                    {"name": "Company Website", "value": 30},
                    {"name": "Referrals", "value": 15},
                    {"name": "Job Boards", "value": 10}
                ]
            }
        }
    }), 200
