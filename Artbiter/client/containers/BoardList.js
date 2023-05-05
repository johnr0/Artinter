import React, {Component} from 'react'
import BoardListPage from '../components/boardlist/boardlistpage'
import Api from '../middleware/api'

class BoardList extends Component{

    render(){
        return (<div className="main">
            <div style={{flex: 'auto', width: '100%'}} className='row'>
                <BoardListPage></BoardListPage>
            </div>
        </div>)
    }
}

export default BoardList;