const EventEmitter = require('events');

class TaskEvents extends EventEmitter {}

const taskEvents = new TaskEvents();

// Avoid false memory leak warnings if multiple components listen
taskEvents.setMaxListeners(20);

module.exports = taskEvents;
