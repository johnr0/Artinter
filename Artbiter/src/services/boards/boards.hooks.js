var axios = require('axios')
var ml_server = require('../../config')

function sliderImpact(board_id, context){
  context.app.service('boards').find({query: {_id: board_id}})
  .then((res0)=>{
    var search_slider_values = res0[0].search_slider_values
    if(search_slider_values==undefined){
      search_slider_values = {}
    }
    var search_image_selected = res0[0].search_image_selected
    if(search_image_selected==undefined){
      return
    }
    context.app.service('groups').find({query: {board_id:board_id}})
    .then((res1)=>{
      var higher_groups = {}
      var ids = []
      for(var i in res1){
        ids.push(res1[i]._id)
      }
      for(var i in search_slider_values){
        if(ids.indexOf(i)==-1){
          delete search_slider_values[i]
        }
      }

      // console.log(res)
      for(var i in res1){
        // console.log('_id is', res1[i]._id, res1[i].higher_group)//, res[i]._id)
        if(higher_groups[res1[i].higher_group]==undefined){
          higher_groups[res1[i].higher_group]=[]
        }
        higher_groups[res1[i].higher_group].push(res1[i]._id)
      }
      // console.log(higher_groups)
      for(var i in res1){
        if(search_slider_values[res1[i]._id]==undefined){
          // if(higher_groups[res1[i].higher_group].length==2 ){
          //   if(higher_groups[res1[i].higher_group][1]==res1[i]._id){
          //     delete search_slider_values[res1[i]._id]
          //   }else if(higher_groups[res1[i].higher_group][0]==res1[i]._id){
          //     search_slider_values[res1[i]._id]=0
          //   }
          // }else{
            search_slider_values[res1[i]._id]=0
          // }
        }else{
          // if(higher_groups[res1[i].higher_group].length==2 ){
          //   if(higher_groups[res1[i].higher_group][1]==res1[i]._id){
          //     delete search_slider_values[res1[i]._id]
          //   }
          // }
        }
      }

      console.log(search_slider_values)
      cavs = {}
      for(var i in search_slider_values){
        cavs[i] = res1[ids.indexOf(i)].cav
      }

      context.app.service('arts').find({query: {_id: search_image_selected}})
      .then((res2)=>{
        // console.log(search_image_selected, res2[0]._id)
        var embedding = res2[0].embedding
        axios.post(context.app.get('ml_server')+'sliderImpact', {
          search_slider_values: JSON.stringify(search_slider_values),
          cavs: JSON.stringify(cavs),
          cur_image: JSON.stringify(embedding),
        }).then((response)=>{
          // console.log(response.data['distances'])
          var distances = JSON.parse(response.data['distances'])
          // console.log(distances, 'dicstance')
          context.app.service('boards').patch(board_id, {$set: {search_slider_distances:distances, search_slider_values: search_slider_values, updated:'moodboard_search_slider_distances'}})
        }, (error)=>{
          console.log('error')
        })
      })

      

    })
  })
  
}


function searchImages(search_start_image_embedding, cavs, search_slider_values, context){

  context.app.service('searched_arts').find({query: {board_id: context.result._id}})
  .then((res0)=>{
    var calls = []
    for(var i in res0){
      context.app.service('searched_arts').remove(res0[i]._id)
      // calls.push(['remove', 'searched_arts', res0[i]._id])
    }
    // context.app.service('batch').create({calls:calls})
    // .then(()=>{
      axios.post(context.app.get('ml_server')+'searchImages', {
        search_start_image_embedding: JSON.stringify(search_start_image_embedding),
        cavs: JSON.stringify(cavs),
        search_slider_values: JSON.stringify(search_slider_values)
      }).then((response)=>{
        var returned_images = JSON.parse(response.data['returned_images'])
        var calls = []
        for(var i in returned_images){
          var searched_art = {
            image: returned_images[i],
            board_id: context.result._id,
            order: i,
          }
          // context.app.service('searched_arts').create(searched_art)
          calls.push(['create', 'searched_arts', searched_art])
        }
        // search end
        calls.push(['patch', 'boards', context.result._id, {$set: {searching:false, updated:'moodboard_search_done'}}])
        context.app.service('batch').create({calls:calls})
      }, (error)=>{
        console.log('error')
      })
    // })
  })

  // axios.post(context.app.get('ml_server')+'searchImages', {
  //   search_start_image_embedding: JSON.stringify(search_start_image_embedding),
  //   cavs: JSON.stringify(cavs),
  //   search_slider_values: JSON.stringify(search_slider_values)
  // }).then((response)=>{
  //   var returned_images = JSON.parse(response.data['returned_images'])
  //   // console.log('returned images:', returned_images.length)

  //   // TODO show returned images... 
  //   context.app.service('searched_arts').find({query: {board_id: context.result._id}})
  //   .then((res0)=>{
  //     var calls = []
  //     for(var i in res0){
  //       // context.app.service('searched_arts').remove(res0[i]._id)
  //       calls.push(['remove', 'searched_arts', res0[i]._id])
  //     }
  //     for(var i in returned_images){
  //       var searched_art = {
  //         image: returned_images[i],
  //         board_id: context.result._id,
  //         order: i,
  //       }
  //       // context.app.service('searched_arts').create(searched_art)
  //       calls.push(['create', 'searched_arts', searched_art])
  //     }
  //     // search end
  //     calls.push(['patch', 'boards', context.result._id, {$set: {searching:false, updated:'moodboard_search_done'}}])
  //     context.app.service('batch').create({calls:calls})
      
  //   })
    
  // }, (error)=>{
  //   console.log('error')
  // })
}

