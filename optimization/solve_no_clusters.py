from query_vroom import *
from query_osrm import OsrmQuery
import pandas as pd
import numpy as np
import json
from clustering import DBScanClusterer

# with open(r"C:\Users\clement.lork\Documents\Sembwaste_Routing\swm_route_optimization\azure_repos\admin_frontend\data_test.json") as f:
#   data = json.loads(f.read())

def solve_nocluster(data):
    data["vehicleTypes"] = [{'id' : 0,'Name' : "4x2",
        'Capacity' : 8000,
        'Range' : 300000},
        {'id' : 1,
        'Name' : "6x4",
        'Capacity' : 12000,
        'Range' : 300000},
        {'id' : 2,
        'Name' : "8x2",
        'Capacity' : 16000,
        'Range' : 300000}
    ]

    solverConfig = data["solverConfig"]
    points = data["pointsToAssign"]
    fleet = data["vehiclesInvolved"]
    routes = data["routesInvolved"]
    vtypes = data['vehicleTypes']

    solverConfig["useClusters"] = False

    points = pd.DataFrame.from_dict(points)
    fleet = pd.DataFrame.from_dict(fleet)
    routes = pd.DataFrame.from_dict(routes)
    vtypes = pd.DataFrame.from_dict(vtypes)

    endpoint = "http://localhost:5001"
    querycar = OsrmQuery(endpoint, 'car')

    vtypes2str = dict(zip(vtypes.id.tolist(),vtypes.Name.tolist()))
    vtypes2id = dict(zip(vtypes.Name.tolist(),vtypes.id.tolist()))

    # convert Vehicle_Type back to string
    fleet["Vehicle_Type"] = fleet["Vehicle_Type"].apply(lambda x: vtypes2str[x])

    # check if a vehicle is servicing point.route_id, if true set allowed vehicle as the vehicle id

    rid2vid = dict(zip(fleet.Route_ID.tolist(),fleet.id.tolist()))
    vt2vid = dict(zip(fleet.Vehicle_Type.tolist(),fleet.id.tolist()))

    vt2vid  = {}

    for idx, vtype in enumerate(fleet['Vehicle_Type']):
        if vtype not in vt2vid :
            vt2vid[vtype] = []
            vt2vid[vtype].append(fleet["id"][idx])
        else:
            vt2vid[vtype].append(fleet["id"][idx])
    # print(vt2vid)

    vehicle_skills = {}
    for vid in fleet.id:
        vehicle_skills[vid] = []

    for idx, p in points.iterrows():
        # if route_id of points is inside vehicle, append p.id to vehicle
        rid = p["Route_ID"]
        allowed_veh = []
        if rid in rid2vid.keys():
            vid = rid2vid[rid]
            vehicle_skills[vid].append(p['id'])
            points.loc[idx,"Allowed_Veh"] = str(vid)
        else:
            # if vehicles does not have assigned routes, fall back to checking vehicle_type_allowed tags
            allowed_veh_list = []
            for vt in p["Vehicle_Type_Allowed"].split(","):
                if vt in vt2vid.keys():
                    allowed_veh_list += [str(i) for i in vt2vid[vt]]
                    for vid in vt2vid[vt]:
                        vehicle_skills[vid].append(p['id'])
            allowed_veh = ",".join(allowed_veh_list)
            points.loc[idx,"Allowed_Veh"] = allowed_veh

    points["Allowed_Veh"].unique()

    cluster_midpoints = list(zip(points["Lat_User"].tolist(), points["Long_User"].tolist()))

    tuas_osmid, tuas_latlong = querycar.find_nearest(1.33469, 103.64579)
    ip_osmid, ip_latlong = querycar.find_nearest(1.29607, 103.62173)
    work_timewindows = [7*60*60,24*60*60]

    cluster_latlongs = cluster_midpoints.copy()
    cluster_latlongs.append(tuas_latlong)
    # print("tuas@",len(cluster_latlongs)-1)
    depot_idx = len(cluster_latlongs)-1
    cluster_latlongs.append(ip_latlong)
    # print("ip@",len(cluster_latlongs)-1)
    ip_idx = len(cluster_latlongs)-1

    dist_matrix, time_matrix = querycar.find_matrix(cluster_latlongs)
    time_matrix = time_matrix*60
    # time_matrix[0:500,500] = time_matrix[0:500,500]+10*60*60
    # time_matrix[500,0:500] = time_matrix[500,0:500]+10*60*60

    dist_matrix = dist_matrix.astype("int64").tolist()
    time_matrix = time_matrix.astype("int64").tolist()

    vehicles = []
    for idx, veh in fleet.iterrows():
        v = Vehicle(veh['id'], 'car', 
                    start =None, start_index=int(depot_idx), 
                    end =None, end_index=int(depot_idx), 
                    capacity=[int(veh["vehicleCapacity"])], costs=None,
                    skills = vehicle_skills[veh['id']],
                    time_window=[7*60*60,18*60*60], max_tasks=None,
                    max_travel_time=None,
                    max_distance=300000).to_dict()
        vehicles.append(v)

    cluster_load = points["Tonnage_kg"].tolist()
    cluster_service_time = points["Service_Time_min"].tolist()
    cluster_tw = list(zip(points["Min_Collection_Time_hrs"].tolist(), points["Max_Collection_Time_hrs"]))

    shipments = []
    for idx in range(0,len(cluster_midpoints)):
        amount = [cluster_load[idx]]
        skills = [points.iloc[idx]['id']]
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


    data = sendData(jobs=[],shipments=shipments,vehicles=vehicles,matrices=matrix).to_dict()
    data = json.dumps(data, indent=2, default=int)
    data = json.loads(data)
    output = solve(data)

    return output