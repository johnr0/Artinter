import React, {Component} from 'react'
import Api from '../../middleware/api'
import interpolate from 'color-interpolate'

class MoodBoardSearchPaneAI extends Component{
    state={
        scrollTimeOut: undefined, 
    }

    toggleSearchPane(e){
        e.stopPropagation()
        e.preventDefault()
        var value = !this.props.mother_state.searchPane
        var _this = this
        this.props.mother_this.setState({searchPane:value}, function(){
            Api.app.service('boards').patch(_this.props.mother_this.props.board_this.state.board_id, {
                $set: {updated: 'moodboard_search_pane_toggle', searchPane: value}
            })
        })  
        
    }

    selectSearchImageChoose(){
        var _this = this
        if(this.props.mother_state.control_state=='control_object'){
            if(this.props.mother_state.current_text.length==0 && this.props.mother_state.current_image.length==1){

                if(this.props.mother_state.arts[this.props.mother_state.current_image[0]].enabled){
                    this.props.mother_this.setState({search_image_selected:this.props.mother_state.current_image[0]}, function(){
                        Api.app.service('boards').patch(_this.props.mother_this.props.board_this.state.board_id, {$set: {search_image_selected: _this.props.mother_state.current_image[0], updated:'moodboard_search_image_select'}})
                    })
                    
                    return 
                }
                // return
            }
            
            
            var promises = [this.props.mother_this.props.board_this.ChooseArtsTexts([],[],this.props.mother_state.current_image.slice(0), this.props.mother_state.current_text.slice(0))]
        
            var del_texts = []
            var replace_texts = []
            var replace_text_ids = []
            for(var i in this.props.mother_state.current_text){
                var key = this.props.mother_state.current_text[i]
                if(this.props.mother_state.texts[key].text==''){
                    del_texts.push(key)
                    delete this.props.mother_state.texts[key]
                }else{
                    replace_text_ids.push(key)
                    replace_texts.push(this.props.mother_state.texts[key])
                }
            }
            promises.push(this.props.mother_this.props.board_this.UpdateArtsTexts([],[], replace_texts, replace_text_ids))
            if(del_texts.length>0){
                promises.push(this.props.mother_this.props.board_this.RemoveArtsTexts([], del_texts))
            }
            promises.push(this.props.mother_this.setState({current_image:[], current_text:[], current_selected_pos: undefined, current_selected_ratio: undefined}))
            Promise.all(promises)

            this.props.mother_this.setState({control_state:'search_image_select'})
            
        }
        
    }

    cancelSearchImageChoose(){
        this.props.mother_this.setState({control_state:'control_object'})
    }

    changeSliders(group_id, e){
        var search_slider_values = this.props.mother_state.search_slider_values
        search_slider_values[group_id] = e.target.value/100
        this.props.mother_this.setState({search_slider_values: search_slider_values})
        // Api.app.service('boards').patch(this.props.mother_this.props.board_this.statee.board_id, {$set:{updated:'moodboard_search_slider_change', search_slider_values: this.props.mother_state.search_slider_values}})
    }

    doneChangeSliders(group_id, e){
        var search_slider_values = this.props.mother_state.search_slider_values
        for(var group_key in search_slider_values){
            if(this.props.mother_state.groups[group_key]==undefined){
                delete search_slider_values[group_key]
            }
        }
        Api.app.service('boards').patch(this.props.mother_this.props.board_this.state.board_id, {$set:{updated:'moodboard_search_slider_change', search_slider_values: search_slider_values}})
    }

    changeGenSliders(group_id, e){
        var generate_slider_values = this.props.mother_state.generate_slider_values
        generate_slider_values[group_id] = e.target.value/100
        this.props.mother_this.setState({generate_slider_values: generate_slider_values})
        // Api.app.service('boards').patch(this.props.mother_this.props.board_this.statee.board_id, {$set:{updated:'moodboard_search_slider_change', search_slider_values: this.props.mother_state.search_slider_values}})
    }

    doneChangeGenSliders(group_id, e){
        var generate_slider_values = this.props.mother_state.generate_slider_values
        for(var group_key in generate_slider_values){
            if(this.props.mother_state.groups[group_key]==undefined && group_key!='selected_image'){
                delete generate_slider_values[group_key]
            }
        }
        Api.app.service('boards').patch(this.props.mother_this.props.board_this.state.board_id, {$set:{updated:'moodboard_generate_slider_change', generate_slider_values: generate_slider_values}})
    }


