from app import create_app

app = create_app()

if __name__ == "__main__":
    # Local development server
    # Visit http://localhost:5000/api/health
    app.run(debug=True)