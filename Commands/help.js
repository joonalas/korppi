const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const logger = require('winston');
const { getHelpString } = require('../client-cntl.js');

module.exports = [{
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Pyydä korppia listaamaan käytettävissä olevat komennot.'),
    async execute(interaction) {
        interaction.reply(getHelpString());
    }
}];