function generateImage(content_image, content, content_weight, styles, style_weights, context){
  // console.log('run this how?', content_image)
  // console.log(JSON.stringify(content))
  axios.post(context.app.get('ml_server')+'generateImage', {
    content_image: content_image,
    content: JSON.stringify(content),
    content_weight: content_weight,
    styles: JSON.stringify(styles),
    style_weights: JSON.stringify(style_weights)
  }, {
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
  }).then((response)=>{
    console.log('response')
    var returned_images = JSON.parse(response.data['returned_images'])
    // console.log('returned images:', returned_images.length)

    // TODO show returned images... 
    context.app.service('searched_arts').find({query: {board_id: context.result._id}})
    .then((res0)=>{
      for(var i in res0){
        context.app.service('searched_arts').remove(res0[i]._id)
      }
      for(var i in returned_images){
        var searched_art = {
          image: returned_images[i],
          board_id: context.result._id,
          order: i,
        }
        context.app.service('searched_arts').create(searched_art)
      }
      context.app.service('boards').patch(context.result._id, {$set: {searching:false, updated:'moodboard_search_done'}})
    })
  }, (error)=>{
    console.log('error')
  })
}

function generateImageWithScaling(content, styles, context){
  console.log('start and error?')
  // console.log(typeof JSON.stringify(content))
  // console.log(typeof JSON.stringify(styles))
  context.app.service('event_logs').create({event: 'generate_on_sketchpad', board_id: context.arguments[0], user_id: context.params.user._id})
  axios.post(context.app.get('ml_server')+'generateImageWithScaling', {
    content: JSON.stringify(content),
    styles: JSON.stringify(styles)
  }, {
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
  }).then((response)=>{
    var returned_image = response.data['returned_image']
    console.log('got response')
    // add layer
    // console.log(returned_image)
    var layer_id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    // console.log(content['current_layer'])
    var layer = {
      _id: layer_id, 
      board_id: context.arguments[0],
      image: returned_image,
      opacity: 1,
      choosen_by: '',
      updated: 'sketchpad_add_a_layer_style',
    }
    var undo_id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    var push ={
      layers: {
        $each: [layer_id],
        $position: parseInt(content['current_layer']),
      },
      sketchundo: {
        undo_id: undo_id, 
        user_id: context.arguments[2]['user']['_id'],
        type: 'layer_add',
        layer_id: layer_id,
      }
    }
    var sketchundo = {
      _id: undo_id, 
      user_id: context.arguments[2]['user']['_id'],
      type: 'layer_add',
      layer_idx: content['current_layer'],
      layer_id: layer_id,
      layer: layer,
      board_id: context.arguments[0]
    }
    var set ={
      updated: 'sketchpad_add_a_layer_style_stamp_'+context.arguments[2]['user']['_id'], 
      undoable: false,
    }
    

    context.app.service('boards').patch(context.arguments[0], {$set:set, $push:push}).then(()=>{
      context.app.service('layers').create(layer).then(()=>{
        // context.app.service('sketchundos').create(sketchundo)
      })
    })
  
    // context.app.service('boards').patch(context.arguments[0], {$set: {sketchpad_style_image: returned_image, updated:'sketchpad_style_result'}})
  }, (error)=>{
    console.log('error in style transferring')
  })
}

const onBoardUpdate = async context =>{

    context.app.service('boards').emit('changed', {
        data: context.arguments[1]
    })
    // console.log(context.app.service('boards').emit)
    return context
}

