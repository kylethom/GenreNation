var apiKey = "DQGPYAC0Q7TGSDPYU";

var map;
var geocoder;
var overlay;
var root;
var cityInfo = {};
var citiesOnMap = {};
var locationData = {};

/*------------------------------------------
   GOOGLE MAPS STUFF
-------------------------------------------*/

overlay = new google.maps.OverlayView();

$(document).ready(function(){

	//GOOGLE MAPS INITIALIZATION
	geocoder = new google.maps.Geocoder();
	//var styledMap = new google.maps.StyledMapType(styles,{name: "Styled Map"});

  	map = new google.maps.Map(d3.select('#map-canvas').node(), {
    	zoom: 3,
    	center: {lat: 45, lng: -45}
	});

  	//REPOSITION POINTS WHEN MAP ZOOMS
	google.maps.event.addListener(map, 'zoom_changed', function() {
		repositionMarkers();
	});

	//INITIAL MAP POPULATION (this needs to be included to create the layer that the markers are placed on)
	placeD3Markers("data/stations2.json");

});

//INITIATE OVERLAY AND ADD INITAL MARKERS
function placeD3Markers (dataSource){
	d3.json(dataSource, function(data) {

  		// Add the container when the overlay is added to the map.
  		overlay.onAdd = function() {
		    var layer = d3.select(this.getPanes().overlayLayer).append("div").attr("class", "stations");

		    // ADD INITIAL MARKERS TO OVERLAY
		    overlay.draw = function() {
		    	
		      	var projection = this.getProjection(),
		        	padding = 10;

		      	var marker = layer.selectAll("svg")
		          	.data(d3.entries(data))
		        	.enter()
		        	.append("svg:svg")
		          	.attr("class", "marker")
		          	.attr("id", function(d){return d.key});

		        repositionMarkers();

		      	// Add a circle.
		      	marker.append("svg:circle")
		          	.attr("r", 4.5)
		          	.attr("cx", padding)
		          	.attr("cy", padding);

		      	// Add a label.
		      	marker.append("svg:text")
		          	.attr("x", padding + 7)
		          	.attr("y", padding)
		          	.attr("dy", ".31em")
		          	.text(function(d) { return d.key; });
		    };
		};
		// Bind our overlay to the map…
		overlay.setMap(map);
	});
}

//REPOSITION MARKERS
function repositionMarkers(){
	d3.select('.stations')
		.selectAll('svg')
		.each(transform);
}

//REPOSTION MARKERS STEP 2
function transform(d) {
		
		var projection = overlay.getProjection();
	    d = new google.maps.LatLng(d.value[1], d.value[0]);
    	d = projection.fromLatLngToDivPixel(d);
    	return d3.select(this)
        	.style("left", (d.x - 10) + "px")
        	.style("top", (d.y - 10) + "px");
  	}

//GET JSON DATA FOR NEW MARKERS
function getCityData(newData){
	d3.json(newData, function(bata) {
		editOverlay(bata);
	});
}

