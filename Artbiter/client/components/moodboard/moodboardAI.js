import React from 'react'
import Api from '../../middleware/api'
import MoodBoard from './moodboard'
import MoodboardImageAI from './moodboard_imageAI'
import MoodBoardImageAddController from './moodboard_image_add_controller'
import MoodBoardMainController from './moodboard_main_controller'
import MoodBoardSearchPaneAI from './moodboard_searchPaneAI'
import MoodboardSelfAI from './moodboard_selfAI'
import MoodBoardText from './moodboard_text'
import MoodBoardColorAddController from './moodboard_color_add_controller'
import MoodboardStyleSketchControlAI from './moodboard_style_sketch_controlAI'
import MoodboardDisagreementRevealerAI from './moodboard_disagreement_revealerAI'
import App from '../../App'

class MoodBoardAI extends MoodBoard{
    // for state
        // control_state
    state = {
        ...this.state,
        groups: {},
        searchPane: false,
        search_image_selected: undefined,
        search_slider_values: {},
        search_slider_distances: {},

        generate_slider_values: {},
        searched_arts: {},

        disagreed_arts: {},
        boardzoom: 5,
        agreementPane: false,

        agreement_userSelection: {},

        label_art: undefined,

        groupupdatetime: Date.now(), 
        now: Date.now(),


    }
            

