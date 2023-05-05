const { Groups } = require('./groups.class');
const hooks = require('./groups.hooks');

module.exports = function (app) {
  const options = {
    // paginate: app.get('paginate')
    multi: true
  };

  // Initialize our service with any options it requires
  app.use('/groups', new Groups(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('groups');

  service.hooks(hooks);
};