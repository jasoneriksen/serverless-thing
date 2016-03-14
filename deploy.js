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
.then(build.createPublicBucket)
.then(build.syncPublicContent)
.then(build.createResources)
.then(success)
.catch(error);

