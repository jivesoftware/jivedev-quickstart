// This is the top navigation template using the Handlebar.js library

// This is the navigation menu loaded before the async call to fetch an updated nav is called
const defaultMenu = {
    'main' : [
        {
            'label' : "JiveWorks: Developer",
            'href' : "https://community.jivesoftware.com/community/developer"
        },
        {
            'label' : "Common Dev Patterns",
            'href' : "https://community.jivesoftware.com/docs/DOC-110981"
        },
        {
            'label' : "Resources",
            'href' : "https://community.jivesoftware.com/docs/DOC-112271"
        },
        {
            'label' : "REST API Docs",
            'href' : "https://developers.jivesoftware.com/api/v3/cloud/rest/"
        },
        {
            'label' : "Jive Node SDK",
            'href' : "https://community.jivesoftware.com/docs/DOC-114053"
        }
    ]
}

// Fetch updated navigation from external source
const loadNavigation = () =>{
    const navigationURL = "https://developer.jivesoftware.com/DeveloperAssets/getting-started-nav.json"
    $('.main_nav').html(templatedNav(defaultMenu));
    adjustDimensions();
    // osapi.http.get({
    //     'href' : `${addonURL}`
    // }).execute((response) =>{
    //     if(response.status === 200){
    //         let navHTML = templatedNav(response.content);
    //         $('.main_nav').html(navHTML);
    //     } else{
    //         console.log(`Unable to get navigation JSON: ${JSON.stringify(response.error)}`);
    //     }
    //     adjustDimensions();
    // })
}

// The Handlebar template for the navigation menu
// Returns the HTML output after running the JSON through the template
const templatedNav = (menuJSON) =>{
    let source   = `<ul class="navigation"><li><a href="https://community.jivesoftware.com/community/developer"><img src="${addonURL}/images/developer_icon.png"></li>{{#each main}}<li><a href="{{this.href}}">{{this.label}}</a>{{#each submenu}}<ul><li><a href="{{this.href}}">{{this.label}}</a></li></ul>{{/each}}</li>{{/each}}</ul>`,
    template = Handlebars.compile(source);
    return template(menuJSON);
}