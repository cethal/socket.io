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
    console.log('App listening on http://' + addr.address + ':' + addr.port);
});

/**
 * Socket.IO server (single process only)
 */


/*Connect to mongodb for pushing the data to db*/

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
        console.log('!!!!!!!!!!!!!!',room);
        socket.join(room);
        socket.broadcast.emit('announcement', room + ' created');
    });


    socket.on('user message', function (message) {
        socket.broadcast.emit('user message',message);
    });

    socket.on('nickname', function (nick, fn) {
        console.log('function ',fn);
        if (nicknames[nick])
        {
            console.log('true case',nicknames[nick]);
            fn(true);
        } else
        {
            console.log('false case',nicknames[nick]);

            fn(false);
            nicknames[nick] = socket.nickname = nick;
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
