'use strict';
const log = require('debug')('boot:routes:scraper'),
  scraperPath = 'server/real-time/instagram/';

module.exports = function(app) {

  app.post('/scrape', function(req, res) {
    const Setting = app.models.Setting;

    Setting.findOne({ where: {key: 'scraper:instagramAccessToken'} },
      function(err, setting) {
        if (err || !setting || setting.value == '') {
          log(err);
          res.status(500).json({error: 'ERROR: scraper failed. Check settings.'});
          return;
        }

        let params = req.body;
        params.accessToken = setting.value;
        startScraper(params);

        res.json({success: true});
      });
  });

  function startScraper(params) {
    const spawn = require('child_process').spawn;

    const scraper = spawn(scraperPath + 'scrape.sh',
      [
        params.accessToken,
        params.coords.join(','),
        params.startDate,
        params.endDate,
        params.index || 'instagram',
        params.name
      ],
      {
        detached: true
        // stdio: ['ignore', 'ignore', 'ignore']
      }
    );

    scraper.stderr.on('data', function (data) {
      log('stderr: ' + data);
    });

    scraper.on('close', function (code) {
      log('child process exited with code ' + code);
    });

    scraper.on('error', function (err) {
      log('Failed to start scraper.');
    });

    scraper.unref();
  }
};