    searchModeToggle(mode){
        var _this = this
        this.props.mother_this.setState({searchMode:mode}, function(){
            Api.app.service('boards').patch(_this.props.mother_this.props.board_this.state.board_id, {$set: {updated: 'moodboard_search_mode_toggle', searchMode: mode}})
        })
        
    }

    search(){
        
        // analytics.logEvent("search", {board_id: this.props.mother_this.props.board_this.state.board_id, user_id:this.props.mother_this.props.board_this.state.user_id, seach_image_selected: this.props.mother_state.search_image_selected, sliders: this.props.mother_state.search_slider_values})
        Api.app.service('boards').patch(this.props.mother_this.props.board_this.state.board_id, {$set: {updated: 'moodboard_search_images', searching: true}})
        
    }

    search_similar(){
        
        // analytics.logEvent("search_similar", {board_id: this.props.mother_this.props.board_this.state.board_id, user_id:this.props.mother_this.props.board_this.state.user_id, seach_image_selected: this.props.mother_state.search_image_selected})
        Api.app.service('boards').patch(this.props.mother_this.props.board_this.state.board_id, {$set: {updated: 'moodboard_search_similar_images', searching: true}})

    }

    search_random(){
        
        // analytics.logEvent("search_random", {board_id: this.props.mother_this.props.board_this.state.board_id, user_id:this.props.mother_this.props.board_this.state.user_id})
        Api.app.service('boards').patch(this.props.mother_this.props.board_this.state.board_id, {$set: {updated: 'moodboard_search_random_images', searching: true}})

    }

    generate(){
        var dogen = false
        for(var k in this.props.mother_state.generate_slider_values){
            if(this.props.mother_state.generate_slider_values[k]!=0){
                dogen=true
                break
            }
        }
        if(dogen){
            // analytics.logEvent("transfer_on_moodboard", {board_id: this.props.mother_this.props.board_this.state.board_id, user_id:this.props.mother_this.props.board_this.state.user_id, seach_image_selected: this.props.mother_state.search_image_selected, sliders: this.props.mother_state.generate_slider_values})
            Api.app.service('boards').patch(this.props.mother_this.props.board_this.state.board_id, {$set: {updated: 'moodboard_generate_image', searching: true}})
        }
        
    }

    addSearchedImageToMoodboard(val){
        var id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        var arts = this.props.mother_state.arts
        var pos = this.props.mother_this.getPositionOnBoard(document.getElementById('moodboard').offsetWidth/2, document.getElementById('moodboard').offsetHeight/2, true)
        var position = [pos[0], pos[1], pos[0], pos[1]]
        for(var i in this.props.mother_state.current_image){
            arts[this.props.mother_state.current_image[i]].choosen_by=''
        }
        console.log(val[1])
        var image=new Image();
        var _this = this
        image.src = val[1]
        image.onload = function(){
            console.log(this.width/this.height)
            var ratio = this.width/this.height

            if(pos[0]+0.05>1){
                position[0]=0.95
                position[2]=1
            }else if(pos[0]-0.05<0){
                position[0]=0
                position[2]=0.05
            }else{
                position[2] = position[0]+0.05
            }

            if(pos[1]+0.05>1){
                position[1]=1-0.05/ratio
                position[3]=1
            }else if(pos[1]-0.05<0){
                position[1]=0
                position[3]=0.05/ratio
            }else{
                position[3] = position[1]+0.05/ratio
            }

            var resized = _this.props.mother_this.resizeImage(this)


            arts[id] = {
                file: resized[0],
                position: position,
                ratio: ratio,
                choosen_by: _this.props.mother_this.props.board_this.state.user_id,
                width: resized[1],
                height: resized[2],
            }
            Promise.all([
                _this.props.mother_this.props.board_this.ChooseArtsTexts([],[],_this.props.mother_state.current_image, _this.props.mother_state.current_text),
                _this.props.mother_this.props.board_this.AddArts([arts[id]],[id]),
                _this.props.mother_this.setState({arts:arts, control_state:'control_object', action:'idle', current_image: [id], current_text:[],
                current_selected_pos: position, current_selected_ratio: ratio})
            ])
        }


        // arts[id] = {
        //     file: val[0],
        //     position: []
        //     ratio: ,
        //     choosen_by: this.props.mother_this.props.board_this.state.user_id
        // }

    }

