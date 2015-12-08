'use strict';
angular.module('genie.eventsMap')
.factory('mapControlService', [function() {

  function createButton(container, options) {
    // Set CSS for the control border.
    var controlUI = document.createElement('div');
    controlUI.style.backgroundColor = '#fff';
    controlUI.style.border = '2px solid #fff';
    controlUI.style.borderRadius = '3px';
    controlUI.style.cursor = 'pointer';
    controlUI.style.marginBottom = '22px';
    controlUI.style.marginRight = '8px';
    controlUI.style.textAlign = 'center';
    controlUI.title = options.title;
    container.appendChild(controlUI);

    // Set CSS for the control interior.
    var controlText = document.createElement('div');
    controlText.style.color = 'rgb(25,25,25)';
    controlText.style.fontSize = '16px';
    controlText.style.lineHeight = '38px';
    controlText.style.paddingLeft = '5px';
    controlText.style.paddingRight = '5px';
    controlText.innerHTML = options.label;
    controlUI.appendChild(controlText);
  }

  function createSlider(options) {
    var slider = document.createElement('input');
    slider.style.paddingBottom = '20px';
    slider.setAttribute('type', 'range');
    slider.setAttribute('min', options.min);
    slider.setAttribute('max', options.max);
    slider.setAttribute('step', options.step);
    slider.value = options.value;
    return slider;
  }

  return {
    createButton: createButton,
    createSlider: createSlider
  };
}]);
