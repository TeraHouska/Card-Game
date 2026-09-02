export class Player {
    /** @type {string} */
    name;
    /** @type {Array<Card>} */
    hand = [];
    /** @type {boolean} */
    isHuman;

    constructor(name, hand, isHuman=false) {
        this.name = name;
        this.hand = hand;
        this.isHuman = isHuman;
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