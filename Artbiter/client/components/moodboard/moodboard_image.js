import React, {Component} from 'react'

class MoodboardImage extends Component{

    test(e){
        e.stopPropagation();
    }

    select_new_image(obj_moving, e){
        var arts = this.props.mother_state.arts
        if(arts[this.props.art_key].choosen_by==''){
            var pos = arts[this.props.art_key].position.slice()
            var ratio = arts[this.props.art_key].ratio
            console.log(ratio)
            var _this = this

            if(arts[this.props.art_key].color!=undefined){
                this.props.mother_this.setState({color: arts[this.props.art_key].color})
            }
            var board_state = this.props.mother_this.props.board_this.state
            console.log(board_state.user_id)
            arts[this.props.art_key].choosen_by = board_state.user_id
            for(var i in this.props.mother_state.current_image){
                arts[this.props.mother_state.current_image[i]].choosen_by = ''
            }
            Promise.all([
                this.props.mother_this.props.board_this.ChooseArtsTexts([this.props.art_key],[],this.props.mother_state.current_image.slice(0),this.props.mother_state.current_text.slice(0)),
                this.props.mother_this.setState({arts:arts, current_image:[this.props.art_key], current_text:[], current_selected_pos: pos, current_selected_ratio: ratio}, function(){
                    if(obj_moving){
                        _this.props.mother_this.object_moving_init(e)
                    }
                    _this.props.mother_this.props.board_this.sketchpad.setState({})
                })
            ])
            
        }
        
    }

