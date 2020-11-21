require('dotenv').config()
const Discord = require('discord.js');
const client = new Discord.Client();

const command = require('./command.js');
const sendEmbed = require('./commands/sendembed.js')
const manager = require('./manager.js');

const io = require('socket.io')(8080)

const Manager = new manager(io)

const botRemove = []

function sendUpdatePlayers(code, data){
   io.to(code).emit('updatePlayers', data)
}

io.on('connection', socket => {
    socket.on('join', code => {
        if(Manager.hasGameByCode(code)){
            socket.join(code)
            const game = Manager.getGameByCode(code)
            socket.emit('connected', JSON.stringify({
                state: true,
                name: game.voiceChannel.name
            }))
            sendUpdatePlayers(code, Manager.getGameByCode(code).toJSON())
            //socket.emit('updatePlayers', Manager.getGameByCode(code).toJSON())
        }
    })

    socket.on('updateStates', data => {
        const {code, colour, alive } = JSON.parse(data)
        const game = Manager.getGameByCode(code)
        game.setPlayerState(colour, alive)
    })

    socket.on('setMute', code => {
        const game = Manager.getGameByCode(code)
        game.mute()
    })

    socket.on('unMute', code => {
        const game = Manager.getGameByCode(code)
        game.unMute()
    })

    socket.on('switchAlive', data => {
        const {code, colour, alive} = JSON.parse(data)
        const game = Manager.getGameByCode(code)
        game.getPlayerByColour(colour).alive = alive
        sendUpdatePlayers(code, game.toJSON())
    })

    socket.on('Reset', code => {
        const game = Manager.getGameByCode(code)
        game.reset()
        sendUpdatePlayers(code, game.toJSON())
    })
})


client.on('ready', () => {
    console.log(`Loggggggggedn in as ${client.user.tag}`)
    client.user.setActivity('?start', { type: 'PLAYING'})
});

client.on('message', message => {
    if(message.content === '?start'){
        if(!message.member.voice.channel) return message.channel.send('You\'re not in voice channel')
        if(Manager.hasGame(message.member.voice.channel)) return message.channel.send('Game already started in this channel. type `?end` to end it')
        Manager.addGame(message.member.voice.channel, message.channel)
        const Game = Manager.getGame(message.member.voice.channel)
        sendEmbed(Game, message, (id) => {
            Game.setEmbedId(id)
        })
    }

    command(client, 'mute', message, (message) => {
        let game = Manager.getGame(message.member.voice.channel);
        game.mute();
    })

    command(client, 'unmute', message, (message) => {
        let game = Manager.getGame(message.member.voice.channel)
        game.unMute();
    })

    if(message.content == '?end'){
        if(Manager.hasGame(message.member.voice.channel)){
            const game = Manager.getGame(message.member.voice.channel)
            if(game.textChannel.messages.cache.find(m => m.id === game.embedId).reactions.cache.size >= 12){
                Manager.removeGame(message.member.voice.channel)
                message.channel.send(`Game ended in **${message.member.voice.channel.name}**`)
            }else{
                message.channel.send("Why are you ending the game so fast? Wait until the bot adds all the emojis.(I was too lazy to implement a proper fix, so you gotta wait)")
            }
        }else{
            if(!message.member.voice.channel){
                message.channel.send(`You're not in a call. can't end anything`)
            }else{
                message.channel.send(`No game in **${message.member.voice.channel.name}** to end`)
            }
        }
    }

    if(message.content === '?add'){
        let game = Manager.getGame(message.member.voice.channel);
        game.addPlayer(message, 'red');
        message.channel.send(`test`)
    }
})

client.on('voiceStateUpdate', (oldState, newState) => {
    if (oldState.channelID !== newState.channelID && Manager.hasGame(oldState.channel)) {
      const game = Manager.getGame(oldState.channel)
      if (game.getPlayerbyUser(oldState.member)) {
        game.textChannel.send(`**${oldState.member.displayName}** has been removed from the game in **${oldState.channel.name}** because they disconnected`)
        game.removePlayer(newState.member)
        game.textChannel.messages.fetch(game.embedId).then(message => {
            message.reactions.cache.filter(r => r.users.cache.has(oldState.member.user.id)).forEach((values, keys)=> {
                message.reactions.cache.get(values.emoji.id).users.remove(oldState.member.user)
                botRemove.push(oldState.member.user)
            })
        })
        sendUpdatePlayers(game.id, game.toJSON())
      }
    }
  })

client.on('messageReactionAdd', (reaction, user) => {
    let alive = true
    if(Manager.hasGameByEmbedId(reaction.message.id) && !user.bot){
        reaction.message.guild.members.fetch(user.id).then(member => {
            if(Manager.getGameByEmbedId(reaction.message.id).hasPlayer(member)){
                alive = Manager.getGameByEmbedId(reaction.message.id).getPlayerbyUser(member).alive
                Manager.getGameByEmbedId(reaction.message.id).removePlayer(member)
            }
            if(member.voice.channel === Manager.getGameByEmbedId(reaction.message.id).voiceChannel){
                if(!Manager.getGameByEmbedId(reaction.message.id).hasPlayerByColour(reaction.emoji.name)){
                    Manager.getGameByEmbedId(reaction.message.id).addPlayer(member, reaction.emoji.name, alive)
                    reaction.message.channel.send(`**${member.displayName}** added to game in **${Manager.getGameByEmbedId(reaction.message.id).voiceChannel.name}** as **${reaction.emoji.name}**`)
                    reaction.message.reactions.cache.filter(r => r.users.cache.has(user.id)).forEach((values, keys)=> {
                        if(values.emoji.id !== reaction.emoji.id){
                            reaction.message.reactions.cache.get(values.emoji.id).users.remove(user)
                            botRemove.push(user)
                        }
                    })
                    sendUpdatePlayers(Manager.getGameByEmbedId(reaction.message.id).id, Manager.getGameByEmbedId(reaction.message.id).toJSON())
                }else{
                    reaction.message.channel.send('Another player already has that colour. Tell them to switch or pick another colour')
                    reaction.message.reactions.cache.filter(r => r.users.cache.has(user.id)).forEach((values, keys)=> {
                        reaction.message.reactions.cache.get(values.emoji.id).users.remove(user)
                        botRemove.push(user)
                    })
                }
            }else{
                reaction.message.reactions.cache.filter(r => r.users.cache.has(user.id)).forEach((values, keys)=> {
                    reaction.message.reactions.cache.get(values.emoji.id).users.remove(user)
                    botRemove.push(user)
                })
            }
        })
    }
})

client.on('messageReactionRemove', (reaction, user) => {
    if(Manager.hasGameByEmbedId(reaction.message.id) && !user.bot && !botRemove.includes(user)){
        reaction.message.guild.members.fetch(user.id).then(member => {
            Manager.getGameByEmbedId(reaction.message.id).removePlayer(member)
            reaction.message.channel.send(`**${member.displayName}** removed from game in **${Manager.getGameByEmbedId(reaction.message.id).voiceChannel.name}** as **${reaction.emoji.name}**`)
            sendUpdatePlayers(Manager.getGameByEmbedId(reaction.message.id).id, Manager.getGameByEmbedId(reaction.message.id).toJSON())
        })
    }
    botRemove.splice(botRemove.indexOf(user), 1)
})

client.login(process.env.KEY)