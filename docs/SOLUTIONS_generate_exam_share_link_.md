from flask import Flask, jsonify, request, abort

# Initialize the application instance
app = Flask(__name__)

@app.route('/')
def index():
    """Basic example route to demonstrate successful initialization."""
    return jsonify({"status": "ok", "message": "Welcome to your API"})

# Example usage of other imported components (if needed)
@app.route('/error_test')
def error_test():
    """Example of triggering an abort."""
    abort(403, description="This resource is restricted.")


if __name__ == '__main__':
    # NOTE: For this code to run, the 'flask' library must be installed: pip install flask
    app.run(debug=True)