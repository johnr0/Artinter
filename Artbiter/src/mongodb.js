const MongoClient = require('mongodb').MongoClient;

module.exports = function (app) {
  const connection = app.get('mongodb');
  console.log('connection', connection)
  const database = connection.substr(connection.lastIndexOf('/') + 1);
  console.log('database', database)
  const mongoClient = MongoClient.connect(connection, {poolSize:100})
    .then(client => client.db(database));

  app.set('mongoClient', mongoClient);
};