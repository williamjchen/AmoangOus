module.exports = class Player{
    constructor(user, colour, alive){
        this.user = user
        this.name = user.displayName
        this.colour = colour
        this.alive = alive
    }

    setAlive(state){
        this.alive = state
    }

    setColour(colour){
        this.colour = colour
    }
}