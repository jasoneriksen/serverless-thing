var AWS = require('../aws-setup');
var _ = require('lodash');
var Promise = require('promise');
var helpers = require('../lib/helpers');

module.exports = function(data) {
    var headParams = {
          Bucket: helpers.getLambdaBucketName(data)
    };

    this.promise = function(resolve, reject) {
        var s3 = new AWS.S3();
        s3.headBucket(headParams, function(err, response) {
            if (err) {
                console.log("NO LAMBDA BUCKET FOUND");
                resolve(0);
            }
            else {
                console.log("LAMBDA BUCKET FOUND");
                console.log(response);
                resolve(1);
            }
        });
    }; 
    
    return new Promise(this.promise);
};