const boardSearchImage = async context => {
  if(context.result.updated=='moodboard_search_images'){
    console.log('board search starts')
    var search_start_image = context.result.search_image_selected
    var search_slider_values = context.result.search_slider_values
    var search_slider_groups = Object.keys(search_slider_values)
    // console.log(search_slider_values)
    // console.log(context.params.user._id)
    if(search_start_image!=undefined && search_slider_values!=undefined){
      console.log(search_start_image, search_slider_values)
      context.app.service('event_logs').create({event: 'search', board_id: context.arguments[0], user_id: context.params.user._id})
      // .then(()=>{
        context.app.service('arts').find({query: {_id: search_start_image}})
        .then((res1)=>{
          var search_start_image_embedding = res1[0].embedding
          var cavs = {}
          context.app.service('groups').find({_id: {$in: search_slider_groups}})
          .then((res2)=>{

            for(var i in res2){
              cavs[res2[i]._id] = res2[i].cav
            }
            
            searchImages(search_start_image_embedding, cavs, search_slider_values, context)

          })
        })
      // })
      
    }
  }
}

const boardGenerateImage = async context =>{
  if(context.result.updated=='moodboard_generate_image'){
    console.log('board generatee starts')
    var search_start_image = context.result.search_image_selected
    if(search_start_image==undefined){
      return
    }
    // console.log('hm?')
    var generate_slider_values = JSON.parse(JSON.stringify(context.result.generate_slider_values))
    context.app.service('event_logs').create({event: 'generate_on_moodboard', board_id: context.arguments[0], user_id: context.params.user._id})
    // .then(()=>{
      context.app.service('groups').find({query:{board_id: context.result._id}})
      .then((groups)=>{
        var group_ids = []
        var groups_with_higher = {}
        // for(var i in groups){
        //   if(groups_with_higher[groups[i].higher_group]==undefined){
        //     groups_with_higher[groups[i].higher_group] = []
        //   }
        //   group_ids.push(groups[i]._id)
        //   groups_with_higher[groups[i].higher_group].push(groups[i]._id)
          
        // }
        // for(var hk in groups_with_higher){
        //   if(groups_with_higher[hk].length==2){
        //     for(var i in groups_with_higher[hk]){
        //       if(search_slider_values[groups_with_higher[hk][i]]==undefined){
        //         var idx = 0
        //         if(i==0){
        //           idx=1
        //         }
        //         search_slider_values[groups_with_higher[hk][i]]= 1-search_slider_values[groups_with_higher[hk][idx]]
        //       }
        //     }
        //   }
        // }
        var weight_sum = 0
        for(var gk in generate_slider_values){
          weight_sum = weight_sum + generate_slider_values[gk]
        }
        // console.log(weight_sum, 'weight sum is...', generate_slider_values)
        if(weight_sum==0){
          return
        }
        var art_weight = generate_slider_values['selected_image']
        if(art_weight==undefined){
          art_weight = 0
        }else{
          delete generate_slider_values['selected_image']
        }
        art_weight = art_weight/weight_sum
        // console.log(art_weight)
        // var art_weight = 0
        for(var gk in generate_slider_values){
          // search_slider_values[gk]= search_slider_values[gk]/weight_sum
          generate_slider_values[gk]= generate_slider_values[gk]/weight_sum
          group_ids.push(gk)
        }

        // console.log(generate_slider_values)
        // console.log(group_ids)
        context.app.service('group_styles').find({query: {group_id: {$in: group_ids}}})
        .then((group_styles)=>{
          console.log('pass?')
          var styles_of_groups = {}
          for(var i in group_styles){
            styles_of_groups[group_styles[i].group_id] = group_styles[i].style
          }
          context.app.service('art_styles').find({query: {art_id: search_start_image}})
          .then((art_styles)=>{
            console.log('pass2?')
            var art_style = art_styles[0].style
            context.app.service('arts').find({query: {_id: search_start_image}})
            .then((art)=>{
              // console.log(art)
              generateImage(art[0].file, art_style, art_weight, styles_of_groups, generate_slider_values, context)
            })

            
          })
        })
      })
    // })
    

  }
}

const boardSearchSimilarImage = async context =>{
  if(context.result.updated=='moodboard_search_similar_images'){
    console.log('board similar search starts')
    var search_start_image = context.result.search_image_selected
    if(search_start_image!=undefined){
      context.app.service('event_logs').create({event: 'search_similar', board_id: context.arguments[0], user_id: context.params.user._id})
      // .then(()=>{
        context.app.service('arts').find({query: {_id: search_start_image}})
        .then((res1)=>{
          var search_start_image_embedding = res1[0].embedding
          searchImages(search_start_image_embedding, {}, {}, context)
          
        })
      // })
      
    }
  }
}

const boardSearchRandomImage = async context =>{
  if(context.result.updated=='moodboard_search_random_images'){
    context.app.service('event_logs').create({event: 'search_random', board_id: context.arguments[0], user_id: context.params.user._id})
    axios.post(context.app.get('ml_server')+'randomSearchImage', {})
    .then((response)=>{
      var returned_images = JSON.parse(response.data['returned_images'])
      // console.log('returned images:', returned_images.length)

      // TODO show returned images... 
      context.app.service('searched_arts').find({query: {board_id: context.result._id}})
      .then((res0)=>{
        for(var i in res0){
          context.app.service('searched_arts').remove(res0[i]._id)
        }
        for(var i in returned_images){
          var searched_art = {
            image: returned_images[i],
            board_id: context.result._id,
            order: i,
          }
          context.app.service('searched_arts').create(searched_art)
        }
        context.app.service('boards').patch(context.result._id, {$set: {searching:false, updated:'moodboard_search_done'}})
      })
    }, (error)=>{

    })
  }
}

