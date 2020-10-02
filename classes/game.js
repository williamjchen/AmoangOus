const Player = require('./player')
const List = require('./word_list.js')

module.exports = class Game {
    constructor(voiceChannel, textChannel, manager){
        this.manager = manager
        this.voiceID = voiceChannel.id;
        this.voiceChannel = voiceChannel;
        this.textChannel = textChannel
        this.textChannelID = textChannel.id
        this.gameState = 0; // 0 = lobby/not joined, 1 = tasks, 2 = discussion, 3 = proceeding, 4 = ended
        this.players = []
        this.id = List.list[Math.floor(Math.random()*100)]
        this.embedId
        this.timer = setTimeout(() => {
            this.textChannel.send(`The game in **${this.voiceChannel.name}** has ended. No players were in the game for 30 seconds`)
            this.manager.removeGame(this.voiceChannel)
        }, 30000)

        for(let i = 0; i < 2; i++){
            this.id += List.list[Math.floor(Math.random()*100)]
        }
    }

    setEmbedId(id) {
        this.embedId = id
    }


    toJSON() {
        return {
            players: this.players.map(p => {
                return {
                    name: p.name,
                    colour: p.colour,
                    alive: p.alive
                }
            })
        } 
    }

    setPlayerState(colour, alive){
        this.getPlayerByColour(colour).alive = alive
    }

    addPlayer(user, colour){
        const player = new Player(user, colour)
        this.players.push(player)
        clearTimeout(this.timer)
    }

    removePlayer(user){
        this.players.splice(this.players.indexOf(this.getPlayerbyUser(user)), 1)
        
        if(this.players.length == 0){
            this.timer = setTimeout(() => {
                this.textChannel.send(`The game in **${this.voiceChannel.name}** has ended. No players were in the game for 30 seconds`)
                this.manager.removeGame(this.voiceChannel)
            }, 30000)
        }
    }

    checkPlayers(){

    }

    hasPlayer(user) {
        return this.players.find(p => p.user === user)? true: false
    }

    getPlayerbyUser(user){
        return this.players.find(p => p.user === user)
    }

    getPlayerByColour(colour){
        return this.players.find(player => player.colour === colour)
    }

    hasPlayerByColour(colour){
        return this.players.find(player => player.colour === colour)? true: false
    }

    reset(){
        for(const player of this.players){
            if(player.alive === false){
                player.alive = true
            }
        }
    }

    async mute(){
        for(const player of this.players){
            if(player.user.voice.serverMute === false){
                await player.user.voice.setMute(true)
            }
        }
    }

    async unMute(){
        for(const player of this.players){
            if(player.user.voice.serverMute === true && player.alive){
                await player.user.voice.setMute(false)
            }
        }
    }
}