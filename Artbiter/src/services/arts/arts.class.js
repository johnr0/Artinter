const { Service } = require('feathers-mongodb');

exports.Arts = class Arts extends Service {
  constructor(options, app) {
    super(options);
    
    app.get('mongoClient').then(db => {
      this.Model = db.collection('arts');
    });
  }

};