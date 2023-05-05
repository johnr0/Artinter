var axios = require('axios')
var ml_server = require('../../config')
// var nj = require('numjs');
const { response } = require('@feathersjs/express');

function sliderImpact(board_id, context){
  context.app.service('boards').find({query: {_id: board_id}})
  .then((res0)=>{
    // console.log('b', res0.length)
    var generate_slider_values = res0[0].generate_slider_values
    if(generate_slider_values==undefined){
      generate_slider_values = {}
    }
    // console.log('b')
    var search_slider_values = res0[0].search_slider_values
    if(search_slider_values==undefined){
      search_slider_values = {}
    }
    var search_image_selected = res0[0].search_image_selected
    // console.log('search_image_selected', search_image_selected)
    
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
      for(var i in generate_slider_values){
        if(ids.indexOf(i)==-1 && i!='selected_image'){
          delete generate_slider_values[i]
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
        }
        // else{
        //   if(higher_groups[res1[i].higher_group].length==2 ){
        //     if(higher_groups[res1[i].higher_group][1]==res1[i]._id){
        //       delete search_slider_values[res1[i]._id]
        //     }
        //   }
        // }
      }

      // console.log(search_slider_values)
      cavs = {}
      for(var i in search_slider_values){
        cavs[i] = res1[ids.indexOf(i)].cav
      }
      if(search_image_selected==undefined){
        // console.log('gsv', generate_slider_values)
        context.app.service('boards').patch(board_id, {$set: {search_slider_values: search_slider_values, generate_slider_values: generate_slider_values, updated:'moodboard_search_slider_distances'}})
        return
      }
      context.app.service('arts').find({query: {_id: search_image_selected}})
      .then((res2)=>{
        if(res2.length==0){
          return
        }
        
        
        // console.log(search_image_selected, res2[0]._id)
        var embedding = res2[0].embedding
        axios.post(context.app.get('ml_server')+'sliderImpact', {
          search_slider_values: JSON.stringify(search_slider_values),
          cavs: JSON.stringify(cavs),
          cur_image: JSON.stringify(embedding),
        }).then((response)=>{
          // console.log(response.data['distances'])
          var distances = JSON.parse(response.data['distances'])
          context.app.service('boards').patch(board_id, {$set: {search_slider_distances:distances, search_slider_values: search_slider_values, generate_slider_values: generate_slider_values, updated:'moodboard_search_slider_distances'}})
        }, (error)=>{
          console.log('error')
        })
      })

      

    })
  })
  
}

