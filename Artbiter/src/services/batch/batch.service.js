const {BatchService} = require('feathers-batch')

module.exports = function (app) {
    const options= {

    }

    app.use('/batch', new BatchService(app));
}