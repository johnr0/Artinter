var axios =require('axios')
var ml_server = require('../../config')

const labelAllImages = async context => {
    // console.log(context.arguments[0].group_model)
    var group_model = [context.arguments[0].group_model]
    var l2t = [context.arguments[0].l2t]
    var dec = [context.arguments[0].dec]

    var images = {}
    var searched_images = {}
    // console.log(':P', context.arguments[0].board_id)
    context.app.service('arts').find({query: {board_id: context.arguments[0].board_id}})
    .then((res)=>{
        for(var i in res){
            // console.log(res[i].embedding)
            if(res[i].embedding!=undefined){
                images[res[i]._id]=res[i].embedding
            }
        }
        // context.app.service("searched_arts").find({query:{board_id: context.arguments[0].board_id}})
        // .then((res)=>{

        // })
        // console.log(':Pdouble')
        axios.post(context.app.get('ml_server')+'labelImages', {
            images: JSON.stringify(images),
            group_model: JSON.stringify(group_model),
            l2t: JSON.stringify(l2t),
            dec: JSON.stringify(dec),
        }).then((response)=>{
            // promises = []
            context.app.service('boards').find({query: {_id: context.arguments[0].board_id}})
            .then((res_board)=>{
                var board = res_board[0]
                var cur_label = board.labels
                if(cur_label==undefined){
                    cur_label = {}
                  }
                var label_result = JSON.parse(response.data['result'])
                for(var key in label_result){
                    for(var j in l2t[0]){
                        if(l2t[0][j]!='_random'){
                            if(label_result[key][l2t[0][j]]==undefined){
                                label_result[key][l2t[0][j]] = 0
                            }
                            
                        }
                    }
                    
                    // var set = {}
                    for(key2 in label_result[key]){
                        if(cur_label[key]==undefined){
                            cur_label[key]={}
                        }
                        cur_label[key][key2] = label_result[key][key2]
                        // set['labels.'+key2] = label_result[key][key2]
                    }
                    // set['updated'] = 'arts_label'
                    // batch.push(['patch', 'arts', key, {$set:set}])
                    
                }
                console.log(label_result, 'label_result')
                console.log('search done', context.arguments[0].board_id,)
                context.app.service('boards').patch(context.arguments[0].board_id, {$set:{labels: cur_label, updated:'labelAllImages'}})
            })
            
            
            // batch.push(['patch', 'boards', context.arguments[0].board_id, {$set:{group_updating: false, updated:'group_updating'}}])
            // context.app.service('boards').patch(context.arguments[0].board_id, {$set:{group_updating: false, updated:'group_updating'}})
            // .then(()=>{
            // context.app.service('batch').create({calls: batch})
            // })
            // context.app.service('batch').create({calls: batch})
            // .then(()=>{
            //     context.app.service('boards').patch(context.arguments[0].board_id, {$set:{group_updating: false, updated:'group_updating'}})
            // }, (err)=>{
            //     console.log(err)
            // })
            // Promise.all(promises)
            // .then(function(){
            //     context.app.service('boards').patch(context.arguments[0].board_id, {$set:{group_updating: false, updated:'group_updating'}})
            // })
        })
    })


}

module.exports = {
    before: {
      all: [],
      find: [ ],
      get: [],
      create: [labelAllImages],
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