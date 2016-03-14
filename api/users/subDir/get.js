/* 
 * get.js
 * Lambda get function for users endpoint for app
 * Route: /api/users
 */

exports.handler = function getName(event, context) {   
    var result = {
        context: context,
        event: event
    };
    //echo something back to the user 
    context.done(null, result);
};

