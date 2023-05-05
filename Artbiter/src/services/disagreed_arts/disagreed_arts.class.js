const { Service } = require('feathers-mongodb');

exports.DisagreedArts = class DisagreedArts extends Service {
  constructor(options, app) {
    super(options);
    
    app.get('mongoClient').then(db => {
      this.Model = db.collection('disagreed_arts');
    });
  }

};