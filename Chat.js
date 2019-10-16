//---------- Сервер --------------------------------------------------------------

const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io').listen(server);
const upload = require('express-fileupload');

app.use(upload());

server.listen(3000);

app.use(express.static(__dirname));

//----------------------- Обработка запросов --------------------------------------
//----------------------- GET -------------

app.get('/', function (request, response){
  response.sendFile(__dirname + '/index.html');
});

//----------------------- POST -------------

app.post('/createAccount', function (request, response){
  //TODO: добавить проверки на то что приходит.

  let login = request.body.login;
  let password = request.body.password;
  let file = request.files.filename;

  CreateAccount(login, password);
  SetAvatar(login, file);

  response.send("AccountCreatedSuccessfully");
});

//---------- База данных --------------------------------------------------------------

const mysql = require('mysql');

const options = {
  user: 'root',
  password: '',
  database: 'chat'
}

const connection = mysql.createConnection(options)

connection.connect(error => {
  if (error)
  {
    LogMessage('An error occurred while connecting to the DB');
    throw error;
  }
  else
  {
    LogMessage("Успешное подключение к БД");
  }
});

//---------- Функции сервера --------------------------------------------------------------

function GetLogTime(){
  let date = new Date();
  return '['+ date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds() + ':' + date.getMilliseconds() + ']: ';
}

function LogMessage(message){
  console.log(GetLogTime() + message);
}

//Получить расширение файла без точки. Прим.: jpg
function GetFileExtension(filename){
  return filename.split('.').pop();
}

//Зарегистрировать новый аккаунт
function CreateAccount(login, password){
  //...проверки
  //TODO: Обязательно валидацию логина!!
  //...
  connection.query('INSERT INTO `users` (`login`, `password`, `avatar`, `id`) VALUES (?, ?, NULL, NULL);',[login, password], function(error){
    if(error)
    {
      LogMessage("Ошибка регистрации пользователя: " + error);
      //TODO: Добавить throw и обработчик ошибки добавления пользователя
    }
    else
    {
      LogMessage("Создан аккаунт [login: " + login + "]")
    }
  });
}

//Установить аватар для пользователя под ником login
function SetAvatar(login, file){
  let extension = GetFileExtension(file.name);
  let filePath = "avatars/" + login + '.' + extension;
  file.mv(filePath, function(error){
    if(error)
    {
      LogMessage("Ошибка добавления пользователем [" + login + "] аватара [" + file.name + "]\n\t" + error);
      //TODO: Добавить throw и обработчик ошибки
    }
    else
    {
      LogMessage("Пользователь [" + login + "] установил новый аватар [" + file.name + "]");
    }
  });

  connection.query('UPDATE `users` SET `avatar` = ? WHERE `users`.`login` = 1;', [filePath], function(error){
    if(error)
    {
      LogMessage("Ошибка добавления аватара пользователю [" + login + "]: " + error);
      //TODO: Добавить throw и обработчик ошибки
    }
    else
    {
      LogMessage("Добавлен аватар для пользователя [login: " + login + "]")
    }
  });
};

//------------------------ События --------------------------------------------------------------------

//Юзеры в чате //TODO: запилить фитчу для логов.
users = [];
//Подключения на данный момент
connections = [];

io.sockets.on('connection', function(socket){
  LogMessage("Кто-то подключился");
  connections.push(socket);

  //----------события для каждого нового сокета-----------

  socket.on('disconnect', function(data){
    connections.splice(connections.indexOf(socket), 1);
    LogMessage("Юзер отключился");
  });

  socket.on('send_message', function(data){
    //вызываем событие и передаем в событие объект
    io.sockets.emit('add_new_message', {message : data.message, login : data.login});
    LogMessage(data.login + " Отправил сообщение");
  });

});

process.on('exit', function () {
  connection.end();
  // TODO: замутить сохранение БД
});
