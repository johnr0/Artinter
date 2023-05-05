import React, {Component} from 'react'
import ProtoBoard from '../proto/protoboard'
import SketchpadCanvas from './sketchpad_canvas'
import SketchpadLayerController from './sketchpad_layer_controller'
import SketchpadMainController from './sketchpad_main_controller'
import SketchpadUndo from './sketchpad_undo'

class SketchPad extends ProtoBoard {
    state = {
        ...this.state,
        boardname:'sketchpad',
        control_state: 'move',
        //control_state --> area, move, brush, erase, content_stamp, style_stamp
        // action --> move: idle, move_board
        //            brush: idle, brush

        brush_cur: undefined, 
        brush_size: 20,
        brush_img: undefined, 
        brush_color: '#000000',
        cur_colored_brush_img: undefined,

        brush_pre_canvas: undefined, 

        erase_size: 20,

        stamp_size: 40,
        stamp_blur: 0.5, 

        layers: [
            {
                layer_id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
                image: 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==',
                opacity: 1,
                choosen_by:'',
            }
        ],
        layer_dict: {},

        sketchundo: [],
        current_layer: -1,

        lasso: [],
        lasso_img: undefined, 
        nonlasso_ret: undefined, 

        // below used for move-layer
        lassoed_canvas: undefined,
        unlassoed_canvas: undefined,

        move_layer_init_pos: undefined,
        adjust_pre_canvas: undefined, 
        init_lasso: undefined, 

        init_nonlasso_ret: undefined,

        lasso_rot_deg: 0,

        lasso_resize_direction: undefined,
        resize_layer_init_pos: undefined, 
        resize_ret: undefined, 

        prev_shift_key: 'move', 

        shift_pressed: false, 

        content_stamp_img: undefined, 
        content_stamp_ratio: undefined,
        content_stamp_init_pos: undefined,
        content_stamp_cur_pos: undefined,

        cur_mouse_pos: [0,0]
    }

    // TODO lasso tool - nonlasso-based resize

    componentDidMount(){
        super.componentDidMount()
        var brush_img = new Image();
        // brush_img.crossOrigin="Anonymous"
        brush_img.src = location.protocol+'//'+location.host+'/img/brush.png'//'http://www.tricedesigns.com/wp-content/uploads/2012/01/brush2.png';
        console.log(brush_img)
        this.setState({brush_img})

        var _this = this
        document.addEventListener('keydown', function(e){
            e = e||window.event;
            if(e.key=="z"){
                if(_this.state.current_layer>=0){
                    if(_this.state.layer_dict[_this.state.layers[_this.state.current_layer]].hide!=true){
                        if(_this.state.action=='idle'&&_this.state.control_state!='move'){
                            _this.setState({prev_shift_key: _this.state.control_state, control_state: 'move'})
                        }
                    }
                }   
            }else if(e.key=='Shift'){
                _this.setState({shift_pressed:true})
            }
        })

        document.addEventListener('keyup', function(e){
            e = e||window.event;
            if(e.key=="z"){
                if(_this.state.current_layer>=0){
                    if(_this.state.layer_dict[_this.state.layers[_this.state.current_layer]].hide!=true){
                        _this.setState({control_state: _this.state.prev_shift_key, action: 'idle'})
                    }
                }
            }else if(e.key=='Shift'){
                _this.setState({shift_pressed:false})
            }
        })
    }

    getPositionOnBoard(xpix, ypix){
        var horizontal_offset = 0
        if(this.props.board_this.state.moodboard_collapsed==true && this.props.board_this.state.sketchpad_collapsed==false){
            horizontal_offset = this.state.boardwidth/2
        }
        var xpos = 1000*(this.state.boardcenter[0]-(this.state.boardwidth/2+horizontal_offset)/this.state.boardlength/this.state.boardzoom+xpix/this.state.boardzoom/this.state.boardlength)
        var ypos = 1000*(this.state.boardcenter[1]-this.state.boardheight/2/this.state.boardlength/this.state.boardzoom+ypix/this.state.boardzoom/this.state.boardlength)
        return [xpos, ypos]
    }

    getCurrentMouseOnBoard(e){
        // console.log(e.pageX, e.pageY)
        
        var xpix = e.pageX - document.getElementById(this.state.boardname).offsetLeft
        var ypix = e.pageY - document.getElementById(this.state.boardname).offsetTop
        
        // console.log(xpix, ypix)
        
        // console.log(xpos, ypos)

        return this.getPositionOnBoard(xpix, ypix);
    }

    moveBoardEnd(){
        // console.log('thiss?')
        if(this.state.control_state=='brush' && this.state.action=='size'){
            return
        }
        if(this.state.control_state=='erase' && this.state.action=='size'){
            return
        }
        if(this.state.control_state=='style-stamp' && (this.state.action=='size'||this.state.action=='blur')){
            return
        }
        if(this.state.control_state=='move-layer' && this.state.action=='move-layer'){
            return
        }
        if(this.state.control_state=='move-layer' && this.state.action=='rotate-layer'){
            return
        }
        if(this.state.control_state=='move-layer' && this.state.action=='resize-layer'){
            return
        }
        super.moveBoardEnd();
    }

    sketchPadMouseMoveInit(e){
        if(this.state.control_state=='move' && this.state.action=='idle'){
            this.moveBoardInit(e)
        }else if(this.state.control_state=='brush' && this.state.action=='idle'){
            this.brushInit(e)
        }else if(this.state.control_state=='erase' && this.state.action=='idle'){
            this.eraseInit(e)
        }else if(this.state.control_state=='brush' && this.state.action=='size'){
            this.setState({action:'idle'})
        }else if(this.state.control_state=='erase' && this.state.action=='size'){
            this.setState({action:'idle'})
        }else if(this.state.control_state=='style-stamp' && (this.state.action=='size'||this.state.action=='blur')){
            this.setState({action:'idle'})
        }else if(this.state.control_state=='area' && this.state.action=='idle'){
            this.lassoInit(e)
        }else if(this.state.control_state=='content-stamp' && this.state.action=='idle' && this.props.board_this.moodboard.state.current_image.length==1){
            this.contentStampInit(e)
        }else if(this.state.control_state=='move-layer' && this.state.action=='idle'){
            console.log('consome')
            if(this.isOutSideMovableArea(e)){
                console.log('masita')
                this.moveBoardInit(e)
            }
            
        }
    }

    isOutSideMovableArea(e){
        var xmax=Number.MIN_VALUE
            var ymax = Number.MIN_VALUE
            var xmin = Number.MAX_VALUE
            var ymin = Number.MAX_VALUE
        if(this.state.lasso.length>0){
            

            for(var i in this.state.lasso){
                var cur_p = this.state.lasso[i]
                if(cur_p[0]>xmax){
                    xmax = cur_p[0]
                }else if(cur_p[0]<xmin){
                    xmin = cur_p[0]
                }

                if(cur_p[1]>ymax){
                    ymax = cur_p[1]
                }else if(cur_p[1]<ymin){
                    ymin = cur_p[1]
                }
            }
        }else if(this.state.nonlasso_ret!=undefined){
            var ret = this.state.nonlasso_ret
            xmin = ret.left
            xmax = ret.left+ret.width
            ymin = ret.top
            ymax = ret.top+ret.height
        }

        if(this.state.lasso.length>0 || this.state.nonlasso_ret!=undefined){
            // console.log(xmin, xmax, ymin, ymax)
            var mpos = this.getCurrentMouseOnBoard(e)

            if(mpos[0]>xmin && mpos[0]<xmax && mpos[1]>ymin && mpos[1]<ymax){
                return false
            }else{
                return true
            }
        }else{
            return true
        }
    }

    sketchPadMouseMove(e){
        // console.log(this.state.action)
        // var pos = this.getCurrentMouseOnBoard(e)
        // this.props.board_this.setSketchpadPosition(pos[0], pos[1]);
        // console.log('sdkfjo', this.state.action)
        // console.log(this.state.cur_mouse_pos)
        this.setState({cur_mouse_pos: [e.pageX, e.pageY]})
        if((this.state.control_state=='move'||this.state.control_state=='move-layer') && this.state.action=='move_board'){
            this.moveMouse(e)
        }else if(this.state.control_state=='brush' && this.state.action=='brush'){
            this.brushMove(e)
        }else if(this.state.control_state=='erase' && this.state.action=='erase'){
            this.eraseMove(e)
        }else if(this.state.control_state=='area' && this.state.action=='lasso'){
            this.lassoMove(e)
        }else if(this.state.control_state=='move-layer' && this.state.action=='move-layer'){
            this.moveLayerMove(e)
        }else if(this.state.control_state=='move-layer' && this.state.action=='rotate-layer'){
            console.log('rot')
            this.rotateLayerMove(e)
        }else if(this.state.control_state=='move-layer' && this.state.action=='resize-layer'){
            this.resizeLayerMove(e)
        }else if(this.state.control_state=='content-stamp' && this.state.action=='content-stamp'){
            this.contentStampMove(e)
        }

    }



