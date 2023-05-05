const { GroupStyles } = require('./group_styles.class');
const hooks = require('./group_styles.hooks');

module.exports = function (app) {
  const options = {
    
  };

  // Initialize our service with any options it requires
  app.use('/group_styles', new GroupStyles(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('group_styles');

  service.hooks(hooks);
};