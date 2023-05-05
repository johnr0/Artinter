import React from 'react'
import { render } from 'react-dom'
// import { Provider } from 'react-redux'
import store, { history } from './store'
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom'
// import injectTapEventPlugin from 'react-tap-event-plugin'

// import App from './App'
import Home from './containers/Home'
import Interface from './containers/Interface'
import NotFound from './containers/NotFound'
import 'materialize-css/dist/css/materialize.css'
import './style.css';
import Login from './containers/Login'
import BoardList from './containers/BoardList'
import InterfaceAI from './containers/InterfaceAI'

// injectTapEventPlugin()

render(
  <Router>
    <Switch>
      
      <Route exact path='/'>
        <Login></Login>
      </Route>
      <Route path='/boards_baseline'>
        <Interface></Interface>
      </Route>
      <Route path='/boards_AI'>
        <InterfaceAI></InterfaceAI>
      </Route>
      <Route path='/boardlist'>
        <BoardList></BoardList>
      </Route>
      
    </Switch>
  </Router>
  ,
document.getElementById('root'))
