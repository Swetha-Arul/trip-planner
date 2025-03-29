function loadGoogleMapsApi() {
  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&libraries=places`;
  script.defer = true;
  script.async = true;
  script.onload = initMap; // Call initMap after the script loads
  document.head.appendChild(script);
}
loadGoogleMapsApi();

 
 // Helper function to return an icon based on the maneuver.
       
  // Global Variables
  let map, directionsService, directionsResult;
  let routePolylines = [];
  let routeMarkers = [];
  let currentMarker;
  let navigationInterval;
  let selectedRouteIndex = 0;
  let lastSpokenInstruction = "";
  let isNavigating = false;
  let trafficLayer;
  let fuelMarkers = [];
  let restaurantMarkers = [];
  let hotelMarkers = [];
       
  function getManeuverIcon(maneuver) {
    switch(maneuver) {
      case "turn-left":
        return `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M15 19l-7-7 7-7v14z"/></svg>`;
      case "turn-right":
        return `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 5l7 7-7 7V5z"/></svg>`;
      case "uturn-left":
        return `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 4v1c-4.42 0-8 3.58-8 8h2a6 6 0 0 1 6-6V4l4 4-4 4v-3c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5h2c0 3.31-2.69 6-6 6s-6-2.69-6-6 2.69-6 6-6V4z"/></svg>`;
      case "uturn-right":
        return `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 4v1c4.42 0 8 3.58 8 8h-2a6 6 0 0 1-6-6V4l-4 4 4 4v-3c2.76 0 5 2.24 5 5s-2.24 5-5 5-5-2.24-5-5h-2c0-3.31 2.69-6 6-6s6 2.69 6 6V4z"/></svg>`;
      default:
        return `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l-5 9h10z"/></svg>`;
    }
  }
  // Build an array of all steps from the selected route.
  function getAllSteps() {
    const steps = [];
    const route = directionsResult.routes[selectedRouteIndex];
    route.legs.forEach(leg => {
      leg.steps.forEach(step => {
        steps.push(step);
      });
    });
    return steps;
  }
  
  // Build the directions list with icons and distance (instead of duration).
  function buildDirectionsList(route) {
    const container = document.getElementById("directions-list");
    container.innerHTML = "";
    let stepIndex = 0;
    route.legs.forEach(leg => {
      leg.steps.forEach(step => {
        const stepDiv = document.createElement("div");
        stepDiv.className = "direction-step";
        stepDiv.id = "step-" + stepIndex;
        
        // Create icon container.
        const iconDiv = document.createElement("div");
        iconDiv.className = "icon-container";
        let iconHTML = "";
        if (step.maneuver) {
          iconHTML = getManeuverIcon(step.maneuver);
        } else {
          iconHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l-5 9h10z"/></svg>`;
        }
        iconDiv.innerHTML = iconHTML;
        // Instead of duration, display step distance.
        if (step.distance && step.distance.text) {
          const distanceDiv = document.createElement("div");
          distanceDiv.className = "duration-text";
          distanceDiv.textContent = step.distance.text;
          iconDiv.appendChild(distanceDiv);
        }
        
        // Create instruction text container.
        const instructionDiv = document.createElement("div");
        instructionDiv.className = "instruction-text";
        instructionDiv.textContent = step.instructions.replace(/<[^>]+>/g, '');
        
        stepDiv.appendChild(iconDiv);
        stepDiv.appendChild(instructionDiv);
        container.appendChild(stepDiv);
        stepIndex++;
      });
    });
  }
       
  /* ------------------ MAP & ROUTE PLANNING FUNCTIONS ------------------ */
  function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
      center: { lat: 37.7749, lng: -122.4194 },
      zoom: 8,
      minZoom: 2,
      disableDefaultUI: true
    });
  
    directionsService = new google.maps.DirectionsService();
    trafficLayer = new google.maps.TrafficLayer();
  
    new google.maps.places.Autocomplete(document.getElementById("start"));
    new google.maps.places.Autocomplete(document.getElementById("end"));
  
    // Check if dark mode was active and apply the dark map style.
    if (localStorage.getItem('darkmode') === 'active') {
      map.setOptions({ styles: darkMapStyle });
      document.body.classList.add('darkmode');
    }
  }
  
       
  function clearRoutePolylines() {
    routePolylines.forEach(poly => poly.setMap(null));
    routePolylines = [];
  }
       
  function clearRouteMarkers() {
    routeMarkers.forEach(marker => marker.setMap(null));
    routeMarkers = [];
  }
       
  function createRoutePolyline(route) {
    const polyline = new google.maps.Polyline({
      path: route.overview_path,
      strokeColor: "#007bff",
      strokeOpacity: 1,
      strokeWeight: 5,
    });
    polyline.setMap(map);
    return polyline;
  }
       
  function addRouteMarkers(route) {
    clearRouteMarkers();
    route.legs.forEach((leg, index) => {
      if (index === 0) {
        const startMarker = new google.maps.Marker({
          position: leg.start_location,
          map: map,
          label: "A"
        });
        routeMarkers.push(startMarker);
      }
      const label = String.fromCharCode(66 + index);
      const endMarker = new google.maps.Marker({
        position: leg.end_location,
        map: map,
        label: label
      });
      routeMarkers.push(endMarker);
    });
  }
       
  function formatTime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    else if (hours > 0) return `${hours}h ${minutes}m`;
    else if (minutes > 0) return `${minutes}m ${secs}s`;
    else return `${secs}s`;
  }
       
  // Calculate route and reset controls.
  function calculateRoute(event) {
  event.preventDefault();
  stopNavigation();
  document.getElementById("directions-list").style.display = "none";
  
  // Clear any previously added gas station markers.
  fuelMarkers.forEach(marker => marker.setMap(null));
  fuelMarkers = [];
  restaurantMarkers.forEach(marker => marker.setMap(null));
  restaurantMarkers = [];
  hotelMarkers.forEach(marker => marker.setMap(null));
  hotelMarkers = [];
  
  const start = document.getElementById("start").value;
  const end = document.getElementById("end").value;
  if (!start || !end) {
      alert("Please enter both start and destination!");
      return;
  }
  const stopInputs = document.querySelectorAll(".stop");
  const waypoints = Array.from(stopInputs)
      .filter(input => input.value.trim() !== "")
      .map(input => ({ location: input.value, stopover: true }));
  
  // Default travel mode: DRIVING.
  const travelMode = google.maps.TravelMode.DRIVING;
  
  const request = {
      origin: start,
      destination: end,
      waypoints: waypoints,
      travelMode: travelMode,
      unitSystem: google.maps.UnitSystem.METRIC,
      provideRouteAlternatives: true
  };
          
  directionsService.route(request, (result, status) => {
      if (status === "OK") {
      clearRoutePolylines();
      clearRouteMarkers();
      directionsResult = result;
      displayAlternateRoutes(result.routes);
      selectRoute(0);
      document.getElementById("route-results").style.display = "block";
      } else {
      alert("Could not display route. Try again.");
      }
  });
  }

       
  // Display alternate route summaries.
  function displayAlternateRoutes(routes) {
    const altContainer = document.getElementById("alternatives-container");
    altContainer.innerHTML = "";
    if (routes.length > 1) {
      routes.forEach((route, index) => {
        let totalDistance = 0, totalTime = 0;
        route.legs.forEach(leg => {
          totalDistance += leg.distance.value;
          totalTime += leg.duration.value;
        });
        const summaryText = `Route ${index + 1}: ${(totalDistance/1000).toFixed(2)} km, ${formatTime(totalTime)}`;
        const div = document.createElement("div");
        div.className = "alternative-route";
        div.textContent = summaryText;
        
        div.addEventListener("click", () => {
          selectRoute(index);
          // Remove "selected" class from all routes
          document.querySelectorAll(".alternative-route").forEach(el => el.classList.remove("selected"));
          // Add "selected" class to the clicked route
          div.classList.add("selected");
          
          if (isNavigating) {
            stopNavigation();
            startNavigation();
          }
        });
        
        altContainer.appendChild(div);
      });
    }
  }
  
       
  // Select a route, update map, travel summary, and build directions list.
  function selectRoute(index) {
    selectedRouteIndex = index;
    const route = directionsResult.routes[index];
    clearRoutePolylines();
    clearRouteMarkers();
    directionsResult.routes.forEach((route, i) => {
  // Use full opacity for the selected route and lower for the others.
      const polylineOptions = {
        path: route.overview_path,
        strokeColor: "#007bff",
        strokeOpacity: (i === index) ? 1 : 0.3, // full opacity for selected route
        strokeWeight: (i === index) ? 5 : 3, // thicker line for selected route
        map: map
      };
      const polyline = new google.maps.Polyline(polylineOptions);
      routePolylines.push(polyline);
  });
    addRouteMarkers(route);
           
    const bounds = new google.maps.LatLngBounds();
    route.legs.forEach(leg => {
      bounds.extend(leg.start_location);
      bounds.extend(leg.end_location);
    });
    map.fitBounds(bounds, { padding: 50 });

           
    let totalDistance = 0, totalTime = 0;
    route.legs.forEach(leg => {
      totalDistance += leg.distance.value;
      totalTime += leg.duration.value;
    });
    const now = new Date();
    const arrivalTime = new Date(now.getTime() + totalTime * 1000);
    const arrivalTimeStr = arrivalTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const summaryHTML = `
      <div class="summary-detail"><strong>Total Distance:</strong> ${(totalDistance/1000).toFixed(2)} km</div>
      <div class="summary-detail"><strong>Total Time:</strong> ${formatTime(totalTime)}</div>
      <div class="summary-detail"><strong>Est. Arrival:</strong> ${arrivalTimeStr}</div>
    `;
    document.getElementById("total-info").innerHTML = summaryHTML;
    
    buildDirectionsList(route);
    document.getElementById("directions-list").style.display = "block";
    
    if (isNavigating) {
      updateNavigation();
    }
  }
       
  /* --------------------- LIVE GPS TRACKING --------------------- */
  function updateCurrentPosition(position) {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    document.getElementById("lat").textContent = "Lat: " + lat.toFixed(6);
    document.getElementById("lng").textContent = "Lng: " + lng.toFixed(6);
    document.getElementById("speed").textContent =
      "Speed: " + (position.coords.speed !== null ? position.coords.speed.toFixed(2) + " m/s" : "N/A");
    document.getElementById("accuracy").textContent =
      "Accuracy: " + position.coords.accuracy + " m";
          
    const currentPos = new google.maps.LatLng(lat, lng);
    
    // Create or update a custom marker using a car icon.
    if (!currentMarker) {
      currentMarker = new google.maps.Marker({
        position: currentPos,
        map: map,
        title: "Your Location",
        icon: {
          // Using a car icon image URL (you can replace it with your own)
          url: "../pics/car2.png",
          // Adjust the size as needed
          scaledSize: new google.maps.Size(40, 60),
        }
      });
    } else {
      currentMarker.setPosition(currentPos);
    }
          
    if (!directionsResult) {
      map.setCenter(currentPos);
      map.setZoom(15);
    }
          
    const startInput = document.getElementById("start");
    if (startInput && !startInput.value) {
      startInput.value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
          
    checkDeviation(currentPos);
  }

       
  function handleGeolocationError(error) {
    console.error("Error obtaining location:", error);
    alert("Error obtaining location. Please ensure location services are enabled.");
  }
       
  /* --------------------- NAVIGATION MODE FUNCTIONS --------------------- */
  function getDistanceBetweenPoints(lat1, lng1, lat2, lng2) {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
       
  function checkDeviation(currentPos) {
    if (!directionsResult || !currentMarker) return;
    const route = directionsResult.routes[selectedRouteIndex];
    let minDistance = Infinity;
    route.legs.forEach(leg => {
      leg.steps.forEach(step => {
        const d = getDistanceBetweenPoints(
          currentPos.lat(), currentPos.lng(),
          step.end_location.lat(), step.end_location.lng()
        );
        if (d < minDistance) minDistance = d;
      });
    });
    if (minDistance > 50) {
      console.warn("You appear to have deviated from the planned route.");
    }
  }
       
  // Update navigation: highlight active step and use voice guidance.
  function updateNavigation() {
    if (!directionsResult || !currentMarker) return;
    const currentPos = currentMarker.getPosition();
    const route = directionsResult.routes[selectedRouteIndex];
    const steps = getAllSteps();
    let nextStep = null;
    let nextStepIndex = 0;
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const d = getDistanceBetweenPoints(
        currentPos.lat(), currentPos.lng(),
        step.end_location.lat(), step.end_location.lng()
      );
      if (d > 30) { // threshold
        nextStep = step;
        nextStepIndex = i;
        break;
      }
    }
         
    if (nextStep) {
      const distanceToTurn = getDistanceBetweenPoints(
        currentPos.lat(), currentPos.lng(),
        nextStep.end_location.lat(), nextStep.end_location.lng()
      );
      let remainingDistance = 0, found = false;
      for (const leg of route.legs) {
        for (const step of leg.steps) {
          if (!found && step === nextStep) {
            remainingDistance += step.distance.value;
            found = true;
          } else if (found) {
            remainingDistance += step.distance.value;
          }
        }
      }
      const instructionText = nextStep.instructions.replace(/<[^>]+>/g, '');
      document.getElementById("nav-instruction").textContent = instructionText;
      document.getElementById("nav-details").textContent =
        "Turn in: " + (distanceToTurn / 1000).toFixed(2) + " km | Remaining: " + (remainingDistance / 1000).toFixed(2) + " km";
      
      // Highlight active step.
      const allSteps = document.querySelectorAll(".direction-step");
      allSteps.forEach(el => el.classList.remove("active"));
      const activeStepEl = document.getElementById("step-" + nextStepIndex);
      if (activeStepEl) {
        activeStepEl.classList.add("active");
        // Scroll only the directions container.
        const directionsContainer = document.getElementById("directions-list");
        if (directionsContainer) {
          // Compute the relative offset to center the active step in the container.
          const containerRect = directionsContainer.getBoundingClientRect();
          const elementRect = activeStepEl.getBoundingClientRect();
          const offset = elementRect.top - containerRect.top - (directionsContainer.clientHeight / 2) + (activeStepEl.clientHeight / 2);
          directionsContainer.scrollBy({ top: offset, behavior: "smooth" });
        }
        // Optionally update the displayed distance in the active step using computed distance:
        let computedDistance = "";
        if (distanceToTurn < 1000) {
          computedDistance = Math.round(distanceToTurn) + " m";
        } else {
          computedDistance = (distanceToTurn / 1000).toFixed(2) + " km";
        }
        const distanceElement = activeStepEl.querySelector('.duration-text');
        if (distanceElement) {
          distanceElement.textContent = computedDistance;
        }
      }
      if (document.getElementById("voice-toggle").checked) {
        let distanceMsg = "";
        if (distanceToTurn < 1000) {
          distanceMsg = Math.round(distanceToTurn) + " meters";
        } else {
          distanceMsg = (distanceToTurn / 1000).toFixed(2) + " kilometers";
        }
        const voiceMessage = `Turn in ${distanceMsg}, then ${instructionText}`;
        if (voiceMessage !== lastSpokenInstruction) {
          lastSpokenInstruction = voiceMessage;
          speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(voiceMessage);
          utterance.lang = "en-US";
          speechSynthesis.speak(utterance);
        }
      }
    } else {
      document.getElementById("nav-instruction").textContent = "Arrived at destination";
      document.getElementById("nav-details").textContent = "";
    }
  }
       
  // Start navigation: show navigation instructions and begin updates.
  function startNavigation() {
    isNavigating = true;
    document.getElementById("nav-toggle").textContent = "Stop Navigation";
    document.getElementById("nav-container").style.display = "block";
    updateNavigation();
    navigationInterval = setInterval(updateNavigation, 2000);
  }
       
  function stopNavigation() {
    clearInterval(navigationInterval);
    isNavigating = false;
    document.getElementById("nav-toggle").textContent = "Start Navigation";
    document.getElementById("nav-container").style.display = "none";
    document.querySelectorAll(".direction-step").forEach(el => el.classList.remove("active"));
    lastSpokenInstruction = "";
    document.getElementById("voice-toggle").checked = false;
  }

  function showGasStations() {
    // Ensure a route is available (i.e. after the user has calculated a route)
    if (!directionsResult || !directionsResult.routes || directionsResult.routes.length === 0) {
      alert("Please calculate a route first.");
      return;
    }

    // Use the selected route's path to define the search bounds.
    const routePath = directionsResult.routes[selectedRouteIndex].overview_path;
    const bounds = new google.maps.LatLngBounds();
    routePath.forEach(point => bounds.extend(point));

    // Set up the Places API search request for gas stations.
    const request = {
      bounds: bounds,
      type: "gas_station",
    };

    const placesService = new google.maps.places.PlacesService(map);

    // Remove any existing fuel markers.
    fuelMarkers.forEach(marker => marker.setMap(null));
    fuelMarkers = [];

    // Execute the nearby search.
    placesService.nearbySearch(request, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        results.forEach(place => {
          const marker = new google.maps.Marker({
            position: place.geometry.location,
            map: map,
            icon: {
              url: "https://maps.google.com/mapfiles/kml/shapes/gas_stations.png",
              scaledSize: new google.maps.Size(30, 30),
            },
            title: place.name,
          });
          fuelMarkers.push(marker);

          // Create an info window that shows the station's details.
          const infowindow = new google.maps.InfoWindow({
            content: `<strong>${place.name}</strong><br>${place.vicinity}`,
          });

          marker.addListener("click", () => {
            infowindow.open(map, marker);
          });
        });
      }
    });
  }


