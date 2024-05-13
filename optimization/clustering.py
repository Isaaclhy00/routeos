import pandas as pd
import numpy as np
from sklearn.cluster import DBSCAN
from query_osrm import OsrmQuery
from tqdm import tqdm
import matplotlib
import folium
import json
from shapely.geometry import Polygon, Point
import geopandas as gpd

class DBScanClusterer:
    def __init__(self, points:pd.DataFrame, osrm_query:OsrmQuery):
        self.points = points
        ### prep data to find dist_matrix between locations and store 
        self.osrm_query = osrm_query
        osmid_list = []
        location_list = [] 
        for idx, row in tqdm(points.iterrows(), total=points.shape[0]):
            osmid, location = osrm_query.find_nearest(row['Lat_User'], row["Long_User"])
            osmid_list.append(osmid)
            location_list.append(location)
        self.points["Node_Osmid"] = osmid_list
        self.points["Node_Latlong"] = location_list
        self.points["User_LongLat"] = list(zip(self.points['Long_User'].tolist(),self.points['Lat_User'].tolist()))
        dist_array_osrm, time_array_osrm = self.osrm_query.find_matrix(location_list)
        self.dist_matrix = dist_array_osrm
        self.poly_coords = None
        
    
    def poly_cluster(self, polygon_filepath:str):
        points = self.points.copy()

        with open(polygon_filepath) as f:
            ### load list of polygon in lat,lon format
            self.poly_coords = json.load(f)
        
        # convert poly coords into shapely Polygon
        poly2 = gpd.GeoSeries([Polygon([[c[1], c[0]] for c in coords]) for coords in self.poly_coords])
        # convert each collection points coords into shapely Point and check for inclusion in each Polygon
        def find_cluster(x):
            val = poly2.loc[poly2.contains(Point(x[0],x[1]))].index.values.tolist()
            if len(val)>0:
                return val[0]
            else:
                return -1
        points["Poly_Cluster"] = points["User_LongLat"].apply(lambda p: find_cluster(p))
        # reconvert the each selcted polygon_id from random numbers to sorted numbers from 0
        self.poly_unique_list = sorted(points["Poly_Cluster"].unique().tolist())
        points["Network_Cluster"] =  points["Poly_Cluster"].apply(lambda x: self.poly_unique_list.index(x))
        self.points = points
        return points
        
    def dbs_cluster(self, eps=400, min_samples=1):
        ### clustering of points, eps is the range of the cluster
        points = self.points.copy()
        db = DBSCAN(eps=eps, min_samples=min_samples, metric='precomputed')
        cluster_labels = db.fit_predict(self.dist_matrix)
        print("Clusters assigned are:", set(db.labels_))
        nodes_unique = self.points['Node_Osmid']
        node_clusters = {node:label for node, label in zip(nodes_unique.index, cluster_labels)}
        points['Network_Cluster'] = nodes_unique.index.map(lambda x: node_clusters[x])
        self.points = points
        return points
    
    def _find_veh_overlap(self, vehtypes):
        # vehtypes is already checked to be >1
        intersection = set.intersection(*[set(vehs.split(",")) for vehs in vehtypes])
        if len(intersection)==0:
            #raise ValueError("No intersection for vehtype in subcluster, please set vehicle split to True")
            print('There is no intersection, reverting to splitting cluster by vehicle')
            return None
        else:
            veh_str = ""
            for veh in intersection:
                veh_str+=str(veh)+","
            return veh_str.rstrip(",")

    
    def split_by_vehicle(self, split = True, veh_key = "Vehicle_Type_Allowed"):
        points = self.points.copy()
        print("before vehicle split clusters", len(points["Network_Cluster"].unique()), "split", split)
        points["Network_Vehicle_Type_Allowed"] = points[veh_key]
        for i in points["Network_Cluster"].unique():
            subcluster = points[points["Network_Cluster"]==i]
            # for subclusters with more than 1 location, split locations via vehicle types
            if len(subcluster)>1 and len(subcluster[veh_key].unique()) > 1:
                unique_vehtype = subcluster[veh_key].unique().tolist()
                # get current max index --> new clusters will be last cluster number + 1
                max_clusters = len(points["Network_Cluster"].unique())-1
                if split == True:
                    for idx,row in subcluster.iterrows():
                        uv_index = unique_vehtype.index(row[veh_key])
                        if uv_index >= 1:
                            points.loc[idx,"Network_Cluster"] = max_clusters+uv_index
                            points.loc[idx,"Network_Vehicle_Type_Allowed"] = row[veh_key]
                if split == False:
                    intersection = self._find_veh_overlap(unique_vehtype)
                    if intersection !=  None:
                        for idx,row in subcluster.iterrows():
                            points.loc[idx,"Network_Vehicle_Type_Allowed"] = intersection
                    else:
                        for idx,row in subcluster.iterrows():
                            uv_index = unique_vehtype.index(row[veh_key])
                            if uv_index >= 1:
                                points.loc[idx,"Network_Cluster"] = max_clusters+uv_index
                                points.loc[idx,"Network_Vehicle_Type_Allowed"] = row[veh_key]
                        
        print("after vehicle split clusters", len(points["Network_Cluster"].unique()))
        self.points = points
        return self.points
    
    def _find_timing_overlap(self, intervals):
        ### helper function to split timing into other clusters if there is no timing overlap
        sorted_intervals = sorted(intervals, key=lambda x: x[0])
        clusters = []
        current_cluster = [sorted_intervals[0]]
        interval_cluster = {sorted_intervals[0]: 0}

        for interval in sorted_intervals[1:]:
            if interval[0] <= current_cluster[-1][1]:
                current_cluster.append(interval)
                interval_cluster[interval] = len(clusters)
            else:
                clusters.append(current_cluster)
                current_cluster = [interval]
                interval_cluster[interval] = len(clusters)

        clusters.append(current_cluster)

        cluster_group = {}
        cluster_time = {}

        for idx,cluster in enumerate(clusters):
            cluster_start = max(interval[0] for interval in cluster)
            cluster_end = min(interval[1] for interval in cluster)
            overlap_region = (cluster_start, cluster_end)
            cluster_group[idx] = cluster
            cluster_time[idx] = overlap_region

        return interval_cluster, cluster_group, cluster_time

        ### test_find_timing_overlap()
        # intervals = [(1, 3), (2, 4), (5, 7), (6, 8)]
        # interval_cluster, cluster_group, cluster_time = find_timing_overlap(intervals)
        # interval_cluster, cluster_group, cluster_time
    
    def split_by_timing(self, find_overlaps=True):
        points = self.points.copy()
        print("before timing split clusters", len(points["Network_Cluster"].unique()))
        points["User_Timing"] = list(zip(points["Min_Collection_Time_hrs"].tolist(), points["Max_Collection_Time_hrs"].tolist()))
        points["Cluster_Start"] = points["Min_Collection_Time_hrs"].tolist()
        points["Cluster_End"] = points["Max_Collection_Time_hrs"].tolist()

        for i in points["Network_Cluster"].unique():
            subcluster = points[points["Network_Cluster"]==i]
            # for subclusters with more than 1 location, check for overlaps in timing, if no overlaps, split into different clusters
            if len(subcluster)>1 and len(subcluster["User_Timing"].unique())>1:
                intervals = subcluster["User_Timing"].unique().tolist()
                max_clusters = len(points["Network_Cluster"].unique())-1
                if find_overlaps == True:
                    interval_cluster, cluster_group, cluster_time = self._find_timing_overlap(intervals)
                    for idx,row in subcluster.iterrows():
                        # update cluster start/end --> if there are more subcluster, increase number of clusters
                        start, end = cluster_time[interval_cluster[row["User_Timing"]]]
                        timing_cluster = interval_cluster[row["User_Timing"]]
                        points.loc[idx,"Cluster_Start"] = start
                        points.loc[idx,"Cluster_End"] = end
                        if timing_cluster>=1:
                            points.loc[idx,"Network_Cluster"] = max_clusters+timing_cluster
                if find_overlaps == False:
                    for idx,row in subcluster.iterrows():
                        ut_index = intervals.index(row["User_Timing"])
                        start, end = row["User_Timing"]
                        points.loc[idx,"Cluster_Start"] = start
                        points.loc[idx,"Cluster_End"] = end
                        if ut_index >= 1:
                            points.loc[idx,"Network_Cluster"] = max_clusters+ut_index

        self.points = points
        print("after timing split clusters", len(points["Network_Cluster"].unique()))
        return self.points
    
    def split_by_old_clusters(self):
        points = self.points.copy()
        print("before split old clusters", len(points["Network_Cluster"].unique()))
        points["Old_Cluster"] = points['Route_ID']+"_"+points['Average Collection Time (from Geotab)'].apply(lambda x: str(x))
        for i in points["Network_Cluster"].unique():
            subcluster = points[points["Network_Cluster"]==i]
            # for subclusters with more than 1 location, split locations via vehicle types
            if len(subcluster)>1 and len(subcluster["Old_Cluster"].unique()) > 1:
                unique_cluster = subcluster["Old_Cluster"].unique().tolist()
                # get current max index --> new clusters will be last cluster number + 1
                max_clusters = len(points["Network_Cluster"].unique())-1
                for idx,row in subcluster.iterrows():
                    uv_index = unique_cluster.index(row["Old_Cluster"])
                    if uv_index >= 1:
                        points.loc[idx,"Network_Cluster"] = max_clusters+uv_index
        self.points = points
        print("after split old clusters",  len(points["Network_Cluster"].unique()))
        return self.points
    
    def split_by_manpower(self):
        points = self.points.copy()
        print("before split by manpower", len(points["Network_Cluster"].unique()))
        for i in points["Network_Cluster"].unique():
            subcluster = points[points["Network_Cluster"]==i]
            if len(subcluster)>1 and len(subcluster['No. of crew needed (including drivers)'].unique())>1:
                unique_cluster = subcluster['No. of crew needed (including drivers)'].unique().tolist()
                max_clusters = len(points["Network_Cluster"].unique())-1
                for idx,row in subcluster.iterrows():
                    uv_index = unique_cluster.index(row['No. of crew needed (including drivers)'])
                    if uv_index>=1:
                        points.loc[idx,"Network_Cluster"] = max_clusters+uv_index
        self.points=points
        print("after split by manpower",  len(points["Network_Cluster"].unique()))
        return self.points
    
    def split_by_column_condition(self, column, column_condition, tonnage_threshold=5000, eps = 50):
        points = self.points.copy()
        print("before split by condition", len(points["Network_Cluster"].unique()))
        for i in points["Network_Cluster"].unique():
            subcluster = points[(points["Network_Cluster"]==i)&(points[column]==column_condition)]
            if len(subcluster)>1 and subcluster['Average Tonnage Collected (from Geotab)'].sum()>tonnage_threshold:
                max_clusters = len(points["Network_Cluster"].unique())-1
                dist_array_osrm, time_array_osrm = self.osrm_query.find_matrix(subcluster["Node_Latlong"].tolist())
                db = DBSCAN(eps=eps, min_samples=1, metric='precomputed')
                cluster_labels = db.fit_predict(dist_array_osrm)
                nodes_unique = subcluster['Node_Osmid']
                node_clusters = {node:label for node, label in zip(nodes_unique.index, cluster_labels)}
                subcluster['subNetwork_Cluster'] = nodes_unique.index.map(lambda x: node_clusters[x])
                for idx, row in subcluster.iterrows():
                    if row["subNetwork_Cluster"] >= 1:
                        points.loc[idx,"Network_Cluster"] = max_clusters+row["subNetwork_Cluster"] 
        self.points = points
        print("after split by condtion",column,'==',column_condition, len(points["Network_Cluster"].unique()))
        return self.points

    def split_by_tonnage(self, tonnage_threshold=5000 , eps = 50):
        points = self.points.copy()
        print("before split by tonnage", len(points["Network_Cluster"].unique()))
        for i in points["Network_Cluster"].unique():
            subcluster = points[points["Network_Cluster"]==i]
            if len(subcluster)>1 and subcluster['Tonnage_kg'].sum()>tonnage_threshold:
                max_clusters = len(points["Network_Cluster"].unique())-1
                dist_array_osrm, time_array_osrm = self.osrm_query.find_matrix(subcluster["Node_Latlong"].tolist())
                
                db = DBSCAN(eps=eps, min_samples=1, metric='precomputed')
                cluster_labels = db.fit_predict(dist_array_osrm)
                nodes_unique = subcluster['Node_Osmid']
                node_clusters = {node:label for node, label in zip(nodes_unique.index, cluster_labels)}
                subcluster['subNetwork_Cluster'] = nodes_unique.index.map(lambda x: node_clusters[x])
                for idx, row in subcluster.iterrows():
                    if row["subNetwork_Cluster"] >= 1:
                        points.loc[idx,"Network_Cluster"] = max_clusters+row["subNetwork_Cluster"] 
        self.points = points
        print("after split by tonnage", len(points["Network_Cluster"].unique()))
        return self.points

    def split_by_tonnage_recursive(self, tonnage_threshold=11000, initial_eps = 1000, descent=100, column=None,condition=None):
        eps = initial_eps
        if column != None and condition != None:
            print(column,condition)
            while max(self.points.loc[self.points["Manpower"] == 3, :].groupby(["Network_Cluster"])['Tonnage_kg'].sum())  > tonnage_threshold:
                print("split by tonnage recursive eps@",eps)
                self.points = self.split_by_column_condition(column,condition,tonnage_threshold=tonnage_threshold,eps=eps)
                eps -= descent
        else:
            while max(self.points.groupby(["Network_Cluster"])['Tonnage_kg'].sum())  > tonnage_threshold:
                print("split by tonnage recursive eps@",eps)
                self.points = self.split_by_tonnage(tonnage_threshold=tonnage_threshold,eps=eps)
                eps -= descent
        return self.points
    
    def find_cluster_characteristics(self):
        points = self.points.copy()
        cluster_midpoints = []
        cluster_load = []
        cluster_tw = []
        cluster_restrictions = []
        cluster_waiting_time = []
        cluster_manpower = []
        # cluster_landed_tonnage = []

        for i in range(len(points["Network_Cluster"].unique())):
            subcluster = points[points["Network_Cluster"]==i]
            avg_latitude = subcluster["Lat_User"].mean()
            avg_longitude = subcluster["Long_User"].mean()
            osmid, location = self.osrm_query.find_nearest(avg_latitude, avg_longitude)
            cluster_midpoints.append(location)
            load = subcluster["Tonnage_kg"].sum()
            cluster_load.append(load)
            cluster_start = subcluster["Cluster_Start"].mean()
            cluster_end = subcluster["Cluster_End"].mean()
            cluster_tw.append((int(cluster_start),int(cluster_end)))
            cluster_restrictions.append(subcluster['Network_Vehicle_Type_Allowed'].to_list()[0])
            
            cluster_waiting_time.append(subcluster["Service_Time_min"].sum() + (1 if len(subcluster)>1 else 0) ) # add travel time between clusters
            cluster_manpower.append(subcluster['Manpower'].max())
            # cluster_landed_tonnage.append(subcluster[points['Manpower']==3]["Tonnage_kg"].sum())

        self.cluster_midpoints, self.cluster_load, self.cluster_tw, self.cluster_restrictions, self.cluster_waiting_time, self.cluster_manpower = cluster_midpoints, cluster_load, cluster_tw, cluster_restrictions, cluster_waiting_time, cluster_manpower
        return cluster_midpoints, cluster_load, cluster_tw, cluster_restrictions, cluster_waiting_time, cluster_manpower
        
    
    def plot_cluster_results(self, points, cluster_midpoints, cluster_load, cluster_tw, cluster_restrictions, cluster_manpower, 
                             show=True, veh_key="Vehicle_Type_Allowed",polt_selected_poly=True):
        # get points colormap
        # points = self.points
        # cluster_midpoints, cluster_load, cluster_tw, cluster_restrictions = self.cluster_midpoints, self.cluster_load, self.cluster_tw, self.cluster_restrictions
        cmap = matplotlib.colormaps['hsv']
        point_colors = [matplotlib.colors.rgb2hex(cmap(c)) for c in points['Network_Cluster']/max(points['Network_Cluster'])]
        
        # map_ = folium.Map(location=(1.3113119, 103.843098), zoom_start=12, tiles="CartoDB Positron")
        map_ = folium.Map(location=(1.3113119, 103.843098), zoom_start=12, tiles=None)
        folium.TileLayer("cartodb positron").add_to(map_)

        if self.poly_coords!=None:
            if polt_selected_poly==True:
                poly_unique_list = [str(i) for i in self.poly_unique_list.copy()]
                poly_unique_list.remove("-1")
                poly_coords = [self.poly_coords[int(i)] for i in poly_unique_list]
            else:
                poly_coords = self.poly_coords.copy()
            poly_layer = folium.FeatureGroup(name="Polygon_Layer", show=True).add_to(map_)
            for coords in poly_coords:
                geojson_data = {
                    "type": "Polygon",
                    "coordinates": [[[c[1], c[0]] for c in coords]]  # Wrap your coordinates in an additional list
                }
                folium.GeoJson(
                    data=geojson_data,
                    highlight_function=lambda feature: {
                                "fillColor": 'yellow',
                                "color": 'yellow',
                                "weight": 0.1,
                            }  # Set the fill color to blue
                ).add_to(poly_layer)

        for j in sorted(points["Network_Cluster"].unique()):
            street = points.loc[points["Network_Cluster"]==j,"Street"].tolist()[0]
            route_layer = folium.FeatureGroup(name="Cluster "+str(j)+" "+street, show=True).add_to(map_)
            folium.CircleMarker(location=cluster_midpoints[j], popup="Cluster_"+str(j)+"_"+str(cluster_load[j])+"_"+str(cluster_tw[j])+"_"+str(cluster_restrictions[j])+"_"+str(cluster_manpower[j]), color="black", fill=True, radius=15, opacity=0.3).add_to(route_layer)
            points1 = points.loc[points["Network_Cluster"]==j,:]


            for idx in points1.index:
                folium.CircleMarker(location=points.loc[idx,"Node_Latlong"], popup=str(points.loc[idx,"Network_Cluster"])+"-"+str(points.loc[idx,"House"])+"_"+str(points.loc[idx,"Street"])+"_"+str(idx)+"_"+str(points.loc[idx,veh_key])+"_"+str(points.loc[idx,'Average Tonnage Collected (from Geotab)']), color=point_colors[idx], fill=True, radius=5).add_to(route_layer)

        folium.LayerControl().add_to(map_)
        
        return map_