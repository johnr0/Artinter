'use strict';

const gravatar = require('./gravatar');

const globalHooks = require('../../../hooks');
const hooks = require('@feathersjs/hooks');
const auth = require('@feathersjs/authentication').hooks;
const { hashPassword, protect } = require('@feathersjs/authentication-local').hooks;

exports.before = {
  all: [],
  find: [
    // auth.restrictToAuthenticated()
    auth.authenticate('jwt')
  ],
  get: [
    // auth.restrictToAuthenticated(),
    auth.authenticate('jwt'),
    // auth.restrictToOwner({ ownerField: '_id' })
  ],
  create: [hashPassword('password'), gravatar()],
  update: [
    // auth.restrictToAuthenticated(),
    hashPassword('password'),
    auth.authenticate('jwt'),
    // auth.restrictToOwner({ ownerField: '_id' })
  ],
  patch: [
    // auth.restrictToAuthenticated(),
    hashPassword('password'),
    auth.authenticate('jwt'),
    // auth.restrictToOwner({ ownerField: '_id' })
  ],
  remove: [
    // auth.restrictToAuthenticated(),
    auth.authenticate('jwt'),
    // auth.restrictToOwner({ ownerField: '_id' })
  ]
};

exports.after = {
  all: [protect('password')],
  find: [],
  get: [],
  create: [],
  update: [],
  patch: [],
  remove: []
};
