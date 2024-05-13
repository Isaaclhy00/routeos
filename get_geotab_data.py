import pandas as pd
from geotab_analysis import GTabAnalysis
 
def get_vid(route_id, fleet_data):
    return fleet_data["vehicle_id"][fleet_data["route_id"].index(route_id)]
 
def nearest_tonnage_gps_index(gps, dt, column='latitude'):
    # return index only
    return gps.loc[(gps["dateTime"] - dt).abs().argsort()[0], column]

def get_trip_and_cps(vehicle_id, start_date, end_date):
    cluster_midpoints = []
    gta = GTabAnalysis()
    deviceID = gta.get_deviceID(vehicle_id=vehicle_id)
    start_gmt = f"{start_date}T06:00:00.000Z"
    end_gmt = f"{end_date}T22:00:00.000Z"
    start_utc = gta.shift_time(start_gmt, hours=-8)
    end_utc = gta.shift_time(end_gmt, hours=-8)
    
    gps = gta.get_gps_tonnage(deviceID, start_utc, end_utc)
    gps_included = gta.find_trip(gps, distance_threshold=5000, timing_threshold=20, speed_threshold=0, cluster_eps=3, cluster_min_samples=5)

    # Group by date
    gps_included['dateTime_gmt'] = pd.to_datetime(gps_included['dateTime_gmt'], unit='ms')
    grouped_by_day = gps_included.groupby(gps_included['dateTime_gmt'].dt.date)
    for date, group in grouped_by_day:
        for c in group["clusters"].unique():
            lat = group.loc[group["clusters"]==c,"latitude"].mean()
            lon = group.loc[group["clusters"]==c,"longitude"].mean()
            cluster_midpoints.append({'date': str(date), 'latitude': lat, 'longitude': lon})
    return pd.DataFrame(cluster_midpoints).to_json(orient='records')