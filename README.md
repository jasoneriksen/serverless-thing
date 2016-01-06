#Serverless Thing 
(a working title)

The end goal is a script that deploys an app to AWS and runs without the use of a needy virtual server.

##Summary

####Frontend
S3, cloudfront. Static assets, html, css, images, js.

####API
Gateway API endpoints that can be called RESTfully. Each endpoint is backed by a Lambda function that handles the business logic.

####Database
DynamDB


##Status
A basic deployment to S3, Gateway API and Lambda is happening. The script is still very crude.
