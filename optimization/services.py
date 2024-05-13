from flask import Blueprint
from flask import request, jsonify
import pandas as pd
from optimization.clustering import DBScanClusterer

# Create a Blueprint object to define routes
services = Blueprint('services', __name__)

# Define your routes
@services.route('/cluster', methods = ["POST"])
def cluster_points():
    data = request.json.get('points')
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    points = pd.DataFrame(data)
    ### run clustering

