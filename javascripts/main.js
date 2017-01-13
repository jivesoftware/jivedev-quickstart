//encodeImage("sample-icon-128.png", function (dataURL) {
//    src.data.sample_icon_128_png = dataURL;
//    $(document).ready( function() {
//        $("#image_upload_preview").attr("src", dataURL);
//        resizeImage.call( $("#image_upload_preview")[0] );
//    });
//});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function createZip() {
    var zip = new JSZip();

    var addonTitle = $('#addon_name').val();
    addonName = addonTitle || 'my-custom-view-tile';
    addonName = addonName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    var addonDescription = $('#description').val() || 'A example Custom View Tile built with the Custom View Tile App';



    var _src = sourceFiles(addonName);
    var meta = _src.meta_json;
    var definition = _src.definition_json;

    var customHTMLsrc = $('#custom_html').val();
    var customHTML = customHTMLsrc && customHTMLsrc.length > 0 ? customHTMLsrc : '';

    var customCSSsrc = $('#custom_css').val();
    var customCSS = customCSSsrc && customCSSsrc.length > 0 ? '<style>' + customCSSsrc + '</style>' : '';

    var transformJSsrc = "function transform(body, headers, options, callback)   {\n\n" +
        $('#xform_js').val() + "\n}";

    transformJSsrc = transformJSsrc ? transformJSsrc : _src.data.xform_js;

    console.log("Creating zip contents...");

    // Generate random UUID and put it in the meta JSON object
    meta["id"] = guid();

    var p16 = $("#image_upload_preview").attr("data-p16");
    var p48 = $("#image_upload_preview").attr("data-p48");
    var p128 = $("#image_upload_preview").attr("data-p128");
    if ( p16 ) {
        zip.folder("data").file("icon-16.png", p16, { base64: true});
    }
    if ( p48 ) {
        zip.folder("data").file("icon-48.png", p48, { base64: true});
    }
    if ( p128 ) {
        zip.folder("data").file("icon-128.png", p128, { base64: true});
    }

    traverse(_src, function(key, value, object) {
        if ( value && typeof value === 'string') {
            value = value.replace(/\$\$\$EXTENSION_UUID\$\$\$/g, meta["id"]);
            value = value.replace(/\$\$\$DISPLAY_NAME\$\$\$/g, addonTitle);
            value = value.replace(/\$\$\$INTERNAL_NAME\$\$\$/g, addonName);
            value = value.replace(/\$\$\$DESCRIPTION\$\$\$/g, addonDescription);
            value = value.replace(/\$\$\$CUSTOM_HTML\$\$\$/g, customHTML);
            value = value.replace(/\$\$\$CUSTOM_CSS\$\$\$/g, customCSS);
            object[key] = value;
        }
    });

    // Create meta and definition JSON files
    zip.file("definition.json", JSON.stringify(definition,null,4));
    zip.file("meta.json", JSON.stringify(meta,null,4));

    // public folder
    zip.folder(`public/tiles/${addonName}`).file("view.html", _src.public.tiles[addonName].javascripts.view_html);
    zip.folder(`public/tiles/${addonName}/javascripts`).file("view.js", _src.public.tiles[addonName].javascripts.view_js);
    zip.folder(`public/tiles/${addonName}/javascripts`).file("main.js", _src.public.tiles[addonName].javascripts.main_js);
    zip.folder(`public/tiles/${addonName}/stylesheets`).file("style.css", _src.public.tiles[addonName].javascripts.style_css);

    // i18n folder
    zip.folder("i18n").file("en.properties", _src.i18n.en_properties);
    zip.folder("i18n").file("root.properties", _src.i18n.root_properties);

    // data folder
    zip.folder("data").file("eula.html", _src.i18n.eula_html);

    return zip;
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
    return canvas.toDataURL();
}

function base64ToDataUri(base64) {
    return 'data:image/png;base64,' + base64;
}

function resizeImage() {
    var p16 = imageToDataUri(this, 16, 16);
    var p48 = imageToDataUri(this, 48, 48);
    var p128 = imageToDataUri(this, 128, 128);

    $("#image_upload_preview").attr("data-p16", p16.split(',')[1]);
    $("#image_upload_preview").attr("data-p48", p48.split(',')[1]);
    $("#image_upload_preview").attr("data-p128", p128.split(',')[1]);
}

function readURL(input) {
    if (input.files && input.files[0]) {
        var reader = new FileReader();
        reader.onload = function (e) {
            var imgSrc = e.target.result;
            $('#image_upload_preview').attr('src', imgSrc).show();

            var img = new Image;

            img.onload = resizeImage;
            img.src =  $("#image_upload_preview").attr("src");

        };
        reader.readAsDataURL(input.files[0]);
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

function sourceFiles(addonName){
    // load static resources ajaxy (from same domain, so should be ok)
    return new Promise ((resolve, reject) =>{
        let src = {
            'i18n' : {},
            'data' : {},
            'public' : {}
        };
        src.public.tiles[addonName].view_html = $('view_html').val();
        src.public.tiles[addonName].javascripts.view_js = $('#view_js').val();
        src.public.tiles[addonName].stylesheets.style_css = $('#style_css').val();

        $.get('src/meta.json', function(data) {
            src.meta_json = data;
            resolve(src);
        })
        .fail(() =>{
            reject('Failed retrieving file');
        });
    })
    .then((src) =>{
        $.get('src/definition.json', (data) => {
            src.definition_json = data;
            return src;
        }).fail(() =>{
            throw new Error('Failed retrieving file');
        });
    })
    .then((src) =>{
        $.get('src/public/main.js', {}, function(data) {
            src.public.tiles[addonName].javascripts.main_js = data;
            return src;
        }, 'text')
        .fail(() =>{
            throw new Error('Failed retrieving file');
        });
    })
    .then((src) =>{
        $.get('src/data/eula.html', (data) =>{
            src.data.eula_html = data;
            return src;
        })
        .fail(() =>{
            throw new Error('Failed retrieving file');
        })
    })
    .then((src) =>{
        $.get('src/i18n/root.properties', (data) =>{
            src.i18n.root_properties = data;
            return src;
        })
        .fail(() =>{
            throw new Error('Failed retrieving file');
        })
    })
    .then((src) =>{
        $.get('src/i18n/en.properties', (data) =>{
            src.i18n.en_properties = data;
            return src;
        })
        .fail(() =>{
            throw new Error('Failed retrieving file');
        })
    })
    
}