const { Events, GatewayIntentBits, Collection, Client } = require('discord.js');
const { getVoiceConnection } = require('@discordjs/voice');
const { leaveChannel } = require('./voice-cntl.js');
const fs = require('fs');
const path = require('path');
const logger = require('winston');
const { token } = require('./auth.json');
const requireUncached = module => {
    delete require.cache[require.resolve(module)];
    return require(module);
};

var client;
var helpString = "";

module.exports = {
    setClientCommands() {
        logger.info("Generating commands...");
        helpString = (`Seuraavanlaisilla taikasanoilla saa käskyttää:\n\n`
            + "\t/\[ääniklipin nimi\] -> kiusaa itseäsi ja muita haluamallasi äänellä.\n");
        
        client.commands = new Collection();

        const cmdDirPath = path.join(__dirname, 'Commands');
        const cmdFiles   = fs.readdirSync(cmdDirPath).filter(file => file.endsWith('.js'));

        for (const file of cmdFiles) {
            const filePath = path.join(cmdDirPath, file);
            const commandArray = requireUncached(filePath);

            commandArray.forEach(command => {
                if ('data' in command && 'execute' in command) {
                    client.commands.set(command.data.name, command);
                    const soundsPath = "Sounds";
                    const sounds = fs.readdirSync(soundsPath).filter(file => file.endsWith('.mp3'));
                    if (!sounds.includes(command.data.name + ".mp3")) {
                        helpString += (`\t/${command.data.name} -> ${command.data.description}\n`);
                    }
                } else {
                    logger.warning(`Command in path ${filePath} is missing 'data' and/or 'execute' property.`);
                }
            });
        }
    },
    initClient() {
        // Initialize Discord Bot
        // Message content is a privileged intent
        client = new Client({ 
            intents: 
            [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildVoiceStates,
                GatewayIntentBits.MessageContent
            ] });
        
        client.on(Events.ClientReady, async evnt => {
            logger.info('Connected');
        });

        client.on(Events.InteractionCreate, async interaction => {
            if (!interaction.isChatInputCommand()) return;

            const command = interaction.client.commands.get(interaction.commandName);

            if (!command) {
                logger.error(`No command named '${interaction.commandName}'.`);
                await interaction.reply({ content: "Mitäpä jos toope käyttäisit vaikka oikeita komentoja?", ephemeral: true });
                await interaction.followUp({ content: "Pelle...", ephemeral: true });
                return;
            }

            try {
                await command.execute(interaction);
            } catch (error) {
                logger.error(error.message);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({
                        content: `Komento "${interaction.commandName}" epäonnistui, voi perkeleen perkele...`,
                        ephemeral: true
                    });
                } else {
                    await interaction.reply({
                        content: `Komento "${interaction.commandName}" epäonnistui, voi saatanan saatana...`,
                        ephemeral: true
                    });
                }
            }
        });

        client.on('voiceStateUpdate', (oldState, newState) => {
            const oldChannelId = oldState.channelId;
            const oldVoiceConnection = getVoiceConnection(oldState.guild.id);
            if(!oldState.member.user.bot
                && oldVoiceConnection
                && oldState.channelId) {
                client.channels.fetch(oldChannelId).then(voiceChannel => {
                    if(voiceChannel.members.size < 2) {
                        leaveChannel(voiceChannel);
                    }			
                });
            } 
        });
    },
    clientLogin() {
        client.login(token);
    },
    getHelpString() {
        return helpString;
    }
}