    renderGradientFromDistance(distance){
        var colormap = interpolate(['#ffbb00', '#0069c4'])
        // console.log(distance)
        distance = JSON.parse(distance)
        return distance.map((val, idx)=>{
            // console.log(val)
            var color = colormap(val)
            return (<stop offset={(10*idx)+'%'} style={{stopColor: color, stopOpacity: 1}}></stop>)
        })
    }

    renderSearchSliders(){
        var higher_groups = {}
        for(var i in this.props.mother_state.groups){
            var group = this.props.mother_state.groups[i]
            if(higher_groups[group.higher_group]==undefined){
                higher_groups[group.higher_group] = []
            }
            higher_groups[group.higher_group].push(group._id)
        }
        
        return Object.keys(higher_groups).map((hkey, kidx)=>{
            var groups_in_h = higher_groups[hkey]
            return (<div style={{paddingBottom: '5px', borderBottom: 'solid 2px white'}}>
            
                {groups_in_h.map((key, idx)=>{
                    var group = this.props.mother_state.groups[key]
                    var val = this.props.mother_state.search_slider_values[key]
                    if(val==undefined){
                        val = 0
                    }else{
                        val = val * 100
                    }
                    // var group_name2
                    // if(higher_groups[group.higher_group].length==2 && higher_groups[group.higher_group][1]==group._id){
                    //     return
                    // }else if(higher_groups[group.higher_group].length==2 && higher_groups[group.higher_group][0]==group._id){
                    //     group_name2 = this.props.mother_state.groups[higher_groups[group.higher_group][1]].group_name
                    // }
                    var distance = this.props.mother_state.search_slider_distances[key]
                    if(distance == undefined){
                        distance = [0,0,0,0,0,0,0,0,0,0,0]
                    }
                    // console.log(distance, kidx)
                    distance = JSON.stringify(distance)

                    
                    return (<div key={'slider_'+group._id}>
                        
                        { 
                        <div style={{position: 'relative'}}>
                            <div style={{display:'inline-block', float:'right'}}>More</div>
                            <div style={{display:'inline-block'}}>{group.group_name}</div>
                            <div style={{display:'inline-block', float:'left'}}>Less</div>
                        </div>
                            }
                        <div style={{width: '100%', position:'relative'}}>
                            <svg width='100%' height='12px' preserveAspectRatio="none" viewBox="0 0 300 12" style={{display:'inline-block',position:'absolute', left:0, bottom: 2}}>
                                <defs>
                                    <linearGradient id={'grad'+kidx+'_'+idx} x1="0%" y1="0%" x2="100%" y2="0%">
                                    {this.renderGradientFromDistance(distance)}
                                    </linearGradient>
                                </defs>
                            <rect fill={'url(#grad'+kidx+'_'+idx+')'} style={{width:'100%', height:'100%'}}></rect>
                            </svg>
                            <input type='range' style={{margin: '5px 0'}} min={-100} max={100} value={val} onChange={this.changeSliders.bind(this, group._id)} onPointerUp={this.doneChangeSliders.bind(this, group._id)}></input>
                        </div>
                        
                        
                    </div>)
                })}
            </div>)
        })
    }

    renderGenerateSliders(){
        if(this.props.mother_state.generate_slider_values!=undefined){
            var val = this.props.mother_state.generate_slider_values['selected_image']
            if(val==undefined){
                val = 0
            }else{
                val = val * 100
            }
            return (<div>
                <div style={{borderBottom: 'solid 2px white', paddingBottom: '3px'}}>
                    <div>
                        <div style={{display:'inline-block', float:'right'}}>1</div>
                        <div style={{display:'inline-block'}}>Selected Img</div>
                        <div style={{display:'inline-block', float:'left'}}>0</div>
                    </div>
                    <div>
                        <input type='range' style={{margin: '5px 0'}} min={0} max={100} value={val} onChange={this.changeGenSliders.bind(this, 'selected_image')} onPointerUp={this.doneChangeGenSliders.bind(this, 'selected_image')}></input>
                    </div>
                </div>
                {this.renderGenerateSlidersFromGroups()}
                    
            </div>)
        }
        

    }

