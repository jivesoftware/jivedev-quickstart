const extraJSInit = () =>{
    $('#run-transform').click(function() {
        var input_data = $('textarea#tx_input').val();
        var xform_func = $('textarea#custom_0').val();
        var callback_reached = false;
        try {
            // clear output fields
            $('#tx_output').val('');
            $('#validation_check').html('N/A');
            $('#callback_check').html('N/A');

            // check if transform function is empty
            if (xform_func == null || xform_func.trim().length < 1) {
                throw new Error("Transform function is empty.");
            }

            // timer function in case callback isn't called
            function sentinel() {
                if (!callback_reached) {
                    $('#callback_check').html('<span class="j-fail">FAILED</span>.<br/>Error: Callback never executed. Be sure to call the "callback" function with activity stream data.');
                }
            }

            // callback function to be executed by transform code
            function callback(data) {
                callback_reached = true;
                clearTimeout(timer_handle);
                $('#callback_check').html('<span class="j-success">PASSED</span>. Callback has executed.');
                try {
                    var resulting_Json;
                    if ( typeof data === 'function' ) {
                        throw new Error('Cannot pass function into callback.')
                    }
                    else if ( typeof data === 'undefined') {
                        throw new Error('No data passed to callback.')
                    }
                    else if ( typeof data === 'string' ) {
                        try {
                            resulting_Json = JSON.parse(data);
                        }
                        catch (err) {
                            throw new Error("Invalid JSON data passed to callback. "+err);
                        }
                    }
                    else {
                        resulting_Json = data;
                    }

                    // display output
                    $('#tx_output').val(JSON.stringify(data, null, 2));
                    

                    // validate activity stream JSON
                    validateSchema(data);

                    // if we got here, then we passed
                    $('#validation_check').html('<span class="j-success">PASSED</span>. Data format is valid.');

                } catch (err) {
                    $('#validation_check').html('<span class="j-fail">FAILED</span>. '+err+
                        '<br/><br/>For help, refer to <a href="https://community.jivesoftware.com/docs/DOC-157511">Developing Simple Stream Integrations</a> in the Jive Community. This document provides the JSON schema for simple stream integrations.');
                }
            }

            // start a timer to check if callback is called in time
            var timer_handle =  setTimeout(sentinel,750);

            // run transform function
            var transformFunc = new Function('body', 'headers', 'options', 'callback', xform_func);
            try {
                // try to send an object to the transform function
                var obj = JSON.parse(input_data);
                transformFunc(obj, {}, {}, callback, xform_func);
            }
            catch (err) {
                // if we can't parse the input, then just send it as is...
                transformFunc(input_data, {}, {}, callback, xform_func);
            }
        }
        catch (err) {
            clearTimeout(timer_handle);
            $('#callback_check').html('<span class="j-fail">FAILED</span>.<br/>'+err);
        }
    });

    function validateSchema(data) {
        if (!data.activity) {
            throw new Error('"activity" object not found.');
        }
        if (typeof data.activity !== 'object') {
            throw new Error('"activity" is not an object type.');
        }
        if (!data.activity.object) {
            throw new Error('"activity.object" object not found.');
        }
        if (typeof data.activity.object !== 'object') {
            throw new Error('"activity.object" is not an object type.');
        }
        if (!data.activity.object.image) {
            throw new Error('"activity.object.image" string not found.');
        }
        if (typeof data.activity.object.image !== 'string') {
            throw new Error('"activity.object.image" should be the URL for an image.');
        }
        if (!data.activity.object.title) {
            throw new Error('"activity.object.title" string not found.');
        }
        if (typeof data.activity.object.title !== 'string') {
            throw new Error('"activity.object.title" should be a string.');
        }
    }
};