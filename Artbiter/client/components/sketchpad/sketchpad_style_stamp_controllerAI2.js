import React, {Component} from 'react'
import Api from '../../middleware/api'
import SketchpadMainControllerAI from './sketchpad_main_controllerAI'
import SketchpadStyleStampControllerAI from './sketchpad_style_stamp_controllerAI'

class SketchpadStyleStampControllerAI2 extends Component{
    state={
        open: true,
        content_ratio: 1, 
        content_value: 0, 
        style_ratio: {},
        style_area: {},
        crop: false,
        cropping: false,
        generating:false,
    }

    toggleOpen(){
        this.setState({open: !this.state.open})
    }

    toggleCrop(){
        this.setState({crop: !this.state.crop})
    }

    changeRatio(art_key,e){
        var value = e.target.value
        if(art_key=='content'){
            this.setState({content_ratio: value/100})
        }else{
            var style_ratio = this.state.style_ratio
            style_ratio[art_key] = value/100
            this.setState({style_ratio})
        }
        
    }

    changeContentValue(e){
        var value = e.target.value
        this.setState({content_value: value})
    }

    startCrop(art_key, e){
        if(this.state.cropping==false){
            console.log(e.target.offsetWidth, e.nativeEvent.offsetX)
            var style_area = this.state.style_area
            var el = document.getElementById('sketchpad_style_crop_'+art_key)
            var w = (e.nativeEvent.pageX-el.getBoundingClientRect().left)/el.getBoundingClientRect().width
            var h = (e.nativeEvent.pageY-el.getBoundingClientRect().top)/el.getBoundingClientRect().height
            style_area[art_key] = [w, h, w, h]
            this.setState({cropping: true, style_area: style_area})
        }
        
    }

    moveCrop(art_key, e){
        if(this.state.cropping){
            var style_area = this.state.style_area
            var el = document.getElementById('sketchpad_style_crop_'+art_key)
            var w = (e.nativeEvent.pageX-el.getBoundingClientRect().left)/el.getBoundingClientRect().width
            var h = (e.nativeEvent.pageY-el.getBoundingClientRect().top)/el.getBoundingClientRect().height
            console.log(w, h)
            style_area[art_key][2] = w 
            style_area[art_key][3] = h
            this.setState({style_area: style_area})
        }
    }

    endCrop(art_key, e){
        if(this.state.cropping){
            var style_area = this.state.style_area
            if(style_area[art_key][0]==style_area[art_key][2] && style_area[art_key][1]==style_area[art_key][3]){
                delete style_area[art_key]
                this.setState({style_area: style_area, cropping: false})
            }else{
                if(style_area[art_key][0]>style_area[art_key][2]){
                    var temp = style_area[art_key][0]
                    style_area[art_key][0] = style_area[art_key][2]
                    style_area[art_key][2] = temp
                }
                if(style_area[art_key][1]>style_area[art_key][3]){
                    var temp = style_area[art_key][1]
                    style_area[art_key][1] = style_area[art_key][3]
                    style_area[art_key][3] = temp
                }
                this.setState({cropping: false})
            }
            // console.log(this.s,tate.style_area)
            
        }
    }

