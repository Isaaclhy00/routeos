from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp
from functools import partial

#https://stackoverflow.com/questions/73401608/or-tools-cvrp-reload-with-pickup-delivery

class BaseCVRPTWReload:
    def __init__(self, data):
        self.fleet_data = data["fleet_data"]
        self.task_data = data["task_data"]
        self.solver_params = data["solver_params"]
    
    def create_data_model(self):
        data = {}
        data["extra_vehs"] = self.solver_params["extra_vehs"]

        data["num_vehicles"] = len(self.fleet_data["vehicle_id"])+data["extra_vehs"]
        data["vehicle_capacity"] = self.fleet_data["vehicle_capacity"] + [self.solver_params["extra_vehs_capacity"]]*data["extra_vehs"]
        data["manpower_capacity"] = self.fleet_data["manpower_capacity"] +[1000]*data["extra_vehs"]
        data["ips_per_veh"] = self.fleet_data["vehicle_max_ip_trips"]
        data['vehicle_max_distance'] = self.fleet_data["vehicle_max_distance"]

        data["num_ips"] = data["num_vehicles"]*data["ips_per_veh"]
        data["demands"] = self.task_data["task_demands"]+[-max(data["vehicle_capacity"])]*data["ips_per_veh"]*data["num_vehicles"]
        data["time_windows"] = self.task_data["task_timewindows"] + [self.task_data["work_timewindows"] for i in range(data["num_ips"])]
        data['vehicle_work_time'] = self.task_data["work_timewindows"] 
        data['max_waiting_time'] = self.task_data["max_waitingtime"]
        data['depot_idx'] = self.task_data["depot_idx"]  
        data['ip_idx'] = self.task_data["ip_idx"] 
        data['dist_matrix'] = self.task_data["dist_matrix"]
        data['time_matrix'] = self.task_data["time_matrix"]
        data["starts"] = [data['depot_idx']]*data["num_vehicles"]
        data["ends"] = [data['ip_idx'] ]*data["num_vehicles"]
        data["vehicle_restrictions"] = self.task_data["vehicle_restrictions"] + [",".join([str(i) for i in list(range(data["num_vehicles"]))])]*2 + [",".join([str(i) for i in list(range(data["num_vehicles"]))])]*data["num_ips"] 
        data["service_time"] = self.task_data["task_servicetime"]
        data['num_locations'] = len(data["demands"])
        data["num_cps_in_cluster"] = self.task_data["num_cps_in_cluster"] + [0]*data["num_ips"] ## set how many cps in cluster
        data["task_manpower"] = self.task_data["task_manpower"]+ [2,2] + [2]*data["num_ips"]        
    

        print("total_demand_nodes", data["depot_idx"])
        print('depot', data['depot_idx'])
        print("ip_idx", data['ip_idx'])
        print("reload_stations",list(range(data['ip_idx']+1,data['ip_idx']+data['num_ips']+1)))
        print("total_locations_with_reloads",data['num_locations'])

        return data
    
    ### Nodal Constraints
    def add_nodal_constraints(self, routing, data):
        for idx,r in enumerate(data["vehicle_restrictions"]):
            allowed_index = []
            r = str(r)
            for a in r.split(","):
                allowed_index+=[int(a)]
            allowed_index +=list(range(len(self.fleet_data["vehicle_id"]),data["num_vehicles"]))
            routing.SetAllowedVehiclesForIndex(allowed_index, idx)
            print("nodal_contraints",idx,allowed_index)

    ### Distance Constraints
    def create_distance_evaluator(self,data):
        """Creates callback to return distance between points."""
        _distances = {}
        # precompute distance between location to have distance callback in O(1)
        for from_node in range(data['num_locations']):
            _distances[from_node] = {}
            for to_node in range(data['num_locations']):
                if from_node == to_node:
                    _distances[from_node][to_node] = 0
                # Forbid start/end/reload node to be consecutive.
                elif from_node in range(data["depot_idx"],data['num_locations']) and to_node in range(data["depot_idx"],data['num_locations']):
                    _distances[from_node][to_node] = data['vehicle_max_distance']
                elif from_node in range(data["depot_idx"],data['num_locations']):
                    _distances[from_node][to_node] = data["dist_matrix"][data["depot_idx"],to_node]
                elif to_node in range(data["depot_idx"],data['num_locations']):
                    _distances[from_node][to_node] = data["dist_matrix"][from_node,data["depot_idx"]]
                else:
                    _distances[from_node][to_node] = data["dist_matrix"][from_node,to_node]

        def distance_evaluator(manager, from_node, to_node):
            """Returns the manhattan distance between the two nodes"""
            return _distances[manager.IndexToNode(from_node)][manager.IndexToNode(to_node)]

        return distance_evaluator

    def add_distance_dimension(self,routing, manager, data, distance_evaluator_index):
        """Add Global Span constraint"""
        del manager
        distance = 'Distance'
        routing.AddDimension(
            distance_evaluator_index,
            0,  # null slack
            data['vehicle_max_distance'],  # maximum distance per vehicle
            True,  # start cumul to zero
            distance)
        distance_dimension = routing.GetDimensionOrDie(distance)
        # Try to minimize the max distance among vehicles.
        # /!\ It doesn't mean the standard deviation is minimized
        distance_dimension.SetGlobalSpanCostCoefficient(1) #minimize asymmetry between nodes

    ### Demand Contraints
    def create_demand_evaluator(self,data):
        """Creates callback to get demands at each location."""
        _demands = data['demands']

        def demand_evaluator(manager, from_node):
            """Returns the demand of the current node"""
            # if from_node>49:
            #     d = _demands[manager.IndexToNode(49)]
            # else:
            #     d = _demands[manager.IndexToNode(from_node)]
            # return d
            return _demands[manager.IndexToNode(from_node)]

        return demand_evaluator

    def add_capacity_constraints(self,routing, manager, data, demand_evaluator_index):
        """Adds capacity constraint"""
        vehicle_capacity = data["vehicle_capacity"]
        capacity = 'Capacity'
        routing.AddDimensionWithVehicleCapacity(
            demand_evaluator_index,
            max(data["vehicle_capacity"]),
            vehicle_capacity,
            True,  # start cumul to zero
            capacity)

        # Add Slack for reseting to zero unload depot nodes.
        # e.g. vehicle with load 10/15 arrives at node 1 (depot unload)
        # so we have CumulVar = 10(current load) + -15(unload) + 5(slack) = 0.
        capacity_dimension = routing.GetDimensionOrDie(capacity)
        # capacity_dimension.SetGlobalSpanCostCoefficient(100)
        # Allow to drop reloading nodes with zero cost.
        for node in range(data['ip_idx']+1,data['num_locations']):
            # print("droppable reload nodes added",node)
            node_index = manager.NodeToIndex(node)
            routing.AddDisjunction([node_index], 0)
        
        # Allow to drop regular node with a cost.
        for node in range(0, data['depot_idx']):
            node_index = manager.NodeToIndex(node)
            capacity_dimension.SlackVar(node_index).SetValue(0)
            routing.AddDisjunction([node_index], 1_000_000_000)

    ### Manpower Constraints
            
    def create_manpower_evaluator(self,data):
        _manpower = data["task_manpower"]
        def manpower_evaluator(manager, from_node):
            return _manpower[manager.IndexToNode(from_node)]-2
        return manpower_evaluator
    
    def add_manpower_constraints(self, routing, manager, data, manpower_evaluator_index):
        routing.AddDimensionWithVehicleCapacity(
            manpower_evaluator_index, 0, data["manpower_capacity"], True, "Manpower"
            )
        manpower_dimension = routing.GetDimensionOrDie("Manpower")

        # routing.AddConstantDimensionWithSlack(0, 1, 1, True, "Staff_used")
        # staff_dimension = routing.GetDimensionOrDie("Staff_used")
        # for vid in range(len(data["vehicle_capacity"])):
        #     end = routing.End(vid)
        #     expr = manpower_dimension.CumulVar(end) > 0
        #     routing.solver().Add(expr == staff_dimension.CumulVar(end))
        #     staff_dimension.SetCumulVarSoftUpperBound(end, 0, 300) ### extra staff needs to add 300mins to route

    ### Time Constraints
    def create_time_evaluator(self,data):
        """Creates callback to get total times between locations."""

        def service_time(data, node):
            """Gets the service time for the specified location."""
            c = data["num_cps_in_cluster"][node]
            if node == data['depot_idx'] or node == data["ip_idx"]:
                return 0
            elif node in range(data['ip_idx']+1,data['num_locations']):
                return 0
            else:
                return int(data["service_time"][node] + 0.5*c)        

        _total_time = {}
        # precompute total time to have time callback in O(1)
        for from_node in range(data['num_locations']):
            _total_time[from_node] = {}
            for to_node in range(data['num_locations']):
                if from_node == to_node:
                    _total_time[from_node][to_node] = 0
                else:
                    _total_time[from_node][to_node] = int(
                            service_time(data, from_node) +
                            data["time_matrix"][min(from_node,data['ip_idx']), min(to_node,data['ip_idx'])])


        def time_evaluator(manager, from_node, to_node):
            """Returns the total time between the two nodes"""
            return _total_time[manager.IndexToNode(from_node)][manager.IndexToNode(
                to_node)]

        return time_evaluator

    def add_time_window_constraints(self,routing, manager, data, time_evaluator):
        """Add Time windows constraint"""
        time = 'Time'
        min_time = data["vehicle_work_time"][0]
        max_time = data['vehicle_work_time'][1]
        routing.AddDimension(
            time_evaluator,
            data["max_waiting_time"],  # allow waiting time
            max_time,  # maximum time per vehicle
            False,  # don't force start cumul to zero since we are giving TW to start nodes
            time)
        
        time_dimension = routing.GetDimensionOrDie(time)
        # Add time window constraints for each location except depot
        # and 'copy' the slack var in the solution object (aka Assignment) to print it
        for location_idx, time_window in enumerate(data['time_windows']):
            if location_idx in range(data['depot_idx'],data['ip_idx']+1):
                continue
            index = manager.NodeToIndex(location_idx)
            # time_dimension.CumulVar(index).SetRange(6*60, 19*60)
            time_dimension.CumulVar(index).SetRange(time_window[0], time_window[1])
            # print(location_idx, time_window[0], min(time_window[1], max_time))
            routing.AddToAssignment(time_dimension.SlackVar(index))
        # Add time window constraints for each vehicle start node
        # and 'copy' the slack var in the solution object (aka Assignment) to print it
        for vehicle_id in range(data['num_vehicles']):
            index = routing.Start(vehicle_id)
            # time_dimension.CumulVar(index).SetRange(data['time_windows'][48][0],
            #                                         data['time_windows'][48][0]+30)
            time_dimension.CumulVar(index).SetRange(min_time+30,
                                                    max_time)
            routing.AddToAssignment(time_dimension.SlackVar(index))

            # Warning: Slack var is not defined for vehicle's end node
            # add constraints to vehicle end node
        time_dimension.SetGlobalSpanCostCoefficient(10) #minimize asymmetry between nodes
    
    ### Print Results
    def create_empty_veh(self):
        veh = {"cluster_node":[],
            "time_range": []}
        return veh
    
    def print_solution(self, data, manager, routing, assignment):  # pylint:disable=too-many-locals
        """Prints assignment on console"""
        print(f'Objective: {assignment.ObjectiveValue()}')
        total_distance = 0
        total_load = 0
        total_time = 0
        capacity_dimension = routing.GetDimensionOrDie('Capacity')
        time_dimension = routing.GetDimensionOrDie('Time')
        dropped_nodes = []
        dropped_reload = []
        for order in range(0, data['depot_idx']):
            index = manager.NodeToIndex(order)
            if assignment.Value(routing.NextVar(index)) == index:
                dropped_nodes.append(order)
        print(f'dropped orders: {dropped_nodes}')
        for reload in range(data['ip_idx']+1, data['num_locations']):
            index = manager.NodeToIndex(reload)
            if assignment.Value(routing.NextVar(index)) == index:
                dropped_reload.append(reload)
        print(f'dropped reload stations: {dropped_reload}')
        total_assignment = []
        for vehicle_id in range(data['num_vehicles']):
            veh = self.create_empty_veh()
            index = routing.Start(vehicle_id)
            plan_output = f'Route for vehicle {vehicle_id}:\n'
            distance = 0
            while not routing.IsEnd(index):
                load_var = capacity_dimension.CumulVar(index)
                time_var = time_dimension.CumulVar(index)
                plan_output += (
                    f' {manager.IndexToNode(index)} '
                    f'Load({assignment.Value(load_var)}) '
                    f'Time({assignment.Min(time_var)},{assignment.Max(time_var)}) ->'
                )
                veh["cluster_node"].append(manager.IndexToNode(index))
                veh["time_range"].append((assignment.Min(time_var),assignment.Max(time_var)))
                previous_index = index
                index = assignment.Value(routing.NextVar(index))
                distance += routing.GetArcCostForVehicle(previous_index, index,
                                                        vehicle_id)
            total_assignment.append(veh)
            load_var = capacity_dimension.CumulVar(index)
            time_var = time_dimension.CumulVar(index)
            plan_output += (
                f' {manager.IndexToNode(index)} '
                f'Load({assignment.Value(load_var)}) '
                f'Time(0,0)\n'
                f'Time({assignment.Min(time_var)},{assignment.Max(time_var)})\n')
            plan_output += f'Distance of the route: {distance}m\n'
            plan_output += f'Load of the route: {assignment.Value(load_var)}\n'
            plan_output += f'Time of the route: {assignment.Value(time_var)}min\n'
            print(plan_output)
            total_distance += distance
            total_load += assignment.Value(load_var)
            total_time += assignment.Value(time_var)
        print(f'Total Distance of all routes: {total_distance}m')
        print(f'Total Load of all routes: {total_load}')
        print(f'Total Time of all routes: {total_time}min')
        return total_assignment
    
    ########
    # Main #
    ########
    def solve(self):
        """Entry point of the program"""
        # Instantiate the data problem.
        data = self.create_data_model()
        print(data)

        # Create the routing index manager
        manager = pywrapcp.RoutingIndexManager(data['num_locations'], data['num_vehicles'], data['starts'], data['ends'])

        # Create Routing Model
        routing = pywrapcp.RoutingModel(manager)

        # Add cost for dummy vehicles
        for veh in range(len(self.fleet_data["vehicle_id"]),data["num_vehicles"]):
            print("setting_cost_extra_veh", 1000000000)
            routing.SetFixedCostOfVehicle(1_000_000_000, veh)
        
        # Define weight of each edge
        distance_evaluator_index = routing.RegisterTransitCallback(
            partial(self.create_distance_evaluator(data), manager))

        # Add Distance constraint to minimize the longuest route
        self.add_distance_dimension(routing, manager, data, distance_evaluator_index)

        # Add Capacity constraint
        demand_evaluator_index = routing.RegisterUnaryTransitCallback(
            partial(self.create_demand_evaluator(data), manager))
        self.add_capacity_constraints(routing, manager, data, demand_evaluator_index)

        # Add Time Window constraint
        time_evaluator_index = routing.RegisterTransitCallback(
            partial(self.create_time_evaluator(data), manager))
        self.add_time_window_constraints(routing, manager, data, time_evaluator_index)
        
        routing.SetArcCostEvaluatorOfAllVehicles(time_evaluator_index)

        # Add Manpower constraint
        manpower_evaluator_index = routing.RegisterUnaryTransitCallback(
            partial(self.create_manpower_evaluator(data),manager))
        self.add_manpower_constraints(routing, manager, data, manpower_evaluator_index)

        # Add Nodal constraints
        self.add_nodal_constraints(routing, data)

        # Setting first solution heuristic (cheapest addition).
        search_parameters = pywrapcp.DefaultRoutingSearchParameters()
        search_parameters.first_solution_strategy = (
            # routing_enums_pb2.FirstSolutionStrategy.CHRISTOFIDES)
            # routing_enums_pb2.FirstSolutionStrategy.PATH_MOST_CONSTRAINED_ARC)
            routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC)
            # routing_enums_pb2.FirstSolutionStrategy.PARALLEL_CHEAPEST_INSERTION)  
        search_parameters.local_search_metaheuristic = (
            routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH)
            # routing_enums_pb2.LocalSearchMetaheuristic.TABU_SEARCH)
        search_parameters.time_limit.FromSeconds(self.solver_params["time_limit_s"])

        # Solve the problem.
        search_parameters.log_search = True
        solution = routing.SolveWithParameters(search_parameters)
        print("Solver status: ", routing.status())
        if solution:
            total_assignment = self.print_solution(data, manager, routing, solution)
            return total_assignment
        else:
            print("No solution found !")
            return None
        

        