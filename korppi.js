var Discord = require('discord.js');
var DiscordVoice = require('@discordjs/voice');
var logger = require('winston');
var { prefix, token } = require('./auth.json');
var fs = require('fs');
var path = require('path');
var os = require('os');
var https = require('https');

var textChannel = null;
const activeVoiceConnections = new Map();
const activeAudioPlayers = new Map();

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
	colorize: true
});

logger.level = 'debug';

// Initialize Discord Bot
var client = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES, Discord.Intents.FLAGS.GUILD_VOICE_STATES] });

client.on('ready', async evnt => {
	logger.info('Connected');
	logger.info('Prefix: ' + prefix);
});

client.on('messageCreate', async message => {
	textChannel = message.channel;
	if (message.author.bot) return;
	if (message.content.startsWith(prefix)) {

		var voiceChannel = message.member.voice.channel;
		var voiceConnection = null;

		var args = message.content.substring(1).split(' ');
		var cmd = args[0];
		
		if (cmd == "fuckoff") {
			leaveChannel(voiceChannel);
		} else if (cmd == "p\xE4ivit\xE4") {
			updateSounds();
		} else if (cmd == "listaa") {
			showSounds();
		} else if (cmd == "upload") {
			if (message.attachments.size == 0) {
				message.channel.send("Hemmetin sokea lepakko, et antanut minulle tiedostoa ladattavaksi!");
			} else {
				message.attachments.forEach(upload);
			}
		} else if (cmd == "delete") {
			deleteSound(args[1]);
		} else if (cmd == "help") { 
			printCommands();
		} else if (!voiceChannel) {
			message.channel.send("Saatanan lurjus, ei se huutelu toimi, ellet ole kaikukammiossa :--()");
		} else if (voiceChannel) {
			readSoundsFile(data => {
				const regex = new RegExp("^" + cmd + "$", "gm");
				logger.debug("REGEX DEBUG " + data);
				if(!regex.test(data.toString('utf8')))
				{
					textChannel.send("Mit\xE4p\xE4 jos toope k\xE4ytt\xE4isit vaikka oikeita komentoja?");
					textChannel.send("Pelle...");
					return;
				}
				play(voiceChannel, "Sounds/" + cmd + ".mp3");
			});
		}

	}
});

function leaveChannel(voiceChannel) {
		if(voiceChannel && activeVoiceConnections.has(voiceChannel.id))
		{
			activeAudioPlayers.get(voiceChannel.id).stop();
			activeAudioPlayers.delete(voiceChannel.id);
			var voiceConnection = activeVoiceConnections.get(voiceChannel.id);
			voiceConnection.disconnect();
			voiceConnection.destroy();
			activeVoiceConnections.delete(voiceChannel.id);
		} else { textChannel.send("Haista sin\xE4 vittu!"); }
}
	

function printCommands() {
	textChannel.send(
		"Seuraavanlaisilla taikasanoilla saa k\xE4skytt\xE4\xE4:\n\n" +
		"\t!\{\xE4\xE4niklipin nimi\} -> kiusaa itse\xE4si ja muita haluamallasi \xE4\xE4nell\xE4.\n" +
		"\t!fuckoff -> merkki korpille painua vittuun kanavaltasi.\n" +
		"\t!listaa -> listaa saatavilla olevat \xE4\xE4net.\n" +
		"\t!upload -> lataa liitteen\xE4 oleva \xE4\xE4niklippi korpin salaiselle serverille.\n" +
		"\t!delete -> poista nime\xE4m\xE4si \xE4\xE4ni serverilt\xE4.\n" +
		"\t!help -> tulosta t\xE4\xE4 sama litania"
	);
}

client.on('voiceStateUpdate', (oldState, newState) => {
	var channelId = oldState.channelId;
	if(activeVoiceConnections.has(channelId))
	{
		client.channels.fetch(channelId).then(voiceChannel => {
			var voiceConnection = activeVoiceConnections.get(channelId);
			if(voiceChannel.members.size < 2) {
				voiceConnection.disconnect();
				voiceConnection.destroy();
				activeVoiceConnections.delete(channelId);
				activeAudioPlayers.get(channelId).stop();
				activeAudioPlayers.delete(channelId);
			}
		});
	} 

});

