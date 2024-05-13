import unittest
import json
import random
from flask import url_for, Flask, request, jsonify
from routes import main 
from run_local import app 
from optimization.solve_with_clusters import solve_with_cluster 
from datetime import datetime

class MyAppTestCase(unittest.TestCase):
    passed_test_cases = []
    failed_test_cases = []

    def setUp(self):
        app.testing = True
        self.app = app.test_client()

    # Test Cases
    def test_load_home_page(self):
        try:
            response = self.app.get('/')
            self.assertEqual(response.status_code, 200)
            self.passed_test_cases.append("test_load_home_page")
        except Exception as e:
            self.failed_test_cases.append(("test_load_home_page", str(e)))

    def test_simple_optimization_solve_opt(self):

        combinations = ([
            ("test_reshuffle_with_clusters", "reshuffle", True),
            # ("test_reshuffle_no_clusters", "reshuffle", False),
            ("test_breakroute_with_clusters", "breakroute", True),
            # ("testrbreakroute_no_clusters", "breakroute", False),
            ("test_breakdown_with_clusters", "breakdown", True),
            # ("test_breakdown_no_clusters", "breakdown", False),
        ])

        for name, solverConfigMode, isUseClusters in combinations:
            with self.subTest(name=name):
                try:
                    json_data, routesToBreakSet, routesToOptimizeSet = self.generate_data(solverConfigMode, isUseClusters)
                    response = self.app.post('/solve', json=json_data)
                    self.assertEqual(response.status_code, 200)
                    self.assertIn('run_number', response.json)
                    run_number = response.json['run_number']
                    self.assertTrue(run_number.startswith(datetime.now().strftime("%Y%m%d")))
                    if solverConfigMode == "reshuffle":
                        self.passed_test_cases.append(f"{name} Reshuffled Routes: {routesToOptimizeSet}")
                    else:
                        self.passed_test_cases.append(f"{name} Routes To Break: {routesToBreakSet}, Routes To Optimize: {routesToOptimizeSet}")
                except Exception as e:
                    self.failed_test_cases.append((name, str(e)))

    # def test_example(self): 
        try:
            self.assertEqual(1, 2)  # This will pass
            self.passed_test_cases.append("self.assertEqual(1, 2)")
        except Exception as e:
            self.failed_test_cases.append(("self.assertEqual(1, 2)", str(e)))
        try:
            self.assertEqual(2, 2)  # This will pass
            self.passed_test_cases.append("self.assertEqual(2, 2)")
        except Exception as e:
            self.failed_test_cases.append(("self.assertEqual(2, 2)", str(e)))

    # Helper functions to read data from js
    def read_data_from_js(self, file_path, string_to_split):
            # Read the JavaScript file
            with open(file_path, 'r') as f:
                js_content = f.read()

            # Extract the points_data array from the JavaScript content
            points_data_str = js_content.split(string_to_split)[1].split(';')[0]

            # Convert the points_data string to a Python list of dictionaries
            points_data = json.loads(points_data_str)

            return points_data
    
    def generate_data(self, solverConfigMode, isUseClusters):
            routes_data = self.read_data_from_js(r'static\js\data\routes_data.js', "var routes_data =")
            points_data = self.read_data_from_js(r'static\js\data\points_data.js', "var points_data =")
            depots_data = self.read_data_from_js(r'static\js\data\depots_data.js', "var depots_data =")
            vehicle_types_data = self.read_data_from_js(r'static\js\data\vehicle_types_data.js', "var vehicle_types_data =")
            vehicles_data = self.read_data_from_js(r'static\js\data\vehicles_data.js', "var vehicles_data =")

            # Define routesToBreakSet and routesToOptimizeSet
            # routesToBreakSet = set([1, 2, 3])  
            # routesToOptimizeSet = set([4, 5, 6]) 
            routesToBreakSet, routesToOptimizeSet = self.generate_routesToBreakSet_routesToOptimizeSet()

            routesToBreak = [route for route in routes_data if route['id'] in routesToBreakSet]
            routesToOptimize = [route for route in routes_data if route['id'] in routesToOptimizeSet]
            pointsToAssign = [point for point in points_data if point['Route_ID'] in routesToBreakSet or point['Route_ID'] in routesToOptimizeSet]
            vehiclesInvolved = [vehicle for vehicle in vehicles_data if vehicle['Route_ID'] in routesToOptimizeSet]

            # Construct the data object
            data = {
                "routesToBreak": routesToBreak,
                "routesToOptimize": routesToOptimize,
                "pointsToAssign": pointsToAssign,
                "vehiclesInvolved": vehiclesInvolved,
                "depotData": depots_data,
                "solverConfig": {
                    "mode": solverConfigMode,
                    "useClusters": isUseClusters,
                },
                "allVehicleTypes": vehicle_types_data
            }

            return data, routesToBreakSet, routesToOptimizeSet

    def generate_routesToBreakSet_routesToOptimizeSet(self):
        # Generate indices from 0 to 8
        indices = list(range(9))

        # Shuffle the indices randomly
        random.shuffle(indices)

        # Determine the number of indices to assign to routesToBreakSet
        min_indices_for_break_set = 1
        max_indices_for_break_set = len(indices) - 1
        num_to_assign_to_break_set = random.randint(min_indices_for_break_set, max_indices_for_break_set)

        # Assign indices to routesToBreakSet
        routesToBreakSet = set(indices[:num_to_assign_to_break_set])

        # Assign the remaining indices to routesToOptimizeSet
        routesToOptimizeSet = set(indices[num_to_assign_to_break_set:])

        # Ensure routesToOptimizeSet has same or more elements than routesToBreakSet
        while len(routesToOptimizeSet) < len(routesToBreakSet):
            # Shift an element from routesToBreakSet to routesToOptimizeSet
            element_to_shift = routesToBreakSet.pop()
            routesToOptimizeSet.add(element_to_shift)
        
        return routesToBreakSet, routesToOptimizeSet

    @classmethod
    def addFailure(cls, test, err):
        """Override the addFailure method to record failed test cases."""
        super().addFailure(test, err)
        cls.failed_test_cases.append((test._testMethodName, str(err)))

    @classmethod
    def addSuccess(cls, test):
        """Override the addSuccess method to record passed test cases."""
        super().addSuccess(test)
        cls.passed_test_cases.append(test._testMethodName)

    @classmethod
    def tearDownClass(cls):
        total_test_cases = len(cls.passed_test_cases) + len(cls.failed_test_cases)
        # Print the names of passed test cases
        print(f"\nPassed test cases: {len(cls.passed_test_cases)}/{total_test_cases}")
        for test_case in cls.passed_test_cases:
            print(test_case)

        # Print the names of failed test cases
        print(f"\nFailed test cases: {len(cls.failed_test_cases)}/{total_test_cases}")
        for test_method_name, test_result in cls.failed_test_cases:
            print(test_method_name, test_result)

if __name__ == '__main__':
    unittest.main()
