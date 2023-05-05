import React from 'react'
import Board from './board'
import Api from '../../middleware/api'
import MoodBoardAI from '../moodboard/moodboardAI'
import SketchPadAI from '../sketchpad/sketchpadAI'


class BoardAI extends Board{

    componentDidMount(){
        
        // when groups are created
        Api.app.service('groups').on('created', (data)=>{
            if(data.board_id==this.state.board_id){
                var groups = this.moodboard.state.groups
                groups[data._id] = data
                this.moodboard.setState({groups})
            }
        })

        Api.app.service('groups').on('removed', (data)=>{
            var groups = this.moodboard.state.groups
            delete groups[data._id]
            this.moodboard.setState({groups})
        
        })

        Api.app.service('groups').on('patched', (data)=>{
            if(data.board_id==this.state.board_id){
                if(data.updated == 'groups_position'){
                    var groups = this.moodboard.state.groups
                    groups[data._id].pos = data.pos
                    this.moodboard.setState({groups})
                }else if(data.updated.indexOf('groups_add')!=-1 || data.updated.indexOf('groups_remove')!=-1){
                    // if(data.updated.indexOf(this.state.user_id)!=-1){
                        var groups = this.moodboard.state.groups
                        groups[data._id].pos = data.pos
                        groups[data._id].art_ids = data.art_ids
                        groups[data._id].user_info = data.user_info
                        this.moodboard.setState({groups})
                    // }
                    
                }else if(data.updated.indexOf('groups_relate')!=-1){
                    var groups = this.moodboard.state.groups
                    groups[data._id].higher_group = data.higher_group
                    this.moodboard.setState({groups})
                }else if(data.updated == 'groups_toggle_inclusion'){
                    var groups = this.moodboard.state.groups
                    groups[data._id].user_info = data.user_info
                    this.moodboard.setState({groups})
                }
                
            }
        })

        Api.app.service('searched_arts').on('created', (data)=>{
            if(data.board_id==this.state.board_id){
                var searched_arts = this.moodboard.state.searched_arts
                searched_arts[data._id] = data
                this.moodboard.setState({searched_arts})
            }
        })

        Api.app.service('searched_arts').on('removed', (data)=>{
            var searched_arts = this.moodboard.state.searched_arts
            delete searched_arts[data._id]
            this.moodboard.setState({searched_arts})
        
        })

        // Api.app.service('disagreed_arts').on('created', (data)=>{
        //     if(data.board_id==this.state.board_id){
        //         var disagreed_arts = this.moodboard.state.disagreed_arts
        //         disagreed_arts[data._id] = data
        //         this.moodboard.setState({disagreed_arts})
        //     }
        // })

        // Api.app.service('disagreed_arts').on('removed', (data)=>{
        //     var disagreed_arts = this.moodboard.state.disagreed_arts
        //     delete disagreed_arts[data._id]
        //     this.moodboard.setState({disagreed_arts})
        
        // })

        this.runAuth()
        this.prepareUpdates()
        


    }

