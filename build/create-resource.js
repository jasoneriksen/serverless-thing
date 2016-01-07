var AWS = require('../aws-setup');
var Promise = require('promise');
var getResources = require('./get-resources');

module.exports = function(data) {
    var params = {
        parentId: data.api.id,
        pathPart: '',
        restApiId: data.api.id
    };

    this.createResource = function(resolve, reject) {
        var apigateway = new AWS.APIGateway();

        apigateway.createResource(params, function (error, result) {
            if (error) {
                reject("ERROR creating Resource", error);
            }
            else {
                data.resource = result;
                resolve(data);
            }
        });
    };
    
    this.promise = function(resolve, reject) {
        if(data.resource.id) resolve(data);
        else{
            getResources(data)
                .then(function(resource){
                    if(resource) { 
                        data.resource = resource;
                        resolve(data);
                    } 
                    else { 
                        this.createResource(resolve, reject); 
                    }
                })
                .catch(reject);
        }
    };

    return new Promise(this.promise);
};

