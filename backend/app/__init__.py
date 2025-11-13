from flask import Flask
from flask_cors import CORS

def create_app() -> Flask:
    app = Flask(__name__)
    # Configure CORS for local dev; tighten in production as needed
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    from .routes import tasks_bp
    app.register_blueprint(tasks_bp, url_prefix="/api")

    @app.get("/api/health")
    def health() -> dict:
        return {"status": "ok"}

    return app