    renderStyles(side_length){
        if(this.props.mother_this.props.board_this.moodboard==undefined){
            return
        }
        return this.props.mother_this.props.board_this.moodboard.state.current_image.map((art_key, idx)=>{
            var art = this.props.mother_this.props.board_this.moodboard.state.arts[art_key]
            var style_ratio
            if(this.state.style_ratio[art_key]==undefined){
                style_ratio = 1
            }else{
                style_ratio = this.state.style_ratio[art_key]
            }
            var style_area
            if(this.state.style_area[art_key]==undefined){
                style_area = [0, 0, 1, 1]
            }else{
                style_area = this.state.style_area[art_key]
            }
            var whole_width, whole_height
            if(this.state.crop==false){
                if(art.ratio*(style_area[2]-style_area[0])>(style_area[3]-style_area[1])){   
                    whole_width = side_length / (style_area[2]-style_area[0])*style_ratio
                    whole_height = whole_width/art.ratio
                }else{
                    whole_height = side_length / (style_area[3]-style_area[1])*style_ratio
                    whole_width = whole_height*art.ratio
                }
            }else{
                if(art.ratio>1){   
                    whole_width = side_length 
                    whole_height = whole_width/art.ratio
                }else{
                    whole_height = side_length
                    whole_width = whole_height*art.ratio
                }
            }
            
            var left, right, top, bottom, width, height
            if(style_area[2]!=style_area[0]){
                left = (-whole_width*style_area[0])
                right = whole_width*(1-style_area[2])
                width = whole_width*(style_area[2]-style_area[0])
            }else{
                left = 0
                right = 0
                height = 0
            }
            if(style_area[1]!=style_area[3]){
                top = -whole_height*style_area[1]
                bottom= whole_height*(1-style_area[3])
                height = whole_height*(style_area[3]-style_area[1])
            }else{
                top = 0
                bottom = 0
                width=0
            }

            var crop_left, crop_right, crop_top, crop_bottom, crop_width, crop_height
            if(this.state.crop){
                crop_left = (((style_area[0]<style_area[2])?style_area[0]:style_area[2])*100)+'%'
                // crop_right = ((1-(style_area[0]>style_area[2])?style_area[2]:style_area[0])*100)+'%'
                crop_width = (((style_area[0]<style_area[2])?style_area[2]-style_area[0]:style_area[0]-style_area[2])*100)+'%'

                crop_top = (((style_area[1]<style_area[3])?style_area[1]:style_area[3])*100)+'%'
                
                // crop_bottom = ((1-(style_area[1]>style_area[3])?style_area[3]:style_area[1])*100)+'%'
                crop_height = (((style_area[1]<style_area[3])?style_area[3]-style_area[1]:style_area[1]-style_area[3])*100)+'%'
            }else{
                crop_left=0
                crop_top=0
                crop_width=0
                crop_height=0
            }
            
            return (<div key={'selected_for_style_'+art._id} style={{display:'inline-block', marginRight: '5px', verticalAlign: 'top'}}>
                <div style={{display:(this.state.crop==false)?'':'none'}}>
                    <div style={{width: side_length, height: side_length, backgroundColor:'#eeeeee'}}>
                        {/* <img src={art.file} style={{maxWidth: (100*style_ratio)+'%', maxHeight: (100*style_ratio)+'%'}}></img> */}
                        <div style={{width: width, height: height, position: 'relative', overflow:'hidden'}}>
                            <img src={art.file} style={{position: 'absolute', left:left, right: right, width: whole_width, top: top, bottom: bottom, height: whole_height}}></img>
                        </div>
                    </div>
                    <div>
                    <input id={'sketchpad_style_scale_'+art._id} type='range' style={{width: side_length, height: '20px', margin: '0', border:'solid 1px transparent'}} min={0} max={100} value={style_ratio*100} onChange={this.changeRatio.bind(this, art_key)}></input>
                    </div>
                    <div>
                        <input id={'sketchpad_style_weight_'+art._id} type='range' style={{width: side_length, height: '20px', margin: '0', border:'solid 1px transparent'}} min={0} max={100}></input>
                    </div>
                </div>

                <div style={{display:(this.state.crop)?'':'none'}}>
                    <div style={{width: side_length, height: side_length, backgroundColor:'#eeeeee', position: 'relative'}} draggable={false}>
                    <div id={'sketchpad_style_crop_'+art._id} style={{width: whole_width, height: whole_height, position: 'relative'}} onPointerDown={this.startCrop.bind(this, art_key)}
                            onPointerMove={this.moveCrop.bind(this, art_key)}
                            onPointerUp={this.endCrop.bind(this, art_key)}>
                        <img src={art.file} style={{width: (100)+'%', height: (100)+'%'}} draggable={false}
                            
                        ></img> 
                        <div style={{position: 'absolute', left: crop_left, top: crop_top, width:crop_width, height: crop_height, border:'solid 1px red'}} draggable={false}></div>
                        
                        </div>
                    </div>
                    
                    
                </div>
                
            </div>)
        })
    }

