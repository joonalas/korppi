const { SlashCommandBuilder } = require('discord.js');
const logger = require('winston');
const https = require('https');
const fs = require('fs');
const { execFile } = require('child_process');
const { setClientCommands } = require('../client-cntl.js');

module.exports = [{
    data: new SlashCommandBuilder()
        .setName('upload')
        .setDescription('Lataa liitteenä oleva ääniklippi korpin salaiselle serverille.')
        .addAttachmentOption(option => {
            return option
            .setName('ääniklippi')
            .setDescription('Uuden ääniklipin tiedosto.')
            .setRequired(true);
        })
        .addStringOption(option => {
            return option
            .setName('nimi')
            .setDescription('Uuden klipin nimi.')
            .setRequired(true)
            .setMaxLength(420);
        }),
    async execute(interaction) {
        const soundName = interaction.options.getString('nimi');
        if (!soundName) {
            logger.error("Sound name is null, upload failed.");
            return;
        }
        const soundAttachment = interaction.options.getAttachment('ääniklippi');
        if (!soundAttachment) {
            interaction.reply("Hemmetin sokea lepakko, et antanut minulle tiedostoa ladattavaksi!");
            return;
        }
        logger.info("Attachment: " + soundAttachment.name);
        var reqexpMP3 = /.*\.mp3/;
        if (!reqexpMP3.test(soundAttachment.name)) {
            interaction.reply("Älä sinä kehveli koita syöttää minulle muuta kuin mp3-tiedostoja!!!");
        }
        var path = 'Sounds/' + soundName + '.mp3';
        var file = fs.createWriteStream(path);
        https.get(soundAttachment.proxyURL, function (res) {
            logger.info("uploading...");
            res.pipe(file);
        });
        file.on('finish', function () {
            interaction.reply("Paskainen ääniklippisi on ladattu onnistuneesti, saatanan kurttumuna....");
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
