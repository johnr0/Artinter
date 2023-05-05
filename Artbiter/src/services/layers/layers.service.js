const { Layers } = require('./layers.class');
const hooks = require('./layers.hooks');

module.exports = function (app) {
  const options = {
    // paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/layers', new Layers(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('layers');

  service.hooks(hooks);
};