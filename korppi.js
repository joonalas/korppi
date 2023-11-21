const logger = require('winston');
const { initClient, setClientCommands, clientLogin } = require('./client-cntl.js');

var textChannel = null;

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
	colorize: true
});

logger.level = 'debug';

initClient();
setClientCommands();
clientLogin();
