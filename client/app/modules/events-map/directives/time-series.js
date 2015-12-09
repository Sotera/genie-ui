'use strict';
angular.module('genie.eventsMap')
.directive('timeSeries', ['$window', 'mapService', function ($window, mapService) {

  function link(scope, elem, attrs) {
    drawChart();

    function drawChart() {
      var data = new google.visualization.DataTable();
      data.addColumn('date', 'Date');
      data.addColumn('number', 'Events');
      data.addColumn('number', 'Tags');
      data.addRows([
        [new Date(2314, 2, 15), 12400, 10645],
        [new Date(2314, 2, 16), 24045, 12374],
        [new Date(2314, 2, 17), 35022, 15766],
        [new Date(2314, 2, 18), 12284, 34334],
        [new Date(2314, 2, 19), 8476, 66467],
        [new Date(2314, 2, 20), 0, 79463]
      ]);

      var chart = new google.visualization.AnnotationChart(elem[0]);
      google.visualization.events.addListener(chart, 'rangechange', rangechange_handler);

      function rangechange_handler(e) {
        console.log('You changed the range to ', e['start'], e['end']);
      }

      var options = {
        displayAnnotations: false,
        displayZoomButtons: false,
        fill: 10,
        chart: {
          backgroundColor: '#181818',
          chartArea: {
            backgroundColor: '#181818'
          },
          vAxis: {
            gridlines: {
              color: '#181818'
            }
          },
          hAxis: {
            gridlines: {
              color: '#181818'
            }
          }
        }
      };
      chart.draw(data, options);
    }
  }

  return {
    restrict: 'AE',
    link: link,
    replace: true,
    template: "<div id='time-series' class='time-series'></div>"
  };
}]);
