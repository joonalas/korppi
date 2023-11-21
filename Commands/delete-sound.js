const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const logger = require('winston');
const path = require('path');
const { execFile } = require('child_process');
const { setClientCommands } = require('../client-cntl.js');

module.exports = [{
    data: new SlashCommandBuilder()
    .setName('delete')
    .setDescription('Poista nimeämäsi ääni serveriltä.')
    .addStringOption(option => {
        return option
            .setName('nimi')
            .setDescription('Tuhottavan ääniklipin nimi.')
            .setRequired(true)
            .setMaxLength(420);
    }),
    async execute(interaction) {
        const soundname = interaction.options.getString('nimi');
        if (!soundname) {
            interaction.reply("Pelleiletkö kanssani? Kerroppas mursu nyt ihan selkeästi, että mitä haluat poistaa.");
        } 
        const soundsPath = "Sounds";
        const sounds = fs.readdirSync(soundsPath).filter(file => file.endsWith('.mp3'));
        
        if (!sounds.includes(soundname + ".mp3")) {
            interaction.reply("Taliaivo!!! Eihän minulla edes ole moista klippiä, perkele!!!");
            return;
        } 
        fs.unlink("Sounds/" + soundname + ".mp3", function (err) {
            if (err) {
                interaction.reply("Jokin meni vikaan ääntä poistaessa, voihan saatanan saatana!");
                logger.error(err);
                return;
            }
            interaction.reply("Ääni nimeltä " + soundname + " poistettu. Se olikin aika kuraa...");
            const registrationProcess = execFile('node', ['./deploy-commands.js'], (error, stdout, stderr) => {
                if (error) {
                    logger.error(error.message);
                }
                if (stdout) {
                    logger.info(stdout);
                }
                setClientCommands();
            });
        });
    }
}];
        
