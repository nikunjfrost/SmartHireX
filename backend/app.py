from flask import Flask
from flask_cors import CORS
import os
from routes.resumes import resumes_bp
from routes.jobs import jobs_bp
from routes.analytics import analytics_bp
from routes.candidates import candidates_bp
from routes.builder import builder_bp

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

# Configure upload folder
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Register Blueprints for our AI Resume Analyzer
app.register_blueprint(resumes_bp, url_prefix='/api')
app.register_blueprint(jobs_bp, url_prefix='/api/jobs')
app.register_blueprint(analytics_bp, url_prefix='/api/analytics')
app.register_blueprint(candidates_bp, url_prefix='/api/candidates')
app.register_blueprint(builder_bp, url_prefix='/api/builder')

@app.route('/')
def health_check():
    """Health check endpoint for AWS Elastic Beanstalk"""
    return {"status": "healthy", "service": "SmartHireX API"}, 200

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
