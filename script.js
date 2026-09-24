import { Player, Card } from "./object.js";
import { leaderboard, rules, settings } from "./overlay.js";

/** @type {Array<Card>} */
const deck = [];
/** @type {Array<Card>} */
const table = [];
/** @type {Array<Player>} */
const allPlayers = [];
/** @type {Array<Player>} */
const players = [];
/** @type {Array<Player>} */
const winners = [];
const SUITS = ['','♥','♦','♣','♠'];
const RANKS = ['','A','2','3','4','5','6','7','8','9','10','J','Q','K','A'];
const NAMES = ['Jediný člověk (Ty)', 'Alfa samec', 'Běžný občan', 'Cypřiš', 'Digga', 'Epistemos'];
const numberOfCards = 32;
let p_number = 0; // player to move
let active_card = 0; // ACE or SEVEN
let queen_effect = 0; // 0 ... no effect, 1-4 ... according to colors
let gameOver = false;

window.playerCount = 4;
window.cardsInHand = 4;

function newGame() {
    createDeck();
    resetPlayers(cardsInHand);
    createTable();
    p_number = 0;
    gameOver = false;
    //logBoard();
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
    //logBoard();
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

function createPlayers() {
    allPlayers.splice(0, allPlayers.length);
    for (let i = 0; i < playerCount; i++) {
        allPlayers.push(new Player(NAMES[i], i===0));
    }
}

/** Resets arrays of players to New Game state and deals them cards */
function resetPlayers(c_count) {
    players.splice(0, players.length);
    winners.splice(0, winners.length);
    allPlayers.forEach(p => players.push(p));
    for (const player of players) {
        let hand = [];
        for (let i = 0; i < c_count; i++) {
            hand.push(deck.pop());
        }
        player.hand = hand;
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
        player.hand.forEach((card, i) => card.rank === 14 ? moves.push(i) : undefined);
    } else if (r === 7 && active_card) { // SEVEN
        player.hand.forEach((card, i) => card.rank === 7 ? moves.push(i) : undefined);
    } else {
        player.hand.forEach((card, i) => [r,12].includes(card.rank) || card.suit === s ? moves.push(i) : undefined);
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
            player.enterScore(getWinnerScore());
            p_number -= 1;
            if (players.length === 1) {
                players[0].enterScore(0);
                winners.push(players[0]);
                gameOver = true;
                showOverlay("leaderBoard");
            }
        }
    }
}

/** Returns sum of values of remaining player's hands*/
function getWinnerScore() {
    let score = 0;
    players.forEach(player => score += cardsToScore(player.hand));
    return score;
}

/** Returns value of a players hand (card array)
 * @param {Array<Card>} cardArray player's hand
 */
function cardsToScore(cardArray) {
    let score = 0;
    cardArray.forEach(card => card.rank === 12 ? score += 20 : score += card.rank);
    return score;
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
    const overlayBoard = document.getElementById("overlayBoard");
    if (content === "rules") {
        overlayBoard.classList.remove("leader-board");
        overlayBoard.appendChild(rules());
    } else if (content === "leaderBoard") {
        overlayBoard.classList.add("leader-board");
        overlayBoard.appendChild(leaderboard(winners));
        document.getElementById("btnPlayAgain").addEventListener('click', () => {
            document.getElementById('overlay').classList.remove('open');
            newGame();
            overlayBoard.innerHTML = "";
        });
    } else if (content === "settings") {
        overlayBoard.classList.remove("leader-board");
        overlayBoard.appendChild(settings());

        document.getElementById('btnSet').addEventListener('click', () => {
            try {
                renderInputSettings();
            } catch (err) {
                document.getElementById("inputErrorMessage").innerText = err.message;
                return;
            }
            document.getElementById('overlay').classList.remove('open');
            overlayBoard.innerHTML = "";
        });
        document.getElementById('btnReset').addEventListener('click', () => {
            resetSettings();
            document.getElementById('overlay').classList.remove('open');
            overlayBoard.innerHTML = "";
        });
    }
}

function renderInputSettings() {
    const pc = Number(document.getElementById("playerCount").value);
    const ch = Number(document.getElementById("cardsInHand").value);
    if (pc < 2 || pc > 6) throw new RangeError("Počet hráčů musí být od 2 do 6");
    if (ch < 3 || ch > 8) throw new RangeError("Počet karet musí být od 3 do 8");
    if (pc * ch > 0.65 * numberOfCards) throw new RangeError("Počet rozdaných karet nesmí přesáhnout 65 % všech karet");
    if (pc !== playerCount) {
        playerCount = pc;
        createPlayers();
    }
    playerCount = pc;
    cardsInHand = ch;
    newGame();
}

function resetSettings() {
    playerCount = 4;
    cardsInHand = 4;
    createPlayers();
    newGame();
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

    // Players
    topPlayers.innerHTML = "";
    humanHand.innerHTML = "";
    for (const player of players) {
        if (player.isHuman) {
            // make clickable if human's turn
            let playableIndices = [];
            if (players.indexOf(player) === p_number && !disabled) {
                playableIndices = getAvailableMoves(player);
            }
            player.hand.forEach((card, i) => {
                let playable = playableIndices.includes(i);
                let cardEl = document.createElement("div");
                cardEl.classList = `card card-front ${card.color} ${playable?"clickable":"disabled"}`;
                cardEl.innerText = cardToValue(card);
                if (playable) {
                    cardEl.addEventListener('click', () => {makeMove(player, i)});
                }
                humanHand.appendChild(cardEl);
            });
            continue;
        }
        let highlight = players.indexOf(player) == p_number ? "border-glow" : "";
        let playerEl = `<div>
            <div class="card card-back ${highlight}" id="player${players.indexOf(player)}">${player.hand.length}</div>
            <p class="player-name">${player.name}</p></div>`;
        topPlayers.innerHTML += playerEl;
    }

    // Deck
    const deckElement = document.getElementById("deck");
    const deckClone = deckElement.cloneNode(true);
    deckElement.parentNode.replaceChild(deckClone, deckElement);
    deckClone.classList.remove("clickable");
    if (players[p_number].isHuman && !disabled) {
        deckClone.classList.add("clickable");
        const humanDrawCard = () => makeMove(players[p_number], -1);
        deckClone.addEventListener("click", humanDrawCard);
    }

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
document.getElementById("btnRules").addEventListener("click", () => showOverlay("rules"));
document.getElementById("settings").addEventListener("click", () => showOverlay("settings"));

// Closing overlay
document.getElementById("overlay").addEventListener("click", (e) => {
    if (e.target === document.getElementById('overlay')) {
        document.getElementById('overlay').classList.remove('open');
        document.getElementById("overlayBoard").innerHTML = "";
    }
});

createPlayers();
newGame();