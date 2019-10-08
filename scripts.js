const defaultLogin = "Безликий хуйлыга";
var login = defaultLogin;
var socket = io.connect();
var form = $("#message_form");
var textarea = $("#message");
var messages = $("#all_messages");

socket.on('add_new_message', function(data){
  messages.append("<div>" + data.login + ": " + data.message + "<div>");
});

function test(){
  socket.emit('send_message', {message : textarea.val(), login : getLogin()});
  textarea.val('');
}

function setLogin(){
  login = document.getElementById("login_input").value;
  if(login!=""){
    document.getElementById("login").innerHTML += "Здесь вы известны под именем: "+login;
    turnOffOverlay();
  }
  else {
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
