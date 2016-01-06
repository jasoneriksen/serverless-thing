/* 
 * get.js
 * Lambda get function for Main api endpoint for app
 * Route: /api/
 */

exports.handler = function getName(event, context) {   
    var result = {
        context: context,
        event: event
    };
    //echo some stuff back to the user 
    context.done(null, result);
};

