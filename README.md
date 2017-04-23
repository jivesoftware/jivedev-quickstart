# JiveDev QuickStart App

This is the official jivedev QuickStart app that is made available in the Jive Registry. It's current functionality includes generating Custom View Tile, Simple Stream Integration, and OAuth installable add-ons through the App's UI. It is expandable in functionality by editing the /apps/jivedev-quickstart/public/javascripts/main.js file to incorporate other integration types such as Apps.

## Navigation
The navigation is fetched from https://developer.jivesoftware.com/DeveloperAssets/getting-started-nav.json and follows the following example structure:
```json
{
    "main" : [
        {
            "label" : "JiveWorks: Developer",
            "href" : "https://community.jivesoftware.com/community/developer"
        },
        {
            "label" : "Resources",
            "href" : "https://community.jivesoftware.com/docs/DOC-112271",
            "submenu" : [
                {
                    "label" : "REST API Docs",
                    "href" : "https://developers.jivesoftware.com/api/v3/cloud/rest/"
                }       
            ]
        }
    ]
}
```

Written & maintained by: Rashed Talukder
