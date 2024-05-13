import requests
import json
from typing import List, Dict, Tuple

# url = "http://localhost:3000"

# headers = {
#     "Content-Type": "application/json"
# }


# data = {
#   "vehicles": [
#     {
#       "id": 1, "start": [103.6270,1.2961], "end": [103.6270,1.2961],"capacity": [1],"skills": [1, 14, 2]
#     }
#   ],
#   "jobs": [],
#   "shipments": [
#     {
#       "amount": [1],"skills": [1],
#       "pickup": {"id": 2,"service": 300,"time_windows": [[1582907793, 1582988000]],"location": [103.6907,1.3303]
#       },
#       "delivery": {"id": 30, "service": 300,"time_windows": [[1582907793, 1582988000]],"location": [103.6364,1.3249]
#       }
#     },
#     {
#       "amount": [1],"skills": [1],
#       "pickup": {"id": 4,"service": 300,"time_windows": [[1582907793, 1582988000]],"location": [103.7127,1.3174]
#       },
#       "delivery": {"id": 30,"service": 300,"time_windows": [[1582907793, 1582988000]],"location": [103.6364,1.3249]
#       }
#     },
#     {
#       "amount": [1],"skills": [1],
#       "pickup": {"id": 6,"service": 300,"time_windows": [[1582907793, 1582988000]],"location": [103.7123,1.3471]
#       },
#       "delivery": {"id": 30,"service": 300,"time_windows": [[1582907793, 1582988000]],"location": [103.6364,1.3249]
#       }
#     }
#   ]
# }
# json_data = json.dumps(data)

# response = requests.post(url, data=json_data, headers=headers, verify=False)

# print(response.json())

def solve(data, url = "http://localhost:3000"):
    json_data = json.dumps(data)
    headers = {
    "Content-Type": "application/json"
    }
    response = requests.post(url, data=json_data, headers=headers)
    if response.status_code == 200:
        return response.json()
    else:
        return response.text

def remove_non_values(d):
    return {k: v for k, v in d.items() if v is not None}

class Cost:
    def __init__(self, fixed: int, per_hour: int, per_km: int):
        self.fixed: int = fixed
        self.per_hour: int = per_hour
        self.per_km: int = per_km
    
    def to_dict(self):
        return remove_non_values(self.__dict__)
    
class Break:
    def __init__(self, break_id: int, time_windows: List[List[int]], service: int, description: str, max_load: List[int]):
        self.id: int = break_id
        self.time_windows: List[List[int]] = time_windows
        self.service: int = service
        self.description: str = description
        self.max_load: List[int] = max_load
    
    def to_dict(self):
        return remove_non_values(self.__dict__)

class Vehicle:
    def __init__(self, vehicle_id: int, profile: str, 
                 start: List[float], start_index: int, 
                 end: List[float], end_index: int, 
                 capacity: List[int], costs: Dict[str, int], 
                 skills: List[int],
                 time_window: List[int], max_tasks: int, 
                 max_travel_time: int, 
                 max_distance: int):
        
        self.id: int = vehicle_id
        self.profile: str = profile
        self.start: List[float] = start
        self.start_index: int = start_index
        self.end: List[float] = end
        self.end_index: int = end_index
        self.capacity: List[int] = capacity
        self.costs: Dict[str, int] = costs
        self.skills: List[int] = skills
        self.time_window: List[int] = time_window
        self.max_tasks: int = max_tasks
        self.max_travel_time: int = max_travel_time
        self.max_distance: int = max_distance

    def to_dict(self):
        return remove_non_values(self.__dict__)
    
class Job:
    def __init__(self, job_id: int, description: str, location: List[float], location_index: int, setup: int, service: int, delivery: List[int], pickup: List[int], skills: List[int], priority: int, time_windows: List[List[int]]):
        self.id: int = job_id
        self.description: str = description
        self.location: List[float] = location
        self.location_index: int = location_index
        self.setup: int = setup
        self.service: int = service
        self.delivery: List[int] = delivery
        self.pickup: List[int] = pickup
        self.skills: List[int] = skills
        self.priority: int = priority
        self.time_windows: List[List[int]] = time_windows

    def to_dict(self):
        return remove_non_values(self.__dict__)
    
class Shipment:
    def __init__(self, pickup_step, delivery_step, amount, skills, priority):
        self.pickup = pickup_step
        self.delivery = delivery_step
        self.amount = amount
        self.skills = skills
        self.priority = priority # integer in [0,100] range
    
    def to_dict(self):
        return self.__dict__

class Shipment_Step:
    def __init__(self, id, description, location, location_index, setup, service, time_windows):
        self.id = id
        self.description = description
        self.location = location
        self.location_index = location_index
        self.setup = setup
        self.service = service
        self.time_windows = time_windows
    
    def to_dict(self):
        return remove_non_values(self.__dict__)

    
class Matrix:
    def __init__(self, duration_matrix: List[List], distance_matrix: List[List], cost_matrix: List[List]):
        self.durations: List[List] = duration_matrix
        self.distance: List[List] = distance_matrix
        self.cost: List[List] = cost_matrix
    
    def to_dict(self):
        return {"car": remove_non_values(self.__dict__)}

class sendData:
    def __init__(self, jobs, shipments, vehicles, matrices):
        self.jobs = jobs
        self.shipments = shipments
        self.vehicles = vehicles
        self.matrices = matrices
    
    def to_dict(self):
        return self.__dict__
    