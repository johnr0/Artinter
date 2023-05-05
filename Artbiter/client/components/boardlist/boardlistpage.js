import React, {Component} from 'react'
import App from '../../App'
import Api from '../../middleware/api'

class BoardListPage extends Component{
    state={
        user_id: undefined,
        user_email: undefined,
        boards:{},

        collaborator_dict: {},

        invite: undefined,
    }

    componentDidMount(){
        var _this = this
        Api.app.reAuthenticate().then((res)=>{
            console.log(res, 'reauth success...')
            var boards = this.state.boards
            // find for initial
            Api.app.service('boards').timeout = 30000
            Api.app.service('boards').find({query: {owner: res.user._id, 
                $select: ['name', 'collaborators', 'owner', 'current_collaborators']}})
            .then((res)=>{
                console.log(res)
                for (var i in res){
                    boards[res[i]['_id']] = res[i]
                    for(var j in res[i].collaborators){
                        this.addCollaboratorEmail(res[i].collaborators[j])
                    }
                }
                // boards = boards.concat(res.data)
                _this.setState({boards});
            })
            Api.app.service('boards').find({query: {collaborators: res.user._id}})
            .then((res)=>{
                console.log(res)
                for (var i in res){
                    boards[res[i]['_id']] = res[i]
                    this.addCollaboratorEmail(res[i].owner)
                }
                // boards = boards.concat(res.data)
                _this.setState({boards});
            })

            // update
            

            _this.setState({boards: boards, user_id: res.user._id, user_email: res.user.email})

        }).catch((err)=>{
            console.log('no...')
            window.location.href = '/'
        })

        Api.app.service('boards').on('updated', (board)=>{
            console.log(board)
            var boards = _this.state.boards
            if(board.owner==_this.state.user_id){
                boards[board['_id']] = board
                _this.setState({boards})
            }else if(board.collaborators.indexOf(_this.state.user_id)!=-1){
                boards[board['_id']] = board
                _this.setState({boards})
            }
            
        })

        Api.app.service('boards').on('created', (board)=>{
            console.log(board)
            var boards = _this.state.boards
            if(board.owner==_this.state.user_id){
                boards[board['_id']] = board
                _this.setState({boards})
            }else if(board.collaborators.indexOf(_this.state.user_id)!=-1){
                boards[board['_id']] = board
                _this.setState({boards})
            }
        })

        Api.app.service('boards').on('removed', (board)=>{
            console.log(board)
            var boards = _this.state.boards
            if(board.owner==_this.state.user_id){
                delete boards[board['_id']]
                _this.setState({boards})
            }else if(board.current_collaborators[_this.state.user_id]!=undefined){
                delete boards[board['_id']]
                _this.setState({boards})
            }
        })
    }

    addCollaboratorEmail(user_id){
        var _this = this
        Api.app.service('users').find({query: {_id:user_id}})
        .then((res)=>{
            var collaborator_dict=this.state.collaborator_dict
            collaborator_dict[user_id] = res[0].email
            _this.setState({collaborator_dict})
        })
    }



    createBoard(){
        var arts = {}
        var texts = {}
        var a_layer_id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
        var _id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
        var layers = [a_layer_id]
        var a_layer = {
            _id:a_layer_id,
            board_id: _id,
            image: 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==',
            opacity: 1,
            choosen_by: '',
        }
        

        // var sketchundo = []
        var moodboardundo = []
        // sketchundo.length = 10
        var board= {
            _id: _id,
            name:'new board',
            owner: this.state.user_id, 
            texts:texts, layers:layers,
            collaborators: [],
            current_collaborators: {},
            // sketchundo: sketchundo,
        }
        Api.app.service('boards').create(board)
        Api.app.service('layers').create(a_layer)
        var boards = this.state.boards
        boards[_id] = board

        this.setState({boards})

    }

    deleteBoard(_id){
        var boards = this.state.boards
        var board = boards[_id]
        for(var i in board.current_collaborators){
            if(board.current_collaborators[i].active){
                alert('You cannot delete as there is an active user in the board.')
                return
            }
        }
        if(confirm("Are you sure to delete this board?")){
            
            Api.app.service('boards').remove(_id)
            
            
            delete boards[_id]
            this.setState({boards})
        }
        
    }

    editBoardName(_id){
        var new_name = prompt('Change board name to...')
        console.log(new_name)
        if(new_name!==null){
            if(new_name.length>0){
                Api.app.service('boards').update(_id, {$set: {name: new_name}})
                var boards = this.state.boards
                boards[_id].name = new_name
                this.setState({boards})
            }else{
                alert('Name should have at least one character.')
            }
        }
        
    }

    inviteModalOn(_id){
        this.setState({invite: _id})
    }

    inviteModalClose(){
        this.setState({invite: undefined})
    }

