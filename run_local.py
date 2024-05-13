from flask import Flask, redirect, url_for
# from flask_cors import CORS
from routes import main
# from optimization.services import services

app = Flask(__name__)

app.secret_key = 'sembwaste'

app.register_blueprint(main)

### need to setup CORS if we are calling other endpoints
# app.register_blueprint(services)

# CORS(app)
if __name__ == '__main__':
    app.run(host="127.0.0.1", debug=True, port=5000)
    # app.run(ssl_context=('ssl/local-host.cert', 'ssl/local-host.pem'), debug=True, port=5000)
    # app.run(host='0.0.0.0', port=5000)
