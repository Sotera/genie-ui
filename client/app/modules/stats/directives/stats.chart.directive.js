'use strict';

angular.module('com.module.stats')
  .directive('statsChart', ['StatsChip',function(StatsChip) {
    return {
      template: '<div id="stats_chart_div" style="width: 100%; height: 100%;">',
      restrict: 'E',
      link:function(scope, element, attrs) {

          StatsChip.findOne().$promise
            .then(function(instance){

              var data = new google.visualization.DataTable();
              _.map(instance.columns,
                function(column) {
                  data.addColumn(column.type, column.name);
                });

              _.map(instance.rows,
                function(row) {
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
                    0: {side: 'top'}
                  }
                }
              };

              var chart = new google.charts.Line(document.getElementById('stats_chart_div'));

              chart.draw(data, google.charts.Line.convertOptions(options));

            }
          ).catch(function(err) {
              console.log(err);
            })

      }
    };
  }]);
