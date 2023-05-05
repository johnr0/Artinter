import React, { Component, PropTypes } from 'react'
import BoardAI from '../components/board/boardAI'

class InterfaceAI extends Component {
  render() {
    return(
      <div className="main">
        <BoardAI></BoardAI>
      </div>
    )
  }
}

export default InterfaceAI