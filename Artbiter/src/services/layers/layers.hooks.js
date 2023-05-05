const layerPatch = async context =>{
  if(context.arguments[1]['$set']!=undefined){
    if(context.arguments[1]['$set']['updated']=='sketchpad_update_a_layer'){
      context.arguments[1]
      var sketchundo = context.arguments[1]['$set']['sketchundo']
      context.arguments[1]['$set']['sketchundo'] = undefined
      context.arguments[1]['$set']['diff'] = undefined
      console.log('layer updated!')
      // console.log(sketchundo)
      // context.app.service('layers').find({query: {_id: context.arguments[0]}})
      // .then((res)=>{
      //   sketchundo['layer_id'] = res[0]._id
      //   sketchundo['board_id'] = res[0].board_id
      //   sketchundo['layer_image'] = res[0].image
      //   sketchundo['type']='layer_image'
      //   // context.app.service('sketchundos').create(sketchundo)
      // })



      // Canvas=require('canvas')
      // console.log('reach?')
      // context.app.service('layers').find({query: {_id: context.arguments[0]}})
      // .then((res)=>{
        
      //   var oriimg = new Canvas.Image()
      //   var newimg = new Canvas.Image()
        
      //   oriimg.onload = function(){
      //     var ori_canv = Canvas.createCanvas(1000, 1000)
      //     var ori_context = ori_canv.getContext('2d')
      //     ori_context.drawImage(oriimg,0,0)
      //     newimg.onload = function(){
      //       var new_canv = Canvas.createCanvas(1000, 1000)
      //       var new_context = new_canv.getContext('2d')
            
      //       new_context.drawImage(newimg,0,0)
      //       console.log('here1')

      //       oriData = ori_context.getImageData(0,0,1000,1000).data
      //       newData = new_context.getImageData(0,0,1000,1000).data
      //       length = oriData.length
      //       console.log('here2')

      //       oriData = new Uint8Array(oriData)
      //       newData = new Uint8Array(newData)

      //       xmax = 0
      //       xmin = 1000
      //       ymax = 0
      //       ymin = 1000
      //       ys = []

      //       // later, this "addition" pipeline can be improved, but let's leave it for now...

      //       for (var i=0; i<length; i += 4){
      //         if(oriData[i]!=newData[i]||oriData[i+1]!=newData[i+1]||oriData[i+2]!=newData[i+2]||oriData[i+3]!=newData[i+3]){
      //           x = (i/4)%1000
      //           y = Math.floor(i/4/1000)
      //           if(xmax<x){
      //             xmax = x
      //           }
      //           if(xmin>x){
      //             xmin = x
      //           }
      //           if(ymax<y){
      //             ymax = y
      //           }
      //           if(ymin>y){
      //             ymin = y
      //           }
      //         }
      //       }

      //       im_crop = new_context.getImageData(xmin, ymin, xmax-xmin, ymax-ymin)
      //       var diff_canv = Canvas.createCanvas(xmax-xmin, ymax-ymin)
      //       var diff_context = diff_canv.getContext('2d')
      //       diff_context.clearRect(0, 0, xmax-xmin, ymax-ymin);
      //       diff_context.putImageData(im_crop,0,0) 

      //       context.app.service('layers').patch(context.arguments[0], {$set:{diff:diff_canv.toDataURL(), diff_x:xmin, diff_y: ymin, updated:'sketchpad_efficiently_update_a_layer'}})
      //     }
      //     newimg.src = context.arguments[1]['$set']['image']

      //   }
      //   oriimg.src = res[0].image
      // })
      
    }
  }
  
  
}


module.exports = {
    before: {
      all: [],
      find: [ ],
      get: [],
      create: [],
      update: [],
      patch: [layerPatch],
      remove: []
    },
  
    after: {
      all: [],
      find: [],
      get: [],
      create: [],
      update: [],
      patch: [],
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