var AWS = require('../aws-setup');
var _ = require('lodash');
var Promise = require('promise');

module.exports = function(data) {

    var params = {
        restApiId: data.api.id,
        limit: 500 
    };

    this.getRootResource = function(resources) {
        return _.filter(resources, function(resource) {
            return resource.path === '/'; 
        });
    };

    this.promise = function(resolve, reject) {
        var apigateway = new AWS.APIGateway();
        apigateway.getResources(params, function(error, result) {
            if( error ){
                reject("ERROR getting Resources", error);
                return;
            }
            data.remoteResources = result.items;
            data.rootResource = this.getRootResource(data.remoteResources);
            resolve(data);
        }.bind(this));
    }; 
    
    return new Promise(this.promise);
};