    sketchPadMouseMoveEnd(e){
        console.log('eeeeeennnnnnndddd')
        if((this.state.control_state=='move'||this.state.control_state=='move-layer') && this.state.action=='move_board'){
            this.moveBoardEnd(e)
        }else if (this.state.control_state=='brush'&&this.state.action=='brush'){
            this.brushEnd(e)
        }else if (this.state.control_state=='erase'&&this.state.action=='erase'){
            this.eraseEnd(e)
        }else if(this.state.control_state=='area' && this.state.action=='lasso'){
            this.lassoEnd(e)
        }else if(this.state.control_state=='move-layer' && this.state.action=='move-layer'){
            this.moveLayerEnd(e)
        }else if(this.state.control_state=='move-layer' && this.state.action=='rotate-layer'){
            this.rotateLayerEnd(e)
        }else if(this.state.control_state=='move-layer' && this.state.action=='resize-layer'){
            this.resizeLayerEnd(e)
        }else if(this.state.control_state=='content-stamp' && this.state.action=='content-stamp'){
            this.contentStampEnd(e)
        }
    }

    sketchPadMouseMoveOut(e){
        console.log('out to where?', this.state.action)
        if(this.state.control_state=='move-layer' && this.state.action=='move-layer'){
            console.log('out to here', e.relatedTarget)
            if(e.relatedTarget.id=='sketchpad'){
                this.moveLayerEnd(e)
            }
            
        }else{
            if(this.state.action!='idle'){
                console.log('here?')
                this.moveBoardEnd(e)
            }
            
        }
    }

    brushInit(e){
        if(this.state.current_layer==-1){
            return
        }
        console.log(this.state.layers)
        var brush_canvas = document.createElement('canvas')
        brush_canvas.width = this.state.brush_size
        brush_canvas.height = this.state.brush_size
        var brush_canvas_ctx = brush_canvas.getContext('2d')
        brush_canvas_ctx.fillStyle=this.state.brush_color
        brush_canvas_ctx.fillRect(0, 0, brush_canvas.width, brush_canvas.height)
        brush_canvas_ctx.globalCompositeOperation = "destination-in";
        brush_canvas_ctx.drawImage(this.state.brush_img, 0, 0, this.state.brush_size, this.state.brush_size)
        console.log(brush_canvas_ctx)

        var cur_colored_brush_img = new Image();

        var brush_pre_canvas = document.createElement('canvas')
        brush_pre_canvas.width = 1000
        brush_pre_canvas.height = 1000
        var brush_pre_canvas_ctx = brush_pre_canvas.getContext('2d')
        brush_pre_canvas_ctx.lineJoin = brush_pre_canvas_ctx.lineCap = 'round'
        
        // console.log(brush_canvas.toDataURL())
        cur_colored_brush_img.src = brush_canvas.toDataURL();

        var el = document.getElementById('sketchpad_canvas_'+this.state.layers[this.state.current_layer])
        var cur_image = el.toDataURL()
        var ctx = el.getContext('2d');
        ctx.lineJoin = ctx.lineCap = 'round'
        
        console.log(this.state.brush_img)
        var brush_cur = this.getCurrentMouseOnBoard(e)
        // brush_cur[0] = brush_cur[0]+this.state.brush_size/this.state.boardlength/this.state.boardzoom/2
        // brush_cur[1] = brush_cur[1]+this.state.brush_size/this.state.boardlength/this.state.boardzoom/2
        this.setState({action:'brush', brush_cur:this.getCurrentMouseOnBoard(e), cur_colored_brush_img: cur_colored_brush_img, brush_pre_canvas:brush_pre_canvas, origin_image: cur_image})
       
    }

    distanceBetween(point1, point2){
        return Math.sqrt(Math.pow(point2[0] - point1[0], 2) + Math.pow(point2[1] - point1[1], 2));
    }
    angleBetween(point1, point2){
        return Math.atan2( point2[0] - point1[0], point2[1] - point1[1] );
    }

    brushMove(e){
        // draw on the canvas
        var el = document.getElementById('sketchpad_canvas_'+this.state.layers[this.state.current_layer])
        var ctx = el.getContext('2d');
        var brush_pre_canvas = this.state.brush_pre_canvas
        var brush_pre_ctx = brush_pre_canvas.getContext('2d');
        brush_pre_ctx.clearRect(0,0,1000,1000);

        var brush_cur = this.getCurrentMouseOnBoard(e)
        // brush_cur[0] = brush_cur[0]+this.state.brush_size/this.state.boardlength/this.state.boardzoom/2
        // brush_cur[1] = brush_cur[1]+this.state.brush_size/this.state.boardlength/this.state.boardzoom/2
        // console.log(brush_cur, this.state.brush_cur)

        var dist = this.distanceBetween(brush_cur, this.state.brush_cur)
        var angle = this.angleBetween(brush_cur, this.state.brush_cur)
        // console.log(dist, angle)

        for (var i=0; i<dist; i++){
            var x = brush_cur[0]+(Math.sin(angle)*i)-this.state.brush_size/2;
            var y = brush_cur[1]+(Math.cos(angle)*i)-this.state.brush_size/2;
            // console.log(x, y)
            brush_pre_ctx.drawImage(this.state.cur_colored_brush_img, x, y);
            // ctx.drawImage(this.state.cur_colored_brush_img, x, y);
        }
        
        // apply lasso
        if(this.state.lasso_img!=undefined){
            brush_pre_ctx.globalCompositeOperation = 'destination-in'
            brush_pre_ctx.drawImage(this.state.lasso_img, 0, 0, 1000, 1000)
            brush_pre_ctx.globalCompositeOperation = 'source-over'
        }
        // move lasso image to context
        ctx.drawImage(brush_pre_canvas, 0, 0)

        this.setState({brush_cur:brush_cur})


    }

    brushEnd(e){
        // console.log('thiss?')
        var el = document.getElementById('sketchpad_canvas_'+this.state.layers[this.state.current_layer])
        var cur_image = el.toDataURL()
        var layers = this.state.layers
        // layers[this.state.current_layer]['image'] = cur_image
        this.props.board_this.updateALayerImage(this.state.current_layer, layers[this.state.current_layer], cur_image, this.state.origin_image)
        this.setState({action:'idle', brush_cur:undefined, cur_colored_brush_img: undefined, brush_pre_canvas: undefined})
        // Promise.all([this.props.board_this.updateALayerImage(this.state.current_layer, layers[this.state.current_layer].layer_id, cur_image), 
        //     this.setState({action:'idle', brush_cur:undefined, cur_colored_brush_img: undefined, brush_pre_canvas: undefined})
        // ])
        
    }

    eraseInit(e){
        if(this.state.current_layer==-1){
            return
        }
        var el = document.getElementById('sketchpad_canvas_'+this.state.layers[this.state.current_layer])
        var ctx = el.getContext('2d');
        var cur_image = el.toDataURL()
        ctx.globalCompositeOperation ='destination-out'
        ctx.lineWidth = this.state.erase_size
        ctx.beginPath();
        var brush_cur = this.getCurrentMouseOnBoard(e).slice()
        ctx.moveTo(brush_cur[0], brush_cur[1])

        var brush_pre_canvas = document.createElement('canvas')
        brush_pre_canvas.width = 1000
        brush_pre_canvas.height = 1000
        var brush_pre_canvas_ctx = brush_pre_canvas.getContext('2d')
        brush_pre_canvas_ctx.lineWidth = this.state.erase_size


        this.setState({action:'erase', brush_cur: brush_cur, brush_pre_canvas: brush_pre_canvas, origin_image: cur_image})
        
    }

    eraseMove(e){
        var el = document.getElementById('sketchpad_canvas_'+this.state.layers[this.state.current_layer])
        var ctx = el.getContext('2d');

        var brush_pre_canvas = this.state.brush_pre_canvas
        var brush_pre_canvas_ctx = brush_pre_canvas.getContext('2d')

        brush_pre_canvas_ctx.clearRect(0,0,1000,1000);

        var brush_cur = this.getCurrentMouseOnBoard(e).slice()

        console.log('?')
        brush_pre_canvas_ctx.lineTo(brush_cur[0], brush_cur[1])
        brush_pre_canvas_ctx.lineJoin = ctx.lineCap = 'round';

        brush_pre_canvas_ctx.stroke()
        if(this.state.lasso_img!=undefined){
            brush_pre_canvas_ctx.globalCompositeOperation='destination-in'
            brush_pre_canvas_ctx.drawImage(this.state.lasso_img, 0, 0, 1000, 1000)
            brush_pre_canvas_ctx.globalCompositeOperation='source-over'
        }

        ctx.drawImage(brush_pre_canvas, 0, 0)
        

        this.setState({brush_cur: brush_cur})
    }

    eraseEnd(e){
        var el = document.getElementById('sketchpad_canvas_'+this.state.layers[this.state.current_layer])
        var ctx = el.getContext('2d');
        // ctx.stroke()
        ctx.globalCompositeOperation ='source-over'
        var el = document.getElementById('sketchpad_canvas_'+this.state.layers[this.state.current_layer])
        var cur_image = el.toDataURL()
        var layers = this.state.layers
        // layers[this.state.current_layer]['image'] = cur_image
        this.props.board_this.updateALayerImage(this.state.current_layer, layers[this.state.current_layer], cur_image, this.state.origin_image)
        this.setState({action:'idle', brush_cur: undefined, brush_pre_canvas:undefined})
    }


