#Serverless Thing 
(a working title)

The end goal is a script that deploys an app to AWS that runs without the use of a needy virtual server.

##Summary

####Frontend
S3, cloudfront. Static assets, html, css, images, js.

####API
Gateway API endpoints that can be called RESTfully. Each endpoint is backed by a Lambda function that handles the business logic.

####Database
DynamDB


##Status
A basic deployment to S3, Gateway API and Lambda is happening. The script is still very crude.

##Instructions

Clone the app

The RESTful api goes in the api directory. Name each subdirectory according to the desired URL. To respond to a POST request, create a post.js file inside a given directory, GET get.js, etc. These functions currently have to be self contained. TODO add support for deploying and calling helper Lambda functions from inside API methods.

The client goes in the public folder

To call API from client: TODO add instructions for calling API endpoints from client
