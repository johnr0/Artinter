const { Service } = require('feathers-mongodb');

exports.SketchUndos = class SketchUndos extends Service {
    constructor(options, app) {
        super(options);

        app.get('mongoClient').then(db=>{
            this.Model = db.collection('sketchundos')
        })
    }
    
}