    renderGenerateSlidersFromGroups(){
        var higher_groups = {}
        for(var i in this.props.mother_state.groups){
            var group = this.props.mother_state.groups[i]
            if(higher_groups[group.higher_group]==undefined){
                higher_groups[group.higher_group] = []
            }
            higher_groups[group.higher_group].push(group._id)
        }
        // console.log(higher_groups)
        return Object.keys(higher_groups).map((hkey, kidx)=>{
            var groups_in_h = higher_groups[hkey]
            // console.log(groups_in_h)
            return (<div style={{borderBottom: 'solid 2px white', paddingBottom: '3px'}}>
                {groups_in_h.map((key, idx)=>{
                    var group = this.props.mother_state.groups[key]
                    // console.log(key, group)
                    var val = this.props.mother_state.generate_slider_values[key]
                    if(val==undefined){
                        val = 0
                    }else{
                        val = val * 100
                    }
                    return (<div key={'gen_slider_'+group._id}>
                        <div>
                            <div style={{display:'inline-block', float:'right'}}>1</div>
                            <div style={{display:'inline-block'}}>{group.group_name}</div>
                            <div style={{display:'inline-block', float:'left'}}>0</div>
                        </div>
                        <div>
                            <input type='range' style={{margin: '5px 0'}} min={0} max={100} value={val} onChange={this.changeGenSliders.bind(this, group._id)} onPointerUp={this.doneChangeGenSliders.bind(this, group._id)}></input>
                        </div>
                    </div>)
                })}
            </div>)
        })

        // return Object.keys(this.props.mother_state.groups).map((key, idx)=>{
        //     var group = this.props.mother_state.groups[key]
        //     var val = this.props.mother_state.generate_slider_values[key]
        //     if(val==undefined){
        //         val = 0
        //     }else{
        //         val = val * 100
        //     }
        //     return (<div key={'gen_slider_'+group._id}>
        //         <div>
        //             <div style={{display:'inline-block', float:'right'}}>1</div>
        //             <div style={{display:'inline-block'}}>{group.group_name}</div>
        //             <div style={{display:'inline-block', float:'left'}}>0</div>
        //         </div>
        //         <div>
        //             <input type='range' style={{margin: '5px 0'}} min={0} max={100} value={val} onChange={this.changeGenSliders.bind(this, group._id)} onPointerUp={this.doneChangeGenSliders.bind(this, group._id)}></input>
        //          </div>
        //     </div>)
        // })


    }

    renderSearchedArts(){
        var searched_arts = Object.keys(this.props.mother_state.searched_arts).map((key, idx)=>{
            var searched_art = this.props.mother_state.searched_arts[key]
            return [key, searched_art.image, searched_art.order]
        })

        searched_arts.sort(function(first, second){
            return parseInt(first[2])-parseInt(second[2])
        })
        // console.log(searched_arts)

        return searched_arts.map((val,idx)=>{
            return (<div style={{display:'block', width:'fit-content', padding: '3px', position: 'relative', height: '100%', height:'100%'}}>
                <div className='btn' style={{position: 'absolute', top: '10px', right: '10px', width:'30px', height:'30px', fontSize:'30', lineHeight:'26px', padding: 0}}
                    onPointerDown={this.addSearchedImageToMoodboard.bind(this, val)}
                >+</div>
                <img src={val[1]} style={{ maxWidth: '100%', maxHeight:'100%'}}></img>
            </div>)
        })
        // return Object.keys(this.props.mother_state.searched_arts).map((key, idx)=>{
        //     var searched_art = this.props.mother_state.searched_arts[key]

        //     return (<div style={{display:'inline-block', height: 'calc(100% - 6px)', padding: '3px'}}>
        //         <img src={searched_art.image} style={{height: '100%'}}></img>
        //     </div>)
        // })
    }

