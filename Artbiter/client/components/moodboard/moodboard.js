import { keys } from '@feathersjs/transport-commons/lib/channels'
import { resolve } from 'path'
import React, {Component} from 'react'
import Api from '../../middleware/api'
import ProtoBoard from '../proto/protoboard'
import MoodBoardColorAddController from './moodboard_color_add_controller'
import MoodboardImage from './moodboard_image'
import MoodBoardImageAddController from './moodboard_image_add_controller'
import MoodBoardMainController from './moodboard_main_controller'
import MoodBoardText from './moodboard_text'

class MoodBoard extends ProtoBoard{
    state = {
        ...this.state,
        boardname:'moodboard',

        control_state: 'control_object',
        //control_state --> move_board, add_image, add_comment, add_text, control_object, content-stamp, style-stamp
        // action --> move_board: idle, move_board
        //            add_image: idle, 
        //            control_object: idle, image_selected, object_resizing, object_moving, text_selected, objects_selected

        current_image: [],
        current_selected_pos: undefined,
        current_selected_ratio: undefined,

        images_to_add: [],

        current_image_resize_direction: undefined, //top-left, top-right, bottom-left, bottom-right

        init_mouse_pos: undefined, 
        init_image_pos: undefined, 
        init_text_pos: undefined,

        current_text: [],
        // current_comment: undefined,

        arts: {},

        texts: {},

        shift_down: false,
        control_down: false,

        crop: undefined, 

        messageCount: 0,

        copied: false, 

    }

    // TODO: Getting images from clip board...

    componentDidMount(){
        super.componentDidMount();
        var _this = this
        document.addEventListener('keydown', function(e){
            e = e||window.event;
            console.log(e.key)
            if(_this.state.group_updating!=true){
                if(e.key=="Shift"){
                    _this.setState({shift_down: true})
                    console.log('shiftdown')
                }else if(e.key=="Backspace"){
                    console.log('delete')
                    _this.delete_object()
                }
                // else if(e.key=="Control"){
                //     _this.setState({control_down: true})
                // }else if(e.key=='v'){
                //     if(_this.state.control_down){
                //         _this.pasteImages(e)
                //     }
                // }
            }
            
        })

        document.addEventListener('keyup', function(e){
            e = e||window.event;
            console.log('up?', e.key)
            if(e.key=="Shift"){
                _this.setState({shift_down: false})
                console.log('shiftup')
            }else if(e.key=='Control'||e.key=='Meta'){
                _this.setState({control_down:false, copied: false})
            }else if(e.key=='v'){
                _this.setState({copied:false})
            }
        })

        window.addEventListener('paste', function(e){
            console.log('runnning?')
            if(_this.state.copied==false){
                _this.pasteImages(e);
                _this.setState({copied:true})
            }
            
        })

        window.setInterval(function(){
            _this.setState({now: Date.now()})
        }, 1000)
    }

    zoom_board_wheel(e){
        // console.log(e.deltaY)
        if(this.state.action=='idle' || this.state.action=='image_selected' || this.state.action=='text_selected' || this.state.action=='objects_selected'){
            var boardzoom_new = this.state.boardzoom-e.deltaY/100
            if(boardzoom_new<0.5){
                this.setState({boardzoom: 0.5})
            }else if(boardzoom_new>15){
                this.setState({boardzoom: 15})
            }else{
                this.setState({boardzoom: boardzoom_new})
            }
        }    
    }

    delete_object(){
        if((this.state.current_image.length>0||this.state.current_text.length>0) && this.state.control_state=='control_object' && this.state.action=='idle'){
            // this.setState({})
            var art_ids = []
            var text_ids = []
            var arts = this.state.arts
            console.log(this.state.current_image, arts)
            for(var i in this.state.current_image){
                var key = this.state.current_image[i]
                art_ids.push(key)
                delete arts[key]
            }
            var texts = this.state.texts
            for(var i in this.state.current_text){
                var key = this.state.current_text[i]
                
                if(document.getElementById('textarea_'+key)!==document.activeElement){
                    text_ids.push(key)
                    delete texts[key]
                }else{
                    return
                }
                
            }
            
            this.props.board_this.RemoveArtsTexts(art_ids, text_ids)
            this.setState({current_selected_pos: undefined, current_selected_ratio:undefined, current_image:[], current_text:[], arts:arts, texts: texts})
        }
    }
    
    getPositionOnBoard(xpix, ypix, ori=false){
        var horizontal_offset = 0
        if(ori){
            if(this.props.board_this.state.moodboard_collapsed==false && this.props.board_this.state.sketchpad_collapsed==true){
                horizontal_offset = this.state.boardwidth/2
            }else{
                horizontal_offset = 0
            }
        }
        else if(this.props.board_this.state.moodboard_collapsed==false && this.props.board_this.state.sketchpad_collapsed==true){
            horizontal_offset = this.state.boardwidth/2
        }else{
            horizontal_offset = this.state.boardwidth+11.250+11.250
        }
        
        var xpos = this.state.boardcenter[0]-(this.state.boardwidth/2+horizontal_offset)/this.state.boardlength/this.state.boardzoom+xpix/this.state.boardzoom/this.state.boardlength
        var ypos = this.state.boardcenter[1]-this.state.boardheight/2/this.state.boardlength/this.state.boardzoom+ypix/this.state.boardzoom/this.state.boardlength
        // console.log(horizontal_offset, xpos, ypos)
        return [xpos, ypos]
    }

    getCurrentMouseOnBoard(e){
        var xpix = e.pageX - document.getElementById(this.state.boardname).offsetLeft
        var ypix = e.pageY - document.getElementById(this.state.boardname).offsetTop
        // console.log(xpix, ypix)
        
        // console.log(xpos, ypos)

        return this.getPositionOnBoard(xpix, ypix);
    }
    
