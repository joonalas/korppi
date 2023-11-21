const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { play } = require('../voice-cntl.js');

var soundCommands = [];

const soundsPath = "Sounds";
const sounds = fs.readdirSync(soundsPath).filter(file => file.endsWith('.mp3'));
for (const soundFile of sounds) {
    const soundName = path.parse(soundFile).name;
    soundCommands.push({
        data: new SlashCommandBuilder()
            .setName(soundName)
            .setDescription(`Soita klippi "${soundName}".`),
        async execute(interaction) {
            var voiceChannel = interaction.member.voice.channel;
            if (!voiceChannel) {
                interaction.reply("Saatanan lurjus, ei se huutelu toimi, ellet ole kaikukammiossa :--()");
                return;
            }
            play(voiceChannel, "Sounds/" + interaction.commandName + ".mp3");
            interaction.reply({ content: 'Nauti paskasta klipistäsi', ephemeral: true });
        }
    });
}

module.exports = soundCommands; 