    getStyleObject(cur_art_file, cur_art_width, cur_art_height, cur_art_weight, cur_art_area, cur_art_scale, art_id){
        var cur_style = {
            'art_id':art_id
        }
        if(false){
            cur_style['weight'] = cur_art_weight
            cur_style['scale'] = cur_art_scale
            return cur_style
        }else{
            return new Promise((resolve, reject)=>{
                cur_style['weight'] = cur_art_weight
                cur_style['scale'] = cur_art_scale
                if(cur_art_area==undefined){
                    cur_art_area=[0,0,1,1]
                }
                cur_style['area'] = cur_art_area
                var cur_el = document.createElement('canvas')
                
                cur_el.width = cur_art_width*(cur_art_area[2]-cur_art_area[0])
                cur_el.height = cur_art_height*(cur_art_area[3]-cur_art_area[1])
                
                var cur_ctx = cur_el.getContext('2d')
                var img = new Image();
                img.src = cur_art_file
                img.onload=function(){
                    console.log('crop log', cur_art_area, cur_art_width, cur_art_height)
                    cur_ctx.drawImage(img, cur_art_width*cur_art_area[0], cur_art_height*cur_art_area[1], cur_art_width*(cur_art_area[2]-cur_art_area[0]), cur_art_height*(cur_art_area[3]-cur_art_area[1]), 0, 0, cur_art_width*(cur_art_area[2]-cur_art_area[0]), cur_art_height*(cur_art_area[3]-cur_art_area[1]))
                console.log(cur_el.toDataURL())
                    cur_style['file']=cur_el.toDataURL()
                    console.log(cur_el)
                    resolve(cur_style);

                }
            })
        }
    }

    getCanvasBoundingBoxBW(ctx, left=0, top=0, width=1000, height=1000){
        var ret = {};
    
        // Get the pixel data from the canvas
        var data = ctx.getImageData(left, top, width, height).data;
        // console.log(data);
        var first = false; 
        var last = false;
        var right = false;
        var left = false;
        var r = height;
        var w = 0;
        var c = 0;
        var d = 0;

        // 1. get bottom
        while(!last && r) {
            r--;
            for(c = 0; c < width; c++) {
                // console.log(data[r * width * 4 + c * 4 ], data[r * width * 4 + c * 4 +1], data[r * width * 4 + c * 4 +2])
                if(data[r * width * 4 + c * 4 ]!=0 || data[r * width * 4 + c * 4 +1]!=0 || data[r * width * 4 + c * 4 +2]!=0) {
                    // console.log('last', r);
                    last = r+1;
                    ret.bottom = r+1;
                    break;
                }
            }
        }

        // 2. get top
        r = 0;
        var checks = [];
        while(!first && r < last) {
            
            for(c = 0; c < width; c++) {
                if(data[r * width * 4 + c * 4 ]!=0 || data[r * width * 4 + c * 4 +1]!=0 || data[r * width * 4 + c * 4 +2]!=0) {
                    // console.log('first', r);
                    first = r-1;
                    ret.top = r-1;
                    ret.height = last - first;
                    break;
                }
            }
            r++;
        }

        // 3. get right
        c = width;
        while(!right && c) {
            c--;
            for(r = 0; r < height; r++) {
                if(data[r * width * 4 + c * 4 ]!=0 || data[r * width * 4 + c * 4 +1]!=0 || data[r * width * 4 + c * 4 +2]!=0) {
                    // console.log('last', r);
                    right = c+1;
                    ret.right = c+1;
                    break;
                }
            }
        }

        // 4. get left
        c = 0;
        while(!left && c < right) {

            for(r = 0; r < height; r++) {
                if(data[r * width * 4 + c * 4 ]!=0 || data[r * width * 4 + c * 4 +1]!=0 || data[r * width * 4 + c * 4 +2]!=0) {
                    // console.log('left', c-1);
                    left = c;
                    ret.left = c;
                    ret.width = right - left;
                    break;
                }
            }
            c++;
            
            // If we've got it then return the height
            if(left) {
                return ret;    
            }
        }

        // We screwed something up...  What do you expect from free code?
        return false;
    }