    lassoInit(e){
        if(this.state.current_layer==-1){
            return
        }
        var pos = this.getCurrentMouseOnBoard(e)
        console.log(pos)
        this.setState({action:'lasso', lasso:[[pos[0], pos[1]]]})
    }

    lassoMove(e){
        var pos = this.getCurrentMouseOnBoard(e)
        var lasso = this.state.lasso
        // console.log(pos)
        lasso.push([pos[0], pos[1]])
        this.setState({lasso:lasso})
    }

    lassoEnd(e){
        if(this.state.lasso.length>1){
            var canvas = document.createElement('canvas')
            var ctx = canvas.getContext('2d')
            canvas.width = 1000
            canvas.height = 1000
            ctx.beginPath();
            ctx.fillStyle='black';
            for(var i in this.state.lasso){
                var point = this.state.lasso[i]
                // console.log(point)
                if(i==0){
                    ctx.moveTo(point[0], point[1])
                }else{
                    ctx.lineTo(point[0], point[1])
                }
            }
            ctx.closePath()
            ctx.stroke()
            ctx.fill();
          
            this.setState({action:'idle', lasso_img:canvas})
        }else{
            this.setState({action:'idle', lasso_img:undefined, lasso:[]})
        }
        
    }

    moveLayerInit(e){
        e.stopPropagation()
        if(this.state.current_layer==-1){
            return
        }
        var pos = this.getCurrentMouseOnBoard(e)
        var adjust_pre_canvas = document.createElement('canvas')
        adjust_pre_canvas.width = 1000
        adjust_pre_canvas.height = 1000

        var el = document.getElementById('sketchpad_canvas_'+this.state.layers[this.state.current_layer])
        var cur_image = el.toDataURL()

        // adjust_pre_canvas.getContext('2d') = 
        if(this.state.lasso.length>0){
            this.setState({action:'move-layer', move_layer_init_pos: pos, adjust_pre_canvas: adjust_pre_canvas, init_lasso:this.state.lasso.slice(0), origin_image: cur_image})
        }else{
            console.log(JSON.parse(JSON.stringify(this.state.nonlasso_ret)))
            this.setState({action:'move-layer', move_layer_init_pos: pos, adjust_pre_canvas: adjust_pre_canvas, init_nonlasso_ret:JSON.parse(JSON.stringify(this.state.nonlasso_ret)), origin_image: cur_image})
        }
        
        
    }

    moveLayerMove(e){  
        console.log('moving..')
        var adjust_pre_canvas = this.state.adjust_pre_canvas
        var adjust_pre_ctx = adjust_pre_canvas.getContext('2d')
        adjust_pre_ctx.clearRect(0,0,1000,1000)

        var pos = this.getCurrentMouseOnBoard(e)

        adjust_pre_ctx.drawImage(this.state.unlassoed_canvas, 0, 0)

        adjust_pre_ctx.translate(pos[0]-this.state.move_layer_init_pos[0], pos[1]-this.state.move_layer_init_pos[1])
        adjust_pre_ctx.drawImage(this.state.lassoed_canvas, 0, 0)
        adjust_pre_ctx.translate(-pos[0]+this.state.move_layer_init_pos[0], -pos[1]+this.state.move_layer_init_pos[1])

        var el = document.getElementById('sketchpad_canvas_'+this.state.layers[this.state.current_layer])
        var ctx = el.getContext('2d');
        ctx.clearRect(0,0,1000,1000)

        ctx.drawImage(adjust_pre_canvas, 0, 0)

        if(this.state.lasso.length>0){
            var init_lasso = this.state.init_lasso    
            var lasso = []
            for (var i in init_lasso){
                var po = init_lasso[i]
                lasso.push([po[0]+pos[0]-this.state.move_layer_init_pos[0], po[1]+pos[1]-this.state.move_layer_init_pos[1]])
            }
            this.setState({lasso})
        }else{
            var nonlasso_ret = {}
            nonlasso_ret.left = this.state.init_nonlasso_ret.left+pos[0]-this.state.move_layer_init_pos[0]
            nonlasso_ret.top = this.state.init_nonlasso_ret.top+pos[1]-this.state.move_layer_init_pos[1]
            nonlasso_ret.width = this.state.init_nonlasso_ret.width
            nonlasso_ret.height = this.state.init_nonlasso_ret.height
            // console.log(nonlasso_ret)
            this.setState({nonlasso_ret})
        }
        
        

    }

    moveLayerEnd(e){
        var el = document.getElementById('sketchpad_canvas_'+this.state.layers[this.state.current_layer])
        var cur_image = el.toDataURL()
        var layers = this.state.layers
        var layer_dict = this.state.layer_dict
        layer_dict[layers[this.state.current_layer]]['image'] = cur_image

        var pos = this.getCurrentMouseOnBoard(e)
        var lassoed_canvas = this.state.lassoed_canvas
        

        var new_l_canvas = document.createElement('canvas')
        new_l_canvas.width = 1000
        new_l_canvas.height = 1000
        new_l_canvas.getContext('2d').translate(pos[0]-this.state.move_layer_init_pos[0], pos[1]-this.state.move_layer_init_pos[1])
        new_l_canvas.getContext('2d').drawImage(lassoed_canvas, 0, 0)

        if(this.state.lasso.length>0){
            var new_lasso = document.createElement('canvas')
            new_lasso.width = 1000
            new_lasso.height = 1000
            new_lasso.getContext('2d').translate(pos[0]-this.state.move_layer_init_pos[0], pos[1]-this.state.move_layer_init_pos[1])
            new_lasso.getContext('2d').drawImage(this.state.lasso_img, 0, 0)
            this.props.board_this.updateALayerImage(this.state.current_layer, layers[this.state.current_layer], cur_image, this.state.origin_image, 'lasso',this.state.init_lasso.slice())
            this.setState({action:'idle', move_layer_init_pos: undefined, adjust_pre_canvas: undefined, layer_dict: layer_dict, lassoed_canvas:new_l_canvas, lasso_img: new_lasso})
        }else{
            var ctx = el.getContext('2d');
            var ret = this.getCanvasBoundingBox(ctx)
            this.props.board_this.updateALayerImage(this.state.current_layer, layers[this.state.current_layer], cur_image, this.state.origin_image, 'nonlasso', this.state.init_nonlasso_ret)
            this.setState({action:'idle', move_layer_init_pos: undefined, adjust_pre_canvas: undefined, layer_dict: layer_dict, lassoed_canvas:new_l_canvas, nonlasso_ret: ret})
        }
        
        
        
        
    }

    rotateLayerInit(e){
        if(this.state.current_layer==-1){
            return
        }
        var adjust_pre_canvas = document.createElement('canvas')
        adjust_pre_canvas.width = 1000
        adjust_pre_canvas.height = 1000

        var rotateCenter = []

        if(this.state.lasso.length>0){
            var xmax=Number.MIN_VALUE
            var ymax = Number.MIN_VALUE
            var xmin = Number.MAX_VALUE
            var ymin = Number.MAX_VALUE
            for(var i in this.state.lasso){
                var cur_p = this.state.lasso[i]
                if(cur_p[0]>xmax){
                    xmax = cur_p[0]
                }else if(cur_p[0]<xmin){
                    xmin = cur_p[0]
                }

                if(cur_p[1]>ymax){
                    ymax = cur_p[1]
                }else if(cur_p[1]<ymin){
                    ymin = cur_p[1]
                }
            }
            rotateCenter.push((xmin+xmax)/2)
            rotateCenter.push((ymin+ymax)/2)
        }else{
            rotateCenter.push(this.state.nonlasso_ret.left+this.state.nonlasso_ret.width/2)
            rotateCenter.push(this.state.nonlasso_ret.top+this.state.nonlasso_ret.height/2)
        }
        e.stopPropagation()
        var el = document.getElementById('sketchpad_canvas_'+this.state.layers[this.state.current_layer])
        var cur_image = el.toDataURL()
        console.log('rot init')
        this.setState({action: 'rotate-layer', rotateCenter: rotateCenter, adjust_pre_canvas: adjust_pre_canvas, origin_image: cur_image})
    }

    rotateLayerMove(e){
        e.stopPropagation()
        var pos = this.getCurrentMouseOnBoard(e)

        var deg = this.angleBetween(pos, this.state.rotateCenter)
        console.log(deg)

        var adjust_pre_canvas = this.state.adjust_pre_canvas
        var adjust_pre_ctx = adjust_pre_canvas.getContext('2d')
        adjust_pre_ctx.clearRect(0,0,1000,1000)
        // var lassoed_canvas = this.state.lassoed_canvas
        // var lassoed_ctx = lassoed_canvas.getContext('2d')


        var pos = this.getCurrentMouseOnBoard(e)

        adjust_pre_ctx.drawImage(this.state.unlassoed_canvas, 0, 0)

        adjust_pre_ctx.translate(this.state.rotateCenter[0], this.state.rotateCenter[1])
        adjust_pre_ctx.rotate(-deg)
        adjust_pre_ctx.translate(-this.state.rotateCenter[0], -this.state.rotateCenter[1])
        adjust_pre_ctx.drawImage(this.state.lassoed_canvas, 0, 0)
        adjust_pre_ctx.translate(this.state.rotateCenter[0], this.state.rotateCenter[1])
        adjust_pre_ctx.rotate(deg)
        adjust_pre_ctx.translate(-this.state.rotateCenter[0], -this.state.rotateCenter[1])

        var el = document.getElementById('sketchpad_canvas_'+this.state.layers[this.state.current_layer])
        var ctx = el.getContext('2d');
        ctx.clearRect(0,0,1000,1000)

        ctx.drawImage(adjust_pre_canvas, 0, 0)

        this.setState({lasso_rot_deg: -deg*180/Math.PI})

        // rotate drawing, lasso img
        
    }

