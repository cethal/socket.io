/**
 * Module dependencies.
 */

var express = require('express')
    , stylus = require('stylus')
    , nib = require('nib')
    , sio = require('../../lib/socket.io')
    , mongoose=require('mongoose');
/**
 * App.
 */

var app = express.createServer();

/**
 * App configuration.
 */

app.configure(function () {
    app.use(stylus.middleware({ src: __dirname + '/public', compile: compile }));
    app.use(express.static(__dirname + '/public'));
    app.set('views', __dirname);
    app.set('view engine', 'jade');

    function compile (str, path) {
        return stylus(str)
            .set('filename', path)
            .use(nib());
    };
});

/**
 * App routes.
 */

app.get('/', function (req, res) {
    res.render('index', { layout: false });
});

/**
 * App listen.
 */

app.listen(3000, function () {
    var addr = app.address();
    console.log('   app listening on http://' + addr.address + ':' + addr.port);
});

/**
 * Socket.IO server (single process only)
 */



mongoose.connect('mongodb://localhost/chat',function(err){
    if(err)
    {
        throw(err);
    }
    else
    {
        console.log("Connected to Mongodb");
    }
});

var io = sio.listen(app)
    , nicknames = {};

io.sockets.on('connection', function (socket) {
    socket.on('room', function(room) {
        socket.join(room);
    });

    var clients = io.sockets.clients();
    console.log('LIST all clients',clients);
    socket.on('user message', function (message) {
        console.log('message :::::',message);
        // console.log(message.text);
        socket.broadcast.emit('user message',message);


    });

    var room="abc";
    io.sockets.in(room).emit('message', 'what is going on, party people?');

// this message will NOT go to the client defined above
    io.sockets.in('foobar').emit('message', 'anyone in this room yet?');

    socket.on('nickname', function (nick, fn) {

        console.log(nick);
        if (nicknames[nick]) {
            fn(true);
        } else {
            fn(false);
//        console.log('11111111111',nicknames);
//        console.log('22222222222',nick);
//
            nicknames[nick] = socket.nickname = nick;
//        console.log('333333333333',nicknames[nick]);
            socket.broadcast.emit('announcement', nick + ' connected');
            io.sockets.emit('nicknames', nicknames);
        }
    });

    socket.on('disconnect', function () {
        if (!socket.nickname) return;

        delete nicknames[socket.nickname];
        socket.broadcast.emit('announcement', socket.nickname + ' disconnected');
        socket.broadcast.emit('nicknames', nicknames);
    });
});