    runAuth(){
        var board_id = this.gup('_id')
        var _this = this
        Api.app.reAuthenticate().then((res)=>{
            var user_id = res.user['_id']
            var user_email = res.user['email']
            if(res.user['board_id']!=board_id){
                Api.app.service('users').update(user_id, {$set:{board_id: board_id}})
                location.reload();
            }
            console.log(analytics)
            // Api.app.service('event_logs').create({event: 'enter_board', board_id, user_email, user_id})
            // analytics.logEvent("enter_board", {board_id, user_email, user_id})
            console.log('timeout before...', Api.app.service('boards').timeout)
            Api.app.service('boards').timeout = 60000
            Api.app.service('arts').timeout = 60000
            Api.app.service('searched_arts').timeout = 60000
            Api.app.service('layers').timeout = 60000
            Api.app.service('groups').timeout = 60000
            console.log('timeout after...', Api.app.service('boards').timeout)
            Api.app.service('boards').find({query: {_id: board_id,
                $select: ['name', 'owner', 'undoable', 'texts', 'collaborators', 'labels', 'sketchundo','current_collaborators', 'layers', 'searchMode', 'searchPane', 'search_image_selected', 'search_slider_values', 'search_slider_distances', 'search_scroll','generate_slider_values', 'agreementPane', 'agreement_userSelection']
            }})
            .then((res0)=>{
                var res = res0
                if(res.length==0){
                    window.location.href='/boardlist'
                }else{
                    this.setState({board_loaded: true})
                    // Api.app.service('event_logs').create({event: 'enter_board', board_id, user_email, user_id})
                    console.log(res[0])
                    for(var j in res[0].collaborators){
                        if(res[0].collaborators[j]!=user_id){
                            this.addCollaboratorEmail(res[0].collaborators[j])
                        }
                        
                    }
                    if(res[0].owner!=user_id){
                        this.addCollaboratorEmail(res[0].owner)
                    }

                    // propage board contents to sketchpad and moodboard
                    var labels = res[0]['labels']
                    if(labels==undefined){
                        labels = {}
                    }
                    var layers = res[0]['layers']
                    var sketchundo = res[0]['sketchundo']
                    // _this.sketchpad.setState({layers: layers, sketchundo: sketchundo}, function(){
                    _this.sketchpad.setState({layers: layers, sketchundo: sketchundo,}, function(){
                        // for(var layer_idx in layers){
                        //     var layer_id = layers[layer_idx]
                        //     console.log(layer_id)
                        //     Api.app.service('layers').find({query: {_id: layer_id}})
                        //     .then((res)=>{
                        //         console.log(res)
                        //         var layer_dict = _this.sketchpad.state.layer_dict
                        //         layer_dict[res[0]._id] = res[0]
                        //         _this.sketchpad.setState({layer_dict})
                        //         _this.loadALayer(res[0])
                        //     })
                        // }
                        Api.app.service('layers').find({query: {board_id: board_id}})
                        .then((res)=>{
                            console.log(res)
                            _this.setState({layers_loaded: true})
                            for(var li in res){
                                var layer_dict = _this.sketchpad.state.layer_dict
                                layer_dict[res[li]._id] = res[li]
                                
                                _this.loadALayer(res[li])
                            }
                            _this.sketchpad.setState({layer_dict})
                            

                            // find and retrieve layers
                            var arts = _this.moodboard.state.arts
                            var searchPane=false
                            var searchMode = 'search'
                            var search_image_selected = undefined
                            var search_slider_values = {}
                            var search_slider_distances = {}
                            var generate_slider_values = {}

                            var search_scroll = 0

                            var agreementPane=false
                            var agreement_userSelection = {}
                            
                            if(res0[0].searchMode!=undefined){
                                searchMode = res0[0].searchMode
                            }
                            if(res0[0].searchPane!=undefined){
                                searchPane = res0[0].searchPane
                            }
                            if(res0[0].search_image_selected!=undefined){
                                search_image_selected = res0[0].search_image_selected
                            }
                            if(res0[0].search_slider_values!=undefined){
                                search_slider_values = res0[0].search_slider_values
                            }
                            if(res0[0].search_slider_distances!=undefined){
                                search_slider_distances = res0[0].search_slider_distances
                            }
                            if(res0[0].generate_slider_values!=undefined){
                                generate_slider_values = res0[0].generate_slider_values
                            }
                            if(res0[0].search_scroll!=undefined){
                                search_scroll = res0[0].search_scroll
                            }

                            if(res0[0].agreementPane!=undefined){
                                agreementPane = res0[0].agreementPane
                            }
                            if(res0[0].agreement_userSelection!=undefined){
                                agreement_userSelection = res0[0]['agreement_userSelection']
                            }
                            
                            Api.app.service('arts').find({query: {board_id: board_id, 
                                $select: ['_id']// ['position', 'ratio', 'choosen_by', 'updated', 'board_id', '_id', 'file', 'color', 'width', 'height', 'enabled', 'labels']
                            }})
                            .then((res)=>{
                                var arts_promises = []
                                for(var i in res){
                                    arts_promises.push(new Promise(function(resolve){
                                        Api.app.service('arts').find({query:{_id:res[i]._id,
                                        $select: ['_id', 'position', 'ratio', 'choosen_by', 'updated', 'board_id', '_id', 'file', 'color', 'width', 'height', 'enabled']}})
                                        .then((res_art)=>{
                                            if(typeof resolve === 'function'){
                                                resolve([res_art[0]])
                                            }else{
                                                resolve.push(res_art[0])
                                            }
                                        })
                                    }))
                                }

                                Promise.all(arts_promises).then((values)=>{
                                    _this.setState({arts_loaded:true})
                                    for(var idx in values){
                                        var art = values[idx][0]
                                        arts[art._id] = art
                                        if(labels[art._id]!=undefined){
                                            art.labels = labels[art._id]
                                        }
                                    }

                                    _this.moodboard.setState({arts: arts, searchPane: searchPane, search_image_selected: search_image_selected, 
                                        search_slider_values:search_slider_values, search_slider_distances: search_slider_distances, searchMode: searchMode,
                                        generate_slider_values: generate_slider_values, search_scroll: search_scroll, 
                                        agreementPane: agreementPane, agreement_userSelection: agreement_userSelection})



                                    var groups = _this.moodboard.state.groups

                                    Api.app.service('groups').find({query: {board_id: board_id,
                                        $select: ['_id', 'art_ids', 'group_name', 'higher_group', 'board_id', 'pos', 'user_info', 'updated'],
                                    }})
                                    .then((res)=>{
                                        _this.setState({groups_loaded: true})
                                        for(var i in res){
                                            var group = res[i]
                                            groups[group._id] = group
                                        }
                                        _this.moodboard.setState({groups:groups})

                                        var searched_arts = _this.moodboard.state.searched_arts
                                        Api.app.service('searched_arts').find({query: {board_id: board_id, 
                                            $select:['_id']
                                        }})
                                        .then((res)=>{
                                            
                                            var search_arts_promises = []
                                            for(var i in res){
                                                search_arts_promises.push(new Promise(function(resolve, reject){
                                                    Api.app.service('searched_arts').find({query: {_id: res[i]._id}})
                                                    .then((res_search)=>{
                                                        // searched_arts[res[i]._id] = res_search[0]
                                                        // _this.moodboard.setState({searched_arts:searched_arts})
                                                        // return searched_arts
                                                        if(typeof resolve === 'function'){
                                                            resolve([res_search[0]])
                                                        }else{
                                                            resolve.push(res_search[0])
                                                        }
                                                        // return res_search[0]
                                                    })
                                                }))
                                            }
                                            
                                            Promise.all(search_arts_promises).then((values)=>{
                                                console.log('sssearch?', values)
                                                _this.setState({searched_arts_loaded: true})
                                                for(var idx in values){
                                                    var searched = values[idx][0]
                                                    searched_arts[searched._id] = searched
                                                }
                                                _this.moodboard.setState({searched_arts})

                                                var texts = res0[0]['texts']
                                                // var sketchundo = res[0]['sketchundo']
                                                var moodboardundo = res0[0]['moodboardundo']
                                                var current_collaborators = res0[0]['current_collaborators']

                                                var noone=true
                                                console.log(current_collaborators)
                                                for(var _id in current_collaborators){
                                                    if(current_collaborators[_id].active && user_id!=_id){
                                                        noone=false
                                                    }
                                                }
                                                console.log(noone)
                                                if(noone){
                                                    console.log('harabangtang', Object.keys(_this.moodboard.state.arts))
                                                    _this.ChooseArtsTexts([],[],Object.keys(_this.moodboard.state.arts), Object.keys(_this.moodboard.state.texts))
                                                    _this.ChooseLayers([],_this.sketchpad.layers)
                                                }
                                                
                                                current_collaborators[user_id] = {
                                                    // sketch_pos:[-1,-1],
                                                    // moodboard_pos: [-1, -1],
                                                    active: true
                                                }
                                                var set = {}
                                                set['current_collaborators.'+user_id] = current_collaborators[user_id]
                                                set['updated']='current_collaborators.'+user_id
                                                console.log(set)
                                                _this.setState({loaded:true, current_collaborators: current_collaborators, board_id: board_id, user_id: user_id, user_email:user_email}, function(){
                                                    // _this.sketchpad.setState({sketchundo: sketchundo})
                                                        // , function(){
                                                    //     var promises = []
                                                    //     for(var i in layers){
                                                    //         promises.push(_this.loadALayer(layers[i]))
                                                    //     }
                                                    //     Promise.all(promises)
                                                    // })
                                                    _this.moodboard.setState({texts:texts})
                                                    var md_search = document.getElementById('moodboard_searched_results')
                                                    if(md_search!=undefined){
                                                        md_search.scrollTop= md_search.scrollHeight*search_scroll
                                                    }
                                                    // console.log('done')
                                                })
                                                // console.log(layers, arts, texts, sketchundo)
                                                Api.app.service('boards').update(board_id, {$set: set})
                                                // .then((res)=>{
                                                    
                                                // })
                                            })


                                            // for(var i in res){
                                            //     searched_arts[res[i]._id] = res[i]
                                            // }
                                            // console.log('searched arts', searched_arts)
                                            // _this.moodboard.setState({searched_arts:searched_arts})

                                            

                                        })
                                    })
                                })




                                // _this.setState({arts_loaded: true})
                                // for(var i in res){
                                //     var art = res[i]
                                //     arts[art._id] = art
                                    
                                // }
                                
                                
                            })
                        })
                    })
                    
                    

                    
                    
                    

                    // var disagreed_arts = _this.moodboard.state.disagreed_arts
                    // Api.app.service('disagreed_arts').find({query: {board_id: board_id}})
                    // .then((res)=>{
                    //     for(var i in res){
                    //         disagreed_arts[res[i]._id] = res[i]
                    //     }
                    //     console.log('disagreed arts', disagreed_arts)
                    //     _this.moodboard.setState({disagreed_arts:disagreed_arts})
                    // })


                    // var arts = res[0]['arts']
                    
                    
                    
                    

                }
            })
        }).catch((err)=>{
            window.location.href='/'
        })
    }

