var AWS = require('../aws-setup');
var npmS3 = require('s3');
var Promise = require('promise');
var getPublicBucket = require('./get-public-bucket');
var createPublicBucket = require('./create-public-bucket');
var helpers = require('../lib/helpers');
var path = require('path');
var publicDir = path.resolve(path.dirname(process.argv[1]), 'public');

var getBucketConfiguration = function(data) {
    if(data.account.region !== 'us-east-1') {
        return { LocationConstraint:  data.account.region}
    }
    return 0;
}

module.exports = function(data) {
    console.log('Sync Public Bucket');

    var s3Params = {
        Bucket: helpers.getPublicBucketName(data),
        Prefix: '',
    };

    this.syncPublicBucket = function(resolve, reject) {
        console.log('syncPublicBucket');
        var awsS3Client = new AWS.S3();
        var s3Client = npmS3.createClient({
            s3Client: awsS3Client,
        });

        var uploader = s3Client.uploadDir({
            localDir: publicDir,
            deleteRemoved: true,
            s3Params: s3Params,
        });

        uploader.on('error', function(err) {
            console.error("unable to sync:", err.stack);
            reject(err);
        });

        uploader.on('end', function() {
            resolve(data); 
        });
    };
    
    this.promise = function(resolve, reject) {
        getPublicBucket(data)
            .then(function(bucketExists){
                this.syncPublicBucket(resolve, reject);
            })
            .catch(function (err){
                console.log("ERROR: ", err);
                reject(err);
            });
    };

    return new Promise(this.promise);
};

