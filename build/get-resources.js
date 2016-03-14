var AWS = require('../aws-setup');
var _ = require('lodash');
var Promise = require('promise');

module.exports = function(data) {
    console.log('Get Resources');

    var apigateway = new AWS.APIGateway();
    var params = {
        restApiId: data.api.id,
        limit: 500 
    };

    this.getResources = function() {
        return new Promise(function(resolve, reject){
             
        }); 
    };

    this.getRootResource = function(resources) {
        return _.filter(resources, function(resource) {
            return resource.path === '/'; 
        });
    };

    return new Promise(function(resolve, reject) {
        apigateway.getResources(params, function(error, result) {
            if( error ){
                reject("ERROR getting Resources", error);
                return;
            }
            data.remoteResources = result.items;
            data.rootResource = this.getRootResource(data.remoteResources)[0];
            resolve(data);
        }.bind(this));
    }); 
};