function trainCAV(embeddings, context, board_id, added_id=undefined){
  console.log('embedding--', Object.keys(embeddings))
  if(Object.keys(embeddings).length==0){
    return 
  }
  // console.log(JSON.stringify(styles))
  axios.post(context.app.get('ml_server')+'trainCAV', {
    embeddings: JSON.stringify(embeddings),
  }).then((response)=>{
    // console.log(response.data)
    var cavs = JSON.parse(response.data['cavs'])

    // var avg_styles = JSON.parse(response.data['avg_styles'])
    // console.log(avg_styles)
    var promises = []
    var promise_patches = []
    for(var i in cavs){
      // console.log(cavs[i])
      promise_patches.push(['patch', 'groups', i, {$set: {cav: cavs[i], updated: 'moodboard_group_cav_update'}}])
      // promises.push(context.app.service('groups').patch(i, {$set: {cav: cavs[i], updated: 'moodboard_group_cav_update'}}))
    }

    context.app.service('group_models').find({query:{board_id: context.result.board_id}})
    .then((res)=>{
      to_remove=[]
      to_remove_ids = []
      for(var i in res){
        // console.log('overlap is', res[i].groups.filter(value => Object.keys(cavs).includes(value)))
        if(res[i].groups.filter(value => Object.keys(cavs).includes(value)).length>0){
          to_remove_ids.push(res[i]._id)
          // to_remove.push(context.app.service('group_models').remove(res[i]._id))
        }
      }
      console.log('group find')
      context.app.service('groups').find({query: {_id: {$in: Object.keys(cavs)}}})
      .then((res2)=>{
        var _id = res2[0].higher_group
        console.log('group model remove')
        context.app.service('group_models').remove(null, {query: {_id: {$in: to_remove_ids}}})
        .then(()=>{
          console.log('group model find')
          context.app.service('group_models').find({query:{_id:{$in: [context.result.board_id+'_'+_id]}}})
          .then((res_fin)=>{
            console.log('group model create', res_fin.length)
            if(res_fin.length==0){
              // console.log('source of error?')
              context.app.service('group_models').create({ '_id': context.result.board_id+'_'+_id, board_id: context.result.board_id, 
                'group_model': response.data['group_model'], 'l2t': response.data['l2t'], 'dec': response.data['dec'], groups: Object.keys(cavs)
              })
            }
          })
        })


      //   Promise.all(to_remove).then(data=>{
      //     var _id = res2[0].higher_group
      //     // console.log('id of high', _id)
      //     context.app.service('group_models').find({query:{_id:_id}})
      //     .then((res_fin)=>{
      //       if(res_fin.length==0){
      //         context.app.service('group_models').create({ '_id': _id, board_id: context.result.board_id, 
      //           'group_model': response.data['group_model'], 'l2t': response.data['l2t'], 'dec': response.data['dec'], groups: Object.keys(cavs)
      //         })
      //       }
      //     })
          
      //   }).catch(function(err){
      //     console.log('err')
      //   })
      })
      
      
    })

    context.app.service('batch').create({calls: promise_patches})
    .then(()=>{
      console.log('all', board_id)

      sliderImpact(board_id, context)
    })
    // Promise.all(promises).then(data=>{
    //   console.log('all', board_id)

    //   sliderImpact(board_id, context)
    // }).catch(function(err){
    //   console.log('err')
    // })
  }, (error)=>{
    console.log('error')
    
  })

}

function averageStyles2(styles, context){
  axios.post(context.app.get('ml_server')+'trainStyleCAV', {
    styles: JSON.stringify(styles)
  }).then((response)=>{
    console.log('response')
    var avg_styles = JSON.parse(response.data['styles'])
    for(var i in avg_styles){
      context.app.service('group_styles').find({query : {group_id: i}})
      .then((res)=>{
        if(res.length>0){
          context.app.service('group_styles').patch(res._id, {$set: {style: avg_styles[i]}})
        }else{
          context.app.service('group_styles').create({style: avg_styles[i], group_id: i})
        }
      })
    }
  }, (error)=>{
    console.log('error')
  })
}

function averageStyles(styles, context){
  var avg_styles = {}
  // var start = new Date().getTime();
    for(var i in styles){
      avg_styles[i] = {}
      for(var dim_key in styles[i][0]){
        console.log('fail?')
        var l = []
        for(var n1=0; n1<styles[i][0][dim_key].length; n1++){
          l.push([])
          for(var n2=0; n2<styles[i][0][dim_key][0].length; n2++){
            l[n1].push([])
            for(var n3=0; n3<styles[i][0][dim_key][0][0].length; n3++){
              l[n1][n2].push([])
              for(var n4=0; n4<styles[i][0][dim_key][0][0][0].length; n4++){
                //
                var sum = 0
                for(var k in styles[i]){
                  sum = sum + styles[i][k][dim_key][n1][n2][n3][n4]
                }
                l[n1][n2][n3].push(sum/styles[i].length)
              }
            }
          }
        }
        avg_styles[i][dim_key]=l
        // console.log(l)
      }
    }
    // console.log('ttttime.....', new Date().getTime()-start)
    for(var i in avg_styles){
      context.app.service('group_styles').find({query: {group_id: i}})
      .then((res)=>{
        if(res.length>0){
          // console.log('printed are', i, res[0]._id, res[0].group_id)
          if(res[0].group_id==i){
            context.app.service('group_styles').patch(res[0]._id, {$set: {style: avg_styles[i]}})
          }
        }else{
          context.app.service('group_styles').create({style: avg_styles[i], group_id: i})
        }
      })
      
    }

}

