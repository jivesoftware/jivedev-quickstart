// This is the top navigation template using the template.js library

const defaultMenu = {
    'main' : [
        {
            'label' : "JiveWorks: Developer",
            'href' : "https://community.jivesoftware.com/community/developer",
        },
        {
            'label' : "Resources",
            'href' : "https://community.jivesoftware.com/docs/DOC-112271",
            'submenu' : [
                {
                    'label' : "REST API Docs",
                    'href' : "https://developers.jivesoftware.com/api/v3/cloud/rest/",
                }       
            ]
        }
    ]
}

const loadNavigation = () =>{
    const navigationURL = "https://www."
    $('.main_nav').html(templatedNav(defaultMenu));
    adjustDimensions();
    osapi.http.get({
        'href' : `${addonURL}`
    }).execute((response) =>{
        if(response.status === 200){
            let navHTML = templatedNav(response.content);
            $('.main_nav').html(navHTML);
        } else{
            console.log(`Unable to get navigation JSON: ${response.error}`);
        }
        adjustDimensions();
    })
}

const templatedNav = (menuJSON) =>{
    let source   = `<ul class="navigation"><li><a href="https://community.jivesoftware.com/community/developer"><img src="${addonURL}/developer_icon.png"></li>{{#each main}}<li><a href="{{this.href}}">{{this.label}}</a>{{#each submenu}}<ul><li><a href="{{this.href}}">{{this.label}}</a></li></ul>{{/each}}</li>{{/each}}</ul>`,
    template = Handlebars.compile(source);
    return template(menuJSON);
}