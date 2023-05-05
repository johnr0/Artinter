import React, {Component} from 'react'

class MoodboardStyleSketchControlAI extends Component{
    state={
        art_weight:{},
        art_area: {},
        action:'idle',

        init_pos: undefined,

    }

    componentDidUpdate(){
        var current_image = this.props.mother_state.current_image

        var art_weight = this.state.art_weight
        var art_area = {}

        for(var art_id in art_weight){
            if(current_image.indexOf(art_id)==-1){
                delete art_weight[art_id]
                delete art_area[art_id]
            }
        }
        for(var i in current_image){
            if(art_weight[current_image[i]]==undefined){
                art_weight[current_image[i]]=0.5
            }
        }
        // this.setState({art_weight})
    }

    setArtWeight(_id, e){
        console.log(e.target.value, e.nativeEvent.offsetY)
        console.log(e.target.offsetHeight)
        e.stopPropagation();
        e.preventDefault();
        var value = 1-e.nativeEvent.offsetY/e.target.offsetHeight
        var art_weight = this.state.art_weight
        art_weight[_id] = value
        this.setState({art_weight})
        this.props.mother_this.setState({action:'change-style-weight'})
        
    }
    setArtWeightMove(_id, e){
        if(this.props.mother_state.action=='change-style-weight'){
            console.log(e.target.value, e.nativeEvent.offsetY)
            console.log(e.target.offsetHeight)
            e.stopPropagation();
            e.preventDefault();
            var value = 1-e.nativeEvent.offsetY/e.target.offsetHeight
            var art_weight = this.state.art_weight
            art_weight[_id] = value
            this.setState({art_weight})
        }
        
        
    }

    endWeightEdit(e){
        e.stopPropagation();
        e.preventDefault();
        console.log('endweightsss')
        this.props.mother_this.setState({action:'idle'})
    }

    specifyAreaInit(_id, e){
        // console.log(e.target.height.animVal.value)
        e.stopPropagation();
        e.preventDefault();
        var el = document.getElementById('style_cover_'+_id)
        console.log((e.nativeEvent.pageX-el.getBoundingClientRect().left)/el.getBoundingClientRect().width)
        console.log(el.width, el.getBoundingClientRect())
        var x = (e.nativeEvent.pageX-el.getBoundingClientRect().left)/el.getBoundingClientRect().width
        var y = (e.nativeEvent.pageY-el.getBoundingClientRect().top)/el.getBoundingClientRect().height
        var init_pos =[x, y]
        var art_area = this.state.art_area
        art_area[_id] = [init_pos[0], init_pos[1], init_pos[0], init_pos[1]]
        this.setState({init_pos:init_pos, action:'area_change_'+_id, art_area:art_area})
        
    }

    specifyAreaMove(_id, e){
        if(this.state.action=='area_change_'+_id){
            var art_area = this.state.art_area
            var el = document.getElementById('style_cover_'+_id)
            art_area[_id][2] = (e.nativeEvent.pageX-el.getBoundingClientRect().left)/el.getBoundingClientRect().width
            art_area[_id][3] = (e.nativeEvent.pageY-el.getBoundingClientRect().top)/el.getBoundingClientRect().height
            this.setState({art_area: art_area})
        }
    }

    specifyAreaEnd(_id, e){
        console.log('specify area end',this.state.action==('area_change_'+_id))
        if(this.state.action=='area_change_'+_id){
            var art_area = this.state.art_area
            var el = document.getElementById('style_cover_'+_id)
            if(this.state.init_pos[0]==(e.nativeEvent.pageX-el.getBoundingClientRect().left)/el.getBoundingClientRect().width && this.state.init_pos[1]==(e.nativeEvent.pageY-el.getBoundingClientRect().top)/el.getBoundingClientRect().height){
                
                delete art_area[_id]
            }else{
                if(art_area[_id][1]>art_area[_id][3]){
                    var temp = art_area[_id][3]
                    art_area[_id][3]=art_area[_id][1]
                    art_area[_id][1]=temp
                }
                if(art_area[_id][0]>art_area[_id][2]){
                    var temp = art_area[_id][2]
                    art_area[_id][2]=art_area[_id][0]
                    art_area[_id][0]=temp
                }
            }
            console.log('end', art_area)
            this.setState({init_pos:undefined, action:'idle', art_area: art_area})
        }
    }

