
const http = require("http");

const fs = require("fs");

const path = require("path");

const mime = require("mime");

var cache = {};


/**
 * 发送请求的不存在页面信息
 * @param response
 */
function send404( response ) {
    response.writeHead(404, {'Content-Type' : 'text/plain'} );
    response.write('Error 404, Resource Is Not Found');
    response.end();
}


/**
 * 发送请求的HTML文件
 * @param response
 * @param filepath
 * @param fileContents
 */
function sendFile(response, filepath, fileContents) {
    response.writeHead(200, {
        'content-type' : mime.lookup( path.basename( filepath ) )
    });
    response.end(fileContents);
}

/**
 * 已缓存则返回它。还没缓存，则从硬盘中读取并返回它
 * @param response
 * @param cache
 * @param absPath
 */
function serverStatic(response, cache, absPath) {
    if(cache[absPath]) {
        sendFile(response, absPath, cache[absPath]);
    }else{
        if( fs.stat(absPath, function (err, stats) {
            if( !err ) {
                fs.readFile(absPath, function (err, data) {
                    if( err ) {
                        send404(response);
                    }else{
                        cache[absPath] = data;
                        sendFile(response, absPath, data);
                    }
                });
            }else{
                send404(response);
            }
        }));
    }
}


var server = http.createServer(function (request, response) {
    var filePath = false;

    if(request.url === '/') {
        filePath = 'public/index.html';
    }else{
        filePath = 'public' + request.url;
    }

    var absPath = './' + filePath;

    serverStatic(response, cache, absPath);

});


server.listen(8080, function () {
    console.log("Server Listening On 8080");
});


var chatServer = require('./lib/chat_server.js');

chatServer.listen(server);