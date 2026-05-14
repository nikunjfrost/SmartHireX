from flask import Blueprint, request, jsonify
from services.jd_processor import process_job_description
from services.job_aggregator import aggregate_jobs

jobs_bp = Blueprint('jobs', __name__)

@jobs_bp.route('/web-search', methods=['GET'])
def web_search():
    query = request.args.get('query', '')
    try:
        jobs = aggregate_jobs(query)
        return jsonify({
            "status": "success",
            "jobs": jobs
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@jobs_bp.route('/process-jd', methods=['POST'])
def process_jd():
    data = request.get_json()
    
    if not data or 'text' not in data:
        return jsonify({"error": "JD text is required in 'text' key"}), 400
        
    jd_text = data['text']
    
    try:
        result = process_job_description(jd_text)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@jobs_bp.route('/recommend-jobs', methods=['GET', 'POST'])
def recommend_jobs():
    if request.method == 'POST':
        data = request.get_json()
        if not data or 'skills' not in data:
            return jsonify({"error": "Skills list is required in 'skills' key"}), 400
        skills = data['skills']
        if not isinstance(skills, list):
            return jsonify({"error": "'skills' must be a list of strings"}), 400
    else:
        # GET request
        skills_param = request.args.get('skills')
        if not skills_param:
            return jsonify({"error": "Skills parameter is required (e.g., ?skills=python,react)"}), 400
        skills = [s.strip() for s in skills_param.split(',') if s.strip()]
        
    try:
        from services.job_matcher import find_matching_roles
        import urllib.parse
        
        recommended_roles = find_matching_roles(skills, top_n=5)
        
        for role in recommended_roles:
            encoded_title = urllib.parse.quote(role['title'])
            role['apply_link'] = f"https://www.linkedin.com/jobs/search?keywords={encoded_title}"
            
        return jsonify({
            "status": "success",
            "recommended_jobs": recommended_roles
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
