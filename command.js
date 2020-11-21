require('dotenv').config()

module.exports = (client, aliases, message, callback) => {
    if(typeof aliases === 'string'){
        aliases = [aliases]
    }

    const{ content } = message;

    aliases.forEach(alias =>{
        const command = `${process.env.PREFIX}${alias}`
        if(content === command){
            callback(message);
        }
    })
}