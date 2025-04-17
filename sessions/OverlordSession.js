const SoundPlayer = require('../sound-player/SoundPlayer');

class OverlordSession {
  constructor(projectRoot, voiceChannel, textChannel, focusMinutes = 25, breakMinutes = 5, shouldMute = false) {
    this.voiceChannel = voiceChannel;
    this.textChannel = textChannel;
    this.focusMinutes = focusMinutes;
    this.breakMinutes = breakMinutes;
    this.shouldMute = shouldMute;
    this.timeoutId = null;
    this.running = false;
    this.mutedUsers = [];
    this.projectRoot = projectRoot;
  }

  async start() {
    this.running = true;
    await this.runFocusCycle();
  }

  stop() {
    clearTimeout(this.timeoutId);
    this.running = false;
    this.unmuteAll();
    this.textChannel.send('🛑 Overlord session stopped.');
  }

  async runFocusCycle() {
    if (!this.running) return;

    const sound = new SoundPlayer(this.voiceChannel, this.projectRoot);
    const members = this.voiceChannel.members.filter(m => !m.user.bot);
    this.mutedUsers = [];

    if (this.shouldMute) {
      for (const member of members.values()) {
        try {
          await member.voice.setMute(true);
          this.mutedUsers.push(member.id);
        } catch (err) {
          console.error(`Could not mute ${member.user.username}: ${err.message}`);
        }
      }
      this.textChannel.send(`🧠 Focus time! ${this.focusMinutes} min. 🔇 Everyone muted.`);
    } else {
      this.textChannel.send(`🧠 Focus time! ${this.focusMinutes} min.`);
    }

    sound.play('startFocus.mp3');

    this.timeoutId = setTimeout(() => this.runBreakCycle(), this.focusMinutes * 60 * 1000);
  }

  async runBreakCycle() {
    if (!this.running) return;

    const sound = new SoundPlayer(this.voiceChannel, this.projectRoot);
    sound.play('endFocus.mp3');

    await this.unmuteAll();
    this.textChannel.send(`⏰ Break time! ${this.breakMinutes} min.`);

    this.timeoutId = setTimeout(() => this.runFocusCycle(), this.breakMinutes * 60 * 1000);
  }

  async unmuteAll() {
    if (!this.shouldMute) return;

    const members = this.voiceChannel.members.filter(m => !m.user.bot);
    for (const member of members.values()) {
      if (this.mutedUsers.includes(member.id) && member.voice.serverMute) {
        try {
          await member.voice.setMute(false);
        } catch (err) {
          console.error(`Failed to unmute ${member.user.username}: ${err.message}`);
        }
      }
    }
  }
}

module.exports = OverlordSession;