    applyTransfer(){
        this.setState({generating:true})
        var el = document.getElementById('style-stamp-canvas')
        var canvas = el.getContext('2d')
        // get content image
        var content_bbox = this.getCanvasBoundingBoxBW(canvas)
        console.log(content_bbox)

        var content_el = document.createElement('canvas')
        var content_canvas = content_el.getContext('2d')
        content_el.width = content_bbox['width']
        content_el.height = content_bbox['height']
        content_canvas.fillStyle='white'
        content_canvas.fillRect(0,0,content_el.width, content_el.height)

        var target_layer = document.getElementById('sketchpad_canvas_'+this.props.mother_state.layers[this.props.mother_state.current_layer])
        content_canvas.drawImage(target_layer, content_bbox.left, content_bbox.top, content_bbox.width, content_bbox.height, 0, 0, content_bbox.width, content_bbox.height)

        var content_image = content_el.toDataURL();
        var content_weight = document.getElementById('sketchpad_content_weight').value/100
        var content_scale = document.getElementById('sketchpad_content_scale').value/100
        var content = {
            content_image: content_image,
            content_weight: content_weight,
            content_scale: content_scale,
            content_mask: el.toDataURL(),
            content_position: content_bbox,
            current_layer: this.props.mother_state.current_layer, 
        }
        console.log(this.props.mother_state.current_layer)

        // get style images 
        var current_image = this.props.mother_this.props.board_this.moodboard.state.current_image
        var arts = this.props.mother_this.props.board_this.moodboard.state.arts
        var style_area = this.state.style_area

        var styles = {}
        var promises = []
        for(var i in current_image){
            
            var art_id = current_image[i]
            console.log(arts[art_id])
            var cur_art_file = arts[art_id].file
            var cur_art_width = arts[art_id].width
            var cur_art_height = arts[art_id].height
            if(cur_art_width==undefined){
                cur_art_width=128
            }
            if(cur_art_height==undefined){
                cur_art_height=128
            }
            var cur_art_weight = document.getElementById('sketchpad_style_weight_'+art_id).value/100
            var cur_art_area = style_area[art_id]
            var cur_art_scale = this.state.style_ratio[art_id]
            if(cur_art_scale==undefined){
                cur_art_scale = 1
            }
            console.log(cur_art_file)

            promises.push(this.getStyleObject(cur_art_file, cur_art_width, cur_art_height, cur_art_weight, cur_art_area, cur_art_scale, art_id))
            
            // styles[art_id] = cur_style

        }
        Promise.all(promises).then((value)=>{
            console.log(content, value)
            
            // analytics.logEvent("transfer_on_sketch", {board_id: this.props.mother_this.props.board_this.state.board_id, user_id:this.props.mother_this.props.board_this.state.user_id})
            Api.app.service('boards').patch(this.props.mother_this.props.board_this.state.board_id, {$set: {updated:'sketchpad_style_apply', content: content, styles: value}})
            
            
        })
    }

