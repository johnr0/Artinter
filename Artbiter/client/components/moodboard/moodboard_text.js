import React, {Component} from 'react'

class MoodBoardText extends Component{
    updateText(e){
        var texts = this.props.mother_state.texts
        var smallx = (this.props.text.position[0]<this.props.text.position[2])?this.props.text.position[0]:this.props.text.position[2]
        var bigx = (this.props.text.position[0]>this.props.text.position[2])?this.props.text.position[0]:this.props.text.position[2]
        var smally = (this.props.text.position[1]<this.props.text.position[3])?this.props.text.position[1]:this.props.text.position[3]
        var bigy = (this.props.text.position[1]>this.props.text.position[3])?this.props.text.position[1]:this.props.text.position[3]

        texts[this.props.text_key].text = e.target.value;
        var _this = this
        var new_text = texts[this.props.text_key]
        this.props.mother_this.setState({texts:texts}, function(){
            // resize textbox
            console.log(_this.props.text_key)
            document.getElementById('textarea_'+_this.props.text_key).style.height='1px'
            document.getElementById('textarea_'+_this.props.text_key).style.width='1px'
            // document.get
            var innerWidth = document.getElementById('textarea_'+_this.props.text_key).scrollWidth
            var innerHeight = document.getElementById('textarea_'+_this.props.text_key).scrollHeight
            console.log(innerWidth, innerHeight)
            innerWidth = innerWidth/_this.props.boardlength
            innerHeight = innerHeight/_this.props.boardlength
            console.log(innerWidth, innerHeight)
            texts[_this.props.text_key].position = [smallx, smally, smallx+innerWidth, smally+innerHeight]
            texts[_this.props.text_key].ratio = innerWidth/innerHeight
            texts[_this.props.text_key].height_font_ratio = texts[_this.props.text_key].fontsize/innerHeight
            document.getElementById('textarea_'+_this.props.text_key).style.height='100%'
            document.getElementById('textarea_'+_this.props.text_key).style.width='100%'
            // console.log(_this.state.current_selected_pos)
            _this.props.mother_this.setState({texts: texts, current_selected_pos: [smallx, smally, smallx+innerWidth, smally+innerHeight], current_selected_ratio: innerWidth/innerHeight})
        
        })
        console.log(texts[this.props.text_key].text)
    }

    nullifyMouse(e){
        e.stopPropagation();
    }

    nullifyMouseOnEdit(e){
        if(this.props.edit==true){
            e.stopPropagation();
        }
    }

    select_new_text(e){
        var ecopied = {pageX: e.pageX, pageY: e.pageY}
        var texts = this.props.mother_state.texts
            if(texts[this.props.text_key].choosen_by==''){
                var pos = texts[this.props.text_key].position.slice()
            var ratio = texts[this.props.text_key].ratio
            console.log('sliced', this.props.mother_state.current_image.slice(0))
            var _this = this
            Promise.all([
                // this.props.mother_this
                // this.props.mother_this.props.board_this.ChooseArtsTexts([],[this.props.text_key],this.props.mother_state.current_image.slice(0),this.props.mother_state.current_text.slice(0)),
                this.props.mother_this.props.board_this.ChooseArtsTexts([],[this.props.text_key],this.props.mother_state.current_image.slice(0),this.props.mother_state.current_text.slice(0)),
                this.props.mother_this.setState({current_text:[this.props.text_key], current_image:[], current_selected_pos: pos, current_selected_ratio: ratio}, function(){
                    _this.props.mother_this.object_moving_init(e)
                })
            ])
            
        }
        
    }

    add_a_text(e){
        var arts = this.props.mother_state.arts
        var texts = this.props.mother_state.texts
        var pos = [Number.MAX_VALUE, Number.MAX_VALUE, Number.MIN_VALUE, Number.MIN_VALUE]
        var current_text = this.props.mother_state.current_text
        var current_image = this.props.mother_state.current_image
        current_text.push(this.props.text_key)
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
        
        Promise.all([
            this.props.mother_this.props.board_this.ChooseArtsTexts([],[this.props.text_key], [],[]),
            this.props.mother_this.setState({current_text:current_text, current_selected_pos: pos, current_selected_ratio: ratio}, function(){
                _this.props.mother_this.object_moving_init(e)
            })
        ])
        

    }