    render(){
        return (
            <div id='board_whole' style={{flex: 'auto', width: '100%', position:'relative'}} className='row' onPointerUp={this.handleMouseUp.bind(this)}>
    
                <SketchPadAI board_this={this} board_state={this.state} ref={c=>this.sketchpad=c}></SketchPadAI>
                <MoodBoardAI board_this={this} board_state={this.state} ref={c=>this.moodboard=c}></MoodBoardAI>
                <div style={{position:'absolute', right: (this.state.moodboard_collapsed&&this.state.sketchpad_collapsed==false)?'40px':'10px', top: '10px'}}>
                    {this.renderCollaboartorStatus()}
                </div>
                <div style={{position:'absolute', left: 'calc(50% - 30px)', top: 'calc(50% + 38px)', 
                width:'60px', height:'60px', borderRadius: '50%', backgroundColor: '#333333',
                color: 'white', textAlign:'center', fontSize: '40px', cursor:'default', display: (this.state.moodboard_collapsed==false && this.state.sketchpad_collapsed==false)?'':'none'}} onPointerDown={this.addSketchIntoMoodboard.bind(this)}>
                    →
                </div>
                {/* {this.sketchpad!=undefined && this.sketchpad.state.control_state=='brush' && this.sketchpad.state.action=='brush' && this.sketchpad.renderBrushMark()} */}
                {this.state.loaded==false && <div style={{position: 'absolute', width: '100%', height: '100%', backgroundColor:'white', textAlign:'center', paddingTop: window.outerHeight/2-10}}>
                    <div>Page is being loaded...</div>
                    <div>
                        {this.state.board_loaded==true&&<span>●</span>}{this.state.board_loaded!=true&&<span>○</span>}
                        {this.state.layers_loaded==true&&<span>●</span>}{this.state.layers_loaded!=true&&<span>○</span>}
                        {this.state.arts_loaded==true&&<span>●</span>}{this.state.arts_loaded!=true&&<span>○</span>}
                        {this.state.groups_loaded==true&&<span>●</span>}{this.state.groups_loaded!=true&&<span>○</span>}
                        {this.state.searched_arts_loaded==true&&<span>●</span>}{this.state.searched_arts_loaded!=true&&<span>○</span>}
                    </div>
                </div>}
            </div>)
    }
}

export default BoardAI