
var places = ko.observableArray();
var placeName = ko.observable();


function loadModel() {
  $.getJSON("/some/url", function(data) {
    var placesJSON = data.places;
    for (var i = 0; i < placesJSON.length; i++) {
      places.push(data.i);
    };
  });
}

// defines the interaction of the business logic between the view and the model
function viewModel() {

  // The leading $ denotes that the variable is a pointer to a JQuery object
  var $body = $('body');
  var $wikiElem = $('#wikipedia-links');
  var $nytHeaderElem = $('#nytimes-header');
  var $nytElem = $('#nytimes-articles');

  // clear out old data before new request
  $wikiElem.text("");
  $nytElem.text("");

  // GOOGLE STREET VIEW REQUEST
  var streetStr = $('#street').val();
  var cityStr = $('#city').val();
  var address = streetStr + ', ' + cityStr;
  $greeting.text('So you want to live at '+ address + '?');
  var streetViewUrl = 'http://maps.googleapis.com/maps/api/streetview?' +
                      'size=600x400&location=' + address + '';
  $body.append('<img class="bgimg" src="' + streetViewUrl + '">');

  // NEW YORK TIMES AJAX REQUEST
  var nytArticleApiKey = '73ab354a5a8949f68092bd129e01edbe';
  var nyTimesUrl = 'https://api.nytimes.com/svc/search/v2/articlesearch.json?' +
                   'q=' + placeName + '&sort=newest&api-key=' + nytArticleApiKey + '';
  $.getJSON(nyTimesUrl, function(data) {
    // set header for New York Times articles
    $nytHeaderElem.text('New York Times articles about ' + cityStr +'.');
    // get the articles from the NYT JSON response
    articles = data.response.docs;
    // iterate through all of the articles about the city and append them as list items
    for (var i = 0; i < articles.length; i++) {
      var article = articles[i];
      $nytElem.append(
        '<li class="article">' +
          '<a href="' + article.web_url + '">' + article.headline.main + '</a>' +
          '<p>' + article.snippet + '</p>' +
        '</li>'
      );
    };
    // Eror handler chained to handle errors in getting NYT articles
  }).fail(function(e) {
        $nytHeaderElem.text(
          'New York Times articles could not be loaded.'
        );
      }
    );

  // WIKIPEDIA AJAX REQUEST

  // Set wiki request timeout for error handling
  var wikiRequestTimeout = setTimeout(function() {
    $wikiElem.text('Wikipedia articles could not be loaded.')
  }, 8000);

  // main Wikipedia request handler
  var wikiUrl = 'https://en.wikipedia.org/w/api.php?' +
                'action=opensearch&search='+ cityStr +
                '&format=json&callback=wikiCallback';
  $.ajax({
    url: wikiUrl,
    dataType: "jsonp"
    // success handler must be chained due to use of jsonp
  }).done(function(response) {
        var articleList = response[1];
        // loop through the articles added them to a list
        for (var i = 0; i < articleList.length; i++) {
          // defines an individual article in the list.
          var articleStr = articleList[i];
          // URL for the individual article
          var url = 'http://en.wikipedia.org/wiki/' + articleStr;
          $wikiElem.append(
            '<li class="article">' +
              '<a href="' + url + '">' + articleStr + '</a>' +
            '</li>'
          );
        };
        // Since the request was successful clear the timeout
        clearTimeout(wikiRequestTimeout)
      }
    );
  // calls funciton that displays the google map
  displayMap();
  return false;
};

// google map
var googleMap = '<div id="map"></div>';




/*
The next few lines about clicks are for the Collecting Click Locations quiz in Lesson 2.
*/
clickLocations = [];

function logClicks(x, y) {
  clickLocations.push({
    x: x,
    y: y
  });
  console.log('x location: ' + x + '; y location: ' + y);
}

$(document).click(function(loc) {
  var x = loc.pageX;
  var y = loc.pageY;
  logClicks(x, y);
});

/*
This is the fun part. Here's where we generate the custom Google Map for the website.
See the documentation below for more details.
https://developers.google.com/maps/documentation/javascript/reference
*/
var map; // declares a global map variable


