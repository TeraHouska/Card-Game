export function rules() {
    const rulesEl = document.createElement("div");
    rulesEl.innerHTML = `<h2>Jak hrát</h2>
            <p>Pravidla jsou podobná karetní hře <strong>prší</strong>, nebo <strong>UNO</strong>.</p>
            <ul>
                <li>Na začátku každý hráč dostane <strong>4 karty</strong>.</li>
                <li>Hráč, který je na řadě odhodí kartu, která se shoduje s kartou na stole buď <strong>barvou</strong> (♠ ♥ ♦ ♣) nebo <strong>hodnotou</strong> (A, 2, 3 … K).</li>
                <li>Pokud hráč nemá v ruce kartu, kterou může zahrát, lízne si jednu kartu z balíčku.</li>
                <li><strong>Karta Q</strong> je měnič a lze s ní změnit barvu na stole.</li>
                <li><strong>Karta A</strong> je eso. Další hráč musí zahrát buď eso, nebo se zdržet tahu.</li>
                <li>Po zahrání <strong>karty 7</strong> musí další hráč zahrát také <strong>kartu 7</strong>, nebo si lízne za každou takto zahranou <strong>kartu 7</strong> dvě karty. (maximálně 8)</li>
                <li><strong>Vítězem</strong> je ten hráč, kterému nezbydou v ruce žádné karty!</li>
            </ul>`;
        const btnClose = document.createElement("button");
        btnClose.innerText = "Chápu";
        btnClose.addEventListener('click', () => {
            document.getElementById('overlay').classList.remove('open');
            rulesEl.parentElement.innerHTML = "";
        });
        rulesEl.appendChild(btnClose);
    return rulesEl;
}

export function leaderboard(winners) {
    const leaderboardEl = document.createElement("div");
    leaderboardEl.classList.add("leader-board");
    let lbContent = `<h2>Síň slávy</h2><table>
                <thead>
                    <tr>
                        <th>Pořadí</th>
                        <th>Jméno</th>
                        <th>Skóre</th>
                        <th>Celkem</th>
                    </tr>
                </thead><tbody>`;
    winners.forEach((winner, index) => {lbContent += `<tr class="${winner.isHuman ? "red-bold" : ""}">
        <td>${index+1 + "."}</td>
        <td>${winner.name}</td>
        <td>${winner.lastScore}</td>
        <td>${winner.score}</td></tr>`});
    lbContent += `</tbody></table>
                <button id="btnPlayAgain">Hrát znovu</button>`;
    leaderboardEl.innerHTML = lbContent;
    return leaderboardEl;
}

export function settings() {
    const settingsEl = document.createElement("div");
    settingsEl.innerHTML = `
                    <label for="playerCount">Počet hráčů</label>
                    <input type="number" id="playerCount" value="${playerCount}" min="2" max="6" />
                    <label for="cardsInHand">Počet karet</label>
                    <input type="number" id="cardsInHand" value="${cardsInHand}" min="3" max="8" />
                    <button id="btnSet">Použít</button>
                    <button id="btnReset">Resetovat</button>
                    <p id="inputErrorMessage"></p>`;
        return settingsEl;
}