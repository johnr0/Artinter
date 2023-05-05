import React, {Component} from 'react'

class SketchpadStyleStampControllerAI extends Component{

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

    toggleSize(e){
        e.stopPropagation();
        if(this.props.mother_state.action=='idle'){
            this.props.mother_this.setState({action:'size'})
        }else{
            this.props.mother_this.setState({action:'idle'})
        }
        
    }
    toggleBlur(e){
        console.log('toggle blur', this.props.mother_state.action)
        e.stopPropagation();
        if(this.props.mother_state.action=='idle'){
            this.props.mother_this.setState({action:'blur'})
        }else{
            this.props.mother_this.setState({action:'idle'})
        }
        
    }

    change_stamp_size(e){
        this.props.mother_this.setState({stamp_size: e.target.value})
    }

    change_stamp_blur(e){
        this.props.mother_this.setState({stamp_blur: e.target.value/100})
    }

    setStyleStampMode(mode, e){
        this.props.mother_this.setState({style_stamp_mode: mode})
    }

    resetStyleStamp(){
        var el = document.getElementById('style-stamp-canvas')
        var canvas = el.getContext('2d')
        console.log('why?')
        canvas.fillStyle='black'
        canvas.fillRect(0,0,1000,1000)
        this.props.mother_this.setState({style_content_image: undefined})
    }

    // applyStyleTransfer(){
    //     var el = document.getElementById('style-stamp-canvas')
    //     var canvas = el.getContext('2d')
    //     // get content image
    //     var content_bbox = this.getCanvasBoundingBoxBW(canvas)
    //     console.log(content_bbox)

    //     var content_el = document.createElement('canvas')
    //     var content_canvas = content_el.getContext('2d')
    //     content_el.width = content_bbox['width']
    //     content_el.height = content_bbox['height']

    //     var target_layer = document.getElementById('sketchpad_canvas_'+this.props.mother_state.layers[this.props.mother_state.current_layer])
    //     content_canvas.drawImage(target_layer, content_bbox.left, content_bbox.top, content_bbox.width, content_bbox.height, 0, 0, content_bbox.width, content_bbox.height)

    //     var content_image = content_el.toDataURL();
    //     console.log(content_image)

    //     // get style images 
    //     var current_image = this.props.mother_this.props.board_this.moodboard.state.current_image
    //     var arts = this.props.mother_this.props.board_this.moodboard.state.arts
    //     var art_weight = this.props.mother_this.props.board_this.moodboard.stylecontrol.state.art_weight
    //     var art_area = this.props.mother_this.props.board_this.moodboard.stylecontrol.state.art_area

    //     var styles = {}
    //     var promises = []
    //     for(var i in current_image){
            
    //         var art_id = current_image[i]
    //         var cur_art_file = arts[art_id].file
    //         var cur_art_width = arts[art_id].width
    //         var cur_art_height = arts[art_id].height
    //         var cur_art_weight = art_weight[art_id]
    //         var cur_art_area = art_area[art_id]

    //         promises.push(this.getStyleObject(cur_art_file, cur_art_width, cur_art_height, cur_art_weight, cur_art_area, art_id))
            
    //         // styles[art_id] = cur_style

    //     }
    //     Promise.all(promises).then((value)=>{
    //         console.log(value)
            
    //     })

        
    // }

    getStyleObject(cur_art_file, cur_art_width, cur_art_height, cur_art_weight, cur_art_area, art_id){
        var cur_style = {
            'art_id':art_id
        }
        if(cur_art_area==undefined){
            cur_style['weight'] = cur_art_weight
            return cur_style
        }else{
            return new Promise((resolve, reject)=>{
                cur_style['weight'] = cur_art_weight
                cur_style['area'] = cur_art_area
                var cur_el = document.createElement('canvas')
                cur_el.width = cur_art_width*(cur_art_area[2]-cur_art_area[0])
                cur_el.height = cur_art_height*(cur_art_area[3]-cur_art_area[1])
                var cur_ctx = cur_el.getContext('2d')
                var img = new Image();
                img.src = cur_art_file
                img.onload=function(){
                    cur_ctx.drawImage(img, cur_art_width*cur_art_area[0], cur_art_height*cur_art_area[1], cur_art_width, cur_art_height, 0, 0, cur_art_width, cur_art_height)
                // console.log(cur_ctx)
                    cur_style['file']=cur_el.toDataURL()
                    resolve(cur_style);

                }
            })
            
            
        }
        
    }

    selectAllArea(){
        var target_layer = document.getElementById('sketchpad_canvas_'+this.props.mother_state.layers[this.props.mother_state.current_layer])


        var black = document.createElement('canvas')
        black.width=1000
        black.height=1000
        var black_ctx = black.getContext('2d')
        black_ctx.drawImage(target_layer, 0, 0, 1000, 1000, 0, 0, 1000, 1000)
        black_ctx.globalCompositeOperation = 'source-out'
        black_ctx.fillStyle='black'
        black_ctx.fillRect(0,0,1000,1000)
        var white = document.createElement('canvas')
        white.width = 1000
        white.height = 1000
        var white_ctx = white.getContext('2d')
        white_ctx.drawImage(target_layer, 0, 0, 1000, 1000, 0, 0, 1000, 1000)
        white_ctx.globalCompositeOperation = 'source-in'
        white_ctx.fillStyle = 'white'
        white_ctx.fillRect(0, 0, 1000, 1000)

        var el = document.getElementById('style-stamp-canvas')
        var canvas = el.getContext('2d')
        canvas.drawImage(black, 0, 0, 1000, 1000)
        canvas.drawImage(white, 0, 0, 1000, 1000)
        this.props.mother_this.sketchPadStyleContentFinalize()
    }

