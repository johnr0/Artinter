import React, { Component, PropTypes } from 'react'
import Board from '../components/board/board'

class Interface extends Component {
  render() {
    return(
      <div className="main">
        <Board></Board>
      </div>
    )
  }
}

export default Interface