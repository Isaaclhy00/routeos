import mygeotab
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
import requests
from sklearn.cluster import DBSCAN

class GTabAnalysis:

    def __init__(self, username='clement.lork@sembcorp.com', password='Password1014', database='sembwaste_pte_ltd'):
        self.client = mygeotab.API(username=username, password=password, database=database)
        self.client.authenticate()

    def shift_time(self, time_string, hours=-8):
        # Convert the input string to a datetime object
        og_time = datetime.strptime(time_string, "%Y-%m-%dT%H:%M:%S.%fZ")

        # Define the time difference between GMT+8 and UTC (8 hours)
        offset = timedelta(hours=hours)

        # Subtract the GMT+8 offset to get the UTC time
        output_time = og_time + offset

        output_time = output_time.strftime("%Y-%m-%dT%H:%M:%S.%fZ")

        return output_time
    
    def get_deviceID(self, vehicle_id='XE6131E'):
        devices = self.client.get('Device', name=vehicle_id)
        deviceID = devices[0]['id']
        return deviceID

    def get_gps_tonnage(self, deviceID, start_utc="2024-01-15T06:00:00.000Z", end_utc= "2024-01-15T22:00:00.000Z", timezone=8):
        ### get gps trace for trip
        logsearch={
        "deviceSearch": {
            "id": deviceID,
        },
        "fromDate": start_utc,
        "toDate": end_utc
        }

        ### get latlong for trip
        gps = self.client.get("LogRecord", search=logsearch)

        gps = pd.DataFrame(gps)

        ### convert from UTC to GMT+timezone
        gps["dateTime_gmt"] = gps["dateTime"].apply(lambda x: x + timedelta(hours=timezone))
    
        return gps
    
    def get_tonnage(self, deviceID, start_utc="2024-01-15T06:00:00.000Z", end_utc= "2024-01-15T22:00:00.000Z", timezone=8):
        ### get tonnage for trip
        tsearch={
            "deviceSearch": {
                "id": deviceID,
            },
            "diagnosticSearch": {
                "id": "apm2qliOZQkqgIVZW8e20GA"
            },
            "fromDate": start_utc,
            "toDate": end_utc
        }
        tonnage = self.client.get('StatusData',search=tsearch)

        tonnage = pd.DataFrame(tonnage)

        ### convert tonnage from grams to kg
        tonnage["data"] = tonnage["data"]/1000
        ### convert from UTC to GMT+timezone
        tonnage["dateTime_gmt"] = tonnage["dateTime"].apply(lambda x: x + timedelta(hours=timezone))

        return tonnage
    
    def distance_matrix_haversine(self, latitudes, longitudes):
        ### takes in a list of lat, longs and compute haversine distances matrix in meters

        # Convert latitude and longitude arrays to radians
        lat_radians = np.radians(latitudes)
        lon_radians = np.radians(longitudes)

        # Reshape arrays for broadcasting
        lat_radians = lat_radians.reshape(-1, 1)
        lon_radians = lon_radians.reshape(-1, 1)

        # Calculate differences
        dlat = lat_radians - lat_radians.T
        dlon = lon_radians - lon_radians.T

        # Haversine formula
        a = np.sin(dlat / 2) ** 2 + np.cos(lat_radians) * np.cos(lat_radians.T) * np.sin(dlon / 2) ** 2
        c = 2 * np.arcsin(np.sqrt(a))

        # Radius of earth in kilometers is 6371  --> return distances in meters
        distances = 6371*1000 * c
        return distances
    
    def address_lookup_osm(self, address):
    # Define the base URL for the OSM Nominatim API
        base_url = "https://nominatim.openstreetmap.org/search"

        # Define query parameters
        params = {
            "q": address,           # The address you want to look up
            "format": "json",       # Response format (JSON)
            "addressdetails": 1     # Include detailed address information
        }

        try:
            # Send a GET request to the OSM Nominatim API
            response = requests.get(base_url, params=params, verify=False)

            # Check if the request was successful
            if response.status_code == 200:
                # Parse the JSON response
                data = response.json()
                # print(data)
                if data != []:            
                    return data[0]['lat'], data[0]['lon'], data[0]['display_name']
            else:
                return None, None, None
        except Exception as e:
            print(e)
            return None, None, None
    
    def find_trip(self, gps, distance_threshold=6000, timing_threshold=20, speed_threshold=0, cluster_eps=50, cluster_min_samples=3):
        ### assume IP and depot and close together and are some distances from collection points
        gps["dist_from_DP"] = self.distance_matrix_haversine(gps.loc[:,'latitude'].tolist(),gps.loc[:,'longitude'].tolist())[0,:]

        ### cluster stop points to find out collection points (assume speed =0 at stop points)
        sub_gps = gps.loc[gps["speed"]<=speed_threshold,:]
        dist_matrix = self.distance_matrix_haversine(sub_gps["latitude"].tolist(), sub_gps["latitude"].tolist())
        dbscan = DBSCAN(eps=cluster_eps, min_samples=cluster_min_samples, metric='precomputed')
        clusters = dbscan.fit_predict(dist_matrix)

        ### those points without clusters are labelled as -1
        gps["clusters"] = -1
        sub_gps["clusters"]=clusters

        for idx, row in sub_gps.iterrows():
            gps.loc[idx,'clusters'] = row['clusters']

        gps_included = gps.loc[(gps["clusters"]!=-1) & (gps["dist_from_DP"]>distance_threshold),:]

        ### find out points in each trip by clustering timing
        # convert dateTime object to seconds
        time_1d = np.array(gps_included['dateTime'].astype(np.int64)// 10**9).reshape(-1,1)
        dbscan_time = DBSCAN(eps=60*timing_threshold, min_samples=5)
        time_clusters = dbscan_time.fit(time_1d).labels_
        gps_included["trip_cluster"] = time_clusters
        
        return gps_included
        # ### iterate through trips, find midpoints and addresses
        # time_clusters_unique = np.unique(gps_included.loc[gps_included['trip_cluster']!=-1,"trip_cluster"]).tolist()

        # trips = []

        # for i in time_clusters_unique:
        #     sub_cluster = gps_included.loc[gps_included['trip_cluster']==i,:]
        #     for k in np.unique(sub_cluster["clusters"]):
        #         lat = sub_cluster

        


