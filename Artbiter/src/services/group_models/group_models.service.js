const { GroupModels } = require('./group_models.class');
const hooks = require('./group_models.hooks');

module.exports = function (app) {
  const options = {
    multi: true
  };

  // Initialize our service with any options it requires
  app.use('/group_models', new GroupModels(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('group_models');

  service.hooks(hooks);
};