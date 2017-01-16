// Begin page actions & validations
// Checks browser and JS compatibility
// Checks form completeness and validates some fields before creating the zip
$("#inputFile").change(function () {
    readURL(this);
});
if (navigator.userAgent.indexOf('Safari') != -1 && navigator.userAgent.indexOf('Chrome') == -1) {
    $("#j-notice").html("<br>For Safari browsers, the file will download with a name like <b>Unknown</b>. " +
            "You can upload this straightaway to your Jive instance, or rename name the file with a .zip extension to easily view its contents.");
    $('#blob').click( function() {
        $('#message').html("");
        var urlValidation = /https?:\/\//i.test($('#redirect_uri').val());
        if (urlValidation){
            window.location = "data:application/zip;base64," + createZip().generate({type:"base64"});
        }
        else{
            $('#message').innerHTML += "Not a valid URL";
            return false;
        }
    } );
} else {
    var blobLink = document.getElementById('blob');
        if (JSZip.support.blob) {
            $('#blob').click( function() {
                $('#message').html("");
                var urlValidation = /https?:\/\//i.test($('#redirect_uri').val());
                if (urlValidation){
                    try {
                        var blob = createZip().generate({type:"blob"});
                        // see FileSaver.js
                        saveAs(blob, addonName + ".zip");
                    } catch(e) {
                        $('#message').append("<p>" + e + "</p>");
                    }
                }
                else{
                        $('#message').html("<p>Not a valid URL</p>");
                    }
                return false;
            } );
        } else {
            $('#message').html("<p>Not supported on this browser</p>");
        }
}


// Begin scripts to create addon
var src = {};
var addonName = 'oauth-client';
src.public = {};
src.data = {};

// load static resources ajaxy (from same domain, so should be ok)
$.get('/wp-content/uploads/2015/10/meta.json', function(data) {
    src.meta_json = data;
});
$.get('/wp-content/uploads/2015/10/definition.json', function(data) {
    src.definition_json = data;
});


function createZip() {
    var zip = new JSZip();

    var addonTitle = $('#addon_name').val();
    addonName = addonTitle || 'oauth-client';
    addonName = addonName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    var addonDescription = $('#description').val() || 'This is my OAuth 2.0 client addon.';

    var _src = JSON.parse(JSON.stringify(src));
    var meta = _src.meta_json;
    var definition = _src.definition_json;

    var redirectURI = $('#redirect_uri').val();

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
            value = value.replace(/\$\$\$REDIRECT_URL\$\$\$/g, redirectURI);
            object[key] = value;
        }
    });

    // Create meta and definition JSON files
    zip.file("definition.json", JSON.stringify(definition,null,4));
    zip.file("meta.json", JSON.stringify(meta,null,4));

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