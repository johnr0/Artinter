import React, {Component} from 'react';

class MoodBoardColorAddController extends Component{

    add_color_in_arts(){
        var el = document.createElement('canvas')
        el.width = 224
        el.height = 224
        var canvas = el.getContext('2d')

        canvas.fillStyle=this.color_picker.value
        console.log(this.color_picker.value)
        canvas.fillRect(0,0,224,224)

        var src = el.toDataURL()

        var arts = this.props.mother_state.arts
        var id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        var image=new Image();
        var _this = this
        image.src = src
        image.onload = function(){
            console.log(this.width/this.height)
            arts[id]={
                file: src,
                color: _this.color_picker.value,
                position: undefined, 
                ratio:  this.width/this.height,
                choosen_by: _this.props.mother_this.props.board_this.state.user_id,
            }
            Promise.all([
                _this.props.mother_this.props.board_this.AddArts([arts[id]],[id]),
                _this.props.mother_this.setState({arts:arts, color: _this.color_picker.value, action:'add_color', current_image: [id], current_text:[]})
            ])
            
            console.log('uyay', this.width, this.height)
        }

    }

    render(){
        return(<div className='controller moodboard_color_add_controller'>
            <div style={{display:'inline-block'}}>
                <input ref={c=>this.color_picker=c} type='color' style={{width: '36px', height: '36px'}}>

                </input>
            </div> 
            <div style={{display:'inline-block', verticalAlign: 'bottom'}}>
                <div className='btn' onClick={this.add_color_in_arts.bind(this)}>Add</div>
            </div>
        </div>)
    }
}

export default MoodBoardColorAddController;