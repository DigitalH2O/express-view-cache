var crypto = require('crypto'),
    adapterMemory = require('./lib/adapterMemory.js'),
    adapterMemJS = require('./lib/adapterMemJS.js'),
    adapterRedis = require('./lib/adapterRedis.js');

// Caching middleware for Express framework
// details are here https://github.com/vodolaz095/express-view-cache

//returns a unique hash based on the passed string
var getHash = function(stringToHash) {
    return crypto.createHash('sha256').update(stringToHash).digest('hex');
};


module.exports=function(invalidateTimeInMilliseconds,parameters){
    if(invalidateTimeInMilliseconds && /^\d+$/.test(invalidateTimeInMilliseconds)){
        //it is ok
    } else {
        invalidateTimeInMilliseconds=60*1000; //1 minute
    }
    cache = adapterRedis;

    return function(request,response,next){
        if(parameters && parameters.type){
            response.type(parameters.type);
        }
        if (request.method == 'GET') {
            cache.get(request.originalUrl,function(err,value){
                if(value){
                    console.log('[CACHE] HIT: GET '+request.originalUrl);
                    // TODO: Add max-age here
                    var contentHash = getHash(value);
                    console.log(contentHash);
                    if (request.get('ETag') === contentHash) {
                        console.log("SENT ETAG!");
                        response.status(304).end();
                        return true;
                    }
                    response.header('Cache-Control', 'private, no-cache');
                    response.header('ETag', contentHash);
                    console.log(response.header('ETag'));
                    response.send(value);
                    return true;
                } else {
                    var end = response.end;
                    response.end = function(chunk, encoding){
                        response.end = end;
                        response.on('finish',function(){
                            if (this.statusCode === 200) {
                                cache.set(request.originalUrl,chunk,function(err,result){
                                    if(err) throw err;
                                    if(result){
                                        console.log('[CACHE] SAVED: GET '+request.originalUrl);
                                    } else {
                                        console.log('[CACHE] ERROR SAVING: GET '+request.originalUrl)
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