    rotateLayerEnd(e){
        var lassoed_canvas = document.createElement('canvas')
        var lassoed_ctx = lassoed_canvas.getContext('2d')
        lassoed_canvas.width = this.state.lassoed_canvas.width
        lassoed_canvas.height = this.state.lassoed_canvas.height
        // lassoed_ctx.drawImage(this.state.lassoed_canvas, 0, 0)
        lassoed_ctx.translate(this.state.rotateCenter[0], this.state.rotateCenter[1])
        lassoed_ctx.rotate(this.state.lasso_rot_deg*Math.PI/180)
        lassoed_ctx.translate(-this.state.rotateCenter[0], -this.state.rotateCenter[1])
        lassoed_ctx.drawImage(this.state.lassoed_canvas, 0, 0)
        lassoed_ctx.translate(this.state.rotateCenter[0], this.state.rotateCenter[1])
        lassoed_ctx.rotate(-this.state.lasso_rot_deg*Math.PI/180)
        lassoed_ctx.translate(-this.state.rotateCenter[0], -this.state.rotateCenter[1])

        var el = document.getElementById('sketchpad_canvas_'+this.state.layers[this.state.current_layer])
        var cur_image = el.toDataURL()
        var layers = this.state.layers
        var layer_dict = this.state.layer_dict
        layer_dict[layers[this.state.current_layer]]['image'] = cur_image

        


        // console.image(lassoed_canvas.toDataURL())

        if(this.state.lasso.length>0){
            var lasso_img = document.createElement('canvas')
            var lasso_ctx = lasso_img.getContext('2d')
            lasso_img.width = this.state.lasso_img.width
            lasso_img.height = this.state.lasso_img.height

            lasso_ctx.translate(this.state.rotateCenter[0], this.state.rotateCenter[1])
            lasso_ctx.rotate(this.state.lasso_rot_deg*Math.PI/180)
            lasso_ctx.translate(-this.state.rotateCenter[0], -this.state.rotateCenter[1])
            lasso_ctx.drawImage(this.state.lasso_img, 0, 0)
            lasso_ctx.translate(this.state.rotateCenter[0], this.state.rotateCenter[1])
            lasso_ctx.rotate(-this.state.lasso_rot_deg*Math.PI/180)
            lasso_ctx.translate(-this.state.rotateCenter[0], -this.state.rotateCenter[1])

            var deg = this.state.lasso_rot_deg/-180*Math.PI
            var new_lasso = []
            for(var i in this.state.lasso){
                var p = this.state.lasso[i]
                var dx = (p[0]-this.state.rotateCenter[0])
                var dy = (p[1]-this.state.rotateCenter[1])

                var nx = dx*Math.cos(deg)+dy*Math.sin(deg)+this.state.rotateCenter[0]
                var ny = -dx*Math.sin(deg)+dy*Math.cos(deg)+this.state.rotateCenter[1]
                new_lasso.push([nx, ny])
            }
            this.props.board_this.updateALayerImage(this.state.current_layer, layers[this.state.current_layer], cur_image, this.state.origin_image, 'lasso', this.state.lasso.slice())
            this.setState({action:'idle', rotateCenter:undefined, lasso_rot_deg: 0, lasso: new_lasso, lassoed_canvas, lasso_img: lasso_img})
        }else{
            // var el = document.getElementById('sketchpad_canvas_'+this.state.layers[this.state.current_layer]['layer_id'])
            var ctx = el.getContext('2d');
            var ret = this.getCanvasBoundingBox(ctx)
            this.props.board_this.updateALayerImage(this.state.current_layer, layers[this.state.current_layer], cur_image, this.state.origin_image, 'nonlasso', JSON.parse(JSON.stringify(this.state.nonlasso_ret)))
            this.setState({action:'idle', rotateCenter:undefined, lasso_rot_deg: 0, nonlasso_ret:ret, lassoed_canvas: lassoed_canvas})
        }
    }

    resizeLayerInit(direction, e){
        if(this.state.current_layer==-1){
            return
        }
        var ret
        var adjust_pre_canvas = document.createElement('canvas')
        adjust_pre_canvas.width = 1000
        adjust_pre_canvas.height = 1000
        var el = document.getElementById('sketchpad_canvas_'+this.state.layers[this.state.current_layer])
        var cur_image = el.toDataURL()

        if(this.state.lasso.length>0){
            var xmax=Number.MIN_VALUE
            var ymax = Number.MIN_VALUE
            var xmin = Number.MAX_VALUE
            var ymin = Number.MAX_VALUE

            for(var i in this.state.lasso){
                var cur_p = this.state.lasso[i]
                if(cur_p[0]>xmax){
                    xmax = cur_p[0]
                }else if(cur_p[0]<xmin){
                    xmin = cur_p[0]
                }

                if(cur_p[1]>ymax){
                    ymax = cur_p[1]
                }else if(cur_p[1]<ymin){
                    ymin = cur_p[1]
                }
            }
            ret = {left: xmin, right: xmax, width: xmax-xmin, top: ymin, bottom: ymax, height: ymax-ymin}
        

            this.setState({lasso_resize_direction: direction, action: 'resize-layer', resize_layer_init_pos: this.getCurrentMouseOnBoard(e), 
                resize_ret: ret, init_lasso: this.state.lasso.slice(0), adjust_pre_canvas: adjust_pre_canvas, origin_image: cur_image})
        }else{
            ret = JSON.parse(JSON.stringify(this.state.nonlasso_ret))
            this.setState({lasso_resize_direction: direction, action: 'resize-layer', resize_layer_init_pos: this.getCurrentMouseOnBoard(e), 
                resize_ret: ret, init_resize_ret: ret, adjust_pre_canvas: adjust_pre_canvas, origin_image: cur_image})
        }
        
    }

    adjustResizeToRatio(pos){
        var init_x_name, init_y_name
        if(this.state.lasso_resize_direction=='se'){
            init_x_name = 'left'
            init_y_name = 'top'
        }else if(this.state.lasso_resize_direction=='sw'){
            init_x_name = 'right'
            init_y_name = 'top'
        }else if(this.state.lasso_resize_direction=='ne'){
            init_x_name = 'left'
            init_y_name = 'bottom'
        }else if(this.state.lasso_resize_direction=='nw'){
            init_x_name = 'right'
            init_y_name = 'bottom'
        }

        var init_x = this.state.resize_ret[init_x_name]
        var init_y = this.state.resize_ret[init_y_name]

        var cur_w = Math.abs(init_x-pos[0])
        var cur_h = Math.abs(init_y-pos[1])
        var cur_ratio = cur_h/cur_w

        var ideal_ratio = this.state.resize_ret['height']/this.state.resize_ret['width']

        if(cur_ratio > ideal_ratio){
            cur_h = ideal_ratio * cur_w
        }else{
            cur_w = cur_h / ideal_ratio
        }

        if(init_x>pos[0]){
            pos[0] = init_x-cur_w
        }else{
            pos[0] = init_x+cur_w
        }
        if(init_y>pos[1]){
            pos[1] = init_y-cur_h
        }else{
            pos[1] = init_y+cur_h
        }
     
        return pos

    }

