var AWS = require('../aws-setup');
var Promise = require('promise');
var getExistingAPIs = require('./get-apis');

module.exports = function(data) {
    var params = {
        name: data.api.name || '',
        description: data.api.description || ''
    };

    this.createAPI = function(resolve, reject) {
        var apigateway = new AWS.APIGateway();
        apigateway.createRestApi(params, function (error, result) {
            if (error) {
                reject("ERROR creating API", error);
            }
            else {
                data.api = result;
                resolve(data);
            }
        });
    };

    this.getAPIs = function(resolve, reject) {
        getExistingAPIs(data)
            .then(function(api){
                if(api) { 
                    data.api = api;
                    resolve(data);
                } 
                else {
                    console.log("CREATE API");
                    this.createAPI(resolve, reject); 
                }
            }.bind(this))
            .catch(reject);
    };

    this.promise = function(resolve, reject) {
        if(data.api.id) resolve(data);
        else this.getAPIs(resolve, reject);
    }.bind(this);

    return new Promise(this.promise);
};

