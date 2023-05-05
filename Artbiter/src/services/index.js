const users = require('./users/users.service.js');
const boards = require('./boards/boards.service.js');
const layers = require('./layers/layers.service.js');
const arts = require('./arts/arts.service.js');
const groups = require('./groups/groups.service.js');
const searched_arts = require('./searched_arts/searched_arts.service.js');
const art_styles = require('./art_styles/art_styles.service.js');
const group_styles = require('./group_styles/group_styles.service.js');
const disagreed_arts = require('./disagreed_arts/disagreed_arts.service.js');
const group_models = require('./group_models/group_models.service.js')
const event_logs = require('./event_logs/event_logs.service.js')
const sketchundos = require('./sketchundos/sketchundos.service.js')
const {BatchService} = require('feathers-batch')

module.exports = function (app) {
  app.configure(users);
  app.configure(boards);
  app.configure(layers);
  app.configure(arts);
  app.configure(groups);
  app.configure(searched_arts);
  app.configure(art_styles);
  app.configure(group_styles);
  app.configure(disagreed_arts);
  app.configure(group_models);
  app.configure(event_logs);
  app.configure(sketchundos)
  app.use('/batch', new BatchService(app));
};