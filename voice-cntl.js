const {
    getVoiceConnection,
    joinVoiceChannel,
    VoiceConnectionStatus,
    createAudioPlayer,
    createAudioResource,
} = require('@discordjs/voice');

const logger = require('winston');

const activeAudioPlayers = new Map();

module.exports = {
    // Leave voice channel
    leaveChannel(voiceChannel) {
        logger.info("LeaveVoiceChannel()");
        if (!voiceChannel) { return; }
        const voiceConnection = getVoiceConnection(voiceChannel.guildId);
        if (!voiceConnection) { return; }
        if(voiceConnection.joinConfig.channelId == voiceChannel.id)
        {
            activeAudioPlayers.get(voiceChannel.id).stop();
            activeAudioPlayers.delete(voiceChannel.id);
            voiceConnection.disconnect();
            if(voiceConnection.state.status == "destroyed") { voiceConnection.destroy(); }
        }
    },

    // Play given voice clip on a given voice channel
    play(voiceChannel, sound) {
        var voiceConnection = getVoiceConnection(voiceChannel.guildId); 
        var audioPlayer = null;
        if (voiceConnection) {
            if(voiceConnection.channelId != voiceChannel.id) {
                voiceConnection.disconnect();
                voiceConnection.rejoin({ channelId: voiceChannel.id });
            }
        }
        else {
            voiceConnection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: voiceChannel.guildId,
                adapterCreator: voiceChannel.guild.voiceAdapterCreator,
            });
            voiceConnection.on('stateChange', (old_state, new_state) => {
                logger.info("Voice connection change " + old_state.status + " => " + new_state.status);
                if (old_state.status === VoiceConnectionStatus.Ready
                    && new_state.status === VoiceConnectionStatus.Connecting) {
                    voiceConnection.configureNetworking();
                }
            });
        }
        if (activeAudioPlayers.has(voiceChannel.id)) {
            audioPlayer = activeAudioPlayers.get(voiceChannel.id);
        }
        else {	
            audioPlayer = createAudioPlayer();
            activeAudioPlayers.set(voiceChannel.id, audioPlayer);
        }
        voiceConnection.subscribe(audioPlayer);

        var audioResource = createAudioResource(sound);
        audioPlayer.play(audioResource);
    },
};
