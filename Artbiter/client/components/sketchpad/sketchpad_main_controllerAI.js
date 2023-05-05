import React, {Component} from 'react'
import SketchpadMainController from './sketchpad_main_controller'
import SketchpadBrushController from './sketchpad_brush_controller'
import SketchpadEraserController from './sketchpad_eraser_controller'
import SketchpadStyleStampControllerAI from './sketchpad_style_stamp_controllerAI'

class SketchpadMainControllerAI extends SketchpadMainController{
    changeControlState(control_state){
        if(this.props.mother_state.current_layer!=-1){
            var layer_id = this.props.mother_state.layers[this.props.mother_state.current_layer]
            var layer = this.props.mother_state.layer_dict[layer_id]

            if(layer!=undefined){
                if(layer.hide!=true){
                    if(control_state=='style-stamp'){
                        // var el = document.getElementById('style-stamp-canvas')
                        // var canvas = el.getContext('2d')
                        // canvas.fill='black'
                        // canvas.fillRect(0,0,1000,1000)
                        this.props.mother_this.props.board_this.moodboard.setState({control_state:'style-stamp'})
                        var moodboard_state = this.props.mother_this.props.board_this.moodboard.state
                        if(moodboard_state.current_text.length>0){
                            this.props.mother_this.props.board_this.moodboard.deSelect();
                        }
        
                        if(moodboard_state.current_image.length>0){
                            for(var i in moodboard_state.current_image){
                                if(moodboard_state.arts[moodboard_state.current_image[i]].enabled!=true){
                                    // this.props.mother_this.props.board_this.ChooseArtsTexts([],[],[moodboard_state.current_image[i]], [])
                                    this.props.mother_this.props.board_this.moodboard.deSelect();
                                    break
                                }
                            }
                        }
        
                        this.props.mother_this.sketchPadStyleContentFinalize()
                    }
                    if(control_state!='style-stamp'&&control_state!='content-stamp'&&this.props.mother_state.control_state=='style-stamp'){
        
                        this.props.mother_this.props.board_this.moodboard.setState({control_state:'control_object', action: 'idle'})
                    }
                }
            }



            
        }
        super.changeControlState(control_state)
    }

    render(){
        var basecolor='#888888'
        if(this.props.mother_state.current_layer==-1){
            basecolor='#444444'
        }else{
            var layer_id = this.props.mother_state.layers[this.props.mother_state.current_layer]
            var layer = this.props.mother_state.layer_dict[layer_id]
            // console.log('layer', layer, layer_id)
            if(layer!=undefined){
                if(layer.hide==true){
                    basecolor='#444444'
                }
            }
        }
        return (<div className="controller sketchpad_main_controllerAI">
            <div  className='controller_button' style={{color: (this.props.mother_state.control_state=='move')?'white':basecolor}}
                onClick={this.changeControlState.bind(this, 'move')}>
                <i className='controller_button_icon fa fa-hand-paper'></i>
            </div>
            <div  className='controller_button' style={{color: (this.props.mother_state.control_state=='move-layer')?'white':basecolor}}
                onClick={this.changeControlState.bind(this, 'move-layer')}>
                <i className='controller_button_icon fa fa-arrows'></i>
            </div>
            <div  className='controller_button' style={{color: (this.props.mother_state.control_state=='brush')?'white':basecolor}}
                onClick={this.changeControlState.bind(this, 'brush')}>
                <i className='controller_button_icon fa fa-paint-brush'></i>
            </div>
            <div  className='controller_button' style={{color: (this.props.mother_state.control_state=='erase')?'white':basecolor}}
                onClick={this.changeControlState.bind(this, 'erase')}>
                <i className='controller_button_icon fa fa-eraser'></i>
            </div>
            <div  className='controller_button' style={{color: (this.props.mother_state.control_state=='area')?'white':basecolor}}
                onClick={this.changeControlState.bind(this, 'area')}>
                <span className="iconify" data-icon="mdi-lasso" data-inline="false"></span>
                {/* < style={{width: '38px', height: '38px', border: (this.props.mother_state.control_state=='area')?'dashed 4px white':'dashed 4px #888888'}}></div> */}
   
            </div>
            <div  className='controller_button' style={{color: (this.props.mother_state.control_state=='content-stamp')?'white':basecolor}}
                onClick={this.changeControlState.bind(this, 'content-stamp')}>
                <i style={{fontSize:'25px', verticalAlign:'bottom'}} className='controller_button_icon fa fa-stamp'></i>
                <span style={{fontSize:'20px'}}>C</span>
            </div>
            <div  className='controller_button' style={{color: (this.props.mother_state.control_state=='style-stamp')?'white':basecolor}}
                onClick={this.changeControlState.bind(this, 'style-stamp')}>
                <i style={{fontSize:'25px', verticalAlign:'bottom'}} className='controller_button_icon fa fa-stamp'></i>
                <span style={{fontSize:'20px'}}>S</span>
            </div>
            {/* <div  className='controller_button' style={{color: (this.props.mother_state.control_state=='copy_content')?'white':'#888888'}}>
                <i className='controller_button_icon fa fa-stamp'></i>
   
            </div> */}
            {this.props.mother_state.control_state=='brush'&&
                <SketchpadBrushController mother_this={this.props.mother_this} mother_state={this.props.mother_state}></SketchpadBrushController>
            }
            {this.props.mother_state.control_state=='erase'&&
                <SketchpadEraserController mother_this={this.props.mother_this} mother_state={this.props.mother_state}></SketchpadEraserController>
            }
            {this.props.mother_state.control_state=='style-stamp'&&
                <SketchpadStyleStampControllerAI mother_this={this.props.mother_this} mother_state={this.props.mother_state}></SketchpadStyleStampControllerAI>
            }
            
        </div>)
    }

}

export default SketchpadMainControllerAI;