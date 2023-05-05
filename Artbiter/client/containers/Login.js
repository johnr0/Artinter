import React, { Component, PropTypes } from 'react'
import LoginPage from '../components/login/loginpage'

class Login extends Component {
  render() {
    return(
      <div className="main">
        <div style={{flex: 'auto', width: '100%'}} className='row'>
            <LoginPage></LoginPage>
        </div>
      </div>
    )
  }
}

export default Login