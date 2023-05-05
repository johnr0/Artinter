/* eslint-disable no-console */
const logger = require('./logger');
const app = require('./app2');
const port = process.env.PORT || app.get('port');
const express = require('@feathersjs/express');

app.use(express.static('./client'));
console.log('eee')
app.get('/*', function (req, res) {
  res.sendFile(path.join(__dirname, './client', 'index.html'));
});



const server = app.listen(port);

process.on('unhandledRejection', (reason, p) =>
  logger.error('Unhandled Rejection at: Promise ', p, reason)
);

server.on('listening', () =>
  logger.info('Feathers application started on http://%s:%d', app.get('host'), port)
);