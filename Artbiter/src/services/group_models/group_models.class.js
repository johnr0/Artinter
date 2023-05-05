const { Service } = require('feathers-mongodb');

exports.GroupModels = class GroupModels extends Service {
  constructor(options, app) {
    super(options);
    
    app.get('mongoClient').then(db => {
      this.Model = db.collection('group_models');
    });
  }

};