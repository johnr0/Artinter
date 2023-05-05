const recordTime = async context =>{
  context.data.timestamp = new Date();
}

module.exports = {
    before: {
      all: [],
      find: [ ],
      get: [],
      create: [recordTime],
      update: [],
      patch: [],
      remove: []
    },
  
    after: {
      all: [],
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