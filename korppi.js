var Discord = require('discord.js');
var logger = require('winston');
var { prefix, token } = require('./auth.json');
var fs = require('fs');
var path = require('path');
var os = require('os');
var https = require('https');

var textChannel = null;

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
	colorize: true
});

logger.level = 'debug';

// Initialize Discord Bot
var client = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS] });
var isReady = true;

client.on('ready', async evnt => {
	logger.info('Connected');
	logger.info('Logged in as: ');
	logger.info(client.username + ' - (' + client.id + ')');
	logger.info('Prefix: ' + prefix);
});

client.on('message', async message => {
	textChannel = message.channel;
	if (message.author.bot) return;
	if (message.content.startsWith(prefix)) {

		var voiceChannel = message.member.voice.channel;

		//logger.debug("VoiceChannel: " + voiceChannel);
		var args = message.content.substring(1).split(' ');
		var cmd = args[0];

		if (cmd == "fuckoff") {
			voiceChannel.leave();
			isReady = true;
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
		} else if (!voiceChannel) {
			message.channel.send("Saatanan lurjus, ei se huutelu toimi, ellet ole kaikukammiossa :--()");
		} else if (isReady && voiceChannel) {
			isReady = false;
			play(voiceChannel, "Sounds/" + cmd + ".mp3");
		}

	}
});

function play(voiceChannel, sound) {
	voiceChannel.join().then(connection => {
		const dispatcher = connection.play(sound);
		dispatcher
			.on("end", end => {
				isReady = true;
			})
	}).catch(err => logger.error(err.message));
}

function showSounds() {
	readSoundsFile(function (data) {
		textChannel.send("Tarjolla olevat \xE4\xE4net tulevat t\xE4ss\xE4, valitkaa suosikkinne: \n\n" + data);
	})
}

function readSoundsFile(callback) {
	fs.readFile('sounds.txt', function (err, data) {
		if (err) throw err;
		callback(data);
	});
}

function upload(attachment, snowflake) {
	logger.info("Attachment: " + attachment);
	logger.info("Snowflake: " + snowflake);
	var reqexpMP3 = /.*\.mp3/;
	if (!reqexpMP3.test(attachment.name)) {
		textChannel.send("Älä sinä kehveli koita syöttää minulle muuta kuin mp3-tiedostoja!!!");
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
					textChannel.send("Paskainen ääniklippisi on ladattu onnistuneesti, saatanan kurttumuna....");
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
			textChannel.send("Pelleiletkö kanssani? Kerroppas mursu nyt ihan selkeästi, että mitä haluat poistaa.");
			return;
		} else if (!data.toString('utf8').includes(soundname)) {
			textChannel.send("Taliaivo!!! Eihän minulla edes ole moista klippiä, perkele!!!");
			return;
		} 
		fs.unlink("Sounds/" + soundname + ".mp3", function (err) {
			if (err) {
				textChannel.send("Jokin meni vikaan ääntä poistaessa, voihan saatanan saatana!");
				logger.error(err.message);
				return;
			}
			textChannel.send("Ääni nimeltä " + soundname + " poistettu. Se olikin aika kuraa...");
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