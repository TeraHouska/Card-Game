import { Player, Card } from "./object.js";

/** @type {Array<Card>} */
const deck = [];
/** @type {Array<Card>} */
const table = [];
/** @type {Array<Player>} */
const players = [];
/** @type {Array<Player>} */
let winners = [];
const SUITS = ['','♥','♦','♣','♠'];
const RANKS = ['','A','2','3','4','5','6','7','8','9','10','J','Q','K','A'];
const NAMES = ['Jediný člověk (ty)', 'Alfa samec', 'Běžný občan', 'Cypřiš', 'Digga', 'Epistemos'];
let p_number = 0; // player to move
let active_card = 0; // ACE or SEVEN
let queen_effect = 0; // 0 ... no effect, 1-4 ... according to colors
let gameOver = false;

function newGame() {
    winners = [];
    createDeck();
    createPlayers(4, 4);
    createTable();
    p_number = 0;
    gameOver = false;
    logBoard();
    updateUI();
}

function createDeck() {
    deck.splice(0, deck.length); // clear deck
    for (let i = 7; i < 15; i++) {
        for (let j = 1; j < 5; j++) {
            deck.push(new Card(i,j));
        }
    }
    deck.sort(() => Math.random() - 0.5);
}

function createPlayers(p_count, c_count) {
    players.splice(0, players.length);
    for (let i = 0; i < p_count; i++) {
        let hand = [];
        for (let j = 0; j < c_count; j++) {
            hand.push(deck.pop());
        }
        players.push(new Player(NAMES[i], hand, i===0));
    }
}

function createTable() {
    table.splice(0, table.length);
    table.push(deck.pop());
}

function nextMove() {
    if (gameOver) return;
    let moveIndex = chooseMove(players[p_number], getAvailableMoves(players[p_number]));
    makeMove(players[p_number], moveIndex);
}

// for PC and human player
function makeMove(player, index) {
    console.log("player index: " + p_number + "makes a move↓")
    const r = table[table.length-1].rank;
    if (index === -1) {
        if (r === 14 && active_card) {
            active_card = 0;
            console.log("stojím, další efekt 0");
        } else if (r === 7 && active_card) {
            for (let i = 0; i < active_card; i++) {
                drawCard();
            }
            console.log("líznul jsem si " + active_card + " karet")
            active_card = 0;
        } else {
            drawCard();
        }
    } else {playCard(player, index);}
    checkWin();
    p_number = (p_number + 1) % players.length;
    logBoard();
    updateUI();
    let pl = 0;
    players.forEach(p => pl += p.hand.length);
    if (table.length + deck.length + pl !== 32) alert("Not 32 cards");
}

/**
 * 
 * @param {Player} player 
 * @returns array of indexes of cards available to play
 */
function getAvailableMoves(player) {
    let moves = [];
    const r = table[table.length-1].rank;
    const s = (queen_effect && r == 12)? queen_effect: table[table.length - 1].suit;
    if (r === 14 && active_card) { // ACE
        for (const card of player.hand) {
            if (card.rank === 14) {
                moves.push(player.hand.indexOf(card));
            }
        }
    } else if (r === 7 && active_card) { // SEVEN
        for (const card of player.hand) {
            if (card.rank === 7) {
                moves.push(player.hand.indexOf(card));
            }
        }
    } else {
        for (const card of player.hand) {
            if (card.rank === r || card.suit === s || card.rank === 12) {
                moves.push(player.hand.indexOf(card));
            }
        }
    }
    console.log(moves);
    return moves;
}

/**
 * Chooses a card to play (as PC) from available cards
 * 
 * @param {Player} player - player
 * @param {Array<number>} moves - indices of available moves
 * @returns {number} index of a card to be played (-1 for drawing a card)
 */
function chooseMove(player, moves) {
    if (moves.length === 0) {
        return -1;
    }
    for (const i of moves) {
        if (player.hand[i].rank !== 12) {
            return i;
        }
    }
    return moves[0];
}

function chooseQueenEffect() {
    if (players[p_number].hand.length === 0) return 0;
    return players[p_number].hand[0].suit; // return suit of the first card
}

function playCard(player, index) {
    table.push(player.hand[index]);
    player.hand.splice(index, 1);
    console.log("table:" + table[table.length-1].rank + "," + table[table.length-1].suit);
    if (table[table.length-1].rank === 14) active_card = 1;
    if (table[table.length-1].rank === 7) active_card += 2;
    if (table[table.length-1].rank === 12) queen_effect = chooseQueenEffect();
    return;
}

function drawCard() {
    console.log("drawing a card");
    if (deck.length === 0) { // Flipping deck
        if (table.length === 1) throw "Deck empty";
        console.log("FLIPPING DECK")
        let t = table.pop();
        const l = table.length;
        for (let i = 0; i < l; i++) {
            deck.push(table.pop());
        }
        table.push(t);
    }
    players[p_number].hand.push(deck.pop());
}

function checkWin() {
    for (const player of players) {
        if (player.hand.length === 0) {
            console.log("Player " + player.name + " WON!!!");
            winners.push(player);
            players.splice(players.indexOf(player), 1);
            p_number -= 1;
            console.log("winners:");
            console.log(winners);
            if (players.length <= 1) {
                gameOver = true;
                showOverlay("leaderBoard");
            }
        }
    }
}

/** Displays Overlay with an info
 * 
 * @param {string} content - "rules" or "leaderBoard" 
 */