const createTrainCAV = async context => {
  console.log('art ids are ')
  // console.log(context.result)
  context.app.service('event_logs').create({event: 'create_concept', board_id: context.result.board_id, user_id: context.params.user._id})
  // context.app.service('boards').patch(context.result.board_id, {$set:{group_updating: true, updated:'group_updating'}})
  // .then(()=>{
    context.app.service('arts').find({query: {_id: {$in:context.arguments[0].art_ids}}})
    .then((res)=>{
      // console.log('length is ', res.length,',', context.result._id)
      var embeddings = {}
      // var styles = {}

      embeddings[context.result._id] = []
      // styles[context.result._id] = []
      for(var i in res){
        // console.log(res[i]._id)
        if(res[i].embedding!=undefined){
          embeddings[context.result._id].push(res[i].embedding)
        }
      }
      // console.log(embeddings)

      trainCAV(embeddings, context, res[0].board_id, context.result._id)
      // averageStyles(style)
    })

    context.app.service('art_styles').find({query: {art_id:{$in: context.arguments[0].art_ids}}})
    .then((res2)=>{
      var styles = {}
      styles[context.result._id] = []
      for(var j in res2){
        if(res2[j].style!=undefined){
          styles[context.result._id].push(res2[j].style)
        }  
      }
      averageStyles(styles, context)
    })
  // })
  
  // context.app.service('boards').find({query: {_id: context.arguments[0].board_id}})
  // .then((res)=>{
  //   var search_slider_values = res[0].search_slider_values
  //   search_slider_values[context.result._id] = 0
  //   context.app.service('boards').patch(res[0]._id, {$set:{search_slider_values: search_slider_values, updated: 'moodboard_search_slider_change'}})
  // })

  return context
}

const RelateCAV = async context => {
  // console.log('relate')
  // console.log('relate~~', context)
  if(context.result.updated=='groups_relate_r'){
    // console.log('relate 2')
    // console.log(context.result.higher_group)
    // context.app.service('boards').patch(context.result.board_id, {$set:{group_updating: true, updated:'group_updating'}})
    // .then((res)=>{
      // console.log(context.result.board_id, context.params.user._id)
      context.app.service('event_logs').create({event: 'relate_concept', board_id: context.result.board_id, user_id: context.params.user._id})
      context.app.service('groups').find({query: {higher_group: context.result.higher_group}})
      .then((res)=>{
        var art_ids = []
        var embeddings = {}
        var styles = {}
        for(var i in res){
          var group = res[i]
          art_ids = art_ids.concat(group.art_ids)
        }
        context.app.service('arts').find({query:{_id:{$in:art_ids}}})
        .then((res2)=>{
          var art_embeddings = {}
          for(var j in res2){
            art_embeddings[res2[j]._id] = res2[j].embedding
          }
          for(var i in res){
            var group = res[i]
            embeddings[group._id] = []
            for(var j in group.art_ids){
              var art_id = group.art_ids[j]
              // console.log(art_id, 'fourth')
              embeddings[group._id].push(art_embeddings[art_id])
            }
          }

          // console.log(embeddings, 'embeddings')
          trainCAV(embeddings, context, res[0].board_id)
        })

        // context.app.service('art_styles').find({query: {art_id:{$in: art_ids}}})
        // .then((res3)=>{
        //   var art_styles = {}
        //   for(var j in res3){
        //     art_styles[res3[j].art_id] = res3[j].style
        //   }
        //   for(var i in res){
        //     var group = res[i]
        //     styles[group._id] = []
        //     for(var j in group.art_ids){
        //       var art_id = group.art_ids[j]
        //       styles[group._id].push(art_styles[art_id])
        //     }
        //   }
        //   averageStyles(styles, context)
        // })
        
      })
    // })
    

    
  }
}

