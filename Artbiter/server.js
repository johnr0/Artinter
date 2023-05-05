

// var app = express();

// app.use(express.static(path.join(__dirname, 'dist')));
// app.use('/img', express.static(path.join(__dirname, 'client/img')));
// app.set('port', process.env.PORT || 8080);



// var server = app.listen(app.get('port'), function() {
//   console.log('listening on port ', server.address().port);
// });

var path = require('path');
// var express = require('express');
const logger = require('./src/logger');
console.log('./src/app')
const app = require('./src/app2');
const port = process.env.PORT || app.get('port');
const express = require('@feathersjs/express');

app.use(express.static(path.join(__dirname, 'dist')));
console.log('express2', path.join(__dirname, 'client/img'))
app.use('/img', express.static(path.join(__dirname, 'client/img')));
// app.get('/*', function (req, res) {
//   res.sendFile(path.join(__dirname, './client', 'index.html'));
// });

const server = app.listen(port);

process.on('unhandledRejection', (reason, p) =>
  logger.error('Unhandled Rejection at: Promise ', p, reason)
);

server.on('listening', () =>
  logger.info('Feathers application started on http://%s:%d', app.get('host'), port)
);