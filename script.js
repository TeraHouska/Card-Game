
const cards = []; // deck
const table = [];
const players = [];
const SUITS = ['','♥','♦','♣','♠']
const RANKS = ['','A','2','3','4','5','6','7','8','9','10','J','Q','K','A']
let p_number = 0; // player to move
let active_card = 0; // ACE or SEVEN
let queen_effect = 0; // 0 ... no effect, 1-4 ... according to colors

function createCards() {
    cards.splice(0, cards.length); // clear cards
    for (let i = 7; i < 15; i++) {
        for (let j = 1; j < 5; j++) {
            cards.push([i,j]);
        }
    }
    cards.sort(() => Math.random() - 0.5);
}

function createPlayers(p_count, c_count) {
    players.splice(0, players.length);
    for (let i = 0; i < p_count; i++) {
        let player = [];
        for (let j = 0; j < c_count; j++) {
            player.push(cards.pop());
        }
        players.push(player);
    }
}

function createTable() {
    table.splice(0, table.length);
    table.push(cards.pop());
}

function cardsToString(cardArray) {
    let c = "";
    for (let i = 0; i < cardArray.length; i++) {
        c += "[" + cardArray[i] + "] ";
    }
    return c;
}

function cardToValue(card) {
    return RANKS[card[0]] + SUITS[card[1]];
}

function logBoard() {
    let board = `Table: ${cardsToString(table)}\n`;
    for (let p = 0; p < players.length; p++) {
        board += `Player ${p}: ${cardsToString(players[p])}\n`;
    }
    board += `Deck(${cards.length}): ${cardsToString(cards)}\n`;
    console.log(board);
    /*document.getElementById("board").innerHTML = '<button onClick="nextMove()">Další tah</button>';*/
}

function showRules() {
    document.getElementById("rules").innerHTML = "<h2>Pravidla jsou velmi jednoduchá, to pochopíš</h2>";
}

function drawCard() {
    if (cards.length == 0) {
        console.log("FLIPPING DECK")
        for (let i = 0; i < table.length-1; i++) {
            cards.push(table.pop());
        }
    }
    players[p_number].push(cards.pop());
}

function chooseQueenEffect() {
    try {
        return players[p_number][0][1]; // return color of the first card
    } catch (e) {return 0};
}

function pcMove() {
    console.log("pcMove");
    const n = table[table.length - 1][0];
    const c = (queen_effect!=0 && n == 12)? queen_effect: table[table.length - 1][1];
    console.log("table: " + n + " " + c);

    // Na stole ACE
    if (n == 14 && active_card) {
        for (let i = 0; i < players[p_number].length; i++) {
            if (players[p_number][i][0] == 14) {
                table.push(players[p_number][i]);
                players[p_number].splice(i, 1);
                return;
            }
        }
        active_card = 0;
        console.log("stojím, další efekt 0");
        return;
    }

    // Na stole SEVEN
    if (n == 7 && active_card) {
        for (let i = 0; i < players[p_number].length; i++) {
            if (players[p_number][i][0] == 7) {
                table.push(players[p_number][i]);
                players[p_number].splice(i, 1);
                active_card += 2;
                return;
            }
        }
        for (let i = 0; i < active_card; i++) {
            drawCard();
        }
        console.log("líznul jsem si " + active_card + " karet")
        active_card = 0;
        return;
    }

    // Běžný tah
    for (let i = 0; i < players[p_number].length; i++) {
        if (players[p_number][i][0] != 12 && (players[p_number][i][0] == n || players[p_number][i][1] == c)) {
            table.push(players[p_number][i]);
            players[p_number].splice(i, 1);
            if (table[table.length-1][0] == 14) active_card = 1;
            if (table[table.length-1][0] == 7) active_card = 2;
            return;
        }
    }

    // Zahrání QUEEN
    for (let i = 0; i < players[p_number].length; i++) {
        if (players[p_number][i][0] == 12) {
            table.push(players[p_number][i]);
            players[p_number].splice(i, 1);
            queen_effect = chooseQueenEffect();
            console.log("queen played color: " + queen_effect);
            return;
        }
    }

    console.log("drawing a card");
    drawCard();
}

function humanMove() {
    
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
    tableElement.classList.remove("red");
    if ([1,2].includes(table[table.length-1][1])) {
        tableElement.classList.add("red");
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

function newGame() {
    createCards();
    createPlayers(4, 4);
    createTable();
    p_number = 0;
    logBoard();
    updateUI();
}

function nextMove() {
    pcMove();
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