    resizeLayerMove(e){
        e.stopPropagation()
        var pos = this.getCurrentMouseOnBoard(e)
        var init_pos = this.state.resize_layer_init_pos
        var resize_ret = this.state.resize_ret

        if(this.state.shift_pressed){
            if(this.state.lasso_resize_direction=='nw'||this.state.lasso_resize_direction=='ne'||this.state.lasso_resize_direction=='se'||this.state.lasso_resize_direction=='sw'){
            
                pos = this.adjustResizeToRatio(pos)
            
            }
            

            
        }

        // change what is drawn on the canvas
        var adjust_pre_canvas = this.state.adjust_pre_canvas
        var adjust_pre_ctx = adjust_pre_canvas.getContext('2d')
        adjust_pre_ctx.clearRect(0,0,1000,1000)
        

        
        if(this.state.lasso_resize_direction.indexOf('n')!=-1){
            var scale = (resize_ret['height']-pos[1]+init_pos[1])/resize_ret['height']
            adjust_pre_ctx.scale(1, scale)
            adjust_pre_ctx.translate(0, this.state.resize_ret['bottom']*(1/scale-1))
        }

        if(this.state.lasso_resize_direction.indexOf('s')!=-1){
            var scale = (resize_ret['height']+pos[1]-init_pos[1])/resize_ret['height']
            adjust_pre_ctx.scale(1, scale)
            adjust_pre_ctx.translate(0, this.state.resize_ret['top']*(1/scale-1))
        }
        if(this.state.lasso_resize_direction.indexOf('w')!=-1){
            var scale = (resize_ret['width']-pos[0]+init_pos[0])/resize_ret['width']
            adjust_pre_ctx.scale(scale, 1)
            adjust_pre_ctx.translate(this.state.resize_ret['right']*(1/scale-1), 0)
        }
        if(this.state.lasso_resize_direction.indexOf('e')!=-1){
            var scale = (resize_ret['width']+pos[0]-init_pos[0])/resize_ret['width']
            adjust_pre_ctx.scale(scale, 1)
            adjust_pre_ctx.translate(this.state.resize_ret['left']*(1/scale-1), 0)
        }
        adjust_pre_ctx.drawImage(this.state.lassoed_canvas, 0, 0)
        if(this.state.lasso_resize_direction.indexOf('n')!=-1){
            var scale = (resize_ret['height']-pos[1]+init_pos[1])/resize_ret['height']
            adjust_pre_ctx.translate(0, -this.state.resize_ret['bottom']*(1/scale-1))
            adjust_pre_ctx.scale(1, 1/scale);
        }
        if(this.state.lasso_resize_direction.indexOf('s')!=-1){
            var scale = (resize_ret['height']+pos[1]-init_pos[1])/resize_ret['height']
            adjust_pre_ctx.translate(0, -this.state.resize_ret['top']*(1/scale-1))
            adjust_pre_ctx.scale(1, 1/scale);
        }
        if(this.state.lasso_resize_direction.indexOf('w')!=-1){
            var scale = (resize_ret['width']-pos[0]+init_pos[0])/resize_ret['width']
            adjust_pre_ctx.translate(-this.state.resize_ret['right']*(1/scale-1),0)
            adjust_pre_ctx.scale(1/scale,1);
        }
        if(this.state.lasso_resize_direction.indexOf('e')!=-1){
            var scale = (resize_ret['width']+pos[0]-init_pos[0])/resize_ret['width']
            adjust_pre_ctx.translate(-this.state.resize_ret['left']*(1/scale-1),0)
            adjust_pre_ctx.scale(1/scale,1);
        }

        adjust_pre_ctx.globalCompositeOperation='destination-over'
        adjust_pre_ctx.drawImage(this.state.unlassoed_canvas, 0, 0)
        adjust_pre_ctx.globalCompositeOperation='source-over'


        var el = document.getElementById('sketchpad_canvas_'+this.state.layers[this.state.current_layer])
        var ctx = el.getContext('2d');
        ctx.clearRect(0,0,1000,1000)
        ctx.drawImage(adjust_pre_canvas, 0, 0)

        if(this.state.lasso.length>0){
            // change lasso pos
            var lasso = []
            
            for (i in this.state.lasso){
                lasso.push([this.state.lasso[i][0], this.state.lasso[i][1]])
            }
            console.log(lasso[0][1], resize_ret)
            if(this.state.lasso_resize_direction.indexOf('n')!=-1){
                for(var i in lasso){
                    var new_height = resize_ret['height']-pos[1]+init_pos[1]
                    lasso[i][1] = resize_ret['bottom']-(new_height)/resize_ret['height']*(resize_ret['bottom']-this.state.init_lasso[i][1])
                }
            }

            if(this.state.lasso_resize_direction.indexOf('s')!=-1){
                for(var i in lasso){
                    var new_height = resize_ret['height']+pos[1]-init_pos[1]
                    lasso[i][1] = resize_ret['top']-(new_height)/resize_ret['height']*(resize_ret['top']-this.state.init_lasso[i][1])
                }
            }

            if(this.state.lasso_resize_direction.indexOf('e')!=-1){
                for(var i in lasso){
                    var new_height = resize_ret['width']+pos[0]-init_pos[0]
                    lasso[i][0] = resize_ret['left']-(new_height)/resize_ret['width']*(resize_ret['left']-this.state.init_lasso[i][0])
                }
            }

            if(this.state.lasso_resize_direction.indexOf('w')!=-1){
                for(var i in lasso){
                    var new_height = resize_ret['width']-pos[0]+init_pos[0]
                    lasso[i][0] = resize_ret['right']-(new_height)/resize_ret['width']*(resize_ret['right']-this.state.init_lasso[i][0])
                }
            }

            this.setState({lasso:lasso})
        }else{
            // change ret pos
            var ret = this.state.nonlasso_ret
            if(this.state.lasso_resize_direction.indexOf('n')!=-1){
                ret['height'] = resize_ret['height']-pos[1]+init_pos[1]
                ret['top'] = resize_ret['top']+pos[1]-init_pos[1]
            }
            if(this.state.lasso_resize_direction.indexOf('s')!=-1){
                ret['height'] = resize_ret['height']+pos[1]-init_pos[1]
                ret['bottom'] = resize_ret['bottom']-pos[1]+init_pos[1]
            }
            if(this.state.lasso_resize_direction.indexOf('e')!=-1){
                ret['width'] = resize_ret['width']+pos[0]-init_pos[0]
                ret['right'] = resize_ret['right']-pos[0]+init_pos[0]
            }
            if(this.state.lasso_resize_direction.indexOf('w')!=-1){
                ret['width'] = resize_ret['width']-pos[0]+init_pos[0]
                ret['left'] = resize_ret['left']+pos[0]-init_pos[0]
            }
            this.setState({nonlasso_ret:ret})
        }

        
        
    }

