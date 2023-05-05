module.exports = function(app) {
    if(typeof app.channel !== 'function') {
      // If no real-time functionality has been configured just return
      return;
    }
  
    app.on('connection', connection => {
      // On a new real-time connection, add it to the anonymous channel
      app.channel('anonymous').join(connection);
    });
  
    app.on('login', (authResult, { connection }) => {
      // connection can be undefined if there is no
      // real-time connection, e.g. when logging in via REST
    //   console.log('isthis?', connection.user._id)
      if(connection) {
        // Obtain the logged in user from the connection
        const user = connection.user;
        
        // The connection is no longer anonymous, remove it
        app.channel('anonymous').leave(connection);
  
        // Add it to the authenticated user channel
        app.channel('authenticated').join(connection);
  
        // Channels can be named anything and joined on any condition 
        
        // E.g. to send real-time events only to admins use
        // if(user.isAdmin) { app.channel('admins').join(connection); }
  
        // If the user has joined e.g. chat rooms
        // if(Array.isArray(user.rooms)) user.rooms.forEach(room => app.channel(`rooms/${room.id}`).join(channel));
        
        // Easily organize users by email and userid for things like messaging
        // app.channel(`emails/${user.email}`).join(channel);
        // app.channel(`a`).join(connection);
        app.channel(`userIds/${user._id}`).join(connection);
        if(user.board_id!=undefined){
          // console.log('to boards...', user.board_id)
          app.channel(`boards/${user.board_id}`).join(connection);
        } 
        

      }
    });
  
    // // eslint-disable-next-line no-unused-vars
    // app.publish((data, hook) => {
    //   // Here you can add event publishers to channels set up in `channels.js`
    //   // To publish only for a specific event use `app.publish(eventname, () => {})`
  
    //   console.log('Publishing all events to all authenticated users. See `channels.js` and https://docs.feathersjs.com/api/channels.html for more information.'); // eslint-disable-line
  
    //   // e.g. to publish all service events to all authenticated users use
    //   return app.channel('authenticated');
    // });
  

  
    // Here you can also add service specific event publishers
    // e.g. the publish the `users` service `created` event to the `admins` channel
    // app.service('users').publish('created', () => app.channel('admins'));
    
    // With the userid and email organization from above you can easily select involved users
    
    app.service('boards').publish((data, hook) => {
        // console.log('owner', data.owner)
        var data_to_return = {}
        // console.log(data.updated)
        console.log('getting...', data.updated)
        if(data.updated.indexOf('sketchpad_update_a_layer')!=-1){
          data_to_return['updated']=data.updated
          data_to_return['undoable'] = data.undoable
          data_to_return['layers']=[]
          for(var i in data.layers){
            if(data.layers[i].layer_id==data.updated.split('.')[1]){
              data_to_return['layers'].push(data.layers[i])
            }
          }
          // data_to_return['sketchundo'] = data.sketchundo[data.sketchundo.length-1]
           
        }else if(data.updated.indexOf('sketchpad_remove_a_layer')!=-1 || data.updated.indexOf('sketchpad_add_a_layer')!=-1 || data.updated.indexOf('sketchpad_reorder_layers')!=-1){
          data_to_return['updated']=data.updated
          data_to_return['layers']=data.layers
          data_to_return['undoable']=data.undoable
          // data_to_return['sketchundo'] = data.sketchundo[data.sketchundo.length-1]
          
        }else if(data.updated.indexOf('sketchpad_layers_choosen')!=-1){
          data_to_return['layers'] = []
          data_to_return['updated']=data.updated
          var list = data.updated.split('.')
          for(var i in list){
            if(i==0){continue}
            for(var j in data.layers){
              if(data.layers[j].layer_id==list[i]){
                data_to_return['layers'][j]={choosen_by:data.layers[j].choosen_by}
              }
            }
          }
        }else if(data.updated.indexOf('sketchpad_undo_update_a_layer')!=-1){
          data_to_return['updated']=data.updated
          data_to_return['layers'] = []
          data_to_return['sketchundo_send'] = data.sketchundo_send
          for(var i in data.layers){
            if(data.layers[i].layer_id==data.updated.split('.')[1]){
              data_to_return['layers'].push(data.layers[i])
            }
          }

        }else if(data.updated.indexOf('sketchpad_undo_add_a_layer')!=-1){
          data_to_return['updated']=data.updated
        }else if(data.updated.indexOf('sketchpad_undo_remove_a_layer')!=-1 || data.updated.indexOf('sketchpad_undo_reorder_a_layer')!=-1){
          data_to_return['updated']=data.updated
          data_to_return['layers']=data.layers
        }else if(data.updated.indexOf('moodboard_add_arts')!=-1){
          data_to_return['arts'] = {}
          data_to_return['updated']=data.updated
          var arts_list = data.updated.split('.')
          for(var i in arts_list){
            if(i==0){
              continue
            }
            var art_id = arts_list[i]
            data_to_return['arts'][art_id] = data.arts[art_id]
          }
        }else if(data.updated.indexOf('moodboard_add_texts')!=-1){
          data_to_return['texts'] = {}
          data_to_return['updated']=data.updated
          var texts_list = data.updated.split('.')
          for(var i in texts_list){
            if(i==0){
              continue
            }
            var text_id = texts_list[i]
            data_to_return['texts'][text_id] = data.texts[text_id]
          }
        }else if(data.updated.indexOf('moodboard_update_arts_texts')!=-1){
          
          data_to_return['updated'] = data.updated
          data_to_return['arts'] = {}
          data_to_return['texts']={}
          var arts_texts_list = data.updated.split('.')
          for(var i in arts_texts_list){
            if(i==0){
              continue
            }
            if(arts_texts_list[i].indexOf('art_')!=-1){
              var _id = arts_texts_list[i].split('_')[1]
              data_to_return['arts'][_id] = {
                position: data.arts[_id].position,
                choosen_by: data.arts[_id].choosen_by,
              }
            }else if(arts_texts_list[i].indexOf('text_')!=-1){
              var _id = arts_texts_list[i].split('_')[1]
              data_to_return['texts'][_id] = {
                position: data.texts[_id].position,
                fontsize: data.texts[_id].fontsize,
                text: data.texts[_id].text,
                choosen_by: data.texts[_id].choosen_by,
              }
            }
          }
          
        }else if(data.updated.indexOf('moodboard_remove_arts_texts')!=-1){
          data_to_return['updated'] = data.updated
          data_to_return['arts'] = {}
          data_to_return['texts']={}
          for(var key in data.arts){
            data_to_return.arts[key]=1
          }
          for(var key in data.texts){
            data_to_return.texts[key]=1
          }
        }else if(data.updated.indexOf('moodboard_edit_text')!=-1){
          data_to_return['updated'] = data.updated
          data_to_return['texts'] = {}
          data_to_return['texts'][data.updated.split('.')[1]] = data.texts[data.updated.split('.')[1]]

        }else if(data.updated.indexOf('moodboard_arts_texts_choosen')!=-1){
          console.log('here')
          data_to_return['updated'] = data.updated
          data_to_return['arts'] = {}
          data_to_return['texts']={}
          var arts_texts_list = data.updated.split('.')
          for(var i in arts_texts_list){
            if(i==0){
              continue
            }
            if(arts_texts_list[i].indexOf('art_')!=-1){
              var _id = arts_texts_list[i].split('_')[1]
              // console.log(data.arts[_id])
              data_to_return['arts'][_id] = {
                choosen_by: data.arts[_id]['choosen_by']
              }
            }else if(arts_texts_list[i].indexOf('text_')!=-1){
              var _id = arts_texts_list[i].split('_')[1]
              data_to_return['texts'][_id] = {
                choosen_by: data.texts[_id]['choosen_by']
              }
            }
          }
          // console.log(data_to_return)
        }else if(data.updated.indexOf('current_collaborators_sketch_pos')!=-1){
          data_to_return['updated'] = data.updated

          data_to_return['pos'] = data.current_collaborators[data.updated.split('.')[1]].sketch_pos
        
        }else if(data.updated.indexOf('current_collaborators_moodboard_pos')!=-1){
          data_to_return['updated'] = data.updated
          console.log(data.current_collaborators[data.updated.split('.')[1]].moodboard_pos)
          data_to_return['pos'] = data.current_collaborators[data.updated.split('.')[1]].moodboard_pos
        
        }else if(data.updated=='sketchpad_undoupdate'){
          data_to_return['updated']=data.updated
        }else if(data.updated=='moodboard_search_pane_toggle'){
          data_to_return['updated']=data.updated
          data_to_return['searchPane']=data.searchPane
        }else if(data.updated=='moodboard_search_image_select'){
          data_to_return['updated']=data.updated
          data_to_return['search_image_selected'] = data.search_image_selected
        }else if(data.updated=='moodboard_search_slider_change'){
          data_to_return['updated'] = data.updated
          data_to_return['search_slider_values'] = data.search_slider_values
        }else if(data.updated=='moodboard_search_images'){
          data_to_return['updated'] = data.updated
          data_to_return['searching']=data.searching
        }else if(data.updated=='moodboard_search_similar_images'){
          data_to_return['updated'] = data.updated
          data_to_return['searching']=data.searching
        }else if(data.updated=='moodboard_search_random_images'){
          data_to_return['updated'] = data.updated
          data_to_return['searching']=data.searching
        }else if (data.updated=='moodboard_generate_image'){
          data_to_return['updated'] = data.updated
          data_to_return['searching']=data.searching
        }else if(data.updated=='moodboard_search_done'){
          data_to_return['updated'] = data.updated
          data_to_return['searching']=data.searching
        }else if(data.updated=='moodboard_search_slider_distances'){
          data_to_return['updated'] = data.updated
          data_to_return['search_slider_distances'] = data.search_slider_distances
          data_to_return['search_slider_values'] = data.search_slider_values
          data_to_return['generate_slider_values'] = data.generate_slider_values
        }else if(data.updated=='moodboard_search_mode_toggle'){
          data_to_return['updated']=data.updated
          data_to_return['searchMode']=data.searchMode
        }else if(data.updated=='moodboard_generate_slider_change'){
          data_to_return['updated'] = data.updated
          data_to_return['generate_slider_values'] = data.generate_slider_values
        }else if(data.updated=='sketchpad_style_apply'){
          data_to_return['updated'] = data.updated
        }else if(data.updated=='moodboard_disagreement_search'){
          data_to_return['updated'] = data.updated
          data_to_return['agreementPane']=data.agreementPane
          data_to_return['agreement_userSelection']=data.agreement_userSelection
        }else if(data.updated=='moodboard_disagreement_user_selection'){
          data_to_return['updated'] = data.updated
          data_to_return['agreement_userSelection']=data.agreement_userSelection
        }else if(data.updated=='group_updating'){
          data_to_return['updated'] = data.updated
          data_to_return['group_updating'] = data.group_updating
        }else if(data.updated=='sketch_undoable'){
          data_to_return['sketchundo']=data.sketchpad_undoable
          data_to_return['updated']=data.updated
          data_to_return['undoable']=data.undoable
        }else if(data.updated.indexOf('sketchpad_undo_start')!=-1){
          data_to_return['updated']=data.updated
          data_to_return['undoable']=data.undoable
        }else if(data.updated=='labelAllImages'){
          data_to_return['updated']=data.updated
          data_to_return['labels']=data.labels
        }else if(data.updated=='artlabelremoval'){
          return
        }else if(data.updated=='moodboard_search_scroll'){
          data_to_return['updated']=data.updated
          data_to_return['search_scroll'] = data.search_scroll
          return [app.channel(`boards/${data._id}`).filter(connection=>connection.user._id!==hook.params.user._id).send(data_to_return)]
        }else{
          data_to_return = data
          
        }
        // console.log(data_to_return)
        var return_list = [app.channel(`userIds/${data.owner}`).send(data_to_return)]
        // console.log('collaborators', data.collaborators)
        for(var i in data.collaborators){
            // console.log(data.collaborators[i])
            return_list.push(app.channel(`userIds/${data.collaborators[i]}`).send(data_to_return))
        }
        // console.log(return_list)
      return return_list;
    });

    app.service('layers').publish((data, hook)=>{
      
      var data_to_return = {}
      data_to_return.updated = data.updated
      // console.log(data)
      if(data.updated!=undefined){
        if(data.updated.indexOf('sketchpad_layers_choosen')!=-1){
          data_to_return._id = data._id
          data_to_return.choosen_by = data.choosen_by
          data_to_return.board_id = data.board_id
        }else if(data.updated.indexOf('sketchpad_add_a_layer')!=-1){
          data_to_return = data
          if(data.updated=='sketchpad_add_a_layer_style'){
            return [app.channel(`boards/${data.board_id}`).send(data_to_return)]
          }
        }else if(data.updated=='sketchpad_layer_hide'){
          data_to_return._id = data._id
          data_to_return.hide = data.hide
        }else if(data.updated=='sketchpad_update_a_layer'){
          // console.log(data)
          // data_to_return = data

        }else if(data.updated=='sketchpad_efficiently_update_a_layer'){
          // console.log(data.diff)
          data_to_return.diff = data.diff
          data_to_return.diff_x = data.diff_x
          data_to_return.diff_y = data.diff_y
          data_to_return.updated = data.updated
          data_to_return._id = data._id
          data_to_return.choosen_by = data.choosen_by
          data_to_return.board_id = data.board_id
          return [app.channel(`boards/${data.board_id}`).send(data_to_return)]
        }else{
          // console.log('layer1')
          
          data_to_return = data
          return [app.channel(`boards/${data.board_id}`).send(data_to_return)]
        }
      }else{
        // console.log('layer2')
        data_to_return = data
        return [app.channel(`boards/${data.board_id}`).send(data_to_return)]
      }
      
      // console.log(data.board_id)


      return [app.channel(`boards/${data.board_id}`).filter(connection=>connection.user._id!==hook.params.user._id).send(data_to_return)]

    
      
      
    })

    app.service('arts').publish((data, hook)=>{
      
      var data_to_return = {}
      data_to_return.updated = data.updated
      if(data.updated.indexOf('moodboard_remove_arts_texts')!=-1){
        data_to_return._id = data._id
      }else if(data.updated.indexOf('moodboard_update_arts_texts')!=-1){
        data_to_return._id = data._id
        data_to_return.position = data.position
        data_to_return.choosen_by = data.choosen_by
        data_to_return.enabled=data.enabled
      }else if(data.updated .indexOf('moodboard_arts_texts_choosen')!=-1){
        data_to_return._id = data._id
        data_to_return.choosen_by = data.choosen_by
        data_to_return.enabled=data.enabled
      }else if(data.updated=='moodboard_color_swatch_change'){
        data_to_return._id = data._id
        data_to_return.color=data.color
        data_to_return.file = data.file
      }else if(data.updated=='moodboard_update_arts_embedding'){
        data_to_return._id = data._id
        data_to_return.enabled = data.enabled
        return [app.channel(`boards/${data.board_id}`).send(data_to_return)]
      }else if(data.updated=='arts_label'){
        data_to_return._id = data._id
        data_to_return.labels = data.labels
        return [app.channel(`boards/${data.board_id}`).send(data_to_return)]
      }else{
        console.log('arts created?')
        data_to_return = JSON.parse(JSON.stringify(data))
        delete data_to_return['embedding']
        delete data_to_return['style']
      }
        
      
      // console.log(data.board_id)


      return [app.channel(`boards/${data.board_id}`).filter(connection=>connection.user._id!==hook.params.user._id).send(data_to_return)]

    
      
      
    })

    app.service('groups').publish((data, hook)=>{
      
      var data_to_return = {}
      data_to_return.updated = data.updated
      if(data.updated!=undefined){
        if(data.updated=='moodboard_group_cav_update'){
          return 
        }else if(data.updated.indexOf('groups_position')!=-1){
          data_to_return._id = data._id
          data_to_return.board_id = data.board_id
          data_to_return.pos = data.pos
          
        }else if(data.updated.indexOf('groups_add')!=-1 || data.updated.indexOf('groups_remove')!=-1){
          data_to_return._id = data._id
          data_to_return.board_id = data.board_id
          data_to_return.pos = data.pos
          data_to_return.art_ids = data.art_ids
          data_to_return.user_info = data.user_info
        }else if(data.updated.indexOf('groups_relate')!=-1){
          data_to_return._id = data._id
          data_to_return.board_id = data.board_id
          data_to_return.higher_group = data.higher_group
        }else if(data.updated.indexOf('groups_toggle_inclusion')!=-1){
          data_to_return._id = data._id
          data_to_return.board_id = data.board_id
          data_to_return.user_info= data.user_info
        }else if(data.updated.indexOf('groups_reveal_disagreement')!=-1){
          data_to_return = JSON.parse(JSON.stringify(data))
          delete data_to_return['cav']
          delete data_to_return['avg_style']
        }else{
          data_to_return = JSON.parse(JSON.stringify(data))
          delete data_to_return['cav']
          delete data_to_return['avg_style']
        }
      }else{
        data_to_return = JSON.parse(JSON.stringify(data))
        delete data_to_return['cav']
        delete data_to_return['avg_style']
      }  
      
      // console.log(data.board_id)
      return [app.channel(`boards/${data.board_id}`).filter(connection=>connection.user._id!==hook.params.user._id).send(data_to_return)]
      // return [app.channel(`boards/${data.board_id}`).send(data_to_return)]
      
    })

    app.service('searched_arts').publish((data)=>{

      return [app.channel(`boards/${data.board_id}`).send(data)]
      
    })

    // app.service('disagreed_arts').publish((data)=>{

    //   return [app.channel(`boards/${data.board_id}`).send(data)]
      
    // })
  };


  