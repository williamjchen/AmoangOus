const Game = require('./Classes/game')

module.exports = class Manager {
    constructor(io){
        this.games = new Map()
        this.io = io
    }

    getGame(voiceChannel){
        return this.games.get(voiceChannel.id)
    }

    hasGame(voiceChannel){
        if(voiceChannel){
            return this.games.has(voiceChannel.id)
        }else{
            return false
        }
    }

    hasGameByCode(code){
        return Array.from(this.games.values()).find(game => game.id === code)? true: false
    }

    
    getGameByCode(code){
        return Array.from(this.games.values()).find(game => game.id === code)
    }

    hasGameByEmbedId(id){
        return Array.from(this.games.values()).find(game => game.embedId === id)? true: false
    }

    getGameByEmbedId(id){
        return Array.from(this.games.values()).find(game => game.embedId === id)
    }

    addGame(voiceChannel, textChannel){
        this.games.set(voiceChannel.id, new Game(voiceChannel, textChannel, this))
    }

    removeGame(voiceChannel){
        const game = this.getGame(voiceChannel)
        game.textChannel.messages.fetch(game.embedId).then(message => {
            message.delete()
        })
        clearTimeout(game.timer)
        this.io.to(game.id).emit('end')
        this.games.delete(voiceChannel.id)
    }
}