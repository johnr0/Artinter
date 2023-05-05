import React, {Component} from 'react'
import Api from '../../middleware/api'

class SketchpadUndo extends Component{

    undoSkip(){
        var sketchundo = this.props.mother_state.sketchundo
        if(sketchundo==undefined){
            return [false, true]
        }
        var user_id = this.props.mother_this.props.board_this.state.user_id
        var idx = undefined
        var type=undefined
        var skip = true
        for(var i=sketchundo.length-1; i>=0; i--){
            if(sketchundo[i]!=undefined){
                if(sketchundo[i].user_id==user_id){
                    // console.log(i)
                    idx = i
                    type=sketchundo[idx].type
                    skip=false
                    break
                }
            }
            
        }
        
        if(idx!=undefined){
            for(var i=sketchundo.length-1; i>idx; i--){
                if(type=='layer_image'||type=='layer_hide'){
                    if(sketchundo[i].type=='layer_image'||sketchundo[i].type=='layer_hide'||sketchundo[i].type=='layer_remove'){
                        if(sketchundo[i].layer_id == sketchundo[idx].layer_id){
                            skip = true
                        }
                    }
                }else if(type=='layer_add'||type=='layer_remove'||type=='layer_reorder'){
                    var cur_type = sketchundo[i].type
                    if(cur_type=='layer_add'||cur_type=='layer_remove'||cur_type=='layer_reorder'){
                        skip = true
                    }
                    if(type=='layer_add'){
                        if(cur_type=='layer_remove'||cur_type=='layer_image'){
                            if(sketchundo[i].layer_id==sketchundo[idx].layer_id){
                                skip = true
                            }
                        }else if(cur_type=='layer_reorder'){
                            skip = true
                        }
                    }
                
                }
            }
        }
        // console.log(idx, skip)
        return [idx, skip]
    }

    sketchUndo(){
        var info = this.undoSkip()
        
        if(info[1]==false){
            var sketchundo = this.props.mother_state.sketchundo[info[0]]
            console.log(sketchundo)
            Api.app.service('boards').patch(this.props.mother_this.props.board_this.state.board_id, {$set: {undoable:false, updated: 'sketchpad_undo_start.'+sketchundo.undo_id}})
            // .then(()=>{
            //     Api.app.service('sketchundos').patch(sketchundo.undo_id, {$set:{doundo:true}})
            // })
            
            // this.props.mother_this.props.board_this.SketchUndo(info[0], sketchundo)
        }
        
    }


    render(){


        return(<div className="undo_controller">
            {/* <div onClick={this.sketchUndo.bind(this)} style={{color: (this.undoSkip()[1])?'#eeeeee':'black'}}><i class='material-icons'>undo</i></div> */}
        </div>)
    }
}

export default SketchpadUndo;