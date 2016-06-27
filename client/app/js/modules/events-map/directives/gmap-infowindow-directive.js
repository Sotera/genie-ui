'use strict';
angular.module('genie.eventsMap')

// a home for infowindow object creation.
.directive('gmapInfowindow', [function() {

  return {
    controller: ['$scope', controller]
  };

  function controller($scope) {
    this.createImageInfoWindow = function(post) {
      return new google.maps.InfoWindow({
        maxWidth: 220,
        content: `
          <a href='${post.url}' target='_blank'>
          By: @${post.author}
          <div>
            <img width='160px' src='${post.image_url}'>
          </div>
          </a>
          Posted: ${moment(post.post_date).format('MM-DD hh:mm a')}
        `
      });
    };

    this.createTextInfoWindow = function(post) {
      return new google.maps.InfoWindow({
        maxWidth: 240,
        content: `
          <table>
            <tr>
              <td>
                <img width='60px' src='${post.image_url}' />
              </td>
              <td>
                <a style='color:black' href='${post.url}' target='_blank'>
                  ${post.text}
                </a>
              </td>
            </tr>
            <tr>
              <td style='color:black' colspan='2'>
                <a href='${post.url}' target='_blank'>
                  By: @${post.author}
                </a>
              </td>
            </tr>
            <tr>
              <td style='color:black' colspan='2'>
                Posted: ${moment(post.post_date).format('MM-DD hh:mm a')}
              </td>
            </tr>
          </table>
          `
      });
    };
  }

}]);
