jive.tile.onOpen((config, options) =>{
    // Since this tile doesn't have a configuration page, the config and options objects are undefined
    let tileContext = new Context(config, options);    

    $('#jiveURL').append(tileContext.jiveURL);
    $('#addonURL').append(tileContext.appURL);

    // The Context class' viewer and container return promises since they make asyncronous calls
    // see Main.js
    tileContext.viewer.then((viewerObj) =>{
      $('#who_am_i').append(viewerObj.displayName);
    }).then(() =>{
        tileContext.container.then((containerObj) =>{
            $('#where_am_i').append(containerObj.name);
            gadgets.window.adjustHeight();
        })
    })

    // Make an OSAPI HTTP Get request 
    // These requests are made server-side
    // See https://community.jivesoftware.com/docs/DOC-185776#jive_content_id_OSAPI_API
    // for more information about the types of requests and signed
    $('#request_btn').click(() =>{
        let requestURL = $('#goToURL').val();
        if(requestURL !== undefined || requestURL !== ""){
            osapi.http.get({
                'href' : requestURL
            }).execute((response)=>{
                $('#http_results').html(response.content);
                gadgets.window.adjustHeight();
            })
        }
    })
})