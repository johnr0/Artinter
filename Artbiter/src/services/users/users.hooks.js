const { authenticate } = require('@feathersjs/authentication').hooks;
const errors  = require('@feathersjs/errors');

const {
  hashPassword, protect
} = require('@feathersjs/authentication-local').hooks;


const checkExistingUsers= async context =>{
    const email = context.data.email
    console.log(context.data)
    console.log("?")
    context.app.service('users').find({query:{email: email}}).then((res)=>{
      console.log(res)
      if(res.length>0){
        // context.error = new errors.GeneralError("User already exists.")
        throw new errors.GeneralError("User already exists.")
      }
    })
  }

const doingauth = async context => {
  console.log(context)
}

module.exports = {
    before: {
      all: [],
      find: [ authenticate('jwt') ],
      get: [ authenticate('jwt') ],
      create: [ hashPassword('password'), checkExistingUsers],
      update: [ hashPassword('password'),  authenticate('jwt') ],
      patch: [ hashPassword('password'),  authenticate('jwt') ],
      remove: [ authenticate('jwt') ]
    },
  
    after: {
      all: [ 
        // Make sure the password field is never sent to the client
        // Always must be the last hook
        protect('password')
      ],
      find: [],
      get: [],
      create: [],
      update: [],
      patch: [],
      remove: []
    },
  
    error: {
      all: [],
      find: [],
      get: [],
      create: [],
      update: [],
      patch: [],
      remove: []
    }
  };