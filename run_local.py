from flask import Flask, redirect, url_for
# from flask_cors import CORS
from routes import main
# from optimization.services import services

app = Flask(__name__)

app.register_blueprint(main)

# CORS(app)
if __name__ == '__main__':
    app.run(host="127.0.0.1", debug=True, port=5000)