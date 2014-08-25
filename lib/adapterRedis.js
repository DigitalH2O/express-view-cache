var redis = require('redis'),
    url = require('url');

var config = {
    port:process.env.REDIS_PORT || null,
    host:process.env.REDIS_HOST || null,
    db:process.env.REDIS_CACHE_DB || null
};

if (config.port !== null && config.host !== null && config.db !== null){
    var client=redis.createClient(config.port,config.host);
    client.select(config.db,function(err){
        if(err) throw err;
    });
} else {
    var client = null;
}

exports.set = function (key, value, callback, ttlInMs) {
    client.set('expess-view-cache-'+key,value,function(err){
        if(err){
            callback(err);
        } else {
            var ttlInSecond=Math.floor((ttlInMs/1000));
            client.expire('expess-view-cache-'+key,ttlInSecond,function(err,setted){
                callback(err,true)
            });
        }
    })
}

exports.get = function (key, callback) {
    if (client !== null){
        client.get('expess-view-cache-'+key,callback);
    }
}
