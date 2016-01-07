var AWS = require('./aws-setup');
var config = require('config');
var Promise = require('promise');
var build = require('./build');

var success = function(data) {
    console.log("DEPLOYMENT COMPLETE. RESULTS:"); 
    console.log(data);
};

var error = function(msg, error) {
    console.log("ERROR Deploying:"); 
    console.log(msg);
    console.log(error);
};


build.createAPI(config)
.then(build.getResources)
//.then(build.getMethods)
.then(build.createResources)
//.then(build.createMethods)
//.then(build.createDeployment)
.then(success)
.catch(error);

