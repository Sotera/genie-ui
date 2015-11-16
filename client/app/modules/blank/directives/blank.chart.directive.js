'use strict';

angular.module('com.module.blank')
  .directive('blankChart', function() {
    return {
      template: '<div id="chart_div" style="width: 100%; height: 100%;">',
      restrict: 'E',
      link:function(scope, element, attrs) {
        // Set a callback to run when the Google Visualization API is loaded.
        //google.setOnLoadCallback(function() {

          // Create the data table.
          var data = new google.visualization.DataTable();
          data.addColumn('string', 'Topping');
          data.addColumn('number', 'Slices');
          data.addRows([
            ['Mushrooms', 3],
            ['Onions', 1],
            ['Olives', 1],
            ['Zucchini', 1],
            ['Pepperoni', 2]
          ]);

          // Set chart options
          var options = {
            'width':300,
            'height':100,
            'backgroundColor':'#181818',
            'pieSliceText':'none',
            'is3D': true,
            'legend':'none'
          };

          // Instantiate and draw our chart, passing in some options.
          var chart = new google.visualization.PieChart(document.getElementById('chart_div'));
          chart.draw(data, options);
        //});
      }
    };
  });