/*
Start here! initializeMap() is called when page is loaded.
*/
function initializeMap() {

  var locations;

  var mapOptions = {
    disableDefaultUI: true
  };

  /*
  For the map to be displayed, the googleMap var must be
  appended to #mapDiv in resumeBuilder.js.
  */
  map = new google.maps.Map(document.querySelector('#map'), mapOptions);

  /*
  locationFinder() returns an array of every location string from the JSONs
  written for bio, education, and work.
  */
  function locationFinder() {

    // ASYNCHRONIOUS REQUESTS DUE TO MAP NOT RENDERING CORRECTLY

    // initializes an empty array
    var locations = [];
    $.ajax({
      url: 'js/data/bio.json',
      dataType: "json",
      async: false
      // success handler must be chained due to use of jsonp
    }).done(function(data) {
        var bio = data;
        // adds the single location property from bio to the locations array
        locations.push(bio.contacts.location);
    });

    // iterates through school locations and appends each location to
    // the locations array
    $.ajax({
      url: 'js/data/education.json',
      dataType: "json",
      async: false
      // success handler must be chained due to use of jsonp
    }).done(function(data) {
      var education = data;
      for (var school = 0; school < education.schools.length; school++) {
        locations.push(education.schools[school].location);
      }
  });

    // iterates through work locations and appends each location to
    // the locations array
    $.ajax({
      url: 'js/data/work.json',
      dataType: "json",
      async: false
      // success handler must be chained due to use of jsonp
    }).done(function(data) {
        var work = data;
      for (var job = 0; job < work.jobs.length; job++) {
        locations.push(work.jobs[job].location);
      }
  });
    return locations;
  } // end funciton locationFinder

  /*
  createMapMarker(placeData) reads Google Places search results to create map pins.
  placeData is the object returned from search results containing information
  about a single location.
  */
  function createMapMarker(placeData) {

    // The next lines save location data from the search result object to local variables
    var lat = placeData.geometry.location.lat(); // latitude from the place service
    var lon = placeData.geometry.location.lng(); // longitude from the place service
    var name = placeData.formatted_address; // name of the place from the place service
    var bounds = window.mapBounds; // current boundaries of the map window

    // marker is an object with additional data about the pin for a single location
    var marker = new google.maps.Marker({
      map: map,
      position: placeData.geometry.location,
      title: name
    });

    // infoWindows are the little helper windows that open when you click
    // or hover over a pin on a map. They usually contain more information
    // about a location.
    var infoWindow = new google.maps.InfoWindow({
      content: name
    });

    // event listener for the click on the location marker
    google.maps.event.addListener(marker, 'click', function() {
      infoWindow.open(map, marker);
    });

    // this is where the pin actually gets added to the map.
    // bounds.extend() takes in a map location object
    bounds.extend(new google.maps.LatLng(lat, lon));
    // fit the map to the new marker
    map.fitBounds(bounds);
    // center the map
    map.setCenter(bounds.getCenter());
  } // end function createMapMarker

  /*
  callback(results, status) makes sure the search returned results for a location.
  If so, it creates a new map marker for that location.
  */
  function callback(results, status) {
    if (status == google.maps.places.PlacesServiceStatus.OK) {
      createMapMarker(results[0]);
    }
  } // end function callback

  /*
  pinPoster(locations) takes in the array of locations created by locationFinder()
  and fires off Google place searches for each location
  */
  function pinPoster(locations) {

    // creates a Google place search service object. PlacesService does the work of
    // actually searching for location data.
    var service = new google.maps.places.PlacesService(map);

    // Iterates through the array of locations, creates a search object for each location
    for (var place in locations) {

      // the search request object
      var request = {
        query: locations[place]
      };

      // Actually searches the Google Maps API for location data and runs the callback
      // function with the search results after each search.
      service.textSearch(request, callback);
    }
  } // end function pinPoster

  // Sets the boundaries of the map based on pin locations
  window.mapBounds = new google.maps.LatLngBounds();

  // locations is an array of location strings returned from locationFinder()
  locations = locationFinder();

  // pinPoster(locations) creates pins on the map for each location in
  // the locations array
  pinPoster(locations);
} // end function initializeMap

// Calls the initializeMap() function when the page loads
window.addEventListener('load', initializeMap);

// Vanilla JS way to listen for resizing of the window
// and adjust map bounds
window.addEventListener('resize', function(e) {
  //Make sure the map bounds get updated on page resize
  map.fitBounds(mapBounds);
});


// this function calls the googleMaps API based upon the data contained in the location attributes in all JSONS
function displayMap() {
    $('#mapDiv').append(googleMap);
} // end funciton displayMap


$('#form-container').submit(loadData);
