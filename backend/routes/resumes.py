from flask import Blueprint, request, jsonify, current_app
import os
from werkzeug.utils import secure_filename
from utils.file_handler import allowed_file
from services.analyzer import analyze_resume
from services.extractor import extract_resume_text
from services.ats_scorer import calculate_ats_score
from services.matcher import find_keyword_gaps
from services.suggestions import generate_suggestions
from services.probability_predictor import predict_hiring_probability
from services.nlp_pipeline import extract_skills_and_keywords
from services.job_matcher import find_matching_roles
from services.course_recommender import get_course_recommendations


resumes_bp = Blueprint('resumes', __name__)

@resumes_bp.route('/upload-resume', methods=['POST'])
def upload_resume():
    if 'file' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
        
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        return jsonify({
            "message": "File successfully uploaded",
            "filename": filename,
            "filepath": filepath
        }), 200
        
    return jsonify({"error": "Allowed file types are pdf and docx"}), 400

@resumes_bp.route('/analyze', methods=['POST'])
def analyze():
    data = request.get_json()
    
    if not data or 'filename' not in data:
        return jsonify({"error": "Filename is required"}), 400
        
    filename = data['filename']
    filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
    
    if not os.path.exists(filepath):
        return jsonify({"error": "File not found"}), 404
        
    # Call the service to analyze the resume
    try:
        analysis_result = analyze_resume(filepath)
        return jsonify({
            "message": "Analysis complete",
            "result": analysis_result
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@resumes_bp.route('/extract-text', methods=['POST'])
def extract_text():
    if 'file' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
        
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        try:
            text = extract_resume_text(filepath)
            return jsonify({
                "message": "Text successfully extracted",
                "filename": filename,
                "text": text
            }), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500
            
    return jsonify({"error": "Allowed file types are pdf and docx"}), 400

@resumes_bp.route('/ats-score', methods=['POST'])
def ats_score():
    data = request.get_json()
    
    if not data or 'filename' not in data:
        return jsonify({"error": "Filename is required"}), 400
        
    filename = data['filename']
    jd_text = data.get('jd_text', '')
    
    filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
    if not os.path.exists(filepath):
        return jsonify({"error": "File not found. Please upload it first."}), 404
        
    try:
        # Extract text from the PDF
        resume_text = extract_resume_text(filepath)
        
        # Calculate the ATS score
        score_result = calculate_ats_score(resume_text, jd_text)
        
        return jsonify({
            "message": "ATS Score calculated successfully",
            "filename": filename,
            "ats_evaluation": score_result
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@resumes_bp.route('/keyword-analysis', methods=['POST'])
def keyword_analysis():
    data = request.get_json()
    
    if not data or 'filename' not in data or 'jd_text' not in data:
        return jsonify({"error": "Both 'filename' and 'jd_text' are required"}), 400
        
    filename = data['filename']
    jd_text = data['jd_text']
    
    filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
    if not os.path.exists(filepath):
        return jsonify({"error": "File not found. Please upload it first."}), 404
        
    try:
        resume_text = extract_resume_text(filepath)
        analysis_result = find_keyword_gaps(resume_text, jd_text)
        
        return jsonify({
            "message": "Keyword analysis complete",
            "filename": filename,
            "analysis": analysis_result
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@resumes_bp.route('/suggestions', methods=['POST'])
def resume_suggestions():
    data = request.get_json()
    
    if not data or 'filename' not in data:
        return jsonify({"error": "Filename is required"}), 400
        
    filename = data['filename']
    jd_text = data.get('jd_text', '')
    
    filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
    if not os.path.exists(filepath):
        return jsonify({"error": "File not found. Please upload it first."}), 404
        
    try:
        resume_text = extract_resume_text(filepath)
        suggestions_result = generate_suggestions(resume_text, jd_text)
        
        return jsonify({
            "message": "Suggestions generated successfully",
            "filename": filename,
            "data": suggestions_result
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@resumes_bp.route('/hiring-probability', methods=['POST'])
def hiring_probability():
    data = request.get_json()
    
    if not data or 'filename' not in data or 'jd_text' not in data:
        return jsonify({"error": "Both 'filename' and 'jd_text' are required for hiring probability prediction"}), 400
        
    filename = data['filename']
    jd_text = data['jd_text']
    
    filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
    if not os.path.exists(filepath):
        return jsonify({"error": "File not found. Please upload it first."}), 404
        
    try:
        resume_text = extract_resume_text(filepath)
        prediction_result = predict_hiring_probability(resume_text, jd_text)
        
        return jsonify({
            "message": "Hiring probability computed successfully",
            "filename": filename,
            "prediction": prediction_result
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@resumes_bp.route('/analyze-resume', methods=['POST'])
def analyze_full_resume():
    if 'file' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400
        
    file = request.files['file']
    # Accept jd_text as a form data field for multipart/form-data POST requests
    jd_text = request.form.get('jd_text', '')
    
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
        
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        try:
            resume_text = extract_resume_text(filepath)
            
            # Execute Pipeline Modules efficiently side-by-side
            prediction_data = predict_hiring_probability(resume_text, jd_text)
            ats_data = calculate_ats_score(resume_text, jd_text)
            keyword_data = find_keyword_gaps(resume_text, jd_text)
            suggestions_data = generate_suggestions(resume_text, jd_text)
            
            # Extract skills for role recommendation
            extracted_skills = extract_skills_and_keywords(resume_text)
            recommended_roles = find_matching_roles(extracted_skills, top_n=5)
            
            import urllib.parse
            for role in recommended_roles:
                encoded_title = urllib.parse.quote(role['title'])
                role['apply_link'] = f"https://www.linkedin.com/jobs/search?keywords={encoded_title}"
            
            # Construct unified structured response JSON
            response = {
                "status": "success",
                "filename": filename,
                "metrics": {
                    "hiring_probability": prediction_data.get("probability", 0),
                    "match_score": prediction_data.get("components", {}).get("match_score", 0),
                    "ats_score": prediction_data.get("components", {}).get("ats_score", 0),
                },
                "ats_breakdown": ats_data.get("breakdown", {}),
                "keywords": {
                    "missing": keyword_data.get("missing_keywords", []),
                    "matched": keyword_data.get("matched_keywords", [])
                },
                "suggestions": suggestions_data.get("suggestions", []),
                "recommended_courses": get_course_recommendations(keyword_data.get("missing_keywords", [])),
                "recommended_roles": recommended_roles
            }
            
            return jsonify(response), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500
            
    return jsonify({"error": "Allowed file types are pdf and docx"}), 400

@resumes_bp.route('/compare-multiple-jds', methods=['POST'])
def compare_multiple_jds():
    data = request.get_json()
    
    if not data or 'filename' not in data or 'jobs' not in data:
        return jsonify({"error": "Filename and jobs list are required"}), 400
        
    filename = data['filename']
    jobs = data['jobs']
    
    if not isinstance(jobs, list):
        return jsonify({"error": "'jobs' must be a list of job descriptions"}), 400
        
    filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
    if not os.path.exists(filepath):
        return jsonify({"error": "File not found. Please upload it first."}), 404
        
    try:
        resume_text = extract_resume_text(filepath)
        from services.matcher import calculate_match_score
        
        results = []
        for job in jobs:
            title = job.get('title', 'Unknown Job')
            jd_text = job.get('jd_text', '')
            
            if not jd_text.strip():
                continue
                
            match_score = calculate_match_score(resume_text, jd_text)
            
            results.append({
                "job_title": title,
                "match_score": match_score
            })
            
        # Sort by match score descending
        results.sort(key=lambda x: x['match_score'], reverse=True)
        
        return jsonify({
            "status": "success",
            "filename": filename,
            "ranked_jobs": results
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
