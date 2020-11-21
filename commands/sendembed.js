const emojiId = ['758927223473438781',
                  '758927223238688800',
                  '758927223251533825',
                  '758927223406460938',
                  '758927223482482688',
                  '758927223494672384',
                  '758927223435952158',
                  '758927223394271264',
                  '758927222756212747',
                  '758927222794485770',
                  '758927222882435082',
                  '758927222379249665'
               ]

module.exports = (game, message, callback) => {
    message.channel.send({embed: {
        color: '#cce335',
        title: `Game started in **${message.member.voice.channel.name}**. Game Code: **${game.id}**`,
        description: 'Join the call and react to this message with your colour to join game',
        fields: [{
        name: 'Web Sync',
        value: `Visit **[amoangous.me](https://amoangous.me)** and enter code `
        },
        {
        name: 'App Sync',
        value: `Download the exe at **[google.ca](https://google.ca)** and enter code for full automation`
        }
        ],
    }}).then(message => {
        emojiId.map(id => message.react(id))
        callback(message.id)
    }).catch((e) => {
        console.log("error reacting", e)
    })
}