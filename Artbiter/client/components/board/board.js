import { setManager } from '@feathersjs/hooks/lib'
import callOnce from 'material-ui/utils/callOnce'
import React, {Component} from 'react'
import Api from '../../middleware/api'
import MoodBoard from '../moodboard/moodboard'
import SketchPad from '../sketchpad/sketchpad'
// import analytics  from '../../middleware/firebase';

class Board extends Component{
    state={
        user_email: undefined,
        user_id: undefined,
        current_collaborators: {},
        board_id: undefined, 
        board_owner: undefined, 
        collaborator_dict: {},
        // lastmouseupdate: new Date(),
        sketchpad_collapsed: false,
        moodboard_collapsed: false,
        loaded: false,

        arts_loaded: false,
        board_loaded: false,
    }

    getRandomColor() {
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
          color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
      }

    addCollaboratorEmail(user_id){
        var _this = this
        Api.app.service('users').find({query: {_id:user_id}})
        .then((res)=>{
            var collaborator_dict=this.state.collaborator_dict
            collaborator_dict[user_id] = {email: res[0].email, color: this.getRandomColor()}

            _this.setState({collaborator_dict}, function(){
                console.log(this.state)
            })
        })
    }

    
    componentDidMount(){
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
            
            // analytics.logEvent("enter_board", {board_id, user_email, user_id})
            
            console.log('timeout before...', Api.app.service('boards').timeout)
            Api.app.service('boards').timeout = 30000
            Api.app.service('arts').timeout=30000
            Api.app.service('boards').find({query: {_id: board_id,
                $select: ['name', 'owner', 'texts', 'collaborators', 'current_collaborators', 'layers']
            }})
            .then((res0)=>{
                this.setState({board_loaded: true})
                if(res0.length==0){
                    window.location.href='/boardlist'
                }else{
                    // Api.app.service('event_logs').create({event: 'enter_board', board_id, user_email, user_id})
                    console.log(res0[0])
                    var owner = res0[0].owner
                    for(var j in res0[0].collaborators){
                        if(res0[0].collaborators[j]!=user_id){
                            this.addCollaboratorEmail(res0[0].collaborators[j])
                        }
                        
                    }
                    if(res0[0].owner!=user_id){
                        this.addCollaboratorEmail(res0[0].owner)
                    }

                    // propage board contents to sketchpad and moodboard
                    var layers = res0[0]['layers']
                    
                    // _this.sketchpad.setState({layers: layers, sketchundo: sketchundo}, function(){
                    _this.sketchpad.setState({layers: layers}, function(){
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
                            this.setState({layers_loaded: true})
                            for(var li in res){
                                var layer_dict = _this.sketchpad.state.layer_dict
                                layer_dict[res[li]._id] = res[li]
                                
                                _this.loadALayer(res[li])
                            }
                            _this.sketchpad.setState({layer_dict})

                            var arts = _this.moodboard.state.arts
                            Api.app.service('arts').find({query: {board_id: board_id, 
                                $select: ['position', 'ratio', 'choosen_by', 'updated', 'board_id', '_id', 'file', 'color', 'width', 'height', 'enabled', 'labels']
                            }})
                            .then((res)=>{
                                this.setState({arts_loaded: true})
                                console.log('art', res)
                                for(var i in res){
                                    var art = res[i]
                                    arts[art._id] = art
                                    
                                }
                                _this.moodboard.setState({arts: arts})

                                // var arts = res[0]['arts']
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
                                    sketch_pos:[-1,-1],
                                    moodboard_pos: [-1, -1],
                                    active: true
                                }
                                var set = {}
                                set['current_collaborators.'+user_id] = current_collaborators[user_id]
                                set['updated']='current_collaborators.'+user_id
                                console.log(set)
                                // console.log(layers, arts, texts, sketchundo)
                                Api.app.service('boards').update(board_id, {$set: set})
                                .then((res)=>{
                                    _this.setState({loaded:true, current_collaborators: current_collaborators, board_id: board_id, user_id: user_id, user_email:user_email, board_owner: owner}, function(){
                                        // _this.sketchpad.setState({sketchundo: sketchundo})
                                            // , function(){
                                        //     var promises = []
                                        //     for(var i in layers){
                                        //         promises.push(_this.loadALayer(layers[i]))
                                        //     }
                                        //     Promise.all(promises)
                                        // })
                                        _this.moodboard.setState({texts:texts})
                                    })
                                })
                            })
                        })
                    })
                    


                    // find and retrieve layers
                    
                    


                    

                    
                    
                    console.log('done')

                }
            })
        }).catch((err)=>{
            window.location.href='/'
        })
    }

    prepareUpdates(){
        var _this = this
        
        Api.app.service('arts').on('created', (data)=>{
            if(data.board_id==this.state.board_id){
                var arts = _this.moodboard.state.arts
                arts[data._id] = data
                _this.moodboard.setState({arts})
            }
        })

        Api.app.service('arts').on('removed', (data)=>{
                var arts = _this.moodboard.state.arts
                delete arts[data._id]
                _this.moodboard.setState({arts})
        })

        Api.app.service('arts').on('patched', (data)=>{
            console.log('patched!', data.updated)
            if(_this.moodboard!=null){
                var arts = _this.moodboard.state.arts
            
                if(data.updated=='arts_label'){
                    console.log('aaarrrrttttssss', data.labels)
                    arts[data._id]['labels'] = data.labels
                } else if(data.updated!='moodboard_color_swatch_change' && data.updated!='moodboard_update_arts_embedding'){
                    if(data.position!=undefined){
                        if(arts[data._id]!=undefined){
                            if(data.choosen_by!=this.state.user_id){
                                arts[data._id].position = data.position
                            }
                            
                        }
                    }
                    if(data.choosen_by!=undefined){
                        if(arts[data._id]!=undefined){
                            if(data.choosen_by!=this.state.user_id){
                                arts[data._id].choosen_by = data.choosen_by
                            }
                            
                        }   
                    }
                    if(data.enabled!=undefined){
                        if(arts[data._id]!=undefined){
                            if(arts[data._id].enabled!=true){
                                arts[data._id].enabled = data.enabled
                            }
                            
                        }
                    }
                }else if(data.updated.indexOf('moodboard_update_arts_embedding')!=-1){
                    // TODO
                    arts[data._id]['enabled']=data.enabled
                    
                }else{
                    arts[data._id].file=data.file
                    arts[data._id].color = data.color
                }
                _this.moodboard.setState({arts})
            }
            
        })

        Api.app.service('layers').on('created', (data)=>{
            console.log('layer created', data)
            if(data.board_id==this.state.board_id){
                var layer_dict = _this.sketchpad.state.layer_dict
                // var layers = _this.sketchpad.state.layers
                // var current_layer_id = layers[this.sketchpad.state.current_layer]

                layer_dict[data._id] = data


                
                _this.sketchpad.setState({layer_dict}, function(){

                    var checkExist = setInterval(function(){
                        var el = document.getElementById('sketchpad_canvas_'+data._id)
                        if(el!=null){
                            clearInterval(checkExist)
                            var ctx = el.getContext('2d')
                            var temp_el = document.getElementById('temp_canvas')
                            var temp_ctx = temp_el.getContext('2d')
                            var im = new Image()
                            im.src = data.image
                            im.onload=function(){
                                console.log('first')
                                temp_ctx.drawImage(im, 0,0,1000,1000)
                                ctx.clearRect(0,0,1000,1000)
                                ctx.drawImage(im, 0,0,1000,1000)
                                temp_ctx.clearRect(0,0,1000,1000)
                            }   
                        }
                    },200)  
                })
            }
        })

        Api.app.service('layers').on('patched', data=>{
            console.log(data.updated)
            var updated = data.updated
            var layer_dict = this.sketchpad.state.layer_dict
            if(updated.indexOf('sketchpad_layers_choosen')!=-1){
                layer_dict[data._id].choosen_by = data.choosen_by
                this.sketchpad.setState({layer_dict})
            }
            // else if(updated.indexOf('sketchpad_update_a_layer')!=-1 || updated.indexOf('sketchpad_undo_update_a_layer')!=-1){
                
            //     if(layer_dict[data._id].choosen_by != this.state.user_id || updated.indexOf('sketchpad_undo_update_a_layer')!=-1){
            //         layer_dict[data._id].image = data.image
            //         this.sketchpad.setState({layer_dict}, function(){
            //             var el = document.getElementById('sketchpad_canvas_'+data._id)
            //             var ctx = el.getContext('2d')
            //             var temp_el = document.getElementById('temp_canvas')
            //             var temp_ctx = temp_el.getContext('2d')
            //             var im = new Image()
            //             im.src = data.image
            //             im.onload=function(){
            //                 console.log('first')
            //                 temp_ctx.drawImage(im, 0,0,1000,1000)
            //                 ctx.clearRect(0,0,1000,1000)
            //                 ctx.drawImage(im, 0,0,1000,1000)
            //                 temp_ctx.clearRect(0,0,1000,1000)
            //             }   
            //         })
            //     }
            // }
            else if(updated.indexOf('sketchpad_efficiently_update_a_layer')!=-1 || updated.indexOf('sketchpad_undo_update_a_layer')!=-1){
                
                if(layer_dict[data._id].choosen_by != this.state.user_id || updated.indexOf('sketchpad_undo_update_a_layer')!=-1){
                    var el = document.getElementById('sketchpad_canvas_'+data._id)
                    var ctx = el.getContext('2d')
                    var im = new Image()
                    // console.log(data)
                    im.onload=function(){
                        ctx.clearRect(data.diff_x, data.diff_y, im.width, im.height)
                        ctx.drawImage(im, data.diff_x, data.diff_y, im.width, im.height)
                        layer_dict[data._id].image = el.toDataURL()
                        _this.sketchpad.setState({layer_dict})
                    }
                    im.src = data.diff
                    
                

                    
                }
            }
            else if(updated.indexOf('sketchpad_layer_hide')!=-1 || updated.indexOf('sketchpad_undo_layer_hide')!=-1){
                layer_dict[data._id].hide = data.hide
                this.sketchpad.setState({layer_dict})
            }
        })

        

        Api.app.service('layers').on('removed', (data)=>{
            console.log('layer removed', data)
            if(data.board_id==this.state.board_id){
                var layer_dict = this.sketchpad.state.layer_dict
                var layers = this.sketchpad.state.layers
                var current_layer_id = layers[this.sketchpad.state.current_layer]
                delete layer_dict[data._id]
                console.log(layers.length)
                if(layers.indexOf(data._id)!=-1){
                    layers.splice(layers.indexOf(data._id), 1)
                }
                
                console.log(layers.length)
                var current_layer = layers.indexOf(current_layer_id)
                console.log(current_layer)
                this.sketchpad.setState({layer_dict, layers, current_layer})
            }
        })

        Api.app.service('boards').on('updated',data=>{
            console.log(data)
            var updated = data.updated
            if(updated.indexOf('current_collaborators.')!=-1){
                var current_collaborators = _this.state.current_collaborators
                current_collaborators[updated.split('.')[1]] = data.current_collaborators[updated.split('.')[1]]
                this.setState({current_collaborators})
            }else if(updated.indexOf('current_collaborators_pos')!=-1){
                var current_collaborators = _this.state.current_collaborators
                current_collaborators[updated.split('.')[1]].pos = data.pos//.current_collaborators[updated.split('.')[1]]
                this.setState({current_collaborators})
            }
        })

        Api.app.service('boards').on('patched', data=>{
            var updated = data.updated
            // console.log(data, updated)
            if(updated.indexOf('sketchpad_update_a_layer')!=-1 || updated.indexOf('sketchpad_undo_update_a_layer')!=-1){
                var layers = _this.sketchpad.state.layers
                
                // var sketchundo = _this.sketchpad.state.sketchundo
                // console.log(sketchundo)
                if(updated.indexOf('undo')==-1){
                    // sketchundo.shift();
                    // sketchundo.push(data.sketchundo)
                    this.sketchpad.setState({undoable: data.undoable})
                    
                }else{
                    // var undo_id = updated.split('.')[1] 
                    // var undo_idx =undefined
                    // var undo_obj
                    // for(var i in sketchundo){
                    //     if(sketchundo[i]!=undefined){
                    //         if(sketchundo[i].undo_id==undo_id){
                    //             undo_obj = sketchundo.splice(i, 1)
                    //             console.log('splicaE1')
                    //             break
                    //         }
                    //     }
                    // }
                    console.log('undo here?')
                    var undo_obj = data.sketchundo_send
                    if (undo_obj!=undefined){
                        setTimeout(function(){
                            console.log('here?', undo_obj, _this.state.user_id)
                            if(undo_obj.user_id==_this.state.user_id){
                                console.log(undo_obj.cond)
                                if(undo_obj.cond=='lasso'){
                                    // console.log('this??', _this.sketchpad.state.lasso[0])
                                    _this.sketchpad.setState({lasso:undo_obj.selection, control_state:'area'}, function(){
                                        console.log(_this.sketchpad.state.lasso[0])
                                        Promise.all([
                                            _this.sketchpad.lassoEnd(),
                                            _this.sketchpad.setState({}, function(){
                                                _this.sketchpad.initializeMoveLayer()
                                            }),
                                            _this.sketchpad.setState({control_state: 'move-layer'})
                                        ])
                                    })
                                    
                                }else if(undo_obj.cond=='nonlasso'){
                                    console.log('initialize...')
                                    _this.sketchpad.setState({nonlasso_ret:undo_obj.selection}, function(){
                                        _this.sketchpad.initializeMoveLayer();
                                    })
                                }
                            }

                        }, 100)
                        
                    }
                    // sketchundo.unshift(null)

                    
                }

                // console.log(sketchundo)
                // _this.sketchpad.setState({sketchundo:sketchundo}) 

            }else if(updated.indexOf('sketchpad_add_a_layer')!=-1 || updated.indexOf('sketchpad_remove_a_layer')!=-1 || 
            updated.indexOf('sketchpad_undo_remove_a_layer')!=-1 || updated.indexOf('sketchpad_undo_reorder_a_layer')!=-1){
                var layers = data.layers
                // var sketchundo = _this.sketchpad.state.sketchundo
                var current_layer = _this.sketchpad.state.current_layer
                var undoable = data.undoable
                if(undoable==undefined){
                    undoable = _this.sketchpad.state.undoable
                }
                if(updated.indexOf('undo')==-1){
                    // sketchundo.shift();
                    // sketchundo.push(data.sketchundo)

                    var current_layer_id = _this.sketchpad.state.layers[current_layer]
                    current_layer = layers.indexOf(current_layer_id)
                    
                }else{
                    if(updated.indexOf('sketchpad_undo_reorder_a_layer')!=-1){
                        var layers = data.layers
                        var current_layer_id=undefined
                        if(_this.sketchpad.state.current_layer!=-1){
                            current_layer_id = _this.sketchpad.state.layers[_this.sketchpad.state.current_layer]
                        }
                        var current_layer = 0
                        for(var i in layers){
                            if(layers[i]==current_layer_id){
                                current_layer = i
                            }
                        }
                        if(current_layer_id==undefined){
                            current_layer = -1
                        }
                        console.log(current_layer, layers)
                        _this.sketchpad.setState({layers, current_layer})
                    }
                    
                    // var undo_id = updated.split('.')[2] 
                    // for(var i in sketchundo){
                    //     if(sketchundo[i]!=undefined){
                    //         if(sketchundo[i].undo_id==undo_id){
                    //             sketchundo.splice(i, 1)
                    //             console.log('splicaE1')
                    //             break
                    //         }
                    //     }
                    // }
                    // sketchundo.unshift(null)
                    // if(updated.indexOf('reorder')!=-1){
                    //     for(var i in layers){
                    //         if(_this.sketchpad.state.layer_dict[layers[i]].choosen_by == this.state.user_id){
                    //             current_layer = i
                    //         }
                    //     }
                    // }
                }
                // console.log(sketchundo, layers)
                
                // _this.sketchpad.setState({layers, sketchundo, current_layer}, function(){
                _this.sketchpad.setState({layers, current_layer, undoable}, function(){
                    if(updated.indexOf('sketchpad_undo_remove_a_layer')!=-1){
                        var layer_id = data.updated.split('.')[1]
                        console.log(layer_id)
                        var el = document.getElementById('sketchpad_canvas_'+layer_id)
                        var ctx = el.getContext('2d')
                        var temp_el = document.getElementById('temp_canvas')
                        var temp_ctx = temp_el.getContext('2d')
                        var im = new Image()
                        setTimeout(function(){
                            im.src = _this.sketchpad.state.layer_dict[layer_id].image
                            im.onload=function(){
                                temp_ctx.drawImage(im, 0,0,1000,1000)
                                ctx.clearRect(0,0,1000,1000)
                                ctx.drawImage(im, 0,0,1000,1000)
                                temp_ctx.clearRect(0,0,1000,1000)
                            } 
                        }, 200)
                        
                    }

                      
                })

                if(updated.indexOf('sketchpad_add_a_layer')!=-1 && updated.indexOf('style_stamp')!=-1){
                    console.log('come to here?')
                    var id_inside = updated.split('_')
                    if(id_inside[id_inside.length-1]==this.state.user_id){
                        if(this.sketchpad.stylestampcontroller!=undefined){
                            this.sketchpad.stylestampcontroller.setState({generating:false})
                            if(this.sketchpad.state.control_state=='style-stamp'){
                                // change layer
                                
                                // this.sketchpad.initializeMoveLayer();
                                this.sketchpad.setState({control_state: 'move'})
                                this.moodboard.setState({control_state: 'control_object', action: 'idle'})
                            }   
                            
                        }
                        
                    }
                }
            }else if(updated.indexOf('sketchpad_reorder_layers')!=-1){
                var layers = data.layers
                var current_layer_id=undefined
                if(_this.sketchpad.state.current_layer!=-1){
                    current_layer_id = _this.sketchpad.state.layers[_this.sketchpad.state.current_layer]
                }
                var current_layer = 0
                for(var i in layers){
                    if(layers[i]==current_layer_id){
                        current_layer = i
                    }
                }
                if(current_layer_id==undefined){
                    current_layer = -1
                }
                console.log(current_layer, layers)
                // var sketchundo = _this.sketchpad.state.sketchundo
                // sketchundo.shift();
                // sketchundo.push(data.sketchundo)
                // console.log(sketchundo)
                // _this.sketchpad.setState({layers, current_layer, sketchundo})
                _this.sketchpad.setState({layers, current_layer})
            }else if(updated.indexOf('sketchpad_layers_choosen')!=-1){
                var list = updated.split('.')
                var layers = _this.sketchpad.state.layers
                for(var i in list){
                    if(i==0){continue}
                    var layer_id = list[i]
                    for(var j in layers){
                        if(layers[j].layer_id==layer_id){
                            layers[j].choosen_by = data.layers[j].choosen_by
                        }
                    }
                }
                _this.sketchpad.setState({layers})

            }else if(updated.indexOf('sketchpad_undo_add_a_layer')!=-1){
                var layer_id = updated.split('.')[1]
                var undo_id = updated.split('.')[2]
                // var sketchundo = _this.sketchpad.state.sketchundo
                var layers= _this.sketchpad.state.layers
                var current_layer = _this.sketchpad.state.current_layer
                var control_state = _this.sketchpad.state.control_state
                var layer_idx =undefined
                console.log(current_layer, layers)
                // console.log('do you ever come here?')
                if(current_layer >= layers.length){
                    current_layer = -1
                    control_state = 'move'
                }
                // for(var i in layers){
                //     if(layers[i]==layer_id){
                //         layers.splice(i, 1)
                //         if(current_layer==i){
                //             console.log('???')
                //             current_layer = -1
                //             control_state = 'move'
                //         }
                //         break
                //     }
                // }
                // for(var i in sketchundo){
                //     if(sketchundo[i]!=undefined){
                //         if(sketchundo[i].undo_id==undo_id){
                //             sketchundo.splice(i, 1)
                            
                //             console.log('splicaE1')
                //             break
                //         }
                //     }
                // }
                // sketchundo.unshift(null)
                // _this.sketchpad.setState({layers, sketchundo, current_layer, control_state})
                _this.sketchpad.setState({layers, current_layer, control_state})
            }
            // else if(updated.indexOf('moodboard_add_arts')!=-1){
            //     var arts = data.arts
            //     var art_ids = updated.split('.')
            //     var md_arts = _this.moodboard.state.arts
            //     // var art = arts[art_id]
            //     for(var i in art_ids){
            //         if(i==0){
            //             continue
            //         }
            //         var art = arts[art_ids[i]]
            //         md_arts[art_ids[i]]=art
            //     }
            //     _this.moodboard.setState({arts:md_arts})
            // }
            else if(updated.indexOf('moodboard_add_texts')!=-1){
                var texts = data.texts
                var text_id = updated.split('.')[1]
                var md_texts = _this.moodboard.state.texts
                md_texts[text_id] = texts[text_id]
                _this.moodboard.setState({texts:md_texts})
            }else if(updated.indexOf('moodboard_update_arts_texts')!=-1){
                var texts = data.texts
                console.log('getting...', data)
                var ids = updated.split('.')
                var md_texts = _this.moodboard.state.texts
                // var art = arts[art_id]
                for(var i in ids){
                    if(i==0){
                        continue
                    }
                    if(ids[i].indexOf('text')!=-1){
                        var text_id = ids[i].split('_')[1]
                        var text = texts[text_id]
                        md_texts[text_id].position=text['position']
                        md_texts[text_id].choosen_by=text['choosen_by']
                        md_texts[text_id].fontsize=text['fontsize']
                        md_texts[text_id].text=text['text']
                    }
                    
                }
                _this.moodboard.setState({texts:md_texts})
            }else if(updated.indexOf('moodboard_remove_arts_texts')!=-1){
                var texts = data.texts
                var md_texts = _this.moodboard.state.texts
                for(var key in md_texts){
                    if(texts[key]==undefined){
                        delete md_texts[key]
                    }
                }
                _this.moodboard.setState({texts:md_texts})

            }else if(updated.indexOf('moodboard_edit_text')!=-1){
                var texts = data.texts
                var text_id = updated.split('.')[1]
                var md_texts = _this.moodboard.state.texts
                md_texts[text_id] = texts[text_id]
                _this.moodboard.setState({texts:md_texts})
            }else if(updated.indexOf('moodboard_arts_texts_choosen')!=-1){
                // var arts = data.arts
                var texts = data.texts
                // var md_arts = _this.moodboard.state.arts
                var md_texts = _this.moodboard.state.texts
                var list =updated.split('.')
                for(var i in list){
                    if(i==0){continue}
                    var item = list[i]
                    // if(item.indexOf('art_')!=-1){
                    //     item = item.split('_')[1]
                    //     md_arts[item].choosen_by = arts[item].choosen_by
                    // }else 
                    if(item.indexOf('text_')!=-1){
                        item = item.split('_')[1]
                        if(texts[item]!=undefined && md_texts[item]!=undefined){
                            md_texts[item].choosen_by = texts[item].choosen_by
                        }
                        
                    }
                }
                _this.moodboard.setState({texts:md_texts})
            }else if(updated.indexOf('moodboard_search_pane_toggle')!=-1){
                _this.moodboard.setState({searchPane: data.searchPane})
            }else if(updated.indexOf('moodboard_search_image_select')!=-1){
                _this.moodboard.setState({search_image_selected: data.search_image_selected})
            }else if(updated.indexOf('moodboard_search_slider_change')!=-1){
                _this.moodboard.setState({search_slider_values: data.search_slider_values})
            }else if(updated.indexOf('moodboard_generate_slider_change')!=-1){
                _this.moodboard.setState({generate_slider_values: data.generate_slider_values})
            }else if(updated.indexOf('moodboard_search_slider_distances')!=-1){
                console.log(data.search_slider_distances)
                if(data.search_slider_distances!=undefined){
                    _this.moodboard.setState({search_slider_distances: data.search_slider_distances,
                        generate_slider_values: data.generate_slider_values})
                }else{
                    _this.moodboard.setState({generate_slider_values: data.generate_slider_values})
                }
                
            }else if(updated.indexOf('moodboard_search_mode_toggle')!=-1){
                _this.moodboard.setState({searchMode: data.searchMode})
            }else if(updated.indexOf('moodboard_disagreement_search')!=-1){
                _this.moodboard.setState({agreementPane: data.agreementPane, agreement_userSelection: data.agreement_userSelection})
            }else if(updated.indexOf('moodboard_disagreement_user_selection')!=-1){
                _this.moodboard.setState({agreement_userSelection: data.agreement_userSelection})
            }else if(updated=='moodboard_search_images'||updated=='moodboard_search_similar_images'||updated=='moodboard_search_random_images'||updated=='moodboard_generate_image'){
                _this.moodboard.setState({searching:data.searching})
            }else if(updated=='moodboard_search_done'){
                _this.moodboard.setState({searching:data.searching})
            }else if(updated=='group_updating'){
                _this.moodboard.setState({group_updating:data.group_updating})
            }else if(updated=='sketchpad_undoable'){
                _this.sketchpad.setState({undoable: data.undoable, sketchundo:data.sketchundo})
            }else if(updated.indexOf('sketchpad_undo_start')!=-1){
                _this.sketchpad.setState({undoable: data.undoable})
            }else if(updated.indexOf('labelAllImages')!=-1){
                var labels = data.labels
                var arts = _this.moodboard.state.arts
                console.log(arts, labels)
                for(var i in labels){
                    if(arts[i]!=undefined){
                        arts[i].labels = labels[i]
                    }
                    
                }
            }else if(updated.indexOf('moodboard_search_scroll')!=-1){
                var search_scroll = data.search_scroll
                var md_search = document.getElementById('moodboard_searched_results')
                if(md_search!=undefined){
                    md_search.scrollTop= md_search.scrollHeight*search_scroll
                }
            }
        })

        window.addEventListener("beforeunload", function (e) {
            _this.updateCollaboratorStatus(false);
          
            // (e || window.event).returnValue = null;
            // return null;
          });
    }///////

    loadALayer(layer){
        var el = document.getElementById('sketchpad_canvas_'+layer._id)
        if(el==undefined){
            return
        }
        var ctx = el.getContext('2d')
        var im = new Image()
        im.src = layer.image
        
        im.onload=function(){
            ctx.drawImage(im, 0,0,1000,1000)
        }  

    }

    updateALayerImage(layer_idx, layer_id, image, origin_image, cond='', selection=undefined){
        console.log('yaeh', cond, selection)
        var set = {}
        this.sketchpad.state.layer_dict[layer_id].image = image
        set['image'] = image
        set['updated'] = 'sketchpad_update_a_layer'
        
        var undo_id = Math.random().toString(36).substring(2, 15)
        var set2={}
        set2['updated'] = 'sketchpad_update_a_layer'
        set2['$push']  = {
            sketchundo: {undo_id, user_id: this.state.user_id, type: 'layer_image', layer_id: layer_id}
        }
        set2['undoable']=false

        var sketchundo = {
            _id: undo_id, 
            user_id: this.state.user_id,
            // type:'layer_image', 
            // layer_id: layer_id,
            // board_id: this.state.board_id, 
            // layer_image: origin_image,
            cond: cond,
            selection: selection
        }

        console.log(image.data)

        set['sketchundo'] =sketchundo

        Api.app.service('batch').create({calls: [
            ['patch', 'layers', layer_id, {$set:set}],
            ['patch', 'boards', this.state.board_id, set2],
            // ['create', 'sketchundos', sketchundo]
        ]})

        // Api.app.service('boards').patch(this.state.board_id, set2).then(()=>{
        //     Api.app.service('layers').patch(layer_id, {$set:set}).then(()=>{
        //         Api.app.service('sketchundos').create(sketchundo)
        //     })
        // })

        // Api.app.service('layers').patch(layer_id, {$set: set}).then(()=>{
        //     Api.app.service('boards').patch(this.state.board_id, set2).then(()=>{
        //     })
        // })
        
    }

    AddALayer(layer_idx, layer_id, layer){
        var set = {}
        layer.updated = 'sketchpad_add_a_layer'
        set['undoable']=false
        set['layers.'+layer_idx] = layer_id
        set['updated'] = 'sketchpad_add_a_layer'
        var undo_id = Math.random().toString(36).substring(2, 15)
        set['$push'] = {
            sketchundo: {undo_id, user_id: this.state.user_id, type: 'layer_add', layer_id: layer_id}
        }
        var sketchundo = {
            _id: undo_id, 
            user_id: this.state.user_id,
            board_id: this.state.board_id,
            type: 'layer_add',
            layer_idx: layer_idx,
            layer_id: layer_id,
            layer: layer
        }
        // analytics.logEvent("add_a_layer", {board_id: this.state.board_id, user_id:this.state.user_id, layer_id})
        Api.app.service('batch').create({calls: [
            ['create', 'layers', layer],
            ['patch', 'boards', this.state.board_id, set],
            ['create', 'sketchundos', sketchundo]
        ]})
        // Api.app.service('layers').create(layer).then(()=>{
        //     Api.app.service('boards').patch(this.state.board_id, set).then(()=>{
        //         Api.app.service('sketchundos').create(sketchundo)
        //     })
        // })
        // Api.app.service('layers').create(layer).then(()=>{
        //     Api.app.service('boards').patch(this.state.board_id, set).then(()=>{
        //     })
        // })

        
    }

    RemoveALayer(layer_idx, layer, layers){
        var _this = this
        var set={}
        // var layers = _this.sketchpad.state.layers.slice()
        console.log(layers)
        set['updated'] = 'sketchpad_remove_a_layer'
        set['undoable']=false
        set['layers'] =  _this.sketchpad.state.layers.slice()
        console.log(layers)
        // layer = JSON.parse(JSON.stringify(layer))
        layer.choosen_by=''
        var undo_id = Math.random().toString(36).substring(2, 15)
        var push = {
            sketchundo: {undo_id, user_id:this.state.user_id, type: 'layer_remove', layer_id: layer._id,}
        }
        var sketchundo = {
                _id: undo_id, 
                board_id: this.state.board_id,
                user_id: this.state.user_id,
                type: 'layer_remove',
                layer_idx: layer_idx,
                layer_id: layer._id,
                layer: layer,
                layers: layers
            }
        
        Api.app.service('boards').patch(this.state.board_id, {$set: set, $push: push}).then(()=>{
            Api.app.service('layers').remove(layer._id).then(()=>{
                // Api.app.service('sketchundos').create(sketchundo)
            })

        })
        
        // Api.app.service('layers').remove(layer._id).then(()=>{
        //     Api.app.service('boards').patch(this.state.board_id, {$set: set, $push: push}).then(()=>{
        //     })
        // })
        
    }

    ReorderLayers(new_layer, prev_layer){
        var _this = this
        var patch={}
        patch['layers']=new_layer
        patch['updated']='sketchpad_reorder_layers'
        patch['undoable']=false
        var undo_id = Math.random().toString(36).substring(2, 15)
        patch['$push'] = {
            sketchundo: {undo_id, user_id: this.state.user_id, type: 'layer_reorder', layers: prev_layer}
        }
        var sketchundo = {
            _id: undo_id, 
            user_id: this.state.user_id,
            type: 'layer_reorder',
            board_id: this.state.board_id,
            layers: prev_layer
        }
        Api.app.service('boards').patch(this.state.board_id, patch).then(()=>{
            // Api.app.service('sketchundos').create(sketchundo)
        })
    }

    ToggleHideLayer(layer_id, hide){
        var set={
            updated: 'sketchpad_layer_hide',
            hide: hide
        }

        var set2 = {
            updated: 'sketchpad_remove_a_layer',
            undoable: false,

        }
        var undo_id = Math.random().toString(36).substring(2, 15)
        set2['$push'] = {
            sketchundo: {undo_id, user_id: this.state.user_id, type: 'layer_hide', layer_id: layer_id}
        }
        var sketchundo = {
            _id: undo_id, 
            user_id: this.state.user_id,
            type: 'layer_hide',
            board_id: this.state.board_id,
            hide: !hide,
            layer_id: layer_id
        }
        Api.app.service('boards').patch(this.state.board_id, set2).then(()=>{
            Api.app.service('layers').patch(layer_id, {$set: set}).then(()=>{
                // Api.app.service('sketchundos').create(sketchundo)
            })
        })
        
        // .then(()=>{
        //     Api.app.service('boards').patch(this.state.board_id, set2).then(()=>{
        //         Api.app.service('boards').patch(this.state.board_id, {$set: {updated: 'sketchpad_undoupdate'}, $pop: {sketchundo: -1}})
        //     })
        // })
    }

    SketchUndo(idx, undo_obj){

        var set = {
            $pull: {sketchundo: {
                undo_id: undo_obj['undo_id']
            }}
        }
        var set2 = {}
        set2['updated']='sketchpad_undoupdate'
        set2['$push']={
            sketchundo: {
                $each: [null], 
                $position: 0,
            }
        }
        var _this = this
        if(undo_obj.type=='layer_image'){
            set['updated'] = 'sketchpad_undo_update_a_layer.'+undo_obj.undo_id
            var set3 = {}
            set3['updated'] = 'sketchpad_undo_update_a_layer'
            set3['image'] = undo_obj.layer_image
            Api.app.service('layers').patch(undo_obj.layer_id, {$set:set3}).then(()=>{
                Api.app.service('boards').patch(this.state.board_id, set).then(()=>{    
                    Api.app.service('boards').patch(this.state.board_id, set2)
                })
            })
            // if(undo_obj.cond=='lasso'){
            //     _this.sketchpad.setState({lasso:undo_obj.selection}, function(){
            //         Promise.all([_this.sketchpad.lassoEnd(),
            //         _this.sketchpad.initializeMoveLayer()])
            //     })
            // }else if(undo_obj.cond=='nonlasso'){
            //     _this.sketchpad.setState({nonlasso_ret:undo_obj.selection}, function(){
            //         _this.sketchpad.initializeMoveLayer();
            //     })
            // }
            
        }else if(undo_obj.type=='layer_add'){
            set['updated'] = 'sketchpad_undo_add_a_layer.'+undo_obj.layer_id+'.'+undo_obj.undo_id
           var layers = _this.sketchpad.state.layers.slice()
            var idx=-1
            for(var i in layers){
                if(layers[i]==undo_obj.layer_id){
                    idx=i
                    break
                }
            }
            if(idx>=0){
                set['$pull']['layers'] = undo_obj.layer_id
            } 
            Api.app.service('layers').remove(layers[idx]).then(()=>{
                Api.app.service('boards').patch(this.state.board_id, set).then(()=>{
                    Api.app.service('boards').patch(this.state.board_id, set2)
                })
            })
        }else if(undo_obj.type=='layer_remove'){
            set['updated'] = 'sketchpad_undo_remove_a_layer.'+undo_obj.layer_id+'.'+undo_obj.undo_id
            set['layers'] = undo_obj.layers
            var set3 = undo_obj.layer
            set3['updated']='sketchpad_undo_remove_a_layer'
            console.log(set, set2)
            Api.app.service('layers').create(set3).then(()=>{
                Api.app.service('boards').patch(this.state.board_id, set).then(()=>{
                    Api.app.service('boards').patch(this.state.board_id, set2)
                })
            })
            
        }else if(undo_obj.type=='layer_reorder'){
            set['updated'] = 'sketchpad_undo_reorder_a_layer..'+undo_obj.undo_id
            var layers = _this.sketchpad.state.layers.slice()
            var undo_layer = undo_obj.layers.slice()
            // for(var i in layers){
            //     for(var j in undo_layer){
            //         if(layers[i].layer_id==undo_layer[j].layer_id){
            //             undo_layer[j].choosen_by = layers[i].choosen_by
            //         }
            //     }
            // }
            set['layers'] = undo_obj.layers
            Api.app.service('boards').patch(this.state.board_id, set).then(()=>{
                Api.app.service('boards').patch(this.state.board_id, set2)
            })
            // TODO (also in channel and onpatch)
        }

        
    }

    AddArts(arts, art_ids){
        
        for(var i in art_ids){
            var create = arts[i]
            // console.log(arts)
            create['_id']=art_ids[i]
            create['updated'] = 'moodboard_add_arts'
            create['board_id'] = this.state.board_id
            // patch['updated'] = patch['updated']+'.'+art_ids[i]
            
            // analytics.logEvent("add_an_art", {board_id: this.state.board_id, user_id:this.state.user_id, art_id:art_ids[i]})
            Api.app.service('arts').create(create)
            .then(()=>{
                // Api.app.service('event_logs').create({event: 'add_an_art', board_id: this.state.board_id, user_id:this.state.user_id, art_id:art_ids[i]})
            })
        }
        
        // Api.app.service('boards').patch(this.state.board_id, {$set:patch})

    }

    UpdateArtsTexts(arts, art_ids, texts, text_ids, function2=undefined, function2_params=undefined){
        var patch = {}
        patch['updated'] = 'moodboard_update_arts_texts'
        
        for(var i in art_ids){
            var art = {}
            art['updated'] = 'moodboard_update_arts_texts'
            art['position'] = arts[i].position
            // patch['updated'] = patch['updated']+'.art_'+art_ids[i]
            Api.app.service('arts').patch(art_ids[i], {$set:art})
        }
        for(var i in text_ids){
            patch['texts.'+text_ids[i]+'.position'] = texts[i].position
            patch['texts.'+text_ids[i]+'.fontsize'] = texts[i].fontsize
            patch['texts.'+text_ids[i]+'.ratio'] = texts[i].ratio
            patch['texts.'+text_ids[i]+'.text'] = texts[i].text
            patch['updated'] = patch['updated']+'.text_'+text_ids[i]
        }
        var _this = this
        console.log(patch)
        if(Object.keys(patch).length>1){
            console.log('patched')
            Api.app.service('boards').patch(this.state.board_id, {$set:patch})
            .then(()=>{
                
                if(function2!=undefined){
                    function2(function2_params[0], function2_params[1], function2_params[2], function2_params[3], _this)
                }
            })
        }
        
        

    }


    RemoveArtsTexts(arts, texts){
        console.log(arts, texts)
        var unset = {}
        for(var i in arts){
            
            // analytics.logEvent("remove_an_art", {board_id: this.state.board_id, user_id:this.state.user_id, art_id:arts[i]})
            Api.app.service('arts').remove(arts[i])
            .then(()=>{
                // Api.app.service('event_logs').create({event:'remove_an_art', board_id: this.state.board_id, user_id:this.state.user_id, art_id:arts[i]})
            })
        }
        for(var i in texts){
            unset['texts.'+texts[i]]=1
        }
        var set={}
        set['updated'] = 'moodboard_remove_arts_texts'
        if(Object.keys(unset).length>0){
            Api.app.service('boards').patch(this.state.board_id, {$unset: unset, $set: set})
        }
    }

    AddAText(text_id, text){
        var patch = {}
        patch['updated'] = 'moodboard_add_texts.'+text_id
        patch['texts.'+text_id] = text
        
        Api.app.service('boards').patch(this.state.board_id, {$set:patch})
    }

    UpdateAText(text_id, new_text){
        var patch= {}
        patch['updated'] ='moodboard_edit_text.'+text_id
        patch['texts.'+text_id] = new_text
        Api.app.service('boards').patch(this.state.board_id, {$set:patch})
    }

    ChooseArtsTexts(art_ids, text_ids, d_art_ids, d_text_ids, sub_this = undefined){
        var _this
        if(sub_this!=undefined){
            _this = sub_this
        }else{
            _this = this
        }
        // console.log('chooseartstexts', art_ids)
        var patch={}
        var arts = _this.moodboard.state.arts
        patch['updated'] = 'moodboard_arts_texts_choosen'
        var unset={}
        // for(var i in art_ids){
        //     var art_id = art_ids[i]
        //     // arts[art_id].choosen_by=this.state.user_id
        //     Api.app.service('arts').patch(art_id, {$set:{choosen_by: this.state.user_id, updated:'moodboard_arts_texts_choosen'}})
        // }
        Api.app.service('arts').patch(null, {$set:{choosen_by: _this.state.user_id, updated:'moodboard_arts_texts_choosen'}}, {query: {_id: {$in: art_ids}}})
        for (var i in text_ids){
            var text_id = text_ids[i]
            patch['updated'] = patch['updated']+'.text_'+text_id
            patch['texts.'+text_id+'.choosen_by'] = _this.state.user_id
        }
        for(var i in d_art_ids){
            var art_id = d_art_ids[i]
            arts[art_id].choosen_by=''
        //     Api.app.service('arts').patch(art_id, {$set:{choosen_by: '', updated: 'moodboard_arts_texts_choosen'}})
        }
        console.log(d_art_ids)
        Api.app.service('arts').patch(null, {$set:{choosen_by: '', updated:'moodboard_arts_texts_choosen'}}, {query: {_id: {$in: d_art_ids}}})
        for (var i in d_text_ids){
            var text_id = d_text_ids[i]
            patch['updated'] = patch['updated']+'.text_'+text_id
            patch['texts.'+text_id+'.choosen_by'] = ''
        }
        console.log(patch)
        if(Object.keys(patch).length>1){
            Api.app.service('boards').patch(_this.state.board_id, {$set:patch})
        }   

        // this.moodboard.setState({arts:arts})
    }

    ChooseLayers(layer_idxs, d_layer_idxs){
        var layers = this.sketchpad.state.layers.slice()
        // console.log(layer_idxs, d_layer_idxs)
        var layer_dict = this.sketchpad.state.layer_dict
        for(var i in layer_idxs){
            var patch={}
            patch['updated'] = 'sketchpad_layers_choosen'
            var layer_id = layer_idxs[i]
            patch['choosen_by']=this.state.user_id
            console.log('layer id is.... ' ,layer_id)
            layer_dict[layer_id].choosen_by = this.state.user_id
            Api.app.service('layers').patch(layer_id, {$set:patch})
        }
        for(var i in d_layer_idxs){
            var patch={}
            patch['updated'] = 'sketchpad_layers_choosen'
            var layer_id = d_layer_idxs[i]
            patch['choosen_by']=''
            layer_dict[layer_id].choosen_by = ''
            Api.app.service('layers').patch(layer_id, {$set:patch})
        }
        this.sketchpad.setState({layer_dict})
    }


    updateCollaboratorStatus(tf){
        // var pull = {}
        // pull['current_collaborators.'+user_id] = current_collaborators[user_id]
        // unset everyithing that are selected
        var noone=true
        console.log(this.state.current_collaborators)
        for(var _id in this.state.current_collaborators){
            if(this.state.current_collaborators[_id].active && _id!=this.state.user_id){
                noone=false
            }
        }
        console.log(Object.keys(this.state.current_collaborators).length)
        if(noone==false){
            // this.ChooseArtsTexts([],[],Object.keys(this.moodboard.state.arts), Object.keys(this.moodboard.state.texts))
            this.ChooseArtsTexts([],[], this.moodboard.state.current_image.slice(0), this.moodboard.state.current_text.slice(0))
            if(this.sketchpad.state.current_layer!=-1){
                this.ChooseLayers([],[this.sketchpad.state.layers[this.sketchpad.state.current_layer]])
            }
        }else{
            this.ChooseArtsTexts([],[],Object.keys(this.moodboard.state.arts), Object.keys(this.moodboard.state.texts))
            this.ChooseLayers([],this.sketchpad.layers)
            
        }
        
        
        var set = {}
        set['current_collaborators.'+this.state.user_id+'.active'] = tf
        set['updated'] = 'current_collaborators.'+this.state.user_id
        // console.log('leaaave', this.state.board_id, pull)
        Api.app.service('boards').update(this.state.board_id, {$set: set})
        
    }

    addSketchIntoMoodboard(e){
        e.stopPropagation();
        var _this = this
        var output_el= document.createElement('canvas')
        output_el.width = 512
        output_el.height = 512
        var output_canvas = output_el.getContext('2d')
        output_canvas.globalCompositeOperation = 'destination-over'

        console.log(this.sketchpad.state.layers)
        for(var i in this.sketchpad.state.layers){
            var key = this.sketchpad.state.layers[i]
            if(this.sketchpad.state.layer_dict[key].hide!=true){
                var el = document.getElementById('sketchpad_canvas_'+key)
                var cur_canvas = el.getContext('2d')
                output_canvas.drawImage(el, 0, 0, 512,512);
            }
            
        }
        output_canvas.fillStyle = 'white'
        output_canvas.fillRect(0, 0, 512, 512);
        console.log('sketch image generated')

        var image = output_el.toDataURL()
        var arts =this.moodboard.state.arts
        var id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

        var pos = this.moodboard.getPositionOnBoard(0, document.getElementById('moodboard').offsetHeight/2, true)
        var pos0 = Math.max(pos[0], 0)
        
        for(var i in this.moodboard.state.current_image){
            arts[this.moodboard.state.current_image[i]].choosen_by=''
        }
        

        console.log(pos0, pos)
        arts[id] = {
            file: image,
            position: [pos0, pos[1]-0.05, pos0+0.1,pos[1]+0.05],
            ratio: 1,
            choosen_by: this.state.user_id,
            width: 512,
            height: 512,
        }


        Promise.all([
            _this.ChooseArtsTexts([],[],_this.moodboard.state.current_image, _this.moodboard.state.current_text),
            _this.AddArts([arts[id]],[id]),
            _this.moodboard.setState({arts:arts, control_state:'control_object', action:'idle', current_image: [id], current_text:[], 
            current_selected_pos: [pos0, pos[1]-0.05, pos0+0.1,pos[1]+0.05], current_selected_ratio: 1})
        ])

    }


    gup( name, url ) {
        if (!url) url = location.href;
        name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
        var regexS = "[\\?&]"+name+"=([^&#]*)";
        var regex = new RegExp( regexS );
        var results = regex.exec( url );
        return results == null ? null : results[1];
    }

    setMoodboardPosition(x, y){
        // if(new Date()-this.state.lastmouseupdate>500){
            var current_collaborators = this.state.current_collaborators
            // console.log(this.state.user_id)
            var now = new Date()
            current_collaborators[this.state.user_id]['moodboard_pos'] = [x, y, now]
            var set = {}
            var _this = this
            set['current_collaborators.'+this.state.user_id+'.moodboard_pos'] = [x, y, now]
            set['updated']='current_collaborators_moodboard_pos.'+this.state.user_id
            // console.log('running?')
            Api.app.service('boards').update(this.state.board_id, {$set: set, })
            .then(()=>{
                _this.setState({current_collaborators})
            })
        // }
        
    }

    renderCollaboratorsOnMoodBoard(){
        return Object.keys(this.state.current_collaborators).map((current_collaborator, idx)=>{
            if(current_collaborator!=this.state.user_id && this.state.current_collaborators[current_collaborator]!=undefined){
                var moodboard_pos = this.state.current_collaborators[current_collaborator].moodboard_pos
                // console.log(moodboard_pos)
                if(moodboard_pos[0]>=0 && moodboard_pos[1]>=0){
                    var name = this.state.collaborator_dict[current_collaborator]['email'].split('@')[0]
                    name = name.substring(0,3)
                    return (<div className='collaboratorCursor' style={{left: moodboard_pos[0]*this.moodboard.state.boardzoom*this.moodboard.state.boardlength, 
                        top: moodboard_pos[1]*this.moodboard.state.boardzoom*this.moodboard.state.boardlength, 
                        color:this.state.collaborator_dict[current_collaborator]['color']}}>
                            <span style={{fontSize:20}}><i className={"fas fa-mouse-pointer"}></i></span>
                            <span style={{border: 'solid 2px '+this.state.collaborator_dict[current_collaborator]['color'],color:'black', backgroundColor:'white', borderRadius: '3px'}}>{name}</span>
                        </div>)
                }
                
            }
            
        })
    }

    setSketchpadPosition(x, y){
        // if(new Date()-this.state.lastmouseupdate>500){
            var current_collaborators = this.state.current_collaborators
            // console.log(this.state.user_id)
            // var now = new Date()
            // current_collaborators[this.state.user_id]['sketch_pos'] = [x, y]
            var set = {}
            var _this = this
            set['current_collaborators.'+this.state.user_id+'.sketch_pos'] = [x, y]
            set['updated']='current_collaborators_sketch_pos.'+this.state.user_id
            // console.log('running?')
            Api.app.service('boards').update(this.state.board_id, {$set: set, })
            .then(()=>{
                _this.setState({current_collaborators})
            })
        // }
        
    }

    renderCollaboartorStatus(){
        return Object.keys(this.state.current_collaborators).map((col, idx)=>{
            if(this.state.collaborator_dict[col]!=undefined||col==this.state.user_id){
                if(this.state.current_collaborators[col].active){
                    var name, color
                    if(col==this.state.user_id){
                        return
                    }
                    if(col!=this.state.user_id){
                        name = this.state.collaborator_dict[col]['email'].split('@')[0]
                        name = name.substring(0,3)
                        color = this.state.collaborator_dict[col].color
                    }else{
                        name = this.state.user_email.split('@')[0].substring(0,3)
                        color = 'black'
                    }
                    
                    var placement_idx = idx
                    if(idx>Object.keys(this.state.current_collaborators).indexOf(this.state.user_id)){
                        placement_idx = placement_idx-1
                    }else if(col==this.state.user_id){
                        placement_idx = 0
                    }

                    var zIndex = 0
                    if(col==this.state.user_id){
                        zIndex= 1
                    }
                    
                    return (<div key={'collaborator_indicator_'+col} style={{position:'absolute', right: placement_idx*40, border: 'solid 4px '+color, backgroundColor:'white',
                    width: 50, height: 50, borderRadius:'50%', textAlign: 'center', lineHeight:'40px', zIndex: zIndex}}>{name}</div>)
                }
            }
        })
    }

    renderCollaboratorsOnSketchpad(){
        return Object.keys(this.state.current_collaborators).map((current_collaborator, idx)=>{
            if(current_collaborator!=this.state.user_id && this.state.current_collaborators[current_collaborator]!=undefined){
                var sketch_pos = this.state.current_collaborators[current_collaborator].sketch_pos
                // console.log(moodboard_pos)
                if(sketch_pos[0]>=0 && sketch_pos[1]>=0){
                    var name = this.state.collaborator_dict[current_collaborator]['email'].split('@')[0]
                    name = name.substring(0,3)
                    return (<div key={'sketchpad_collaborator_'+current_collaborator} className='collaboratorCursor' style={{left: sketch_pos[0]/1000*this.sketchpad.state.boardzoom*this.sketchpad.state.boardlength, 
                        top: sketch_pos[1]/1000*this.sketchpad.state.boardzoom*this.sketchpad.state.boardlength, 
                        color:this.state.collaborator_dict[current_collaborator]['color']}}>
                            <span style={{fontSize:20}}><i className={"fas fa-mouse-pointer"}></i></span>
                            <span style={{border: 'solid 2px '+this.state.collaborator_dict[current_collaborator]['color'],color:'black', backgroundColor:'white', borderRadius: '3px'}}>{name}</span>
                        </div>)
                }
                
            }
            
        })
    }

    setmb(el){
        console.log('setting ref to ',el)
        this.moodboard=el
    }

    handleMouseUp(e){
        if(this.moodboard.state.action!='idle'){
            this.moodboard.moodBoardMouseEnd(e)
        }else if(this.sketchpad.state.action!='idle'){
            this.sketchpad.sketchPadMouseMoveEnd(e)
        }
    }


    render(){
        return (
        <div id='board_whole' style={{flex: 'auto', width: '100%', position:'relative'}} className='row' onPointerUp={this.handleMouseUp.bind(this)}>

            <SketchPad board_this={this} board_state={this.state} ref={c => this.sketchpad=c}></SketchPad>
            <MoodBoard board_this={this} board_state={this.state} ref={c => this.moodboard=c}></MoodBoard>
            <div style={{position:'absolute', right: (this.state.moodboard_collapsed&&this.state.sketchpad_collapsed==false)?'40px':'10px', top: '10px'}}>
                {this.renderCollaboartorStatus()}
            </div>
            <div style={{position:'absolute', left: 'calc(50% - 30px)', top: 'calc(50% + 38px)', 
            width:'60px', height:'60px', borderRadius: '50%', backgroundColor: '#333333',
            color: 'white', textAlign:'center', fontSize: '40px', cursor:'default', display: (this.state.moodboard_collapsed==false && this.state.sketchpad_collapsed==false)?'':'none'}} onPointerDown={this.addSketchIntoMoodboard.bind(this)}>
                →
            </div>
            {this.state.loaded==false && <div style={{position: 'absolute', width: '100%', height: '100%', backgroundColor:'white', textAlign:'center', paddingTop: window.outerHeight/2-10}}>
                    <div>Page is being loaded...</div>
                    <div>
                        {this.state.board_loaded==true&&<span>●</span>}{this.state.board_loaded!=true&&<span>○</span>}
                        {this.state.layers_loaded==true&&<span>●</span>}{this.state.layers_loaded!=true&&<span>○</span>}
                        {this.state.arts_loaded==true&&<span>●</span>}{this.state.arts_loaded!=true&&<span>○</span>}
                    </div>
                </div>}
        </div>)
    }
}

export default Board