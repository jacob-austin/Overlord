require('dotenv').config();
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const { Client, GatewayIntentBits } = require('discord.js');
const path = require('path');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

client.once('ready', () => {
    console.log('Logged in as ' + client.user.tag);
});

function playSound(voiceChannel, fileName) {
    const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guild.id,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    });

    const player = createAudioPlayer();
    const resource = createAudioResource(path.join(__dirname, 'audio', fileName));

    connection.subscribe(player);
    player.play(resource);

    player.on(AudioPlayerStatus.Idle, () => {
        connection.destroy();
    });
}

client.on('messageCreate', async (message) => {
    if (!message.content.startsWith('!overlord')) return;
    if (!message.member.voice.channel) {
        return message.reply('You need to be in a voice channel to use this command!');
    }

    const voiceChannel = message.member.voice.channel;
    
    message.channel.send(`🍅 Overlord started! Focus time for 25 minutes.`);
    playSound(voiceChannel, 'startFocus.mp3');

    setTimeout(() => {
        playSound(voiceChannel, 'endFocus.mp3');
        message.channel.send(`🍅 Overlord ended! Time to take a break!`);
    }, 25 * 60 * 1000); // 25 minutes
});

client.login(process.env.DISCORD_TOKEN).catch(console.error);
