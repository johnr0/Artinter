const { ArtStyles } = require('./art_styles.class');
const hooks = require('./art_styles.hooks');

module.exports = function (app) {
  const options = {
    
  };

  // Initialize our service with any options it requires
  app.use('/art_styles', new ArtStyles(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('art_styles');

  service.hooks(hooks);
};