const {SketchUndos} = require('./sketchundos.class');
const hooks = require('./sketchundos.hooks');

module.exports = function (app) {
    const options = {

    };

    app.use('/sketchundos', new SketchUndos(options, app));

    const service = app.service('sketchundos');

    service.hooks(hooks)
}