    dropImage(e){
        e.stopPropagation();
        e.preventDefault();
        if(this.state.control_state=='content-stamp'||this.state.control_state=='style-stamp'){
            this.props.board_this.sketchpad.setState({control_state:'move'})
            // return  
        }
        
        var files = e.dataTransfer.files
        var arts = this.state.arts
        // var origin = this.getCurrentMouseOnBoard(e)
        var _this = this
        var pageX = e.pageX
        var pageY = e.pageY
        for(var i in this.state.current_image){
            arts[this.state.current_image[i]].choosen_by=''
        }
        var current_image = []
        this.props.board_this.ChooseArtsTexts([],[], this.state.current_image.slice(0), this.state.current_text.slice(0))
        this.setState({arts, current_image:[], current_text: [], current_selected_pos: undefined, current_selected_ratio: undefined}, function(){
            console.log(files)
            var counter=0
            var promises = []
    
            for(var i in files){
                var file = files[i]
                promises.push(this.dropOneImage(file, pageX, pageY, arts, counter))
                counter = counter+1
                
            }
            // promises.push(this.addImages())
            return Promise.all(promises).then((value)=>{
                console.log('haechi?', value)
                this.addImages(_this, value)
            })
        })
        
    }

    dropOneImage(file, pageX, pageY, arts, counter){
        var _this=this
        if(file && file['type']){
            if(file['type'].split('/')[0]==='image'){
                return new Promise((resolve, reject)=>{
                    var reader = new FileReader();
                    reader.onload = function(){
                        _this.addAnImage(reader.result, pageX, pageY, arts, counter, resolve)
                    }
                    reader.readAsDataURL(file)
                })    
            }
        }
        return
    }

    addImages(_this, value){
        var add_arts = []
        var add_art_ids = []
        var current_image_pos = _this.state.current_selected_pos
        var current_selected_ratio = _this.state.current_selected_ratio
        
        for(var i in value){
            if(value[i]!=undefined){
                add_art_ids.push(value[i][0])
                add_arts.push(value[i][1])
                var originx = value[i][1]['position'][0]
                var originy = value[i][1]['position'][1]
                var curx = value[i][1]['position'][2]
                var cury = value[i][1]['position'][3]
                if(current_image_pos==undefined){
                    current_image_pos = [originx, originy, curx, cury]
                    current_selected_ratio = Math.abs((curx-originx)/(cury-originy))
                }else{
                    if(current_image_pos[2]<curx){
                        current_image_pos[2]=curx
                    }
                    if(current_image_pos[3]<cury){
                        current_image_pos[3]=cury
                    }
                    if(current_image_pos[0]>originx){
                        current_image_pos[0]=originx
                    }
                    if(current_image_pos[1]>originy){
                        current_image_pos[1]=originy
                    }
                    current_selected_ratio = Math.abs((current_image_pos[2]-current_image_pos[0])/(current_image_pos[3]-current_image_pos[1]))
                }
            }
        }
        console.log(_this.state.current_image, current_image_pos, current_selected_ratio, add_arts, add_art_ids)
        Promise.all([
            _this.props.board_this.AddArts(add_arts, add_art_ids),
            _this.setState({control_state: 'control_object', current_selected_pos: current_image_pos, current_selected_ratio})
        ])

    }

    resizeImage(image){
        var canvas = document.createElement('canvas');
        var max_size = 512
        var width = image.width
        var height = image.height
        if(width>height){
            if(width>max_size){
                height *= max_size / width;
                width = max_size;
            }
        }else {
            if (height > max_size) {
                width *= max_size / height;
                height = max_size;
            }
        }

        canvas.width = width
        canvas.height = height
        canvas.getContext('2d').drawImage(image, 0, 0, width, height);
        var dataUrl = canvas.toDataURL();
        // var resizedImage = dataURLToBlob(dataUrl);

        return [dataUrl, width, height]

    }

    addAnImage(imgsrc, pageX, pageY, arts, counter, resolve){
        // console.log(this.state.current_image, this.state.images_to_add)
        // return
        var _this = this
        var id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        var image = new Image();
        
        image.src = imgsrc
        image.onload = function(){
            var xpixo = pageX - document.getElementById(_this.state.boardname).offsetLeft+ counter*10
            var ypixo = pageY - document.getElementById(_this.state.boardname).offsetTop+counter*10
            var w=100
            var h=100
            if(this.width>this.height){
                h = 100/this.width*this.height
            }else{
                w = 100/this.height*this.width
            }
            var ypix = pageY - document.getElementById(_this.state.boardname).offsetTop+h+counter*10
            var xpix = pageX - document.getElementById(_this.state.boardname).offsetLeft+ w+counter*10
            var cur = _this.getPositionOnBoard(xpix, ypix)
            var origin = _this.getPositionOnBoard(xpixo, ypixo)

            var resized = _this.resizeImage(this)

            // console.log(xpixo, ypixo, xpix, ypix)
            // console.log([origin[0], origin[1], cur[0], cur[1]])
            arts[id]={
                file: resized[0],
                position: [origin[0], origin[1], cur[0], cur[1]], 
                ratio:  this.width/this.height,
                width: resized[1],
                height: resized[2], 
                choosen_by: _this.props.board_this.state.user_id, 
            }
            if(typeof resolve === 'function'){
                resolve([id, arts[id]])
            }else{
                resolve.push([id, arts[id]])
            }
            
                        
            var current_image = _this.state.current_image
            var current_image_pos = _this.state.current_selected_pos
            var current_selected_ratio = _this.state.current_selected_ratio
            // console.log(current_image_pos)
            if(current_image_pos==undefined){
                current_image_pos = [origin[0], origin[1], cur[0], cur[1]]
                current_selected_ratio = Math.abs((cur[0]-origin[0])/(cur[1]-origin[1]))
            }else{
                if(current_image_pos[2]<cur[0]){
                    current_image_pos[2]=cur[0]
                }
                if(current_image_pos[3]<cur[1]){
                    current_image_pos[3]=cur[1]
                }
                if(current_image_pos[0]>origin[0]){
                    current_image_pos[0]=origin[0]
                }
                if(current_image_pos[1]>origin[1]){
                    current_image_pos[1]=origin[1]
                }
                current_selected_ratio = Math.abs((current_image_pos[2]-current_image_pos[0])/(current_image_pos[3]-current_image_pos[1]))
            }
            current_image.push(id)
            // console.log(current_image_pos)
            // console.log('image ratio', current_selected_ratio, this.width/this.height)
            // Promise.all([
            //     _this.props.board_this.AddArts([arts[id]],[id]),
            //     _this.setState({current_image: current_image, current_text: [], current_selected_pos:current_image_pos, current_selected_ratio: current_selected_ratio})
            // ])
            
            // console.log('uyay', this.width, this.height)
        }
    }

