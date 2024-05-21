from flask import Flask, redirect, url_for
from routes import main

app = Flask(__name__)

app.register_blueprint(main)

if __name__ == '__main__':
    app.run()