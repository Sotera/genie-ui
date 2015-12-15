'use strict';
angular.module('genie.eventsMap')
.directive('timeSeries', ['$window', 'timeSeriesService',
  function ($window, timeSeriesService) {

  function link(scope, elem, attrs) {
    var chart = new google.visualization.AnnotationChart(elem[0]);
    var bgColor = '#181818';
    var slowSelectionChange = _.debounce(selectionChange, 500);

    google.visualization.events.addListener(chart, 'select', slowSelectionChange);

    function selectionChange() {
      var selection = chart.getSelection()[0];
      if (selection) {
        scope.$apply(function() {
          scope.inputs.minutesAgo = (selection.row+1) * 1440;
        });
      }
    }

    var data = new google.visualization.DataTable();

    var options = {
      displayAnnotations: false,
      displayZoomButtons: false,
      displayRangeSelector: false,
      displayLegendDots: false,
      fill: 10,
      chart: {
        backgroundColor: bgColor,
        chartArea: {
          backgroundColor: bgColor
        },
        vAxis: {
          gridlines: {
            color: bgColor
          }
        },
        hAxis: {
          gridlines: {
            color: bgColor
          }
        }
      }
    };

    timeSeriesService.getData()
      .then(function(chartData) {
        chartData.columns.forEach(function(col) {
          data.addColumn(col);
        });
        data.addRows(chartData.rows);
        chart.draw(data, options);
      });
  }

  return {
    restrict: 'AE',
    link: link,
    replace: true,
    template: "<div id='time-series' class='time-series'></div>"
  };
}]);
