'use strict';

const authentication = require('@feathersjs/authentication');


module.exports = function() {
  const app = this;

  let config = app.get('auth');
  

  
  app.configure(authentication);
};