    render(){
        if(document.getElementById('sketchpad')==undefined){
            return (<div></div>)
        }
        var side_length_width = (document.getElementById('sketchpad').offsetWidth-130)/2-55///20
        var side_length_height = (document.getElementById('sketchpad').offsetHeight* 0.45-50-40)-20
        var side_length = (side_length_height>side_length_width)?side_length_width:side_length_height

        var paddingTop = 0

        if(document.getElementById('sketchpad')!=undefined){
            paddingTop = document.getElementById('sketchpad').offsetHeight * 0.45 * 0.5 -32
        }



        return (<div style={{display:(this.props.mother_state.control_state=='style-stamp')?'':'none'}}>
            <div className="controller sketchpad_style_controller2" style={{display:(this.state.open)?'':'none'}}>
                {this.state.generating && <div style={{borderRadius: '10px', position:'absolute', width: '100%', height: '100%', top:0, left:0, paddingTop: paddingTop, backgroundColor: 'rgba(255,255,255,0.8)', zIndex:10000}}>
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
                <div className='moodboard_search_pane_close' style={{marginBottom: '5px'}} onPointerDown={this.toggleOpen.bind(this)}>
                    ▽ Style Configure
                    </div>
                <div className='row' style={{position: 'relative'}}>
                    <div className='col s5 moodboard_search_pane_subpane'>
                        <div className='moodboard_search_pane_subpane_div' style={{textAlign:'center'}}>
                            {this.props.mother_state.style_content_image==undefined && 
                            <div>Specify area to apply the style</div>
                            }
                            
                            <div style={{display:(this.props.mother_state.style_content_image!=undefined)?'':'none'}}> 
                                <div style={{display:'block', margin:'auto', width: side_length, height: side_length, backgroundColor:'#eeeeee', position: 'relative'}}>
                                    {this.props.mother_state.style_content_box!=undefined && this.props.mother_state.style_content_box['width']>this.props.mother_state.style_content_box['height'] &&
                                        <img src={this.props.mother_state.style_content_image}
                                        style={{display:'block', border: 'solid 1px #888888', width: (100*this.state.content_ratio)+'%'}}
                                        ></img>
                                        
                                    }
                                    {this.props.mother_state.style_content_box!=undefined && this.props.mother_state.style_content_box['width']<=this.props.mother_state.style_content_box['height'] &&
                                        <img src={this.props.mother_state.style_content_image}
                                        style={{display:'block', border: 'solid 1px #888888', height: (100*this.state.content_ratio)+'%'}}
                                        ></img>
                                    }
                                    {this.props.mother_state.style_content_box!=undefined && this.props.mother_state.style_content_box['width']>this.props.mother_state.style_content_box['height'] &&
                                        <img src={this.props.mother_state.style_content_mask}
                                            style={{display:'block', border: 'solid 1px #888888', width: (100*this.state.content_ratio)+'%', position: 'absolute', top: 0, opacity: 0.5}}
                                        ></img>
                                    }
                                    {this.props.mother_state.style_content_box!=undefined && this.props.mother_state.style_content_box['width']<=this.props.mother_state.style_content_box['height'] &&
                                        <img src={this.props.mother_state.style_content_mask}
                                            style={{display:'block', border: 'solid 1px #888888', height: (100*this.state.content_ratio)+'%', position: 'absolute', top: 0, opacity: 0.5}}
                                        ></img>
                                    }
                                    
                                </div>
                                <div>
                                    <input id={'sketchpad_content_scale'} type='range' style={{width: side_length, height: '20px', margin: '0', border:'solid 1px transparent'}} min={0} max={100} value={this.state.content_ratio*100} onChange={this.changeRatio.bind(this, 'content')}></input>
                                </div>
                                <div>
                                    <input id={'sketchpad_content_weight'} type='range' style={{width: side_length, height: '20px', margin: '0', border:'solid 1px transparent'}} min={0} max={100} value={this.state.content_value} onChange={this.changeContentValue.bind(this)}></input>
                                </div>
                            </div>
                            
                        </div>
                    </div>
                    <div className='col s1 moodboard_search_pane_subpane' style={{position:'relative', padding: 0}}>
                        <div style={{position:'absolute', top: side_length, width:'100%', textAlign: 'center'}}>Scale</div>
                        <div style={{position:'absolute', top: side_length+23, width:'100%', textAlign: 'center'}}>Weight</div>
                    </div>
                    <div className='col s6 moodboard_search_pane_subpane'>
                        <div style={{display: 'inline-flex', overflowY:'auto', width: '100%'}} className='moodboard_search_pane_subpane_div'>
                            {this.renderStyles(side_length)}
                        </div>
                        <div style={{position:'absolute', top:'-30px'}}>
                            {this.state.crop==false && <div className='btn tiny-btn' onPointerDown={this.toggleCrop.bind(this)}>Crop</div>}
                            {this.state.crop==true && <div className='btn tiny-btn' onPointerDown={this.toggleCrop.bind(this)}>Done Crop</div>}
                        </div>
                        <div style={{position:'absolute', top:'-30px', right: '13px'}}>
                            {this.state.crop==false && <div className='btn tiny-btn' onPointerDown={this.applyTransfer.bind(this)} 
                            disabled={this.props.mother_state.style_content_image==undefined || this.props.mother_this.props.board_this.moodboard.state.current_image.length==0}>Apply</div>}
                        </div>
                    </div>
                </div>
            </div>
            <div style={{width: 'fit-content'}} className='moodboard_search_pane_open controller' style={{display:(!this.state.open)?'':'none'}} onPointerDown={this.toggleOpen.bind(this)}>
                △ Style Configure
            </div>
        </div>)
        
        

        
    }
}

export default SketchpadStyleStampControllerAI2