function play(voiceChannel, sound) {
	var voiceConnection = null; 
	var audioPlayer = null;
	if(activeVoiceConnections.has(voiceChannel.id))
	{
		voiceConnection = activeVoiceConnections.get(voiceChannel.id);
		audioPlayer = activeAudioPlayers.get(voiceChannel.id);
	}	
	if(voiceConnection == null) {
		voiceConnection = DiscordVoice.joinVoiceChannel({
			channelId: voiceChannel.id,
			guildId: voiceChannel.guildId,
			adapterCreator: client.guilds.cache.get(voiceChannel.guildId).voiceAdapterCreator
		});
		if(activeAudioPlayers.has(voiceChannel.id))
		{
			audioPlayer = activeAudioPlayers.get(voiceChannel.id);
		}
		else
		{	
			audioPlayer = DiscordVoice.createAudioPlayer();
			audioPlayer.on('stateChange', (oldState, newState) => {
				logger.info("AudioPlayer state changed: " + oldState.status + " -> " + newState.status);
				if(newState.status == 'idle') { /*isReady = true;*/ }
			});
			activeAudioPlayers.set(voiceChannel.id, audioPlayer);
		}
		voiceConnection.subscribe(audioPlayer);
		activeVoiceConnections.set(voiceChannel.id, voiceConnection);
	}
	var audioResource = DiscordVoice.createAudioResource(sound);
	audioPlayer.play(audioResource);
}

function showSounds() {
	readSoundsFile(function (data) {
		textChannel.send("Tarjolla olevat \xE4\xE4net tulevat t\xE4ss\xE4, valitkaa suosikkinne: \n\n" + data);
	})
}

function readSoundsFile(callback) {
	fs.readFile('sounds.txt', function (err, data) {
		if (err) throw err;
		//data.replace(/^$/gm, "");
		callback(data);
	});
}

function upload(attachment, snowflake) {
	logger.info("Attachment: " + attachment);
	logger.info("Snowflake: " + snowflake);
	var reqexpMP3 = /.*\.mp3/;
	if (!reqexpMP3.test(attachment.name)) {
		textChannel.send("\xC4l\xE4 sin\xE4 kehveli koita sy\xF6t\xE4\xE4 minulle muuta kuin mp3-tiedostoja!!!");
		return;
	}
	var path = 'Sounds/' + attachment.name;
	var file = fs.createWriteStream(path);
	https.get(attachment.proxyURL, function (res) {
		res.pipe(file);
	});
	file.on('finish', function () {
		updateSounds(function () {
			readSoundsFile(function (data) {
				var MP3ext = /\.mp3$/;
				if (data.toString('utf8').includes(attachment.name.replace(MP3ext, ""))) {
					textChannel.send("Paskainen \xE4\xE4niklippisi on ladattu onnistuneesti, saatanan kurttumuna....");
				} else {
					logger.info(attachment.name.replace(MP3ext, ""));
					logger.info(data.toString('utf8'));
				}
			});
		});

	})
}

function deleteSound(soundname) {
	readSoundsFile(function (data) {
		if(soundname === undefined) {
			textChannel.send("Pelleiletk\xF6 kanssani? Kerroppas mursu nyt ihan selke\xE4sti, ett\xE4 mit\xE4 haluat poistaa.");
			return;
		} else if (!data.toString('utf8').includes(soundname)) {
			textChannel.send("Taliaivo!!! Eih\xE4n minulla edes ole moista klippi\xE4, perkele!!!");
			return;
		} 
		fs.unlink("Sounds/" + soundname + ".mp3", function (err) {
			if (err) {
				textChannel.send("Jokin meni vikaan \xE4\xE4nt\xE4 poistaessa, voihan saatanan saatana!");
				logger.error(err.message);
				return;
			}
			textChannel.send("\xC4\xE4ni nimelt\xE4 " + soundname + " poistettu. Se olikin aika kuraa...");
			updateSounds();
		});
	});

}

function updateSounds(callback = null) {

	//update available sounds into sounds.txt
	var sounds = "";

	fs.readdir("Sounds", function (err, files) {
		if (err) {
			logger.error("Unable to scan directory: " + err.message);
			return;
		}

		files.forEach(function (file) {
			sounds += file.split(".")[0];
			sounds += os.EOL;
		});

		//logger.info("Sounds: " + sounds);

		fs.writeFile('sounds.txt', sounds, function (err) {
			if (err) {
				logger.error("Unable to write file: " + err.message);
				return;
			}
			textChannel.send("\xC4\xE4nilista p\xE4ivitetty! Sus meni niinkuin Sas....");

			if (!(callback == null)) {
				callback();
			}
		});
	});


}

client.login(token);
