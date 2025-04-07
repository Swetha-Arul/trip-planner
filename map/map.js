function loadGoogleMapsApi() {
  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&libraries=places,geometry`;
  script.defer = true;
  script.async = true;
  script.onload = initMap;
  document.head.appendChild(script);
}

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
  let hotelMarkers = [];
  let weatherMarkers = [];
  let restaurantMarkers = [];
  let activeFilters = {
    restaurant: {
      vegOnly: false,
      minRating: 0
    },
    hotel: {
      maxPrice: 4,
      minRating: 0
    },
    weather: {
      avoidRain: false,
      avoidExtremes: false
    }
  };

function clearRestaurantMarkers() {
  restaurantMarkers.forEach(marker => marker.setMap(null));
  restaurantMarkers = [];
}

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
  
  function buildDirectionsList(route) {
    const container = document.getElementById("directions-list");
    container.innerHTML = "";
    let stepIndex = 0;
    route.legs.forEach(leg => {
      leg.steps.forEach(step => {
        const stepDiv = document.createElement("div");
        stepDiv.className = "direction-step";
        stepDiv.id = "step-" + stepIndex;
        
        const iconDiv = document.createElement("div");
        iconDiv.className = "icon-container";
        let iconHTML = "";
        if (step.maneuver) {
          iconHTML = getManeuverIcon(step.maneuver);
        } else {
          iconHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l-5 9h10z"/></svg>`;
        }
        iconDiv.innerHTML = iconHTML;
        if (step.distance && step.distance.text) {
          const distanceDiv = document.createElement("div");
          distanceDiv.className = "duration-text";
          distanceDiv.textContent = step.distance.text;
          iconDiv.appendChild(distanceDiv);
        }
        
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

  function calculateRoute(event) {
  event.preventDefault();
  stopNavigation();
  document.getElementById("directions-list").style.display = "none";

  weatherMarkers.forEach(marker => marker.setMap(null));
  weatherMarkers = [];
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
          document.querySelectorAll(".alternative-route").forEach(el => el.classList.remove("selected"));
          
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

  function selectRoute(index) {
    selectedRouteIndex = index;
    const route = directionsResult.routes[index];
    clearRoutePolylines();
    clearRouteMarkers();
    directionsResult.routes.forEach((route, i) => {

      const polylineOptions = {
        path: route.overview_path,
        strokeColor: "#007bff",
        strokeOpacity: (i === index) ? 1 : 0.3, 
        strokeWeight: (i === index) ? 5 : 3, 
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
    
    if (!currentMarker) {
      currentMarker = new google.maps.Marker({
        position: currentPos,
        map: map,
        title: "Your Location",
        icon: {
          url: "../pics/car2.png",
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
      
      const allSteps = document.querySelectorAll(".direction-step");
      allSteps.forEach(el => el.classList.remove("active"));
      const activeStepEl = document.getElementById("step-" + nextStepIndex);
      if (activeStepEl) {
        activeStepEl.classList.add("active");
        const directionsContainer = document.getElementById("directions-list");
        if (directionsContainer) {
          const containerRect = directionsContainer.getBoundingClientRect();
          const elementRect = activeStepEl.getBoundingClientRect();
          const offset = elementRect.top - containerRect.top - (directionsContainer.clientHeight / 2) + (activeStepEl.clientHeight / 2);
          directionsContainer.scrollBy({ top: offset, behavior: "smooth" });
        }
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
       
  function startNavigation() {
    if (!currentMarker) {
      alert("Live location not detected. Please ensure location services are enabled.");
      return;
    }
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

  function showWeatherAlongRoute() {
    if (!directionsResult || !directionsResult.routes || directionsResult.routes.length === 0) {
      alert("Please calculate a route first.");
      return;
    }
  
    const routePath = directionsResult.routes[selectedRouteIndex].overview_path;
    weatherMarkers.forEach(marker => marker.setMap(null));
    weatherMarkers = [];
  
    const displayCount = Math.min(10, routePath.length);
    const interval = Math.floor(routePath.length / displayCount);
  
    for (let i = 0; i < displayCount; i++) {
      const index = i * interval;
      const point = routePath[index];
      const lat = point.lat();
      const lng = point.lng();
      const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${WEATHER_API_KEY}&units=metric`;
  
      fetch(weatherUrl)
        .then(response => response.json())
        .then(data => {
          const marker = new google.maps.Marker({
            position: point,
            map: map,
            icon: {
              url: "https://maps.google.com/mapfiles/kml/shapes/partly_cloudy.png",
              scaledSize: new google.maps.Size(40, 40)
            },
            title: "Weather Info"
          });
  
          const weatherData = {
            name: "Weather Info",
            temp: data.main.temp,
            feels_like: data.main.feels_like,
            weatherDesc: data.weather[0].description,
            humidity: data.main.humidity,
            windSpeed: data.wind.speed
          };
  
          const infowindow = createCustomInfoWindow(weatherData, 'weather');
          
          marker.addListener("click", () => {
            infowindow.open(map, marker);
          });
  
          weatherMarkers.push(marker);
        })
        .catch(error => console.error("Error fetching weather data", error));
    }
  }




  
  
function showGasStations() {
  if (!directionsResult || !directionsResult.routes || directionsResult.routes.length === 0) {
    alert("Please calculate a route first.");
    return;
  }

  const routePath = directionsResult.routes[selectedRouteIndex].overview_path;
  const routePolyline = new google.maps.Polyline({ path: routePath });

  const numWaypoints = 10;
  const stepSize = Math.floor(routePath.length / numWaypoints);
  
  let waypoints = [];
  for (let i = 0; i < numWaypoints; i++) {
    waypoints.push(routePath[i * stepSize]);
  }

  const placesService = new google.maps.places.PlacesService(map);
  
  fuelMarkers.forEach(marker => marker.setMap(null));
  fuelMarkers = [];

  const tolerance = 0.002;
  let searchCount = 0;

  waypoints.forEach((waypoint, index) => {
    const request = {
      location: waypoint,
      radius: 5000, 
      type: "gas_station",
    };

    placesService.nearbySearch(request, (results, status) => {
      searchCount++;

      if (status === google.maps.places.PlacesServiceStatus.OK && results.length > 0) {
        results.forEach(place => {
          if (google.maps.geometry.poly.isLocationOnEdge(place.geometry.location, routePolyline, tolerance)) {
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

            const infowindow = createCustomInfoWindow(place, 'gas');
            marker.addListener("click", () => {
              infowindow.open(map, marker);
            });
          }
        });
      }

      if (searchCount === waypoints.length) {
        console.log(`Gas stations search complete. Found ${fuelMarkers.length} stations.`);
      }
    });
  });
}


function showRestaurantsAlongRoute() {
  if (!directionsResult || !directionsResult.routes || directionsResult.routes.length === 0) {
    alert("Please calculate a route first.");
    return;
  }

  const routePath = directionsResult.routes[selectedRouteIndex].overview_path;
  const routePolyline = new google.maps.Polyline({ path: routePath });


  const numWaypoints = 10;
  const stepSize = Math.floor(routePath.length / numWaypoints);
  let waypoints = [];
  for (let i = 0; i < numWaypoints; i++) {
    waypoints.push(routePath[i * stepSize]);
  }

  const placesService = new google.maps.places.PlacesService(map);
  clearRestaurantMarkers();

  const tolerance = 0.002;
  let searchCount = 0;

  waypoints.forEach((waypoint, index) => {
    const request = {
      location: waypoint,
      radius: 5000,
      type: "restaurant",
      keyword: "food" 
    };

    placesService.nearbySearch(request, (results, status) => {
      searchCount++;

      
      if (status === google.maps.places.PlacesServiceStatus.OK && results.length > 0) {
        results.forEach(place => {
          if (google.maps.geometry.poly.isLocationOnEdge(place.geometry.location, routePolyline, tolerance)) {
                if (activeFilters.restaurant.vegOnly && 
                    !place.name.toLowerCase().includes('veg')) return;
                    
                if (place.rating < activeFilters.restaurant.minRating) return;
          
            const marker = new google.maps.Marker({
              position: place.geometry.location,
              map: map,
              icon: {
                url: "https://maps.gstatic.com/mapfiles/place_api/icons/v1/png_71/restaurant-71.png",
                scaledSize: new google.maps.Size(30, 30),
              },
              title: place.name,
            });
            restaurantMarkers.push(marker);

             const infowindow = createCustomInfoWindow(place, 'restaurant');
            marker.addListener("click", () => {
              infowindow.open(map, marker);
            });
          }
        });
      }

      if (searchCount === waypoints.length) {
        console.log(`Restaurant search complete. Found ${restaurantMarkers.length} places.`);
      }
    });
  });
}

  



function clearHotelMarkers() {
  hotelMarkers.forEach(marker => marker.setMap(null));
  hotelMarkers = [];
}

function showHotelsAlongRoute() {
  if (!directionsResult || !directionsResult.routes || directionsResult.routes.length === 0) {
    alert("Please calculate a route first.");
    return;
  }

  const routePath = directionsResult.routes[selectedRouteIndex].overview_path;
  const routePolyline = new google.maps.Polyline({ path: routePath });

  const numWaypoints = 10;
  const stepSize = Math.floor(routePath.length / numWaypoints);
  let waypoints = [];
  for (let i = 0; i < numWaypoints; i++) {
    waypoints.push(routePath[i * stepSize]);
  }

  const placesService = new google.maps.places.PlacesService(map);
  clearHotelMarkers();

  const tolerance = 0.002;
  let searchCount = 0;

  waypoints.forEach((waypoint, index) => {
    const request = {
      location: waypoint,
      radius: 5000,
      type: "lodging",
      fields: ["name", "geometry", "rating", "vicinity"]
    };

    placesService.nearbySearch(request, (results, status) => {
      searchCount++;

      if (status === google.maps.places.PlacesServiceStatus.OK && results.length > 0) {
        results.forEach(place => {
          if (place.rating < activeFilters.hotel.minRating) return;
          if (place.price_level > activeFilters.hotel.maxPrice) return;
          if (google.maps.geometry.poly.isLocationOnEdge(place.geometry.location, routePolyline, tolerance)) {
            const marker = new google.maps.Marker({
              position: place.geometry.location,
              map: map,
              icon: {
                url: "https://maps.google.com/mapfiles/kml/shapes/lodging.png",
                scaledSize: new google.maps.Size(30, 30),
              },
              title: place.name,
            });
            hotelMarkers.push(marker);

            const infowindow = createCustomInfoWindow(place, 'hotel');
            marker.addListener("click", () => {
              infowindow.open(map, marker);
            });
          }
        });
      }

      if (searchCount === waypoints.length) {
        console.log(`Hotel search complete. Found ${hotelMarkers.length} hotels.`);
      }
    });
  });
}

function createCustomInfoWindow(data, type) {

  let content = `
    <div class="custom-infowindow">
      <div class="header ${type}">
        <h3>${data.name || 'Location Info'}</h3>
        ${type === 'weather' ? '<div class="weather-icon">⛅</div>' : ''}
      </div>
      <div class="content">
  `;


  switch(type) {
    case 'restaurant':
      content += `
        <p class="address">📍 ${data.vicinity || 'Address not available'}</p>
        <div class="rating">${data.rating ? '⭐ '.repeat(Math.round(data.rating)) : 'No ratings'}</div>
        <p class="type"><strong>Type:</strong> ${getVegStatus(data.name)}</p>
      `;
      break;

    case 'hotel':
      content += `
        <p class="address">📍 ${data.vicinity || 'Address not available'}</p>
        <div class="rating">${data.rating ? '⭐ '.repeat(Math.round(data.rating)) : 'No ratings'}</div>
        <p class="price-level">${getPriceLevel(data.price_level)}</p>
      `;
      break;

    case 'gas':
      content += `
        <p class="address">📍 ${data.vicinity || 'Address not available'}</p>
        <div class="rating">${data.rating ? '⭐ '.repeat(Math.round(data.rating)) : 'No ratings'}</div>
        <p class="status">⛽ 24/7: ${data.opening_hours?.open_now ? 'Yes' : 'Unknown'}</p>
      `;
      break;

    case 'weather':
      content += `
        <p class="temp">🌡️ ${data.temp}°C (Feels like ${data.feels_like}°C)</p>
        <p class="condition">${data.weatherDesc}</p>
        <p class="humidity">💧 Humidity: ${data.humidity}%</p>
        <p class="wind">🌬️ Wind: ${data.windSpeed} m/s</p>
      `;
      break;
  }

  content += `</div></div>`;

  const infowindow = new google.maps.InfoWindow({
    content: content
  });

  return infowindow;
}

function getVegStatus(name) {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('veg') || lowerName.includes('vegetarian')) return '🥕 Vegetarian';
  if (lowerName.includes('non-veg') || lowerName.includes('meat')) return '🍖 Non-Vegetarian';
  return '🍴 Mixed Menu';
}

function getPriceLevel(level) {
  if (!level) return '';
  return '💵'.repeat(level) + ' '.repeat(4 - level);
}




document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("form").addEventListener("submit", calculateRoute);
  loadGoogleMapsApi();
  
  document.getElementById("traffic-toggle").addEventListener("change", function() {
    if (this.checked) {
      trafficLayer.setMap(map);
    } else {
      trafficLayer.setMap(null);
    }
  });
  document.getElementById("form").addEventListener("submit", function(event) {
    event.preventDefault();
    
    document.querySelectorAll("#sidebar button").forEach(button => {
        button.classList.remove("active");
    });

    document.getElementById("route-toggle").classList.add("active");

    document.getElementById("route-sidebar").classList.add("show");
});
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
    google.maps.event.trigger(map, "resize");
    map.setCenter(center);
  });

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

  document.getElementById("w-icon").addEventListener("click", () => {
    if (!directionsResult) {
      alert("Please calculate a route first.");
      document.getElementById("w-icon").classList.remove("active");
      return;
    }
    
    if (weatherMarkers.length > 0) {
      weatherMarkers.forEach(marker => marker.setMap(null));
      weatherMarkers = [];
    } else {
      showWeatherAlongRoute();
    }
  });
  
  

  document.getElementById("fuel-icon").addEventListener("click", () => {
    if (fuelMarkers.length > 0) {
      fuelMarkers.forEach(marker => marker.setMap(null));
      fuelMarkers = [];
    } else {
      showGasStations();
    }
  });
  document.getElementById("restaurant-icon").addEventListener("click", () => {
    if (restaurantMarkers.length > 0) {
      clearRestaurantMarkers();
    } else {
      showRestaurantsAlongRoute();
    }
  });
  document.getElementById("hotel-icon").addEventListener("click", () => {
    if (hotelMarkers.length > 0) {
      clearHotelMarkers();
    } else {
      showHotelsAlongRoute();
    }
  });
  /*document.getElementById("tourist-icon").addEventListener("click", () => {
    // Toggle active state.
    document.getElementById("tourist-icon").classList.toggle("active");
    if (touristMarkers.length > 0) {
      // If markers are already shown, remove them.
      touristMarkers.forEach(marker => marker.setMap(null));
      touristMarkers = [];
    } else {
      showTouristAttractionsAlongRoute();
    }
  });*/
  
  document.getElementById("tourist-icon").addEventListener("click", () => {
    document.getElementById("filter-modal").style.display = "block";
  });
  
  document.getElementById("cancel-filter").addEventListener("click", () => {
    document.getElementById("filter-modal").style.display = "none";
  });
  
  document.getElementById("filter-form").addEventListener("submit", (e) => {
    e.preventDefault();
    
    activeFilters = {
      restaurant: {
        vegOnly: document.getElementById("veg-only").checked,
        minRating: parseInt(document.getElementById("restaurant-rating").value)
      },
      hotel: {
        maxPrice: parseInt(document.getElementById("hotel-price").value),
        minRating: parseInt(document.getElementById("hotel-rating").value)
      },
      weather: {
        avoidRain: document.getElementById("avoid-rain").checked,
        avoidExtremes: document.getElementById("avoid-extremes").checked
      }
    };
  
    if (restaurantMarkers.length > 0) {
      clearRestaurantMarkers();
      showRestaurantsAlongRoute();
    }
    if (hotelMarkers.length > 0) {
      clearHotelMarkers();
      showHotelsAlongRoute();
    }
    if (weatherMarkers.length > 0) {
      weatherMarkers.forEach(m => m.setMap(null));
      weatherMarkers = [];
      showWeatherAlongRoute();
    }
  
    document.getElementById("filter-modal").style.display = "none";
  });

  const routeRequiredIds = ['w-icon','fuel-icon', 'restaurant-icon', 'hotel-icon', 'tourist-icon'];

  function toggleRouteButtonHighlight() {
    const routeBtn = document.getElementById("route-toggle");
    routeBtn.classList.toggle("active");
  }

  document.querySelectorAll("#sidebar button").forEach(btn => {
    if (btn.id === "route-toggle") {
      btn.addEventListener("click", () => {
        toggleRouteButtonHighlight();
      });
    } else {
      btn.addEventListener("click", () => {
        if (routeRequiredIds.includes(btn.id) && !directionsResult) {
          alert("Please calculate a route first.");
          btn.classList.remove("active");
          return;
        }
        btn.classList.toggle("active");
      });
    }
    document.getElementById("form").addEventListener("submit", function(event) {
      event.preventDefault();
      
      document.querySelectorAll("#sidebar button").forEach(button => {
          button.classList.remove("active");
      });
    
      document.getElementById("route-toggle").classList.add("active");

      document.getElementById("route-sidebar").classList.add("show");

      calculateRoute();
    });
  });
});