// TO DO: Add in Jive App capability
// If adding a new integration types, check/modify the asyncFileGetter and addDefinition functions

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const matches = window.location.href.match(/.*?[?&]url=([^&]+)%2F.*$/);  
const addonURL = decodeURIComponent(matches[1]);

// These files are universal to all addons that are packaged
const commonFiles = ["meta.json", "data/eula.html", "i18n/en.properties", "i18n/root.properties"];
// This variable holds any files that are specific to the integration type and others specified
let additionalFiles = [];

// This function puts the definition.json together for the integration type
// Returns an object with the filename as the key and the file contents as value
const addDefinition = (integType) =>{
    const common = {
        "integrationUser": {
            "systemAdmin": false
        }
    };

    let additional = {};

    if(integType === "stream"){
        additional = {
            "tiles": 
            [
                {
                    "displayName": "$$$DISPLAY_NAME$$$",
                    "name": "$$$INTERNAL_NAME$$$",
                    "description": "$$$DESCRIPTION$$$",
                    "style": "ACTIVITY",
                    "icons": {
                        "16": "extension-16.png",
                        "48": "extension-48.png",
                        "128" : "extension-128.png"
                    },
                    "config": "/public/configuration.html?features=jq-1.11,core-v3,tile",
                    "transform": {
                        "script": "xform.js"
                    },
                    "pageTypes": [
                        "PLACE",
                        "MOBILE",
                        "NEWS"
                    ],
                    "categories": [
                        "other"
                    ],
                    "displayWidth": "ALL",
                    "i18n": "*"
                }
            ]
        }
    } else if(integType === "tile"){
        additional = {
            "tiles": 
            [{
                "displayName": "$$$DISPLAY_NAME$$$",
                "name": "$$$INTERNAL_NAME$$$",
                "description": "$$$DESCRIPTION$$$",
                "style": "CUSTOM_VIEW",
                "displayWidth": "ALL",
                "pageTypes": [
                    "PLACE",
                    "USER",
                    "NEWS"
                ],
                "icons": {
                    "16": "extension-16.png",
                    "48": "extension-48.png",
                    "128": "extension-128.png"
                },
                "view": "/public/tiles/$$$INTERNAL_NAME$$$/view.html?features=responsive,tile,core-v3"
            }]
        }
    } else if(integType === "oauth"){
        additional = {};
    } else if(integType === "app") {
        additional = {
            "osapps": [
                {
                    "id": "$$$EXTENSION_UUID$$$",
                    "name": "$$$INTERNAL_NAME$$$",
                    "appPath": "$$$INTERNAL_NAME$$$",
                    "url": "%serviceURL%/osapp/$$$INTERNAL_NAME$$$/app.xml"
                }
            ]
        }
    }
    
    Object.assign(common, additional);
    let definition = JSON.stringify(common, null, 4);
    return { 'definition.json' : definition };
}

// This function puts together the files needed for the integration into additionalFiles
// Calls getSourceFile() with the files specified in commonFiles and additionalFiles
// Calls are non-sequential blocking for fastest loading
// Returns a promise once all the promises (OSAPI HTTP Get requests) are resolved
const asyncFileGetter = (type, name, description )=>{
    let promises = [];

    if (type === "stream"){
        additionalFiles.push(`public/configuration.html`);
        additionalFiles.push(`public/common.js`);
        additionalFiles.push(`public/config-adaptor.js`);
        additionalFiles.push(`public/diagnostics.js`);
        additionalFiles.push(`public/main.js`);
        additionalFiles.push(`public/style-ssi.css`);
        additionalFiles.push(`public/jive-ee.css`);
    } else if (type === "tile"){
        additionalFiles.push(`public/tiles/${name}/javascripts/main.js`);
    } else if (type === "oauth"){
    } else if (type === "app"){
        additionalFiles[`public/apps/${name}/app.xml`] = "app.xml";
    } else {
        promises.commonFiles.push(new Promise((resolve, reject) =>{
            reject("Invalid integrationType selected in JS")
        }));
    };

    commonFiles.forEach((value, index) =>{
        promises.push(getSourceFile(value, name));
    })

    additionalFiles.forEach((value, index) =>{
        promises.push(getSourceFile(value, name));
    })

    return Promise.all(promises).then((fetchedFiles) =>{
        return fetchedFiles;
    })
};

