from query_vroom import *
from query_osrm import OsrmQuery
import pandas as pd
import numpy as np
import json
from clustering import DBScanClusterer
from tsp import run_tsp
from flask import jsonify

# with open(r"C:\Users\clement.lork\Documents\Sembwaste_Routing\swm_route_optimization\azure_repos\admin_frontend\data_test.json") as f:
#   data = json.loads(f.read())

def solve_with_cluster(data):
    # Load data into DataFrames
    solverConfig = data['solverConfig']
    points = data['pointsToAssign']
    fleet = data['vehiclesInvolved']
    vtypes = data['allVehicleTypes']
    routebreak = data['routesToBreak']
    routeopt = data['routesToOptimize']
    depots = data['depotData']
    ips = [{'id': 0, 'Name': 'IPs', 'lat': 1.29607, 'long': 103.62173}]
    points = pd.DataFrame.from_dict(points)
    fleet = pd.DataFrame.from_dict(fleet)
    routebreak = pd.DataFrame.from_dict(routebreak)
    routeopt = pd.DataFrame.from_dict(routeopt)
    vtypes = pd.DataFrame.from_dict(vtypes)
    depots = pd.DataFrame.from_dict(depots)
    ips = pd.DataFrame.from_dict(ips)

    total_routes = pd.concat([routeopt,routebreak])

    print(points)


    # Endpoint for OSRM 5001
    endpoint = "http://localhost:5001"
    vroom_url = "http://localhost:3000"
    # endpoint = "http://osrm:5001"
    # vroom_url = "http://vroom:3000"
    querycar = OsrmQuery(endpoint, 'car')
    


    # Map Vehicle Type Attributes
    vtypes2str = dict(zip(vtypes.id.tolist(),vtypes.Name.tolist()))
    vtypes2id = dict(zip(vtypes.Name.tolist(),vtypes.id.tolist()))
    vnames2cap = dict(zip(vtypes.Name.tolist(),vtypes.Capacity.tolist()))


    # Convert Vehicle_Type back to string
    fleet["Vehicle_Type"] = fleet["Vehicle_Type"].apply(lambda x: vtypes2str[x])
    fleet["Capacity"] = fleet["Vehicle_Type"].apply(lambda x: vnames2cap[x])


   # Check if a vehicle is servicing point.route_id, if true set allowed vehicle as the vehicle id
    rid2vid = dict(zip(fleet.Route_ID.tolist(),fleet.id.tolist()))
    vt2vid = dict(zip(fleet.Vehicle_Type.tolist(),fleet.id.tolist()))
    vid2mp = dict(zip(fleet.id.tolist(),fleet.Manpower.tolist()))
    vt2vid  = {}
    for idx, vtype in enumerate(fleet['Vehicle_Type']):
        if vtype not in vt2vid :
            vt2vid[vtype] = []
            vt2vid[vtype].append(fleet["id"][idx])
        else:
            vt2vid[vtype].append(fleet["id"][idx])


    # Find vehicle skills before clustering
    vehicle_skills = {}
    for vid in fleet.id:
        vehicle_skills[vid] = []
    for idx, p in points.iterrows():
        # If route_id of points is inside routesInvolved, append p.id to vehicle
        rid = p["Route_ID"]
        allowed_veh = []
        if rid in routeopt.id.tolist():
            vid = rid2vid[rid]
            vehicle_skills[vid].append(p['id'])
            points.loc[idx,"Allowed_Veh"] = str(vid)
        else:
            # If vehicles does not have assigned routes, fall back to checking vehicle_type_allowed tags
            allowed_veh_list = []
            for vt in p["Vehicle_Type_Allowed"].split(","):
                if vt in vt2vid.keys():
                    # allowed_veh_list += [str(i) for i in vt2vid[vt]]
                    for vid in vt2vid[vt]:
                        # check if vehicle support manpower of point
                        if p["Manpower"] <= vid2mp[vid]:
                            vehicle_skills[vid].append(p['id'])
                            allowed_veh_list += [str(vid)]
            allowed_veh = ",".join(sorted(allowed_veh_list))
            points.loc[idx,"Allowed_Veh"] = allowed_veh


    # Clustering points
    cluster_map = dict(zip(points.Network_Cluster.unique().tolist(),list(range(len(points.Network_Cluster.unique())))))
    points["Network_Cluster"] = points["Network_Cluster"].apply(lambda x: cluster_map[x])
    veh_key = "Allowed_Veh"
    dbscan = DBScanClusterer(points, querycar)
    if solverConfig['useClusters'] == False:
        dbscan.dbs_cluster(eps=1)
    dbscan.split_by_vehicle(split=True,veh_key=veh_key)
    dbscan.split_by_timing(find_overlaps=False)
    # dbscan.split_by_tonnage_recursive(tonnage_threshold=2000, initial_eps = 500, descent=100, column='Manpower',condition=3)
    # dbscan.split_by_tonnage_recursive(tonnage_threshold=6000, initial_eps=500, descent=50)
    cluster_midpoints, cluster_load, cluster_tw, cluster_restrictions, cluster_service_time, cluster_manpower = dbscan.find_cluster_characteristics()
    points = dbscan.points


    # Find vehicle skills after clustering
    vehicle_skills = {}
    for vid in fleet.id:
        vehicle_skills[vid] = []
    for idx in range(0, len(cluster_midpoints)):
        restrictions = cluster_restrictions[idx].split(',')
        for r in restrictions:
            if r.strip():
                try:
                    vehicle_skills[int(r)].append(idx)
                except ValueError:
                    error_message = "Invalid vehicle assignment: {}".format(r)
                    print(error_message)
                    return error_message


    # Add start points and end points
    tuas_osmid, tuas_latlong = querycar.find_nearest(1.33469, 103.64579)
    ip_osmid, ip_latlong = querycar.find_nearest(1.29607, 103.62173)
    work_timewindows = [7*60*60,24*60*60]
    cluster_latlongs = cluster_midpoints.copy()
    cluster_latlongs.append(tuas_latlong)
    print("tuas@",len(cluster_latlongs)-1)
    depot_idx = len(cluster_latlongs)-1
    cluster_latlongs.append(ip_latlong)
    print("ip@",len(cluster_latlongs)-1)
    ip_idx = len(cluster_latlongs)-1


    # Calculate distance and time matrix
    dist_matrix, time_matrix = querycar.find_matrix(cluster_latlongs)
    time_matrix = time_matrix*60
    # time_matrix[0:500,500] = time_matrix[0:500,500]+10*60*60
    # time_matrix[500,0:500] = time_matrix[500,0:500]+10*60*60
    dist_matrix = dist_matrix.astype("int64").tolist()
    time_matrix = time_matrix.astype("int64").tolist()


    # Add vehicles
    vehicles = []
    for idx, veh in fleet.iterrows():
        v = Vehicle(veh['id'], 'car', 
                    start =None, start_index=int(depot_idx), 
                    end =None, end_index=int(depot_idx), 
                    capacity=[int(veh["Capacity"])], costs=None,
                    skills = vehicle_skills[veh['id']],
                    time_window=[7*60*60,19*60*60], max_tasks=None,
                    max_travel_time=None,
                    max_distance=300000).to_dict()
        vehicles.append(v)

    
    # Add pickup delivery (cluster)
    shipments = []
    for idx in range(0,len(cluster_midpoints)):
        amount = [cluster_load[idx]]
        skills = [idx]
        pickup_step = Shipment_Step(id=idx,
                                    description = str("cluster")+str(idx),
                                    location = None,
                                    location_index = idx,
                                    setup = None,
                                    service = int(cluster_service_time[idx])*60,
                                    time_windows = [[int(cluster_tw[idx][0])*60*60, int(cluster_tw[idx][1])*60*60]]).to_dict()
        delivery_step = Shipment_Step(id=len(cluster_midpoints)+2+idx,
                                    description = "IP",
                                    location= None,
                                    location_index= ip_idx,
                                    setup = 20*60,
                                    service= None,
                                    time_windows = [[7*60*60, 24*60*60]]).to_dict()
        ship = Shipment(pickup_step=pickup_step, delivery_step=delivery_step, amount=amount, skills=skills, priority=0).to_dict()
        shipments.append(ship)


        matrix = Matrix(duration_matrix = time_matrix, distance_matrix=None, cost_matrix=None).to_dict()

    
    # Solve!
    data = sendData(jobs=[],shipments=shipments,vehicles=vehicles,matrices=matrix).to_dict()
    data = json.dumps(data, indent=2, default=int)
    data = json.loads(data)
    vroom_output = solve(data, url=vroom_url)

    
    # Create Total Assignment
    total_assignment = {}
    for k in range(0,len(vroom_output['routes'])):
        assignment = {}
        time = []
        route = []
        for i in vroom_output['routes'][k]["steps"]:
            route.append(i["location_index"])
            time.append(sec2time(i['arrival']))
            # if i["location_index"] == depot_idx:
            #     route.append("DP")
            # elif i["location_index"] > depot_idx:
            #     route.append("IP")
            # else:
            #     route.append(i["load"][0])
        route = [route[i] for i in range(len(route)) if i == 0 or route[i] != route[i - 1]]
        time = [time[i] for i in range(len(time)) if i == 0 or time[i] != time[i - 1]]
        assignment['time'] = time
        assignment['route'] = route
        total_assignment[fleet.loc[fleet["id"]==vroom_output['routes'][k]['vehicle'],"Name"].tolist()[0]] = assignment
    
    for v in total_assignment:
        cluster_nodes = total_assignment[v]['route']
        expanded = []
        for idx, cluster in enumerate(cluster_nodes):
            if cluster == depot_idx:
                expanded.append("DP")
            elif cluster == ip_idx:
                expanded.append("IP")
            else:
                if idx>0 and idx<len(cluster_nodes):
                    start = cluster_nodes[idx-1]
                    current = cluster_nodes[idx]
                    end = cluster_nodes[idx+1]
                    try:
                        locations = find_order_tsp(points, cluster_latlongs, querycar, start, current, end)
                    except Exception as e:
                        print(e)
                        locations = points[points["Network_Cluster"]==cluster]
                    expanded+=locations.id.tolist()
        total_assignment[v]["points_id"]= expanded

    unassigned= [ua for ua in vroom_output["unassigned"] if ua["type"] == "pickup"] 
    expanded = []
    for u in unassigned:
        locations = points[points["Network_Cluster"]==u['id']]
        expanded += locations.id.tolist()
    total_assignment["unassigned"] = {}
    total_assignment["unassigned"]["points_id"] = expanded

    points.set_index('id', inplace=True)
    fleet.set_index('id', inplace=True)
    vtypes.set_index('id', inplace=True)
    depots.set_index('id', inplace=True)
    ips.set_index('id', inplace=True)
    total_routes.set_index('id', inplace=True)
    
    # Create final final_output
    final_output = {}
    final_output["points"] = points.to_dict() 
    final_output["fleet"] = fleet.to_dict()
    final_output['vtypes'] = vtypes.to_dict()
    final_output["depots"] = depots.to_dict()
    final_output["ips"] = ips.to_dict()
    final_output["assignment"] = total_assignment
    final_output["total_routes"] = total_routes.to_dict()

    return final_output

