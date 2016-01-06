var AWS = require('../aws-setup');
var _ = require('lodash');
var Promise = require('promise');
var config = require('config');

var params = {
      restApiId: config.api.id || ''
};

var checkForExistingDeployment = function(items, callback) {

    console.log('items');
    console.log(items);

    if(!items.length) callback(0);
    
    var match = _.filter(items, function(item) {
        return item.stageName === params.stageName; 
    });

    if(!match) callback(0);
    callback(match);
};

module.exports = function(data) {
    return new Promise(function(resolve, reject) {
        var apigateway = new AWS.APIGateway();
        if(data.id) params.restApiId = data.id;
        //Check to see if Deployment exists
        apigateway.getDeployments(params, function(err, res) {
            if(err){
                console.log("ERROR getting Deployments");
                console.log(err);
                reject("ERROR getting Deployments", err);
            }
            else{
                console.log("get-deployments res");
                console.log(res);
                if(!res.items.length) resolve(0);
                checkForExistingDeployment(res.items, resolve);
            }
        });
    });
};