function showRestaurantsAlongRoute() {
// Toggle: if markers exist, remove them.
if (restaurantMarkers.length > 0) {
  restaurantMarkers.forEach(marker => marker.setMap(null));
  restaurantMarkers = [];
  return;
}

// Check if a route exists.
if (!directionsResult || !directionsResult.routes || directionsResult.routes.length === 0) {
  alert("Please calculate a route first.");
  return;
}

// Retrieve the overview path of the selected route.
const path = directionsResult.routes[selectedRouteIndex].overview_path;

// Create a PlacesService instance.
const placesService = new google.maps.places.PlacesService(map);

// Set a search radius (in meters).
const radius = 500;

// Use a Set to keep track of place_ids and avoid duplicates.
const foundPlaceIds = new Set();

// Sample a few points along the route.
// For example, divide the path into 10 segments.
const sampleCount = 10;
const sampleInterval = Math.max(Math.floor(path.length / sampleCount), 1);

for (let i = 0; i < path.length; i += sampleInterval) {
  const location = path[i];
  const request = {
    location: location,
    radius: radius,
    type: "restaurant"
  };
  
  placesService.nearbySearch(request, (results, status) => {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
      results.forEach(place => {
        // Only add marker if this restaurant hasn't been added already.
        if (!foundPlaceIds.has(place.place_id)) {
          foundPlaceIds.add(place.place_id);
          const marker = new google.maps.Marker({
            position: place.geometry.location,
            map: map,
            icon: {
              url: "https://maps.google.com/mapfiles/kml/shapes/dining.png",
              scaledSize: new google.maps.Size(30, 30)
            },
            title: place.name,
          });
          restaurantMarkers.push(marker);
          
          const infowindow = new google.maps.InfoWindow({
            content: `<strong>${place.name}</strong><br>${place.vicinity}`,
          });
          
          marker.addListener("click", () => {
            infowindow.open(map, marker);
          });
        }
      });
    }
  });
}
}