function showOverlay(content) {
    document.getElementById("overlay").classList.add("open");
    if (content === "rules") {
        document.getElementById("overlay-board").classList.remove("leader-board");
        document.getElementById("overlay-board").innerHTML = 
            `<h2>Jak hrát</h2>
            <p>Pravidla jsou podobná karetní hře <strong>prší</strong>, nebo <strong>UNO</strong>.</p>
            <ul>
                <li>Na začátku každý hráč dostane <strong>4 karty</strong>.</li>
                <li>Hráč, který je na řadě odhodí kartu, která se shoduje s kartou na stole buď <strong>barvou</strong> (♠ ♥ ♦ ♣) nebo <strong>hodnotou</strong> (A, 2, 3 … K).</li>
                <li>Pokud hráč nemá v ruce kartu, kterou může zahrát, lízne si jednu kartu z balíčku.</li>
                <li><strong>Karta Q</strong> je měnič a lze s ní změnit barvu na stole.</li>
                <li><strong>Karta A</strong> je eso. Další hráč musí zahrát buď eso, nebo se zdržet tahu.</li>
                <li>Po zahrání <strong>karty 7</strong> musí další hráč zahrát také <strong>kartu 7</strong>, nebo si lízne za každou takto zahranou <strong>kartu 7</strong> dvě karty. (maximálně 8)</li>
                <li><strong>Vítězem</strong> je ten hráč, kterému nezbydou v ruce žádné karty!</li>
            </ul>
            <button id="btnCloseRules">Chápu</button>`; 
        document.getElementById('btnCloseRules').addEventListener('click', () => {
            document.getElementById('overlay').classList.remove('open');
        });
    } else if (content === "leaderBoard") {
        document.getElementById("overlay-board").classList.add("leader-board");
        let innerContent = `<h2>Síň slávy</h2><ol>`;
        winners.forEach(winner => {innerContent += `<li>${winner.name}</li>`});
        innerContent += `<li>${players[0].name}</li>`;
        innerContent += `</ol><button id="btnRestart">Hrát znovu</button>`;
        document.getElementById("overlay-board").innerHTML = innerContent;
        document.getElementById('btnRestart').addEventListener('click', () => {
            document.getElementById('overlay').classList.remove('open');
            newGame();
        });
    }
}

function cardToValue(card) {
    return RANKS[card.rank] + SUITS[card.suit];
}

function cardsToString(cardArray) {
    let c = "";
    for (let i = 0; i < cardArray.length; i++) {
        c += `[${cardArray[i].rank},${cardArray[i].suit}] `;
    }
    return c;
}

function logBoard() {
    let board = `Table: ${cardsToString(table)}\n`;
    for (let p = 0; p < players.length; p++) {
        board += `Player ${p}: ${cardsToString(players[p].hand)}\n`;
    }
    board += `Deck(${deck.length}): ${cardsToString(deck)}\n`;
    console.log(board);
}

function updateUI() {
    const topPlayers = document.getElementById("topPlayers");
    const humanHand = document.getElementById("humanHand");
    const tableElement = document.getElementById("table");

    // Top Players
    topPlayers.innerHTML = "";
    humanHand.innerHTML = "";
    for (const player of players) {
        if (player.isHuman) {
            // make clickable if human's turn
            let playableIndices = [];
            if (players.indexOf(player) === p_number) {
                playableIndices = getAvailableMoves(player);
            }
            for (const card of player.hand) {
                let playable = playableIndices.includes(player.hand.indexOf(card)) ? "playable" : "disabled";
                //let highlight = players.indexOf(player) == p_number ? "border-glow" : "";
                let cardEl = document.createElement("div");
                cardEl.classList = `card card-front ${card.color} ${playable}`;
                cardEl.innerText = cardToValue(card);
                if (playable === "playable") {
                    cardEl.addEventListener('click', () => {makeMove(player, player.hand.indexOf(card))});
                }
                //let cardEl = `<div class="card card-front ${card.color} ${playable}">${cardToValue(card)}</div>`
                humanHand.appendChild(cardEl);
            }
            continue;
        }
        let highlight = players.indexOf(player) == p_number ? "border-glow" : "";
        let playerEl = `<div class="card card-back ${highlight}" id="player${players.indexOf(player)}">${player.hand.length}</div>`;
        topPlayers.innerHTML += playerEl;
    }

    // Deck
    let deckElement = document.createElement("div");
    deckElement.classList.add("card", "card-back");
    deckElement.innerText = "deck";
    if (players[p_number].isHuman) {
        deckElement.classList.add("playable");
        deckElement.addEventListener('click', () => {makeMove(players[p_number], -1);console.log("DRAWING HUMAN TRIGGERED")});
    }
    document.getElementById("deck").innerHTML = "";
    document.getElementById("deck").appendChild(deckElement);

    // Table
    tableElement.innerText = cardToValue(table[table.length-1]);
    tableElement.classList.remove("red"); // set "red" property for hearts and diamonds
    if (table[table.length-1].color === "red") {
        tableElement.classList.add("red");
    }
    // Queen effect symbol
    if (table[table.length - 1].rank === 12 && queen_effect) {
        let color = [1,2].includes(queen_effect) ? "red" : "";
        document.getElementById("queenEffect").innerHTML = `<div class="card queen-effect ${color}">${SUITS[queen_effect]}</div>`;
    } else {
        document.getElementById("queenEffect").innerHTML = "";
    }
    // Next Move Button
    if (players[p_number].isHuman) {
        document.getElementById("nextMove").classList.add("disabled");
    } else {document.getElementById("nextMove").classList.remove("disabled")}
}
// Event listeners
document.getElementById("newGame").addEventListener("click", newGame);
document.getElementById("nextMove").addEventListener("click", nextMove);
document.getElementById('btnRules').addEventListener('click', () => {
    //document.getElementById('overlay').classList.add('open');
    showOverlay("rules");
});
// closing overlay

document.getElementById("overlay").addEventListener("click", (e) => {
    if (e.target === document.getElementById('overlay'))
        document.getElementById('overlay').classList.remove('open');
});

newGame();