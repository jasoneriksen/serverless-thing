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

function randomString(len){
    var list = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','s','t','u','v','w','x','y','z','0','1','2','3','4','5','6','7','8','9','0'];
    str = "";
    while (str.length < len) {
        var index = Math.floor(Math.random() * list.length);
        str += list[index];
    }
    return str;
}

module.exports = function(data) {
    console.log('Create Resources');

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

        return parent.id;
    };

    this.createResource = function(node) {
        return new Promise(function(resolve, reject) {
            var resourceParams = {
                parentId: this.getParentId(node.relativePath),
                pathPart: node.name,
                restApiId: data.api.id
            };

            apigateway.createResource(resourceParams, function (error, result) {
                if (error) {
                    console.log("ERROR createResource: ", error);
                    reject(error);
                }
                else {
                    data.remoteResources = data.remoteResources || [];
                    data.remoteResources.push(result);
                    resolve(data);
                }
            });
        });
    };

    this.getLambdaFunctionName = function(node) {
        var relativePath = node.relativePath.replace('/',' ').replace('.js','');
        return _.camelCase(data.api.name + ' ' + relativePath);
    };
    
    this.hasRemote = {
        method: function(node, parent) {
            return new Promise(function( resolve, reject ) {
                var methodType = node.name.split('.')[0].toUpperCase();
                var methodName = this.getLambdaFunctionName(node);
                lambda.getFunction({ FunctionName: methodName }, function(err, result) {
                    resolve(!err);
                });
            });
        },
        resource: function(node, parent) {
            return new Promise(function( resolve, reject ) {
                var hasRemote = _.findWhere(data.remoteResources, { 
                    'path': '/' + node.relativePath
                }) !== undefined;
                resolve(hasRemote);
            });
        }
    };

    this.syncRemoteItem = function( type, node, parent ) {
        return new Promise(function( resolve, reject ) {
            this.hasRemote[type](node, parent)
                .then(function(hasRemote) {

                    var changeRemote = hasRemote
                        ? this.updateRemote
                        : this.createRemote;
                    changeRemote[type](node, parent)
                        .then(resolve)
                        .catch(function(err){
                            console.log("ERROR syncRemoteItem: ", err);
                            reject(err);
                        });
                });
        }); 
    };

    this.makeZip = function(filePath) {
        var zip = new AdmZip();
        zip.addLocalFile(filePath);
        return zip.toBuffer();
    };
   
    /* receives data as a buffer */ 
    this.encodeToBase64 = function(buff) {
        var base64data = buff.toString('base64');
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
                    console.log("ERROR updateLambdaFunction: ");
                    console.log(err, err.stack);
                    reject(err);
                }
                else {
                    this.addPermissionsToLambdaFunction(result, updateParams, resolve, reject);
                }
            }.bind(this));
        });
    };
   
    this.addPermissionsToLambdaFunction = function(result, lambdaParams, resolve, reject) {
            var params = {
                Action: 'lambda:InvokeFunction',
                FunctionName: lambdaParams.FunctionName,
                Principal: 'apigateway.amazonaws.com',
                StatementId: lambdaParams.FunctionName.split(':').pop() + randomString(32),
            };
            lambda.addPermission(params, function(err, res) {
                if(err) {
                    console.log("ERROR addPermissionsToLambdaFunction: ", err);    
                    reject(err);
                }
                else {
                    resolve(result);
                }
            });
    };
 
    this.createLambdaFunction = function(zipBuffer, moduleName, functionName) {
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

        return new Promise(function(resolve, reject) {
            lambda.createFunction(createParams, function(err, result) {
                if (err) {
                    console.log("ERROR createLambdaFunction: ");
                    console.log(err, err.stack);
                    reject(err);
                }
                else {
                    data.remoteLambdaFunctions = data.remoteLambdaFunctions || [];
                    data.remoteLambdaFunctions.push(result);
                    this.addPermissionsToLambdaFunction(result, createParams, resolve, reject);
                }
            }.bind(this));
        }.bind(this));
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
   
    //a passthrough 
    this.updateAPIMethod = function(lambdaFunction, node, parent, method) {
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

        return new Promise(function(resolve, reject) {
            apigateway.putIntegration(params, function(err, result) {
                if (err) {
                    console.log("ERROR: ", err);
                    reject(err);
                }
                else this.addIntegrationResponse(params, resolve, reject);
            }.bind(this));
        }.bind(this));
    };

    this.addIntegrationResponse = function(methodParams, resolve, reject){
        var params = {
            httpMethod: methodParams.httpMethod,
            resourceId: methodParams.resourceId,
            restApiId: methodParams.restApiId,
            statusCode: '200',
            selectionPattern: '2\d{2}'
        };
        apigateway.putIntegrationResponse(params, function(err, res) {
            if (err){
                console.log("ERROR addIntegrationRespones: ", err);
                reject(err);
            }
            else {
                resolve(data);
            }
        });
    };
    
    this.linkAPIMethodToLambdaFunction = function(lambdaFunction, node, parent) {
        return new Promise(function(resolve, reject) {
            this.hasAPIMethod(this.getMethodType(node), this.getParentId(node.relativePath))
                .then(function(method){
                    if(method) {
                        this.updateAPIMethod(lambdaFunction, node, parent, method)
                            .then(function(newMethod){
                                this.addLambdaIntegrationToAPIFunction(lambdaFunction, node)
                                    .then(resolve)
                                    .catch(function(err){
                                        console.log("ERROR: ", err);
                                        reject(err);
                                    });
                            })
                            .catch(reject);
                    } else {
                        this.createAPIMethod(lambdaFunction, node, parent)
                            .then(function(newMethod){
                                this.addLambdaIntegrationToAPIFunction(lambdaFunction, node)
                                    .then(resolve)
                                    .catch(function(err){
                                        console.log("ERROR: ", err);
                                        reject(err);
                                    });
                            })
                            .catch(reject);
                    }
                })
                .catch(reject);
        });
    };

    this.createAPIMethod = function(lambdaFunction, node, parent) {
        return new Promise(function(resolve, reject) {
            var params = {
                authorizationType: 'NONE',
                httpMethod: this.getMethodType(node),
                resourceId: this.getParentId(node.relativePath),
                restApiId: data.api.id,
                apiKeyRequired: false
            };
            apigateway.putMethod(params, function(err, result) {
                if (err) {
                    console.log("ERROR createApiMethod ", err);
                    reject(err);
                }
                else resolve(result);
            });
        });
    };

    this.updateRemote = {
        method: function(node, parent) {

            return new Promise(function(resolve, reject) {
                var zipData = this.encodeToBase64(
                    this.makeZip(node.fullpath)
                );
                this.updateLambdaFunction(zipData, this.getLambdaFunctionName(node))
                    .then(function(result){
                        linkAPIMethodToLambdaFunction(result, node, parent)
                            .then(resolve)
                            .catch(function(err){
                                console.log("ERROR: linkAPIMethodToLambdaFunction: ", err);
                                reject(err);
                            });
                    })
                    .catch(function(err){
                        console.log("ERROR: updateLambdaFunction: ", err);
                        reject(err)
                    });
            }); 
        },
        resource: function(node, parent) {
            return new Promise(function(resolve, reject) {
                    this.traverseMethodTree(node.files, node)
                    .then(resolve)
                    .catch(function(err) {
                        console.log("ERROR updateRemote: ", err);
                        reject(err);
                    });
            }); 
        }
    };

    this.createRemote = {
        method: function(node, parent) {
            return new Promise(function(resolve, reject) {
                var zipData = this.encodeToBase64(
                    this.makeZip(node.fullpath)
                );
                this.createLambdaFunction(zipData, node.name.replace('.js',''), this.getLambdaFunctionName(node))
                    .then(function(result){
                        linkAPIMethodToLambdaFunction(result, node, parent)
                            .then(resolve)
                            .catch(function(err) {
                                console.log("ERROR createRemote: ", err);
                                reject(err);
                            });
                    })
                    .catch(reject);
            }); 
        },
        resource: function(node, parent) {
            return new Promise(function(resolve, reject) {
                this.createResource(node)
                    .then(function(){ this.traverseMethodTree(node.files, node);})
                    .then(resolve)
                    .catch(function(err) {
                        console.log("ERROR createResource: ", err);
                        reject(err);
                    });
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
    this.processNode = function(tree, index, parent) {
        var node = tree[index];

        return new Promise( function(resolve, reject) {
            this.syncRemoteItem(this.getItemType(node), node, parent)
                .then(function(){
                    index += 1;
                    if(index >= tree.length) {
                        resolve(data);
                    }
                    else this.processNode(tree, index, parent); 
                })
                .catch(function(err){
                    console.log("ERROR syncRemoteItem: ", err);
                    reject(err);
                });
        });
    };

    this.traverseMethodTree = function(tree, parent) {
        return new Promise( function(resolve, reject) {
            this.processNode(tree, 0, parent)
            .then(function(){
                resolve(data);
            })
            .catch(function(err){
                console.log("ERROR processNode: ", err); 
                reject(err);
            });
        });
    };

    this.promise = function(resolve, reject) {
        data.methodTree = this.getMethodTree();
        var parent = {
            relativePath: ''    
        };
        this.traverseMethodTree(data.methodTree, parent)
        .then(function(){
            console.log('resolve');
            resolve(data);
        })
        .catch(function(err){
            console.log("ERROR: ", err); 
            reject(err);

        });
    };

    return new Promise(this.promise);
};


