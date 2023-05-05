const { Service } = require('feathers-mongodb');

exports.Layers = class Layers extends Service {
  constructor(options, app) {
    super(options);
    
    app.get('mongoClient').then(db => {
      this.Model = db.collection('layers');
    });
  }

};