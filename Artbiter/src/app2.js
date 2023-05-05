const path = require('path');
const favicon = require('serve-favicon');
const compress = require('compression');
const helmet = require('helmet');
const cors = require('cors');
const logger = require('./logger');

const feathers = require('@feathersjs/feathers');
const configuration = require('@feathersjs/configuration');
const express = require('@feathersjs/express');
const socketio = require('@feathersjs/socketio');
const webpack = require('webpack');


const middleware = require('./middleware');
const services = require('./services');
const appHooks = require('./app.hooks');
const channels = require('./channels');

const authentication = require('./authentication');

const mongodb = require('./mongodb');

const app = express(feathers());
console.log(process.env.NODE_ENV)
const configType = process.env.NODE_ENV === 'production' ? 'prod' : 'dev';
const config = require(`../webpack.config.${configType}.js`);
const compiler = webpack(config);
console.log(config.output.publicPath)
app.use(require('webpack-dev-middleware')(compiler, {
  noInfo: true,
  publicPath: config.output.publicPath
}));

app.use(require('webpack-hot-middleware')(compiler));
console.log(configuration())
// Load app configuration
app.configure(configuration());
// Enable security, CORS, compression, favicon and body parsing
// app.use(helmet());
app.use(cors());
app.use(compress());
app.use(express.json({limit: '200mb'}));
app.use(express.urlencoded({ limit: '200mb', extended: true}));
// app.use(favicon(path.join(app.get('public'), 'favicon.ico')));
// Host the public folder
console.log('public path:', app.get('public'))
// app.use('/static/', express.static(app.get('public')));

app.use('/static/', express.static(app.get('public')));
app.use('/', express.static(app.get('public')));
app.use('/boardlist', express.static(app.get('public')));
app.use('/boards_baseline', express.static(app.get('public')));
app.use('/boards_AI', express.static(app.get('public')));
console.log(path.join(__dirname, 'client/img'))
app.use('/img', express.static(path.join(__dirname, '../client/img')));


// Set up Plugins and providers
app.configure(express.rest());
app.configure(socketio())

app.configure(mongodb);

// Configure other middleware (see `middleware/index.js`)
app.configure(middleware);
app.configure(authentication);
// Set up our services (see `services/index.js`)
app.configure(services);
// Set up event channels (see channels.js)
app.configure(channels);

// Configure a middleware for 404s and the error handler
app.use(express.notFound());
app.use(express.errorHandler({ logger }));

app.hooks(appHooks);

app.service('boards').timeout=30000



// console.log(app.post)


module.exports = app;