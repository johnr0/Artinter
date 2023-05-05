const { SearchedArts } = require('./searched_arts.class');
const hooks = require('./searched_arts.hooks');

module.exports = function (app) {
  const options = {
    
  };

  // Initialize our service with any options it requires
  app.use('/searched_arts', new SearchedArts(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('searched_arts');

  service.hooks(hooks);
};