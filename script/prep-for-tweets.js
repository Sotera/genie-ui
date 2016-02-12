#!/usr/bin/env node
'use strict';

const app = require('../server/server'),
  GeoTweet = app.models.GeoTweet,
  GeoTweetHashtagIndex = app.models.GeoTweetHashtagIndex,
  HashtagEventsSource = app.models.HashtagEventsSource,
  ZoomLevel = app.models.ZoomLevel,
  Setting = app.models.Setting
;

GeoTweet.destroyAll({}, console.log);
GeoTweetHashtagIndex.destroyAll({}, console.log);
HashtagEventsSource.destroyAll({}, console.log);
ZoomLevel.destroyAll({}, console.log);

Setting.updateAll({key: 'zoomLevels:startDate'}, {value: '2016-02-09'}, console.log);
Setting.updateAll({key: 'zoomLevels:endDate'}, {value: '2016-02-11'}, console.log);
