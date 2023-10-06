'use strict';
/*jshint node: true */
/*jshint esversion: 6 */
const fs = require("fs");

// Nom del fitxer de text on es guarden els elements en format JSON.
const DB_FILENAME = "chats.json";


// Model de dades.
//
// Aquesta variable guarda tots els elements com un array d'objectes,
// on els atributs de cada objecte són els seus camps.
//
// Al principi aquesta variable conté tres elements, però desprès es crida a load()
// per carregar els elements guardats en el fitxer DB_FILENAME si existeix.
let file = [
];


/**
 *  Carrega els elements en format JSON del fitxer DB_FILENAME.
 *
 *  El primer cop que s'executa aquest mètode, el fitxer DB_FILENAME no
 *  existeix, i es produirà l'error ENOENT. En aquest cas es guardarà el
 *  contingut inicial.
 */
const load = () => {
  fs.readFile(DB_FILENAME, (err, data) => {
    if (err) {
      if (err.code === "ENOENT") {
        save();
        return;
      }
      throw err;
    }
    let json = JSON.parse(data);
    if (json) {
      file = json;
    }
  });
};


/**
 *  Guarda els elements en format JSON en el fitxer DB_FILENAME.
 */
const save = () => {
  fs.writeFile(DB_FILENAME, JSON.stringify(file),
    err => {
      if (err) throw err;
    });
};


// Returns all the chats
exports.getAll_chats = () => {
  return new Promise((resolve, reject) => {
    const chats = file.chats;
    if (typeof chats === "undefined") {
      reject(new Error(`El valor del parámetro id no es válido.`));
    } else {
      resolve(JSON.parse(JSON.stringify(chats)));
    }
  });
};


/* Returns the messages from the chat identified by (id).
   id: Element identification. */
exports.get_messages = id => {
  return new Promise((resolve, reject) => {
    const mensajes = file.messages.filter(message => message.chatId === id);;
    if (typeof mensajes === "undefined") {
      reject(new Error(`El valor del parámetro id no es válido.`));
    } else {
      resolve(JSON.parse(JSON.stringify(mensajes)));
    }
  });
};


/* Adds a new chat
   title: String with the chat title.
    */
exports.add_chat = (title) => {
  return new Promise((resolve, reject) => {
    file.chats.push({
      id: file.chats.length,
      title: title.trim()
    });
    save();
    resolve();
  });
}; 


/* Deletes the chat identified by (id).
   id: Chat identification. */
exports.delete_chat = id => {
  return new Promise((resolve, reject) => {
    const chat = file.chats[id];
    if (typeof chat === "undefined") {
      reject(new Error(`El valor del parámetro id no es válido.`));
    } else {
      file.chats.splice(id, 1);
      file.chats.map((e, i) => e.id = i);

      const mensajesFiltrados = file.messages.filter(message => message.chatId !== id);
      mensajesFiltrados.map(function (e, i) {
        if(e.chatId > id) e.chatId -= 1;
      });
      file.messages = mensajesFiltrados;

      save();
      resolve();
    }
  });
};

/* Adds a new message to the chat identified by (id)
   id: Chat identification.
   pregunta: question sended
   respuesta: responses obtained from openai 
    */
exports.add_message = (id, pregunta, respuesta) => { 
  return new Promise((resolve, reject) => {
    let now = new Date();
    file.messages.push({
      chatId: parseInt(id),
      text: pregunta.trim(),
      response: respuesta.trim(),
      datetime: now
    });
    file.messages.sort((a, b) => {
      if (a.chatId === b.chatId) {
        // Si los IDs son iguales, ordenar por fecha
        return new Date(a.datetime) - new Date(b.datetime);
      } else {
        // Si los IDs son diferentes, ordenar por ID
        return a.chatId - b.chatId;
      }
    });
    save();
    resolve();
  });
};



// Carrega els elements guardats en el fitxer si existeix.
load();
