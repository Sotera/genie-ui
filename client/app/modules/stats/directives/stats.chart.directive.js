'use strict';

angular.module('com.module.stats')
  .directive('statsChart', ['StatsChip', '$window',
    function (StatsChip, $window) {

      function main(scope, element, attrs) {
        StatsChip.findOne().$promise
          .then(function (instance) {

            var data = new google.visualization.DataTable();
            _.map(instance.columns,
              function (column) {
                data.addColumn(column.type, column.name);
              });

            _.map(instance.rows,
              function (row) {
                data.addRow(row.row);
              });

            var options = {
              chart: {
                'backgroundColor': {
                  'fill': '#181818'
                }
              },
              'chartArea': {
                'backgroundColor': '#181818'
              },
              axes: {
                x: {
                  0: {side: 'bottom'}
                }
              }
            };

            var chart = new google.charts.Line(document.getElementById('stats_chart_div'));
            angular.element($window).bind('resize', _.throttle(doResize(chart, element,data,options), 33.33));
            $(document).ready(doResize(chart, element, data, options));

          }
        ).catch(function (err) {
          console.log(err);
        })

      }

      function doResize (chart, element, data, options) {
        return function() {
          var parent = $("#" + element.parent()[0].id);
          var height = parent.height();
          var width = parent.width();
          element.css('height', height + 'px');
          element.css('width', width + 'px');
          chart.draw(data, google.charts.Line.convertOptions(options));
        }
      }

      return {
        template: '<div id="stats_chart_div" style="width: 100%; height: 100%;">',
        restrict: 'E',
        link: main
      };

    }]);