    pasteImages(e){
        // console.log(e.clipboardData.items)
        var _this = this
        var arts = this.state.arts
        var _window = window
        for(var i in this.state.current_image){
            arts[this.state.current_image[i]].choosen_by=''
        }
        this.props.board_this.ChooseArtsTexts([],[], this.state.current_image.slice(0), this.state.current_text.slice(0))
        this.setState({arts, current_image:[], current_text: [],current_selected_pos: undefined, current_selected_ratio: undefined},function(){
            _window.navigator.clipboard.read().then((items)=>{
                console.log(items)
                var promises = []
                var counter = 0
                for(var i=0; i<items.length; i++){
                    var item = items[i]
                    for (var j=0; j<item.types.length; j++){
                        var type = item.types[j]
                        if(type.startsWith('image/')){
                            promises.push(_this.pasteImage(item, type, counter))
                            counter = counter+1
                        }
                    }
                    console.log(i)
                }
                // promises.push(this.addImages())
                return Promise.all(promises).then((value)=>{
                    console.log('haechi?', value)
                    this.addImages(_this, value)
                })
            })
        })
        
        // var items = e.clipboardData.items
        
    }

    pasteImage(item, type, counter){ 
        var _this = this
        var horizontal_offset
        if(this.props.board_this.state.moodboard_collapsed==false && this.props.board_this.state.sketchpad_collapsed==true){
            horizontal_offset = 0
        }else{
            horizontal_offset = this.state.boardwidth+22.5
        }
        return new Promise((resolve, reject)=>{
            item.getType(type).then((it)=>{
            
                var reader = new FileReader();
                reader.onload = function(){
                    console.log(document.getElementById(_this.state.boardname).offsetLeft+document.getElementById(_this.state.boardname).querySelector('.boardrender').offsetLeft+horizontal_offset)
                    var offLeft = document.getElementById(_this.state.boardname).offsetLeft+document.getElementById(_this.state.boardname).querySelector('.boardrender').offsetLeft+horizontal_offset+document.getElementById(_this.state.boardname).querySelector('.boardrender').clientWidth/2
                    var offTop = document.getElementById(_this.state.boardname).offsetTop+document.getElementById(_this.state.boardname).querySelector('.boardrender').offsetTop+document.getElementById(_this.state.boardname).querySelector('.boardrender').clientHeight/2
                    _this.addAnImage(reader.result, offLeft,
                    offTop,
                    _this.state.arts, counter, resolve)
                }
                reader.readAsDataURL(it)
            })    
        })
        
    }

    dropenter(e){
        e.stopPropagation();
        e.preventDefault()
        
        console.log('in')
    }
    dropout(e){
        e.stopPropagation();
        e.preventDefault()
        
        console.log('out')
    }
    dropover(e){
        e.stopPropagation()
        e.preventDefault()
    }

    moodBoardMouseInit(e){
        console.log(this.state.control_state, this.state.action)
        if((this.state.control_state=='control_object'||this.state.control_state=='content-stamp'||this.state.control_state=='style-stamp'||this.state.control_state=='crop') && this.state.action=='idle'){
            console.log('init starts at here? or?')
            this.moveBoardInit(e)
        }else if((this.state.control_state=='control_object') && this.state.action=='change_color'){
            e.stopPropagation()
            e.preventDefault()
            this.setState({action:'idle'})
        }else if(this.state.control_state=='add_image' && this.state.action=='add_image'){
            this.add_image_init(e)
        }else if(this.state.control_state=='add_color' && this.state.action=='add_color'){
            this.add_image_init(e)
        }else if(this.state.control_state=='add_text'&& this.state.action=='idle'){
            this.add_text_init(e)
        }
    }

    moodBoardMouseMove(e){
        // var pos = this.getCurrentMouseOnBoard(e)
        // this.props.board_this.setMoodboardPosition(pos[0], pos[1]);
        // console.log('objectmove', this.state.action)
        if((this.state.control_state=='control_object'||this.state.control_state=='content-stamp'||this.state.control_state=='style-stamp'||this.state.control_state=='crop') && this.state.action=='move_board'){
            this.moveMouse(e)
        }else if(this.state.control_state=='control_object' && this.state.action=='object_resizing'){
            this.object_resizing(e)
        }else if(this.state.control_state=='control_object' && this.state.action=='object_moving'){
            this.object_moving(e)
        }
        else if(this.state.control_state=='crop' && this.state.action=='crop'){
            this.crop_move(e)
        }
    }



    moodBoardMouseEnd(e){
        console.log('e')
        if((this.state.control_state=='control_object'||this.state.control_state=='content-stamp'||this.state.control_state=='style-stamp'||this.state.control_state=='crop') && this.state.action=='move_board'){
            this.moveBoardEnd(e)
        }else if(this.state.control_state=='control_object' && this.state.action=='object_resizing'){
            this.end_object_resizing(e)
        }else if(this.state.control_state=='control_object' && this.state.action=='object_moving'){
            this.object_moving_end(e)
        }else if(this.state.control_state=='crop' && this.state.action=='crop'){
            this.crop_move_end(e)
        }
    }

    crop_move(e){
        if(this.state.control_state=='crop' && this.state.action=='crop'){
            var p = this.getCurrentMouseOnBoard(e)
            var art = this.state.arts[this.state.current_image[0]]
            var x = (p[0]-art.position[0])/(art.position[2]-art.position[0])
            var y = (p[1]-art.position[1])/(art.position[3]-art.position[1])
            if(x>1){x=1}
            if(y>1){y=1}
            if(x<0){x=0}
            if(y<0){y=0}
            var crop = this.state.crop
            crop[2] = x
            crop[3] = y
            console.log('cropmove..')
            this.setState({crop: crop})
        }
    }

    crop_move_end(e){
        var crop = this.state.crop
        if(crop[0]>crop[2]){
            var tmp = crop[2]
            crop[2]=crop[0]
            crop[0]=tmp
        }
        if(crop[1]>crop[3]){
            var tmp = crop[3]
            crop[3]=crop[1]
            crop[1]=tmp
        }
        if(crop[0]==crop[2] && crop[1]==crop[3]){
            crop = [0,0,1,1]
        }
        console.log('crop move end!')
        this.setState({action:'idle', crop:crop})
    }