    resizeLayerEnd(e){
        var pos = this.getCurrentMouseOnBoard(e)
        if(this.state.shift_pressed){
            pos = this.adjustResizeToRatio(pos)
        }
        var init_pos = this.state.resize_layer_init_pos
        var resize_ret = this.state.resize_ret
        var lassoed_canvas = document.createElement('canvas')
        var lassoed_ctx = lassoed_canvas.getContext('2d')
        lassoed_canvas.width = this.state.lassoed_canvas.width
        lassoed_canvas.height = this.state.lassoed_canvas.height

        var el = document.getElementById('sketchpad_canvas_'+this.state.layers[this.state.current_layer])
        var cur_image = el.toDataURL()
        var layers = this.state.layers
        var layer_dict = this.state.layer_dict
        layer_dict[layers[this.state.current_layer]]['image'] = cur_image

        if(this.state.lasso_resize_direction.indexOf('n')!=-1){
            var scale = (resize_ret['height']-pos[1]+init_pos[1])/resize_ret['height']
            lassoed_ctx.scale(1, scale)
            lassoed_ctx.translate(0, this.state.resize_ret['bottom']*(1/scale-1))
        }

        if(this.state.lasso_resize_direction.indexOf('s')!=-1){
            var scale = (resize_ret['height']+pos[1]-init_pos[1])/resize_ret['height']
            lassoed_ctx.scale(1, scale)
            lassoed_ctx.translate(0, this.state.resize_ret['top']*(1/scale-1))
        }
        if(this.state.lasso_resize_direction.indexOf('w')!=-1){
            var scale = (resize_ret['width']-pos[0]+init_pos[0])/resize_ret['width']
            lassoed_ctx.scale(scale, 1)
            lassoed_ctx.translate(this.state.resize_ret['right']*(1/scale-1), 0)
        }
        if(this.state.lasso_resize_direction.indexOf('e')!=-1){
            var scale = (resize_ret['width']+pos[0]-init_pos[0])/resize_ret['width']
            lassoed_ctx.scale(scale, 1)
            lassoed_ctx.translate(this.state.resize_ret['left']*(1/scale-1), 0)
        }
        lassoed_ctx.drawImage(this.state.lassoed_canvas, 0, 0)
        if(this.state.lasso_resize_direction.indexOf('n')!=-1){
            var scale = (resize_ret['height']-pos[1]+init_pos[1])/resize_ret['height']
            lassoed_ctx.translate(0, -this.state.resize_ret['bottom']*(1/scale-1))
            lassoed_ctx.scale(1, 1/scale);
        }
        if(this.state.lasso_resize_direction.indexOf('s')!=-1){
            var scale = (resize_ret['height']+pos[1]-init_pos[1])/resize_ret['height']
            lassoed_ctx.translate(0, -this.state.resize_ret['top']*(1/scale-1))
            lassoed_ctx.scale(1, 1/scale);
        }
        if(this.state.lasso_resize_direction.indexOf('w')!=-1){
            var scale = (resize_ret['width']-pos[0]+init_pos[0])/resize_ret['width']
            lassoed_ctx.translate(-this.state.resize_ret['right']*(1/scale-1),0)
            lassoed_ctx.scale(1/scale,1);
        }
        if(this.state.lasso_resize_direction.indexOf('e')!=-1){
            var scale = (resize_ret['width']+pos[0]-init_pos[0])/resize_ret['width']
            lassoed_ctx.translate(-this.state.resize_ret['left']*(1/scale-1),0)
            lassoed_ctx.scale(1/scale,1);
        }


        if(this.state.lasso.length>0){
            var lasso_img = document.createElement('canvas')
            var lasso_ctx = lasso_img.getContext('2d')
            lasso_img.width = this.state.lasso_img.width
            lasso_img.height = this.state.lasso_img.height

            if(this.state.lasso_resize_direction.indexOf('n')!=-1){
                var scale = (resize_ret['height']-pos[1]+init_pos[1])/resize_ret['height']
                lasso_ctx.scale(1, scale)
                lasso_ctx.translate(0, this.state.resize_ret['bottom']*(1/scale-1))
            }
    
            if(this.state.lasso_resize_direction.indexOf('s')!=-1){
                var scale = (resize_ret['height']+pos[1]-init_pos[1])/resize_ret['height']
                lasso_ctx.scale(1, scale)
                lasso_ctx.translate(0, this.state.resize_ret['top']*(1/scale-1))
            }
            if(this.state.lasso_resize_direction.indexOf('w')!=-1){
                var scale = (resize_ret['width']-pos[0]+init_pos[0])/resize_ret['width']
                lasso_ctx.scale(scale, 1)
                lasso_ctx.translate(this.state.resize_ret['right']*(1/scale-1), 0)
            }
            if(this.state.lasso_resize_direction.indexOf('e')!=-1){
                var scale = (resize_ret['width']+pos[0]-init_pos[0])/resize_ret['width']
                lasso_ctx.scale(scale, 1)
                lasso_ctx.translate(this.state.resize_ret['left']*(1/scale-1), 0)
            }
            lasso_ctx.drawImage(this.state.lasso_img, 0, 0)
            if(this.state.lasso_resize_direction.indexOf('n')!=-1){
                var scale = (resize_ret['height']-pos[1]+init_pos[1])/resize_ret['height']
                lasso_ctx.translate(0, -this.state.resize_ret['bottom']*(1/scale-1))
                lasso_ctx.scale(1, 1/scale);
            }
            if(this.state.lasso_resize_direction.indexOf('s')!=-1){
                var scale = (resize_ret['height']+pos[1]-init_pos[1])/resize_ret['height']
                lasso_ctx.translate(0, -this.state.resize_ret['top']*(1/scale-1))
                lasso_ctx.scale(1, 1/scale);
            }
            if(this.state.lasso_resize_direction.indexOf('w')!=-1){
                var scale = (resize_ret['width']-pos[0]+init_pos[0])/resize_ret['width']
                lasso_ctx.translate(-this.state.resize_ret['right']*(1/scale-1),0)
                lasso_ctx.scale(1/scale,1);
            }
            if(this.state.lasso_resize_direction.indexOf('e')!=-1){
                var scale = (resize_ret['width']+pos[0]-init_pos[0])/resize_ret['width']
                lasso_ctx.translate(-this.state.resize_ret['left']*(1/scale-1),0)
                lasso_ctx.scale(1/scale,1);
            }

            this.props.board_this.updateALayerImage(this.state.current_layer, layers[this.state.current_layer], cur_image, this.state.origin_image, 'lasso',this.state.init_lasso.slice())
            this.setState({action: 'idle', lassoed_canvas: lassoed_canvas, lasso_img:lasso_img,
            lasso_resize_direction:undefined,resize_layer_init_pos:undefined, resize_ret:undefined, init_lasso:undefined, adjust_pre_canvas:undefined})
        }else{
            var ctx = el.getContext('2d');
            var ret = this.getCanvasBoundingBox(ctx)
            this.props.board_this.updateALayerImage(this.state.current_layer, layers[this.state.current_layer], cur_image, this.state.origin_image, 'nonlasso', JSON.parse(JSON.stringify(this.state.init_resize_ret)))
            this.setState({action: 'idle', lassoed_canvas: lassoed_canvas, nonlasso_ret: ret,
            lasso_resize_direction:undefined,resize_layer_init_pos:undefined, resize_ret:undefined, init_lasso:undefined, adjust_pre_canvas:undefined})
        }

    }

    contentStampInit(e){
        var current_image_id = this.props.board_this.moodboard.state.current_image[0]
        var cur_art = this.props.board_this.moodboard.state.arts[current_image_id].file
        var im= new Image;
        var _this = this
        var p = _this.getCurrentMouseOnBoard(e)
        im.onload = function(){
            // var el = document.getElementById('sketchpad_canvas_'+_this.state.layers[_this.state.current_layer])
            // var cur_image = el.toDataURL()
            _this.setState({content_stamp_img: im, content_stamp_ratio:im.height/im.width, content_stamp_init_pos: p, content_stamp_cur_pos: p, action: 'content-stamp'})

            // var w = 200
            // var h = im.height * w /im.width
            // el.getContext('2d').drawImage(im, p[0]-w/2, p[1]-h/2, w, h)
            // _this.props.board_this.updateALayerImage(_this.state.current_layer, _this.state.layers[_this.state.current_layer], el.toDataURL(), cur_image)

        }
        im.src = cur_art
    }

    contentStampMove(e){
        var p = this.getCurrentMouseOnBoard(e)
        this.setState({content_stamp_cur_pos: p})
    }

    contentStampEnd(e){
        // var smallx = (this.state.content_stamp_init_pos[0]<this.state.content_stamp_cur_pos[0])?this.state.content_stamp_init_pos[0]:this.state.content_stamp_cur_pos[0]
        // var bigx = (this.state.content_stamp_init_pos[0]>=this.state.content_stamp_cur_pos[0])?this.state.content_stamp_init_pos[0]:this.state.content_stamp_cur_pos[0]
        // var smally = (this.state.content_stamp_init_pos[1]<this.state.content_stamp_cur_pos[1])?this.state.content_stamp_init_pos[1]:this.state.content_stamp_cur_pos[1]
        // var bigy = (this.state.content_stamp_init_pos[1]>=this.state.content_stamp_cur_pos[1])?this.state.content_stamp_init_pos[1]:this.state.content_stamp_cur_pos[1]

        var width = Math.abs(this.state.content_stamp_init_pos[0]-this.state.content_stamp_cur_pos[0])
        var height = Math.abs(this.state.content_stamp_init_pos[1]-this.state.content_stamp_cur_pos[1])

        var cur_ratio = height/width
        if(cur_ratio > this.state.content_stamp_ratio){
            // keep width
            height = this.state.content_stamp_ratio * width
        }else{
            // keep height
            width = height / this.state.content_stamp_ratio
        }
        
        var startx, starty

        if(this.state.content_stamp_init_pos[0]>this.state.content_stamp_cur_pos[0]){
            startx = this.state.content_stamp_init_pos[0]-width
        }else{
            startx = this.state.content_stamp_init_pos[0]
        }

        if(this.state.content_stamp_init_pos[1]>this.state.content_stamp_cur_pos[1]){
            starty = this.state.content_stamp_init_pos[1]-height
        }else{
            starty = this.state.content_stamp_init_pos[1]
        }

        var el = document.getElementById('sketchpad_canvas_'+this.state.layers[this.state.current_layer])
        var cur_image = el.toDataURL()
        el.getContext('2d').drawImage(this.state.content_stamp_img, startx, starty, width, height)
        this.props.board_this.updateALayerImage(this.state.current_layer, this.state.layers[this.state.current_layer], el.toDataURL(), cur_image)
        this.setState({control_state:'move-layer', action:'idle'}, function(){
            this.initializeMoveLayer()
        })
        this.props.board_this.moodboard.setState({control_state:'control_object'})
    }



    renderCanvas(){
        return this.state.layers.map((layer, idx)=>{
            return <SketchpadCanvas key={'sketchpad_canvas'+layer} canvas_id={layer} mother_state={this.state}></SketchpadCanvas>
        }).reverse()
    }

