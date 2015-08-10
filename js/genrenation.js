var apiKey = "DQGPYAC0Q7TGSDPYU";

var map;
var geocoder;
var overlay;
var root;
var cityInfo = {};
var citiesOnMap = {};
var locationData = {};
var track;
var styles;

/*------------------------------------------
   GOOGLE MAPS STUFF
-------------------------------------------*/

overlay = new google.maps.OverlayView();

$(document).ready(function(){

	//LOAD JSON INTO STYLES
	$.getJSON("js/mapstyles.json", function(data){
    	styles = data;
	});

	console.log(styles);

	styles = [{"featureType":"all","elementType":"labels.text.fill","stylers":[{"saturation":36},{"color":"#000000"},{"lightness":40}]},{"featureType":"all","elementType":"labels.text.stroke","stylers":[{"visibility":"on"},{"color":"#000000"},{"lightness":16}]},{"featureType":"all","elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"administrative","elementType":"geometry.fill","stylers":[{"color":"#000000"},{"lightness":20}]},{"featureType":"administrative","elementType":"geometry.stroke","stylers":[{"color":"#000000"},{"lightness":17},{"weight":1.2}]},{"featureType":"administrative.country","elementType":"geometry.stroke","stylers":[{"visibility":"on"},{"color":"#ffffff"}]},{"featureType":"administrative.country","elementType":"labels","stylers":[{"visibility":"off"}]},{"featureType":"administrative.country","elementType":"labels.text","stylers":[{"color":"#ffffff"}]},{"featureType":"administrative.country","elementType":"labels.text.stroke","stylers":[{"color":"#454545"}]},{"featureType":"administrative.province","elementType":"all","stylers":[{"visibility":"on"}]},{"featureType":"administrative.province","elementType":"geometry.stroke","stylers":[{"color":"#8b8b8b"}]},{"featureType":"administrative.province","elementType":"labels","stylers":[{"visibility":"off"}]},{"featureType":"administrative.locality","elementType":"all","stylers":[{"visibility":"on"},{"color":"#ffffff"}]},{"featureType":"administrative.locality","elementType":"labels.text.stroke","stylers":[{"color":"#000000"}]},{"featureType":"administrative.locality","elementType":"labels.icon","stylers":[{"color":"#7c7c7c"}]},{"featureType":"administrative.neighborhood","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"administrative.land_parcel","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"landscape","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":20}]},{"featureType":"landscape","elementType":"geometry.fill","stylers":[{"color":"#979797"}]},{"featureType":"landscape.man_made","elementType":"all","stylers":[{"visibility":"on"},{"color":"#474747"}]},{"featureType":"landscape.natural","elementType":"all","stylers":[{"visibility":"on"}]},{"featureType":"landscape.natural.landcover","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"landscape.natural.terrain","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"poi","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"poi","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":21}]},{"featureType":"road.highway","elementType":"geometry.fill","stylers":[{"color":"#000000"},{"lightness":17}]},{"featureType":"road.highway","elementType":"geometry.stroke","stylers":[{"color":"#919191"},{"lightness":29},{"weight":0.2}]},{"featureType":"road.highway","elementType":"labels","stylers":[{"visibility":"off"}]},{"featureType":"road.highway","elementType":"labels.text.fill","stylers":[{"visibility":"off"}]},{"featureType":"road.arterial","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"road.arterial","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":18}]},{"featureType":"road.local","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"road.local","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":16}]},{"featureType":"transit","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"transit","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":19}]},{"featureType":"water","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":17}]},{"featureType":"water","elementType":"labels","stylers":[{"visibility":"off"}]}];

	//GOOGLE MAPS INITIALIZATION
	geocoder = new google.maps.Geocoder();

  	map = new google.maps.Map(d3.select('#map-canvas').node(), {
    	zoom: 3,
    	center: {lat: 45, lng: -45},
    	styles: styles,
    	panControl: false,
  		mapTypeControl: false,
  		scaleControl: false,
  		streetViewControl: false,
  		overviewMapControl: false,
    	zoomControl: true,
  		zoomControlOptions: {
        	style: google.maps.ZoomControlStyle.LARGE,
        	position: google.maps.ControlPosition.LEFT_BOTTOM
    	}
    });

	// map.mapTypes.set('map_style', styledMap);
 	// map.setMapTypeId('map_style');

  	//REPOSITION POINTS WHEN MAP ZOOMS
	google.maps.event.addListener(map, 'zoom_changed', function() {
		repositionMarkers();
	});

	//INITIAL MAP POPULATION (this needs to be included to create the layer that the markers are placed on)
	placeD3Markers("data/stations2.json");

});

//INITIATE OVERLAY AND ADD INITAL MARKERS
function placeD3Markers (dataSource){

	console.log('placeing d3 markers');

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
		          	.attr("id", function(d) { return d.key; });

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
		
		console.log(d);
		console.log(this);

		var projection = overlay.getProjection();
	    d = new google.maps.LatLng(d.value[1], d.value[0]);
    	d = projection.fromLatLngToDivPixel(d);
    	return d3.select(this)
        	.style("left", (d.x - 10) + "px")
        	.style("top", (d.y - 10) + "px");
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

	geocoder.geocode( {'address':address}, function (results, status){
		
		if(status == google.maps.GeocoderStatus.OK){
			if(results[0].address_components[0].types[0] == 'locality'){
				console.log(results);
				locationData[results[0].address_components[0].long_name] = [
					results[0].geometry.location.A,
					results[0].geometry.location.F
				]
				
				var unsortedGenres = cityInfo[addressInput];

				var sortedGenres = Object.keys(cityInfo[addressInput]).sort(function(a, b) {
  					return cityInfo[addressInput][a].length - cityInfo[addressInput][b].length
				});

				console.log(locationData);
				// console.log(sortedGenres);
				
				displayGenres(addressInput, cityInfo[addressInput], sortedGenres);
				//fetchArtists(JSON.stringify(results[0].address_components[0].long_name));
			}else{
				$('#search-error').html('Sorry, ' + address + ' is not a city.');
			}
		}else{
			$('#search-error').html('Error, service not available');
		}
	})
}

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
	
	$.getJSON(url, args, function(data){

		if(data.response.artists.length == 0){
			$('#search-error').html('<p>Sorry, no artists in our database for ' + location + '</p>');
		}else{
			$.each(data.response.artists, function(index, artist){		
				var artistName = JSON.stringify(artist.name).replace(/\"/g,'');
				$.each(artist.genres, function(index, genre){
					var genreName = JSON.stringify(genre.name).replace(/\"/g,'');
					cityInfo[location][genreName] = cityInfo[location][genreName] || []
					cityInfo[location][genreName].push(artistName)
				});
			});

			// console.log(cityInfo[location]);
			codeAddress(location);
			showResults();
		}
	},
	function(){
		callback("Trouble getting artists for " + location, null);
	});
}

function displayGenres(city, genreData, genreIndex){

	var capitalizedCity = city.toLowerCase().replace(/\b[a-z]/g, function(letter){
		return letter.toUpperCase();
	})

	console.log(capitalizedCity);
	console.log(genreData);
	console.log(genreIndex);

	city = city.replace(/["']/g, "");
	city = city.replace(/ /g,"-");

	console.log(city);
	console.log(locationData[capitalizedCity]);


	d3.select('.stations')
		// .selectAll('svg')
		.append('svg')
		.attr('id',city)
		.attr('class','marker')
		.each(repositionMarkers());
		// .attr('x',locationData[capitalizedCity][0])
		// .attr('y',locationData[capitalizedCity][1]);

	// d3.select('.stations')
	// 	.selectAll('svg')
	// 	.data(d3.entries(genreData))
	// 	.enter()
	// 	.append('svg')
		// .filter(function(d){ return d.value.length > 2 })
		// .attr('id',city);
		// .filter(function(d){ return d.value.length > 2 })
		// 	.attr("id",city)
		// 	.attr("class",'marker')
		// 	.attr("x", 17)
		// 	.attr("y", function (d, i){
		// 		return(i * 10 + 30)
		// 	})
		// 	.attr("dy", ".31em")
		// 	.text(function(d){ return d.key; });

	// d3.select('#'+city).style('height',500);

	// d3.select('#'+city)
	// 	.selectAll('text')
	// 	.data(d3.entries(genreData))
	// 	.enter()
	// 	.append('svg:text')
	// 	.filter(function(d) { return d.value.length > 2 })
	// 	    .attr("x", 17 )
	// 	    .attr("y", function (d, i){
	// 	    	return (i * 10 +30)
	// 	    })
	// 	    .attr("dy", ".31em")
	// 	    .text(function(d) { return d.key; });

	d3.select('#'+city)
	.selectAll('circle')
	.data(d3.entries(genreData))
	.enter()
		.append('circle')
			.filter(function(d){ return d.value.length > 2 })
			.attr('cx', 10)
			.attr('cy', function(d,i){ return (i * 10 + 30)})
			.attr('r', function(d){ return d.value.length * 1});
	
	$('#results-wrapper-title').html("<p>Results for</p><h1>" + city + " </h1>");
	$('#results-wrapper-genres').html('');
	$('#results-wrapper-songs').html('');

	for(var i = genreIndex.length - 1; i > 0; i--){
		if( genreData[genreIndex[i]].length > 2){
			$('#results-wrapper-genres').append("<div class='bubble'; id='" + genreIndex[i] + "'; style ='width:" + genreData[genreIndex[i]].length * 10 + "; height:" + genreData[genreIndex[i]].length * 10 + "; left:-" + genreData[genreIndex[i]].length * 5 + "; backgound: hsl(" + genreData[genreIndex[i]].length * 10 + ", 100%, 50%);' ></div>");
  			$('#results-wrapper-genres').append("<p onclick=\"fetchTrack('" + genreData[genreIndex[i]][0] + "')\">" + genreData[genreIndex[i]].length + " " + genreIndex[i] + "</p>");
		}
	}

	// $.each(genreData, function(key,value) {
	// 	if(genreData[key].length > 2){
 //  			$('.results-wrapper').append("<div class='bubble'; id= '" + key + "'; style='width:" + genreData[key].length * 10 + "; height:" + genreData[key].length * 10 + "; left:-" + genreData[key].length * 5 +"; background: hsl( " + genreData[key].length * 10 + ", 100%, 50%);'></div>");
 //  			console.log(genreData[key][0]);
 //  			$('.results-wrapper').append("<p onclick=\"fetchTrack('" + genreData[key][0] + "')\">" + genreData[key].length + " " + key + "</p>");
 //  		}
	// });
}

/*------------------------------------------
   BUTTONS
-------------------------------------------*/

$('#close-results').click(function(){
	$('#results-wrapper-inner').removeClass('show-results');
});

$('#search').submit(function(event){
	event.preventDefault();
	var searchCity = $('#search-city').val();
	//codeAddress(searchCity);
	fetchArtists(searchCity);
})

function showResults(){
	$('#results-wrapper').css('width', 150);
	$('#results-wrapper').css('padding', 20);
}

function hideReults(){
	$('#results-wrapper').css('width', 0);
	$('#results-wrapper').css('padding', 0);
}

/*------------------------------------------
   TOMAHAWK
-------------------------------------------*/

function fetchTrack(artist){

	$('#results-wrapper-genres').css('left', -190);
	

	console.log(artist);

    track = window.tomahkAPI.Track( "", artist, {
        width:150,
        height:150,
        disabledResolvers: [
            // options: "SoundCloud", "Officialfm", "Lastfm", "Jamendo", "Youtube", "Rdio", "SpotifyMetadata", "Deezer", "Exfm"
        ],
        handlers: {
            onloaded: function() {
                log(track.connection+":\n  api loaded");
            },
            onended: function() {
                log(track.connection+":\n  Song ended: "+track.artist+" - "+track.title);
            },
            onplayable: function() {
                log(track.connection+":\n  playable");
            },
            onresolved: function(resolver, result) {
                log(track.connection+":\n  Track found: "+resolver+" - "+ result.track + " by "+result.artist);
            },
            ontimeupdate: function(timeupdate) {
                var currentTime = timeupdate.currentTime;
                var duration = timeupdate.duration;
                currentTime = parseInt(currentTime);
                duration = parseInt(duration);

                log(track.connection+":\n  Time update: " + currentTime + " " + duration);
            }
        }
    });

//$('#results-wrapper-inner').css('left', -190);

document.getElementById("results-wrapper-songs").appendChild(track.render());

track.render();
track.play();
}






