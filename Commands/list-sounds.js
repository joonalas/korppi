const { SlashCommandBuilder } = require('discord.js');
const logger = require('winston');
const path = require('path');
const fs = require('fs');

module.exports = [{
    data: new SlashCommandBuilder()
        .setName('listaa')
        .setDescription('Listaa saatavilla olevat äänet.'),
    async execute(interaction) {

        const soundsPath = "Sounds";
        const sounds = fs.readdirSync(soundsPath).filter(file => file.endsWith('.mp3'));
        var response = "";
        for (const soundFile of sounds) {
            response += path.parse(soundFile).name + '\n';
        }
        
        interaction.reply("Tarjolla olevat äänet tulevat tässä, valitkaa suosikkinne: \n\n" + response );
            
    }
}];
        
