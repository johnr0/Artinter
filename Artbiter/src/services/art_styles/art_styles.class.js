const { Service } = require('feathers-mongodb');

exports.ArtStyles = class ArtStyles extends Service {
  constructor(options, app) {
    super(options);
    
    app.get('mongoClient').then(db => {
      this.Model = db.collection('art_styles');
    });
  }

};