const afterSliderValuesChange = async context =>{
  if(context.result.updated=='moodboard_search_slider_change'){
    sliderImpact(context.result._id, context)
  }
}

const afterSearchImageSelected = async context =>{
  if(context.result.updated=='moodboard_search_image_select'){
    sliderImpact(context.result._id, context)
  }
}

const sketchpadStyleApply = async context => {
  if(context.arguments[1]['$set']!=undefined){

  
    if(context.arguments[1]['$set'].updated == 'sketchpad_style_apply'){
      var content = context.arguments[1]['$set'].content
      delete context.arguments[1]['$set'].content 
      var styles = context.arguments[1]['$set'].styles
      delete context.arguments[1]['$set'].styles

      // console.log(context.arguments[1])
      // do something fun

      // console.log(styles)

      generateImageWithScaling(content, styles, context)

      return context
    }
  }
}

const afterRemove = async context => {
  var _id = context.result._id
  console.log(_id)
  // context.app.service('group_styles').find({query:{board_id: _id}}).then((res)=>{
  //   for(var i in res){
  //     context.app.service('group_styles').remove(res[i]._id)
  //   }
  // })

  context.app.service('searched_arts').find({query:{board_id: _id}}).then((res)=>{
    var searched_arts_remove = []
    for(var i in res){
      searched_arts_remove.push(['remove', 'searched_arts', res[i]._id])
    }
    context.app.service('batch').create({calls: searched_arts_remove})
    .then(()=>{
      context.app.service('art_styles').find({query:{board_id: _id}}).then((res)=>{
        var art_styles_remove = []
        for(var i in res){
          art_styles_remove.push(['remove', 'art_styles', res[i]._id])
        }
        context.app.service('batch').create({calls: art_styles_remove}).then(()=>{
          context.app.service('arts').find({query:{board_id: _id}}).then((res)=>{
            var arts_remove = []
            for(var i in res){
              arts_remove.push(['remove', 'arts', res[i]._id])
            }
            context.app.service('batch').create({calls:arts_remove}).then(()=>{
              context.app.service('layers').find({query:{board_id: _id}}).then((res)=>{
                var layers_remove = []
                for(var i in res){
                  layers_remove.push(['remove', 'layers', res[i]._id])
                }
                context.app.service('batch').create({calls:layers_remove}).then(()=>{
                  context.app.service('sketchundos').find({query:{board_id: _id}}).then((res)=>{
                    var sketchundo_remove = []
                    for(var i in res){
                      sketchundo_remove.push(['remove', 'sketchundos', res[i]._id])
                    }
                    context.app.service('batch').create({calls:sketchundo_remove}).then((res)=>{
                      console.log('success until gropu deletion')
                      context.app.service('groups').find({query:{board_id: _id}}).then((res)=>{
                        var group_remove_calls = []
                        for(var i in res){
                          group_remove_calls.push(['remove', 'groups', res[i]._id])
                          // context.app.service('groups').remove(res[i]._id)
                        }
                        context.app.service('batch').create({calls: group_remove_calls})
                      })
                    })
                  })
                })
              })
            })
          })
        })
      })
    })
  })


  

  
  
            
}

const undoStart = async context =>{
  if(context.result.updated.indexOf('sketchpad_undo_start.')!=-1){
    var undo_id = context.result.updated.split('.')[1]
    // console.log(undo_id)
    context.app.service('sketchundos').find({query:{_id:undo_id}})
    .then((res)=>{
      // console.log(res)
      if(res.length>0){
        context.app.service('sketchundos').patch(undo_id, {$set:{doundo:true}})
      }
    })
  }
  

}

const userIn = async context =>{
  if(context.result.updated.indexOf('current_collaborators.')!=-1){
    // console.log(context.arguments)
    
    if(context.arguments[1]['$set']['current_collaborators.'+context.params.user_id]!=false){
      context.app.service('event_logs').create({event: 'enter_board', board_id: context.arguments[0], user_id: context.params.user._id})
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
      patch: [sketchpadStyleApply],
      remove: []
    },
  
    after: {
      all: [],
      find: [],
      get: [],
      create: [],
      update: [userIn],
      patch: [boardSearchImage, boardGenerateImage, boardSearchSimilarImage, boardSearchRandomImage, afterSliderValuesChange, afterSearchImageSelected, undoStart],
      remove: [afterRemove]
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