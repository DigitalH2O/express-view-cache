var vows = require('vows'),
    middleware = require('./../index.js'),
    adapterMemory = require('./../lib/adapterMemory.js'),
    assert = require('assert');

vows.describe('Middleware tests').
    addBatch({
        "General tests":{
            "topic":{
                "middleware":middleware,
                "request1st":{'originalUrl':'/index.html', 'method':'GET'},
                "request2nd":{'originalUrl':'/index1.html', 'method':'GET'},
                "request3rd":{'originalUrl':'/index3.html', 'method':'GET'},
                "response1st":{
                    'header':function (header) {
                        console.log('Header set in response 1');
                        assert.equal(header, 'Cache-Control', "public, max-age=60, must-revalidate");
                    },
                    'send':function (content) {
                        assert.equal(content, 'index_html')

                    },
                    'statusCode': 200,
                    'method': 'GET'
                },
                "response2nd":{
                    'header':function (header) {
                        console.log('Header set in response 2');
                        assert.equal(header, 'Cache-Control', "public, max-age=60, must-revalidate");
                    },
                    'send':function (content) {
                        //assert.equal(content, 'index_html')
                    },
                    'statusCode': 200
                },
                "response3rd":{
                    'header':function (header) {
                        console.log('Header set in response 2');
                        assert.equal(header, 'Cache-Control', "public, max-age=60, must-revalidate");
                    },
                    'send':function (content) {
                        //assert.equal(content, 'index_html')
                    },
                    'statusCode': 400,
                    'method': 'GET'
                },
                "next1st":function () {
                    throw new Error('Next is called when cached! It is not right!')
                },
                "next2nd":function () {
                    console.log('Next2nd called!')
                },
                "next3rd":function () {
                    console.log('Next3rd called!')
                }
            },
            "It should be a function":function (topic) {
                assert.isFunction(topic.middleware);
            },
            "It should cache GET requests":function (topic) {
                adapterMemory.set('/index.html', 'index_html', function (err, result) {
                    if (err) throw err;
                    assert.ok(result,'Saving result to cache returned not true!');
                    var f = topic.middleware;
                    f(topic.request1st, topic.response1st, topic.next1st);
                }, 1000);
            },
            "It should invalidate old requests":function (topic) {
                adapterMemory.set('/index1.html', 'index_html', function (err, result) {
                    if (err) throw err;
                    setTimeout(function () {
                        assert.ok(result,'Saving result to cache returned not true!');
                        var f = topic.middleware;
                        f(topic.request2nd, topic.response2nd, topic.next2nd);
                    }, 2000);
                }, 1000);
            },
            "It should ignore not GET requests":function(topic){
                var f = topic.middleware;
                f({'originalUrl':'/doSomething', 'method':'POST'}, topic.response2nd, topic.next2nd);
                f({'originalUrl':'/doSomething', 'method':'PUT'}, topic.response2nd, topic.next2nd);
                f({'originalUrl':'/doSomething', 'method':'DELETE'}, topic.response2nd, topic.next2nd);
                f({'originalUrl':'/doSomething', 'method':'OPTIONS'}, topic.response2nd, topic.next2nd);
            },
            "It should not cache non-200 response codes":function (topic) {
                var f = topic.middleware;
                f(topic.request3rd, topic.response3rd, topic.next3rd);
                adapterMemory.get('/index3.html', function (err, result) {
                    assert.equal(result, null);
                });
            },
        }
    }).
    export(module);
