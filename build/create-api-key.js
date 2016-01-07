var AWS = require('../aws-setup');
var config = require('config');

var params = {
    description: api.description,
    enabled: api.enabled || true,
    name: api.name
    stageKeys: [
    {
        restApiId: 'STRING_VALUE',
        stageName: 'STRING_VALUE'
    },
    /* more items */
    ]
};

module.exports = new Promise(function(resolve, reject) {
    //create the API KEY 
    var apigateway = new AWS.APIGateway();
    apigateway.createApiKey(params, function (err, data) {
        if (err) {
            reject(Error("Error creating API Key"), err, err.stack);
        }
        else {
            console.log(data);
            resolve(data);
        }
    });

});