    renderAdjuster(){
        if(this.state.control_state=='move-layer'){
            if(this.state.lasso.length>0){
                var xmax=Number.MIN_VALUE
                var ymax = Number.MIN_VALUE
                var xmin = Number.MAX_VALUE
                var ymin = Number.MAX_VALUE

                for(var i in this.state.lasso){
                    var cur_p = this.state.lasso[i]
                    if(cur_p[0]>xmax){
                        xmax = cur_p[0]
                    }else if(cur_p[0]<xmin){
                        xmin = cur_p[0]
                    }

                    if(cur_p[1]>ymax){
                        ymax = cur_p[1]
                    }else if(cur_p[1]<ymin){
                        ymin = cur_p[1]
                    }
                }
                // console.log(xmin, ymin)
                var xcenter = (xmin+xmax)/2000*this.state.boardlength*this.state.boardzoom
                var ycenter = (ymin+ymax)/2000*this.state.boardlength*this.state.boardzoom
                return (<g style={{transformOrigin: xcenter+'px '+ycenter+'px', transform: 'rotate('+this.state.lasso_rot_deg+'deg)'}}>
                    <rect x={xmin/1000*this.state.boardlength*this.state.boardzoom} y={ymin/1000*this.state.boardlength*this.state.boardzoom} width={(xmax-xmin)/1000*this.state.boardlength*this.state.boardzoom} height={(ymax-ymin)/1000*this.state.boardlength*this.state.boardzoom}
                     style={{fill:'transparent', stroke:'#333333', strokeDasharray:"5,5", cursor: 'move'}}
                     onPointerDown={this.moveLayerInit.bind(this)}>
                    </rect>
                    <rect x={xmin/1000*this.state.boardlength*this.state.boardzoom} y={ymin/1000*this.state.boardlength*this.state.boardzoom} width={(xmax-xmin)/1000*this.state.boardlength*this.state.boardzoom} height={10}
                    style={{fill:'transparent', cursor:'n-resize'}} onPointerDown={this.resizeLayerInit.bind(this, 'n')}
                    ></rect> 
                    <rect x={xmin/1000*this.state.boardlength*this.state.boardzoom} y={ymax/1000*this.state.boardlength*this.state.boardzoom-10} width={(xmax-xmin)/1000*this.state.boardlength*this.state.boardzoom} height={10}
                    style={{fill:'transparent', cursor:'s-resize'}} onPointerDown={this.resizeLayerInit.bind(this, 's')}
                    ></rect> 
                    <rect x={xmin/1000*this.state.boardlength*this.state.boardzoom} y={ymin/1000*this.state.boardlength*this.state.boardzoom} width={10} height={(ymax-ymin)/1000*this.state.boardlength*this.state.boardzoom}
                    style={{fill:'transparent', cursor:'w-resize'}} onPointerDown={this.resizeLayerInit.bind(this, 'w')}
                    ></rect>
                    <rect x={xmax/1000*this.state.boardlength*this.state.boardzoom-10} y={ymin/1000*this.state.boardlength*this.state.boardzoom} width={10} height={(ymax-ymin)/1000*this.state.boardlength*this.state.boardzoom}
                    style={{fill:'transparent', cursor:'e-resize'}} onPointerDown={this.resizeLayerInit.bind(this, 'e')}
                    ></rect> 

                    <rect x={xmin/1000*this.state.boardlength*this.state.boardzoom} y={ymin/1000*this.state.boardlength*this.state.boardzoom} width={10} height={10}
                    style={{fill:'white', cursor:'nw-resize', stroke:'#333333'}} onPointerDown={this.resizeLayerInit.bind(this, 'nw')}
                    ></rect> 
                    <rect x={xmax/1000*this.state.boardlength*this.state.boardzoom-10} y={ymin/1000*this.state.boardlength*this.state.boardzoom} width={10} height={10}
                    style={{fill:'white', cursor:'ne-resize', stroke:'#333333'}} onPointerDown={this.resizeLayerInit.bind(this, 'ne')}
                    ></rect> 
                    <rect x={xmin/1000*this.state.boardlength*this.state.boardzoom} y={ymax/1000*this.state.boardlength*this.state.boardzoom-10} width={10} height={10}
                    style={{fill:'white', cursor:'sw-resize', stroke:'#333333'}} onPointerDown={this.resizeLayerInit.bind(this, 'sw')}
                    ></rect> 
                    <rect x={xmax/1000*this.state.boardlength*this.state.boardzoom-10} y={ymax/1000*this.state.boardlength*this.state.boardzoom-10} width={10} height={10}
                    style={{fill:'white', cursor:'se-resize', stroke:'#333333'}} onPointerDown={this.resizeLayerInit.bind(this, 'se')}
                    ></rect> 

                    <rect x={(xmax+xmin)/2000*this.state.boardlength*this.state.boardzoom-5} y={ymin/1000*this.state.boardlength*this.state.boardzoom-30} width={10} height={10}
                        style={{fill:'white', stroke:'#333333', cursor:'rotate'}} onPointerDown={this.rotateLayerInit.bind(this)}
                    ></rect> 
                </g>)
            }else if(this.state.nonlasso_ret!=undefined){
                var ret = this.state.nonlasso_ret
                var xmin = ret.left
                var xmax = ret.left+ret.width
                var ymin = ret.top
                var ymax = ret.top+ret.height
                var xcenter = (xmin+xmax)/2000*this.state.boardlength*this.state.boardzoom
                var ycenter = (ymin+ymax)/2000*this.state.boardlength*this.state.boardzoom
                return (<g style={{transformOrigin: xcenter+'px '+ycenter+'px', transform: 'rotate('+this.state.lasso_rot_deg+'deg)'}}>
                    <rect x={ret.left/1000*this.state.boardlength*this.state.boardzoom} y={ret.top/1000*this.state.boardlength*this.state.boardzoom} width={ret.width/1000*this.state.boardlength*this.state.boardzoom} height={ret.height/1000*this.state.boardlength*this.state.boardzoom}
                     style={{fill:'transparent', stroke:'#333333', strokeDasharray:"5,5", cursor: 'move'}}
                     onPointerDown={this.moveLayerInit.bind(this)}>
                    </rect>

                    {/* <rect x={xmin/1000*this.state.boardlength*this.state.boardzoom} y={ymin/1000*this.state.boardlength*this.state.boardzoom} width={(xmax-xmin)/1000*this.state.boardlength*this.state.boardzoom} height={(ymax-ymin)/1000*this.state.boardlength*this.state.boardzoom}
                     style={{fill:'transparent', stroke:'#333333', strokeDasharray:"5,5", cursor: 'move'}}
                     onPointerDown={this.moveLayerInit.bind(this)}>
                    </rect> */}
                    <rect x={xmin/1000*this.state.boardlength*this.state.boardzoom} y={ymin/1000*this.state.boardlength*this.state.boardzoom} width={(xmax-xmin)/1000*this.state.boardlength*this.state.boardzoom} height={10}
                    style={{fill:'transparent', cursor:'n-resize'}} onPointerDown={this.resizeLayerInit.bind(this, 'n')}
                    ></rect> 
                    <rect x={xmin/1000*this.state.boardlength*this.state.boardzoom} y={ymax/1000*this.state.boardlength*this.state.boardzoom-10} width={(xmax-xmin)/1000*this.state.boardlength*this.state.boardzoom} height={10}
                    style={{fill:'transparent', cursor:'s-resize'}} onPointerDown={this.resizeLayerInit.bind(this, 's')}
                    ></rect> 
                    <rect x={xmin/1000*this.state.boardlength*this.state.boardzoom} y={ymin/1000*this.state.boardlength*this.state.boardzoom} width={10} height={(ymax-ymin)/1000*this.state.boardlength*this.state.boardzoom}
                    style={{fill:'transparent', cursor:'w-resize'}} onPointerDown={this.resizeLayerInit.bind(this, 'w')}
                    ></rect>
                    <rect x={xmax/1000*this.state.boardlength*this.state.boardzoom-10} y={ymin/1000*this.state.boardlength*this.state.boardzoom} width={10} height={(ymax-ymin)/1000*this.state.boardlength*this.state.boardzoom}
                    style={{fill:'transparent', cursor:'e-resize'}} onPointerDown={this.resizeLayerInit.bind(this, 'e')}
                    ></rect> 

                    <rect x={xmin/1000*this.state.boardlength*this.state.boardzoom} y={ymin/1000*this.state.boardlength*this.state.boardzoom} width={10} height={10}
                    style={{fill:'white', cursor:'nw-resize', stroke:'#333333'}} onPointerDown={this.resizeLayerInit.bind(this, 'nw')}
                    ></rect> 
                    <rect x={xmax/1000*this.state.boardlength*this.state.boardzoom-10} y={ymin/1000*this.state.boardlength*this.state.boardzoom} width={10} height={10}
                    style={{fill:'white', cursor:'ne-resize',stroke:'#333333'}} onPointerDown={this.resizeLayerInit.bind(this, 'ne')}
                    ></rect> 
                    <rect x={xmin/1000*this.state.boardlength*this.state.boardzoom} y={ymax/1000*this.state.boardlength*this.state.boardzoom-10} width={10} height={10}
                    style={{fill:'white', cursor:'sw-resize',stroke:'#333333'}} onPointerDown={this.resizeLayerInit.bind(this, 'sw')}
                    ></rect> 
                    <rect x={xmax/1000*this.state.boardlength*this.state.boardzoom-10} y={ymax/1000*this.state.boardlength*this.state.boardzoom-10} width={10} height={10}
                    style={{fill:'white', cursor:'se-resize',stroke:'#333333'}} onPointerDown={this.resizeLayerInit.bind(this, 'se')}
                    ></rect> 

                    <rect x={(xmax+xmin)/2000*this.state.boardlength*this.state.boardzoom-5} y={ymin/1000*this.state.boardlength*this.state.boardzoom-30} width={10} height={10}
                        style={{fill:'white', stroke:'#333333', cursor:'rotate'}} onPointerDown={this.rotateLayerInit.bind(this)}
                    ></rect> 
                </g>)
            }
    
        }
    }

