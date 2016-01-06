var getLambdaBucketName = function(data) {
    return (data.api.name + data.account.accountId + 'lambdafunctions').toLowerCase();
};

module.exports = {
    getLambdaBucketName: getLambdaBucketName
};
