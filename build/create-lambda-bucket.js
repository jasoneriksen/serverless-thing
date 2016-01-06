var AWS = require('../aws-setup');
var Promise = require('promise');
var getLambdaBucket = require('./get-lambda-bucket');
var helpers = require('../lib/helpers');

var getBucketConfiguration = function(data) {
    if(data.account.region !== 'us-east-1') {
        return { LocationConstraint:  data.account.region}
    }
    return 0;
}

module.exports = function(data) {
    var params = {
        Bucket: helpers.getLambdaBucketName(data),
        ACL: 'private'
    };
    var bucketConfig = getBucketConfiguration(data);
    if(bucketConfig) {
        CreateBucketConfiguration: getBucketConfiguration(data)
    }

    this.createLambdaBucket = function(resolve, reject) {
        var s3 = new AWS.S3();
        s3.createBucket(params, function(err, results) {
            data.lambdaBucket = helpers.getLambdaBucketName(data);
            if (err) {
                console.log("ERROR CREATING LAMBDA BUCKET");
                console.log(err);
                console.log(params);
                reject(err); 
            }
            else {
                console.log("CREATED LAMBDA BUCKET")
                console.log(results);
                resolve(data);
            }
        });
    };
    
    this.promise = function(resolve, reject) {
        getLambdaBucket(data)
            .then(function(bucketExists){
                if(bucketExists) { 
                    data.lambdaBucket = helpers.getLambdaBucketName(data);
                    resolve(data);
                } 
                else { 
                    this.createLambdaBucket(resolve, reject); 
                }
            })
            .catch(reject);
    };

    return new Promise(this.promise);
};

