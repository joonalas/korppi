const { REST, Routes } = require('discord.js');
const { token, clientId } = require('./auth.json');
const fs = require('fs');
const path = require('path');
const logger = require('winston');

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
	colorize: true
});

const commands = [];

const cmdDirPath = path.join(__dirname, 'Commands');
const commandFiles = fs.readdirSync(cmdDirPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(cmdDirPath, file);
    const commandArray = require(filePath);
    commandArray.forEach(command => {
        if ('data' in command && 'execute' in command) {
            commands.push(command.data.toJSON());
        } else {
            logger.warning(`Command in path '${filePath}' is missing 'data' and/or 'execute' properties/property.`);
        }
    });
}

const rest = new REST().setToken(token);

(async () => {
    try {
        logger.info(`Refreshing ${commands.length} commands.`);

        const data = await rest.put(
            Routes.applicationCommands(clientId),
            { body: commands },
        );

        logger.info(`${data.length} commands reloaded.`);
    } catch (error) {
        logger.error(error);
    }
})();
