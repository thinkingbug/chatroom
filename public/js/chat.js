var Chat = function(socket) {
    this.socket = socket;
}

/**
 * 发送消息
 * @param room
 * @param text
 */
Chat.prototype.sendMessage = function ( room, text ) {
    var message = {
        room : room,
        text : text
    };
    this.socket.emit('message', message);
}

/**
 * 进入创建新房间
 * @param room
 */
Chat.prototype.changRoom = function ( room ) {
    this.socket.emit('join', { newRoom : room });
}

/**
 * 命令修改
 * @param command
 */
Chat.prototype.processCommand = function ( command ) {
    var words = command.split(' ');
    var command = words[0].substring(1, words[0].length);

    var message = false;

    switch (command) {
        case 'join' :
            words.shift();
            var room = words.join(' ');
            this.changRoom(room);
            break;
        case 'nick':
            words.shift();
            var name = words.join(' ');
            this.socket.emit("modifyName", name);
            break;
        default:
            message = "无效命令";
            break;
    }
    return message;
}