// Performs a OSAPI HTTP GET for each file needed for the packaged
// Should have all files located in the /src directory
// Returns a promise
const getSourceFile = (filePath, addonName) =>{
    return new Promise((resolve, reject) =>{
        if ( filePath && typeof filePath === 'string') {
            const sourceFilePath = filePath.replace(`${addonName}/`, "");
            osapi.http.get({
                'href' : `${addonURL}/src/${sourceFilePath}`
            }).execute((response) =>{
                if(response.status === 200){
                    let obj = {};
                    obj[filePath] = response.content;
                    resolve(obj);
                } else{
                    reject(`Unable to get file ${sourceFilePath}`);
                }
            })
        } else {
            reject(`No file being requested or path to file not a string.\nFilepath ${filePath}`);
        }
    })
}

// Any files in the page's form that needs to be included
// Uses the 'data-path' attribute in the HTML element
const getCustomFiles = (addonName) =>{
    let customFiles = {};
    for(let i=0; i <= 4; i++){
        if($(`#custom_${i}`).length){
            let path = $(`#custom_${i}`).attr('data-path');
            if (path && typeof path === 'string'){
                path = path.replace(/\$\$\$INTERNAL_NAME\$\$\$/g, addonName);
                customFiles[path] = $(`#custom_${i}`).val();
            }
        }
    }
    return customFiles;
}

// Any custom parameters that need to be replaced in the code
// Finds the 'data-param' attribute in the HTML element
// Will look for the attribute value as the string to replace
// e.g. "$$$REDIRECT_URL$$$"
const getCustomParams = (files) =>{
    for(let i=0; i <= 4; i++){
        if($(`#custom_${i}`).length){
            let param = $(`#custom_${i}`).attr('data-param');
            let value = $(`#custom_${i}`).val();
            if (param && typeof param === 'string'){
                return processParams(files, param, value);
            }
        }
    }
    return files;
}

// Takes the custom parameters and replaces the strings with the values specified in the form field
const processParams = (_src, strToReplace, replacementValue) =>{
    _src.forEach((obj, index) =>{
        traverse(obj, (key,value,object) =>{
            if ( value && typeof value === 'string') {
                value = value.replace(strToReplace, replacementValue);
                object[key] = value;
            }
        })
    })
    return _src;
}

// Uses the JSZip library to create the archive's blob
const createZip = (files) =>{
    let zip = new JSZip();

    files.forEach((obj, index) =>{
        traverse(obj, (key, value, object) =>{
            let folderStr = key.substring(0, Math.max(key.lastIndexOf("/"), key.lastIndexOf("\\")));
            let fileStr = key.split('\\').pop().split('/').pop();
            if(folderStr !== ""){
                zip.folder(folderStr).file(fileStr, value);
            } else{
                zip.file(fileStr, value);
            }
        })
    })

    // Adds the images to the add-on package
    let p16 = $("#image_upload_preview").attr("data-p16"),
        p48 = $("#image_upload_preview").attr("data-p48"),
        p128 = $("#image_upload_preview").attr("data-p128");
    if ( p16 ) {
        zip.folder("data").file("icon-16.png", p16, { base64: true});
    }
    if ( p48 ) {
        zip.folder("data").file("icon-48.png", p48, { base64: true});
    }
    if ( p128 ) {
        zip.folder("data").file("icon-128.png", p128, { base64: true});
    }

    let blob = zip.generate({type:"blob"});
    saveAs(blob, addonName + ".zip");
}

// Generate a random UUID for the integration
const guid = (function() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return function() {
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
            s4() + '-' + s4() + s4() + s4();
    };
})();

// Used to iterate through a object and perform actions in a defined callback
const traverse = (o,func) =>{
    for (var i in o) {
        func.apply(this,[i,o[i], o]);
        if (o[i] !== null && typeof(o[i])=="object") {
            //going on step down in the object tree!!
            traverse(o[i],func);
        }
    }
}

// Utility function to check if an object is empty
const isEmpty = (obj) =>{
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}

// Begins the process of generating the add-on package by taking a pre-defined integration type
// Performs several async calls of the methods created above
const startZip = (integrationType) =>{    
    let addonTitle = $('#addon_name').val();
    addonName = addonTitle || 'my-custom-view-tile';
    addonName = addonName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    let addonDescription = $('#description').val() || 'A example Jive Add-on built with the Jive Quickstart App';

    asyncFileGetter(integrationType, addonName, description)
    .then((files) =>{
        files.push(getCustomFiles(addonName))
        return files;
    })
    .then((files) =>{
        files.push(addDefinition(integrationType));
        return files;
    })
    .then((files) =>{
        return getCustomParams(files);
    })
    .then((files) =>{
        let id = guid();
        let replacers = {
            "$$$DESCRIPTION$$$" : addonDescription,
            "$$$DISPLAY_NAME$$$" : addonTitle,
            "$$$INTERNAL_NAME$$$" : addonName,
            "$$$EXTENSION_UUID$$$" : id,
            "$$$REDIRECT_URL$$$" : "%serviceURL%"
        }

       for (var prop in replacers) {
            // skip loop if the property is from prototype
            if(!replacers.hasOwnProperty(prop)) continue;
                processParams(files, prop, replacers[prop]);
        }

        return files;

    })
    .then((files) =>{
        createZip(files);
    })
    .catch((err) =>{
        console.log(err);
    })
}

