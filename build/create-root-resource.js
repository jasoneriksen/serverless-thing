var AWS = require('../aws-setup');
var Promise = require('promise');
var apiDir = require('config').apiDir || 'api'; //default is "api"

module.exports = function(data) {
    var params = {
        parentId: data.api.id,
        pathPart: apiDir,
        restApiId: data.api.id
    };

    this.promise = function(resolve, reject) {
        var apigateway = new AWS.APIGateway();
        apigateway.createResource(params, function (error, result) {
            if (error) {
                console.log(error);
                reject("ERROR creating root resource", error);
                return;
            }
            
            console.log('CREATE ROOT RESOURCE RESULT');
            console.log(result);

            data.resources = [result];
            resolve(data);
        });
    };

    return new Promise(this.promise);
};

