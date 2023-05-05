import React, {Component} from 'react'


class MoodBoardMainController extends Component{

    changeControlState(control_state){
        if(this.props.mother_state.control_state=='content-stamp' || this.props.mother_state.control_state=='style-stamp'){
            this.props.mother_this.props.board_this.sketchpad.setState({control_state:'move'})
        }
        
        if(true){
            console.log(control_state)
            if(control_state!='control_object'){
                var arts = this.props.mother_state.arts
                for(var i in this.props.mother_state.current_image){
                    arts[this.props.mother_state.current_image[i]].choosen_by=''
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
                this.props.mother_this.setState({arts:arts})
                promises.push(this.props.mother_this.props.board_this.UpdateArtsTexts([],[], replace_texts, replace_text_ids))
                if(del_texts.length>0){
                    promises.push(this.props.mother_this.props.board_this.RemoveArtsTexts([], del_texts))
                }
                promises.push(this.props.mother_this.setState({current_image:[], current_text:[], current_selected_pos: undefined, current_selected_ratio: undefined}))
                Promise.all(promises)
                
            }
            this.props.mother_this.setState({control_state: control_state})
        }
        

    }

    
    render(){
        return (<div className='controller moodboard_main_controller'>
            <div className='controller_button' style={{color: (this.props.mother_state.control_state=='add_image')?'white':'#888888'}}
                onClick={this.changeControlState.bind(this, 'add_image')}>
                <i className="controller_button_icon material-icons">image</i>
            </div>
            {/* <div className='controller_button' style={{color: (this.props.mother_state.control_state=='add_comment')?'white':'#888888'}}
                onClick={this.changeControlState.bind(this, 'add_comment')}>
                <i className="controller_button_icon material-icons">comment</i>
            </div> */}
            <div className='controller_button' style={{color: (this.props.mother_state.control_state=='add_text')?'white':'#888888'}}
                onClick={this.changeControlState.bind(this, 'add_text')}>
                <i className="controller_button_icon material-icons">title</i>
            </div>
            <div className='controller_button' style={{color: (this.props.mother_state.control_state=='add_color')?'white':'#888888'}}
                onClick={this.changeControlState.bind(this, 'add_color')}>
                <i className="controller_button_icon material-icons">color_lens</i>
            </div>
            <div className='controller_button' style={{color: (this.props.mother_state.control_state=='control_object')?'white':'#888888'}}
                onClick={this.changeControlState.bind(this, 'control_object')}>
                <i className="controller_button_icon fa fa-mouse-pointer"></i>
            </div>
        </div>)
    }
}

export default MoodBoardMainController