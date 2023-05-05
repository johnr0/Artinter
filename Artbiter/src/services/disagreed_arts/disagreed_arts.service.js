const { DisagreedArts } = require('./disagreed_arts.class');
const hooks = require('./disagreed_arts.hooks');

module.exports = function (app) {
  const options = {
    
  };

  // Initialize our service with any options it requires
  app.use('/disagreed_arts', new DisagreedArts(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('disagreed_arts');

  service.hooks(hooks);
};