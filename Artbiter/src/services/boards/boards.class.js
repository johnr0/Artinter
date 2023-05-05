const { Service } = require('feathers-mongodb');

exports.Boards = class Boards extends Service {
  constructor(options, app) {
    super(options);
    
    app.get('mongoClient').then(db => {
      this.Model = db.collection('boards');
    });
  }

};