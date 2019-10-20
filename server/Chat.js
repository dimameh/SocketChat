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
  response.sendFile(__dirname.substring(0, __dirname.length - 7) + '/index.html');
});

//----------------------- POST -------------
//TODO: переделать на Ajax
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

//Добавить нового юзера в БД
function AddNewUser(login, password){
  connection.query('INSERT INTO `users` (`login`, `password`, `avatar`) VALUES (?, ?, NULL);',[login, password], (error) =>
  {
    if(error)
    {
      LogMessage("Ошибка регистрации пользователя: ");
      throw error;
      //TODO: Добавить throw и обработчик ошибки добавления пользователя
    }
    else
    {
      LogMessage("Создан аккаунт [login: " + login + "]");
    }
  });
}

//Добавить в БД ссылку на новый аватар для юзера
function AddAvatarForUser(login, filePath){
  connection.query('UPDATE `users` SET `avatar` = ? WHERE `users`.`login` = ?;', [filePath, login], (error) =>
  {
    if(error)
    {
      LogMessage("Ошибка добавления аватара пользователю [" + login + "]: ");
      throw error;
      //TODO: Добавить throw и обработчик ошибки
    }
    else
    {
      LogMessage("Добавлен аватар для пользователя [login: " + login + "]")
    }
  });
}

//Добавляет в БД новое сообщение, после чего возвращает время его добавления
function AddNewMessage(login, text){
  let time = GetCurrentTime();
  connection.query('INSERT INTO `messages` (`login`, `message_text`, `time`) VALUES (?, ?, ?);', [login, text, time], (error) =>
  {
    if(error)
    {
      LogMessage("Ошибка добавления сообщения в бд: ");
      throw error;
      //TODO: Добавить throw и обработчик ошибки
    }
    else
    {
      LogMessage("Пользователь [login: " + login + "] прислал сообщение: ");
    }
  });

  return time;
}

//Проверка правильности введенных логина и пароля
function IsCorrectPassword(login, password) {

  let checkPass;

  connection.query('SELECT password FROM users WHERE login = ?', [login] , (error, result) =>
  {
    if(error)
    {
      LogMessage("Ошибка запроса пароля для [login: " + login + "]");
      throw error;
      //TODO: Добавить throw и обработчик ошибки
    }
    else
    {
      checkPass = result[0].password;
    }
  });

  LogMessage(checkPass);
  // if(result[0].password == password)
  // {
  //   return true;
  // }
  // return false;
}


//---------- Функции сервера --------------------------------------------------------------

//Зарегистрировать новый аккаунт
function CreateAccount(login, password){
  //...проверки
  //TODO: Обязательно валидацию логина!!
  //...
  AddNewUser(login, password);
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

  AddAvatarForUser(login, filePath);
};

//---------- Служебные функции --------------------------------------------------------------

//Возвращает строку в которой записано время. Используется в логах
function GetLogTime(){
  let date = new Date();
  return '['+ date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds() + ':' + date.getMilliseconds() + ']: ';
}

//Вывести в лог сообщение
function LogMessage(message){
  console.log(GetLogTime() + message);
}

//Получить расширение файла без точки. Прим.: jpg
function GetFileExtension(filename){
  return filename.split('.').pop();
}

//Возвращает текущие дату и время в формате используемом БД
function GetCurrentTime(){
  let date = new Date();
  return date.getFullYear() + '-' + date.getMonth() + '-' + date.getDate() + ' ' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
}

//------------------------ События --------------------------------------------------------------------

//Юзеры в чате //TODO: запилить фитчу для логов.
users = [];
//Подключения на данный момент
connections = [];

io.sockets.on('connection', (socket) =>
{
  LogMessage("Кто-то подключился");
  connections.push(socket);

  //----------события для каждого нового сокета-----------

  socket.on('disconnect', (data) =>
  {
    connections.splice(connections.indexOf(socket), 1);
    LogMessage("Юзер отключился");
  });

  socket.on('send_message', (data) =>
  {
    let time = AddNewMessage(data.login, data.message);
    console.log(time);
    //вызываем событие и передаем в событие объект
    io.sockets.emit('add_new_message', {message: data.message, login: data.login, time: time});
    LogMessage(data.login + " Отправил сообщение");
  });

  socket.on('login', (data) =>
  {
    let login = data.login;
    let password = data.password;
    if(IsCorrectPassword(login, password))
    {
      io.sockets.emit('correct_login', login);
      LogMessage(login + " Вошел");
    }
    else
    {
      io.sockets.emit('incorrect_login', login);
      LogMessage(login + " Ошибка входа");
    }
  });

});

process.on('exit', function () {
  connection.end();
  // TODO: замутить сохранение БД
});
