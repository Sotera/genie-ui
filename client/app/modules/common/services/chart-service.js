'use strict';
angular.module('genie.common')
.factory('ChartService', ['Chart', function(Chart) {

  function getData(chartName) {

    return Chart.findOne({
      filter: {
        where: {
          name: chartName
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