function showHotelsAlongRoute() {
// Toggle: if markers exist, remove them.
if (hotelMarkers.length > 0) {
  hotelMarkers.forEach(marker => marker.setMap(null));
  hotelMarkers = [];
  return;
}

if (!directionsResult || !directionsResult.routes || directionsResult.routes.length === 0) {
  alert("Please calculate a route first.");
  return;
}

// Retrieve the overview path of the selected route.
const path = directionsResult.routes[selectedRouteIndex].overview_path;

// Create a PlacesService instance.
const placesService = new google.maps.places.PlacesService(map);

// Set a search radius (in meters) for hotels.
const radius = 500;

// Use a Set to keep track of place_ids to avoid duplicates.
const foundPlaceIds = new Set();

// Sample points along the route.
const sampleCount = 10;
const sampleInterval = Math.max(Math.floor(path.length / sampleCount), 1);

for (let i = 0; i < path.length; i += sampleInterval) {
  const location = path[i];
  const request = {
    location: location,
    radius: radius,
    type: "lodging"  // "lodging" is the type for hotels.
  };
  
  placesService.nearbySearch(request, (results, status) => {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
      results.forEach(place => {
        // Add the hotel marker only if it hasn't been added already.
        if (!foundPlaceIds.has(place.place_id)) {
          foundPlaceIds.add(place.place_id);
          const marker = new google.maps.Marker({
            position: place.geometry.location,
            map: map,
            icon: {
              url: "https://maps.google.com/mapfiles/kml/shapes/lodging.png",
              scaledSize: new google.maps.Size(30, 30)
            },
            title: place.name,
          });
          hotelMarkers.push(marker);
          
          // Create an info window to show details.
          const infowindow = new google.maps.InfoWindow({
            content: `<strong>${place.name}</strong><br>${place.vicinity}`,
          });
          
          marker.addListener("click", () => {
            infowindow.open(map, marker);
          });
        }
      });
    }
  });
}
}
  document.addEventListener("DOMContentLoaded", () => {
    initMap();
    document.getElementById("form").addEventListener("submit", calculateRoute);

    // Traffic toggle event listener.
    document.getElementById("traffic-toggle").addEventListener("change", function() {
      if (this.checked) {
        trafficLayer.setMap(map);
      } else {
        trafficLayer.setMap(null);
      }
    });

    // Dynamic stop input listener.
    document.getElementById("addstop").addEventListener("click", () => {
      const stopsContainer = document.getElementById("stops-container");
      const stopItem = document.createElement("div");
      stopItem.classList.add("stop-item");

      const stopInput = document.createElement("input");
      stopInput.type = "text";
      stopInput.classList.add("stop");
      stopInput.placeholder = "Enter stop location";
      stopInput.setAttribute("autocomplete", "off");
      new google.maps.places.Autocomplete(stopInput);

      const removeIcon = document.createElement("div");
      removeIcon.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" aria-hidden="true">
          <path fill="red" d="m256-200-56-56 224-224-224-244 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/>
        </svg>
      `;
      removeIcon.style.cursor = "pointer";
      removeIcon.addEventListener("click", () => stopItem.remove());

      stopItem.appendChild(stopInput);
      stopItem.appendChild(removeIcon);
      stopsContainer.appendChild(stopItem);
    });

    document.getElementById("route-toggle").addEventListener("click", () => {
      const routeSidebar = document.getElementById("route-sidebar");
      routeSidebar.classList.toggle("show");

      if (routeSidebar.classList.contains("show")) {
        document.getElementById("map").style.left = "430px";
        document.getElementById("map").style.width = "calc(100% - 430px)";
      } else {
        document.getElementById("map").style.left = "80px";
        document.getElementById("map").style.width = "calc(100% - 80px)";
      }
      
      const center = map.getCenter();
      google.maps.event.trigger(map, 'resize');
      map.setCenter(center);
    });
           
    // Toggle directions list visibility.
           
    // Navigation toggle.
    document.getElementById("nav-toggle").addEventListener("click", () => {
      if (!isNavigating) {
        startNavigation();
      } else {
        stopNavigation();
      }
    });

    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(updateCurrentPosition, handleGeolocationError, {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000
      });
    } else {
      alert("Geolocation is not supported by your browser.");
    }
    document.getElementById("fuel-icon").addEventListener("click", () => {
      // If fuel markers exist, remove them.
      if (fuelMarkers.length > 0) {
          fuelMarkers.forEach(marker => marker.setMap(null));
          fuelMarkers = [];
      } else {
          // Otherwise, show gas stations.
          showGasStations();
      }
    });
    document.getElementById("restaurant-icon").addEventListener("click", () => {
      // If restaurant markers exist, remove them.
      if (restaurantMarkers.length > 0) {
          restaurantMarkers.forEach(marker => marker.setMap(null));
          restaurantMarkers = [];
      } else {
          // Otherwise, show restaurants.
          showRestaurantsAlongRoute();
      }
    });
    document.getElementById("hotel-icon").addEventListener("click", () => {
      // If restaurant markers exist, remove them.
      if (hotelMarkers.length > 0) {
          hotelMarkers.forEach(marker => marker.setMap(null));
          hotelMarkers = [];
      } else {
          // Otherwise, show restaurants.
          showHotelsAlongRoute();
      }
    }); 
  });

