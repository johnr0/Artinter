import React from 'react';
import Api from '../../middleware/api';
import MoodboardImage from './moodboard_image'

class MoodboardImageAI extends MoodboardImage{

    // toggleInclusion(group_key, add, e){
    //     e.stopPropagation();
    //     e.preventDefault()
    //     var art_key = this.props.art_key
    //     var group = this.props.mother_state.groups[group_key]
    //     var user_id = this.props.mother_this.props.board_this.state.user_id
    //     if(group.user_info[user_id]==undefined){
    //         var set = {}
    //         set['user_info.'+user_id] = {arts: [art_key], updated: 'groups_toggle_inclusion'}
    //         Api.app.service('groups').patch(group_key, {$set: set})
    //     }else{
    //         if(add){
    //             var push = {}
    //             push['user_info.'+user_id+'.arts']=art_key
    //             Api.app.service('groups').patch(group_key, {$set: {updated:'groups_toggle_inclusion'}, $push:push})
    //         }else{
    //             var pull = {}
    //             pull['user_info.'+user_id+'.arts']=art_key
    //             Api.app.service('groups').patch(group_key, {$set: {updated:'groups_toggle_inclusion'}, $pull:pull})
    //         }

    //     }
        

    // }


    deselectAnImage(){
        var arts = this.props.mother_state.arts
        if(arts[this.props.art_key].choosen_by==this.props.mother_this.props.board_this.state.user_id){
            var pos = [Number.MAX_VALUE, Number.MAX_VALUE, Number.MIN_VALUE, Number.MIN_VALUE]
            var current_image = this.props.mother_state.current_image

            current_image.splice(current_image.indexOf(this.props.art_key), 1)
            var _this = this
            for (var i in current_image){
                var key = current_image[i]
                var cur_pos = arts[key].position.slice()
                if(cur_pos[0]<pos[0]){
                    pos[0] = cur_pos[0]    
                }
                if(cur_pos[1]<pos[1]){
                    pos[1] = cur_pos[1]    
                }
                if(cur_pos[2]>pos[2]){
                    pos[2] = cur_pos[2]    
                }
                if(cur_pos[3]>pos[3]){
                    pos[3] = cur_pos[3]    
                }
            }
            arts[this.props.art_key].choosen_by = ''
            var ratio = (pos[2]-pos[0])/(pos[3]-pos[1])
            this.props.mother_this.setState({arts})
            Promise.all([
                this.props.mother_this.props.board_this.ChooseArtsTexts([],[], [this.props.art_key],[]),
                this.props.mother_this.setState({current_image:current_image, current_selected_pos: pos, current_selected_ratio: ratio}, function(){
                    _this.props.mother_this.props.board_this.sketchpad.setState({})
                })
            ])
        }
    }

    choose_image(down,e){
        // console.log(this.props.art.enabled, down)
        // console.log('choooose imaaaage')
        if(this.props.mother_state.control_state!='style-stamp'){
            super.choose_image(e)
        }
        
        var ecopied = {pageX: e.pageX, pageY: e.pageY}
        if(this.props.mother_state.control_state=='search_image_select'){
            if(this.props.art.enabled){
                Api.app.service('boards').patch(this.props.mother_this.props.board_this.state.board_id, {$set: {search_image_selected: this.props.art_key, updated:'moodboard_search_image_select'}})
                this.props.mother_this.setState({control_state: 'control_object', search_image_selected: this.props.art_key})
            }
        }else if(this.props.mother_state.control_state=='style-stamp' && down==false){
            if(this.props.art.enabled){
                console.log(this.props.mother_state.current_image, this.props.art_key)
                if(this.props.mother_state.current_image.indexOf(this.props.art_key)==-1){
                    if(this.props.mother_state.current_image.length==0 && this.props.mother_state.current_text.length==0){
                        this.select_new_image(false, ecopied)
                    }else if(this.props.mother_state.shift_down==false){
                        this.select_new_image(false, ecopied)
                    }else{
                        this.add_an_image(false, ecopied)
                    }
                }else{
                    console.log('heh?')
                    this.deselectAnImage()
                }
            }   
            
            
        }
        
    }

    style_choose_image(e){
        
        var ecopied = {pageX: e.pageX, pageY: e.pageY}
        console.log(this.props.mother_state.control_state, this.props.art_enabled)
        super.object_moving_end(e);
        if(this.props.art.enabled && this.props.mother_state.control_state=='style-stamp'){
            e.stopPropagation()
            console.log('style choose image')
            if(this.props.mother_state.current_image.indexOf(this.props.art_key)==-1){
                if(this.props.mother_state.current_image.length==0 && this.props.mother_state.current_text.length==0){
                    this.select_new_image(false, ecopied)
                }else if(this.props.mother_state.shift_down==false){
                    this.select_new_image(false, ecopied)
                }else{
                    this.add_an_image(false, ecopied)
                }
            }
        }
    }