//DRAW NEW MARKERS
function editOverlay(data){
	var bata = data;
	var newMarker = d3.select('.stations')
							.selectAll('div')
							.data(d3.entries(bata))
							.enter()
							.append('svg')
							.attr("class","marker")
							.attr("id", function (d){ 
								var formattedName = d.key;
								formattedName = formattedName.replace(/["']/g, "");
								formattedName = formattedName.replace(/ /g,"-");
								return formattedName });

		repositionMarkers();

		// Add a circle.
		newMarker.append("svg:circle")
		        .attr("r", 4.5)
		        .attr("cx", 10)
		        .attr("cy", 10);

		// Add a label.
		newMarker.append("svg:text")
		        .attr("x", 17)
		        .attr("y", 10)
		        .attr("dy", ".31em")
		        .text(function(d) { return d.key; });	
}

/*------------------------------------------
   GEOCODING
-------------------------------------------*/

//LOOP THROUGH CITIES AND CALL GEOCODE
function processCities(cityInput){
	$.getJSON( cityInput, function( data ) {
		for(var i = 0; i < data.length; i++) {
	    	var obj = data[i];
	    	codeAddress(obj.name);
		}
	});
}

//GEOCODE CITY -> takes a string from search box or string extracted from JSON in processCities

function codeAddress(addressInput){
	var address = addressInput;
	console.log('Searching for ' + address);

	geocoder.geocode( {'address':address}, function (results, status){
		if(status == google.maps.GeocoderStatus.OK){
			if(results[0].address_components[0].types[0] == 'locality'){
				locationData[results[0].address_components[0].long_name] = [
					results[0].geometry.location.D,
					results[0].geometry.location.k
				]
				fetchArtists(JSON.stringify(results[0].address_components[0].long_name));
			}else{
				$('#search-error').html('Sorry, ' + address + ' is not a city.');
			}
		}else{
			$('#search-error').html('Error, service not available');
		}
	})
}

// function codeAddress(addressInput) {
//     var address = addressInput;

//     console.log('Searching for artists from ' + addressInput);
    
//     geocoder.geocode( { 'address': address}, function(results, status) {
//       if (status == google.maps.GeocoderStatus.OK) {
//       	if(results[0].address_components[0].types[0] == 'locality'){
//       		console.log(results[0].address_components[0].types[0]);
// 	        map.setCenter(results[0].geometry.location);
	    	
// 			locationData[results[0].address_components[0].long_name] = [
// 				results[0].geometry.location.D,
// 				results[0].geometry.location.k
// 			]
// 	    	editOverlay(locationData);
// 	    	console.log(results);
// 	    	fetchArtists(JSON.stringify(results[0].address_components[0].long_name));
//       	}else{
//       	 	console.log('not a city name');
//       	 	$('#search-error').html('Sorry, ' + address + ' is not a city.');
//       	 }
//       	$('search-error').html('');
//       } else {
//       	console.log(status);
//       	$('#search-error').html('Sorry, no results for ' + address);
//       }
//     });
//   }

/*------------------------------------------
   ECHONEST
-------------------------------------------*/

//FETCH ARTIST INFORMATION ----------------------------------
function fetchArtists(location){
	var url = 'http://developer.echonest.com/api/v4/artist/search';
	var args = {
		format: 'json',
		api_key: apiKey,
		artist_location: location,
		results: 50,
		bucket: 'genre',
	};
	location = location.replace(/["'\.]/g, "");
	cityInfo[location] = {};
	
	console.log('Searching for artists from ' + location);
	$.getJSON(url, args, function(data){
		console.log('Search Complete');
		console.log(data.response);
		if(data.response.artists.length == 0){
			$('#search-error').html('Sorry, no artists in our database for ' + location);
		}else{
			console.log('Artists found for ' + location);
			$.each(data.response.artists, function(index, artist){		
				var artistName = JSON.stringify(artist.name).replace(/\"/g,'');
				$.each(artist.genres, function(index, genre){
					var genreName = JSON.stringify(genre.name).replace(/\"/g,'');
					cityInfo[location][genreName] = cityInfo[location][genreName] || []
					cityInfo[location][genreName].push(artistName)
				});
			});
			console.log(cityInfo[location]);
			displayGenres(location, cityInfo[location]);
		}
		//callback(null, cityInfo[location]);
	},
	function(){
		callback("Trouble getting artists for " + location, null);
	});
}

function displayGenres(city, genreData){

	city = city.replace(/["']/g, "");
	city = city.replace(/ /g,"-");

	d3.select('#'+city).style('height',500);

	d3.select('#'+city)
		.selectAll('text')
		.data(d3.entries(genreData))
		.enter()
		.append('svg:text')
		.filter(function(d) { return d.value.length > 2 })
		    .attr("x", 17 )
		    .attr("y", function (d, i){
		    	return (i * 10 +30)
		    })
		    .attr("dy", ".31em")
		    .text(function(d) { return d.key; });

	d3.select('#'+city)
	.selectAll('circle')
	.data(d3.entries(genreData))
	.enter()
		.append('circle')
			.filter(function(d){ return d.value.length > 2 })
			.attr('cx', 10)
			.attr('cy', function(d,i){ return (i * 10 + 30)})
			.attr('r', function(d){ return d.value.length * 1});

	$('.results-wrapper').html("<p>Results for</p><h1>" + city + " </h1>");
	
	$.each(genreData, function(key,value) {
		if(genreData[key].length > 2){
			//$('.results-wrapper').append("<div style='width:" + key.length + "; height:" + key.length + "; border-radius: 50%; background-colour:white;'");
  			$('.results-wrapper').append("<div class='bubble' style='width:" + key.length * 10 + "; height:" + key.length * 10 + "; left:-" + key.length * 5 +"; background: hsl( " + key.length * 10 + ", 100%, 50%);'></div>");
  			$('.results-wrapper').append("<p>" + key + "</br>");
  		}
	});
}

/*------------------------------------------
   BUTTONS
-------------------------------------------*/

// $('.title-wrapper').click(function(){
//   	placeD3Markers("data/stations2.json");
// });

// $('#edit-button').click(function(){
// 	getCityData("data/stations.json");
// });

$('#close-results').click(function(){
	$('#results-wrapper').removeClass('show-results');
});

// $('#add-cities').click(function(){
// 	processCities("data/city-list.json");
// })

$('#search').submit(function(event){
	event.preventDefault();
	var searchCity = $('#search-city').val();
	codeAddress(searchCity);
	//fetchArtists(searchCity);
})




