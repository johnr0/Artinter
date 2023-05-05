import React, {Component} from 'react'
import Api from '../../middleware/api'

class MoodboardDisagreementRevealerAI extends Component{

    checkSelectedGroups(){
        var groups = this.props.mother_state.groups
        var current_image = this.props.mother_state.current_image
        var selectedGroups = []
        var included_groups = []


        for(var k in groups){
            included_groups.push(k)
            var filtered=current_image.filter(value => groups[k].art_ids.includes(value))
            if(filtered.length == current_image.length && filtered.length==groups[k].art_ids.length){
                selectedGroups.push(k)
            }  
            
        }

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
            if(choosen_bys[0]==choosen_bys[choosen_bys.length-1] && choosen_bys[0]!=''){
                
                var passed = true
                for(var k in this.props.mother_state.arts){
                    if(group.art_ids.indexOf(k)==-1){
                        if(this.props.mother_state.arts[k].choosen_by==choosen_bys[0]){
                            passed=false
                        }
                    }
                }
                console.log(choosen_bys[0], k, passed)
                if(passed && selectedGroups.indexOf(group._id)==-1){
                    selectedGroups.push(group._id)
                }
            }

        }

        return selectedGroups
    }

    checkUserInputsInSelectedGroups(higher_group_id){
        var groups = this.props.mother_state.groups

        var user_counts=[]

        for(var group_key in groups){
            var group = groups[group_key]
            if(group.higher_group == higher_group_id){
                user_counts.push(0)
            }
        }

        var user_idx = 0
        for(var group_key in groups){
            var group = groups[group_key]
            
            if(group.higher_group == higher_group_id){
                for(var user in group.user_info){
                    if(group.user_info[user].arts.length >0){
                        console.log(user, user_idx)
                        user_counts[user_idx] = user_counts[user_idx] + 1
                    }
                }
                user_idx=user_idx+1
            }
        }

        user_counts.sort()

        console.log(user_counts, Object.keys(this.props.mother_this.props.board_this.state.collaborator_dict).length)
        if(user_counts[0]==user_counts[user_counts.length-1] && user_counts[0]==Object.keys(this.props.mother_this.props.board_this.state.collaborator_dict).length+1){
            return true
        }else{
            return false
        }
    }

    getGroupUserInfo(group_id){
        return this.props.mother_state.groups[group_id].user_info
    }

    revealDisagreeement(group_id){

        Api.app.service('groups').patch(group_id, {$set: {updated: 'groups_reveal_disagreement' }})
    }

    addAgreedImageToMoodboard(image){
        console.log(image)

        var group_id = image.user_decisions[Object.keys(image.user_decisions)[0]]
        if(group_id.includes('not_')){
            group_id = group_id.split('_')[1]
        }

        var id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        var arts = this.props.mother_state.arts

        var image_obj=new Image();
        var _this = this
        image_obj.src = image.image
        var pos = this.props.mother_state.groups[group_id].pos
        var position = [(pos[0]+pos[2])/2, (pos[1]+pos[3])/2, (pos[0]+pos[2])/2, (pos[1]+pos[3])/2]
        image_obj.onload = function(){
            var ratio = this.width/this.height
            var width = 0.1
            var height = width/ratio
            position[2] = position[0]+width/2
            position[0] = position[0]-width/2
            position[3] = position[1]+height/2
            position[1] = position[1]-height/2
            

            arts[id] = {
                file: image.image,
                position: position,
                ratio: ratio,
                choosen_by: '',
            }

            var group = _this.props.mother_state.groups[group_id]
            // var art_ids = group.art_ids.slice()
            // art_ids = art_ids.concat(this.state.current_image)
            var pos2 = group.pos.slice()

            if(position[0]<pos2[0]){
                pos2[0] = position[0]
            }
            if(position[1]<pos2[1]){
                pos2[1] = position[1]
            }
            if(position[2]>pos2[2]){
                pos2[2] = position[2]
            }
            if(position[3]>pos2[3]){
                pos2[3] = position[3]
            }

            var push = {art_ids: {$each: [id]}}
            push['user_info.'+_this.props.mother_this.props.board_this.state.user_id+'.arts'] = {
                $each: [id]
            }
            for(var key in _this.props.mother_this.props.board_this.state.current_collaborators){

                push['user_info.'+key+'.arts'] = {
                    $each: [id]
                }
            }
            



            Promise.all([
                // _this.props.mother_this.props.board_this.ChooseArtsTexts([],[],_this.props.mother_state.current_image, _this.props.mother_state.current_text),
                _this.props.mother_this.props.board_this.AddArts([arts[id]],[id]),
                Api.app.service('groups').patch(group_id, {$set:{updated:'groups_add', pos: pos}, $push:push})
            ])
        }
    }

    togglePane(){
        var pass = true
        var current_collaborators = this.props.mother_this.props.board_this.state.current_collaborators
        var key2 = Object.keys(this.props.mother_state.disagreed_arts)[0]
        // var image = this.props.mother_state.disagreed_arts[key]
        var user_decisions = this.props.mother_state.agreement_userSelection

        for(var key in current_collaborators){
            if(current_collaborators[key].active){
                if(user_decisions[key]!=true){
                    pass = false
                }
            }
            
        }

        if(user_decisions[this.props.mother_this.props.board_this.state.user_id]!=true){
            pass=false
        }

        console.log(pass)

        if(pass){
            // add image to the moodboard and add to the group
            this.addAgreedImageToMoodboard(this.props.mother_state.disagreed_arts[key2])
        }

        Api.app.service('boards').patch(this.props.mother_this.props.board_this.state.board_id, {$set: {
            agreementPane: false, 
            updated: 'moodboard_disagreement_search',
            agreement_userSelection: {},
            
          }})
    }

    renderPrediction(user_decisions){
        var users = this.props.mother_this.props.board_this.state.collaborator_dict
        return Object.keys(user_decisions).map((user)=>{
            var group_name
            if(this.props.mother_state.groups[user_decisions[user]]!=undefined){
                group_name =this.props.mother_state.groups[user_decisions[user]].group_name
            }else{
                group_name = 'not '+this.props.mother_state.groups[user_decisions[user].split('_')[1]].group_name
            }
            if(users[user]!=undefined){
                return (<div>{users[user]['email'].split('@')[0]} might think it is {group_name}.</div>)
            }else if(this.props.mother_this.props.board_this.state.user_email!=undefined){
                return (<div>You might think it is {group_name}.</div>)
            }
            
        })
    }

    renderYesMarks(){
        var key_list=[]
        for(var i in this.props.mother_state.agreement_userSelection){
            if(this.props.mother_state.agreement_userSelection[i]==true){
                if(i!=this.props.mother_this.props.board_this.state.user_id){
                    key_list.push(i)
                } 
            }
        }
        return Object.keys(this.props.mother_state.agreement_userSelection).map((key, idx)=>{
            var userSelection = this.props.mother_state.agreement_userSelection[key]
            var userInfo = this.props.mother_this.props.board_this.state.collaborator_dict[key]
            var current_collaborator = this.props.mother_this.props.board_this.state.current_collaborators[key]
            if(userSelection==true){
                if(userInfo==undefined){
                    if(key==this.props.mother_this.props.board_this.state.user_id){
                        return (<div style={{width:'10px', height:'10px', position:'absolute', right:'0', top:'0', backgroundColor: 'black', border: 'solid 1px white', borderRadius:'50%'}}></div>)
                    }
                }else{
                    if(current_collaborator!=undefined){
                        if(current_collaborator.active){
                            return (<div style={{width:'10px', height:'10px', position:'absolute', left:(0+key_list.indexOf(key)*10).toString(), top:'0', backgroundColor: userInfo.color, border:'solid 1px black', borderRadius:'50%'}}></div>)
                        }
                    }
                    
                }
            }
            
        })

    }

    renderNoMarks(){
        var key_list=[]
        for(var i in this.props.mother_state.agreement_userSelection){
            if(this.props.mother_state.agreement_userSelection[i]==false){
                if(i!=this.props.mother_this.props.board_this.state.user_id){
                    key_list.push(i)
                } 
            }
        }
        return Object.keys(this.props.mother_state.agreement_userSelection).map((key, idx)=>{
            var userSelection = this.props.mother_state.agreement_userSelection[key]
            var userInfo = this.props.mother_this.props.board_this.state.collaborator_dict[key]
            var current_collaborator = this.props.mother_this.props.board_this.state.current_collaborators[key]
            if(userSelection==false){
                if(userInfo==undefined){
                    if(key==this.props.mother_this.props.board_this.state.user_id){
                        return (<div style={{width:'10px', height:'10px', position:'absolute', right:'0', top:'0', backgroundColor: 'black', border: 'solid 1px white', borderRadius:'50%'}}></div>)
                    }
                }else{
                    if(current_collaborator!=undefined){
                        if(current_collaborator.active){
                            return (<div style={{width:'10px', height:'10px', position:'absolute', left:(0+key_list.indexOf(key)*10).toString(), top:'0', backgroundColor: userInfo.color, border:'solid 1px black', borderRadius:'50%'}}></div>)
                        }
                    }
                }
            }
            
        })
    }

    checkOnYes(){
        var set = {}
        set['agreement_userSelection.'+this.props.mother_this.props.board_this.state.user_id]=true
        set['updated']='moodboard_disagreement_user_selection'
        Api.app.service('boards').patch(this.props.mother_this.props.board_this.state.board_id, {
            $set:set
        })
    }

    checkOnNo(){
        var set = {}
        set['agreement_userSelection.'+this.props.mother_this.props.board_this.state.user_id]=false
        set['updated']='moodboard_disagreement_user_selection'
        Api.app.service('boards').patch(this.props.mother_this.props.board_this.state.board_id, {
            $set:set
        })
    }
    
    scrollNullify(e){
        e.stopPropagation()
        e.preventDefault()
    }

    renderImage(){
        var key = Object.keys(this.props.mother_state.disagreed_arts)[0]
        console.log(this.props.mother_state.disagreed_arts)
        console.log(key)
        var image = this.props.mother_state.disagreed_arts[key]
        if(image!=undefined){
            var group_id = image.user_decisions[Object.keys(image.user_decisions)[0]]
            if(group_id.includes('not_')){
                group_id = group_id.split('_')[1]
            }
            console.log(group_id)
            var group_name = this.props.mother_state.groups[group_id].group_name
            return (<div>
                <img src={image.image} style={{margin:'auto', display:'block', maxWidth:'100%', height: 'calc(100% - 200px)'}}></img>
                <div style={{margin:'auto', display:'block', textAlign:'center'}}>
                    <div style={{height: '44', overflowY:'auto'}} onScroll={this.scrollNullify.bind(this)}>
                        {this.renderPrediction(image.user_decisions)}
                    </div>
                    
                    <div style={{marginTop:'10px'}}><b>Do you think it is {group_name}?</b></div>
                    <div style={{position:'relative'}}>
                        <div className='btn' style={{marginRight: '20px', position:'relative'}} onPointerDown={this.checkOnYes.bind(this)}>
                            Yes
                            {this.renderYesMarks()}
                        </div>
                        <div className='btn red' style={{position:'relative'}} onPointerDown={this.checkOnNo.bind(this)}>No
                        {this.renderNoMarks()}</div>
                    </div>
                </div>
                <div style={{margin:'auto', display:'block', textAlign:'center'}}>
                    When the team make the agreement that it is {group_name}, it will be added to the moodboard
                </div>
            </div>)
        }
        
    }

    render(){
        var selectedGroups = this.checkSelectedGroups()

        if(this.props.mother_state.agreementPane==true){
            return (<div>
                <div className='controller' style={{position:'absolute', right:'10', top:'10', width: '50%', height: '60%', zIndex: 100}}>
                    <div>
                        {this.renderImage()}
                    </div>
                    <div style={{display:'block', margin:'auto', width: 'fit-content'}}>
                        <div className='btn' style={{position:'relative'}} onPointerDown={this.togglePane.bind(this)}>Done</div>
                    </div>
                </div>
                <div style={{position:'absolute', left:'0', top:'0', width:'100%', height:'100%', backgroundColor:'#ffffff80'}}>
                </div>
                
                
            </div>)
        }

        if(selectedGroups.length==1){
            var valid_user = 0
            var groupUserInfo = this.getGroupUserInfo([selectedGroups[0]])
            var allUsersMadeInput = this.checkUserInputsInSelectedGroups(this.props.mother_state.groups[selectedGroups[0]].higher_group)
            for(var i in groupUserInfo){
                if(groupUserInfo[i].arts.length>0){
                    valid_user = valid_user+1
                }
            }

            if(valid_user>1 && allUsersMadeInput){
                if(this.props.mother_state.control_state!='reveal_disagreement'){
                    return (
                        <div className={'btn'} style={{position:'absolute', right: 10, top: 10}} 
                        onPointerDown={this.revealDisagreeement.bind(this, selectedGroups[0])}>Reveal Disagreement</div>)
                }
            }else{
                if(this.props.mother_state.control_state!='reveal_disagreement'){
                    return (
                        <div className={'btn'} style={{position:'absolute', right: 10, top: 10}} disabled>Reveal Disagreement</div>)
                }
            }

            
            
        }

        // console.log('selected groups', selectedGroups)


        return (<div></div>)
    }
}

export default MoodboardDisagreementRevealerAI