    inviteCollaborator(){
        var email = document.getElementById('collaborator_input').value
        console.log(email)
        if(email==this.state.user_email){
            return
        }
        var _this = this
        Api.app.service('users').find({query:{email: email}}).then((res)=>{
            console.log(res)
            if(res.length==0){
                alert('The user does not exist.')
            }else{
                var boards = _this.state.boards
                var invite = _this.state.invite
                if(boards[invite].collaborators.indexOf(res[0]._id)==-1){
                    boards[invite].collaborators.push(res[0]._id)
                    _this.state.collaborator_dict[res[0]._id] = email
                    Api.app.service('boards').update(invite, {$set:{updated:'collaborator_invited'}, $push: {collaborators: res[0]._id}}).then(()=>{
                        _this.setState({boards:boards}, function(){
                            document.getElementById('collaborator_input').value=''
                        })
                        
                    }).catch((err)=>{
                        console.log('err here')
                    })
                }
            }
        }).catch((err)=>{
            console.log(err)
            alert('The user does not exist.')
        })
    }    

    removeCollaborator(_id){
        var _this = this

        var boards = _this.state.boards
        var invite = _this.state.invite

        var col = boards[invite].collaborators
        col.splice(col.indexOf(_id), 1)
        boards[invite].collaborators = col
        
        console.log('remove...', _id, invite)
        Api.app.service('boards').update(invite, {$set:{updated:'collaborator_invited'}, $pull: {collaborators: _id}}).then(()=>{
            _this.setState({boards:boards})
        }).catch((err)=>{
            console.log('err here')
        })
    }


    renderBoards(){
        return Object.keys(this.state.boards).map((key, idx)=>{
            var board = this.state.boards[key]
            return (<li key={board._id} className='collection-item' style={{position: 'relative'}}>
                <div style={{display:'inline-block', color: (board.owner==this.state.user_id)?'black':'#333333'}}>
                    <a href={'/boards_AI?_id='+board._id}>
                        {board.name}
                        {(board.owner==this.state.user_id) && ' (belongs to you)'}
                        {(board.owner!=this.state.user_id) && ' (belongs to '+this.state.collaborator_dict[board.owner]+')'}
                    </a>
                    {/* /
                    <a href={'/boards_baseline?_id='+board._id}>
                        baseline
                    </a> */}
                </div>
                {this.state.user_id==board.owner && 
                    <div style={{display: 'inline-block', position:'absolute', right: '0'}}>
                        <div style={{display: 'inline-block'}} onClick={this.inviteModalOn.bind(this, board._id)}>
                            <i className='material-icons'>person_add</i>
                        </div>
                        <div style={{display: 'inline-block'}} onClick={this.editBoardName.bind(this, board._id)}>
                            <i className='material-icons'>edit</i>
                        </div>
                        <div style={{display: 'inline-block'}} onClick={this.deleteBoard.bind(this,board._id)}>
                            <i className='material-icons'>delete</i>
                        </div>
                    </div>
                }
                
            </li>)
        })
    }

    // renderCollaborators

    renderInviteModal(){
        return (
        <div style={{height:'100%', width:'100%', backgroundColor:'#00000088', position:'absolute', top: 0}}>
            <div id="modal1" className="modal" style={{display:'block', top: 'calc(50% - 200px)'}}>
                <div className="modal-content">
                    <h4>Invite collaborators</h4>
                    <p>to "{this.state.boards[this.state.invite].name}"</p>
                    <h5>Currently invited:</h5>
                    <div style={{height: 80, padding: 10, border: 'solid 1px #333333'}}>
                        {this.state.boards[this.state.invite].collaborators.map((_id, idx)=>{
                            return (<span key={'users'+_id} className='collaborator_badge'>{this.state.collaborator_dict[_id]}
                             <span className='collaborator_badge_remove' onClick={this.removeCollaborator.bind(this, _id)}>X</span></span>)
                        })}
                    </div>
                    <h5>Add collaborator</h5>
                    <div><input id='collaborator_input' style={{width: 'calc(100% - 100px)'}}type='email'></input>
                        <span onClick={this.inviteCollaborator.bind(this)} className='btn' style={{float:'right'}}>Add</span>
                    </div>
                </div>
                <div className="modal-footer">
                <a href="#!" className="modal-close waves-effect waves-green btn-flat" onClick={this.inviteModalClose.bind(this)}>Done</a>
                </div>
        </div>
      </div>)
    }

    signOut(){
        Api.app.logout().then(()=>{
            window.location.href='/'
        })
        
    }

    render(){
        return (<div>
          
            <div className="row" style={{width:'500px', marginTop:'50px', marginBottom:'50px'}}>
                <div style={{display: 'inline-block', width:'100%', position:'relative'}}>
                    <div style={{fontSize:'1.5rem'}}>Board List</div>
                    <div style={{position: 'absolute', right:'0', top: '0'}}>
                        <span className='btn' style={{marginRight:'10px'}} onClick={this.createBoard.bind(this)}>Add</span>
                        <span className='btn red' onClick={this.signOut.bind(this)}>Sign out</span>
                    </div>
                </div>
                
              
                <ul className="collection" style={{overflowY:'auto'}}>
                    
                    {this.renderBoards()}
                </ul>
            </div>

            {this.state.invite!=undefined && this.renderInviteModal()}
        </div>)
    }
}

export default BoardListPage;