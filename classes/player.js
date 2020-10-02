module.exports = class Player{
    constructor(user, colour){
        this.user = user
        this.name = user.displayName
        this.colour = colour
        this.alive = true
    }

    setAlive(state){
        this.alive = state
    }

    setColour(colour){
        this.colour = colour
    }
}