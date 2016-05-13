'use strict';
angular.module('genie.common')
.directive('timeSeries', ['$rootScope','ChartService', 'StylesService', 'CoreService','ChartDataChangedMsg',
  function ($rootScope,ChartService, StylesService, CoreService,ChartDataChangedMsg) {

  function link(scope, elem, attrs) {
    var chart = new google.visualization.AnnotationChart(elem[0]);
    var bgColor = StylesService.darkColor;
    var slowSelectionChange = _.debounce(selectionChange, 300);
    var PERIOD = CoreService.env.period; // days
    var DAY = CoreService.env.day; // mins
    var startDay = new Date($rootScope.settings.data[15].value);
    var endDay = new Date($rootScope.settings.data[17].value);
    google.visualization.events.addListener(chart, 'select',
      slowSelectionChange);

    ChartDataChangedMsg.listen(function (_event,data) {
      console.log(data);
    });

    function tween(startDate, endDate, columns, interval) {
      var retVal = [];
      var current = new Date(startDate);

      while (current <= endDate) {
        var row = [];
        columns.forEach(function(col){
          if(col.type == 'date'){
            row.push(current);
          }
          else{
            row.push(0);
          }
        });

        retVal.push(row);
        var dat = new Date(current.valueOf());
        if(interval == "day"){
          dat.setDate(dat.getDate() + 1);
        }
        if(interval == "hour"){
          dat.setHours(dat.getHours()+1);
        }
        current = dat;
      }

      return retVal;

    }

    function getDateId(date,interval){
      return interval == "day" ? date.toLocaleDateString():date.toLocaleDateString()+ ":" + date.getHours();
    }

    function insertRowData(rows, target, interval){
      rows.forEach(function(row,idx){
        var rowId = getDateId(row[0],interval);
        for(var i = 0; i<target.length; i++){
          var targetId = getDateId(target[i][0],interval);
          if(rowId == targetId)
          {
            target[i] = row;
            break;
          }
        }
      });

      return target;
    }

    function selectionChange() {
      var selection = chart.getSelection()[0];
      if (selection) {
        //var selectedVal = data.getValue(selection.row, 0);
        // check for external handler and invoke it
        //scope.timeChanged && scope.timeChanged(selectedVal);
        scope.$apply(function() {
          scope.inputs.minutes_ago = (selection.row+1) * DAY * PERIOD;
          scope.timeSeries.selectedDate = scope.timeSeries.rows[selection.row][0];
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
        var rows = tween(startDay, endDay,chartData.columns,"day");
        rows = insertRowData(chartData.rows,rows,"day");
        scope.timeSeries.selectedDate = rows[0][0];
        // can access data from graph once its in so store for later
        scope.timeSeries.rows = rows;
        if (rows.length) {
          chartData.columns.forEach(function(col) {
            data.addColumn(col);
          });
          data.addRows(rows);
          chart.draw(data, options);
          // show the line dot (doesn't show tooltips, wtf?)
          chart.setSelection([{row: 0, column: null}]);
        } else {
          CoreService.alertInfo('Missing Data',
            'No time-series data: check system settings for start, end dates');
        }
      });
  }

  return {
    restrict: 'AE',
    link: link,
    replace: true,
    template: "<div id='time-series' class='time-series'></div>"
  };
}]);
