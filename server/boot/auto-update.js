// update db schema from model defs
// https://docs.strongloop.com/display/public/LB/Creating+a+database+schema+from+models#Creatingadatabaseschemafrommodels-Auto-update
module.exports = app => {
  app.dataSources.db.autoupdate((err, result) => {
    if (err) throw err;
  });
};
