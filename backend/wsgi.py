from app import create_app

# WSGI entrypoint (gunicorn, waitress, etc.)
app = create_app()