    moveBoardEnd(e){
        if(this.state.control_state!='crop' && this.state.move_board_init[0]==this.state.boardcenter[0] && this.state.move_board_init[1]==this.state.boardcenter[1]){
            this.deSelect()
            
        }else{
            super.moveBoardEnd(e)
        }
    }

    deSelect(){
        var del_texts = []
        var replace_texts = []
        var replace_text_ids = []
        var arts = this.state.arts
        for(var i in this.state.current_text){
            var key = this.state.current_text[i]
            if(this.state.texts[key].text==''){
                del_texts.push(key)
                delete this.state.texts[key]
            }else{
                replace_text_ids.push(key)
                replace_texts.push(this.state.texts[key])
            }
        }
        ///
        for(var i in this.state.current_image){
            arts[this.state.current_image[i]].choosen_by=''
        }
        ///
        var promises
        if(replace_texts.length>0){
            promises = [ 
                // this.props.board_this.ChooseArtsTexts([],[],this.state.current_image.slice(0), this.state.current_text.slice(0)),
                this.props.board_this.UpdateArtsTexts([],[], replace_texts, replace_text_ids, this.props.board_this.ChooseArtsTexts, [[],[],this.state.current_image.slice(0), this.state.current_text.slice(0)])
            ]
        }else{
            promises = [ 
                this.props.board_this.ChooseArtsTexts([],[],this.state.current_image.slice(0), this.state.current_text.slice(0))
            ]
        }
        
        var _this = this
        if(del_texts.length>0){
            promises.push(this.props.board_this.RemoveArtsTexts([], del_texts))
        }
        promises.push(this.setState({arts:arts, action:'idle', current_image:[], current_text:[], current_selected_pos: undefined, current_selected_ratio: undefined, 
        move_board_init: undefined, move_board_mouse_init: undefined}, function(){
            _this.props.board_this.sketchpad.setState({})
        })) 
        Promise.all(promises)
    }

    add_text_init(e){
        console.log('text add!')
        var texts = this.state.texts
        var pos = this.getCurrentMouseOnBoard(e)

        var id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        var text = {
            text: '',
            fontsize: 0.04/this.state.boardzoom, 
            position: [pos[0], pos[1], pos[0]+0.2/this.state.boardzoom, pos[1]+0.046/this.state.boardzoom],
            ratio: 0.2/0.046,
            height_font_ratio: 0.04/0.046, 
            choosen_by: this.props.board_this.state.user_id, 
        }
        texts[id] = text
        Promise.all([
            this.props.board_this.AddAText(id, text),
            this.setState({control_state: 'control_object', texts: texts, current_text:[id], current_image: [],
            current_selected_pos:[pos[0], pos[1], pos[0]+0.2/this.state.boardzoom, pos[1]+0.046/this.state.boardzoom], current_selected_ratio:1/3}, function(){
                setTimeout(function(){
                    document.getElementById('textarea_'+id).focus()}, 50);
            })
        ])
        
    }

    add_image_init(e){
        var arts = this.state.arts
        var pos =  this.getCurrentMouseOnBoard(e)
        
        var art_pos = [pos[0], pos[1], pos[0]+0.01, pos[1]+0.01]
        // var art_pos = [origin[0], origin[1], cur[0], cur[1]]
        var ratio=Number.MIN_VALUE

        for(var i=0; i<this.state.current_image.length; i++){
            arts[this.state.current_image[i]]['position'] = art_pos
            if(ratio<arts[this.state.current_image[i]].ratio){
                ratio = arts[this.state.current_image[i]].ratio
            }
        }
        this.setState({control_state: 'control_object', action:'object_resizing', arts: arts, 
            current_selected_pos: art_pos.slice(), current_selected_ratio:ratio, current_image_resize_direction: 'top-left'})
    }

    changeColor(){
        if(this.state.current_image.length==1 && document.getElementById('color_swatch_picker')!=undefined){
            var value = document.getElementById('color_swatch_picker').value
            console.log('color', value)
            var art_id=this.state.current_image[0]
            console.log('art_id', art_id)
            var arts = this.state.arts
            var art = this.state.arts[art_id]
            console.log(art['color'])
            if(art['color']!=undefined){
                if(art['color']!=value){
                    console.log('color update')
                    var el = document.createElement('canvas')
                    el.width = 224
                    el.height = 224
                    var canvas = el.getContext('2d')

                    canvas.fillStyle=value
                    canvas.fillRect(0,0,224,224)

                    var src = el.toDataURL()
                    art['file']=src
                    this.setState({arts}, function(){
                        Api.app.service('arts').patch(art_id, {$set: {file:src, color: value, updated: 'moodboard_color_swatch_change'}})
                    })
                    
                }
            }
        }
        

    }

    object_moving_init(e){
        // console.log('init?')
        if(e.stopPropagation!=undefined){
            e.stopPropagation()
        }   

        var init_mouse_pos = this.getCurrentMouseOnBoard(e)
        var init_image_pos = {}
        // console.log(this.state)
        for(var i in this.state.current_image){
            init_image_pos[this.state.current_image[i]] = this.state.arts[this.state.current_image[i]].position
        }
        var init_text_pos = {}
        for(var i in this.state.current_text){
            init_text_pos[this.state.current_text[i]] = this.state.texts[this.state.current_text[i]].position
        }
        // console.log(init_image_pos, init_mouse_pos, this.state.current_selected_pos)
        if(this.state.current_selected_pos!=undefined){
            this.setState({action:'object_moving', init_mouse_pos: init_mouse_pos, init_text_pos: init_text_pos,init_image_pos:init_image_pos,  init_group_pos:this.state.current_selected_pos.slice()})
        }
        
    }

