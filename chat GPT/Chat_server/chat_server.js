"use strict";
/*jshint esversion: 6 */
const express = require('express');
var cors = require('cors')
const app = express();
const { Configuration, OpenAIApi } = require('openai');
const dotenv = require('dotenv');

app.use(cors())
app.use(express.json()); //for parsing application/json

// Import MW for parsing POST params in BODY
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));

// Import MW supporting Method Override with express
const methodOverride = require('method-override');
app.use(methodOverride('_method'));

const chat_model = require('./chat_model');

dotenv.config()

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

// /openAI
// Obtenemos la respuesta de OpenAI y la enviamos al cliente
const AIquestion = async (req, res) => {
  try {
    const prompt = req.body.prompt;
    const chatId = req.body.id;
    const response = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: `${prompt}`,
      temperature: 0, 
      max_tokens: 3000, 
      top_p: 1,
      frequency_penalty: 0.5,
      presence_penalty: 0, 
    });

    res.status(200).send({
      message: response.data.choices[0].text
    });
    chat_model.add_message(chatId, prompt, response.data.choices[0].text)
  } catch (error) {
    console.error(error)
    res.status(500).send(error || 'Something went wrong');
  }
};
// CONTROLLER

// /chats
const getAllChatsController = (req, res, next) => {
  chat_model.getAll_chats()
  .then(chats => {
    res.status(201).send({
      success: 'true',
      message: chats,
    });
  })
  .catch(error => {next(Error(`DB Error:\n${error}`));});
};

// /messages/:id
const getAllMessagesController = (req, res, next) => {
  let id = Number(req.params.id);
  // chat_model.getAll(...params)
  chat_model.get_messages(id)
  .then(mensajes => {
    res.status(201).send({
      success: 'true',
      message: mensajes,
    });
  })
  .catch(error => {next(Error(`DB Error:\n${error}`));});
};



// POST /chats
const createController = (req, res, next) => {
  let {title} = req.body;  
  if(!title)
    throw Error('title is required');

  chat_model.add_chat(title)
  .then(() => {
    res.status(201).send({
      success: 'true',
      message: 'chat added successfully',
    });
  })
  .catch(error => {next(Error(`task not created:\n${error}`));});
}; 


// DELETE /chats/1
const deleteChatController = (req, res, next) => {
  let id = Number(req.params.id);
  chat_model.delete_chat(id)
  .then(() => {
    res.status(201).send({
      success: 'true',
      message: 'chat deleted successfully',
    });
  })
  .catch(error => {next(Error(`task not deleted:\n${error}`));});
};
/*
const saveMessage = (req, res, next) => {
  let {chatId, question, respuesta} = req.body;
  chat_model.add_message(chatId, question, respuesta)
  .then(() => {
    res.status(201).send({
      success: 'true',
      message: 'message added successfully',
    });
  })
  .catch(error => {next(Error(`message not created:\n${error}`));});
};
*/
//app.post    ('/message',          saveMessage);
app.get     ('/messages/:id',     getAllMessagesController);
app.post    ('/openAI',           AIquestion);
app.get     ('/chats',            getAllChatsController);
app.post    ('/chats',            createController);
app.delete  ('/chats/:id',        deleteChatController);

//app.delete('/chats/:id',        deleteChatMessagesController);


const errorController = (err, req, res, next) => {
  if (req.originalUrl.includes('/api/'))
    res.status(409).send({
     success: 'false',
     message: err.toString(),
   });
  else
    res.status(409).send(err.toString());
};

app.use(errorController);

app.all('*', (req, res) =>
  res.status(409).send("Error: resource not found or method not supported")
);        


// Server started at port 8000
const PORT = 8000;
app.listen(PORT,
  () => {console.log(`Server running on port ${PORT}`);}
  );
