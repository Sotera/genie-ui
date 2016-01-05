'use strict';
angular.module('genie.common')
.directive('timeSeries', ['$window', 'ChartService', 'StylesService',
  function ($window, ChartService, StylesService) {

  function link(scope, elem, attrs) {
    var chart = new google.visualization.AnnotationChart(elem[0]);
    var bgColor = StylesService.darkColor;
    var slowSelectionChange = _.debounce(selectionChange, 300);

    google.visualization.events.addListener(chart, 'select',
      slowSelectionChange);

    function selectionChange() {
      var selection = chart.getSelection()[0];
      if (selection) {
        var selectedVal = data.getValue(selection.row, 0);
        // check for external handler and invoke it
        scope.timeChanged && scope.timeChanged(selectedVal);
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
      min: 0,
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

    ChartService.getData(attrs.chartName)
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
