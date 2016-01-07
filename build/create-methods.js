var treeify = require('file-tree-sync');
var rread = require('readdir-recursive');
var _ = require('lodash');
var apiDir = require('config').apiDir || 'api'; //default is "api"
var methodDir = process.cwd() + '/' + apiDir;
var AWS = require('../aws-setup');
var Promise = require('promise');

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

    this.getResourcePaths = function(paths) {
        var subPaths = _.filter(paths, function(path) {
            return path.files !== undefined;
        });

    },

/*
[ 
    { 
        name: 'get.js',
        fullpath: '/Users/jeriksen/projects/amazon/serverless-thing/api/get.js',
        relativePath: 'get.js'
    },
    { 
        name: 'users',
        fullpath: '/Users/jeriksen/projects/amazon/serverless-thing/api/users',
        relativePath: 'users',
        files: [ [Object], [Object] ] 
    } 
]

*/

    this.createOrUpdateResource = function(item, callback) {
        /*
        item: {
            name: 'STRING',
            fullpath: '/full/path/to/resource',
            relativePath: 'path/from/api/folder'
        */
        //does resource exist?
             
    };

    this.createOrUpdateMethodsAndResources = function(tree) {
        _.forEach(tree, function(treeNode){
            
            //its a path for the api
            if(treeNode.files !== undefined) {
                this.createOrUpdateResource(treeNode, function() {
                    this.createOrUpdateMethodsAndResources(treeNode.files).bind(this);
                }); 
            }             
        });
    };

    /* returns an array of resources to create/update */ 
    this.getApiResources = function() {
        //var methodTree = treeify(methodDir, ['.*']);
        var methodTree = rread.dirSync(methodDir);
        //this.createOrUpdateMethodsAndResources(methodTree);            

        console.log("METHOD TREE");
        console.log(methodTree);
        
    };

    this.promise = function(resolve, reject) {
        this.getApiResources();
        
        /*else{
            getAPIs(data)
                .then(function(api){
                    if(api) { 
                        data.api = api;
                        resolve(data);
                    } 
                    else { 
                        this.createAPI(resolve, reject); 
                    }
                })
                .catch(reject);
        }*/
    };

    return new Promise(this.promise);
};

