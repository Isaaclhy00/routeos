from flask import Blueprint, render_template, request, jsonify, redirect, session, url_for
# from optimization import solve
import get_geotab_data
import json
import uuid
import os
import requests
from datetime import datetime

import sys
sys.path.append('./optimization')
# from optimization.solve_no_clusters import solve_nocluster
from optimization.solve_with_clusters import solve_with_cluster
from optimization.query_osrm import OsrmQuery

# Create a Blueprint object to define routes
main = Blueprint('main', __name__)

# Define your routes
@main.route('/')
def index():
    return render_template('index.html')

@main.route('/guide')
def guide():
    return render_template('guide.html')

@main.route("/edit_fleet")
def edit_fleet():
    # preload data from db 
    return render_template('edit_fleet.html')

@main.route("/edit_locations")
def edit_loc():
    # preload data from db
    return render_template('edit_locations.html')

@main.route("/edit_clusters")
def edit_clusters():
    # preload data from db
    return render_template("edit_clusters.html")

@main.route("/combine_csvs")
def combine_csvs():
    return render_template("combine_csvs.html")

@main.route("/simple_optimization")
def simple_optimization():
    # preload data from db
    return render_template("simple_optimization.html")

@main.route("/free_optimization")
def run_optimization_original():
    # preload data from db
    return render_template("run_optimization_original.html")

@main.route("/edit_optimization")
def edit_optimization():
    try:
        run_number = request.args.get('run_number')

        with open(run_number+".json") as f:
            output = f.read()

        print(run_number)
    except:
        output = None
        print("no_run_number")
        pass

    return render_template("edit_optimization.html", opt_json = output, run_number=run_number)

@main.route("/geotab")
def geotab_iframe():
    return render_template("geotab.html")

@main.route("/solve", methods=["POST"])
def solve_opt():
    # run_number = str(uuid.uuid4())
    now = datetime.now()
    run_number = now.strftime("%Y%m%d")+"-test"
    data = request.json
    print(run_number)
    with open('data.json', 'w') as f:
        json.dump(data, f)
        
    output = solve_with_cluster(data)
    with open(run_number+'.json', 'w') as f:
        json.dump(output, f)

    return jsonify({'run_number': run_number})


@main.route("/run2")
def run_optimization2():
    # preload data from db
    return render_template("run_optimization2.html")


@main.route('/get_geotab_data/<vehicle_id>/<start_utc>/<end_utc>', methods=['GET'])
def process_data(vehicle_id, start_utc, end_utc):
    # Call the function from your class
    trip_data = get_geotab_data.get_trip_and_cps(vehicle_id, start_utc, end_utc)
    
    # Return the processed data as JSON
    return trip_data

@main.route('/update_depots', methods=['POST'])
def update_depots():
    data = request.json 
    for item in data:
        item['lat'] = int(item['lat'])
        item['long'] = int(item['long'])
    content_to_write = 'var depots_data = ' + json.dumps(data, indent=4)
    file_path = os.path.join('static', 'js', 'data', 'depots_data.js')
    with open(file_path, 'w') as f:
        f.write(content_to_write)
    return jsonify({'message': 'Depots updated successfully'})

@main.route('/update_vehicle_types', methods=['POST'])
def update_vehicle_types():
    data = request.json 
    for item in data:
        item['Capacity'] = int(item['Capacity'])
        item['Range'] = int(item['Range'])
    content_to_write = 'var vehicle_types_data = ' + json.dumps(data, indent=4)
    file_path = os.path.join('static', 'js', 'data', 'vehicle_types_data.js')
    with open(file_path, 'w') as f:
        f.write(content_to_write)
    return jsonify({'message': 'Vehicle Types updated successfully'})

@main.route('/update_routes', methods=['POST'])
def update_routes():
    data = request.json 

    free_route = {
        'id': -1,
        'Name': "Free",
        'Depot': 0,
        'Vehicle_Type': None,
        'Max_Trips': None,
        'Manpower': None,
        'Points_Count': None
    }
    data.unshift(free_route)

    for item in data:
        item['Depot'] = int(item['Depot'])
        item['Vehicle_Type'] = int(item['Vehicle_Type']) if item['Vehicle_Type'] is not None else None
        item['Max_Trips'] = int(item['Max_Trips']) if item['Max_Trips'] is not None else None
        item['Manpower'] = int(item['Manpower']) if item['Manpower'] is not None else None
        item['Points_Count'] = int(item['Points_Count']) if item['Points_Count'] is not None else None

    content_to_write = 'var routes_data = ' + json.dumps(data, indent=4)
    file_path = os.path.join('static', 'js', 'data', 'routes_data.js')
    with open(file_path, 'w') as f:
        f.write(content_to_write)
    return jsonify({'message': 'Routes updated successfully'})