def sec2time(seconds):
    hours = seconds // 3600
    remaining_seconds = seconds % 3600
    minutes = remaining_seconds // 60
    return '{:02d}:{:02d}'.format(hours,minutes)

def get_cluster_latlongs(cluster_latlongs, cluster_id):
    if cluster_id>=len(cluster_latlongs):
        return cluster_latlongs[-1]
    else:
        return cluster_latlongs[cluster_id]

def find_order_tsp(points, cluster_latlongs, querycar, prev_cluster, current_cluster,next_cluster):
    start = get_cluster_latlongs(cluster_latlongs, prev_cluster)
    end = get_cluster_latlongs(cluster_latlongs, next_cluster)
    locations = points.loc[points["Network_Cluster"]==current_cluster,"Node_Latlong"].tolist()
    if len(locations)>1:
        # print(prev_cluster,current_cluster,next_cluster)
        #create node list
        node_list = [start]+locations+[end]
        #generate distance matrix from node list
        dist_matrix, time_matrix = querycar.find_matrix(node_list)
        #run tsp
        r = run_tsp(dist_matrix)[0:-1] # remove the addition of startpoint and endpoint
        r = [n-1 for n in r]
        out = points.loc[points["Network_Cluster"]==current_cluster]
        out = out.reset_index().iloc[r]
    else:
        out = points.loc[points["Network_Cluster"]==current_cluster]
    return out