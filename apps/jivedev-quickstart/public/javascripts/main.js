//encodeImage("sample-icon-128.png", function (dataURL) {
//    src.data.sample_icon_128_png = dataURL;
//    $(document).ready( function() {
//        $("#image_upload_preview").attr("src", dataURL);
//        resizeImage.call( $("#image_upload_preview")[0] );
//    });
//});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var matches = window.location.href.match(/.*?[?&]url=([^&]+)%2F.*$/);  
const addonURL = decodeURIComponent(matches[1]);

function createZip() {
    var zip = new JSZip();

    var addonTitle = $('#addon_name').val();
    addonName = addonTitle || 'my-custom-view-tile';
    addonName = addonName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    var addonDescription = $('#description').val() || 'A example Custom View Tile built with the Custom View Tile App';

    var p16 = $("#image_upload_preview").attr("data-p16");
    var p48 = $("#image_upload_preview").attr("data-p48");
    var p128 = $("#image_upload_preview").attr("data-p128");

    if ( p16 ) {
        zip.folder("data").file("extension-16.png", p16, { base64: true});
    }
    if ( p48 ) {
        zip.folder("data").file("extension-48.png", p48, { base64: true});
    }
    if ( p128 ) {
        zip.folder("data").file("extension-128.png", p128, { base64: true});
    }
    getSourceFiles(addonName)
    .then((_src) =>{
        let meta = _src.meta_json;
        let definition = _src.definition_json;
        console.log("Creating zip contents...");

        // Generate random UUID
        meta.id = guid();

        traverse(_src, function(key, value, object) {
            if ( value && typeof value === 'string') {
                value = value.replace(/\$\$\$EXTENSION_UUID\$\$\$/g, meta["id"]);
                value = value.replace(/\$\$\$DISPLAY_NAME\$\$\$/g, addonTitle);
                value = value.replace(/\$\$\$INTERNAL_NAME\$\$\$/g, addonName);
                value = value.replace(/\$\$\$DESCRIPTION\$\$\$/g, addonDescription);
                object[key] = value;
            }
        });

        // Create meta and definition JSON files
        zip.file("definition.json", JSON.stringify(definition,null,4));
        zip.file("meta.json", JSON.stringify(meta,null,4));

        // public folder
        zip.folder(`public/tiles/${addonName}`).file("view.html", _src.view_html);
        zip.folder(`public/tiles/${addonName}/javascripts`).file("view.js", _src.view_js);
        zip.folder(`public/tiles/${addonName}/javascripts`).file("main.js", _src.main_js);
        zip.folder(`public/tiles/${addonName}/stylesheets`).file("style.css", _src.style_css);

        // i18n folder
        zip.folder("i18n").file("en.properties", _src.en_properties);
        zip.folder("i18n").file("root.properties", _src.root_properties);

        // data folder
        zip.folder("data").file("eula.html", _src.eula_html);

        return zip;
    })
    .then((zip) =>{
        let blob = zip.generate({type:"blob"});
        saveAs(blob, addonName + ".zip");
    })
    .catch((err) =>{
        console.log(err);
    })
}

