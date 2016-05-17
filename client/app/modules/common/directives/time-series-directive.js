'use strict';
angular.module('genie.common')
.directive('timeSeries', ['ChartService', 'StylesService',
  'CoreService','ChartDataChangedMsg','ChartDateSelectedMsg',
  function (ChartService, StylesService, CoreService,
    ChartDataChangedMsg, ChartDateSelectedMsg) {

  function link(scope, elem, attrs) {
    var chart;
    var bgColor = StylesService.darkColor;
    var slowSelectionChange = _.debounce(selectionChange, 300);
    var PERIOD = CoreService.env.period; // days
    var DAY = CoreService.env.day; // mins
    var startDay = new Date(scope.getSetting('zoomLevels:startDate'));
    var endDay = new Date(scope.getSetting('zoomLevels:endDate'));
    var chartInterval = "day";

    ChartDataChangedMsg.listen(function(_, data, interval) {
      var startDate,endDate;
      chartInterval = interval;
      data.rows.forEach(function(row){
        if(!startDate && !endDate){
          startDate = endDate = row[0];
          return;
        }
        if(row[0] > endDate){
          endDate = row[0];
        }
        if(row[0] < startDate){
          startDate = row[0];
        }
      });
      refreshChart(data, new Date(startDate), new Date(endDate));
    });

    function getCountsByDay(startDate, endDate, columns) {
      var countsByDay = [];
      var current = new Date(startDate);

      while (current <= endDate) {
        var row = columns.map(function(col){
          return col.type === 'date' ? current : 0;
        });

        countsByDay.push(row);
        var dat = new Date(current.valueOf());
        if (chartInterval === 'day') {
          dat.setDate(dat.getDate() + 1);
        }
        if (chartInterval === 'hour') {
          dat.setHours(dat.getHours() + 1);
        }
        current = dat;
      }

      return countsByDay;
    }

    function getDateId(date){
      var dateVal = typeof date.toLocaleDateString === 'function' ?
        date :
        new Date(date);

      return chartInterval == 'day' ?
        dateVal.toLocaleDateString() :
        dateVal.toLocaleDateString() + ':' + dateVal.getHours();
    }

    function insertRowData(rows, target){
      rows.forEach(function(row) {
        var rowId = getDateId(row[0], chartInterval);
        for(var i=0; i<target.length; i++){
          var targetId = getDateId(target[i][0], chartInterval);
          if (rowId === targetId) {
            row[0] = target[i][0];
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
        if (chartInterval === 'hour') {
          ChartDateSelectedMsg
          .broadcast(selection.row, scope.timeSeries.rows[selection.row][0]);
        }
        scope.$apply(function() {
          if (chartInterval === 'day') {
            var minsAgo = ((scope.timeSeries.rows.length) - (selection.row)) * DAY * PERIOD;
            scope.inputs.minutes_ago = minsAgo;
          }
          scope.timeSeries.selectedDate = scope.timeSeries.rows[selection.row][0];
        });
      }
    }

    function refreshChart(chartData, startDate, endDate) {
      if (chart) {
        chart.clearChart();
      }
      var rows = getCountsByDay(startDate, endDate, chartData.columns);
      rows = insertRowData(chartData.rows, rows);
      scope.timeSeries.selectedDate = rows[0][0];
      // can't access data from graph once its plotted so store for later
      scope.timeSeries.rows = rows;
      var data = new google.visualization.DataTable();
      if (rows.length) {
        chartData.columns.forEach(function(col) {
          data.addColumn(col.type,col.label);
        });
        data.addRows(rows);

        chart = new google.visualization.AnnotationChart(elem[0])
        google.visualization.events.addListener(chart, 'select',
          slowSelectionChange);

        chart.draw(data, options);
        // show the line dot (doesn't show tooltips, wtf?)
        chart.setSelection([{row: 0, column: null}]);
      } else {
        CoreService.alertInfo('Missing Data',
          'No time-series data: check system settings for start, end dates');
      }
    }


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
        refreshChart(chartData, startDay, endDay);
      });
  }

  return {
    restrict: 'AE',
    link: link,
    replace: true,
    template: "<div id='time-series' class='time-series'></div>"
  };
}]);
