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
      var data = {}, date;
      data.rows = _.map(chart.data.rows, function(row) {
        // moment() handles a date string the way we need it, not Date()
        date = moment(row[0]).toDate();
        return [date, row[1], row[2]];
      });
      data.columns = chart.data.columns;
      return data;
    });

  }

  return {
    getData: getData
  };
}]);
