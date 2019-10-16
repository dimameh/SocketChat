//------------------ Переменные -----------------------------

const defaultLogin = "КОТ";
const imageExtensions = ['jpg', 'jpeg', 'png', 'tiff', 'tif', 'bmp', 'dib'];
const socket = io.connect();

//----------------- Функции ----------------------------------
function setLogin(){
  login = document.getElementById("login_input").value;
  if(login!="")
  {
    document.getElementById("login").innerHTML += "Здесь вы известны под именем: "+login;
    turnOffOverlay();
  }
  else
  {
    alert("НУ ПРИДУМАЙ, ЧО СЛОЖНО ЧТО ЛИ?");
    login = defaultLogin;
  }
}

function getLogin(){
  return login;
}

function turnOffOverlay(){
  document.getElementById("overlay").style.display = "none";
}


//------------------- Взаимодействие с беком -----------------------------------

//Создать новый аккаунт. Возвращает true если все переданные перменные валидируются,
//после чего отправляет их на сервер. В случае не прохождения валидации одной из переменных,
//функция вернет false и ничего не отправит. для onsubmit. Action: /createAccount
function Register(login, password, avatar){
  if(IsFileImage(avatar)/*TODO: Добавить валидацию паролей и логинов*/)
  {
    socket.emit('add_new_user', {login: login, password: password, avatar: avatar})
    return true;
  }
  else
  {
    return false;
  }
}

//Отпправить новое сообщение
function SendMessage(){
  socket.emit('send_message', {message: textarea.val(), login: getLogin()});
  textarea.val('');
}

//Если расширение файла содержится в списке допустимых расширений изображений, вернет true
function IsFileImage(filename){
  if(imageExtensions.includes( GetFileExtension(filename) ))
  {
    return true;
  }
  else
  {
    return false;
  }

}

//Получить расширение файла без точки. Прим.: jpg
function GetFileExtension(filename){
  return filename.split('.').pop();
}

//---------------------------

var login = defaultLogin;
var form = $("#message_form");
var textarea = $("#message");
var messages = $("#all_messages");

socket.on('add_new_message', function(data){
  messages.append("<div>" + data.login + ": " + data.message + "<div>");
});
