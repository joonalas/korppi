const { SlashCommandBuilder } = require('discord.js');
const { leaveChannel } = require('../voice-cntl.js');

module.exports = [{
    data: new SlashCommandBuilder()
        .setName('fuckoff')
        .setDescription('Merkki korpille painua vittuun kanavaltasi.'),
    async execute(interaction) {
        console.log("leaveCmd");
        await leaveChannel(interaction.member.voice.channel)
        interaction.reply("Haista sinä vittu!");
    }
}];