    getRandomColor() {
        // var group_colors = []
        // for(var gk in this.state.groups){
        //     var group = this.state.groups[gk]
        //     if(group_colors.indexOf(group.higher_group)==-1){
        //         group_colors.push(group.higher_group)
        //     }
        // }
        // var colors = [

        //     '#FFB300',
        //     '#803E75',
        //     '#FF6800',
        //     '#A6BDD7',
        //     '#C10020',
        //     '#CEA262',
        //     '#817066',
        //     '#007D34',
        //     '#F6768E',
        //     '#00538A',
        //     '#FF7A5C',
        //     '#53377A',
        //     '#FF8E00',
        //     '#B32851',
        //     '#F4C800',
        //     '#7F180D',
        //     '#93AA00',
        //     '#593315',
        //     '#F13A13',
        //     '#232C16'
        // ]

        // for(var i in colors){
        //     var color = colors[i]
        //     if(group_colors.indexOf(color)==-1){
        //         return color
        //     }
        // }
        var letters = '6789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 10)];
        }
        return color;
        
        
    }

    object_moving(e){
        super.object_moving(e);
        // adjust group pos with moving
        this.frontUpdateGroups(e)
    }

    object_moving_end(e){
        super.object_moving_end(e);
        this.backUpdateGroups(e)
    }

    object_resizing(e){
        super.object_resizing(e);
        this.frontUpdateGroups(e)
    }

    end_object_resizing(e){
        super.end_object_resizing(e)
        this.backUpdateGroups(e)
    }

    frontUpdateGroups(e){
        var groups = this.state.groups
        var current_image = this.state.current_image
        if(current_image.length>0){
            for(var i in current_image){
                var art_id = current_image[i]
                for(var k in groups){
                    var group = groups[k]
                    if(group.art_ids.indexOf(art_id)!=-1){
                        var pos = [Number.MAX_VALUE, Number.MAX_VALUE, Number.MIN_VALUE, Number.MIN_VALUE]
                        for(var j in group.art_ids){
                            var art_id2 = group.art_ids[j]
                            var art = this.state.arts[art_id2]
                            if(pos[0]>art.position[0]){
                                pos[0] = art.position[0]
                            }
                            if(pos[1]>art.position[1]){
                                pos[1] = art.position[1]
                            }
                            if(pos[2]<art.position[2]){
                                pos[2] = art.position[2]
                            }
                            if(pos[3]<art.position[3]){
                                pos[3] = art.position[3]
                            }
                            
                        }
                        group.pos= pos;
                    }
                }
            }
            this.setState({groups});
        }
    }

    backUpdateGroups(){
        var groups = this.state.groups
        var current_image = this.state.current_image
        if(current_image.length>0){
            for(var k in groups){
                var art_ids = groups[k].art_ids
                var filtered = art_ids.filter(value => this.state.current_image.includes(value))
                // console.log(filtered)
                if(filtered.length>0){
                    Api.app.service('groups').patch(k, {$set: {pos: groups[k].pos, updated:'groups_position'}})
                }
            }
        }
    }

    createAGroup(pos,e){
        e.stopPropagation()
        e.preventDefault()
        console.log('create a group', this.state.current_image)
        var name = prompt('What is the name of the group?')

        if(name==''|| name==undefined){
            this.setState({action:'idle'})
            return
        }

        var user_info = {}
        user_info[this.props.board_this.state.user_id] = {
            arts: this.state.current_image.slice(),
            // user model?
        }
        var id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        var a_group = {
            _id: id,
            art_ids: this.state.current_image.slice(),
            group_name: name,
            // art_embeddings --> to be included in the backend
            higher_group: this.getRandomColor(),
            board_id: this.props.board_this.state.board_id,
            pos: pos,
            user_info: user_info,
        }

        // var search_slider_values = this.state.search_slider_values
        // search_slider_values[id]=0
        // analytics.logEvent("create_a_group", {board_id: this.props.board_this.state.board_id, user_id:this.props.board_this.state.user_id, group_id: id, group_name: name})
        var groups = this.state.groups

        groups[id] = a_group
        this.setState({groups, action:'idle', groupupdatetime: Date.now()}, function(){
            Api.app.service('groups').create(a_group)
           
        })

        
        // Api.app.service('boards').patch(this.props.board_this.state.board_id, {$set:{search_slider_values: search_slider_values, updated: 'moodboard_search_slider_change'}})
        // this.setState({action:'idle'})

    }

    addToAGroup(group_id, e){
        e.stopPropagation()
        e.preventDefault()
        console.log('add?')
        var groups = this.state.groups
        var group = this.state.groups[group_id]
        // var art_ids = group.art_ids.slice()
        // art_ids = art_ids.concat(this.state.current_image)
        var pos = group.pos.slice()

        for(var i in this.state.current_image){
            var position = this.state.arts[this.state.current_image[i]].position
            if(position[0]<pos[0]){
                pos[0] = position[0]
            }
            if(position[1]<pos[1]){
                pos[1] = position[1]
            }
            if(position[2]>pos[2]){
                pos[2] = position[2]
            }
            if(position[3]>pos[3]){
                pos[3] = position[3]
            }
        }
        group.pos= pos
        for(var i in this.state.current_image){
            group.art_ids.push(this.state.current_image[i])
        }

        if(group.user_info[this.props.board_this.state.board_id]==undefined){
            var set = {updated:'groups_add', pos: pos}
            // set['user_info.'+this.props.board_this.state.user_id] = {
            //     arts: this.state.current_image.slice()
            // }
            groups[group_id] = group
            this.setState({groups, groupupdatetime: Date.now()}, function(){
                // analytics.logEvent("add_to_group", {board_id: this.props.board_this.state.board_id, user_id:this.props.board_this.state.user_id, group_id: group_id, added_arts: this.state.current_image.slice()})
                Api.app.service('groups').patch(group_id, {$set: set, $push:{art_ids: {$each: this.state.current_image.slice()}}})
               
            })
            
        }else{
            var push = {art_ids: {$each: this.state.current_image.slice()}}
            push['user_info.'+this.props.board_this.state.user_id+'.arts'] = {
                $each: this.state.current_image.slice()
            }
            // analytics.logEvent("add_to_group", {board_id: this.props.board_this.state.board_id, user_id:this.props.board_this.state.user_id, group_id: group_id, added_arts: this.state.current_image.slice()})
            groups[group_id] = group
            
            this.setState({groups, groupupdatetime: Date.now()}, function(){
                Api.app.service('groups').patch(group_id, {$set:{updated:'groups_add', pos: pos}, $push:push})
                
            })
            
        }
        // Api.app.service('groups').patch(group_id, {$set:{updated:'groups_add', pos: pos}, $push:{art_ids: {$each: this.state.current_image.slice()}}})

    }

    removeFromGroup(group_id, e){
        if(e!=undefined){
            e.stopPropagation()
            e.preventDefault()
        }
        
        console.log('add?')
        var groups = this.state.groups
        var group = this.state.groups[group_id]
        var art_ids = group.art_ids.slice()
        var pos = [Number.MAX_VALUE, Number.MAX_VALUE, Number.MIN_VALUE, Number.MIN_VALUE]
        var pull = {art_ids: {$in: this.state.current_image.slice()}}
        for(var i in group.user_info){
            pull['user_info.'+i+'.arts'] = {$in: this.state.current_image.slice()}
        }

        

        for(var i in art_ids){
            var art_id = art_ids[i]
            if(this.state.current_image.indexOf(art_id)==-1){
                var position = this.state.arts[art_id].position
                if(position[0]<pos[0]){
                    pos[0] = position[0]
                }
                if(position[1]<pos[1]){
                    pos[1] = position[1]
                }
                if(position[2]>pos[2]){
                    pos[2] = position[2]
                }
                if(position[3]>pos[3]){
                    pos[3] = position[3]
                }
            } 
        }
        group.pos= pos
        for(var i in this.state.current_image){
            group.art_ids.splice(group.art_ids.indexOf(this.state.current_image[i]),1)
        }
        groups[group_id] = group
        this.setState({groups: groups, groupupdatetime: Date.now()}, function(){
            Api.app.service('groups').patch(group_id, {$set:{updated:'groups_remove', pos: pos}, $pull:pull})
           
        })

        // analytics.logEvent("remove_from_group", {board_id: this.props.board_this.state.board_id, user_id:this.props.board_this.state.user_id, group_id: group_id, removed_arts: this.state.current_image.slice()})
        
        

    }

    deleteGroup(group_id, e){
        e.stopPropagation()
        e.preventDefault()
        // var num=0
        // var groups_h = []
        // var standard_group = this.state.groups[group_id]
        // var search_slider_values = this.state.search_slider_values
        // for(var k in this.state.groups){
        //     if(this.state.groups[k].higher_group == standard_group.higher_group){
        //         num=num+1
        //         if(k!=group_id){
        //             groups_h.push(k)
        //         }
                
        //     }
        // }
        // if(num==2 && search_slider_values[group_id]!=undefined){
        //     delete search_slider_values[group_id]
        //     search_slider_values[groups_h]=0
        // }else if(num==1&&search_slider_values[group_id]!=undefined){
        //     delete search_slider_values[group_id]
        // }
        // search_slider_values={}

        // Api.app.service('boards').patch(this.props.board_this.state.board_id, {$set:{search_slider_values: search_slider_values, updated: 'moodboard_search_slider_change'}})
        // analytics.logEvent("delete_group", {board_id: this.props.board_this.state.board_id, user_id:this.props.board_this.state.user_id, group_id: group_id})
        var groups = JSON.parse(JSON.stringify(this.state.groups))
        delete groups[group_id]

        this.setState({groups, groupupdatetime: Date.now()}, function(){
            Api.app.service('groups').remove(group_id)
            
        })  
        
        
        // Api.app.service('groups').remove({query: {group_id:group_id}})
    }

    selectGroup(group_id, e){
        if(this.state.control_state=='content-stamp' || this.state.control_state=='add_image' || this.state.control_state=='add_text' || this.state.control_state=='add_color'){
            return
        }
        // TODO revise
        e.stopPropagation()
        e.preventDefault()
        var ecopied = {pageX: e.pageX, pageY: e.pageY}
        var art_ids = this.state.groups[group_id].art_ids
        var _this = this
        var filtered = this.state.current_image.filter(value => !art_ids.includes(value))
        var pos = [Number.MAX_VALUE, Number.MAX_VALUE, Number.MIN_VALUE, Number.MIN_VALUE]
        var arts = this.state.arts

        var flist = art_ids 
        if(this.state.shift_down==true){
            flist = art_ids.concat(filtered)
        }
        for(var i in flist){
            var art_id = flist[i]
            if(this.state.arts[art_id].choosen_by!='' && this.state.arts[art_id].choosen_by!=this.props.board_this.state.user_id){
                return
            }
            // if(filtered.indexOf(art_id)==-1){
                var position = this.state.arts[art_id].position
                if(position[0]<pos[0]){
                    pos[0] = position[0]
                }
                if(position[1]<pos[1]){
                    pos[1] = position[1]
                }
                if(position[2]>pos[2]){
                    pos[2] = position[2]
                }
                if(position[3]>pos[3]){
                    pos[3] = position[3]
                }
            // }   
        }
        console.log('select group')
        var ratio = (pos[2]-pos[0])/(pos[3]-pos[1])
        // analytics.logEvent("select_group", {board_id: this.props.board_this.state.board_id, user_id:this.props.board_this.state.user_id, group_id: group_id})
        if(this.state.shift_down==true){
            for(var i in art_ids){
                var art_id = art_ids[i]
                arts[art_id].choosen_by = this.props.board_this.state.user_id
            }
            Promise.all([
                this.props.board_this.ChooseArtsTexts(art_ids.slice(),[],[],this.state.current_text.slice(0)),
                this.setState({action:'idle', current_image:flist, current_text:[], current_selected_pos: pos, current_selected_ratio: ratio}, function(){
                    _this.props.board_this.sketchpad.setState({})
                }), 
                // Api.app.service('event_logs').create({event:'select_group', board_id: this.props.board_this.state.board_id, user_id:this.props.board_this.state.user_id, group_id: group_id})
            ])
        }else{
            for(var i in art_ids){
                var art_id = art_ids[i]
                arts[art_id].choosen_by = this.props.board_this.state.user_id
            }
            for(var i in filtered){
                var art_id = filtered[i]
                arts[art_id].choosen_by = ''
            }
            Promise.all([
                this.props.board_this.ChooseArtsTexts(art_ids.slice(),[],filtered,this.state.current_text.slice(0)),
                this.setState({action:'idle', current_image:art_ids.slice(), current_text:[], current_selected_pos: pos, current_selected_ratio: ratio}, function(){
                    _this.object_moving_init(ecopied);
                    console.log(this.getCurrentMouseOnBoard(ecopied))
                    _this.props.board_this.sketchpad.setState({})
                }),
                // Api.app.service('event_logs').create({event: 'select_group', board_id: this.props.board_this.state.board_id, user_id:this.props.board_this.state.user_id, group_id: group_id})
            ])
        }
        
        // this.setState({action:'idle'})
    }

    relateGroup(key, key2, e){
        e.stopPropagation()
        e.preventDefault()
        var standard_group = this.state.groups[key2]
        // var cur_group = this.state.groups[key]
        // var search_slider_values = this.state.search_slider_values
        // var num = 0
        // var num2 = 0
        // var groups_h = []
        // for(var k in this.state.groups){
        //     if(this.state.groups[k].higher_group == standard_group.higher_group){
        //         num=num+1
        //         groups_h.push(k)
        //     }
        //     if(this.state.groups[k].higher_group==cur_group.higher_group){
        //         num2=num2+1
        //     }
        // }
        // if(num==1 && num2!=2){
        //     delete search_slider_values[key]
        // }else{
        //     for(var i in groups_h){
        //         if(search_slider_values[groups_h[i]]==undefined){
        //             search_slider_values[groups_h[i]] = 0
        //         }
        //     }
        //     search_slider_values[key] = 0
        // }
        // Api.app.service('boards').patch(this.props.board_this.state.board_id, {$set:{search_slider_values: search_slider_values, updated: 'moodboard_search_slider_change'}})
        // analytics.logEvent("relate_group", {board_id: this.props.board_this.state.board_id, user_id:this.props.board_this.state.user_id, group_id: key, higher_group:this.state.groups[key].higher_group})
        var groups= this.state.groups
        
        groups[key].higher_group = groups[key2].higher_group
        
        this.setState({groups, groupupdatetime: Date.now()}, function(){
            Api.app.service('groups').patch(key, {$set: {updated:'groups_relate_r', higher_group: standard_group.higher_group}})
          
        })
        
        
    }

    unrelateGroup(key,e){
        e.stopPropagation()
        e.preventDefault()
        var standard_group = this.state.groups[key]
        // var search_slider_values = this.state.search_slider_values
        // var num = 0
        // var groups_h = []
        // for(var k in this.state.groups){
        //     if(this.state.groups[k].higher_group == standard_group.higher_group){
        //         num=num+1
        //         groups_h.push(k)
        //     }
        // }
        // if(num==2){
        //     search_slider_values[key] = 0
        //     Api.app.service('boards').patch(this.props.board_this.state.board_id, {$set:{search_slider_values: search_slider_values, updated: 'moodboard_search_slider_change'}})
        // }else if(num==3){

        // }
        // analytics.logEvent("unrelate_group", {board_id: this.props.board_this.state.board_id, user_id:this.props.board_this.state.user_id, group_id: key, higher_group:this.state.groups[key].higher_group})
        var color = this.getRandomColor()

        var groups = this.state.groups

        groups[key].higher_group = color

        this.setState({groups, groupupdatetime: Date.now()}, function(){
            Api.app.service('groups').patch(key, {$set: {updated: 'groups_relate_u', higher_group: color}})
        
        })
        
        
    }


    delete_object(){
        var _this = this
        var group_del_func= function(){
            for(var k in _this.state.groups){
                var group = _this.state.groups[k]
                var art_ids= group.art_ids
                var filtered = art_ids.filter(value => _this.state.current_image.includes(value))
                if(filtered.length==art_ids.length || art_ids.length-filtered.length==1){
                    // analytics.logEvent("group_delete", {board_id: this.props.board_this.state.board_id, user_id:this.props.board_this.state.user_id, group_id: group._id})
                    var groups = JSON.parse(JSON.stringify(_this.state.groups))
                    delete groups[group._id]
                    _this.setState({groups})
                    Api.app.service('groups').remove(group._id)
                    
                }else if(filtered.length>0){
                    for(var i in filtered){
                        _this.removeFromGroup(group._id)
                    }
                }
            }
        }
        Promise.all([
            group_del_func(),
            super.delete_object()
        ])
        

    }

    renderGrouper(){
        if(this.state.control_state=='control_object'){
            if(this.state.current_image.length>1 && this.state.current_text.length==0){

                for(var i in this.state.groups){
                    var group = this.state.groups[i]
                    if(group.art_ids.length==this.state.current_image.length){
                        var pass = true
                        for(var j in this.state.current_image){
                            if(group.art_ids.indexOf(this.state.current_image[j])==-1){
                                pass=false
                            }
                        }
                        if(pass==true){
                            return
                        }
                    }
                }
                for(var j in this.state.current_image){
                    if(this.state.arts[this.state.current_image[j]].enabled!=true){
                        return
                    }
                }
                var xpos = (this.state.current_selected_pos[0]+this.state.current_selected_pos[2])/2
                var ypos = (this.state.current_selected_pos[1]+this.state.current_selected_pos[3])/2
                xpos = xpos*this.state.boardlength*this.state.boardzoom
                ypos = ypos*this.state.boardlength*this.state.boardzoom
    
                return (<g>
                    <rect x={xpos-75} y={ypos-20} width='150' height='40' fill='white' stroke='black' onPointerDown={this.createAGroup.bind(this, this.state.current_selected_pos.slice())}>
                    </rect>
                    <text x={xpos-73} y={ypos+7} fontSize='20' onPointerDown={this.createAGroup.bind(this, this.state.current_selected_pos.slice())}
                    >Create a concept</text>
                </g>)
                
            }
        }
        
    }

    renderGroupBack(){
        return Object.keys(this.state.groups).map((key, idx)=>{
            var group= this.state.groups[key]
            var pos = group.pos
            var backx = (((pos[0]>pos[2])?pos[2]:pos[0])*this.state.boardlength)*this.state.boardzoom-10
            var backy = (((pos[1]>pos[3])?pos[3]:pos[1])*this.state.boardlength)*this.state.boardzoom-10
            var width = (Math.abs(pos[0]-pos[2])*this.state.boardlength)*this.state.boardzoom+20
            var height = (Math.abs(pos[1]-pos[3])*this.state.boardlength)*this.state.boardzoom+20

            return (<g>
                <rect x={backx} y={backy}  width={width} height={height} fill={group.higher_group} fillOpacity={0.5} rx={10}></rect>
            </g>)
        })
    }

    renderGroupFront(){
        return Object.keys(this.state.groups).map((key, idx)=>{
            var group= this.state.groups[key]
            var art_ids = group.art_ids
            var pos = group.pos
            var backx = (((pos[0]>pos[2])?pos[2]:pos[0])*this.state.boardlength-10)*this.state.boardzoom
            var backy = (((pos[1]>pos[3])?pos[3]:pos[1])*this.state.boardlength-10)*this.state.boardzoom
            var width = (Math.abs(pos[0]-pos[2])*this.state.boardlength+20)*this.state.boardzoom
            var height = (Math.abs(pos[1]-pos[3])*this.state.boardlength+20)*this.state.boardzoom
            var zwidth = group.group_name.length*10 //* this.state.boardzoom
            var zheight = 20//* this.state.boardzoom
            var fontSize= 15//*this.state.boardzoom

            var current_image = this.state.current_image
            var filtered = art_ids.filter(value => this.state.current_image.includes(value))
            
            var relatable=false
            var unrelatable = false
            var key2 = undefined
            for(var k in this.state.groups){
                if(k!=key){
                    var filtered2 = this.state.groups[k].art_ids.filter(value=>current_image.includes(value))
                    if(filtered2.length==current_image.length && filtered2.length==this.state.groups[k].art_ids.length && filtered2.length>0){
                        key2 = k
                        if(this.state.groups[k].higher_group==group.higher_group){
                            unrelatable = true
                        }else{
                            relatable = true
                        }
                    }
                }
            }

            var loaded=true

            for(var img_idx in current_image){
                var img_id = current_image[img_idx]
                if(this.state.arts[img_id].enabled!=true){
                    loaded=false
                }
            }

            var removable = false
            if(filtered.length>0 && filtered.length == current_image.length && this.state.current_text.length==0 && art_ids.length-current_image.length>1 && loaded){
                removable = true
            }
            var addable = false
            if(filtered.length==0 && current_image.length>0 && this.state.current_text.length==0 && loaded){
                addable = true
            }

            var deletable = false
            if(filtered.length>0 && filtered.length == current_image.length && filtered.length == art_ids.length && loaded){
                deletable = true
            }

            if(this.state.now-this.state.groupupdatetime<3000){
                removable = false
                addable = false
                deletable = false
                relatable = false
                unrelatable = false
            }

            return (<g>
                <g>
                    <rect x={backx+width/2-zwidth/2} y={backy+height/2-zheight/2}  width={zwidth} height={zheight} fill={group.higher_group}
                        onPointerDown={this.selectGroup.bind(this, key)}></rect>
                    <text x={backx+width/2} y={backy+height/2+fontSize/4} textAnchor='middle' fontSize={fontSize}
                        onPointerDown={this.selectGroup.bind(this, key)}>{group.group_name}</text>
                </g>
                {removable && 
                <g>
                    <rect x={backx+width/2+zwidth/2-10} y={backy+height/2-20} width="20" height="20" fill='#eb4542' rx='4'
                        onPointerDown={this.removeFromGroup.bind(this, key)}></rect>
                    <text x={backx+width/2+zwidth/2} y={backy+height/2-5.5} textAnchor='middle' fontSize='17'
                        onPointerDown={this.removeFromGroup.bind(this, key)}>-</text>
                </g>}
                {addable && 
                <g>
                    <rect x={backx+width/2+zwidth/2-10} y={backy+height/2-20} width="20" height="20" fill='#35cc67' rx='4'
                        onPointerDown={this.addToAGroup.bind(this, key)}></rect>
                    <text x={backx+width/2+zwidth/2} y={backy+height/2-5.5} textAnchor='middle' fontSize='17'
                        onPointerDown={this.addToAGroup.bind(this, key)}>+</text>
                </g>}
                {deletable && 
                <g>
                    <rect x={backx+width/2+zwidth/2-10} y={backy+height/2-20} width="20" height="20" fill='#eb4542' rx='4'
                        onPointerDown={this.deleteGroup.bind(this, key)}></rect>
                    <text x={backx+width/2+zwidth/2} y={backy+height/2-5.5} textAnchor='middle' fontSize='17'
                        onPointerDown={this.deleteGroup.bind(this, key)}>x</text>
                </g>}
                {relatable && 
                <g>
                    <rect x={backx+width/2+zwidth/2-10} y={backy+height/2+0} width="20" height="20" fill='#fcba03' rx='4'
                        onPointerDown={this.relateGroup.bind(this, key2, key)}></rect>
                    <text x={backx+width/2+zwidth/2} y={backy+height/2+15.5} textAnchor='middle' fontSize='17'
                        onPointerDown={this.relateGroup.bind(this, key2, key)}>R</text>
                </g>}
                {unrelatable && 
                <g>
                    <rect x={backx+width/2+zwidth/2-10} y={backy+height/2+0} width="20" height="20" fill='#9803fc' rx='4'
                        onPointerDown={this.unrelateGroup.bind(this, key2)}></rect>
                    <text x={backx+width/2+zwidth/2} y={backy+height/2+15.5} textAnchor='middle' fontSize='17'
                        onPointerDown={this.unrelateGroup.bind(this, key2)}>U</text>
                </g>}
            </g>)
        })
    }

    renderImages(){
        var _this = this
        return Object.keys(this.state.arts).map(function(key, index) {
            if(_this.state.arts[key]!=undefined){
                if(_this.state.arts[key].position!=undefined){
                    return (<MoodboardImageAI key={key} art_key={key} mother_this={_this} mother_state={_this.state} current_image={_this.state.current_image} art={_this.state.arts[key]} boardlength={_this.state.boardlength*_this.state.boardzoom}></MoodboardImageAI>)
                }
            }
            
        })
    }

    renderSelfs(){
        var _this = this
        return Object.keys(this.state.arts).map(function(key, index) {
            if(_this.state.arts[key]!=undefined){
                if(_this.state.arts[key].position!=undefined){
                    return (<MoodboardSelfAI key={key} art_key={key} mother_this={_this} mother_state={_this.state} current_image={_this.state.current_image} art={_this.state.arts[key]} boardlength={_this.state.boardlength*_this.state.boardzoom}></MoodboardSelfAI>)
                }
            }
            
        })
    }

    renderLabel(){

    }

    renderLabels(){
        if(this.state.current_image.length==1 && this.state.current_text.length==0 && this.state.action=='idle'){
            if(this.state.label_art==this.state.current_image[0]){

                var art = this.state.arts[this.state.current_image[0]]
                if(art!=undefined){
                    if(art.labels!=undefined){
                        
                            var smallx = (art.position[0]<art.position[2])?art.position[0]:art.position[2]
                            var bigx = (art.position[0]<art.position[2])?art.position[2]:art.position[0]
                            var smally = (art.position[1]<art.position[3])?art.position[1]:art.position[3]
                            var bigy = (art.position[1]<art.position[3])?art.position[3]:art.position[1]
                            var x = bigx* this.state.boardlength*this.state.boardzoom+5
                            var y = smally* this.state.boardlength*this.state.boardzoom-5

                            var width = 100//(bigx-smallx)*this.props.boardlength
                            var height = 200//(bigy-smally)*this.props.boardlength
                            var _this = this
                            return (<div style={{position:'absolute', left:x, top: y, width:'fit-content', height: 'fit-content'}} className='controller'>
                                <div><b>Machine label</b></div>
                                {Object.keys(art.labels).map(function(key, idx){
                                    if(art.labels[key]!=0 && _this.state.groups[key]!=undefined){
                                        var label_width = (art.labels[key]*50>100)?100:art.labels[key]*50
                                        
                                        return (<div>
                                            <div style={{display:'inline-block'}}>{_this.state.groups[key].group_name}</div>
                                            <div style={{display:'inline-block', marginLeft:'3px', height:'10px', width:label_width, backgroundColor:'#eeeeee'}}></div>
                                            </div>)
                                    }
                                    
                                })}
                            </div>)
                        
                        
                    }
                }
                

            }
            
        }
    }

    renderGroupConnectors(){
        var groups = this.state.groups
        var group_list = Object.keys(groups)
        var scaler = this.state.boardlength*this.state.boardzoom

        return group_list.map((val, idx)=>{
            return group_list.map((val2, idx2)=>{
                if(idx<idx2){
                    if(groups[val].higher_group==groups[val2].higher_group){
                        // render edge
                    
                        return (<line x1={scaler*(groups[val].pos[0]+groups[val].pos[2])/2} y1={scaler*(groups[val].pos[1]+groups[val].pos[3])/2} 
                        x2={scaler*(groups[val2].pos[0]+groups[val2].pos[2])/2} y2={scaler*(groups[val2].pos[1]+groups[val2].pos[3])/2} stroke='#888888' strokeWidth='5'></line>)
                    }
                }
            })
        })
    }

    render(){
        var boardrender_cursor
        if((this.state.control_state=='add_image'||this.state.control_state=='add_color') && this.state.action!='idle'){
            boardrender_cursor='crosshair'
        }else if(this.state.control_state=='add_comment'){
            boardrender_cursor='cell'
        }else if(this.state.control_state=='add_text'){
            boardrender_cursor='text'
        }else if(this.state.control_state=='control_object' && this.state.action=='move_board'){
            boardrender_cursor='grab'
        }else{
            boardrender_cursor='default'
        }

        var panel_size = ' s6 ' 
        var horizontal_offset = 0
        if(this.props.board_this.state.moodboard_collapsed==false && this.props.board_this.state.sketchpad_collapsed==true){
            panel_size = ' s12 '
            horizontal_offset = this.state.boardwidth/2
        }

        return (<div className={'col '+panel_size+' oneboard'} style={{display: (this.props.board_this.state.moodboard_collapsed)?'none':''}}>
            <h2 style={{paddingLeft:'25px'}}>Mood Board {this.renderInitMoodboardMessage()}</h2>
            <div className={'panel_collapser'} style={{left: '11px', top: 7.25}} onPointerDown={this.collapseMoodboard.bind(this)}> ▶ </div>
            <div id='moodboard' className='moodboard select_disabled' onWheel={this.zoom_board_wheel.bind(this)} 
                //onPointerOut={this.moveBoardEnd.bind(this)}
                
                
                onPointerMove={this.moodBoardMouseMove.bind(this)}> 
                
                <div className='boardrender' onPointerDown={this.moodBoardMouseInit.bind(this)} onPointerUp={this.moodBoardMouseEnd.bind(this)} 
                // onPointerOut={this.props.board_this.setMoodboardPosition.bind(this.props.board_this, -1, -1)}

                onDrop={this.dropImage.bind(this)}
                onDragEnter={this.dropenter.bind(this)}
                onDragLeave={this.dropout.bind(this)}
                onDragOver={this.dropover.bind(this)}

                style={{
                    width:this.state.boardzoom*this.state.boardlength, 
                    height: this.state.boardzoom*this.state.boardlength,
                    top: this.state.boardheight/2-this.state.boardzoom*this.state.boardlength*this.state.boardcenter[1],
                    left: horizontal_offset+this.state.boardwidth/2-this.state.boardzoom*this.state.boardlength*this.state.boardcenter[0],

                    cursor: boardrender_cursor,
                }}>
                    
                    <svg width={this.state.boardzoom*this.state.boardlength} height={this.state.boardzoom*this.state.boardlength}>
                        {this.renderGroupConnectors()}
                        {this.renderGroupBack()}
                        {this.state.control_state=='control_object'&&(this.state.current_image.length>0||this.state.current_text.length>0)&&this.state.current_selected_pos!=undefined && 
                            this.renderImageHandle()
                        }
                        {this.renderImages()}
                        {this.renderTexts()}
                        {this.rendereditingTexts()}
                        {this.state.control_state=='control_object'&&(this.state.current_image.length>0||this.state.current_text.length>0)&&this.state.current_selected_pos!=undefined && 
                            this.renderImageHandle2()
                        }
                        
                        
                        {/* {this.renderSelfs()} */}
                        
                        {this.renderGroupFront()}
                        {this.renderGrouper()}
                        {/* {this.state.control_state=='style-stamp' && <MoodboardStyleSketchControlAI ref={'stylecontrol'} mother_this={this} mother_state={this.state}></MoodboardStyleSketchControlAI>} */}
                    </svg>
                    {/* {this.props.board_this.renderCollaboratorsOnMoodBoard()} */}
                    {this.renderLabels()}
                    

                </div>

                <MoodBoardMainController mother_this={this} mother_state={this.state}></MoodBoardMainController>
                {this.state.control_state=='add_image' && this.state.action=='idle' && 
                    <MoodBoardImageAddController mother_this={this} mother_state={this.state}></MoodBoardImageAddController>}
                {this.state.control_state=='add_color' && this.state.action=='idle' && 
                    <MoodBoardColorAddController mother_this={this} mother_state={this.state}></MoodBoardColorAddController>}
                <MoodBoardSearchPaneAI mother_this={this} mother_state={this.state}></MoodBoardSearchPaneAI>
                {/* <MoodboardDisagreementRevealerAI mother_this={this} mother_state={this.state}></MoodboardDisagreementRevealerAI> */}
                {this.state.group_updating==true && <div style={{position:'absolute', zOrder: 1000000,width:'100%', height: '100%', left: '0', top: '0', textAlign: 'center', backgroundColor: '#ffffff88', paddingTop: document.getElementById('moodboard').offsetHeight/2-15}}>
                Artbiter is learning the concept and applying the concept to images...
                </div>}
            </div>
            
        </div>)
    }
    
}

export default MoodBoardAI;