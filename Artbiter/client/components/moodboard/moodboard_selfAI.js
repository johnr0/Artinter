import React, {Component} from 'react'
import Api from '../../middleware/api';

class MoodboardSelfAI extends Component{
    toggleInclusion(group_key, add, e){
        e.stopPropagation();
        e.preventDefault()
        var art_key = this.props.art_key
        var group = this.props.mother_state.groups[group_key]
        var user_id = this.props.mother_this.props.board_this.state.user_id
        if(group.user_info[user_id]==undefined){
            var set = {}
            set['user_info.'+user_id+'.arts'] = [art_key]
            set['updated']='groups_toggle_inclusion'
            Api.app.service('groups').patch(group_key, {$set: set})
        }else{
            if(add){
                var push = {}
                push['user_info.'+user_id+'.arts']=art_key
                Api.app.service('groups').patch(group_key, {$set: {updated:'groups_toggle_inclusion'}, $push:push})
            }else{
                var pull = {}
                pull['user_info.'+user_id+'.arts']=art_key
                Api.app.service('groups').patch(group_key, {$set: {updated:'groups_toggle_inclusion'}, $pull:pull})
            }

        }
        this.props.mother_this.setState({action:'idle'})
        

    }

    renderSelf(group_key, x, y, width){
        var group = this.props.mother_state.groups[group_key]
        var user_info = group.user_info[this.props.mother_this.props.board_this.state.user_id]
        var renderWidth = Math.min(20, width/10)
        if(user_info==undefined){
            return (<g>
                <circle cx={x+width-renderWidth/2} cy={y+renderWidth/2} r={renderWidth/2}
                fill='white' stroke='black' onPointerDown={this.toggleInclusion.bind(this, group_key, true)}></circle>
            </g>)
        }else{
            if(user_info.arts.indexOf(this.props.art_key)!=-1){
                return (<g>
                    <circle cx={x+width-renderWidth/2} cy={y+renderWidth/2} r={renderWidth/2}
                    fill='black' stroke='white' onPointerDown={this.toggleInclusion.bind(this, group_key, false)}></circle>
                </g>)
            }else{
                return (<g>
                    <circle cx={x+width-renderWidth/2} cy={y+renderWidth/2} r={renderWidth/2}
                    fill='white' stroke='black' onPointerDown={this.toggleInclusion.bind(this, group_key, true)}></circle>
                </g>)
            }
        }
    }

    render(){
        var smallx = (this.props.art.position[0]<this.props.art.position[2])?this.props.art.position[0]:this.props.art.position[2]
        var bigx = (this.props.art.position[0]>this.props.art.position[2])?this.props.art.position[0]:this.props.art.position[2]
        var smally = (this.props.art.position[1]<this.props.art.position[3])?this.props.art.position[1]:this.props.art.position[3]
        var bigy = (this.props.art.position[1]>this.props.art.position[3])?this.props.art.position[1]:this.props.art.position[3]
        var x = smallx* this.props.boardlength
        var y = smally* this.props.boardlength

        var width = (bigx-smallx)* this.props.boardlength
        // var height = (bigy-smally)* this.props.boardlength

        var color = ''

        if(this.props.art.choosen_by==this.props.mother_this.props.board_this.state.user_id){
            color = '#aaaaff'
        }else if(this.props.art.choosen_by!=''){
            if(this.props.mother_this.props.board_this.state.collaborator_dict[this.props.art.choosen_by]!=undefined){
                color = this.props.mother_this.props.board_this.state.collaborator_dict[this.props.art.choosen_by].color
            }
            
        }


        var groups = this.props.mother_state.groups
        var current_image = this.props.mother_state.current_image
        var renderUser = false
        var userGroup = undefined
        var included_groups = []
        for(var k in groups){
            if(groups[k].art_ids.indexOf(this.props.art_key)!=-1){
                included_groups.push(k)
                var filtered=current_image.filter(value => groups[k].art_ids.includes(value))
                if(filtered.length == current_image.length && filtered.length==groups[k].art_ids.length){
                    renderUser = true
                    userGroup = k
                }  
            }

        }
        if(renderUser==false){
            for(var idx in included_groups){
                var group = groups[included_groups[idx]]
                var choosen_bys=[]
                for(var jdx in group.art_ids){
                    var art_id = group.art_ids[jdx]
                    if(this.props.mother_state.arts[art_id]!=undefined){
                        choosen_bys.push(this.props.mother_state.arts[art_id].choosen_by)
                    }
                }
                choosen_bys.sort()
                if(choosen_bys[0]==choosen_bys[choosen_bys.length-1]){
                    var passed = true
                    for(var k in this.props.mother_state.arts){
                        if(group.art_ids.indexOf(k)==-1){
                            if(this.props.mother_state.arts[k].choosen_by==choosen_bys[0]){
                                passed=false
                            }
                        }
                    }
                    if(passed){
                        console.log('true??',this.props.art_key)
                        renderUser=true
                        userGroup=included_groups[idx]
                    }
                }

            }
        }



        // console.log(this.props.art_key)
        // console.log(renderUser)
        return (<g>
            {color!='' && renderUser && this.renderSelf(userGroup,x,y, width)}
            
            
        </g>)
    }

}

export default MoodboardSelfAI;