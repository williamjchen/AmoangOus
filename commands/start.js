module.exports = (manager, message) => {
   manager.addGame(message.member.voice.channel)
}