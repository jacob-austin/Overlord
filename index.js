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
const pomodoroCycles = new Map();

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

    const args = message.content.split(' ').slice(1);

    // Handle stop command
    if (args[0]?.toLocaleLowerCase() === 'stop') {
        const active = pomodoroCycles.get(message.guild.id);
        if (!active) {
            return message.channel.send('⚠️ No Pomodoro cycle is currently running.');
        }

        clearTimeout(active.timeout);
        pomodoroCycles.delete(message.guild.id);
        // Optional unmute cleanup
        if (active.shouldMute && message.member.voice.channel) {
            const voiceChannel = message.member.voice.channel;
            const members = voiceChannel.members.filter(member => !member.user.bot);

            for (const member of members.values()) {
                if (member.voice.serverMute) {
                    try {
                        await member.voice.setMute(false);
                    } catch (error) {
                        console.error(`Failed to unmute ${member.user.username}: ${error.message}`);
                    }
                }
            }
            message.channel.send('🔊 Overlord stopped. All users unmuted.');
        } else {
            message.channel.send('🛑 Overlord stopped.');
        }
        return;
    }

    // Start pomodoro cycle
    if (!message.member.voice.channel) {
        return message.reply('You need to be in a voice channel to use this command!');
    }

    if (pomodoroCycles.has(message.guild.id)) {
        return message.reply('⏳ A Pomodoro cycle is already running! Use `!pomodoro stop` to end it.');
    }

    const shouldMute = args.includes('mute');
    const voiceChannel = message.member.voice.channel;

    message.channel.send(`🍅 Pomodoro cycle started! 25 min focus / 5 min break ${shouldMute ? '(with mute)' : ''}`);

    const startCycle = async () => {
        const members = voiceChannel.members.filter(member => !member.user.bot);
        let mutedUsers = [];
        if (shouldMute) {
            for (const member of members.values()) {
                try {
                    await member.voice.setMute(true);
                    mutedUsers.push(member.id);
                } catch (error) {
                    console.error(`Failed to mute ${member.user.username}: ${error.message}`);
                }
            }
            message.channel.send(`🧠 Focus time! 25 minutes. 🔇 Everyone muted for focus.`);
        } else {
            message.channel.send(`🧠 Focus time! 25 minutes.`);
        }

        playSound(voiceChannel, 'startFocus.mp3');

        const timeoutId = setTimeout(() => {
            if (!pomodoroCycles.has(message.guild.id)) {
                return; // Pomodoro was stopped mid-focus
            }
            playSound(voiceChannel, 'endFocus.mp3');
            if (shouldMute) {
                members.forEach(member => {
                    if (mutedUsers.includes(member.id) && member.voice.serverMute === true) {
                        member.voice.setMute(false).catch(error => {
                            console.error(`Failed to unmute ${member.user.username}: ${error.message}`);
                        });
                    }
                });
                message.channel.send(`🔊 Break time! Everyone unmuted.`);
            } else {
                message.channel.send(`⏰ Break time!`);
            }

            // Schedule next focus session after 5 min break
            const breakTimeout = setTimeout(() => {
                if (pomodoroCycles.has(message.guild.id)) {
                    startCycle(); // start again
                }
            }, 0.25 * 60 * 1000); // 5 min

            pomodoroCycles.set(message.guild.id, { timeoutId: breakTimeout, shouldMute });
        }, 0.25 * 60 * 1000); // 25 minutes

        pomodoroCycles.set(message.guild.id, { timeoutId: timeoutId, shouldMute });
    }

    startCycle();
});

client.login(process.env.DISCORD_TOKEN).catch(console.error);