    render(){
        var el = document.getElementById('style-stamp-canvas')
        var canvas = el.getContext('2d')
        var content_bbox = this.getCanvasBoundingBoxBW(canvas)
        var disabled=false
        if(content_bbox==false){
            disabled=true
        }

        var perc =100/Math.sqrt(2)
        return (
        <div className="controller sketchpad_style_controller">
            <div className='controller_button' style={{display:'inline-block', marginBottom:'0px'}}>
                <div style={{fontSize: 12, border: 'solid 4px white', width: 34, height: 34, margin: 'auto', paddingTop:'3px'}} onPointerDown={this.toggleSize.bind(this)}>
                    Size
                </div>
            </div>
            <div className='controller_button' style={{display:'inline-block', marginBottom:'0px'}}>
                <div style={{fontSize: 12, border: 'solid 4px white', width: 34, height: 34, margin: 'auto', paddingTop:'3px'}} onPointerDown={this.toggleBlur.bind(this)}>
                    Blur
                </div>
            </div>
            <div style={{display:'inline-block', border: 'solid 1px white', cursor:'default', marginLeft:'5px', marginRight:'8px', padding: '3px', fontSize: '12px', lineHeight: '27px', verticalAlign:'middle', borderRadius: '3px'}}>
                <div style={{display:'inline-block', marginRight: '5px', color:(this.props.mother_state.style_stamp_mode=='add')?'white':'#888888'}} onClick={this.setStyleStampMode.bind(this, 'add')}>add</div>
                <div style={{display:'inline-block', color:(this.props.mother_state.style_stamp_mode=='subtract')?'white':'#888888'}} onClick={this.setStyleStampMode.bind(this, 'subtract')}>subtract</div>
                
            </div>
            <div className='btn' style={{display:'inline-block', width:50, marginRight: '4px', padding: 0}} onPointerDown={this.selectAllArea.bind(this)}>All</div>
            <div className='btn' style={{display:'inline-block', width:70, marginRight: '4px', padding: 0}} onPointerDown={this.resetStyleStamp.bind(this)}>Reset</div>
            {/* <div>
                
                <div className='btn' style={{width:'calc(50% - 2px)', padding: 0}} onPointerDown={this.applyStyleTransfer.bind(this)} disabled={disabled}>Apply</div>
            </div> */}

            <div className='controller sketchpad_erase_size_controller' style={{left: (this.props.mother_state.action=='size')?60:100, border: 'solid 3px #333333', backgroundColor: '#eeeeee',
                display: (this.props.mother_state.control_state=='style-stamp' && (this.props.mother_state.action=='size'||this.props.mother_state.action=='blur'))?'inline-block':'none' }}>
                <div style={{width:'10%', height: '100%', display: (this.props.mother_state.action=='size')?'inline-block':'none', verticalAlign:'bottom'}}>
                    <input value={this.props.mother_state.stamp_size} type='range' min='1' max='200' orient='vertical' onChange={this.change_stamp_size.bind(this)}></input>
                </div>
                <div style={{width:'10%', height: '100%', display: (this.props.mother_state.action=='blur')?'inline-block':'none', verticalAlign:'bottom'}}>
                    <input value={this.props.mother_state.stamp_blur*100} type='range' min='1' max='100' orient='vertical' onChange={this.change_stamp_blur.bind(this)}></input>
                </div>
                <div style={{width:'90%', height: '100%', display: 'inline-block', overflow:'hidden', position:'relative'}}>
                    <div id='stamp_size_canvas' width={this.props.mother_state.brush_img.width} height={this.props.mother_state.brush_img.height} 
                    style={{width: this.props.mother_state.stamp_size/1000*this.props.mother_state.boardlength*this.props.mother_state.boardzoom, 
                    height: this.props.mother_state.stamp_size/1000*this.props.mother_state.boardlength*this.props.mother_state.boardzoom,
                    position:'absolute', left: 165.6/2-this.props.mother_state.stamp_size/1000*this.props.mother_state.boardlength*this.props.mother_state.boardzoom/2,
                    top: 184/2-this.props.mother_state.stamp_size/1000*this.props.mother_state.boardlength*this.props.mother_state.boardzoom/2,
                    borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,0,0,'+this.props.mother_state.stamp_blur.toString()+') 0%, rgba(0,0,0, '+this.props.mother_state.stamp_blur.toString()+') '+(this.props.mother_state.stamp_blur*100).toString()+'%,rgba(0,0,0,0) '+perc.toString()+'%)'
                    }}
                    ></div>
                </div>    
            </div>

        </div>)
    }
}

export default SketchpadStyleStampControllerAI 