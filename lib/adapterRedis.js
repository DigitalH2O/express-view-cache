var redis = require('redis'),
    url = require('url');

var config = {
    port:process.env.REDIS_PORT,
    host:process.env.REDIS_HOST,
    db:process.env.REDIS_CACHE_DB
};

var client=redis.createClient(config.port,config.host);
client.select(config.db,function(err){
    if(err) throw err;
});

exports.set = function (key, value, callback, ttlInMs) {
    client.set('expess-view-cache-'+key,value,function(err){
        if(err){
            callback(err);
        } else {
            var ttlInSecond=Math.floor((ttlInMs/1000));
            // i know of
            // http://redis.io/commands/pexpireat
            // http://redis.io/commands/set
            //but i ASUME that user can have older versions of redis, not the 2.6.12!
            client.expire('expess-view-cache-'+key,ttlInSecond,function(err,setted){
                callback(err,true)
            });
        }
    })
}

exports.get = function (key, callback) {
    client.get('expess-view-cache-'+key,callback);
}
