// Create the tile layer that will be the background of our map
var lightmap = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/light-v9/tiles/256/{z}/{x}/{y}?access_token={accessToken}", {
  attribution: "Map data &copy; <a href=\"http://openstreetmap.org\">OpenStreetMap</a> contributors, <a href=\"http://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"http://mapbox.com\">Mapbox</a>",
  maxZoom: 18,
  id: "mapbox.light",
  accessToken: API_KEY
});

var streetmap = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/256/{z}/{x}/{y}?access_token={accessToken}", {
    attribution: "Map data &copy; <a href=\"http://openstreetmap.org\">OpenStreetMap</a> contributors, <a href=\"http://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"http://mapbox.com\">Mapbox</a>",
    maxZoom: 18,
    id: "mapbox.street",
    accessToken: API_KEY
  });

var satelitemap = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/256/{z}/{x}/{y}?access_token={accessToken}", {
    attribution: "Map data &copy; <a href=\"http://openstreetmap.org\">OpenStreetMap</a> contributors, <a href=\"http://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"http://mapbox.com\">Mapbox</a>",
    maxZoom: 18,
    id: "mapbox.satelite",
    accessToken: API_KEY
  });

// Initialize all of the LayerGroups we'll be using
var layers = {
  Minor: new L.LayerGroup(),
  Light: new L.LayerGroup(),
  Moderate: new L.LayerGroup(),
  Strong: new L.LayerGroup(),
  Mayor: new L.LayerGroup(),
  Great: new L.LayerGroup(),
  tectonicPlates: new L.LayerGroup()
};

// Create the map with our layers
var baseMaps = {
    "Light Map": lightmap,
    "Street Map": streetmap,
    "Satelite Map": satelitemap
  };

var map = L.map("map", {
  center: [15.55, -50.00],
  zoom: 2,
  layers: [lightmap,
    layers.Minor,
    layers.Light,
    layers.Moderate,
    layers.Strong,
    layers.Mayor,
    layers.Great,
    layers.tectonicPlates
  ]
});

// Create an overlays object to add to the layer control
var overlays = {
  "Minor": layers.Minor,
  "Light": layers.Light,
  "Moderate": layers.Moderate,
  "Strong": layers.Strong,
  "Mayor":layers.Mayor,
  "Great": layers.Great,
  "Tectonic Plates": layers.tectonicPlates
};

// Create a control for our layers, add our overlay layers to it
L.control.layers(baseMaps, overlays).addTo(map);

// Create a legend to display information about our map
var info = L.control({
  position: "bottomright"
});

// When the layer control is added, insert a div with the class of "legend"
info.onAdd = function() {
  var div = L.DomUtil.create("div", "legend");
  return div;
};
// Add the info legend to the map
info.addTo(map);

// Initialize an object containing icons for each layer group
var icons = {
  Minor:{
    fillColor: "white",
    radius: 4,
    color: "white",
    fillOpacity: 0.5
},
  Light:{
    fillColor: "yellow",
    radius: 6,
    color: "yellow",
    fillOpacity: 0.5
  },
  Moderate:{
    fillColor: "orange",
    radius: 8,
    color: "orange",
    fillOpacity: 0.5
  },
  Strong:{
    fillColor: "red",
    radius: 10,
    color: "red",
    fillOpacity: 0.5
  },
  Mayor:{
    fillColor: "red-dark",
    radius: 12,
    color: "red-dark",
    fillOpacity: 0.5
  },
  Great:{
    fillColor: "black",
    radius: 14,
    color: "black",
    fillOpacity: 0.5
  }
};

// Perform an API call to the Citi Bike features Information endpoint
d3.json("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson", function(response) {

    var features = response.features;

    // Create an object to keep of the number of markers in each layer
    var quakesCount = {
      Minor: 0,
      Light: 0,
      Moderate: 0,
      Strong: 0,
      Mayor: 0,
      Great: 0
    };

    // Initialize a magnitude, which will be used as a key to access the appropriate layers, icons, and features count for layer group
    var magnitude;

    // Loop through the featuress (they're the same size and have partially matching data)
    for (var index = 0; index < features.length; index++) {
        var quake = features[index];

      // If a features is listed but not installed, it's coming soon
      if (quake.properties.mag < 3.9) {
        magnitude = "Minor";
      }
      // If a features has no bikes available, it's empty
      else if (quake.properties.mag > 3.9 && quake.properties.mag <4.99) {
        magnitude = "Light";
      }
      // If a features is installed but isn't renting, it's out of order
      else if (quake.properties.mag > 5 && quake.properties.mag <5.99) {
        magnitude = "Moderate";
      }
      // If a features has less than 5 bikes, it's status is low
      else if (quake.properties.mag > 6 && quake.properties.mag <6.99) {
        magnitude = "Strong";
      }
      // Otherwise the features is normal
      else if (quake.properties.mag > 7 && quake.properties.mag <7.99) {
        magnitude = "Mayor";
      }

      else {
        magnitude = "Great";
      }

      // Update the features count
      quakesCount[magnitude]++;
      // Create a new marker with the appropriate icon and coordinates
      var newMarker = L.circleMarker([quake.geometry.coordinates[1], quake.geometry.coordinates[0]], options = icons[magnitude]
      );

      var now = new Date(quake.properties.time);
      var date = now.toLocaleString();    

      // Add the new marker to the appropriate layer
      newMarker.addTo(layers[magnitude]);

      // Bind a popup to the marker that will  display on click. This will be rendered as HTML
      newMarker.bindPopup("<h3>" + quake.properties.place + "<h3><h3>Magnitude: " + quake.properties.mag + "<h3><h3>Date: " +date+"<h3>" );
    }

    // Call the updateLegend function, which will... update the legend!
    updateLegend(quakesCount);
  });


// Update the legend's innerHTML with the last updated time and features count
function updateLegend(quakesCount) {
  document.querySelector(".legend").innerHTML = [
    "<p class='minor'>Minor: " + quakesCount.Minor + "</p>",
    "<p class='light'>Light: " + quakesCount.Light + "</p>",
    "<p class='moderate'>Moderate: " + quakesCount.Moderate + "</p>",
    "<p class='strong'>Strong: " + quakesCount.Strong + "</p>",
    "<p class='mayor'>Mayor: " + quakesCount.Mayor + "</p>",
    "<p class='great'>Great: " + quakesCount.Great + "</p>",
  ].join("");
}

var myStyle = {
    "color": "orange",
    "weight": 5,
    "opacity": 1
};


d3.json("https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json", function(response) {

    var lines = [];

    var features = response.features;

    for (var index = 0; index < features.length; index++) {
        var plate = features[index].geometry;


        lines.push(plate)
        }
    
    var myStyle = {
        "color": "orange",
        "weight": 2.5,
        "opacity": 0.65
    };
    
    L.geoJSON(lines, {
        style: myStyle
    }).addTo(layers.tectonicPlates);
});