    renderLasso(){
        if(this.state.lasso.length!=0){
            var path = "M"
            for(var i in this.state.lasso){
                var cur_point = this.state.lasso[i]
                path = path+(cur_point[0]/1000*this.state.boardlength*this.state.boardzoom).toString()+' '+(cur_point[1]/1000*this.state.boardlength*this.state.boardzoom).toString()
                if(i!=this.state.lasso.length-1){
                    path = path+' L'
                }else{
                    path = path+' Z'
                }
            }
            if(this.state.lasso_rot_deg!=0){

                return (<g style={{transformOrigin: this.state.rotateCenter[0]/1000*this.state.boardlength*this.state.boardzoom+'px '+this.state.rotateCenter[1]/1000*this.state.boardlength*this.state.boardzoom+'px', transform: 'rotate('+this.state.lasso_rot_deg+'deg)'}}>
                    <path 
                    d={path} fill='transparent' stroke='white' strokeDasharray='5, 2' strokeWidth={4}></path>
                    <path 
                    d={path} fill='transparent' stroke='#333333' strokeDasharray='5, 2' strokeWidth={2}></path>
                </g>
                )
            }else{
                return (<g>
                    <path 
                    d={path} fill='transparent' stroke='white' strokeDasharray='5, 2' strokeWidth={4}></path>
                    <path 
                    d={path} fill='transparent' stroke='#333333' strokeDasharray='5, 2' strokeWidth={2}></path>
                </g>)
            }
            
        }
    }

    initializeMoveLayer(){
        var el = document.getElementById('sketchpad_canvas_'+this.state.layers[this.state.current_layer])
        var ctx = el.getContext('2d');
        console.log('init!!')
        if(this.state.lasso_img!=undefined){
            var lassoed_canvas = document.createElement('canvas')
            lassoed_canvas.width =1000
            lassoed_canvas.height=1000 
            var lassoed_ctx = lassoed_canvas.getContext('2d')

            var unlassoed_canvas = document.createElement('canvas')
            unlassoed_canvas.width =1000
            unlassoed_canvas.height=1000 
            var unlassoed_ctx = unlassoed_canvas.getContext('2d')

            lassoed_ctx.drawImage(el,0,0)
            unlassoed_ctx.drawImage(el,0,0)

            lassoed_ctx.globalCompositeOperation='destination-in'
            unlassoed_ctx.globalCompositeOperation = 'destination-out'

            lassoed_ctx.drawImage(this.state.lasso_img,0,0)
            unlassoed_ctx.drawImage(this.state.lasso_img,0,0)
            this.setState({lassoed_canvas: lassoed_canvas, unlassoed_canvas: unlassoed_canvas});
        }else{
            var lassoed_canvas = document.createElement('canvas')
            lassoed_canvas.width =1000
            lassoed_canvas.height=1000 
            var lassoed_ctx = lassoed_canvas.getContext('2d')
            lassoed_ctx.drawImage(el,0,0)

            var unlassoed_canvas = document.createElement('canvas')
            unlassoed_canvas.width =1000
            unlassoed_canvas.height=1000 

            var ret = this.getCanvasBoundingBox(ctx)
            console.log(ret)
            if(ret==false){
                this.setState({lassoed_canvas: lassoed_canvas, unlassoed_canvas: unlassoed_canvas, nonlasso_ret: undefined});
            }else{
                this.setState({lassoed_canvas: lassoed_canvas, unlassoed_canvas: unlassoed_canvas, nonlasso_ret: ret});
            }
            
        }


    }

    // initializeContentStamp(){

    // }

    getCanvasBoundingBox(ctx, left=0, top=0, width=1000, height=1000){
        var ret = {};
    
        // Get the pixel data from the canvas
        var data = ctx.getImageData(left, top, width, height).data;
        console.log(data);
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
                if(data[r * width * 4 + c * 4 + 3]) {
                    console.log('last', r);
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
                if(data[r * width * 4 + c * 4 + 3]) {
                    console.log('first', r);
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
                if(data[r * width * 4 + c * 4 + 3]) {
                    console.log('last', r);
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
                if(data[r * width * 4 + c * 4 + 3]) {
                    console.log('left', c-1);
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

    setboardlength(){
        var boardwidth = document.getElementById(this.state.boardname).offsetWidth
        var boardheight = document.getElementById(this.state.boardname).offsetHeight
        if(this.props.board_this.state.moodboard_collapsed==true && this.props.board_this.state.sketchpad_collapsed==false){
            boardwidth = boardwidth/2
        }
        if(this.props.board_this.state.moodboard_collapsed==false && this.props.board_this.state.sketchpad_collapsed==true){
            boardwidth = document.getElementById('moodboard').offsetWidth/2
            boardheight = document.getElementById('moodboard').offsetHeight
        }
        var boardlength = (boardwidth>boardheight)?boardheight:boardwidth
        console.log(boardlength)
        this.setState({boardlength:boardlength, boardheight:boardheight, boardwidth: boardwidth})
    }

    collapseSketchpad(){
        var boardstate = this.props.board_this.state
        if(boardstate.moodboard_collapsed==false && boardstate.sketchpad_collapsed==false){
            this.props.board_this.setState({moodboard_collapsed:false, sketchpad_collapsed: true})

        }else if(boardstate.moodboard_collapsed==true && boardstate.sketchpad_collapsed==false){
            this.props.board_this.setState({moodboard_collapsed:false, sketchpad_collapsed: false})
        }
    }

    renderBrushMark(){
        var height = this.state.brush_size/1000*this.state.boardlength*this.state.boardzoom
        return (<img src={location.protocol+'//'+location.host+'/img/brush.png'} style={{height: height, position:'absolute', zorder:100000, pointerEvents: 'none', top: this.state.cur_mouse_pos[1]-height/2, left: this.state.cur_mouse_pos[0]-height/2}}></img>)
    }

    renderEraserMark(){
        var height = this.state.erase_size/1000*this.state.boardlength*this.state.boardzoom
        return (<div style={{border: 'solid 1px black', borderRadius: '50%', height:height, width: height, position:'absolute', zorder: 100000, pointerEvents:'none', top: this.state.cur_mouse_pos[1]-height/2, left: this.state.cur_mouse_pos[0]-height/2}}></div>)
        // return (<img src={location.protocol+'//'+location.host+'/img/brush.png'} style={{height: height, position:'absolute', zorder:100000, pointerEvents: 'none', top: this.state.cur_mouse_pos[1]-15, left: this.state.cur_mouse_pos[0]-15}}></img>)
    }

    render(){

        var panel_size = ' s6 ' 
        var horizontal_offset = 0
        if(this.props.board_this.state.moodboard_collapsed==true && this.props.board_this.state.sketchpad_collapsed==false){
            panel_size = ' s12 '
            horizontal_offset = this.state.boardwidth/2
        }

        return (<div className={'col '+panel_size+' oneboard'}  style={{display: (this.props.board_this.state.sketchpad_collapsed)?'none':''}}>
        <h2 className='select_disabled'>Sketch Pad</h2>
        <div className={'panel_collapser'} style={{left: 'calc(100% - 31px)', top: 7.25}} onPointerDown={this.collapseSketchpad.bind(this)}>◀</div>
        <div id='sketchpad' className='sketchpad select_disabled' onWheel={this.zoom_board_wheel.bind(this)} 
            // onPointerOut={this.moveBoardEnd.bind(this)}
            onPointerUp={this.sketchPadMouseMoveEnd.bind(this)} 
            onPointerMove={this.sketchPadMouseMove.bind(this)}> 
            <div className={'boardrender'} onPointerDown={this.sketchPadMouseMoveInit.bind(this)} onPointerUp={this.sketchPadMouseMoveEnd.bind(this)} 
                // onPointerOut={this.sketchPadMouseMoveOut.bind(this)}
                // onPointerOut={this.props.board_this.setSketchpadPosition.bind(this.props.board_this, -1, -1)}

            
            style={{
                width:this.state.boardzoom*this.state.boardlength, 
                height: this.state.boardzoom*this.state.boardlength,
                top: this.state.boardheight/2-this.state.boardzoom*this.state.boardlength*this.state.boardcenter[1],
                left: horizontal_offset+this.state.boardwidth/2-this.state.boardzoom*this.state.boardlength*this.state.boardcenter[0],
            }}>
                
                {this.renderCanvas()}
                <svg id='sketch_pad_svg' width={this.state.boardzoom*this.state.boardlength} height={this.state.boardzoom*this.state.boardlength} style={{position: 'absolute', top: '0', left: '0'}}>
             
                    {(this.state.control_state!='content-stamp' && this.state.control_state!='style-stamp') && this.renderLasso()}
                </svg>
                <canvas id='temp_canvas' width={1000} height={1000} style={{width: '100%', position:'absolute', top:'0', left: '0'}}></canvas>
                <svg id='sketch_pad_svg2' width={this.state.boardzoom*this.state.boardlength} height={this.state.boardzoom*this.state.boardlength} style={{position: 'absolute', top: '0', left: '0'}}>
                    {this.renderAdjuster()}
                    {/* {this.renderLasso()} */}
                </svg>
                {/* {this.props.board_this.renderCollaboratorsOnSketchpad()} */}
                
            </div>
            <SketchpadMainController mother_state={this.state} mother_this={this}></SketchpadMainController>
            <SketchpadLayerController mother_state={this.state} mother_this={this}></SketchpadLayerController>
            {/* <SketchpadUndo mother_state={this.state} mother_this={this}></SketchpadUndo> */}
        </div>
        {this.state.control_state=='brush' && this.state.action=='brush' && this.renderBrushMark()}
        {this.state.control_state=='erase' && this.state.action=='erase' && this.renderEraserMark()}
    </div>)
    }
}

export default SketchPad