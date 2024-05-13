const app = Vue.createApp({
    data() {
        return {
            opt : null, //raw data from optimization
            selectedVehicle : "", 
            routeLayer: {},
            routeOrder: {},
            routeTonnage: {},
            routeManpower: {},
            routeDraggable: {},
            routeOutlier: {},
            routeTime: {},
            routeDist: {},
            vehicleCapacity: {},
            vehicleManpower: {},
            unassignedTonnage: "",
            unassignedPointsNo: "",
            map : "",
            map2loc: {},
            Sortables: {},
            locations: [],
            routeCache: {},
        };
    },
    methods: {
        loadData(){
            // on start load data
            this.opt = optData
        },
        getKeyByValue(obj, value) {
            return Object.keys(obj).filter(key => obj[key] === value);
        },
        createSortable: function( obj){
            return Sortable.create(obj, {
            group: "shared",
            // multiDrag: true,
            animation: 150,
            onEnd: this.onSortEnd,
            dataIdAttr: 'data-id',
            avoidImplicitDeselect: false,
            // draggable: ".draggble",
            // selectedClass: "active",
            // onMove: function(evt){return true?evt.dragged.classList.contains("active"):false}
          });
        },
        updateSelectedVehicle(evt){
            this.selectedVehicle = evt.target.value;
            this.updateRouteOrder(this.selectedVehicle)
        },
        onSortEnd(evt){
            // console.log(evt)
            this.$nextTick(() => {
                this.routeSort = this.Sortables[this.selectedVehicle].toArray()
                this.uaSort = this.Sortables['unassigned'].toArray()
                // console.log(this.Sortables['unassigned']);
                // console.log("selected_se",this.Sortables[this.selectedVehicle].toArray())
                // console.log("ua_se",this.Sortables['unassigned'].toArray())
                this.map2loc[this.selectedVehicle] = this.Sortables[this.selectedVehicle].toArray()
                this.map2loc['unassigned'] = this.Sortables['unassigned'].toArray()
                this.updateRouteOrder(this.selectedVehicle)
            })
        },
        updateRouteOrder(selected_vehicle) {
            // let selected_vehicle= this.selectedVehicle;

            let selected_routelist = this.map2loc[selected_vehicle].map(index=>this.locations[index])
            let unassigned_routelist = this.map2loc['unassigned'].map(index=>this.locations[index])

            console.log("updaterouteorder",selected_routelist)
          
            let orderindex = [];
            let tonnagearray = [];
            let draggablearray = [];
            let outlierarray = [];
            let totaltonnage = 0;
            let totalmanpower = 0;
            let routeint = 1;
          
            for (let i = 0; i < selected_routelist.length; i++) {
              if (selected_routelist[i] === 'DP' || selected_routelist[i] === 'IP') {
                // ignore index for DP & IP
                orderindex.push(-1);
                draggablearray.push(false);
                outlierarray.push(false);
                if (selected_routelist[i] == 'IP'){
                    // reset vehicle tonnage after visiting IP
                    tonnagearray.push(totaltonnage);
                    totaltonnage = 0;}} 
                else {
                orderindex.push(routeint);
                routeint += 1;
                totaltonnage += this.opt.points.Tonnage_kg[selected_routelist[i]]
                if (this.opt.points.Manpower[selected_routelist[i]] > totalmanpower){
                    totalmanpower = this.opt.points.Manpower[selected_routelist[i]]
                }
                //check for points that are not in original vehicle
                if (this.opt.points.Vehicle_ID[selected_routelist[i]] == this.getKeyByValue(this.opt.fleet.Name,selected_vehicle)){
                    outlierarray.push(false)
                }
                else{
                    outlierarray.push(true)
                }
                draggablearray.push(true);
              }
            }

            this.routeOrder[selected_vehicle] = orderindex;
            this.routeTonnage[selected_vehicle] = tonnagearray;
            this.routeManpower[selected_vehicle] = totalmanpower;
            this.routeDraggable[selected_vehicle] = draggablearray;
            this.routeOutlier[selected_vehicle] = outlierarray;
            
            vehicleindex = this.getKeyByValue(this.opt.fleet.Name,selected_vehicle);
            this.vehicleCapacity[selected_vehicle] = this.opt.fleet.Capacity[vehicleindex]
            this.vehicleManpower[selected_vehicle] = this.opt.fleet.Manpower[vehicleindex]

            //redraw
            var routeLayer = this.routeLayer[selected_vehicle];
            // Iterate over each layer within the routeLayer and remove them
            routeLayer.eachLayer(function(layer) {
                routeLayer.removeLayer(layer);
            });
            var unassignedLayer = this.routeLayer['unassigned'];
            unassignedLayer.eachLayer(function(layer) {
                unassignedLayer.removeLayer(layer);
            });
            
            this.addPoints2Map(selected_routelist,unassigned_routelist,selected_vehicle,orderindex)
            this.addRoute2Map(selected_routelist,selected_vehicle)
            
          },
        addIpDp(){

            L.marker([this.opt.depots.lat[0],this.opt.depots.long[0]], {
                icon: new L.AwesomeNumberMarkers({
                number: "DP", 
                markerColor: "blue"
            })}).bindPopup('17 Tuas Ave 12 Tuas Depot').addTo(this.map);

            L.marker([this.opt.ips.lat[0],this.opt.ips.long[0]], {
                icon: new L.AwesomeNumberMarkers({
                number: "IP", 
                markerColor: "blue"
            })}).bindPopup('IP').addTo(this.map);

        },
        addPoints2Map(selected_routelist,unassigned_routelist,selected_vehicle,orderindex){

            for (let i = 0; i < selected_routelist.length; i++){
                let point = selected_routelist[i];
                if (point !== "DP" && point !== "IP") {
                    // console.log(point)
                    house = this.opt.points.House[point]?this.opt.points.House[point]:''
                    street = this.opt.points.Street[point]?this.opt.points.Street[point]:''
                    alias = this.opt.points.Alias[point]?this.opt.points.Alias[point]:''
                    str = house + " " + street + " " + alias
                    L.marker([this.opt.points.Lat_User[point],this.opt.points.Long_User[point]], {
                        icon: new L.AwesomeNumberMarkers({
                        number: orderindex[i], 
                        markerColor: "black"
                    })}).bindPopup(str).addTo(this.routeLayer[selected_vehicle]);
                }
            }

            for (let i = 0; i < unassigned_routelist.length; i++){
                let point = unassigned_routelist[i];
                if (point !== "DP" && point !== "IP") {
                    // console.log(point)
                    house = this.opt.points.House[point]?this.opt.points.House[point]:''
                    street = this.opt.points.Street[point]?this.opt.points.Street[point]:''
                    alias = this.opt.points.Alias[point]?this.opt.points.Street[point]:''
                    str = house + " " + street + " " + alias
                    L.marker([this.opt.points.Lat_User[point],this.opt.points.Long_User[point]], {
                        icon: new L.AwesomeNumberMarkers({
                        number: "U", 
                        markerColor: "red"
                    })}).bindPopup(str).addTo(this.routeLayer['unassigned']);
                }

            }

        },
        async fetchRoute(start_lat_lon,end_lat_lon){
            const latLonString = start_lat_lon[1].toString()+","+start_lat_lon[0].toString()+";"+end_lat_lon[1].toString()+","+end_lat_lon[0].toString()
            // const url = "http://localhost:5001/route/v1/car/"+latLonString+"?annotations=nodes&continue_straight=true&geometries=geojson&overview=full&alternatives=true";
            const url = "/fetch_route?latlonstr="+latLonString
            console.log(url)
            try {
                const response = await fetch(url);
        
                if (!response.ok) {
                  throw new Error('Failed to fetch route');
                }
        
                const responseData = await response.json();
        
                return responseData
              } catch (error) {
                console.error('Error fetching route:', error);
              }
        },
        fetchLatLon(val){
            if (val === "DP"){
                return [this.opt.depots.lat[0],this.opt.depots.long[0]]
            }
            else if (val === "IP"){
                return [this.opt.ips.lat[0],this.opt.ips.long[0]]
            }
            else{
                return [this.opt.points.Lat_User[val],this.opt.points.Long_User[val]]
            }
        },
        addMinutesToTime(timeStr, minutesToAdd) {
            // Parse the time string into hours and minutes
            const [hoursStr, minutesStr] = timeStr.split(':');
            let hours = parseInt(hoursStr, 10);
            let minutes = parseInt(minutesStr, 10);
        
            // Add the specified minutes
            minutes += minutesToAdd;
        
            // Handle overflow of minutes into hours
            hours += Math.floor(minutes / 60);
            minutes = minutes % 60;
        
            // Normalize hours (handle overflow beyond 24 hours if necessary)
            hours = hours % 24;
        
            // Format hours and minutes into a valid time string
            const formattedHours = hours.toString().padStart(2, '0');
            const formattedMinutes = minutes.toString().padStart(2, '0');
        
            return `${formattedHours}:${formattedMinutes}`;
        },
        addRoute2Map(selected_routelist, selected_vehicle) {

            (async () => {
                let timearray = []
                timearray.push(this.opt.assignment[selected_vehicle].time[0])
                let disttravelled = 0
                let servicetime = 0
                for (let i = 0; i < selected_routelist.length - 1; i++) {
                    let start = this.fetchLatLon(selected_routelist[i]);
                    let end = this.fetchLatLon(selected_routelist[i + 1]);
                    const cacheKey = start+"-"+end
                    console.log(cacheKey)
                    if (selected_routelist[i] === "IP"){
                        servicetime = 0
                    }
                    else if (selected_routelist[i] === "DP"){
                        servicetime = 20
                    }else{
                        // console.log(selected_routelist[i])
                        servicetime = this.opt.points.Service_Time_min[selected_routelist[i]]
                    }
                    if (!(cacheKey in this.routeCache)){
                        try {
                            // Await the result of fetchRoute
                            const route_response = await this.fetchRoute(start, end);
                            // Process route_response after await
                            const routeLonLats = route_response["routes"][0]["geometry"]["coordinates"].map(([lon, lat]) => [lat, lon]);
                            const dist = route_response["routes"][0]["distance"];
                            const traveltime = Math.ceil(route_response["routes"][0]["duration"] / 60);
                            // Create cache
                            this.routeCache[cacheKey] = {};
                            this.routeCache[cacheKey]["lonlats"] = routeLonLats;
                            this.routeCache[cacheKey]["dist"] = dist;
                            this.routeCache[cacheKey]["time"] = traveltime;
                            L.polyline(routeLonLats).addTo(this.routeLayer[selected_vehicle]);
                            // update time
                            oldtime = timearray[timearray.length-1];
                            timearray.push(this.addMinutesToTime(oldtime,servicetime+traveltime))
                            disttravelled += dist
                            // console.log(routeLonLats, dist, time);
                        } catch (error) {
                            console.error('Error fetching or parsing route:', start, end, error);
                        }
                    }
                    else{
                        // load routeLonLats, dist, time from cache
                        const routeLonLats = this.routeCache[cacheKey]["lonlats"]
                        const dist = this.routeCache[cacheKey]["dist"]
                        const traveltime = this.routeCache[cacheKey]["time"]
                        L.polyline(routeLonLats).addTo(this.routeLayer[selected_vehicle]);
                        oldtime = timearray[timearray.length-1];
                        timearray.push(this.addMinutesToTime(oldtime,servicetime+traveltime))
                        disttravelled += dist
                    }
                };
                console.log("print time")
                // console.log(timearray);
                this.routeTime[selected_vehicle] = timearray;
                this.routeDist[selected_vehicle] = disttravelled;
            })();
        },
        calculateRouteTime(){

        },
        removeChildrenFromLayer(routelayer){
            routeLayer.eachLayer(function(layer) {
                routeLayer.removeLayer(layer);
            })
        },
        dlExcel(){
            let vehs = Object.keys(this.opt.assignment).slice(0,-1)
            const workbook = XLSX.utils.book_new();

            for (let i=0;i<vehs.length;i++){
                let v = vehs[i]
                const data = [["Index","Time", "Premises", "House", "Street", "Alias", "Tonnage(kg)", "Og", "Extra"]];
                for (let j=0;j<this.map2loc[v].length;j++){
                    if (this.locations[this.map2loc[v][j]] === "IP"){
                        index = "IP"
                    }
                    else if (this.locations[this.map2loc[v][j]] === "DP"){
                        index = "DP"
                    }
                    else 
                    {
                        index = this.routeOrder[v][j]
                    }
                    time = this.routeTime[v][j]
                    premises = this.opt.points.Premises[this.locations[this.map2loc[v][j]]] 
                    house =  this.opt.points.House[this.locations[this.map2loc[v][j]]] 
                    street =  this.opt.points.Street[this.locations[this.map2loc[v][j]]] 
                    alias =  this.opt.points.Alias[this.locations[this.map2loc[v][j]]] 
                    tonnage =  this.opt.points.Tonnage_kg[this.locations[this.map2loc[v][j]]]
                    og = this.opt.total_routes.Name[this.opt.points.Vehicle_ID[this.locations[this.map2loc[v][j]]]]
                    extra = this.routeOutlier[v][j]?this.routeOutlier[v][j]:''
                    const row = [index,time,premises,house,street,alias,tonnage,og,extra]
                    data.push(row)
                }
                const sheet = XLSX.utils.aoa_to_sheet(data);
                XLSX.utils.book_append_sheet(workbook, sheet, vehs[i]);
            }
              const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
              const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
              const downloadLink = document.createElement('a');
              downloadLink.href = window.URL.createObjectURL(blob);
              downloadLink.download = 'output.xlsx';
              document.body.appendChild(downloadLink);
              downloadLink.click();
              document.body.removeChild(downloadLink);
        }
    },
    created(){
        this.loadData();
    },
    mounted() {
        this.map = L.map('map', { zoomControl: false, zoomAnimation: false }).setView([1.281651,103.829894], 11);
        L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
        }).addTo(this.map);

        //create user choice list and master location list     
        let vehs = Object.keys(this.opt.assignment).slice(0,-1)
        let uid = 0
        for (let i=0;i<Object.keys(this.opt.assignment).length-1;i++){
            this.Sortables[vehs[i]] = this.createSortable(document.getElementById("routeList"+i))
            const points = [...Object.values(this.opt.assignment[vehs[i]].points_id)]
            // console.log(points)
            this.locations = this.locations.concat(points)
            // add index of points to map2loc[vehs[i]]
            this.map2loc[vehs[i]] = []
            for (k=0; k<points.length;k++){
                this.map2loc[vehs[i]].push(uid)
                uid += 1
            }
            this.map2loc[vehs[i]] = Object.values(this.map2loc[vehs[i]])
            //init routelayer
            this.routeLayer[vehs[i]] = L.layerGroup();
            this.routeLayer[vehs[i]].addTo(this.map);
        }

        this.Sortables["unassigned"] = this.createSortable(document.getElementById("unassignedList"))
        const points = [...Object.values(this.opt.assignment['unassigned'].points_id)]
        this.locations = this.locations.concat(points)
        this.map2loc['unassigned'] = []
            for (k=0; k<points.length;k++){
                this.map2loc['unassigned'].push(uid)
                uid += 1
            }
        this.map2loc['unassigned'] = Object.values(this.map2loc['unassigned'])
        this.locations = Object.values(this.locations)
        this.routeLayer['unassigned'] = L.layerGroup();
        this.routeLayer['unassigned'].addTo(this.map);

        L.control.layers(null, this.routeLayer).addTo(this.map);

        var click_elements = document.getElementsByClassName("leaflet-control-layers-selector");
        // set all layers off and add classname 
        for (let i = 0;i < click_elements.length;i++) {
            click = click_elements[i];
            click.checked = false;
            click.classList.add( "layer-"+Object.keys(this.opt.assignment)[i]);
        }

        // add depot marker
        this.addIpDp();

        var ua = document.getElementsByClassName("layer-unassigned");
        for (let i = 0;i < ua.length;i++) {
            clicka = ua[i];
            clicka.checked = true;}
        
        for (let i=0;i<Object.keys(this.opt.assignment).length-1;i++){
            this.updateRouteOrder(vehs[i])
            var click_elements = document.getElementsByClassName("layer-"+vehs[i]);
            for (let i = 0;i < click_elements.length;i++) {
                click = click_elements[i];
                click.checked = true;}
        }

    },
    delimiters: ['{[', ']}']

});

app.mount('#app');