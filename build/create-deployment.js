var AWS = require('../aws-setup');
var Promise = require('promise');
var config = require('config');
var getDeployments = require('./get-deployments');

var params = {
    restApiId: config.api.id || '',
    description: config.deployment.description || '',
    stageName: config.deployment.stageName || '',
    stageDescription: config.deployment.stageDescription || ''
};

var createDeployment = function(data, resolve, reject) {
    if(!params.restApiId) params.restApiId = data.id;
    var apigateway = new AWS.APIGateway();
    console.log("CREATING Deployment"); 
    apigateway.createDeployment(params, function (err, res) {
        if (err) {
            console.log("ERROR creating Deployment");
            console.log(err);
            reject("ERROR creating Deployment", err);
        }
        else {
            console.log("success creating Deployment");
            console.log(res);
            resolve(res);
        }
    });
};

module.exports = function(data) {
    return new Promise(function(resolve, reject) {
        getDeployments(data)
            .then(function(deployment){
                if(deployment) { resolve(deployment); } 
                else { createDeployment(data, resolve, reject); }
            })
            .catch(reject);
    });
};