    object_moving(e){
        if(e.stopPropagation!=undefined){
            e.stopPropagation()
        }   
        
        var cur_mouse_pos = this.getCurrentMouseOnBoard(e)
        if(cur_mouse_pos[0]>0 && cur_mouse_pos[0]<1 && cur_mouse_pos[1]>0 && cur_mouse_pos[1]<1){
            var xdiff = cur_mouse_pos[0]-this.state.init_mouse_pos[0]
            var ydiff = cur_mouse_pos[1]-this.state.init_mouse_pos[1]

            var arts = this.state.arts
            for(var i in this.state.current_image){
                var key = this.state.current_image[i]
                var init_pos = this.state.init_image_pos[key]
                arts[key].position = [init_pos[0]+xdiff, init_pos[1]+ydiff, init_pos[2]+xdiff, init_pos[3]+ydiff]
            }
            var texts = this.state.texts
            for(var i in this.state.current_text){
                var key = this.state.current_text[i]
                var init_pos = this.state.init_text_pos[key]
                texts[key].position = [init_pos[0]+xdiff, init_pos[1]+ydiff, init_pos[2]+xdiff, init_pos[3]+ydiff]
            }
            var cur_image_pos = this.state.init_group_pos
            cur_image_pos = [cur_image_pos[0]+xdiff, cur_image_pos[1]+ydiff, cur_image_pos[2]+xdiff, cur_image_pos[3]+ydiff]
            this.setState({arts:arts, texts: texts, current_selected_pos: cur_image_pos})
        }
        

    }

    object_moving_end(e){
        var cur_mouse_pos = this.getCurrentMouseOnBoard(e)
        
        e.stopPropagation()
        
        if(this.state.init_mouse_pos[0] != cur_mouse_pos[0] || this.state.init_mouse_pos[1]!=cur_mouse_pos[1]){
            
            var arts_to_push=[]
            var art_ids_to_push = []
            var arts = this.state.arts
            for(var i=0; i<this.state.current_image.length; i++){
                arts_to_push.push(arts[this.state.current_image[i]])
                art_ids_to_push.push(this.state.current_image[i])
            }
            var texts_to_push=[]
            var text_ids_to_push = []
            var texts = this.state.texts
            for(var i=0; i<this.state.current_text.length; i++){
                texts_to_push.push(texts[this.state.current_text[i]])
                text_ids_to_push.push(this.state.current_text[i])
            }
            this.props.board_this.UpdateArtsTexts(arts_to_push, art_ids_to_push, texts_to_push, text_ids_to_push)
        }

        this.setState({action:'idle', init_mouse_pos: undefined, init_image_pos: undefined, init_text_pos: undefined, init_group_pos: undefined})
    }

    object_resizing_init(direction, e){
        e.stopPropagation();
        this.setState({action:'object_resizing', current_image_resize_direction: direction})//, current_selected_pos:arts_pos, current_selected_ratio: Math.abs((arts_pos[3]-arts_pos[1])/(arts_pos[2]-arts_pos[0]))})
    }

    object_resizing(e){
        var arts = this.state.arts
        var texts = this.state.texts
        var pos = this.getCurrentMouseOnBoard(e)
        // console.log(pos)
        var fixed_x, moving_x, fixed_y, moving_y
        if(this.state.current_image_resize_direction=='top-left'){
            fixed_x = 0
            fixed_y = 1
            moving_x = 2
            moving_y =3
        }else if(this.state.current_image_resize_direction=='top-right'){
            fixed_x = 2
            fixed_y = 1
            moving_x = 0
            moving_y =3
        }else if(this.state.current_image_resize_direction=='bottom-right'){
            fixed_x = 2
            fixed_y = 3
            moving_x = 0
            moving_y =1
        }else if(this.state.current_image_resize_direction=='bottom-left'){
            fixed_x = 0
            fixed_y = 3
            moving_x = 2
            moving_y =1
        }

        var arts_pos = this.state.current_selected_pos.slice()
        var ratio = this.state.current_selected_ratio

        var ori_w= arts_pos[2]-arts_pos[0]
        var ori_h= arts_pos[3]-arts_pos[1]

        arts_pos[moving_x] = pos[0]
        arts_pos[moving_y] = pos[1]

        

        var w= arts_pos[2]-arts_pos[0]
        var h= arts_pos[3]-arts_pos[1]
        if(w==0||h==0||ori_h==0||ori_w==0){
            return
        }

        if(h!=0){
            if(Math.abs(w/h)>ratio){
                w = h*ratio
            }else{
                h = w/ratio
            }
        }
        arts_pos[moving_x]=((moving_x==2)?1:-1)*w+arts_pos[fixed_x]
        arts_pos[moving_y]=((moving_y==3)?1:-1)*h+arts_pos[fixed_y]

        

        for(var i=0; i<this.state.current_image.length; i++){
            var cur_art_pos= arts[this.state.current_image[i]]['position'].slice()
            if(ori_w==0 || ori_h==0){
                console.log('ori')
                return
                // if(this.state.current_image.length+this.state.current_text.length==1){
                //     cur_art_pos[0] = arts_pos[0]
                //     cur_art_pos[2] = arts_pos[2]
                //     cur_art_pos[1] = arts_pos[1]
                //     cur_art_pos[3] = arts_pos[3]
                // }else{
                //     return
                // }
            }else{
                cur_art_pos[0] = w/ori_w*(cur_art_pos[0]-arts_pos[fixed_x])+arts_pos[fixed_x]
                cur_art_pos[2] = w/ori_w*(cur_art_pos[2]-arts_pos[fixed_x])+arts_pos[fixed_x]
                cur_art_pos[1] = h/ori_h*(cur_art_pos[1]-arts_pos[fixed_y])+arts_pos[fixed_y]
                cur_art_pos[3] = h/ori_h*(cur_art_pos[3]-arts_pos[fixed_y])+arts_pos[fixed_y]
            }
            if(cur_art_pos[0]==cur_art_pos[2] || cur_art_pos[1]==cur_art_pos[3]){
                continue
            }
            arts[this.state.current_image[i]]['position'] = cur_art_pos
        }
        for(var i=0; i<this.state.current_text.length; i++){
            var cur_art_pos= texts[this.state.current_text[i]]['position'].slice()
            if(ori_w==0 || ori_h==0){
                // continue
                console.log('ori')
                return
                // if(this.state.current_image.length+this.state.current_text.length==1){
                //     cur_art_pos[0] = arts_pos[0]
                //     cur_art_pos[2] = arts_pos[2]
                //     cur_art_pos[1] = arts_pos[1]
                //     cur_art_pos[3] = arts_pos[3]
                // }else{
                //     return
                // }
            }else{
                cur_art_pos[0] = w/ori_w*(cur_art_pos[0]-arts_pos[fixed_x])+arts_pos[fixed_x]
                cur_art_pos[2] = w/ori_w*(cur_art_pos[2]-arts_pos[fixed_x])+arts_pos[fixed_x]
                cur_art_pos[1] = h/ori_h*(cur_art_pos[1]-arts_pos[fixed_y])+arts_pos[fixed_y]
                cur_art_pos[3] = h/ori_h*(cur_art_pos[3]-arts_pos[fixed_y])+arts_pos[fixed_y]
            }
            if(cur_art_pos[0]==cur_art_pos[2] || cur_art_pos[1]==cur_art_pos[3]){
                continue
            }
            texts[this.state.current_text[i]]['position'] = cur_art_pos
            // console.log(w/ori_w, Math.abs(w/ori_w))
            texts[this.state.current_text[i]]['fontsize'] = texts[this.state.current_text[i]]['height_font_ratio'] *Math.abs(cur_art_pos[3]-cur_art_pos[1])
        }
        
        this.setState({arts:arts, texts: texts, current_selected_pos: arts_pos})

    }
    