const UnrelateCAV = async context => {

  // console.log(context.arguments[1], 'unrelate')
  if(context.arguments[1]['$set'].updated=='groups_relate_u'){
    // console.log(context)
   
    
    context.app.service('groups').find({query:{_id: context.arguments[0]}})
    .then((res)=>{
      context.app.service('event_logs').create({event: 'unrelate_concept', board_id: res[0].board_id, user_id: context.params.user._id})
      // context.app.service('boards').patch(res[0].board_id, {$set:{group_updating: true, updated:'group_updating'}})
      // .then(()=>{
        context.app.service('groups').find({query: {higher_group: res[0].higher_group}})
        .then((res2)=>{
          // console.log(res2.length)
          var art_ids = []
          
          for(var i in res2){
            var group = res2[i]
            art_ids = art_ids.concat(group.art_ids)
          }
          context.app.service('arts').find({query:{_id:{$in:art_ids}}})
          .then((res3)=>{
            var art_embeddings = {}
            for(var j in res3){
              art_embeddings[res3[j]._id] = res3[j].embedding
            }
            var embeddings = {}
            var embeddings2 = {}
            for(var i in res2){
              var group = res2[i]
              if(group._id != context.arguments[0]){
                embeddings[group._id] = []
                for(var j in group.art_ids){
                  var art_id = group.art_ids[j]
                  embeddings[group._id].push(art_embeddings[art_id])

                }
              }else{
                embeddings2[group._id] = []
                for(var j in group.art_ids){
                  var art_id = group.art_ids[j]
                  embeddings2[group._id].push(art_embeddings[art_id])

                }
              }
              
            }
            Promise.all([trainCAV(embeddings, context, res[0].board_id),
            trainCAV(embeddings2, context, res[0].board_id)])
            

          })

          // context.app.service('art_styles').find({query: {art_id:{$in: art_ids}}})
          // .then((res4)=>{
          //   var art_styles = {}
          //   for(var j in res4){
          //     art_styles[res4[j].art_id] = res4[j].style
          //   }
          //   for(var i in res2){
          //     var styles = {}
          //     var group = res2[i]
          //     if(group._id!=context.arguments[0]){
          //       styles[group._id] = []
          //       for(var j in group.art_ids){
          //         var art_id = group.art_ids[j]
          //         styles[group._id].push(art_styles[art_id])
          //       }
          //       averageStyles(styles, context)
          //     }
          //   }
            
          // })
        })
      })
      // console.log(res[0].higher_group)
      
    // })

      
      
  }
}

const AddRemoveArtCAV = async context => {
  // console.log('add remove')
  if(context.result.updated=='groups_add' || context.result.updated=='groups_remove'){
    // context.app.service('boards').patch(context.result.board_id, {$set:{group_updating: true, updated:'group_updating'}})
    // .then((res)=>{
      if(context.result.updated=='groups_add'){
        context.app.service('event_logs').create({event: 'concept_add', board_id: context.result.board_id, user_id: context.params.user._id})
      }else if(context.result.updated=='groups_remove'){
        context.app.service('event_logs').create({event: 'concept_remove', board_id: context.result.board_id, user_id: context.params.user._id})
      }
      context.app.service('groups').find({query: {higher_group: context.result.higher_group}})
      .then((res)=>{
        var art_ids = []
        var embeddings = {}
        var styles = {}
        for(var i in res){
          var group = res[i]
          art_ids = art_ids.concat(group.art_ids)
        }
        context.app.service('arts').find({query:{_id:{$in:art_ids}}})
        .then((res2)=>{
          var art_embeddings = {}
          for(var j in res2){
            art_embeddings[res2[j]._id] = res2[j].embedding
          }
          // console.log('arts',Object.keys(art_embeddings))
          for(var i in res){
            var group = res[i]
            embeddings[group._id] = []
            for(var j in group.art_ids){
              var art_id = group.art_ids[j]
              embeddings[group._id].push(art_embeddings[art_id])
            }
          }
          // console.log(embeddings, 'embeddings')
          trainCAV(embeddings, context, res[0].board_id)
        })

        context.app.service('art_styles').find({query: {art_id:{$in: art_ids}}})
        .then((res3)=>{
          var art_styles = {}
          for(var j in res3){
            art_styles[res3[j].art_id] = res3[j].style
          }
          for(var i in res){
            var group = res[i]
            styles[group._id] = []
            for(var j in group.art_ids){
              var art_id = group.art_ids[j]
              styles[group._id].push(art_styles[art_id])
            }
          }
          averageStyles(styles, context)
        })
      })
    // })
    
  } 
}

