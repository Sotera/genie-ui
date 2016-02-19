'use strict';
angular.module('genie.common')

.factory('GeocoderService', ['CoreService', '$http',
  function(CoreService, $http) {

  return {
    forwardGeocode: forwardGeocode
  };

  function getUrl(place) {
    var apiKey = CoreService.env.geocoderApiKey;
    var url = [CoreService.env.geocoderEndpoint, '?q=', place,
      '&pretty=1&key=', apiKey]
      .join('');
    return url;
  }

  function forwardGeocode(place) {
    return $http.get(getUrl(place))
    .then(function(res) { // touch up results. return only data property.
      console.log(res);
      var data = res.data;
      if (data.total_results > 0) {
        data.results.forEach(function(r) {
          r.formatted = r.formatted.replace(', United States of America', '');
        });
      }
      return data;
    })
    ;
  }

}])
