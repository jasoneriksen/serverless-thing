var AWS = require('aws-sdk'); 
var accountConfig = require('config').account;
AWS.config.update(accountConfig);
module.exports = AWS;
