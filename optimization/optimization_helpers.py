import numpy as np
from tsp import run_tsp
import folium
import matplotlib

def min2time(minutes):
    return '{:02d}:{:02d}'.format(*divmod(minutes, 60))

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
        print(prev_cluster,current_cluster,next_cluster)
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

def append_csv(csv_data,sn,arrival_time,departure_time,house,street,premises,load,remarks,veh_constraints,timing_constraints,latlong,manpower,stop_time,travel_time):
    csv_data["SN"].append(sn)
    csv_data["Earliest_Arrival_Time"].append(arrival_time)
    csv_data["Latest_Departure_Time"].append(departure_time)
    csv_data["House"].append(house)
    csv_data["Street"].append(street)
    csv_data["Premises"].append(premises)
    csv_data["Estimated_Load"].append(load)
    csv_data["Remarks"].append(remarks)
    csv_data["Vehicle_Constraints"].append(veh_constraints)
    csv_data["Timing_Constraints"].append(timing_constraints)
    csv_data["Latlong"].append(latlong)
    csv_data["Manpower"].append(manpower)
    csv_data["Estimated_Stop_Time"].append(stop_time)
    csv_data["Estimated_Travel_Time"].append(travel_time)
    return csv_data

#### Plot map helpers

# Add arrows along the PolyLine to indicate direction
def add_arrows(m, line, color='black', size=10):
    locations = line.locations
    latitudes, longitudes = zip(*locations)

    for i in range(0,len(latitudes) - 1,5):
        arrow = folium.Marker(
            location=[latitudes[i], longitudes[i]],
            icon=folium.DivIcon(
                icon_size=(size, size),
                icon_anchor=(size / 2, size / 2),
                html='<div style="font-size: {}px; color: {}; transform: rotate({}deg);">&#10148;</div>'.format(
                    size, color, calculate_bearing(latitudes[i], longitudes[i], latitudes[i+1], longitudes[i+1])
                )
            )
        )
        arrow.add_to(m)

# Function to calculate bearing between two points
def calculate_bearing(lat1, lon1, lat2, lon2):
    delta_lon = lon2 - lon1
    y = np.sin(np.radians(delta_lon)) * np.cos(np.radians(lat2))
    x = np.cos(np.radians(lat1)) * np.sin(np.radians(lat2)) - \
        np.sin(np.radians(lat1)) * np.cos(np.radians(lat2)) * np.cos(np.radians(delta_lon))
    initial_bearing = np.arctan2(y, x)
    compass_bearing = (np.degrees(initial_bearing) + 270) % 360
    return compass_bearing

def find_route(start,end):
    route_response = querycar.find_route(start[0],start[1],end[0],end[1],u_turn_allowed=True)
    routeLonLats = route_response["routes"][0]["geometry"]["coordinates"]
    routeLatLons = [item[::-1] for item in routeLonLats]
    dist = route_response["routes"][0]["distance"]
    time = int(np.ceil(route_response["routes"][0]["duration"]/60))
    return routeLatLons, dist, time

def plot_map(csv_data, points, cluster_midpoints, cluster_load, cluster_tw, cluster_restrictions, color="blue"):
    distance = 0
    csv_data["Estimated_Distance"] = None
    map_center = [1.281651,103.829894]
    map_ = folium.Map(location=map_center, zoom_start=12, tiles=None)
    folium.TileLayer("cartodb positron").add_to(map_)

    cmap = matplotlib.colormaps['hsv']
    point_colors = [matplotlib.colors.rgb2hex(cmap(c)) for c in points['Network_Cluster']/max(points['Network_Cluster'])]
    
    for j in points["Network_Cluster"].unique():
            folium.CircleMarker(location=cluster_midpoints[j], popup="Cluster_"+str(j)+"_"+str(cluster_load[j])+"_"+str(cluster_tw[j])+"_"+str(cluster_restrictions[j]), color="black", fill=True, radius=15, opacity=0.3).add_to(map_)

    for idx in points.index:
        folium.CircleMarker(location=points.loc[idx,"Node_Latlong"], popup=str(points.loc[idx,"Network_Cluster"])+"-"+str(points.loc[idx,"House"])+"_"+str(points.loc[idx,"Street"])+"_"+str(idx)+"_"+str(points.loc[idx,'Vehicle_Type_Allowed'])+"_"+str(points.loc[idx,'Tonnage_kg']), color=point_colors[idx], fill=True, radius=5).add_to(map_)
    
    for i in range(0,len(csv_data.index)-1):
        
        print(str(i)+"-"+str(csv_data.iloc[i]["House"])+"_"+str(csv_data.iloc[i]["Street"])+"-"+str(csv_data.iloc[i+1]["House"])+"_"+str(csv_data.iloc[i+1]["Street"]))
        route_name = str(csv_data.loc[i,"SN"])+"-"+str(csv_data.loc[i+1,"SN"])
        route_layer = folium.FeatureGroup(name=route_name+" "+str(csv_data.iloc[i]["House"])+"_"+str(csv_data.iloc[i]["Street"])+"-"+str(csv_data.iloc[i+1]["House"])+"_"+str(csv_data.iloc[i+1]["Street"]), show=False).add_to(map_)
        routeLatLons, dist, time = find_route(csv_data.iloc[i]['Latlong'],csv_data.iloc[i+1]['Latlong'])
        csv_data.loc[i,"Estimated_Travel_Time"] = time
        csv_data.loc[i,"Estimated_Distance"] = round(dist)
        distance += dist 
        if routeLatLons==None:
            pass
        else:
            path = folium.PolyLine(routeLatLons,color=color,popup="dist:"+str(dist)+"_time:"+str(time)).add_to(route_layer)
            add_arrows(route_layer, path)
        #map_.add_child(route_layer)
    print("Total_distance_taken:",distance)

    folium.LayerControl().add_to(map_)
    return map_, distance, csv_data

