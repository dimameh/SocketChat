var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

server.listen(3000);

app.use(express.static(__dirname));

app.get('/', function (request, response){
  response.sendFile(__dirname + '/index.html');
});

//Юзеры в чате //TODO: запилить фитчу для логов.
users = [];
//Подключения на данный момент
connections = [];

io.sockets.on('connection', function(socket){
  console.log("Новый юзер подключился");
  connections.push(socket);

  //----------события для каждого нового сокета-----------

  socket.on('disconnect', function(data){
    connections.splice(connections.indexOf(socket), 1);
    console.log("Юзер отключился");
  });

  socket.on('send_message', function(data){
    //вызываем событие и передаем в событие объект
    io.sockets.emit('add_new_message', {message : data.message, login : data.login});
    console.log(data.login + " Отправил сообщение");
  });

});
