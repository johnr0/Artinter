import io from 'socket.io-client';
import feathers from '@feathersjs/client';

class API {
  constructor() {
    // Establish a Socket.io connection
    const socket = io();
    // Initialize our Feathers client application through Socket.io
    // with hooks and authentication.
    this.app = feathers()
      .configure(feathers.socketio(socket))
      // .configure(feathers.hooks())
      // Use localStorage to store our login token
      .configure(feathers.authentication({
        type: 'local',
        storage: window.localStorage,
      }));
  }

  service(serviceName) {
    return this.app.service(serviceName)
  }

  reAuthenticate(){
    return this.app.reAuthenticate()
  }

  authenticate(user) {
    const { email, password } = user
    return this.app.authenticate({
      strategy: 'local',
      email: email,
      password: password
    }).then(()=>{
      console.log('success..')
      window.location.href = '/boardlist'
    }).catch((err)=>{
      alert('Incorrect Login Info')
    })
  }

  createUser(user){
    const { email, password } = user
    return this.app.service('users').create({
        email,
        password,
      }
    ).then(function(){
      alert('Please login with created account!')
      location.reload();
    }).catch((err)=>{
      alert('User already exists')
    })
  }

  signOut() {
    return this.app.logout()
  }
}

const Api = new API()

export default Api
