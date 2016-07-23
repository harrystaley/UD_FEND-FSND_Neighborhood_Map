
function loadData() {

  // The leading $ denotes that the variable is a pointer to a JQuery object
  var $body = $('body');
  var $wikiElem = $('#wikipedia-links');
  var $nytHeaderElem = $('#nytimes-header');
  var $nytElem = $('#nytimes-articles');
  var $greeting = $('#greeting');

  // clear out old data before new request
  $wikiElem.text("");
  $nytElem.text("");

  // GOOGLE STREET VIEW BACKGROUND
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
                   'q=' + cityStr + '&sort=newest&api-key=' + nytArticleApiKey + '';
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

  return false;
};

$('#form-container').submit(loadData);
