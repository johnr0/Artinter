const { Service } = require('feathers-mongodb');

exports.GroupStyles = class GroupStyles extends Service {
  constructor(options, app) {
    super(options);
    
    app.get('mongoClient').then(db => {
      this.Model = db.collection('group_styles');
    });
  }

};