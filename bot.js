const { Client, GatewayIntentBits } = require('discord.js');
const OverlordSession = require('./sessions/OverlordSession');
const { mutedByBot } = require('./globals');
require('dotenv').config();
const PROJECT_ROOT = __dirname;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent
  ]
});

const sessions = new Map();

client.once('ready', () => {
    console.log('Logged in as ' + client.user.tag);
});

client.on('messageCreate', async (message) => {
  if (!message.content.startsWith('!overlord')) return;

  const args = message.content.split(' ').slice(1);
  const cmd = args[0]?.toLowerCase();

  if (cmd === 'stop') {
    const session = sessions.get(message.guild.id);
    if (session) {
      session.stop();
      sessions.delete(message.guild.id);
    } else {
      message.channel.send('⚠️ No Overlord session is currently running.');
    }
    return;
  }

  if (!message.member.voice.channel) {
    return message.reply('🔊 You must be in a voice channel to start Overlord.');
  }

  if (sessions.has(message.guild.id)) {
    return message.reply('⏳ An Overlord session is already running!');
  }

  // Arg parsing
  let focusMinutes = 25
  let breakMinutes = 5
  let shouldMute = false;
  const availableVoices = ['sabs', 'eren', 'anhvy'];
  let selectedVoice = null;

  if (!isNaN(args[0])) focusMinutes = parseFloat(args[0]);
  if (!isNaN(args[1])) breakMinutes = parseFloat(args[1]);
  args.forEach(arg => {
    if (arg === 'mute') shouldMute = true;
    if (arg?.startsWith('v:')) {
      const voiceName = arg.split(':')[1]?.toLowerCase();
      if (availableVoices.includes(voiceName)) {
        selectedVoice = voiceName;
      } else {
        return message.reply(`⚠️ Invalid voice name. Available voices: ${availableVoices.join(', ')}`);
      }
    }
  });
  
  if (!selectedVoice) {
    selectedVoice = availableVoices[Math.floor(Math.random() * availableVoices.length)];
  }

  if (focusMinutes < 1 || breakMinutes < 1) {
    return message.reply('⚠️ Focus and break times must be at least 1 minute.');
  }

  const voiceChannel = message.member.voice.channel;
  const textChannel = message.channel;

  const session = new OverlordSession(PROJECT_ROOT, voiceChannel, textChannel, focusMinutes, breakMinutes, shouldMute, selectedVoice);
  sessions.set(message.guild.id, session);
  session.start();
});

client.on('voiceStateUpdate', async (oldState, newState) => {
  const userId = oldState.id;
  const rejoined = !oldState.channelId && newState.channelId;

  if (rejoined && mutedByBot.has(userId)) {
    try {
      const member = await newState.guild.members.fetch(userId);

      if (member.voice.serverMute) {
        await member.voice.setMute(false);
        console.log(`✅ Auto-unmuted ${member.user.username} on rejoin.`);
      }

      mutedByBot.delete(userId); // clean up either way
    } catch (err) {
      console.error(`❌ Failed to unmute ${member.user.username}: ${err.message}`);
    }
  }
});

client.login(process.env.DISCORD_TOKEN).catch(console.error);