const { Arts } = require('./arts.class');
const hooks = require('./arts.hooks');

module.exports = function (app) {
  const options = {
    multi: true,
  };

  // Initialize our service with any options it requires
  app.use('/arts', new Arts(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('arts');

  service.hooks(hooks);
};