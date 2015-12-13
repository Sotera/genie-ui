'use strict';
angular.module('genie.eventsMap')
.factory('timeSeriesService', ['Chart', function(Chart) {

  function getData() {

    return Chart.findOne({
      filter: {
        where: {
          name: 'time-series'
        }
      }
    })
    .$promise
    .then(function(chart) {
      var data = {};
      data.rows = _.map(chart.data.rows, function(row) {
        return [new Date(row[0]), row[1]];
      });
      data.columns = chart.data.columns;
      return data;
    });

  }

  return {
    getData: getData
  };
}]);
