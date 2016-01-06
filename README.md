#Serverless Thing 
(a working title)

The end goal is a script that deploys an app to AWS that runs without the use of some needy virtual server. 


##Benefits

####Costs 
Deploying in this manner should be good for keeping costs down if you have a tiny little mico app without a lot of usage. Lambda functions are billed down to 100ms increments, and on the frontend the costs to host content through S3 are pretty minimal if you're not serving up big files.

####Scalability
Since an app deployed in this manner is running on the large Amazon infrastructure, it should be able to scale seamlessly without the need to manage load balancers or spin up additional servers to handle traffic spikes.


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