    renderUsers(group_key, x, y, width){
        var group= this.props.mother_state.groups[group_key]
        var user_keys = []
        for(var uk in group.user_info){
            var user_info = group.user_info[uk]
            // console.log(user_info.arts, this.props.art_key)
            if(user_info.arts.indexOf(this.props.art_key)!=-1){
                user_keys.push(uk)
            }
        }
        var collaborators = Object.keys(this.props.mother_this.props.board_this.state.collaborator_dict)
        // collaborators.push(this.props.mother_this.props.board_this.state.board_owner)
        // console.log(user_keys, collaborators)
        var renderWidth = Math.min(20, width/10)

        return collaborators.map((uk, idx)=>{
                var color
                if(this.props.mother_this.props.board_this.state.collaborator_dict[uk]!=undefined){
                    color=this.props.mother_this.props.board_this.state.collaborator_dict[uk].color
                    if(user_keys.indexOf(uk)!=-1){
                        return (<g>
                            <circle cx={x+idx*renderWidth+renderWidth/2} cy={y+renderWidth/2} r={renderWidth/2}
                            fill={this.props.mother_this.props.board_this.state.collaborator_dict[uk].color} stroke='white'></circle>
                        </g>)
                    }else{
                        return (<g>
                            <circle cx={x+idx*renderWidth+renderWidth/2} cy={y+renderWidth/2} r={renderWidth/2}
                            stroke={this.props.mother_this.props.board_this.state.collaborator_dict[uk].color} fill='white'></circle>
                        </g>)
                    }
                    
                }
                
            
        })
    }

    // selectArtForLabel(){
    //     if(this.props.mother_state.label_art!=undefined){
    //         this.props.mother_this.setState({label_art: undefined})
    //     }else{
    //         this.props.mother_this.setState({label_art: this.props.art.id})
    //     }
        
    // }

    renderLSigs(x, y, width, group){
        var renderWidth = 10//Math.min(20, width/10)
        if(this.props.art.labels!=undefined){
            if(this.props.art.labels[group._id]!=undefined){
                renderWidth = renderWidth*this.props.art.labels[group._id]
                renderWidth = (renderWidth>20)?20:renderWidth
                return (<g>
                    <circle cx={x} cy={y-3*renderWidth/4} r={renderWidth/2} fill={group.higher_group} strokeWidth='2' stroke='white'></circle>
                </g>)
            }
        }
        
        
    }

    renderLabels(x, y){
        return (<g>
            <foreignObject x={x} y={y} width='200' height='200'>
                <div className='controller' style={{height: '100%'}}></div>
            </foreignObject>
        </g>)
    }

    labelOn(){
        if(this.props.mother_state.current_image.length==1 && this.props.mother_state.current_text.length==0){
            this.props.mother_this.setState({label_art: this.props.mother_state.current_image[0]})
        }
    }

    labelOut(){
        this.props.mother_this.setState({label_art:undefined})
    }
    