const RemoveGroupCAV = async context => {
  console.log('remove group')
  context.app.service('groups').find({query:{_id: context.arguments[0]}})
  .then((res)=>{
    // console.log(res[0])
    context.app.service('event_logs').create({event: 'remove_concept', board_id: res[0].board_id, user_id: context.params.user._id})
    context.app.service('boards').find({query: {_id: res[0].board_id}})
    .then((res_board)=>{
      var labels = JSON.parse(JSON.stringify(res_board[0].labels))
      for(var key in labels){
        if(labels[key][context.arguments[0]]!=undefined){
          delete labels[key][context.arguments[0]]
        }
      }
      context.app.service('boards').patch(res_board[0]._id, {$set:{updated:'labelAllImages', labels: labels}})
      .then(()=>{
          context.app.service('groups').find({query: {higher_group: res[0].higher_group}})
      .then((res2)=>{
        // context.app.service('boards').patch(res[0].board_id, {$set:{group_updating: true, updated:'group_updating'}})
        // .then(()=>{
          // console.log(res2.length)
          var art_ids = []

          if(res2.length==1){
            context.app.service('group_models').find({query:{_id: res[0].board_id+'_'+res[0].higher_group}})
            .then((res_gm)=>{
              if(res_gm.length>0){
                context.app.service('group_models').remove(res[0].board_id+'_'+res[0].higher_group)
              }
            })
            
          }
          
          for(var i in res2){
            var group = res2[i]
            if(group._id!=context.arguments[0]){
              art_ids = art_ids.concat(group.art_ids)
            }
            
          }

          context.app.service('arts').find({query:{board_id: res[0].board_id}})
          .then((res_arts)=>{
            // var promises = []
            var batch = []
            for(var k in res_arts){
              if(res_arts[k].labels!=undefined){
                var labels = JSON.parse(JSON.stringify(res_arts[k].labels))
                // console.log(labels, context.arguments[0])
                if(labels[context.arguments[0]]!=undefined){
                  var unset = {}
                  var set = {}
                  unset['labels.'+context.arguments[0]] =1
                  set['updated'] = 'arts_label'
                  // promises.push(context.app.service('arts').patch(res_arts[k]._id, {$set:set, $unset: unset}))
                  batch.push(['patch', 'arts', res_arts[k]._id, {$set:set, $unset: unset}])
                }
                
              }
            }
            context.app.service('batch').create({calls:batch})
            .then(function(){
              context.app.service('boards').patch(res[0].board_id, {$set:{group_updating: false, updated:'group_updating'}})
            })
            

          })

          context.app.service('arts').find({query:{_id:{$in:art_ids}}})
          .then((res3)=>{
            var art_embeddings = {}
            for(var j in res3){
              art_embeddings[res3[j]._id] = res3[j].embedding
              // remove the group label from images
              
            }

            var embeddings = {}
            
            for(var i in res2){
              var group = res2[i]
              // console.log(group._id, context.arguments[0])
              if(group._id!=context.arguments[0]){
                // console.log('proce...')
                embeddings[group._id] = []
                for(var j in group.art_ids){
                  var art_id = group.art_ids[j]
                  // console.log(art_id, 'fourth')
                  embeddings[group._id].push(art_embeddings[art_id])
                }
                // console.log('resres000', res[0].board_id)
                
              }
              
            }
            console.log(Object.keys(embeddings))
            if(Object.keys(embeddings).length>0){
              console.log(Object.keys(embeddings).length, '??')
                trainCAV(embeddings, context, res[0].board_id)
            }
            
          })
        })
      })
    })

    
      
      

      // context.app.service('art_styles').find({query: {art_id:{$in: art_ids}}})
      // .then((res4)=>{
      //   var art_styles = {}
      //   for(var j in res4){
      //     art_styles[res4[j].art_id] = res4[j].style
      //   }
      //   for(var i in res2){
      //     var styles = {}
      //     var group = res2[i]
      //     if(group._id!=context.arguments[0]){
      //       styles[group._id] = []
      //       for(var j in group.art_ids){
      //         var art_id = group.art_ids[j]
      //         styles[group._id].push(art_styles[art_id])
      //       }
      //       averageStyles(styles, context)
      //     }
      //   }
        
      // })
    })
  // })
}

