const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const path = require('path');

class SoundPlayer {
    constructor(voiceChannel, projectRoot) {
        this.projectRoot = projectRoot;
        this.voiceChannel = voiceChannel;
    }

    play(filename) {
        const connection = joinVoiceChannel({
            channelId: this.voiceChannel.id,
            guildId: this.voiceChannel.guild.id,
            adapterCreator: this.voiceChannel.guild.voiceAdapterCreator,
        });
    
        try {
            const player = createAudioPlayer();
            const resource = createAudioResource(path.join(this.projectRoot, 'assets', 'audio', 'Sabs', filename));
        
            connection.subscribe(player);
            player.play(resource);

            player.on(AudioPlayerStatus.Idle, () => {
                console.log('Audio Player Idle');
                connection.destroy();
            });
    
            player.on('error', error => {
                console.error('Audio Player Error:', error);
                connection.destroy();
            });
        } catch (error) {
            console.error('Error playing sound:', error);
            connection.destroy();
        }
       
       
    }
}

module.exports = SoundPlayer;