    render(){
        var smallx = (this.props.art.position[0]<this.props.art.position[2])?this.props.art.position[0]:this.props.art.position[2]
        var bigx = (this.props.art.position[0]>this.props.art.position[2])?this.props.art.position[0]:this.props.art.position[2]
        var smally = (this.props.art.position[1]<this.props.art.position[3])?this.props.art.position[1]:this.props.art.position[3]
        var bigy = (this.props.art.position[1]>this.props.art.position[3])?this.props.art.position[1]:this.props.art.position[3]
        var x = smallx* this.props.boardlength
        var y = smally* this.props.boardlength
        var x2 = bigx * this.props.boardlength
        var y2 = bigy * this.props.boardlength

        var width = (bigx-smallx)* this.props.boardlength
        var height = (bigy-smally)* this.props.boardlength

        var color = ''

        var multRender = false

        if(this.props.art.choosen_by==this.props.mother_this.props.board_this.state.user_id){
            color = '#aaaaff'
        }else if(this.props.art.choosen_by!=''){
            if(this.props.mother_this.props.board_this.state.collaborator_dict[this.props.art.choosen_by]!=undefined){
                color = this.props.mother_this.props.board_this.state.collaborator_dict[this.props.art.choosen_by].color
            }
            
        }

        if(this.props.mother_state.current_image.length>1 || this.props.mother_state.current_text.length>1){
            multRender = true
        }


        var groups = this.props.mother_state.groups
        var current_image = this.props.mother_state.current_image
        var renderUser = false
        var userGroup = undefined
        var included_groups = []

        var selected_groups = []//undefined


        


        // // I selected
        // for(var k in groups){
        //     if(groups[k].art_ids.indexOf(this.props.art_key)!=-1){
        //         included_groups.push(k)
        //         var filtered=current_image.filter(value => groups[k].art_ids.includes(value))
        //         if(filtered.length == current_image.length && filtered.length==groups[k].art_ids.length){
        //             renderUser = true
        //             userGroup = k
        //         }  
        //     }
        // }

        // // others selected
        // if(renderUser==false){
        //     for(var idx in included_groups){
        //         var group = groups[included_groups[idx]]
        //         var choosen_bys=[]
        //         for(var jdx in group.art_ids){
        //             var art_id = group.art_ids[jdx]
        //             if(this.props.mother_state.arts[art_id]!=undefined){
        //                 choosen_bys.push(this.props.mother_state.arts[art_id].choosen_by)
        //             }
        //         }
        //         choosen_bys.sort()
        //         if(choosen_bys[0]==choosen_bys[choosen_bys.length-1]){
        //             var passed = true
        //             for(var k in this.props.mother_state.arts){
        //                 if(group.art_ids.indexOf(k)==-1){
        //                     if(this.props.mother_state.arts[k].choosen_by==choosen_bys[0]){
        //                         passed=false
        //                     }
        //                 }
        //             }
        //             if(passed){
        //                 renderUser=true
        //                 userGroup=included_groups[idx]
        //             }
        //         }

        //     }
        // }

        //////////////
        var cur_arts = []
        for(var idx in groups){
            var group = groups[idx]
            var choosen_bys=[]
            for(var jdx in group.art_ids){
                var art_id = group.art_ids[jdx]
                if(this.props.mother_state.arts[art_id]!=undefined){
                    choosen_bys.push(this.props.mother_state.arts[art_id].choosen_by)
                }
            }
            choosen_bys.sort()
            var fil = cur_arts.filter(value => groups[idx].art_ids.includes(value))
            // console.log(fil.length, cur_arts.length)
            if(choosen_bys[0]==choosen_bys[choosen_bys.length-1] && choosen_bys[0]!=''){
                // var passed = true
                // for(var k in this.props.mother_state.arts){
                //     if(group.art_ids.indexOf(k)==-1){
                //         if(this.props.mother_state.arts[k].choosen_by==choosen_bys[0]){
                //             passed=false
                //         }
                //     }
                // }
                // if(passed){
                    // renderUser=true
                    
                    if(fil.length==cur_arts.length && cur_arts.length>0){
                        selected_groups[selected_groups.length-1] = group
                        cur_arts = groups[idx].art_ids
                    }else if(fil.length==groups[idx].art_ids.length){}else{
                        selected_groups.push(group)
                        if(cur_arts.length==0){
                            cur_arts = groups[idx].art_ids
                        }
                    }
                    
                // }
            }

        }
        /////////////////

        // console.log(this.props.art_key)
        // console.log(renderUser)
        return (<g onPointerDown={this.test.bind(this)}>
            <image href={this.props.art.file} x={x} y={y} width={width} height={height}  onPointerDown={this.choose_image.bind(this, true)} onPointerUp={this.style_choose_image.bind(this)} opacity={(this.props.art.enabled)?'1':'0.3'}></image>
            {this.props.art.enabled && this.props.mother_state.control_state=='control_object' && this.props.mother_state.current_image.length==1 && this.props.mother_state.current_image[0]==this.props.art_key && this.props.mother_state.current_text.length==0 && this.props.mother_state.control_state!='crop' && 
                this.renderCropButton(x, y)
            }
            {this.props.art.enabled && this.props.mother_state.current_image.length==1 && this.props.mother_state.current_image[0]==this.props.art_key && this.props.mother_state.current_text.length==0 && this.props.mother_state.control_state=='crop' && 
            this.renderCropDoneButton(x, y)
            }
            {color!='' && <g>
            <rect onPointerDown={this.object_moving_init.bind(this)} onPointerUp={this.choose_image.bind(this, false)} onPointerEnter={this.labelOn.bind(this)} onPointerOut={this.labelOut.bind(this)} x={x-2} y={y-2} width={width+4} height={height+4} stroke={color} fill='transparent' strokeWidth='2'></rect>
            {/* {renderUser && this.renderUsers(userGroup,x,y, width)} */}
            {this.props.mother_state.current_image.length==1 && this.props.mother_state.current_image[0]==this.props.art_key && this.props.mother_state.current_text.length==0 && this.props.mother_state.control_state=='crop' && 
            this.renderCropBoundary(x, y, width, height)
            }
            </g>}
            {(selected_groups.length==1)&&this.renderLSigs((x+x2)/2, y2, width, selected_groups[0])}
            
        </g>)
    }
}

export default MoodboardImageAI