    end_object_resizing(e){
        var arts = this.state.arts
        var arts_to_push = []
        var art_ids_to_push = []
        for(var i=0; i<this.state.current_image.length; i++){
            var arts_pos = arts[this.state.current_image[i]]['position']
            if(arts_pos[0]>arts_pos[2]){
                var t = arts_pos[0]
                arts_pos[0] = arts_pos[2]
                arts_pos[2] = t
                
            }

            if(arts_pos[1]>arts_pos[3]){
                var t = arts_pos[1]
                arts_pos[1] = arts_pos[3]
                arts_pos[3] = t
                
            }
            arts[this.state.current_image[i]]['position'] = arts_pos
            arts_to_push.push(arts[this.state.current_image[i]])
            art_ids_to_push.push(this.state.current_image[i])
            
        }
             
        var texts = this.state.texts
        var texts_to_push = []
        var text_ids_to_push = []
        for(var i=0; i<this.state.current_text.length; i++){
            var texts_pos = texts[this.state.current_text[i]]['position']
            console.log(texts_pos)
            if(texts_pos[0]>texts_pos[2]){
                var t = texts_pos[0]
                texts_pos[0] = texts_pos[2]
                texts_pos[2] = t
                
            }

            if(texts_pos[1]>texts_pos[3]){
                var t = texts_pos[1]
                texts_pos[1] = texts_pos[3]
                texts_pos[3] = t
                
            }
            texts[this.state.current_text[i]]['position'] = texts_pos
            console.log(texts_pos, this.state.current_selected_pos)
            texts_to_push.push(texts[this.state.current_text[i]])
            text_ids_to_push.push(this.state.current_text[i])
        }

        this.props.board_this.UpdateArtsTexts(arts_to_push, art_ids_to_push, texts_to_push, text_ids_to_push)
        var current_selected_pos =this.state.current_selected_pos.slice()
        if(current_selected_pos[0]>current_selected_pos[2]){
            var t = current_selected_pos[0]
            current_selected_pos[0] = current_selected_pos[2]
            current_selected_pos[2] = t
        }
        if(current_selected_pos[1]>current_selected_pos[3]){
            var t = current_selected_pos[1]
            current_selected_pos[1] = current_selected_pos[3]
            current_selected_pos[3] = t
        }
        console.log(current_selected_pos)
        
        this.setState({texts: texts, action:'idle',current_selected_pos: current_selected_pos})
    }


    renderImages(){
        var _this = this
        return Object.keys(this.state.arts).map(function(key, index) {
            if(_this.state.arts[key]!=undefined){
                if(_this.state.arts[key].position!=undefined){
                    return (<MoodboardImage key={key} art_key={key} mother_this={_this} mother_state={_this.state} current_image={_this.state.current_image} art={_this.state.arts[key]} boardlength={_this.state.boardlength*_this.state.boardzoom}></MoodboardImage>)
                }
            }
            
        })
    }

    renderTexts(){
        var _this = this
        return Object.keys(this.state.texts).map(function(key, index) {
            if(_this.state.texts[key]!=undefined){
                if(_this.state.texts[key].position!=undefined){
                    if(!(_this.state.current_text.length==1 &&_this.state.current_image.length==0  && _this.state.current_text.indexOf(key)!=-1)){
                        return (<MoodBoardText edit={false} key={key} text_key={key} mother_this={_this} mother_state={_this.state} current_text={_this.state.current_text} text={_this.state.texts[key]} boardlength={_this.state.boardlength*_this.state.boardzoom}></MoodBoardText>)
                    } 
                }
            }
            
        })
    }
    
    rendereditingTexts(){
        if(this.state.current_text.length==1 &&this.state.current_image.length==0 ){
            var key=this.state.current_text[0]
            return (<MoodBoardText edit={true} key={key} text_key={key} mother_this={this} mother_state={this.state} current_text={this.state.current_text} text={this.state.texts[key]} boardlength={this.state.boardlength*this.state.boardzoom}></MoodBoardText>)
        }
    }

    
    colorChangeMode(action, e){
        e.stopPropagation();
        e.preventDefault()
        this.setState({action:action})
    }

    colorChange(e){
        this.setState({color:e.target.value})
    }

    labelOn(){
        if(this.state.current_image.length==1 && this.state.current_text.length==0){
            this.setState({label_art: this.state.current_image[0]})
        }
        
    }
    labelOut(){
        this.setState({label_art:undefined})
    }

