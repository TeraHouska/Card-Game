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

let playerCount = 4;
let cardsInHand = 4;

function newGame() {
    winners = [];
    createDeck();
    createPlayers(playerCount, cardsInHand);
    createTable();
    p_number = 0;
    gameOver = false;
    logBoard();
    updateUI();
}

/** Makes an auto-move for player in turn (used for PC players, works for any player)
 */
async function nextMove(UIskipped=false) {
    if (gameOver) return;
    let moveIndex = chooseMove(players[p_number], getAvailableMoves(players[p_number]));
    await makeMove(players[p_number], moveIndex, UIskipped);
}

/** Makes PC moves until Human's turn or until gameOver
 */
async function fastForward() {
    while (!players[p_number].isHuman && !gameOver) {
        await nextMove(true);
    }
    updateUI();
}

// for PC and human player
async function makeMove(player, index, UIskipped=false) {
    const r = table[table.length-1].rank;
    if (index === -1) {
        if (r === 14 && active_card) {
            active_card = 0;
        } else if (r === 7 && active_card) {
            for (let i = 0; i < active_card; i++) {
                drawCard();
            }
            active_card = 0;
        } else {
            drawCard();
        }
    } else {await playCard(player, index);}
    checkWin();
    p_number = (p_number + 1) % players.length;
    logBoard();
    if (UIskipped) return;
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
    if (table[table.length-1].rank === 14) active_card = 1;
    if (table[table.length-1].rank === 7) active_card = 2;
    if (table[table.length-1].rank === 12) queen_effect = deck[0].suit;
}

async function playCard(player, index) {
    table.push(player.hand[index]);
    player.hand.splice(index, 1);
    if (table[table.length-1].rank === 14) active_card = 1;
    if (table[table.length-1].rank === 7) active_card += 2;
    if (table[table.length-1].rank === 12) queen_effect = await chooseQueenEffect();
    return;
}

function drawCard() {
    if (deck.length === 0) { // Flipping deck
        if (table.length === 1) throw "Deck empty";
        let t = table.pop();
        const l = table.length;
        for (let i = 0; i < l; i++) {
            deck.push(table.pop());
        }
        table.push(t);
    }
    players[p_number].hand.push(deck.pop());
}

/** Gets array of which indices in players hand are available to play
 * @param {Player} player 
 * @returns array of indices of cards available to play
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
    return moves;
}

/** Chooses a card to play (as PC) from available cards
 * @param {Player} player - player
 * @param {Array<number>} moves - indices of available moves
 * @returns {number} index of a card to be played (-1 if cannot play a card)
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

async function chooseQueenEffect() {
    if (players[p_number].isHuman) {
        return await getHumanQueenEffect();
    }
    // computer choice (color of the first non-12 card)
    let hand = players[p_number].hand;
    if (hand.length === 0) return 0;
    for (let i = 0; i < hand.length; i++) {
        if (hand[i].rank !== 12) {
            return hand[i].suit;
        } else return 0;
    }
}

function getHumanQueenEffect() {
    updateUI(true);
    return new Promise((resolve) => {
        const QEEl = document.getElementById("queenEffect");
        QEEl.style.display = "grid";
        QEEl.style.gridTemplateColumns = "1fr 1fr";
        QEEl.innerHTML = `<li class="clickable red" value="1">♥</li>
                    <li class="clickable red" value="2">♦</li>
                    <li class="clickable" value="3">♣</li>
                    <li class="clickable" value="4">♠</li>`;
        const items = QEEl.querySelectorAll("li");

        const handler = (event) => {
            const suit = event.target.value;
            QEEl.innerHTML = "";
            QEEl.style.display = "none";
            resolve(suit);
        }

        items.forEach(item => item.addEventListener("click", handler))
    });
}

function checkWin() {
    for (const player of players) {
        if (player.hand.length === 0) {
            winners.push(player);
            players.splice(players.indexOf(player), 1);
            p_number -= 1;
            if (players.length <= 1) {
                gameOver = true;
                showOverlay("leaderBoard");
            }
        }
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

/** Generates and displays Overlay with an info
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

function logBoard() {
    let board = `Table: ${cardsToString(table)}\n`;
    for (let p = 0; p < players.length; p++) {
        board += `Player ${p}: ${cardsToString(players[p].hand)}\n`;
    }
    board += `Deck(${deck.length}): ${cardsToString(deck)}\n`;
    console.log(board);
}

function updateUI(disabled=false) {
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
            if (players.indexOf(player) === p_number && !disabled) {
                playableIndices = getAvailableMoves(player);
            }
            for (const card of player.hand) {
                let playable = playableIndices.includes(player.hand.indexOf(card));
                let cardEl = document.createElement("div");
                cardEl.classList = `card card-front ${card.color} ${playable?"clickable":"disabled"}`;
                cardEl.innerText = cardToValue(card);
                if (playable) {
                    cardEl.addEventListener('click', () => {makeMove(player, player.hand.indexOf(card))});
                }
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
    if (players[p_number].isHuman && !disabled) {
        deckElement.classList.add("clickable");
        deckElement.addEventListener('click', () => {
            makeMove(players[p_number], -1);
        });
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
    const QEEl = document.getElementById("queenEffect");
    if (table[table.length - 1].rank === 12 && queen_effect) {
        QEEl.style.display = "grid";
        QEEl.style.gridTemplateColumns = "1fr";
        const color = [1,2].includes(queen_effect) ? "red" : "";
        QEEl.innerHTML =  `<li class="${color}">${SUITS[queen_effect]}</li>`;
    } else {
        QEEl.style.display = "none";
    }
    // Disable skip buttons (NextMove and FastForward)
    if (players[p_number].isHuman) {
        document.getElementById("nextMove").classList.add("disabled");
        document.getElementById("fastForward").classList.add("disabled");
    } else {
        document.getElementById("nextMove").classList.remove("disabled");
        document.getElementById("fastForward").classList.remove("disabled");
    }
}

// Event listeners
document.getElementById("newGame").addEventListener("click", newGame);
document.getElementById("nextMove").addEventListener("click", () => nextMove());
document.getElementById("fastForward").addEventListener("click", fastForward);
document.getElementById('btnRules').addEventListener('click', () => showOverlay("rules"));

// Closing overlay
document.getElementById("overlay").addEventListener("click", (e) => {
    if (e.target === document.getElementById('overlay'))
        document.getElementById('overlay').classList.remove('open');
});

newGame();