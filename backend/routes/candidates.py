from flask import Blueprint, jsonify, request
from utils.supabase_client import supabase

candidates_bp = Blueprint('candidates', __name__)

@candidates_bp.route('/', methods=['GET'])
def get_candidates():
    if not supabase:
        return jsonify({"error": "Supabase client not initialized"}), 500
        
    try:
        response = supabase.table('candidates').select('*').order('match_score', desc=True).execute()
        return jsonify(response.data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@candidates_bp.route('/<id>/status', methods=['PUT'])
def update_status(id):
    if not supabase:
        return jsonify({"error": "Supabase client not initialized"}), 500
        
    data = request.json
    status = data.get('status')
    
    if not status:
        return jsonify({"error": "Status is required"}), 400
        
    try:
        response = supabase.table('candidates').update({"status": status}).eq('id', id).execute()
        return jsonify(response.data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
