# Overlord
A simple, lightweight pomodoro bot made for my wife

## Features
- It's a pomodoro timer!
- Audio and message notifications for focus and break times
- Customizable pomodoro intervals
- Option to automatically server mute all in the voice chat during focus times

## Usage
Cycles can be started with a simple exclamation command:
```console
!overlord
```
And stopped with the 'stop' option:
```console
!overlord stop
```
Additionally, two numbers can be passed after the start command to specify the length of focus and break times, with the defaults being 25/5. For example, a 50 minute focus and 10 minutes break would be:
```console
!overlord 50 10
```
Finally, all users in the active voice chat can be muted during focus times and unmuted during break times by adding the mute param:
```console
!overlord mute
```
Commands can be combined as well!
```console
!overlord 50 10 mute
```
