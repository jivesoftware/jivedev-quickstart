/************************************************************************
  STEP 1 - Update Your Action IDs to Match your app.xml
  See: /apps/simpleapp/public/app.xml
************************************************************************/
var ACTION_IDS = [
  "com.jivesoftware.quickstart.createmenu.action.app",
  "com.jivesoftware.quickstart.createmenu.action.tile",
  "com.jivesoftware.quickstart.createmenu.action.stream"
];

/************************************************************************
  STEP 2 - Use this method if you want to run code after OpenSocial has loaded the environemnt
  NOTE: This is marginally better than jQuery onReady, but not required.
        //var jiveURL = opensocial.getEnvironment()['jiveUrl'];
  NOTE: If not needed, you can remove the entire function
************************************************************************/
function onReady(env) {
  console.log('onReady',env);
  var jiveURL = env["jiveUrl"];

  //TODO: ADD IN UI INIT STUFF

  app.resize();
} // end function

/************************************************************************
  STEP 3 - Use this method if you only want to perform something once the Viewer has been resolved
  NOTE: If not needed, you can remove the entire function
************************************************************************/
function onViewer(viewer) {
  console.log("onViewer",viewer);
  $("#currentUser").html("<pre>"+JSON.stringify(viewer,null,2)+"</pre>");
} // end function

/************************************************************************
  STEP 4 - Use this method if you only want to perform something once the View Context has been resolved
  NOTE: If not needed, you can remove the entire function
************************************************************************/
function onView(context) {
  console.log("onView",context);

  if (context["currentView"]) {
    $('span.viewContext').append('<em>'+context["currentView"]+"</em>");
  } // end if

  if (context["params"]) {
    $('#paramsContext').html('<pre>'+JSON.stringify(context["params"],null,2)+"</pre>");
  } else {
    $('#paramsContext').html('No Params Found');
  } // end if

  if (context["object"]) {
    $("#currentViewContext").append("<pre>"+JSON.stringify(context["object"],null,2)+"</pre>");
  } // end if

  $('#paramsSampleLink').click(function() {
    gadgets.views.requestNavigateTo(context["currentView"], { timestamp: new Date().toString() });
  });

} // end function

/************************************************************************
  STEP 5 - Use this method if you only want to perform something once the Action Context has been resolved
  NOTE: If not needed, you can remove the entire function
************************************************************************/
function onAction(context) {
  console.log("onAction",context);
  $('span.actionContext').append('<em>'+context["action"]+'</em>');
  $("#currentActionContext").append("<pre>"+JSON.stringify(context["object"],null,2)+"</pre>");
} // end function

/************************************************************************
  STEP 6 - Use this method if you only want to perform something once the Data Context has been resolved
  NOTE: If not needed, you can remove the entire function
************************************************************************/
function onData(data) {
  console.log("onData",data);
  $("#currentActionContext").html("<p><strong>Data Context</strong></p>");
  $("#currentActionContext").append("<pre>"+JSON.stringify(data,null,2)+"</pre>");
} // end function
