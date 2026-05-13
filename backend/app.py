from flask import Flask
from flask_cors import CORS
import os
from backend.routes.resumes import resumes_bp
from backend.routes.jobs import jobs_bp
from backend.routes.analytics import analytics_bp
from backend.routes.candidates import candidates_bp
from backend.routes.builder import builder_bp

frontend_dist = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'SmartHireX Website Frontend', 'dist')
app = Flask(__name__, static_folder=frontend_dist, static_url_path='/')
# Enable CORS for frontend connection (still useful for local API dev if needed)
CORS(app)

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
def serve_react():
    """Serve the React application index.html from dist folder"""
    if os.path.exists(os.path.join(frontend_dist, 'index.html')):
        return app.send_static_file('index.html')
    return "Frontend build not found. Please run 'npm run build' inside 'SmartHireX Website Frontend'.", 404

@app.route('/favicon.ico')
def favicon():
    """Handle browser requests for favicon.ico gracefully"""
    favicon_path = os.path.join(frontend_dist, 'favicon.ico')
    if os.path.exists(favicon_path):
        return app.send_static_file('favicon.ico')
    return "", 204

@app.route('/<path:path>')
def serve_react_routes(path):
    """
    Catch-all route to support React-Router's client-side routing.
    Any path that isn't matched by the /api routes will hit here and return index.html.
    However, if the path matches a static file in dist (like assets/index.js),
    it should statically serve it. `send_static_file` handles the base `/` nicely, but for
    files, static_url_path='/' automatically handles anything in frontend_dist.
    """
    if path.startswith("api/"):
        return {"error": "API route not found"}, 404

    # Let Flask check if there is an actual file (like images, css) matching the path
    static_file_path = os.path.join(frontend_dist, path)
    if os.path.exists(static_file_path) and os.path.isfile(static_file_path):
        return app.send_static_file(path)
        
    if os.path.exists(os.path.join(frontend_dist, 'index.html')):
        return app.send_static_file('index.html')
    return "Frontend build not found.", 404

if __name__ == '__main__':
    app.run(debug=True, port=5000)
    
