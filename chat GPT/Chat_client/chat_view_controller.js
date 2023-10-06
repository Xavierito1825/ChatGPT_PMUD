/*jshint esversion: 6 */
$(function() {

function ChatVC(ajaxUrl) {
  const form = document.querySelector('.form')
  const chatContainer = document.querySelector('#chat_container')
  const allChats = document.querySelector('#all_chats')
  this.url = ajaxUrl;
  this.bot = "public/bot.svg"
  this.user = "public/user.svg"
  this.basura = "public/delete-button.svg"
  this.chatId = -1;
  this.chats_num = 0;

  // VIEWs

  ChatVC.prototype.chats_view = function(ChatId, title) {
    return`
      
        <div class="wrapper_chat" chatid="${ChatId}">
          <p>
          <span class="chats" chatid="${ChatId}">${title}</span>
          </p>
          <img chatid="${ChatId}" id="delete_chat" src="${this.basura}"/>
        </div>
      
      ` 
  };

  ChatVC.prototype.message_view = function(isBot, value) {
    return(
      `
      <div class="wrapper ${isBot && 'ai'}">
          <div class="chat">
              <div class="profile">
                  <img 
                    src=${isBot ? this.bot : this.user} 
                    alt="${isBot ? 'bot' : 'user'}" 
                  />
              </div>
              <div class="message">${value}</div>
          </div>
      </div>
      `
    )
  };

  const errorView = function(text) {
    alert(text);
  };

  //Controlls 

  //Agafem tots el misatges d'un chat
  ChatVC.prototype.messages_Controll = function(chatId) {
    $.ajax({
      dataType: "json",
      url: this.url + '/messages/' + chatId
    })
    .then(mensajes => {
      this.chatId = chatId;
      chatContainer.innerHTML = "";
      for(let ms of mensajes.message) {
        chatContainer.innerHTML += this.message_view(false,ms.text);
        chatContainer.innerHTML += this.message_view(true,ms.response);  
      }
      chatContainer.scrollTop = chatContainer.scrollHeight;
    })
    .catch(error => console.log(error.statusText));
  };

  //Agafem tots el chats
  ChatVC.prototype.chats_Controll = function() {
    $.ajax({
      dataType: "json",
      url: this.url + '/chats'
    })
    .then(chats => {
      $(".wrapper_chat").remove();
      this.chats_num = 0;
      for(let ch of chats.message) {
        this.chats_num ++;
        allChats.innerHTML += this.chats_view(ch.id, ch.title);  
      }
    })
    .catch(error => console.log(error.statusText));
  };

  // Enviem una pregunta al servidor --> agafem resposta --> Mostrem --> Guardem al servidor.
  ChatVC.prototype.send_question = async function (chatId) {
    if(chatId === -1){
      console.log("error");
      errorView("Chat no seleccionado, selecciona una chat");
    }
    else{
      const form_question = new FormData(form);
      question = form_question.get('prompt');
      chatContainer.innerHTML += this.message_view(false,question);
      $('#text').val('');
      chatContainer.scrollTop = chatContainer.scrollHeight;

      const response = await fetch(this.url + '/openAI', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({
              prompt: question,
              id: chatId
          })
      })
      
      if (response.ok) {
        const res = await response.json();
        respuesta = res.message.trim();
        chatContainer.innerHTML += this.message_view(true,respuesta);
        $('#text').val('');
        chatContainer.scrollTop = chatContainer.scrollHeight;
        /*
        $.ajax({
          dataType: "json",
          url: this.url + "/message",
          method: "POST",
          data: {chatId, question, respuesta}
        })
        .then(r => {
          //this.messages_Controll(chatId);
          $('#text').val('');})
        .catch(error => {console.error(error.status, error.responseText);});
        */
      } else {
          const err = await response.text()
          console.log(err);
      }
    }
  }


  // Creació d'un chat nou
  ChatVC.prototype.NewChat_Controll = async function (){
    if(this.chats_num < 7){
      title = $('#add_title').val();
      $.ajax({
        dataType: "json",
        url: this.url + "/chats",
        method: "POST",
        data: {title}
      })
      .then(r => {
        this.chats_Controll();
        this.chatId = this.chats_num;
        this.messages_Controll(this.chatId);
      })
      .catch(error => {console.error(error.status, error.responseText);});
    }
    else {
      errorView("No se pueden añadir mas chats");
    }
   
  }
  
  // Esborrem un chat
  ChatVC.prototype.deleteChatController = function(id) {
    $.ajax({
      dataType: "json",
      method: "DELETE",
      url: this.url + "/chats/" + id
    })
    .then(r => {
      //allChats.innerHTML = "";
      this.chats_Controll();
    })
    .catch(error => {console.error(error.status, error.responseText);});
  };

  // Controlador d'events
  ChatVC.prototype.eventsController = function() {
    $(document).on('click','.wrapper_chat', (e)=> this.messages_Controll(Number($(e.currentTarget).attr('chatid'))));
    $(document).on('click','#delete_chat', (e)=> this.deleteChatController(Number($(e.currentTarget).attr('chatid'))));
    $(document).on('keypress','form',(e) => {if (e.keyCode === 13) this.send_question(this.chatId)});
    $(document).on('click','.submit_button',() => {this.send_question(this.chatId)});
    $(document).on('click','.add_button',() => {this.NewChat_Controll()});


    
  
  };
  this.eventsController();
  this.chats_Controll();
  //this.send_question();
//this.messages_Controll();

}

// Creation of an object View-Controller for the tasks
let chat_vc = new ChatVC('http://localhost:8000');
});
