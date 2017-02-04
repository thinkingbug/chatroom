var socketio = require('socket.io');
var io;
var guestNumber = 1;
var nickNames = {};
var namesUsed = [];
var currentRoom = {};
var hasRooms = {};

/**
 * 分配昵称
 * @param socket
 * @param guestNumber
 * @param nickNames
 * @param nameUsed
 * @returns {*}
 */
function assignGuestName(socket, guestNumber, nickNames, nameUsed) {
    var username = 'Guest' + guestNumber;
    nickNames[socket.id] = username;
    socket.emit('nameResult', {status : 1, name : username});
    nameUsed.push(username);
    return guestNumber + 1;
}



/**
 * 进入房间方法
 * @param socket
 * @param room
 */
function joinRoom(socket, room) {
    socket.join(room); //让用户进入默认房间
    if( !hasRooms[room] ){
        hasRooms[room] = true;
    }
    currentRoom[socket.id] = room;  //记录用户当前房间
    socket.emit('joinResult', {room : room}); //通知用户进入了新房间
    socket.broadcast.to(room).emit('message', {text : nickNames[socket.id] + "进入" + room + "房间了"}); //让房间内其他用户知道新用户进入
    var userInRoom = io.sockets.adapter.rooms[room];
    if(userInRoom.length > 1) {
        var iter = 0;
        var currentUser = room + '当前在线用户：';
        for(var index in userInRoom.sockets) {
            var userSocketId = index;
            if(userSocketId != socket.id) {
                if(iter > 0) {
                    currentUser += ', ';
                }
                currentUser += nickNames[userSocketId];
            }
            iter++;
        }
        currentUser += '。';
        socket.emit('message', {text : currentUser});
    }

}


/**
 * 用户名修改
 * @param socket
 * @param nickNames
 * @param namesUsed
 */
function handleNameChangeAttempts(socket) {
    socket.on("modifyName", function (name) {
        if(name.indexOf('Guest') == 0) {
            socket.emit("nameResult", {
                status : 0,
                message : "昵称不能以Guest开头"
            });
        }else{
            if( namesUsed.indexOf(name) === -1 ) {
                var previousName = nickNames[socket.id]; //查询之前的用户名
                var previousNameIndex = namesUsed.indexOf( previousName );
                namesUsed.push(name);
                nickNames[socket.id] = name;
                namesUsed.splice(previousNameIndex, 1);
                // delete namesUsed[previousNameIndex]; //防止溢出
                socket.emit("nameResult", {
                    status : 1,
                    name : name
                });

                socket.broadcast.to(currentRoom[socket.id]).emit("message", {text : "用户" + previousName + "已更改为" + name});
            }else{
                socket.emit("nameResult", {
                    status : 0,
                    message : "修改的昵称已存在"
                });
            }
        }
    });
}


function handleMessageBroadcasting(socket) {
    socket.on("message", function (message) {
        socket.broadcast.to( message.room ).emit("message", {text : nickNames[socket.id] + ":" + message.text} );
    });
}

function handleRoomJoining( socket ) {
    socket.on("join", function (room) {
        socket.leave(currentRoom[socket.id]);
        joinRoom(socket, room.newRoom);
    })
}

function handleClientDisconnection( socket ) {
    socket.on("disconnect", function () {
        var nameIndex = namesUsed.indexOf( nickNames[socket.id] );
        delete namesUsed[nameIndex];
        delete nickNames[socket.id];
    });
}

exports.listen = function ( server ) {
    io = socketio.listen(server);

    io.sockets.on("connection", function ( sokt ) {

        guestNumber = assignGuestName(sokt, guestNumber, nickNames, namesUsed); //用户连接上来给予一个用户名
        joinRoom(sokt, "王者荣耀技术分享"); //默认加入聊天室
        handleMessageBroadcasting( sokt ); //处理用户的消息
        handleNameChangeAttempts( sokt ); //处理用户更名
        handleRoomJoining( sokt ); //处理用户的聊天室创建变更

        sokt.on('rooms', function () {
            sokt.emit( 'rooms', hasRooms );
        });

        handleClientDisconnection(sokt); //定义用户断开后处理
    });
};