const matches = window.location.href.match(/.*?[?&]url=([^&]+)%2F.*$/);
const addonURL = decodeURIComponent(matches[1]);
const jiveURL = addonURL.substring(0, addonURL.indexOf('/resources/add-ons'));

const checkJiveVersion = () =>{
    return new Promise((resolve, reject) =>{
        osapi.http.get({
                'href' : `${jiveURL}/api/version`
            }).execute((response) =>{
                if(response.status === 200){
                    if (typeof response.content !== "string"){
                        response.content = JSON.stringify(response.content);
                    }
                    let content = response.content.substring(response.content.indexOf('{'))
                    resolve(JSON.parse(content));
                } else{
                    reject(`Unable to get API version`);
                }
            })
    })
}

// adjusts window dimensions
const adjustDimensions = ()=>{
        gadgets.window.adjustHeight();
        gadgets.window.adjustWidth();
}

const displayBasedonAPIVersion = () =>{
    checkJiveVersion()
    .then((value) =>{
        let majorVersion = parseInt(value.jiveVersion.substring(0, value.jiveVersion.indexOf(".")));
        console.log(`Jive major version: ${majorVersion}`);
        if(majorVersion <= 8){
            $('#ssi_container').hide();
        }
        adjustDimensions();
    })
    .catch((error) =>{
        console.log(error);
    })
}

const init = () =>{
    loadNavigation();
    displayBasedonAPIVersion();
    $('.main_nav').css('background-image', `url('${addonURL}/images/background-nav@3x.png')`);

    $('#custom_view_link, #custom_view_title').click(function() {
        gadgets.views.requestNavigateTo("createmenu-action-tile");
    });

    $('#ssi_link, #ssi_title').click(function() {
        gadgets.views.requestNavigateTo("createmenu-action-stream");
    });

    $('#oauth_link, #oauth_title').click(function() {
        gadgets.views.requestNavigateTo("createmenu-action-oauth");
    });
}

gadgets.util.registerOnLoadHandler(init);