    renderImageHandle(){
        // console.log(this.state.current_selected_pos)
        var smallx = (this.state.current_selected_pos[0]<this.state.current_selected_pos[2])?this.state.current_selected_pos[0]:this.state.current_selected_pos[2]
        var bigx = (this.state.current_selected_pos[0]>this.state.current_selected_pos[2])?this.state.current_selected_pos[0]:this.state.current_selected_pos[2]
        var smally = (this.state.current_selected_pos[1]<this.state.current_selected_pos[3])?this.state.current_selected_pos[1]:this.state.current_selected_pos[3]
        var bigy = (this.state.current_selected_pos[1]>this.state.current_selected_pos[3])?this.state.current_selected_pos[1]:this.state.current_selected_pos[3]
        var x = smallx* this.state.boardlength*this.state.boardzoom
        var y = smally* this.state.boardlength*this.state.boardzoom

        var width = (bigx-smallx)* this.state.boardlength*this.state.boardzoom
        var height = (bigy-smally)* this.state.boardlength*this.state.boardzoom

        var color_width = 50
        var color_height = 40

        var color 
        if(this.state.current_image.length==1 && this.state.current_text.length==0 && this.state.arts[this.state.current_image[0]].color!=undefined){
            color = this.state.arts[this.state.current_image[0]].color
        }
        // console.log(color)
        return (<g>
            <rect x={x-2} y={y-2} width={width+4} height={height+4} stroke='#333333' fill='transparent' strokeWidth='2' style={{cursor:'move'}}  onPointerDown={this.object_moving_init.bind(this)}></rect>
            
            <rect x={x-8} y={y+4} width={12} height={height-8} fill='transparent' strokeWidth='0' style={{cursor:'ew-resize'}} onPointerDown={this.object_resizing_init.bind(this, 'bottom-right')}></rect>
            <rect x={x+width-4} y={y+4} width={12} height={height-8} fill='transparent' strokeWidth='0' style={{cursor:'ew-resize'}} onPointerDown={this.object_resizing_init.bind(this, 'top-left')}></rect>
            <rect x={x+4} y={y-8} width={width-8} height={12} fill='transparent' strokeWidth='0' style={{cursor:'ns-resize'}} onPointerDown={this.object_resizing_init.bind(this, 'bottom-right')}></rect>
            <rect x={x+4} y={y+height-4} width={width-8} height={12} fill='transparent' strokeWidth='0' style={{cursor:'ns-resize'}} onPointerDown={this.object_resizing_init.bind(this, 'top-left')}></rect>

            {/* <circle className='bottom-right' cx={x} cy={y} r='6' stroke='#333333' fill='white' style={{cursor:'nw-resize'}} onPointerDown={this.object_resizing_init.bind(this, 'bottom-right')}></circle>
            <circle cx={x+width} cy={y} r='6' stroke='#333333' fill='white' style={{cursor:'ne-resize'}} onPointerDown={this.object_resizing_init.bind(this, 'bottom-left')}></circle>
            <circle cx={x} cy={y+height} r='6' stroke='#333333' fill='white'  style={{cursor:'sw-resize'}} onPointerDown={this.object_resizing_init.bind(this, 'top-right')}></circle>
            <circle cx={x+width} cy={y+height} r='6' stroke='#333333' fill='white'  style={{cursor:'se-resize'}} onPointerDown={this.object_resizing_init.bind(this, 'top-left')}></circle> */}

            {this.state.current_image.length==1 && this.state.current_text.length==0 && this.state.arts[this.state.current_image[0]].color!=undefined &&
            <foreignObject x={x+width+5} y={y+height-color_height} width={color_width} height={color_height}>
                {/* <div>yeah</div> */}
                <input id='color_swatch_picker' className='colorHandle' type='color' value={this.state.color} onChange={this.colorChange.bind(this)} onPointerDown={this.colorChangeMode.bind(this, 'change_color')}></input>
                <div className='btn tiny-btn' style={{width: '100%', height:'20px', lineHeight:'14px'}} onPointerDown={this.changeColor.bind(this)}>Apply</div>
            </foreignObject>}
        </g>)
    }

    renderImageHandle2(){
        // console.log(this.state.current_selected_pos)
        var smallx = (this.state.current_selected_pos[0]<this.state.current_selected_pos[2])?this.state.current_selected_pos[0]:this.state.current_selected_pos[2]
        var bigx = (this.state.current_selected_pos[0]>this.state.current_selected_pos[2])?this.state.current_selected_pos[0]:this.state.current_selected_pos[2]
        var smally = (this.state.current_selected_pos[1]<this.state.current_selected_pos[3])?this.state.current_selected_pos[1]:this.state.current_selected_pos[3]
        var bigy = (this.state.current_selected_pos[1]>this.state.current_selected_pos[3])?this.state.current_selected_pos[1]:this.state.current_selected_pos[3]
        var x = smallx* this.state.boardlength*this.state.boardzoom
        var y = smally* this.state.boardlength*this.state.boardzoom

        var width = (bigx-smallx)* this.state.boardlength*this.state.boardzoom
        var height = (bigy-smally)* this.state.boardlength*this.state.boardzoom

        var color_width = 50
        var color_height = 40

        var color 
        if(this.state.current_image.length==1 && this.state.current_text.length==0 && this.state.arts[this.state.current_image[0]].color!=undefined){
            color = this.state.arts[this.state.current_image[0]].color
        }
        // console.log(color)
        return (<g>
            {/* <rect x={x-2} y={y-2} width={width+4} height={height+4} stroke='#333333' fill='transparent' strokeWidth='2' style={{cursor:'move'}}  onPointerDown={this.object_moving_init.bind(this)}></rect>
            
            <rect x={x-8} y={y+4} width={12} height={height-8} fill='transparent' strokeWidth='0' style={{cursor:'ew-resize'}} onPointerDown={this.object_resizing_init.bind(this, 'bottom-right')}></rect>
            <rect x={x+width-4} y={y+4} width={12} height={height-8} fill='transparent' strokeWidth='0' style={{cursor:'ew-resize'}} onPointerDown={this.object_resizing_init.bind(this, 'top-left')}></rect>
            <rect x={x+4} y={y-8} width={width-8} height={12} fill='transparent' strokeWidth='0' style={{cursor:'ns-resize'}} onPointerDown={this.object_resizing_init.bind(this, 'bottom-right')}></rect>
            <rect x={x+4} y={y+height-4} width={width-8} height={12} fill='transparent' strokeWidth='0' style={{cursor:'ns-resize'}} onPointerDown={this.object_resizing_init.bind(this, 'top-left')}></rect> */}

            <circle className='bottom-right' cx={x} cy={y} r='6' stroke='#333333' fill='white' style={{cursor:'nw-resize'}} onPointerDown={this.object_resizing_init.bind(this, 'bottom-right')}></circle>
            <circle cx={x+width} cy={y} r='6' stroke='#333333' fill='white' style={{cursor:'ne-resize'}} onPointerDown={this.object_resizing_init.bind(this, 'bottom-left')}></circle>
            <circle cx={x} cy={y+height} r='6' stroke='#333333' fill='white'  style={{cursor:'sw-resize'}} onPointerDown={this.object_resizing_init.bind(this, 'top-right')}></circle>
            <circle cx={x+width} cy={y+height} r='6' stroke='#333333' fill='white'  style={{cursor:'se-resize'}} onPointerDown={this.object_resizing_init.bind(this, 'top-left')}></circle>

            
        </g>)
    }