var guid = (function() {
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

function traverse(o,func) {
    for (var i in o) {
        func.apply(this,[i,o[i], o]);
        if (o[i] !== null && typeof(o[i])=="object") {
            //going on step down in the object tree!!
            traverse(o[i],func);
        }
    }
}

function encodeImage(imageUri, callback) {
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

function imageToDataUri(img, width, height) {

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

function base64ToDataUri(base64) {
    return 'data:image/png;base64,' + base64;
}

function resizeImage(image) {
    var p16 = imageToDataUri(image, 16, 16);
    console.log(p16);
    var p48 = imageToDataUri(image, 48, 48);
    var p128 = imageToDataUri(image, 128, 128);

    $("#image_upload_preview").attr("data-p16", p16.split(',')[1]);
    $("#image_upload_preview").attr("data-p48", p48.split(',')[1]);
    $("#image_upload_preview").attr("data-p128", p128.split(',')[1]);
}

function readURL(input) {
    if (input[0].files && input[0].files[0]) {
        var reader = new FileReader();
        reader.onload = function (e) {
            var imgSrc = e.target.result;
            $('#image_upload_preview').attr('src', imgSrc).show();

            var img = new Image;

            img.onload = resizeImage(img);
            img.src =  $("#image_upload_preview").attr("src");

        };
        reader.readAsDataURL(input[0].files[0]);
    }
}

function bindEvent(el, eventName, eventHandler) {
    if (el.addEventListener){
        // standard way
        el.addEventListener(eventName, eventHandler, false);
    } else if (el.attachEvent){
        // old IE
        el.attachEvent('on'+eventName, eventHandler);
    }
}

function getSourceFiles(addonName){
    // load static resources ajaxy (from same domain, so should be ok)
        var src = {
            'meta_json' : "meta.json",
            'definition_json' : "definition.json",
            'en_properties' : "en.properties",
            'root_properties' : "root.properties",
            'eula_html' : "eula.html",
            'main_js' : "main.js"
        };


        let requestArray = [];
        requestArray[requestArray.length] = traverse(src, (key, value, object) =>{
            return new Promise((resolve, reject) =>{
                if ( value && typeof value === 'string') {
                    osapi.http.get({
                        'href' : `${addonURL}/src/${value}`
                    }).execute((response) =>{
                        if(response.status === 200){
                            object[key] = response.content;
                            resolve();
                        } else{
                            reject(`Unable to get file ${value}`);
                        }
                    })
                }
            })
        })

        return Promise.all(requestArray).then(() =>{
            src["view_js"] = $('#view_js').val();
            src["view_html"] = $('#view_html').val();
            src["style_css"] = $('#style_css').val();
            return(src);
        })
        .catch( err =>{
            console.log(err);
        })


    // return new Promise ((resolve, reject) =>{
    //     let src = {
    //         'i18n' : {},
    //         'data' : {},
    //         'public' : {
    //             'tiles' : {
    //             }
    //         }
    //     };

    //     let viewhtml = $('#view_html').val(),
    //         viewjs = $('#view_js').val(),
    //         stylecss = $('#style_css').val();

    //     src.public.tiles[addonName] = {
    //         'view_html' : viewhtml,
    //         'javascripts' : { "view_js" : viewjs },
    //         'stylesheets' : { "style_css" : stylecss}
    //     }
    //     console.log(src);
    //     resolve(src);
    // })
    // .then((_src) =>{
    //     osapi.http.get({
    //         'href' : addonURL + '/src/meta.json'
    //     }).execute((response) =>{
    //         if(response.status === 200){
    //             _src["meta_json"] = response.content;
    //             return _src;
    //         } else{
    //             throw new Error('Failted to get meta.json');
    //         }
    //     })
    // })
    // .then((_src) =>{
    //     osapi.http.get({
    //         'href' : addonURL + '/src/definition.json'
    //     }).execute((response) =>{
    //         if(response.status === 200){
    //             _src.definition_json = response.content;
    //             return _src;
    //         } else{
    //             throw new Error('Failted to get definition.json');
    //         }
    //     })
    // })
    // .then((_src) =>{
    //     osapi.http.get({
    //         'href' : addonURL + '/src/public/main.js'
    //     }).execute((response) =>{
    //         if(response.status === 200){
    //             _src.public.main_js = response.content;
    //             return _src;
    //         } else{
    //             throw new Error('Failted to get main.js');
    //         }
    //     })
    // })
    // .then((_src) =>{
    //     osapi.http.get({
    //         'href' : addonURL + '/src/data/eula.html'
    //     }).execute((response) =>{
    //         if(response.status === 200){
    //             _src.data.eula_html = response.content;
    //             return _src;
    //         } else{
    //             throw new Error('Failted to get eula.html');
    //         }
    //     })
    // })
    // .then((_src) =>{
    //     osapi.http.get({
    //         'href' : addonURL + '/src/i18n/root.properties'
    //     }).execute((response) =>{
    //         if(response.status === 200){
    //             _src.i18n.root_properties = response.content;
    //             return _src;
    //         } else{
    //             throw new Error('Failted to get root.properties');
    //         }
    //     })
    // })
    // .then((_src) =>{
    //     osapi.http.get({
    //         'href' : addonURL + '/src/i18n/en.properties'
    //     }).execute((response) =>{
    //         if(response.status === 200){
    //             _src.i18n.en_properties = response.content;
    //             return _src;
    //         } else{
    //             throw new Error('Failted to get en.properties');
    //         }
    //     })
    // })
}