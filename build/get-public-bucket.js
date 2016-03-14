var AWS = require('../aws-setup');
var _ = require('lodash');
var Promise = require('promise');
var helpers = require('../lib/helpers');

module.exports = function(data) {
    console.log('Get Public Bucket');
    var headParams = {
          Bucket: helpers.getPublicBucketName(data)
    };

    this.promise = function(resolve, reject) {
        var s3 = new AWS.S3();
        s3.headBucket(headParams, function(err, response) {
            if (err) {
                console.log("no public bucket found ", err);
                resolve(0);
            }
            else {
                resolve(1);
            }
        });
    }; 
    
    return new Promise(this.promise);
};
