const { EventLogs } = require('./event_logs.class');
const hooks = require('./event_logs.hooks');

module.exports = function (app) {
  const options = {
    
  };

  // Initialize our service with any options it requires
  app.use('/event_logs', new EventLogs(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('event_logs');

  service.hooks(hooks);
};