    add_an_image(obj_moving, e){
        var arts = this.props.mother_state.arts
        if(arts[this.props.art_key].choosen_by==''){
            var texts = this.props.mother_state.texts
            var pos = [Number.MAX_VALUE, Number.MAX_VALUE, Number.MIN_VALUE, Number.MIN_VALUE]
            var current_image = this.props.mother_state.current_image
            var current_text = this.props.mother_state.current_text
            current_image.push(this.props.art_key)
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
            for (var i in current_text){
                var key = current_text[i]
                var cur_pos = texts[key].position.slice()
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
            var ratio = (pos[2]-pos[0])/(pos[3]-pos[1])

            var board_state = this.props.mother_this.props.board_this.state
            console.log(board_state.user_id)
            arts[this.props.art_key].choosen_by = board_state.user_id
            
            Promise.all([
                this.props.mother_this.props.board_this.ChooseArtsTexts([this.props.art_key],[], [],[]),
                this.props.mother_this.setState({arts: arts, current_image:current_image, current_selected_pos: pos, current_selected_ratio: ratio}, function(){
                    if(obj_moving){
                        _this.props.mother_this.object_moving_init(e)
                    }
                    _this.props.mother_this.props.board_this.sketchpad.setState({})
                })
            ])
            
        }
        

    }

    deselect_image(e){
        // e.stopPropagation()
        var arts = this.props.mother_state.arts
        console.log(arts[this.props.art_key].choosen_by, this.props.mother_this.props.board_this.state.user_id)
        if(arts[this.props.art_key].choosen_by==this.props.mother_this.props.board_this.state.user_id){
            var pos = arts[this.props.art_key].position.slice()
            var ratio = arts[this.props.art_key].ratio
            console.log(ratio)
            var _this = this

            if(arts[this.props.art_key].color!=undefined){
                this.props.mother_this.setState({color: arts[this.props.art_key].color})
            }

            var texts = this.props.mother_state.texts
            var current_image = this.props.mother_state.current_image
            var current_text = this.props.mother_state.current_text
            current_image.splice(current_image.indexOf(this.props.art_key), 1)

            
            if(current_image.length>0){
                pos = [Number.MAX_VALUE, Number.MAX_VALUE, Number.MIN_VALUE, Number.MIN_VALUE]
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
                for (var i in current_text){
                    var key = current_text[i]
                    var cur_pos = texts[key].position.slice()
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
                var ratio = (pos[2]-pos[0])/(pos[3]-pos[1])
            }
            arts[this.props.art_key].choosen_by= ''

            if(current_image.length==0){
                Promise.all([
                    this.props.mother_this.props.board_this.ChooseArtsTexts([],[],[this.props.art_key],[]),
                    this.props.mother_this.setState({arts:arts, current_image:current_image, current_selected_pos: pos, current_selected_ratio: ratio}, function(){
                        _this.props.mother_this.props.board_this.sketchpad.setState({})
                    })
                ])
            }else{
                Promise.all([
                    this.props.mother_this.props.board_this.ChooseArtsTexts([],[],[this.props.art_key],[]),
                    this.props.mother_this.setState({current_image:current_image, current_selected_pos:pos, current_selected_ratio: ratio, current_selected_pos: pos, current_selected_ratio: ratio}, function(){
                        _this.props.mother_this.props.board_this.sketchpad.setState({})
                    })
                ])
            }
            
            
        }
    }

    choose_image(e){
        
        // console.log('this???')
        if(this.props.mother_state.control_state!='crop'){
            e.stopPropagation()
            // console.log('look',this.props.mother_state.control_state, this.props.mother_state.action)
            var ecopied = {pageX: e.pageX, pageY: e.pageY}
            if(this.props.mother_state.action!='object_moving'&&this.props.mother_state.action!='object_resizing'){
                // console.log(this.props.mother_state.current_image.indexOf(this.props.art._id))
                if(this.props.mother_state.control_state=='control_object'){
                    if(this.props.mother_state.current_image.length==0 && this.props.mother_state.current_text.length==0){
                        // this.select_new_image(true, ecopied)
                        if(this.props.art.choosen_by==this.props.mother_this.props.board_this.state.user_id){
                            // console.log('ddd')
                            this.deselect_image(ecopied)
                        }else{
                            this.select_new_image(true, ecopied)
                        }
                    }else if(this.props.mother_state.current_image.indexOf(this.props.art._id)!=-1){
                        // console.log('deselect')
                        this.deselect_image(ecopied)
                    }else if(this.props.mother_state.shift_down==false){
                        this.select_new_image(true, ecopied)
                    }else{
                        this.add_an_image(true, ecopied)
                    }
                    
                }else if(this.props.mother_state.control_state=='content-stamp'){
                    // console.log('yeah')
                    this.select_new_image(false, ecopied)
                }
            }else if(this.props.mother_state.action=='object_moving'){
                
                if(this.props.mother_state.current_image.indexOf(this.props.art._id)!=-1&&this.state.remove){
                    // console.log('deselect')
                    var cur_mouse_pos = this.props.mother_this.getCurrentMouseOnBoard(e)
                    if(this.props.mother_state.init_mouse_pos[0]==cur_mouse_pos[0]&&this.props.mother_state.init_mouse_pos[1]==cur_mouse_pos[1]){
                        if(this.props.mother_state.current_image.length==1){
                            this.deselect_image(ecopied)
                        }else if(this.props.mother_state.shift_down){
                            this.deselect_image(ecopied)
                        }
                        
                    }
                    
                }
                this.props.mother_this.object_moving_end(e)
            }else if(this.props.mother_state.action=='object_resizing'){
                this.props.mother_this.end_object_resizing(e)
            }
            this.setState({remove:false})
        }
        // else if(this.props.mother_state.action=='crop'){
        //     this.endCropMove(e)
        // }
        
        
    }

    object_moving_init(e){
        // console.log('here????')
        if(this.props.mother_state.control_state!='crop'){
            if(this.props.mother_state.action!='object_moving'){
                this.setState({remove:true})
                this.props.mother_this.object_moving_init(e)
            }
        }else{
            if(this.props.mother_state.action=='idle'){
                // when cropping...
                var p = this.props.mother_this.getCurrentMouseOnBoard(e)
                console.log(p)
                console.log('heeey')
                var x = (p[0]-this.props.art.position[0])/(this.props.art.position[2]-this.props.art.position[0])
                var y = (p[1]-this.props.art.position[1])/(this.props.art.position[3]-this.props.art.position[1])
                this.props.mother_this.setState({action:'crop', crop: [x,y,x,y]})
            }
            
            
        }
        
    }

    // cropMove(e){
    //     console.log('move?')
    //     if(this.props.mother_state.control_state=='crop' && this.props.mother_state.action=='crop'){
    //         var p = this.props.mother_this.getCurrentMouseOnBoard(e)
            
    //         var x = (p[0]-this.props.art.position[0])/(this.props.art.position[2]-this.props.art.position[0])
    //         var y = (p[1]-this.props.art.position[1])/(this.props.art.position[3]-this.props.art.position[1])
    //         this.props.art.crop[2] = x
    //         this.props.art.crop[3] = y
    //         console.log('cropmove..')
    //         this.props.mother_this.setState({arts:this.props.mother_state.arts})
    //     }
    // }
    // endCropMove(e){
    //     console.log('end crop move')
    //     if(this.props.mother_state.action=='crop'){
    //         var p = this.props.mother_this.getCurrentMouseOnBoard(e)
            
    //         var x = (p[0]-this.props.art.position[0])/(this.props.art.position[2]-this.props.art.position[0])
    //         var y = (p[1]-this.props.art.position[1])/(this.props.art.position[3]-this.props.art.position[1])
    //         if(x>1){
    //             x=1
    //         }
    //         if(x<0){
    //             x=0
    //         }
    //         if(y>1){y=1}
    //         if(y<0){y=0}
    //         if(this.props.art.crop[0]>x){
    //             this.props.art.crop[2]=this.props.art.crop[0]
    //             this.props.art.crop[0]=x
    //         }else{
    //             this.props.art.crop[2]=x
    //         }
    //         if(this.props.art.crop[1]>y){
    //             this.props.art.crop[3]=this.props.art.crop[1]
    //             this.props.art.crop[1]=y
    //         }else{
    //             this.props.art.crop[3]=y
    //         }

    //         if(this.props.art.crop[0]==this.props.art.crop[2] && this.props.art.crop[1]==this.props.art.crop[3]){
    //             this.props.art.crop = [0,0,1,1]
    //         }
    //         // this.props.art.crop[2] = x
    //         // this.props.art.crop[3] = y
    //         console.log('cropmoveend..')
    //         this.props.mother_this.setState({action:'idle'})
    //     }
        
    // }

    object_moving_end(e){
        
        if(this.props.mother_state.action=='object_moving'){
            if(e!=undefined){
                e.stopPropagation()
            }
            this.props.mother_this.object_moving_end(e)
        }
        // else if(this.props.mother_state.action=='crop'){
        //     this.endCropMove(e)
        // }
    }

    toCropMode(e){
        e.stopPropagation()
        this.props.mother_this.setState({control_state:'crop'})
    }

    endCropMode(e){
        e.stopPropagation()
        // update the style and embedding
        var canvas = document.createElement('canvas')
        var art = this.props.art
        var arts = this.props.mother_state.arts
        if(this.props.mother_state.crop==undefined){
            this.props.mother_this.setState({control_state:'control_object'})
            return
        }
        canvas.width = art.width*(this.props.mother_state.crop[2]-this.props.mother_state.crop[0])
        canvas.height = art.height*(this.props.mother_state.crop[3]-this.props.mother_state.crop[1])

        if(canvas.width==undefined){canvas.width=128}
        if(canvas.height==undefined){canvas.height=128}

        var im = new Image;
        var _this = this

        var x1 = art.position[0]+(art.position[2]-art.position[0])*this.props.mother_state.crop[0]
        var x2 = art.position[0] + (art.position[2]-art.position[0])*this.props.mother_state.crop[2]
        var y1 = art.position[1]+(art.position[3]-art.position[1])*this.props.mother_state.crop[1]
        var y2 = art.position[1] + (art.position[3]-art.position[1])*this.props.mother_state.crop[3]
        if(this.props.mother_state.crop[0]==0 && this.props.mother_state.crop[1]==0 && this.props.mother_state.crop[2]==1 && this.props.mother_state.crop[3]==1){
            console.log('hup')
            this.props.mother_this.setState({control_state:'control_object'})
            return
        }
        im.onload = function(){
            console.log('dims', art.width*_this.props.mother_state.crop[0], art.height*_this.props.mother_state.crop[1],canvas.width, canvas.height)
            canvas.getContext('2d').drawImage(im, art.width*_this.props.mother_state.crop[0], art.height*_this.props.mother_state.crop[1],canvas.width, canvas.height, 0, 0, canvas.width, canvas.height)
            var id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            var newImage = canvas.toDataURL()
            console.log(im, newImage)
            arts[id] ={
                file: newImage,
                ratio: canvas.width/canvas.height,
                choosen_by: _this.props.mother_this.props.board_this.state.user_id,
                width: (_this.props.mother_state.crop[2]-_this.props.mother_state.crop[0]) * art.width,
                height: (_this.props.mother_state.crop[3]-_this.props.mother_state.crop[1]) * art.height, 
                position: [x1, y1, x2, y2],
            }
            arts[_this.props.art_key].choosen_by = ''
            Promise.all([
                _this.props.mother_this.props.board_this.ChooseArtsTexts([],[],_this.props.mother_state.current_image, _this.props.mother_state.current_text),
                _this.props.mother_this.props.board_this.AddArts([arts[id]],[id]),
                _this.props.mother_this.setState({arts:arts, control_state:'control_object', action:'idle', crop:undefined, current_image: [id], current_text:[],
                current_selected_pos: [x1, y1, x2, y2], current_selected_ratio: canvas.width/canvas.height})
            ])
            
        }
        im.src = art.file

        this.props.mother_this.setState({control_state:'control_object'})
    }

    renderCropButton(x, y){
        return (<g>
            <rect x={x-2} y={y-20} width={34} height={20} fill='white' stroke='black' onPointerDown={this.toCropMode.bind(this)}></rect>
            <text x={x} y={y-5} onPointerDown={this.toCropMode.bind(this)}>Crop</text>    
        </g>)
    }

    renderCropDoneButton(x, y){
        return (<g>
            <rect x={x-2} y={y-20} width={34} height={20} fill='white' stroke='black' onPointerDown={this.endCropMode.bind(this)}></rect>
            <text x={x} y={y-5} onPointerDown={this.endCropMode.bind(this)}>Done</text>    
        </g>)
    }

    renderCropBoundary(x, y, width, height){
        var crop = this.props.mother_state.crop 
        if(crop==undefined){
            crop = [0,0,1,1]
        }
        var smallx = (crop[0]>crop[2])?crop[2]:crop[0]
        var bigx = (crop[0]>crop[2])?crop[0]:crop[2]
        var smally = (crop[1]>crop[3])?crop[3]:crop[1]
        var bigy = (crop[1]>crop[3])?crop[1]:crop[3]



        return (
        <g>
            <rect style={{pointerEvents:'none'}} fill='transparent' stroke='white' strokeWidth='3' x={x+smallx*width} y={y+smally*height} width={width*(bigx-smallx)} height={height*(bigy-smally)}></rect>
            <rect style={{pointerEvents:'none'}} fill='transparent' stroke='red' strokeWidth='1' x={x+smallx*width} y={y+smally*height} width={width*(bigx-smallx)} height={height*(bigy-smally)}></rect>
        </g>)
    }

    render(){
        var smallx = (this.props.art.position[0]<this.props.art.position[2])?this.props.art.position[0]:this.props.art.position[2]
        var bigx = (this.props.art.position[0]>this.props.art.position[2])?this.props.art.position[0]:this.props.art.position[2]
        var smally = (this.props.art.position[1]<this.props.art.position[3])?this.props.art.position[1]:this.props.art.position[3]
        var bigy = (this.props.art.position[1]>this.props.art.position[3])?this.props.art.position[1]:this.props.art.position[3]
        var x = smallx* this.props.boardlength
        var y = smally* this.props.boardlength

        var width = (bigx-smallx)* this.props.boardlength
        var height = (bigy-smally)* this.props.boardlength

        var color = ''
        if(this.props.art.choosen_by==this.props.mother_this.props.board_this.state.user_id){
            color = '#aaaaff'
        }else if(this.props.art.choosen_by!=''){
            if(this.props.mother_this.props.board_this.state.collaborator_dict[this.props.art.choosen_by]!=undefined){
                color = this.props.mother_this.props.board_this.state.collaborator_dict[this.props.art.choosen_by].color
            }
            
        }
        // console.log(this.props.art)
        return (<g onPointerDown={this.test.bind(this)}>
            <image href={this.props.art.file} x={x} y={y} width={width} height={height}  onPointerDown={this.choose_image.bind(this)} onPointerUp={this.object_moving_end.bind(this)} opacity={(this.props.art.enabled)?'1':'0.3'}></image>
            {this.props.art.enabled && this.props.mother_state.control_state=='control_object' && this.props.mother_state.current_image.length==1 && this.props.mother_state.current_image[0]==this.props.art_key && this.props.mother_state.current_text.length==0 && this.props.mother_state.control_state!='crop' && 
            this.renderCropButton(x, y)
            }
            {this.props.art.enabled && this.props.mother_state.control_state=='crop' && this.props.mother_state.current_image.length==1 && this.props.mother_state.current_image[0]==this.props.art_key && this.props.mother_state.current_text.length==0 && 
            this.renderCropDoneButton(x, y)
            }
            
            {color!='' && <g>
            <rect onPointerDown={this.object_moving_init.bind(this)} onPointerUp={this.choose_image.bind(this, false)} x={x-2} y={y-2} width={width+4} height={height+4} stroke={color} fill='transparent' strokeWidth='2' onPointerUp={this.choose_image.bind(this)}></rect>
            </g>}
            {this.props.mother_state.current_image.length==1 && this.props.mother_state.current_image[0]==this.props.art_key && this.props.mother_state.current_text.length==0 && this.props.mother_state.control_state=='crop' && 
            this.renderCropBoundary(x, y, width, height)
            }
            
        </g>)
    }
}

export default MoodboardImage;