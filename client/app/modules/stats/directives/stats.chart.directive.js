'use strict';

angular.module('com.module.stats')

.directive('statsChart', ['StatsChip', '$window',
  function (StatsChip, $window) {

    function main(scope, element, attrs) {
      StatsChip.find({filter: {limit: 1}}).$promise
        .then(function (statChips) {
          var statChip = statChips[0];
          if (!statChip) return;

          var baseColor = '#181818';

          var data = new google.visualization.DataTable();
          _.map(statChip.columns,
            function (column) {
              data.addColumn(column.type, column.name);
            });

          _.map(statChip.rows,
            function (row) {
              var dateRow = [new Date(row[0]),row[1]];
              data.addRow(dateRow);
            });

          var options = {
            legend: {
              position: 'none'
            },
            chart: {
              backgroundColor: {
                fill: baseColor
              }
            },
            chartArea: {
              backgroundColor: baseColor
            },
            hAxis: {
              gridlines: {
                color: baseColor,
                count: 25,
                units: {
                  days: {format: ['MMM dd']},
                  hours: {format: ['HH:mm', 'ha']}
                }
              }
            },
            vAxis: {
              gridlines: {
                color: baseColor
              }
            },
            axes: {
              x: {
                0: {side: 'bottom'}
              }
            }
          };

          var chart = new google.charts.Line(document.getElementById('stats_chart_div'));

          function drawChart() {
            chart.draw(data, google.charts.Line.convertOptions(options));
          }

          angular.element($window)
            .bind('resize', _.throttle(doResize(element, drawChart), 33.33));

          $(document).ready(doResize(element, drawChart));
        }
      ).catch(function (err) {
        console.log(err);
      })

    }

    function doResize (element, cb) {
      var parent = $("#" + element.parent()[0].id);
      return function() {
        var height = parent.height();
        var width = parent.width();
        element.css('height', height + 'px');
        element.css('width', width + 'px');
        cb();
      };
    }

    return {
      template: '<div id="stats_chart_div" style="width: 100%; height: 100%;">',
      restrict: 'E',
      link: main
    };

  }]);
