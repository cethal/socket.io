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
    , users = {};


io.sockets.on('connection', function(socket){
    socket.on('new user', function(data, callback){

        console.log('data format',data);
        if (data in users){
            callback(false);
        } else{
            callback(true);
            socket.nickname = data;
            users[socket.nickname] = socket;
            updateNicknames();
        }
    });

    function updateNicknames(){
        io.sockets.emit('usernames', Object.keys(users));
    }


    function createGroup()
    {

        socket.on('createRoom', function (data, callback) {
            socket.join(data);

        })
    }

    function listRooms()
    {
        socket.on('listRooms', function(data,callback){
            console.log('listing all rooms',callback.manager);
        })
    }
    socket.on('send message', function(data, callback){
        var msg = data.trim();
        console.log('after trimming message is: ' + msg);
        if(msg.substr(0,3) === '/w '){
            msg = msg.substr(3);
            var ind = msg.indexOf(' ');
            if(ind !== -1){
                var name = msg.substring(0, ind);
                var msg = msg.substring(ind + 1);
                if(name in users){
                    users[name].emit('whisper', {msg: msg, nick: socket.nickname});
                    console.log('message sent is: ' + msg);
                    console.log('Whisper!');
                } else{
                    callback('Error!  Enter a valid user.');
                }
            } else{
                callback('Error!  Please enter a message for your whisper.');
            }
        } else{
            io.sockets.emit('new message', {msg: msg, nick: socket.nickname});
        }
    });

    socket.on('disconnect', function(data){
        if(!socket.nickname) return;
        delete users[socket.nickname];
        updateNicknames();
    });
});