const groupStyleRemove = async context =>{
  context.app.service('group_styles').find({query: {group_id: context.arguments[0]}})
  .then((res)=>{
    for(var i in res){
      context.app.service('group_styles').remove(res[i]._id)
    }
  })
}

const revealDisagreement = async context => {
  if(context.result.updated == 'groups_reveal_disagreement'){
    // console.log(context.result.user_info)
    // console.log(context.result)
    var users = {}
    // context.app.service('arts').find({query: {_}})
    context.app.service('groups').find({query: {higher_group: context.result.higher_group}})
    .then((res1)=>{
      var art_ids = []
      for(var i in res1){
        for(var j in context.result.user_info){
          art_ids = art_ids.concat(res1[i].user_info[j].arts)
        }
      }

      context.app.service('arts').find({query: {_id:{$in: art_ids}}})
      .then((res2)=>{
        var art_cavs = {}
        var group_art_cavs = {}
        for(var k in res2){
          if(art_ids.indexOf(res2[k]._id)!=-1){
            art_cavs[res2[k]._id] = res2[k].embedding
            if(context.result.art_ids.indexOf(res2[k]._id)!=-1){
              group_art_cavs[res2[k]._id] = res2[k].embedding
            }
          }
        }
        for(var i in res1){
          var group_id = res1[i]._id
            for(var user in context.result.user_info){
              if(users[user]==undefined){
                users[user] = {}
              }
              if(users[user][group_id]==undefined){
                users[user][group_id] = []
              }
              var user_info_arts = res1[i].user_info[user].arts
              for(var l in user_info_arts){
                users[user][group_id].push(art_cavs[user_info_arts[l]])
              }
              
            
          }
        }

        // console.log('users', users)
        axios.post(context.app.get('ml_server')+'revealDisagreement', {
          users: JSON.stringify(users),
          group_id: context.result._id,
          group_arts: JSON.stringify(group_art_cavs),
        }).then((response)=>{
          // console.log('error-1?')
          var returned_images = JSON.parse(response.data['returned_images'])
          // console.log('error0?')
          context.app.service('disagreed_arts').find({query: {board_id: context.result.board_id}})
          .then((res0)=>{
            for(var i in res0){
              context.app.service('disagreed_arts').remove(res0[i]._id)
            }
            for(var i in returned_images){
              var disagreed_art = {
                image: returned_images[i].image_file,
                user_decisions: returned_images[i].user_decisions,
                board_id: context.result.board_id,
                order: i,
              }
              context.app.service('disagreed_arts').create(disagreed_art)
            }
          })
          // console.log('error1?')
          context.app.service('boards').patch(context.result.board_id, {$set: {
            agreementPane: true, 
            updated: 'moodboard_disagreement_search'
          }})
          // console.log('error2?')


        }, (error)=>{
          // console.log('error')
        })
      })
    })


    
  }
}

module.exports = {
    before: {
      all: [],
      find: [ ],
      get: [],
      create: [],
      update: [],
      patch: [UnrelateCAV],
      remove: [RemoveGroupCAV, groupStyleRemove]
    },
  
    after: {
      all: [],
      find: [],
      get: [],
      create: [createTrainCAV],
      update: [],
      patch: [RelateCAV, AddRemoveArtCAV, revealDisagreement],
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