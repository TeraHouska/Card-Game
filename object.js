export class Player {
    /** @type {string} */
    name;
    /** @type {Array<Card>} */
    hand = [];
    /** @type {boolean} */
    isHuman;
    /**@type {number} */
    score = 0;
    /**@type {number} */
    lastScore = 0;

    constructor(name, isHuman=false) {
        this.name = name;
        this.isHuman = isHuman;
    }

    enterScore(score) {
        this.lastScore = score;
        this.score += score;
    }
}

export class Card {
    /** @type {number} */
    rank;
    /** @type {number} */
    suit;
    /** @type {string} "red" or "black"*/
    color;

    constructor(rank, suit) {
        this.rank = rank;
        this.suit = suit;
        this.color = [1,2].includes(suit) ? "red" : "black";
    }
}