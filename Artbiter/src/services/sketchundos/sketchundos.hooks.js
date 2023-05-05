// const { default: Api } = require("../../../client/middleware/api")

const SketchUndoBeforeCreate = async context =>{
    context.app.service('sketchundos').find({query: {board_id: context.data.board_id, $sort: {date:1}}})
    .then((res)=>{
        if(res.length>20){
            context.app.service('sketchundos').find({query: {_id:res[0]._id}})
            .then((res2)=>{
                if(res2.length!=0){
                    context.app.service('sketchundos').remove(res[0]._id)
                }
            })
            // context.app.service('sketchundos').remove(res[0]._id)
        }
    })
    context.data.date = new Date()
}

const SketchUndoAfterCreate = async context => {
    // update the board to undoable
    // update the list in the board
    // console.log(context.result)
    context.app.service('boards').find({query: {_id: context.result.board_id}})
    .then((res)=>{
        // console.log(res)
        // console.log('cr')
        var sketchundo = res[0].sketchundo
        if(sketchundo.length>20){
            sketchundo.splice(0, 1)
            context.app.service('boards').patch(context.result.board_id, {$set: {sketchundo, undoable:true, updated:'sketchpad_undoable'}})
        }else{
            context.app.service('boards').patch(context.result.board_id, {$set: {undoable:true, updated:'sketchpad_undoable'}})
        }
    })
    
}
function removeSketchundoFromBoard(sketchundo, context){
    // console.log('1')
    context.app.service('boards').find({query: {_id: sketchundo.board_id}}).then((res)=>{
        // console.log('2')
        var board = res[0]
        var sketchundo_list = board.sketchundo.slice()
        var idx=-1
        // console.log('3')
        for(var i in sketchundo_list){
            if(sketchundo_list[i].undo_id==sketchundo._id){
                idx = i
            }
        }
        // console.log(idx, sketchundo_list.length)
        
        if(idx!=-1){
            sketchundo_list.splice(idx,1)
        }
        // console.log(idx, sketchundo_list.length)
        context.app.service('boards').patch(sketchundo.board_id, {$set: {sketchundo: sketchundo_list, undoable:true, updated:'sketchpad_undoable'}})
        context.app.service('sketchundos').find({query: {_id:sketchundo._id}})
        .then((res)=>{
            if(res.length!=0){
                context.app.service('sketchundos').remove(sketchundo._id)
            }
        })
    })
}

const Undo = async context =>{
    // console.log(context.result)
    var sketchundo = context.result 
    // console.log('undo', sketchundo.type)
    if(sketchundo.type == 'layer_image'){
        var sketchundo_send = {
            user_id: sketchundo.user_id,
            cond: sketchundo.cond,
            selection: sketchundo.selection
        }
        context.app.service('layers').patch(sketchundo.layer_id, {$set: {updated: 'sketchpad_undo_update_a_layer', image: sketchundo.layer_image}}).then(()=>{
            context.app.service('boards').patch(sketchundo.board_id, {updated: 'sketchpad_undo_update_a_layer.'+sketchundo._id, sketchundo_send: sketchundo_send}).then(()=>{
                removeSketchundoFromBoard(sketchundo, context)
            })
        })
    }else if(sketchundo.type == 'layer_add'){
        context.app.service('layers').remove(sketchundo.layer_id).then(()=>{
            context.app.service('boards').patch(sketchundo.board_id, {$pull: {layers: sketchundo.layer_id}, $set: {updated: 'sketchpad_undo_add_a_layer.'+sketchundo.layer_id+'.'+sketchundo._id, sketchundo_send: undefined}})
            .then(()=>{
                // handle sketchundo in the board
                removeSketchundoFromBoard(sketchundo, context)
            })
        })
    }else if(sketchundo.type == 'layer_remove'){
        context.app.service('layers').create(sketchundo.layer).then(()=>{
            context.app.service('boards').patch(sketchundo.board_id, {updated: 'sketchpad_undo_remove_a_layer.'+sketchundo.layer_id+'.'+sketchundo._id, layers:sketchundo.layers, sketchundo_send: undefined})
            .then(()=>{
                removeSketchundoFromBoard(sketchundo, context)
            })
        })
        
    }else if(sketchundo.type == 'layer_reorder'){
        context.app.service('boards').patch(sketchundo.board_id, {updated: 'sketchpad_undo_reorder_a_layer..'+sketchundo._id, layers: sketchundo.layers, sketchundo_send: undefined})
        .then(()=>{
            removeSketchundoFromBoard(sketchundo, context)
        })
    }else if(sketchundo.type == 'layer_hide'){
        context.app.service('layers').patch(sketchundo.layer_id, {updated: 'sketchpad_undo_layer_hide', hide: sketchundo.hide}).then(()=>{
            removeSketchundoFromBoard(sketchundo, context)
        })
    }
    // context.app.service('sketchundos').find({query: {_id: context.argument[0]}})
    // .then((res)=>{

    // })
}


module.exports = {
    before: {
      all: [],
      find: [ ],
      get: [],
      create: [],
      update: [],
      patch: [],
      remove: []
    },
  
    after: {
      all: [],
      find: [],
      get: [],
      create: [],
      update: [],
      patch: [Undo],
      remove: []
    },
  
    error: {
      all: [],
      find: [],
      get: [],
      create: [],
      update: [],
      patch: [],
      remove: []
    }
  };