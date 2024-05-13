import requests
import numpy as np

class OsrmQuery:
    def __init__(self,endpoint_url:str, profile:str) -> None:
        self.endpoint = endpoint_url
        self.profile = profile

    def find_nearest(self, lat:float, lon:float):
        #https://project-osrm.org/docs/v5.24.0/api/#nearest-service

        coordinates = str(lon)+","+str(lat)
        nearest_url = "/nearest/v1/{profile}/{coordinates}.json?number={number}".format(profile = self.profile,
                                                                                        coordinates = coordinates,
                                                                                        number = 1)
        nearest_response = requests.get(self.endpoint+nearest_url)

        node_osmid = None
        lat_nn, lon_nn = None, None
        if nearest_response.status_code == 200:
            data = nearest_response.json()
            node_osmid = max(data["waypoints"][0]["nodes"])
            lon_nn, lat_nn = data["waypoints"][0]["location"]
        else:
            raise Exception(str(nearest_response.status_code),coordinates)
            # print("find_nearest",nearest_response.status_code)
        return node_osmid, (lat_nn, lon_nn)
    
    def find_route(self, startlat:float, startlon:float, endlat:float, endlon:float, u_turn_allowed = False):
        #https://project-osrm.org/docs/v5.24.0/api/#route-service

        if bool(u_turn_allowed) == 0:
            con_str = "true"
        else:
            con_str = "false"
        lat_lon_string = "{startlon},{startlat};{endlon},{endlat}".format(startlat = str(startlat),
                                                                          startlon = str(startlon),
                                                                          endlat = str(endlat),
                                                                          endlon = str(endlon))
        route_url = "/route/v1/{profile}/{lat_lon_string}?annotations=nodes&continue_straight={u_turn}&geometries=geojson&overview=full&alternatives=true".format(profile = self.profile,
                                                                                                                                 lat_lon_string = lat_lon_string,
                                                                                                                                 u_turn = con_str)
        route_response = requests.get(self.endpoint+route_url,verify=False)
        if route_response.status_code == 200:
            return route_response.json()
        else:
            print("find_route",route_response.status_code)
            return None
        
    def find_matrix(self,latlon_list):
        #https://project-osrm.org/docs/v5.24.0/api/#table-service

        for i in latlon_list:
            matrix_string = ""
            for a in latlon_list:
                matrix_string+=str(a[1])+","+str(a[0])+";"
            matrix_string = matrix_string.rstrip(";")
        matrix_url = "/table/v1/{profile}/{matrix_string}?annotations=distance,duration".format(profile = self.profile,
                                                                                                matrix_string = matrix_string)
        matrix_response = requests.get(self.endpoint + matrix_url)
        dist_array_osrm, time_array_osrm = None, None
        print(matrix_url)
        print(matrix_response.status_code)
        if matrix_response.status_code == 200:
            dist_array_osrm = np.array(matrix_response.json()['distances']).reshape(len(latlon_list),len(latlon_list)).astype('int32')
            time_array_osrm = (np.array(matrix_response.json()['durations'])/60).reshape(len(latlon_list),len(latlon_list)).astype('int32') #seconds to mins
        else:
            raise Exception(str(matrix_response.status_code))
        return dist_array_osrm, time_array_osrm

    def find_match(self, latlon_list):
        #https://project-osrm.org/docs/v5.5.1/api/#match-service
        
        for i in latlon_list:
            match_string = ""
            for a in latlon_list:
                match_string+=str(a[1])+","+str(a[0])+";"
            match_string = match_string.rstrip(";")
        match_url = "/match/v1/{profile}/{match_string}?steps=true&geometries=geojson&overview=full&annotations=false".format(profile = self.profile,
                                                                                                                             match_string = match_string)

        match_response = requests.get(self.endpoint + match_url)
        
        if match_response.status_code == 200:
            return match_response.json()
        else:
            print("match_route",match_response.status_code)
            return None

    def find_trip(self):
        pass