const encodeImage = (imageUri, callback) =>{
    var c = document.createElement('canvas');
    var ctx = c.getContext("2d");
    var img = new Image();
    img.onload = function () {
        c.width = this.width;
        c.height = this.height;
        ctx.drawImage(img, 0, 0);
        var dataURL = c.toDataURL("image/png");
        callback(dataURL)
    };
    img.src = imageUri;
}

const imageToDataUri = (img, width, height) =>{

    // create an off-screen canvas
    var canvas = document.createElement('canvas'),
        ctx = canvas.getContext('2d');
    // set its dimension to target size
    canvas.width = width;
    canvas.height = height;

    // draw source image into the off-screen canvas:
    ctx.drawImage(img, 0, 0, width, height);

    // encode image to data-uri with base64 version of compressed image
    return canvas.toDataURL('image/png');
}

const base64ToDataUri = (base64) =>{
    return 'data:image/png;base64,' + base64;
}

const resizeImage = () =>{
    new Promise((resolve, reject) =>{
        var imageObj = new Image();
        var imageObj = new Image;
        imageObj.onload = () =>{
            resolve(imageObj);
        }
        imageObj.src =  $("#image_upload_preview").attr("src");
    })
    .then((img) =>{
        let p16 = imageToDataUri(img, 16, 16); 
        $("#image_upload_preview").attr("data-p16", p16.split(',')[1]);
        return img;
    })
    .then((img) =>{
        let p48 = imageToDataUri(img, 48, 48); 
        $("#image_upload_preview").attr("data-p48", p48.split(',')[1]);
        return img;
    })
    .then((img) =>{
        let p128 = imageToDataUri(img, 128, 128); 
        $("#image_upload_preview").attr("data-p128", p128.split(',')[1]);
    })
    .catch((err) =>{
        console.log(err);
    })
}

const readURL = (input) =>{
    if (inputFile && inputFile.files[0]) {
        let file = inputFile.files[0];
        if(file.type === 'image/png' || file.type === 'image/jpeg'){
            let reader = new FileReader();
            reader.onload = (e) =>{
                let imgSrc = e.target.result;
                $('#image_upload_preview').attr('src', imgSrc).show();
                resizeImage();
            }
            reader.readAsDataURL(file);
        } else{
            alert("Please upload a .png or .jpg/.jpeg image");
        }
    }
}

// Listeners for button click and to start the zip blob
const bindEvent = (el, eventName, eventHandler) =>{
    if (el.addEventListener){
        // standard way
        el.addEventListener(eventName, eventHandler, false);
    } else if (el.attachEvent){
        // old IE
        el.attachEvent('on'+eventName, eventHandler);
    }
}


const loadBrowserBlob = () =>{
    // Blob
    if (navigator.userAgent.indexOf('Safari') != -1 && navigator.userAgent.indexOf('Chrome') == -1) {
        $("#j-notice").html("<br>For Safari browsers, the file will download with a name like <b>Unknown</b>. " +
                "You can upload this straightaway to your Jive instance, or rename name the file with a .zip extension to easily view its contents.");
        $('#blob').click( function() {
            window.location = "data:application/zip;base64," + startZip(integType);
        } );
    } else {
        // other
        // safari
        var blobLink = document.getElementById('blob');
        if (JSZip.support.blob) {
            $('#blob').click( function() {
                startZip(integType);
            } );
        } else {
            blobLink.innerHTML += " (not supported on this browser)";
        }
    }
}

// adjusts window dimensions
const adjustDimensions = ()=>{
        gadgets.window.adjustHeight();
        gadgets.window.adjustWidth();
}

const init = () =>{
    loadNavigation();
    loadBrowserBlob();
    adjustDimensions();
    // Sets the background image of the navigation
    $('.main_nav').css('background-image', `url('${addonURL}/images/background-nav@3x.png')`);
    
    // When an image file is selected for upload, the window needs to be resized begin the 
    // process of resizing the image and converting to Base64
    $('#inputFile').change(()=>{
        let input = document.getElementById('inputFile');
        readURL(input);
    });
    if(extraJSInit && typeof extraJSInit === 'function'){
        extraJSInit();
    }
}

gadgets.util.registerOnLoadHandler(init);