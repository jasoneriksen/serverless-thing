var AWS = require('../aws-setup');
var _ = require('lodash');
var Promise = require('promise');

module.exports = function(data) {
    var params = {
        name: data.api.name,
        description: data.api.description || ''
    };

    this.checkForExistingAPI = function(items, callback) {
        if(!items.length) callback(0);
        
        var match = _.filter(items, function(item) {
            return item.name === params.name; 
        });

        if(!match.length) { 
            callback(0);
        }
        else {
            //data.api = match[0];
            //callback(data);
            callback(match[0]);
        }
    };

    this.promise = function(resolve, reject) {
        var apigateway = new AWS.APIGateway();

        //Check to see if API exists
        apigateway.getRestApis({}, function(error, result) {
            if(error){
                reject("ERROR getting APIs", error);
            }
            else{
                checkForExistingAPI(result.items, resolve);
            }
        });
    }; 
    
    return new Promise(this.promise);
};
