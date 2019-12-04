var Discord = require('discord.js');
var logger = require('winston');
var opus = require('node-opus');
var opusScript = require('opusscript');
var {prefix, token} = require('./auth.json');
var fs = require('fs');
var path = require('path');
var os = require('os');

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});

logger.level = 'debug';

// Initialize Discord Bot
var client = new Discord.Client();
var isReady = true;

client.on('ready', async evnt => {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(client.username + ' - (' + client.id + ')');
    logger.info('Prefix: ' + prefix);
});

client.on('message', async message =>{
	if(message.author.bot) return;
	if(message.content.startsWith(prefix)) {
		
		var voiceChannel = message.member.voice.channel;
		if(!voiceChannel) {
			message.channel.send("Saatanan lurjus, ei se huutelu toimi, ellet ole kaikukammiossa :--()");
		}

		//logger.debug("VoiceChannel: " + voiceChannel);
		var args = message.content.substring(1).split(' ');
		var cmd = args[0];

		if(cmd == "fuckoff") {
			voiceChannel.leave();
			isReady = true;
		} else if(cmd == "p\xE4ivit\xE4") {
			updateSounds(message.channel);
		} else if(cmd == "listaa") {
			showSounds(message.channel);
		} else if(isReady && voiceChannel) {
			isReady = false;
			play(voiceChannel, "Sounds/" + cmd + ".mp3");
		}

	}
});

function play(voiceChannel, sound) {
	voiceChannel.join().then(connection =>{
		const dispatcher = connection.play(sound);
		dispatcher
			.on("end", end => {
				isReady = true;
			})
	}).catch(err => logger.error(err.message));
}

function showSounds(textChannel) {
	fs.readFile('sounds.txt', function(err, data) {
		textChannel.send("Tarjolla olevat \xE4\xE4net tulevat t\xE4ss\xE4, valitkaa suosikkinne: \n\n" + data);
	});
}


client.login(token);


function updateSounds(textChannel) {

//update available sounds into sounds.txt
var sounds = "";

fs.readdir("Sounds", function(err, files) {
	if(err) {
		logger.error("Unable to scan directory: " + err.message);
		return;
	}

	files.forEach(function(file) {
		sounds += file.split(".")[0];
		sounds += os.EOL;
	});

	//logger.info("Sounds: " + sounds);

	fs.writeFile('sounds.txt', sounds, function(err) {
		if(err) {
			logger.error("Unable to write file: " + err.message);
			return;
		}
	});
});

textChannel.send("\xC4\xE4nilista p\xE4ivitetty! Sus meni niinkuin Sas....");

}