@main.route('/update_vehicles', methods=['POST'])
def update_vehicles():
    data = request.json 
    for item in data:
        item['Vehicle_Type'] = int(item['Vehicle_Type'])
        item['Route_ID'] = int(item['Route_ID'])
        item['Max_Trips'] = int(item['Max_Trips'])
        item['Manpower'] = int(item['Manpower'])
        item['Depot'] = int(item['Depot'])
        item['Break_Time'] = int(item['Break_Time'])
        item['Current_Lat'] = float(item['Current_Lat'])
        item['Current_Long'] = float(item['Current_Long'])
        item['Current_Tonnage'] = float(item['Current_Tonnage'])
    content_to_write = 'var vehicles_data = ' + json.dumps(data, indent=4)
    file_path = os.path.join('static', 'js', 'data', 'vehicles_data.js')
    with open(file_path, 'w') as f:
        f.write(content_to_write)
    return jsonify({'message': 'Vehicles updated successfully'})

@main.route('/update_points', methods=['POST'])
def update_points():
    data = request.json 

    # for item in data:
    #     item['Service_Time_min'] = int(item['Service_Time_min']) if item['Service_Time_min'] else None
    #     item['Min_Collection_Time_hrs'] = int(item['Min_Collection_Time_hrs']) if item['Min_Collection_Time_hrs'] else None
    #     item['Max_Collection_Time_hrs'] = int(item['Max_Collection_Time_hrs']) if item['Max_Collection_Time_hrs'] else None
    #     item['Time_Collected_hrs'] = int(item['Time_Collected_hrs']) if item['Time_Collected_hrs'] else None
    #     item['Tonnage_kg'] = int(item['Tonnage_kg']) if item['Tonnage_kg'] else None
    #     item['Route_ID'] = int(item['Route_ID']) if item['Route_ID'] else None
    #     item['Manpower'] = int(item['Manpower']) if item['Manpower'] else None
    #     item['Vehicle_ID'] = int(item['Vehicle_ID']) if item['Vehicle_ID'] else None
    #     item['Fatigue'] = int(item['Fatigue']) if item['Fatigue'] else None
    #     item['Network_Cluster'] = int(item['Network_Cluster']) if item['Network_Cluster'] else None

    content_to_write = 'var points_data = ' + json.dumps(data, indent=4)
    file_path = os.path.join('static', 'js', 'data', 'points_data.js')
    with open(file_path, 'w') as f:
        f.write(content_to_write)
    return jsonify({'message': 'Points updated successfully'})

@main.route('/update_clusters', methods=['POST'])
def update_clusters():
    data = request.json 
    for item in data:
        item['Cluster_Load'] = int(item['Cluster_Load'])
        item['Cluster_TW'] = [int(value) for value in item['Cluster_TW']]
        item['Cluster_Restrictions'] = int(item['Cluster_Restrictions'])
        item['Cluster_Service_Time'] = int(item['Cluster_Service_Time'])
        item['Cluster_Manpower'] = int(item['Cluster_Manpower'])
        item['Cluster_Points_Count'] = int(item['Cluster_Points_Count'])
    content_to_write = 'var clusters_data = ' + json.dumps(data, indent=4)
    file_path = os.path.join('static', 'js', 'data', 'clusters_data.js')
    with open(file_path, 'w') as f:
        f.write(content_to_write)
    return jsonify({'message': 'Clusters updated successfully'})

@main.route("/reset_all_data")
def reset_all_data():
    return render_template("reset_all_data.html")

@main.route('/reset_all_data_POST', methods=['POST'])
def reset_all_data_POST():
    source_file_paths_array = ['static/js/data/original_data/original_clusters_data.js',
                               'static/js/data/original_data/original_depots_data.js',
                               'static/js/data/original_data/original_points_data.js',
                               'static/js/data/original_data/original_routes_data.js',
                               'static/js/data/original_data/original_vehicle_types_data.js',
                               'static/js/data/original_data/original_vehicles_data.js']

    destination_file_path_array = ['static/js/data/clusters_data.js',
                                    'static/js/data/depots_data.js',
                                    'static/js/data/points_data.js',
                                    'static/js/data/routes_data.js',
                                    'static/js/data/vehicle_types_data.js',
                                    'static/js/data/vehicles_data.js']

    for source_path, destination_path in zip(source_file_paths_array, destination_file_path_array):
        # Read data from the source file and write it into the destination file
        with open(source_path, 'r') as source_file:
            data = source_file.read()  # Read data from the source file

        # Write data into the destination file
        with open(destination_path, 'w') as destination_file:
            destination_file.write(data)  # Write data into the destination file

    return redirect(url_for('main.reset_all_data'))

@main.route('/fetch_route')
def fetch_route():
    latlon_str = request.args.get('latlonstr')
    print(latlon_str)
    url = "http://localhost:5001/route/v1/car/"+latlon_str+"?annotations=nodes&continue_straight=true&geometries=geojson&overview=full&alternatives=true"
    # url = "http://osrm:5001/route/v1/car/"+latlon_str+"?annotations=nodes&continue_straight=true&geometries=geojson&overview=full&alternatives=true"
    route_response = requests.get(url,verify=False)
    if route_response.status_code == 200:
        return route_response.json()
    else:
        print("find_route",route_response.status_code)
        return None

@main.route("/test")
def run_test():
    endpoint = "http://localhost:5001"
    # endpoint = "http://osrm:5001"
    querycar = OsrmQuery(endpoint, 'car')
    route_response = querycar.find_route(1.2984382,103.8047524,1.2980271,103.8050503,u_turn_allowed=True)
    route_response["routes"][0]["duration"]/60
    return route_response