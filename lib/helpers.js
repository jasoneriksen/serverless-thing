var getLambdaBucketName = function(data) {
    return (data.api.name + data.account.accountId + 'lambdafunctions').toLowerCase();
};

var getPublicBucketName = function(data) {
    return (data.api.name + data.account.accountId + 'publicContent').toLowerCase();
};

module.exports = {
    getLambdaBucketName: getLambdaBucketName,
    getPublicBucketName: getPublicBucketName,
};
