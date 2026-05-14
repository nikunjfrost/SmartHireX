import os
import sys

# Get the absolute path of the directory containing this script
base_dir = os.path.dirname(os.path.abspath(__file__))

# Add the project root to the python path
sys.path.append(base_dir)
# Add the backend directory so cloud-native imports (like 'from routes') work locally
sys.path.append(os.path.join(base_dir, 'backend'))

# Import the Flask app using the full package path
from backend.app import app  # type: ignore

if __name__ == '__main__':
    print("Starting the Resume Analyzer application...")
    # Run the application (no os.chdir so the Flask reloader doesn't lose track of the startup script)
    app.run(debug=True, port=5000)