    specifyAreaReset(_id, e){
        // console.log(e.target.value, e.nativeEvent.offsetY)
        // console.log(e.target.height.animVal.value)
        e.stopPropagation();
        e.preventDefault();
        var art_area = this.state.art_area
        delete art_area[_id] 
        this.setState({art_area:art_area})
        
    }

    renderControlBox(art){
        var smallx = (art.position[0]<art.position[2])?art.position[0]:art.position[2]
        var bigx = (art.position[0]>art.position[2])?art.position[0]:art.position[2]
        var smally = (art.position[1]<art.position[3])?art.position[1]:art.position[3]
        var bigy = (art.position[1]>art.position[3])?art.position[1]:art.position[3]
        var x = smallx* this.props.mother_state.boardlength* this.props.mother_state.boardzoom
        var y = smally* this.props.mother_state.boardlength* this.props.mother_state.boardzoom

        var width = (bigx-smallx) * this.props.mother_state.boardlength* this.props.mother_state.boardzoom
        var height = (bigy-smally) * this.props.mother_state.boardlength* this.props.mother_state.boardzoom

        var value 
        if(this.state.art_weight[art._id]==undefined){
            value = 50
        }else{
            value= this.state.art_weight[art._id]*100
        }
        var area
        if(this.state.art_area[art._id]!=undefined){
            var int_area = this.state.art_area[art._id]
            // console.log(int_area)
            var smx = (int_area[0]<int_area[2])?int_area[0]:int_area[2]
            var bgx = (int_area[0]>int_area[2])?int_area[0]:int_area[2]
            var smy = (int_area[1]<int_area[3])?int_area[1]:int_area[3]
            var bgy = (int_area[1]>int_area[3])?int_area[1]:int_area[3]
            var x_sub = smx*width
            var y_sub = smy*height

            var width_sub = (bgx-smx) * width
            var height_sub = (bgy-smy) * height
            var el = document.getElementById('style_cover_'+art._id)
            area = [x+x_sub, y+y_sub, width_sub, height_sub]
            console.log(area)
        }
        

        return (<g>
            {/* <foreignObject x={x-20} y={y} width={20} height={height}>
                <input id={'style_weight_'+art._id} type='range' style={{WebkitAppearance: 'vertical', height: '100%'}} 
                // onPointerDown={this.cancelMove.bind(this, 'change-style-weight', art._id)} 
                min={0} max={100} orient='vertical' onPointerDown={this.setArtWeight.bind(this, art._id)} onPointerMove={this.setArtWeightMove.bind(this, art._id)} onPointerUp={this.endWeightEdit.bind(this)}
                onChange={this.endWeightEdit.bind(this)}
                value={value}></input>
            </foreignObject> */}
            <rect id={'style_cover_'+art._id} x={x} y={y} width={width} height={height} stroke='red' fill='transparent' strokeWidth='2'
                // onPointerDown={this.specifyAreaInit.bind(this, art._id)}
                // onPointerMove={this.specifyAreaMove.bind(this, art._id)}
                // onPointerUp={this.specifyAreaEnd.bind(this, art._id)}
            ></rect>
            {/* {area!=undefined && <rect x={area[0]} y={area[1]} width={area[2]} height={area[3]} stroke='red' fill='transparent' strokeWidth='2' 
            onPointerDown={this.specifyAreaReset.bind(this, art._id)}
            onPointerUp={this.specifyAreaEnd.bind(this, art._id)}></rect>} */}
        </g>)
    }

    renderControlBoxes(){
        var arts = this.props.mother_state.arts
        var current_image = this.props.mother_state.current_image

        var selected_arts = {}
        for(var i in current_image){
            selected_arts[current_image[i]]=arts[current_image[i]]
        }
        return Object.keys(selected_arts).map((key, idx)=>{
            var art = selected_arts[key]

            return this.renderControlBox(art)
        })
    }


    render(){
        console.log('ever rendered?')
        return (<g>
            {this.renderControlBoxes()}
        </g>)
    }
}

export default MoodboardStyleSketchControlAI;