    choose_text(e){
        e.stopPropagation()
        var ecopied = {pageX: e.pageX, pageY: e.pageY}
        if(this.props.mother_state.control_state=='control_object'){
            if(this.props.mother_state.current_image.length==0&&this.props.mother_state.current_text.length==0){
                this.select_new_text(ecopied)
            }else if(this.props.mother_state.shift_down==false){
                this.select_new_text(ecopied)
            }else{
                this.add_a_text(ecopied)
            }
            
        }
    }

    object_moving_init(e){
        this.props.mother_this.object_moving_init(e)
    }

    render(){
        var smallx = (this.props.text.position[0]<this.props.text.position[2])?this.props.text.position[0]:this.props.text.position[2]
        var bigx = (this.props.text.position[0]>this.props.text.position[2])?this.props.text.position[0]:this.props.text.position[2]
        var smally = (this.props.text.position[1]<this.props.text.position[3])?this.props.text.position[1]:this.props.text.position[3]
        var bigy = (this.props.text.position[1]>this.props.text.position[3])?this.props.text.position[1]:this.props.text.position[3]
        var x = smallx* this.props.boardlength
        var y = smally* this.props.boardlength

        var width = (bigx-smallx)* this.props.boardlength
        var height = (bigy-smally)* this.props.boardlength

        var fontSize = this.props.text.fontsize*this.props.boardlength

        var color = ''
        if(this.props.text.choosen_by==this.props.mother_this.props.board_this.state.user_id){
            color = '#aaaaff'
        }else if(this.props.text.choosen_by!=''){
            color = this.props.mother_this.props.board_this.state.collaborator_dict[this.props.text.choosen_by].color
        }

        return (<g >
            {this.props.edit && <rect x={x-2} y={y-2} width={width+4} height={height+4} stroke='#aaaaff' fill='transparent' strokeWidth='2'></rect>}
            {color!='' && <rect x={x-2} y={y-2} width={width+4} height={height+4} stroke={color} fill='transparent' strokeWidth='2'></rect>}
            <foreignObject x={x} y={y} width={width} height={height}>
                <div  style={{margin: 0, height: '100%', width: '100%'}} xmlns="http://www.w3.org/1999/xhtml">
                <textarea onPointerDown={this.nullifyMouse.bind(this)} placeholder='type something...' id={'textarea_'+this.props.text_key} onChange={this.updateText.bind(this)} value={this.props.text.text} 
                className={'moodboard_textbox '+((this.props.edit)?"":" select_disabled")} type='text' 
                style={{margin:0, width:'100%', height: '100%', fontSize:fontSize, userSelect: (this.props.edit)?'':'none' }}></textarea>
                    </div>
            </foreignObject>

            {this.props.edit && this.props.mother_state.action=='object_moving' &&
                <rect x={x-2} y={y-2} width={width+4} height={height+4} stroke='transparent' fill='transparent' strokeWidth='2' style={{cursor:'move'}}></rect>
            }

            {this.props.edit && this.props.mother_state.action=='idle' &&
                <g>
                    <rect x={x-2} y={y-2} width={10} height={height+4} stroke='transparent' fill='transparent' strokeWidth='2' style={{cursor:'move'}} onPointerDown={this.object_moving_init.bind(this)}></rect>
                    <rect x={x+width-6} y={y-2} width={10} height={height+4} stroke='transparent' fill='transparent' strokeWidth='2' style={{cursor:'move'}} onPointerDown={this.object_moving_init.bind(this)}></rect>
                    <rect x={x-2} y={y-2} width={width+4} height={10} stroke='transparent' fill='transparent' strokeWidth='2' style={{cursor:'move'}} onPointerDown={this.object_moving_init.bind(this)}></rect>
                    <rect x={x-2} y={y+height-6} width={width+4} height={10} stroke='transparent' fill='transparent' strokeWidth='2' style={{cursor:'move'}} onPointerDown={this.object_moving_init.bind(this)}></rect>
                </g>
            }

            {!this.props.edit && <rect x={x-2} y={y-2} width={width+4} height={height+4} stroke='transparent' fill='transparent' strokeWidth='2'
                onPointerDown={this.choose_text.bind(this)}></rect>}
            
        </g>)
    }
}

export default MoodBoardText