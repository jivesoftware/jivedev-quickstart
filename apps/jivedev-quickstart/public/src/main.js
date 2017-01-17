/****************************************************
* Note:  This implmentation has been provided for convenience, developers are not required to use this pattern.
*
* SEE: Tile API & Development FAQ - https://community.jivesoftware.com/docs/DOC-185776
****************************************************/

class Context {
    constructor (config, options){
        // Config and Options objects may be undefined if there is no configuration page defined
        this.config = config;
        this.options = options;
        this.appURL = null;
        this.jiveURL = null;

        // Get the parent container info from Jive
        this.container = new Promise((resolve, reject) => {
            jive.tile.getContainer((container) =>{
                resolve(container)
            });
        });

        // Getting info about the current viewer/user
        this.viewer = new Promise((resolve, reject) =>{
            osapi.jive.corev3.people.getViewer().execute((viewer) =>{
                resolve(viewer);
            })
        })

        // Check if the GALA service is turned on and fetching App URL and Jive URL accordingly
        // See https://community.jivesoftware.com/community/developer/blog/2016/11/29/speedier-custom-view-tiles-with-gala
        if (gala && typeof gala === "object"){  
            this.appURL = jive.tile.getAppURL();  
            this.jiveURL = jive.tile.getJiveURL();
        } else{
            var matches = window.location.href.match(/.*?[?&]url=([^&]+)%2F.*$/);  
            if (matches.length === 2){  
                this.appURL = decodeURIComponent(matches[1]);
                this.jiveURL = substring(0, this.appURL.indexOf('/resources/add-ons'));
            }
        }
    }
}