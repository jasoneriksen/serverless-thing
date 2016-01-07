#Serverless Thing 
(a working title)

The end goal is a script that deploys an app to AWS that runs without the need for a virtual server.


##Benefits

####Costs 
Deploying in this manner should be good for keeping costs down if you have a small app without a lot of usage. Lambda functions are billed down to 100ms increments, and on the frontend the costs to host content through S3 are pretty minimal if you're not serving up big files. At the small usage end, Lambda is extremely cheap to use. On a larger application, the cost markup for Lambda could end up outweighing the savings of not managing servers.

####Scalability
Since an app deployed in this manner is running on the Amazon infrastructure, it should be able to scale to handle larger traffic spikes without any fuss.

##Drawbacks

####Vendor Lock-in
Since this script specifically targets the AWS platform, there's an obvious vendor lock-in situation that may not be suitable for some applications. TODO: abstract away some of the AWS specifics in the API->Client interface to allow more portability.

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

####Deploy

Make sure config/default.json is setup with AWS credentials, etc.

From main directory, run 
`node deploy.js`


