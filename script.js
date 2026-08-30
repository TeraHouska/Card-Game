
const deck = []; // deck
const table = [];
const players = [];
const SUITS = ['','♥','♦','♣','♠']
const RANKS = ['','A','2','3','4','5','6','7','8','9','10','J','Q','K','A']
let p_number = 0; // player to move
let active_card = 0; // ACE or SEVEN
let queen_effect = 0; // 0 ... no effect, 1-4 ... according to colors

function newGame() {
    createDeck();
    createPlayers(4, 4);
    createTable();
    p_number = 0;
    logBoard();
    updateUI();
}

function nextMove() {
    makeMove(players[p_number]);
    if (players[p_number].length == 0) {
        console.log("Player " + p_number + " WON!!!");
        updateUI();
        alert("Player " + p_number + " WON!!!");
        return;
    }
    p_number = (p_number + 1) % players.length;
    logBoard();
    updateUI();
}

function createDeck() {
    deck.splice(0, deck.length); // clear deck
    for (let i = 7; i < 15; i++) {
        for (let j = 1; j < 5; j++) {
            deck.push([i,j]);
        }
    }
    deck.sort(() => Math.random() - 0.5);
}

function createPlayers(p_count, c_count) {
    players.splice(0, players.length);
    for (let i = 0; i < p_count; i++) {
        let player = [];
        for (let j = 0; j < c_count; j++) {
            player.push(deck.pop());
        }
        players.push(player);
    }
}

function createTable() {
    table.splice(0, table.length);
    table.push(deck.pop());
}

function showRules() {
    document.getElementById("rules").innerHTML = "<h2>Pravidla jsou velmi jednoduchá, to pochopíš</h2>";
}

function makeMove(player) {
    const r = table[table.length-1][0];
    let availableMoves = getAvailableMoves(player);
    let index = chooseMove(player, availableMoves); // chooses index of a card to play
    if (index == -1) {
        if (r == 14 && active_card) {
            active_card = 0;
            console.log("stojím, další efekt 0");
            return;
        } else if (r == 7 && active_card) {
            for (let i = 0; i < active_card; i++) {
                drawCard();
            }
            console.log("líznul jsem si " + active_card + " karet")
            active_card = 0;
            return;
        } else {
            drawCard();
            return;
        }
    }
    playCard(player, index);
}

function getAvailableMoves(player) {
    let moves = [];
    const r = table[table.length-1][0];
    const c = (queen_effect && r == 12)? queen_effect: table[table.length - 1][1];
    if (r == 14 && active_card) { // ACE
        for (card of player) {
            if (card[0] == 14) {
                moves.push(player.indexOf(card));
            }
        }
    } else if (r == 7 && active_card) { // SEVEN
        for (card of player) {
            if (card[0] == 7) {
                moves.push(player.indexOf(card));
            }
        }
    } else {
        for (card of player) {
            if (card[0] == r || card[1] == c || card[0] == 12) {
                moves.push(player.indexOf(card));
            }
        }
    }
    return moves;
}

/**
 * Chooses a card to play (as PC) from available cards
 * 
 * @param {Array<Array<number>>} player - player cards
 * @param {Array<number>} moves - indices of available moves
 * @returns {number} index of a card to be played (-1 for drawing a card)
 */
function chooseMove(player, moves) {
    if (moves.length == 0) {
        return -1;
    }
    for (i of moves) {
        if (player[i][0] != 12) {
            return i;
        }
    }
    return moves[0];
}

function chooseQueenEffect() {
    try {
        return players[p_number][0][1]; // return color of the first card
    } catch (e) {return 0};
}

function playCard(player, index) {
    console.log("player plays: " + player[index]);
    table.push(player[index]);
    player.splice(index, 1);
    console.log("table:" + table[table.length-1]);
    if (table[table.length-1][0] == 14) active_card = 1;
    if (table[table.length-1][0] == 7) active_card += 2;
    if (table[table.length-1][0] == 12) queen_effect = chooseQueenEffect();
    return;
}

function drawCard() {
    console.log("drawing a card");
    if (deck.length == 0) {
        console.log("FLIPPING DECK")
        for (let i = 0; i < table.length-1; i++) {
            deck.push(table.pop());
        }
    }
    players[p_number].push(deck.pop());
}

function cardToValue(card) {
    return RANKS[card[0]] + SUITS[card[1]];
}

function cardsToString(cardArray) {
    let c = "";
    for (let i = 0; i < cardArray.length; i++) {
        c += "[" + cardArray[i] + "] ";
    }
    return c;
}

function logBoard() {
    let board = `Table: ${cardsToString(table)}\n`;
    for (let p = 0; p < players.length; p++) {
        board += `Player ${p}: ${cardsToString(players[p])}\n`;
    }
    board += `Deck(${deck.length}): ${cardsToString(deck)}\n`;
    console.log(board);
    /*document.getElementById("board").innerHTML = '<button onClick="nextMove()">Další tah</button>';*/
}

function updateUI() {
    const topPlayers = document.getElementById("topPlayers");
    const humanHand = document.getElementById("humanHand");
    const tableElement = document.getElementById("table");

    // Top Players
    topPlayers.innerHTML = "";
    for (const player of players) {
        if (players.indexOf(player) == 0) continue;
        let highlight = players.indexOf(player) == p_number ? "border-glow" : "";
        let playerEl = `<div class="card card-back ${highlight}" id="player${players.indexOf(player)}">${player.length}</div>`;
        topPlayers.innerHTML += playerEl;
    }

    // Table
    tableElement.innerText = cardToValue(table[table.length-1]);
    tableElement.classList.remove("red"); // set "red" property for hearts and diamonds
    if ([1,2].includes(table[table.length-1][1])) {
        tableElement.classList.add("red");
    }
    if (table[table.length - 1][0] == 12 && queen_effect) {
        color = [1,2].includes(queen_effect) ? "red" : "";
        document.getElementById("queenEffect").innerHTML = `<div class="card queen-effect ${color}">${SUITS[queen_effect]}</div>`;
    } else {
        document.getElementById("queenEffect").innerHTML = "";
    }


    // Human Hand
    humanHand.innerHTML = "";
    for (const card of players[0]) {
        let color = [1,2].includes(card[1]) ? "red" : "";
        let highlight = p_number == 0 ? "border-glow" : "";
        let cardEl = `<div class="card card-front ${color} ${highlight}">${cardToValue(card)}</div>`
        humanHand.innerHTML += cardEl;
    }
}