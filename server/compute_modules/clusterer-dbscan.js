'use strict';
//var log = require('debug')('compute_modules:clusterer-dbscan');
const clustering = require('density-clustering');
const loopback = require('loopback');
const dbscan = new clustering.DBSCAN();
const dbscanGeoEpsilonMeters = 1000;
const dbscanGeoMinMembersInCluster = 2;
const sqrtQuickDistanceExclude = (dbscanGeoEpsilonMeters) * 1.1e-5;
const quickDistanceExclude = 1.1 * (sqrtQuickDistanceExclude * sqrtQuickDistanceExclude);
const loc0 = new loopback.GeoPoint({lat: 0, lng: 0});
const loc1 = new loopback.GeoPoint({lat: 0, lng: 0});
module.exports = class {
  constructor() {
  }

  area(pts) {
    var area = 0;
    var nPts = pts.length;
    var j = nPts - 1;
    var p1;
    var p2;

    for (var i = 0; i < nPts; j = i++) {
      p1 = pts[i];
      p2 = pts[j];
      area += p1.x * p2.y;
      area -= p1.y * p2.x;
    }
    area /= 2;

    return area;
  };

  centroid(pts) {
    var nPts = pts.length;
    if (nPts === 0) {
      return [0, 0];
    }
    else if (nPts === 1) {
      return [pts[0].x, pts[0].y];
    }
    else if (nPts === 2) {
      return [(pts[0].x + pts[1].x) / 2, (pts[0].y + pts[1].y) / 2];
    }
    var x = 0;
    var y = 0;
    var f;
    var j = nPts - 1;
    var p1;
    var p2;

    for (var i = 0; i < nPts; j = i++) {
      p1 = pts[i];
      p2 = pts[j];
      f = p1.x * p2.y - p2.x * p1.y;
      x += (p1.x + p2.x) * f;
      y += (p1.y + p2.y) * f;
    }

    f = this.area(pts) * 6;

    return [x / f, y / f];
  };

  vectorAverage(vector) {
    if (Object.prototype.toString.call(vector) !== '[object Array]' || !vector.length) {
      return 0;
    }
    var len = vector.length;
    var x = 0;
    var y = 0;
    vector.forEach(component=> {
      x += component.x;
      y += component.y;
    });
    return [x / len, y / len];
  }

  geoCluster(locsToCluster, options, cb) {
    const epsilonMeters = options.epsilonMeters || dbscanGeoEpsilonMeters;
    const minMembersInCluster = options.minMembersInCluster || dbscanGeoMinMembersInCluster;
    var vectorToCluster = locsToCluster.map(loc=> {
      return [loc.lat, loc.lng];
    });
    var geoClusters = dbscan.run(
      vectorToCluster,
      epsilonMeters,
      minMembersInCluster,
      function (p, q) {
        if (p.length != 2 || q.length != 2) {
          return Number.MAX_VALUE;
        }
        loc0.lat = p[1];
        loc0.lng = p[0];
        loc1.lat = q[1];
        loc1.lng = q[0];
        if (loc0.lat === loc1.lat && loc0.lng === loc1.lng) {
          return Number.MAX_VALUE;
        }
        //Quick look to exclude very far away
        var delX = (loc0.lng - loc1.lng);
        var delY = (loc0.lat - loc1.lat);
        var quickDist = ((delY * delY) + (delX * delX));
        if (quickDist > quickDistanceExclude) {
          return Number.MAX_VALUE;
        }
        //Use great circle distance for more accuracy
        var distanceMeters = loopback.GeoPoint.distanceBetween(loc0, loc1, {type: 'meters'});
        return distanceMeters;
      });
    process.nextTick(()=> {
      cb(null, geoClusters.map(geoCluster=> {
        var points = geoCluster.map(idx=> {
          return {x: vectorToCluster[idx][0], y: vectorToCluster[idx][1]};
        });
        var centroid = this.centroid(points);
        if (isNaN(centroid[0]) || isNaN(centroid[1])) {
          centroid = this.vectorAverage(points);
        }
        return {
          clusterInd: geoCluster,
          centroid
        };
      }));
    });
  }
}

