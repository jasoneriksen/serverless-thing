var AWS = require('../aws-setup');
var Promise = require('promise');
var getPublicBucket = require('./get-public-bucket');
var helpers = require('../lib/helpers');

var getBucketConfiguration = function(data) {
    if(data.account.region !== 'us-east-1') {
        return { LocationConstraint:  data.account.region}
    }
    return 0;
}

module.exports = function(data) {
    console.log('Create Public Bucket');

    var params = {
        Bucket: helpers.getPublicBucketName(data),
        ACL: 'public-read'
    };
    var bucketConfig = getBucketConfiguration(data);
    if(bucketConfig) {
        CreateBucketConfiguration: getBucketConfiguration(data)
    }

    this.createPublicBucket = function(resolve, reject) {
        var s3 = new AWS.S3();
        s3.createBucket(params, function(err, results) {
            data.publicBucket = helpers.getPublicBucketName(data);
            if (err) {
                console.log("ERROR CREATING PUBLIC BUCKET ", err);
                reject(err); 
            }
            else {
                resolve(data);
            }
        });
    };
    
    this.promise = function(resolve, reject) {
        getPublicBucket(data)
            .then(function(bucketExists){
                if(bucketExists) { 
                    data.publicBucket = helpers.getPublicBucketName(data);
                    resolve(data);
                } 
                else { 
                    this.createPublicBucket(resolve, reject); 
                }
            })
            .catch(reject);
    };

    return new Promise(this.promise);
};