    searchWheel(e){
        e.stopPropagation()
        // console.log(e.target.value)
        clearTimeout(this.state.scrollTimeOut)
        // if(this.state.scrollTimeOut!= undefined){
        //     clearTimeout(this.state.scrollTimeOut)
        //     this.setState({scrollTimeOut: undefined})
        // }
        var _this = this
        var scrollTimeOut = setTimeout(function(){
            var scrolled = document.getElementById('moodboard_searched_results')
            if(scrolled!=undefined){
                console.log(scrolled.scrollTop/scrolled.scrollHeight)
                Api.app.service('boards').patch(_this.props.mother_this.props.board_this.state.board_id, {$set: {updated:'moodboard_search_scroll', search_scroll: scrolled.scrollTop/scrolled.scrollHeight}})
            }
            
        }, 250)
        this.setState({scrollTimeOut: scrollTimeOut})
    }

    render(){
        var art_exist = true
        var group_exist = true
        var art
        if(this.props.mother_state.search_image_selected==undefined || this.props.mother_state.arts[this.props.mother_state.search_image_selected]==undefined){
            art_exist = false
        }else{
            art = this.props.mother_state.arts[this.props.mother_state.search_image_selected]
        }
        if(Object.keys(this.props.mother_state.groups).length==0){
            group_exist= false
        }

        var dogen = false
        if(this.props.mother_state!=undefined){
            if(this.props.mother_state.generate_slider_values!=undefined){
                for(var k in this.props.mother_state.generate_slider_values){
                    if(this.props.mother_state.generate_slider_values[k]!=0){
                        dogen=true
                        break
                    }
                }
            }
        }
        
        

        var paddingTop = 0

        if(document.getElementById('moodboard')!=undefined){
            paddingTop = document.getElementById('moodboard').offsetHeight * 0.42 * 0.5 -32
        }
        
        if(this.props.mother_state.searchPane){
            return (<div className='moodboard_search_pane controller'>
                {this.props.mother_state.searching && <div
                    style={{borderRadius: '10px', position:'absolute', left: 0, top: 0, width:'100%', height: '100%',  paddingTop: paddingTop, backgroundColor: 'rgba(255,255,255,0.8)', zIndex:10000}}>
                        <div style={{display:'block', margin: 'auto',}} class="preloader-wrapper big active">
                            <div class="spinner-layer spinner-blue">
                                <div class="circle-clipper left">
                                <div class="circle"></div>
                                </div><div class="gap-patch">
                                <div class="circle"></div>
                                </div><div class="circle-clipper right">
                                <div class="circle"></div>
                                </div>
                            </div>

                            <div class="spinner-layer spinner-red">
                                <div class="circle-clipper left">
                                <div class="circle"></div>
                                </div><div class="gap-patch">
                                <div class="circle"></div>
                                </div><div class="circle-clipper right">
                                <div class="circle"></div>
                                </div>
                            </div>

                            <div class="spinner-layer spinner-yellow">
                                <div class="circle-clipper left">
                                <div class="circle"></div>
                                </div><div class="gap-patch">
                                <div class="circle"></div>
                                </div><div class="circle-clipper right">
                                <div class="circle"></div>
                                </div>
                            </div>

                            <div class="spinner-layer spinner-green">
                                <div class="circle-clipper left">
                                <div class="circle"></div>
                                </div><div class="gap-patch">
                                <div class="circle"></div>
                                </div><div class="circle-clipper right">
                                <div class="circle"></div>
                                </div>
                            </div>
                            </div>
                    </div>}
                <div className='moodboard_search_pane_close' style={{marginBottom: '5px'}} onPointerDown={this.toggleSearchPane.bind(this)}>
                ▽ Collaborative Search
                </div>
                <div className='row' style={{position:'relative'}}>
                    <div className='col s3 moodboard_search_pane_subpane' style={{textAlign:'center'}}>
                        {art_exist && <div className='moodboard_search_pane_subpane_div'>
                            <div style={{position: 'relative', height: 'calc(100% - 40px)'}}>
                                <img src={art.file} style={{maxHeight: '100%', maxWidth: '100%'}}></img>
                            </div>
                            {this.props.mother_state.control_state!='search_image_select' &&
                                <div className='btn' onPointerDown={this.selectSearchImageChoose.bind(this)}>Select Image</div>
                            }
                            {this.props.mother_state.control_state=='search_image_select' &&
                                <div className='btn red' onPointerDown={this.cancelSearchImageChoose.bind(this)}>Cancel</div>
                            }
                        </div>}
                        {!art_exist && <div className='moodboard_search_pane_subpane_div'>
                            <div>Select an art before performing the search.</div>
                            {this.props.mother_state.control_state!='search_image_select' &&
                                <div className='btn' onPointerDown={this.selectSearchImageChoose.bind(this)}>Select Image</div>
                            }
                            {this.props.mother_state.control_state=='search_image_select' &&
                                <div className='btn red' onPointerDown={this.cancelSearchImageChoose.bind(this)}>Cancel</div>
                            }
                            
                        </div>}
                    </div>
                    <div className='col s3 moodboard_search_pane_subpane' style={{textAlign:'center'}}>
                        {group_exist && <div style={{position: 'absolute', top: '-30px'}}>
                            <div className='btn tiny-btn search-panel-tab' style={{marginRight:'3px', backgroundColor: (this.props.mother_state.searchMode!='search')?'#333333':'#888888'}} 
                            disabled={(!art_exist||!group_exist)} onPointerUp={this.searchModeToggle.bind(this, 'search')}>Search</div>
                            <div className='btn tiny-btn search-panel-tab' style={{marginRight:'3px', backgroundColor: (this.props.mother_state.searchMode=='search')?'#333333':'#888888'}}
                            disabled={(!art_exist||!group_exist)} onPointerUp={this.searchModeToggle.bind(this, 'generate')}>Generate</div>
                        </div>}
                        <div style={{position:'absolute', top: '-8px', height: '3px', width: '133px', backgroundColor: '#888888'}}></div>
                        {group_exist && <div className='moodboard_search_pane_subpane_div' style={{overflowY: 'auto'}} onWheel={this.searchWheel.bind(this)}>
                            <div style={{borderBottom: 'solid 2px white'}}>{(this.props.mother_state.searchMode=='search')?'Search':'Gen'} Controls</div>
                            <div>{this.props.mother_state.searchMode=='search' &&
                                this.renderSearchSliders()
                            } 
                            {this.props.mother_state.searchMode=='generate' &&
                                this.renderGenerateSliders()
                            }</div>
                        </div>}
                        {!group_exist && <div className='moodboard_search_pane_subpane_div'>
                            Define group(s) before performing the search.
                        </div>}
                    </div>
                    <div className='col s6 moodboard_search_pane_subpane' style={{position:'relative'}}>
                        <div style={{position: 'absolute', top: '-30px'}}>
                            {this.props.mother_state.searchMode=='search' && (art_exist&&group_exist) && <div className='btn tiny-btn' onPointerUp={this.search.bind(this)}>Run Search</div>}
                            {this.props.mother_state.searchMode=='generate' && (art_exist&&group_exist) && <div className='btn tiny-btn' onPointerUp={this.generate.bind(this)} disabled={!dogen}>Run Generation</div>}
                        </div>
                        <div style={{position: 'absolute', top: '-30px', right: '13'}}>
                            {this.props.mother_state.searchMode=='search' && art_exist && <div className='btn tiny-btn' style={{marginRight:'5px'}} onPointerUp={this.search_similar.bind(this)}>Similar</div>}
                            {this.props.mother_state.searchMode=='search' && <div className='btn tiny-btn' onPointerUp={this.search_random.bind(this)}>Random</div>}
                            {this.props.mother_state.searchMode=='generate' && art_exist && !group_exist && <div className='btn tiny-btn' style={{marginRight:'5px'}} onPointerUp={this.search_similar.bind(this)}>Similar</div>}
                            {this.props.mother_state.searchMode=='generate' && (!art_exist||!group_exist) && <div className='btn tiny-btn' onPointerUp={this.search_random.bind(this)}>Random</div>}
                        </div>
                        <div id="moodboard_searched_results" className='moodboard_search_pane_subpane_div' style={{overflowY: 'auto'}} onWheel={this.searchWheel.bind(this)}>
                            {this.renderSearchedArts()}
                        </div>
                    </div>
                </div>
                
            </div>)
        }else{
            return (<div className='moodboard_search_pane_open controller' onPointerDown={this.toggleSearchPane.bind(this)}>
                △ Collaborative Search
            </div>)
        }
       
    }
}

export default MoodBoardSearchPaneAI