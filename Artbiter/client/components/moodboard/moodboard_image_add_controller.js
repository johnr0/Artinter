import React, {Component} from 'react';
import MoodBoardMainController from './moodboard_main_controller';
import M from 'materialize-css/dist/js/materialize.min.js'

class MoodBoardImageAddController extends Component {
    componentDidMount(){
        console.log(document.getElementById('moodboard_image_add_tab'))
        M.Tabs.init(document.querySelector('.tabs'))
    }

    isValidImageURL(str){
        if ( typeof str !== 'string' ) return false;
        return !!str.match(/\w+\.(jpg|jpeg|gif|png|tiff|bmp)$/gi);
    }

    upload_image(){
        var file = document.getElementById('moodboard_image_upload_input').files[0]
        var _this = this
        if(file){
            var reader = new FileReader();
            reader.onload = function(){
                _this.add_image_in_arts(reader.result)
              }
            reader.readAsDataURL(file)
        }
    }

    url_image(){
        var url = document.getElementById('moodboard_image_url_input').value
        console.log(url)
        if(this.isValidImageURL(url)){
            this.add_image_in_arts(url)
        }

    }

    add_image_in_arts(src){
        var arts = this.props.mother_state.arts
        var id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        var image=new Image();
        var _this = this
        image.src = src
        image.onload = function(){

            var resized = _this.props.mother_this.resizeImage(this)
            arts[id]={
                file: resized[0],
                position: undefined, 
                ratio:  this.width/this.height,
                width: resized[1],
                height: resized[2],
                choosen_by: _this.props.mother_this.props.board_this.state.user_id,
            }
            Promise.all([
                _this.props.mother_this.props.board_this.AddArts([arts[id]],[id]),
                _this.props.mother_this.setState({arts:arts, action:'add_image', current_image: [id], current_text:[]})
            ])
            
            console.log('uyay', this.width, this.height)
        }
        
    }
    
    render(){
        return (<div className='controller moodboard_image_add_controller'>
            <div>
                <ul id='moodboard_image_add_tab' className="tabs" style={{backgroundColor:'#333333', color: 'white'}}>
                    <li className="tab col s12"><a href='#moodboard_image_upload' style={{borderRadius:'10px'}}>Upload</a></li>
                    {/* <li className="tab col s6"><a href='#moodboard_image_url' style={{borderRadius:'10px'}}>Url</a></li> */}
                </ul>
            </div>
            <div id='moodboard_image_upload' className='controller col s12' style={{width: '100%'}}>
                <div>Upload your image</div>
                <div><input id='moodboard_image_upload_input' type='file' accept='image/*' style={{width: '100%'}}></input></div>
                <div className='btn' style={{float:'right'}} onClick={this.upload_image.bind(this)}>Upload</div>
            </div>
            {/* <div id='moodboard_image_url' className='controller col sq2' style={{width: '100%'}}>
                <div>Link the url of image</div>
                <div><input id='moodboard_image_url_input' type='link' style={{width: '100%'}}></input></div>
                <div className='btn' style={{float:'right'}} onClick={this.url_image.bind(this)}>Upload</div>
            </div> */}
        </div>)
    }


}

export default MoodBoardImageAddController;