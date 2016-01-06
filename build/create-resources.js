var AWS = require('../aws-setup');
var Promise = require('promise');
var AdmZip = require('adm-zip');
var _ = require('lodash');
var config = require('config');
var region = config.region || 'us-east-1';
var apiDir = config.apiDir || 'api';
var methodDir = process.cwd() + '/' + apiDir;
var treeify = require('file-tree-sync');
var rread = require('readdir-recursive');
var getResources = require('./get-resources');
var apigateway = new AWS.APIGateway();
var lambda = new AWS.Lambda();

module.exports = function(data) {

    this.getMethodTree = function() {
        return treeify(methodDir, ['.*']);
    };
   
    this.getMethodType = function(node) {
        return node.name.toUpperCase().split('.')[0]; 
    };

    this.getParentId = function(path) {
        //users/subDir
        var parentPath = '/' + path.split('/').slice(0,-1).join('/');
        var parent = _.filter(data.remoteResources, function(resource) {
            return resource.path === parentPath; 
        })[0];

        console.log("GET PARENT ID");
        console.log(path);
        console.log(parentPath);
        console.log(parent.id);
        return parent.id;
    };

    this.createResource = function(node) {
        return new Promise(function(resolve, reject) {
            var resourceParams = {
                parentId: this.getParentId(node.relativePath),
                pathPart: node.name,
                restApiId: data.api.id
            };

            console.log("CREATE RESOURCE PARAMS:");
            console.log(resourceParams);

            apigateway.createResource(resourceParams, function (error, result) {
                if (error) {
                    reject("ERROR creating Resource", error);
                }
                else {
                    console.log("CREATED RESOURCE");
                    console.log(result);
                    data.remoteResources = data.remoteResources || [];
                    data.remoteResources.push(result);
                    resolve(data);
                }
            });
        });
    };

    this.deleteUnusedResources = function() {
         
    };


    this.getLambdaFunctionName = function(node) {
        var relativePath = node.relativePath.replace('/',' ').replace('.js','');
        return _.camelCase(data.api.name + ' ' + relativePath);
    };
    
    this.hasRemote = {
        method: function(node, parent) {
            console.log("HAS REMOTE METHOD?");
            return new Promise(function( resolve, reject ) {
                console.log("GET FUNCTION B4");
                var methodType = node.name.split('.')[0].toUpperCase();
                var methodName = this.getLambdaFunctionName(node);
                console.log(methodName);
                lambda.getFunction({ FunctionName: methodName }, function(err, result) {

                    console.log("GET FUNCTION ERR RES:");
                    console.log(err);
                    console.log(result);

                    resolve(!err);
                });
            });
        },
        resource: function(node, parent) {
            console.log("HAS REMOTE RESOURCE?");
            return new Promise(function( resolve, reject ) {
                var hasRemote = _.findWhere(data.remoteResources, { 
                    'path': '/' + node.relativePath
                }) !== undefined;
                resolve(hasRemote);
            });
        }
    };

    this.syncRemoteItem = function( type, node, parent ) {
        console.log("SYNC REMOTE ITEM");
        console.log(type);
        console.log(node);
        console.log(parent);
        return new Promise(function( resolve, reject ) {
            this.hasRemote[type](node, parent)
                .then(function(hasRemote) {
                    console.log("HAS REMOTE:");
                    console.log(hasRemote);

                    var changeRemote = hasRemote
                        ? this.updateRemote
                        : this.createRemote;
                    changeRemote[type](node, parent)
                        .then(resolve)
                        .catch(reject)
                });
        }); 
    };

    this.makeZip = function(filePath) {
        console.log("MAKE ZIP");
        var zip = new AdmZip();
        zip.addLocalFile(filePath);
        return zip.toBuffer();
    };
   
    /* receives data as a buffer */ 
    this.encodeToBase64 = function(buff) {
        console.log("ENCODE TO BASE 64");
        var base64data = buff.toString('base64');
        console.log("BUFF TO STRING:");
        //return base64data;
        return buff;
    };

    this.updateLambdaFunction = function(zipBuffer, functionName) {
        return new Promise(function(resolve, reject) {
            var lambdaFunctionName = 'arn:aws:lambda:' + region + ':' + config.account.accountId + ':function:' + functionName;
            var updateParams = {
                FunctionName: lambdaFunctionName,
                Publish: true,
                ZipFile: zipBuffer
            };
            lambda.updateFunctionCode(updateParams, function(err, result) {
                if (err) {
                    console.log("ERROR UPDATING LAMBDA FUNCTION");
                    console.log(err, err.stack);
                    reject(err);
                }
                else {
                    console.log("UPDATED LAMBDA FUNCTION");
                    console.log(result);
                    resolve(result);
                }
            });
        });
    };
    
    this.createLambdaFunction = function(zipBuffer, moduleName, functionName) {

        console.log("CREATING LAMBDA FUNCTION");
        var lambdaFunctionName = 'arn:aws:lambda:' + region + ':' + config.account.accountId + ':function:' + functionName;
        var createParams = { 
            Code: { 
                ZipFile: zipBuffer
            },
            FunctionName: lambdaFunctionName,
            Handler: moduleName + '.handler',
            Role: 'arn:aws:iam::' + config.account.accountId + ':role/lambda_basic_execution',
            Runtime: 'nodejs', 
            Description: 'API endpoint: ' + functionName,
            MemorySize: 128,
            Publish: true,
            Timeout: 3 
        };

        console.log("PARAMS");

        return new Promise(function(resolve, reject) {
            lambda.createFunction(createParams, function(err, result) {
                if (err) {
                    console.log("ERROR CREATING LAMBDA FUNCTION");
                    console.log(err, err.stack);
                    reject(err);
                }
                else {
                    console.log("CREATED LAMBDA FUNCTION");
                    console.log(result);
                    data.remoteLambdaFunctions = data.remoteLambdaFunctions || [];
                    data.remoteLambdaFunctions.push(result);

                    resolve(result);
                }
            });
        });
    };

    this.hasAPIMethod = function(method, resourceId) {
        return new Promise(function(resolve, reject) {
            var methodParams = {
                httpMethod: method,
                resourceId: resourceId,
                restApiId: data.api.id
            };
            apigateway.getMethod(methodParams, function(err, result) {
                if (err) resolve(false);
                else {
                    resolve(result); 
                }
            });
        });
    };
    
    this.updateAPIMethod = function(lambdaFunction, node, parent, method) {
        console.log("UPDATE API METHOD (passthrough)");
        return new Promise(function(resolve, reject) {
            resolve(data);
        });
    };

    this.getInvocationArn = function(arn) {
        var prefix = 'arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/';
        var arnSplit = arn.split(':');
        arnSplit.pop();
        return prefix + arnSplit.join(':') + '/invocations';
    };

    this.addLambdaIntegrationToAPIFunction = function(lambdaFunction, node) {
        var methodType = this.getMethodType(node);
        var arn = this.getInvocationArn(lambdaFunction.FunctionArn);
        var params = {
            httpMethod: methodType,
            integrationHttpMethod: methodType,
            resourceId: this.getParentId(node.relativePath),
            restApiId: data.api.id,
            type: 'AWS',
            uri: arn
        };

        console.log('addLambdaIntegrationToAPIFunction');
        console.log(params);

        return new Promise(function(resolve, reject) {
            apigateway.putIntegration(params, function(err, result) {
                if (err) reject(err);
                else resolve(result);
            });
        });
    };
    
    this.linkAPIMethodToLambdaFunction = function(lambdaFunction, node, parent) {
        console.log("LINK API METHOD TO LAMBDA FUNCTION");
        return new Promise(function(resolve, reject) {
            this.hasAPIMethod(this.getMethodType(node), this.getParentId(node.relativePath))
                .then(function(method){
                    console.log("HAS API METHOD RESULT")
                    console.log(method);
                    if(method) {
                        this.updateAPIMethod(lambdaFunction, node, parent, method)
                            .then(function(newMethod){
                                this.addLambdaIntegrationToAPIFunction(lambdaFunction, node)
                                    .then(resolve)
                                    .catch(reject);
                            })
                            .catch(reject);
                    } else {
                        this.createAPIMethod(lambdaFunction, node, parent)
                            .then(function(newMethod){
                                this.addLambdaIntegrationToAPIFunction(lambdaFunction, node)
                                    .then(resolve)
                                    .catch(reject);
                            })
                            .catch(reject);
                    }
                })
                .catch(reject);
        });
    };

    this.createAPIMethod = function(lambdaFunction, node, parent) {
        console.log("CREATE API METHOD");
        return new Promise(function(resolve, reject) {
            var params = {
                authorizationType: 'NONE',
                httpMethod: this.getMethodType(node),
                resourceId: this.getParentId(node.relativePath),
                restApiId: data.api.id,
                apiKeyRequired: false
            };
            apigateway.putMethod(params, function(err, result) {
                if (err) reject(err);
                else resolve(result);
            });
        });
    };

    this.updateRemote = {
        method: function(node, parent) {
            console.log("UPDATE REMOTE METHOD");
            console.log(node);
            console.log(parent);

            return new Promise(function(resolve, reject) {
                var zipData = this.encodeToBase64(
                    this.makeZip(node.fullpath)
                );
                this.updateLambdaFunction(zipData, this.getLambdaFunctionName(node))
                    .then(function(result){
                        linkAPIMethodToLambdaFunction(result, node, parent)
                            .then(resolve)
                            .catch(reject);
                    })
                    .catch(reject);
            }); 
        },
        resource: function(node, parent) {
            console.log("UPDATE REMOTE RESOURCE");
            console.log(node);
            console.log(parent);
            return new Promise(function(resolve, reject) {
                    this.traverseMethodTree(node.files, node)
                    .then(resolve)
                    .catch(reject);
            }); 
        }
    };

    this.createRemote = {
        method: function(node, parent) {
            console.log("CREATE REMOTE METHOD");
            
            return new Promise(function(resolve, reject) {
                var zipData = this.encodeToBase64(
                    this.makeZip(node.fullpath)
                );
                console.log("CREATE LAMBDA FUNCTION");
                this.createLambdaFunction(zipData, node.name.replace('.js',''), this.getLambdaFunctionName(node))
                    .then(function(result){
                        linkAPIMethodToLambdaFunction(result, node, parent)
                            .then(resolve)
                            .catch(reject);
                    })
                    .catch(reject);
            }); 
        },
        resource: function(node, parent) {
            console.log("CREATE REMOTE RESOURCE");
            console.log(node);
            console.log(parent);
            
            return new Promise(function(resolve, reject) {
                this.createResource(node)
                    .then(function(){ this.traverseMethodTree(node.files, node);})
                    .then(resolve)
                    .catch(reject);
            }); 
        }
    };

    this.getItemType = function(node) {
        if(node.name.match('.js')) {
            return 'method'; 
        } else {
            return 'resource'; 
        }
    };

    /* passed with a node and a parent
     * node has {
     *  name: 'get.js',
     *  path: 'full/path/to/file/get.js',
     *  relativePath: 'get.js'
     * }
     * 
     * parent is a node
     *
     */
    this.processNodes = function(tree, index, parent) {
        var node = tree[index];
        return new Promise( function(resolve, reject) {
            this.syncRemoteItem(this.getItemType(node), node, parent)
                .then(function(){
                    index += 1;
                    if(index >= tree.length) resolve(data);
                    else this.processNodes(tree, index, parent); 
                })
                .catch(reject);
        });
    };

    this.traverseMethodTree = function(tree, parent) {
        return new Promise( function(resolve, reject) {
            console.log("ENTERING LOOP");
            console.log(tree[0]);
            this.processNodes(tree, 0, parent)
                .then(function(){resolve(data);})
                .catch(reject);
        });
    };

    this.promise = function(resolve, reject) {
        data.methodTree = this.getMethodTree();
        var parent = {
            relativePath: ''    
        };
        console.log("TRAVERSING MAIN METHOD TREE");
        this.traverseMethodTree(data.methodTree, parent)
            .then(function(){
                console.log("DONE TRAVERSING MAIN METHOD TREE"); 
                resolve(data);
            })
            .catch(reject);
    };

    return new Promise(this.promise);
};