    toastMessage(){
        // console.log(M)
        var _this = this
        var messages = [
            'If you are an artist, and creating mood board with your own arts, please keep in mind followings! (keep clicking the button)',
            'First, you need to create concepts that can define "your own artworks" compared to others!',
            'Second, you would want to identify concepts that can split your own artworks into different types! (click the button again to close)'
        ]
        if(this.state.messageCount==messages.length){
            M.Toast.dismissAll()
        }else if(this.state.messageCount-1==messages.length){
            M.toast({html: messages[this.state.messageCount], displayLength: 20000, completeCallback: function(){
                _this.setState({messageCount:0})
            }})
        }else{
            M.toast({html: messages[this.state.messageCount], displayLength: 20000})
        }
        
        var messageCount = (this.state.messageCount+1) % (messages.length+1)
        this.setState({messageCount})
    }

    renderInitMoodboardMessage(){
       return (<span style={{fontSize:'30px', verticalAlign:'top'}}><i onClick={this.toastMessage.bind(this)} class='fas fa-info-circle'></i></span>) 
    }
    
    collapseMoodboard(){
        var boardstate = this.props.board_this.state
        if(boardstate.moodboard_collapsed==false && boardstate.sketchpad_collapsed==false){
            this.props.board_this.setState({moodboard_collapsed:true, sketchpad_collapsed: false})
        }else if(boardstate.moodboard_collapsed==false && boardstate.sketchpad_collapsed==true){
            this.props.board_this.setState({moodboard_collapsed:false, sketchpad_collapsed: false})
        }
    }

    setboardlength(){
        var boardwidth = document.getElementById(this.state.boardname).offsetWidth
        var boardheight = document.getElementById(this.state.boardname).offsetHeight
        if(this.props.board_this.state.moodboard_collapsed==false && this.props.board_this.state.sketchpad_collapsed==true){
            boardwidth = boardwidth/2
        }
        if(this.props.board_this.state.moodboard_collapsed==true && this.props.board_this.state.sketchpad_collapsed==false){
            boardwidth = document.getElementById('sketchpad').offsetWidth/2
            boardheight = document.getElementById('sketchpad').offsetHeight
        }
        var boardlength = (boardwidth>boardheight)?boardheight:boardwidth
        console.log(boardlength)
        this.setState({boardlength:boardlength, boardheight:boardheight, boardwidth: boardwidth})
    }

    // TODO add image through url
    // TODO make the image manipulatable
        // resize
        // move
        // deselect
        // select
    render(){
        var boardrender_cursor
        if((this.state.control_state=='add_image'||this.state.control_state=='add_color') && this.state.action!='idle'){
            boardrender_cursor='crosshair'
        }else if(this.state.control_state=='add_comment'){
            boardrender_cursor='cell'
        }else if(this.state.control_state=='add_text'){
            boardrender_cursor='text'
        }else if(this.state.control_state=='control_object' && this.state.action=='move_board'){
            boardrender_cursor='grab'
        }else{
            boardrender_cursor='default'
        }
        var panel_size = ' s6 ' 
        var horizontal_offset = 0
        if(this.props.board_this.state.moodboard_collapsed==false && this.props.board_this.state.sketchpad_collapsed==true){
            panel_size = ' s12 '
            horizontal_offset = this.state.boardwidth/2
        }

        

        

        return (<div className={'col '+panel_size+' oneboard'} style={{display: (this.props.board_this.state.moodboard_collapsed)?'none':''}}>
            <h2 style={{paddingLeft:'25px'}}>Mood board</h2>
            <div className={'panel_collapser'} style={{left: '11px', top: 7.25}} onPointerDown={this.collapseMoodboard.bind(this)}> ▶ </div>
            <div id='moodboard' className='moodboard select_disabled' onWheel={this.zoom_board_wheel.bind(this)} 
                //onPointerOut={this.moveBoardEnd.bind(this)}
                
                
                onPointerMove={this.moodBoardMouseMove.bind(this)}> 
                
                <div className='boardrender' onPointerDown={this.moodBoardMouseInit.bind(this)} onPointerUp={this.moodBoardMouseEnd.bind(this)} 
                // onPointerOut={this.props.board_this.setMoodboardPosition.bind(this.props.board_this, -1, -1)}

                onDrop={this.dropImage.bind(this)}
                onDragEnter={this.dropenter.bind(this)}
                onDragLeave={this.dropout.bind(this)}
                onDragOver={this.dropover.bind(this)}

                style={{
                    width:this.state.boardzoom*this.state.boardlength, 
                    height: this.state.boardzoom*this.state.boardlength,
                    top: this.state.boardheight/2-this.state.boardzoom*this.state.boardlength*this.state.boardcenter[1],
                    left: horizontal_offset+this.state.boardwidth/2-this.state.boardzoom*this.state.boardlength*this.state.boardcenter[0],

                    cursor: boardrender_cursor,
                }}>
                    
                    <svg width={this.state.boardzoom*this.state.boardlength} height={this.state.boardzoom*this.state.boardlength}>
                        
                        
                        {this.state.control_state=='control_object'&&(this.state.current_image.length>0||this.state.current_text.length>0)&&this.state.current_selected_pos!=undefined && 
                            this.renderImageHandle()
                        }
                        {this.renderImages()}
                        {this.renderTexts()}
                        {this.rendereditingTexts()}
                        {this.state.control_state=='control_object'&&(this.state.current_image.length>0||this.state.current_text.length>0)&&this.state.current_selected_pos!=undefined && 
                            this.renderImageHandle2()
                        }
                        
                        
                        
                    </svg>
                    {/* {this.props.board_this.renderCollaboratorsOnMoodBoard()} */}
                    

                </div>

                <MoodBoardMainController mother_this={this} mother_state={this.state}></MoodBoardMainController>
                {this.state.control_state=='add_image' && this.state.action=='idle' && 
                    <MoodBoardImageAddController mother_this={this} mother_state={this.state}></MoodBoardImageAddController>}
                {this.state.control_state=='add_color' && this.state.action=='idle' && 
                    <MoodBoardColorAddController mother_this={this} mother_state={this.state}></MoodBoardColorAddController>}
                
            </div>
        </div>)
    }
}

export default MoodBoard