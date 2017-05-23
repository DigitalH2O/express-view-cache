var crypto = require('crypto'),
    adapterMemory = require('./lib/adapterMemory.js'),
    adapterMemJS = require('./lib/adapterMemJS.js'),
    adapterRedis = require('./lib/adapterRedis.js');

// Caching middleware for Express framework
// details are here https://github.com/vodolaz095/express-view-cache

module.exports=function(invalidateTimeInMilliseconds,parameters){
    if(invalidateTimeInMilliseconds && /^\d+$/.test(invalidateTimeInMilliseconds)){
        //it is ok
    } else {
        invalidateTimeInMilliseconds=60*1000; //1 minute
    }
    cache = adapterRedis;
    cacheKey = parameters.cacheKey || 'originalUrl';
    return function(request,response,next){
        if(parameters && parameters.type){
            response.type(parameters.type);
        }
        if (request.method == 'GET') {
            cache.get(request[cacheKey] + request['originalUrl'],function(err,value){
                if(value){
                    console.log('[CACHE] HIT: GET '+request[cacheKey]+request['originalUrl']);
                    // TODO: Add max-age here
                    response.header('Cache-Control', 'private, no-cache');
                    response.send(value);
                    return true;
                } else {
                    var end = response.end;
                    response.end = function(chunk, encoding){
                        response.end = end;
                        response.on('finish',function(){
                            if (this.statusCode === 200) {
                                cache.set(request[cacheKey]+request['originalUrl'],chunk,function(err,result){
                                    if(err) throw err;
                                    if(result){
                                        console.log('[CACHE] SAVED: GET '+request[cacheKey]+request['originalUrl']);
                                    } else {
                                        console.log('[CACHE] ERROR SAVING: GET '+request[cacheKey]+request['originalUrl'])
                                    }
                                },invalidateTimeInMilliseconds);
                            } else {
                                console.log("[CACHE] RESPONSE CODE WAS "+this.statusCode+", NOT CACHING");
                            };
                        });
                        // TODO: Add max-age here
                        response.header('Cache-Control', 'private, no-cache')
                        response.end(chunk, encoding);
                    };
                    return next();
                }
            });
        } else {
            return next();
        }
    }
}
