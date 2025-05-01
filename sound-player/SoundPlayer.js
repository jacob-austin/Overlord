const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const path = require('path');
const fs = require('fs');

class SoundPlayer {
    constructor(voiceChannel, projectRoot, voiceName = 'sabs') {
        this.projectRoot = projectRoot;
        this.voiceChannel = voiceChannel;
        this.voiceName = voiceName;
    }

    play(filename) {
        const connection = joinVoiceChannel({
            channelId: this.voiceChannel.id,
            guildId: this.voiceChannel.guild.id,
            adapterCreator: this.voiceChannel.guild.voiceAdapterCreator,
        });
    
        try {
            const player = createAudioPlayer();
            const filePath = path.join(this.projectRoot, 'assets', 'audio', this.voiceName?.toLowerCase(), filename);
            
            if (!fs.existsSync(filePath)) {
                console.error(`❌ Audio file not found: ${filePath}`);
                console.error(`📂 Current contents of ${path.dirname(filePath)}:`, fs.readdirSync(path.dirname(filePath)))
                return;
            }

            const resource = createAudioResource(filePath);
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