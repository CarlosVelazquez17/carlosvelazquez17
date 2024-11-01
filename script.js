let isFirstClick = true;
let gameOver = false;
let currentLevel = '';
let currentCols = 0;
let currentRows = 0;
let flagCount = 0; // Solo se usa para mostrar el número de banderas restantes al usuario
let minesLeft = 0; // Minas que deben ser correctamente marcadas para ganar
let totalMines = 0;
let timerInterval;
let timeElapsed = 0;
let board = []; // Definimos el tablero a nivel global

function startGame(level, cols = 5, rows = 5, customMines = null) {
    document.getElementById("levelSelection").style.display = "none";
    document.getElementById("homeButton").style.display = "block";
    document.getElementById("gameBoardContainer").style.display = "flex";
    document.getElementById("gameInfo").style.display = "flex";
    document.getElementById("gameOverModal").style.display = "none";

    currentLevel = level;

    if (level === 'custom') {
        // Usa los valores actuales de los sliders para el juego personalizado
        cols = parseInt(document.getElementById("customCols").value);
        rows = parseInt(document.getElementById("customRows").value);
        const minePercentage = parseInt(document.getElementById("customMines").value) / 100;
        totalMines = Math.round(cols * rows * minePercentage);
    } else {
        // Configuración para niveles predefinidos
        switch (level) {
            case 'easy':
                cols = 5; rows = 5; totalMines = 6;
                break;
            case 'medium':
                cols = 8; rows = 8; totalMines = 9;
                break;
            case 'hard':
                cols = 16; rows = 16; totalMines = 40;
                break;
            case 'hardcore':
                cols = 30; rows = 16; totalMines = 99;
                break;
            case 'legend':
                cols = 30; rows = 24; totalMines = 130;
                break;
            default:
                console.error("Nivel no válido seleccionado");
                return;
        }
    }

    currentCols = cols;
    currentRows = rows;

    // Inicialización de contadores y actualización de la interfaz
    flagCount = totalMines;
    minesLeft = totalMines;
    document.getElementById("currentLevelName").textContent = level.charAt(0).toUpperCase() + level.slice(1);
    document.getElementById("mineCounter").textContent = flagCount;

    resetTimer();
    isFirstClick = true;
    gameOver = false;

    initializeBoard(cols, rows);
}

function handleCellClick(row, col) {
    if (gameOver) return;

    const cell = board[row][col];

    if (isFirstClick) {
        isFirstClick = false;
        startTimer();

        // Colocar minas después del primer clic
        placeMines(row, col); // Genera minas en el tablero evitando el área alrededor de la celda inicial

        // Expande los espacios vacíos a partir del primer clic
        revealCell(row, col);
    } else {
        if (cell.revealed || cell.mark === 1) return;

        if (cell.mine) {
            gameOver = true;
            stopTimer();
            revealBoard(false); // Revela todo el tablero al perder, sin mostrar banderas incorrectas
            showGameOver("Game Over");
            return;
        }

        revealCell(row, col);
    }

    checkWinCondition();
}

function placeMines(excludeRow, excludeCol) {
    let placedMines = 0;

    while (placedMines < totalMines) {
        const row = Math.floor(Math.random() * currentRows);
        const col = Math.floor(Math.random() * currentCols);

        const cell = board[row][col];

        // Evita colocar una mina en la celda excluida y en las celdas adyacentes al primer clic
        if ((row === excludeRow && col === excludeCol) || isAdjacentTo(row, col, excludeRow, excludeCol) || cell.mine) continue;

        cell.mine = true;
        placedMines++;
    }
}

// Función para verificar si una celda es adyacente a la posición del primer clic
function isAdjacentTo(row, col, excludeRow, excludeCol) {
    return (
        row >= excludeRow - 1 && row <= excludeRow + 1 &&
        col >= excludeCol - 1 && col <= excludeCol + 1
    );
}


function handleRightClick(row, col) {
    if (gameOver) return;

    const cell = board[row][col];
    const cellElement = document.querySelector(`.cell[data-row='${row}'][data-col='${col}']`);

    if (cell.revealed) return;

    if (isFirstClick) {
        isFirstClick = false;
        startTimer();
        placeMines(row, col); // Colocar minas evitando la celda clicada
    }

    // Alterna la bandera en la celda y ajusta `flagCount` y `minesLeft` sin interferir con la lógica de victoria
    if (cell.mark === 0) {
        cell.mark = 1;
        cellElement.textContent = "🚩";
        flagCount--; // Permitir que `flagCount` sea negativo sin interferir en el juego
        if (cell.mine) minesLeft--; // Ajusta minas restantes solo si marca una mina correctamente
    } else if (cell.mark === 1) {
        cell.mark = 2;
        cellElement.textContent = "?";
        flagCount++; // Incrementa `flagCount` si quita una marca
        if (cell.mine) minesLeft++; // Ajusta minas restantes solo si quita una marca de mina correcta
    } else {
        cell.mark = 0;
        cellElement.textContent = "";
    }

    document.getElementById("mineCounter").textContent = flagCount; // Muestra el contador de banderas al usuario

    checkWinCondition(); // Verifica si ha ganado después de cada cambio de marca
}

function initializeBoard(cols, rows) {
    board = [];
    for (let r = 0; r < rows; r++) {
        const row = [];
        for (let c = 0; c < cols; c++) {
            row.push({ revealed: false, mine: false, neighborMines: 0, mark: 0 });
        }
        board.push(row);
    }
    renderBoard();
}

function renderBoard() {
    const gameBoard = document.getElementById('game-board');
    gameBoard.innerHTML = '';
    gameBoard.style.gridTemplateColumns = `repeat(${currentCols}, 30px)`;
    gameBoard.style.gridTemplateRows = `repeat(${currentRows}, 30px)`;

    board.forEach((row, r) => {
        row.forEach((cell, c) => {
            const cellElement = document.createElement('div');
            cellElement.classList.add('cell');
            cellElement.dataset.row = r;
            cellElement.dataset.col = c;

            cellElement.addEventListener('click', () => {
                handleCellClick(r, c);
            });

            cellElement.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                handleRightClick(r, c);
            });

            gameBoard.appendChild(cellElement);
        });
    });
}

function startTimer() {
    timerInterval = setInterval(() => {
        timeElapsed++;

        // Convierte `timeElapsed` en horas, minutos y segundos
        const hours = Math.floor(timeElapsed / 3600);
        const minutes = Math.floor((timeElapsed % 3600) / 60);
        const seconds = timeElapsed % 60;

        // Formatea las horas, minutos y segundos con dos dígitos
        const formattedTime = 
            String(hours).padStart(2, '0') + ':' +
            String(minutes).padStart(2, '0') + ':' +
            String(seconds).padStart(2, '0');

        // Actualiza el contador en la interfaz
        document.getElementById("timeCounter").textContent = formattedTime;
    }, 1000);
}

function resetTimer() {
    clearInterval(timerInterval);
    timeElapsed = 0;
    document.getElementById("timeCounter").textContent = "00:00:00";
}

function stopTimer() {
    clearInterval(timerInterval);
}

function revealCell(row, col) {
    if (row < 0 || col < 0 || row >= currentRows || col >= currentCols) return;

    const cell = board[row][col];
    if (cell.revealed || cell.mine || cell.mark === 1) return;

    cell.revealed = true;
    const cellElement = document.querySelector(`.cell[data-row='${row}'][data-col='${col}']`);
    cellElement.classList.add('revealed');
    const neighbors = countNeighborMines(row, col);

    if (neighbors > 0) {
        cellElement.textContent = neighbors;
    } else {
        revealCell(row - 1, col);
        revealCell(row + 1, col);
        revealCell(row, col - 1);
        revealCell(row, col + 1);
        revealCell(row - 1, col - 1);
        revealCell(row - 1, col + 1);
        revealCell(row + 1, col - 1);
        revealCell(row + 1, col + 1);
    }
}

function countNeighborMines(row, col) {
    let mineCount = 0;
    for (let r = row - 1; r <= row + 1; r++) {
        for (let c = col - 1; c <= col + 1; c++) {
            if (r >= 0 && r < currentRows && c >= 0 && c < currentCols) {
                if (board[r][c].mine) mineCount++;
            }
        }
    }
    return mineCount;
}

function checkWinCondition() {
    let hasWon = true;
    board.forEach(row => {
        row.forEach(cell => {
            if (!cell.mine && !cell.revealed) {
                hasWon = false;
            }
        });
    });

    if (hasWon && minesLeft === 0) { // Condición de victoria solo basada en `minesLeft`
        gameOver = true;
        stopTimer();
        showGameOver("You Win!");
    }
}

function revealBoard(showMarks) {
    board.forEach((row, r) => {
        row.forEach((cell, c) => {
            const cellElement = document.querySelector(`.cell[data-row='${r}'][data-col='${c}']`);
            cellElement.classList.add('revealed');
            if (cell.mine) {
                cellElement.textContent = "💣";
            } else {
                const neighbors = countNeighborMines(r, c);
                if (neighbors > 0) {
                    cellElement.textContent = neighbors;
                }
            }
            if (!showMarks) {
                cellElement.classList.remove("flagged"); // Quita las banderas sobrantes
            }
        });
    });
}

function showGameOver(message) {
    const modal = document.getElementById("gameOverModal");
    const modalMessage = document.getElementById("modalMessage");
    modalMessage.textContent = message;
    modal.style.display = 'flex';
}

function closeGameOver() {
    document.getElementById("gameOverModal").style.display = "none";
}

function restartGame() {
    closeGameOver(); // Cierra el modal de fin de juego si está abierto
    resetTimer(); // Reinicia el temporizador

    // Llama a `startGame` con los parámetros actuales
    startGame(currentLevel, currentCols, currentRows);
}

function returnToLevelSelection() {
    gameOver = true;
    resetTimer();
    document.getElementById("gameOverModal").style.display = "none";
    document.getElementById("levelSelection").style.display = "block";
    document.getElementById("homeButton").style.display = "none";
    document.getElementById("gameBoardContainer").style.display = "none";
    document.getElementById("gameInfo").style.display = "none";
}

function selectCustomSettings() {
    // Mostrar controles de personalización para el nivel custom
    document.getElementById("customCols").style.display = "block";
    document.getElementById("customRows").style.display = "block";
    document.getElementById("customMines").style.display = "block";
}

function updateCustomSettings() {
    // Obtiene los valores actuales de los sliders
    const cols = parseInt(document.getElementById("customCols").value);
    const rows = parseInt(document.getElementById("customRows").value);
    const minePercentage = parseInt(document.getElementById("customMines").value); // Obtenemos el valor entero directamente

    // Calcula el número de minas en función del tamaño y el porcentaje
    const totalMines = Math.round(cols * rows * (minePercentage / 100));

    // Actualiza los valores mostrados en la interfaz, asegurando que solo muestra enteros
    document.getElementById("customColsValue").textContent = cols;
    document.getElementById("customRowsValue").textContent = rows;
    document.getElementById("customMinesValue").textContent = minePercentage + '% (' + totalMines + ')';
}

function startCustomGame() {
    // Lee los valores actuales de los sliders
    const cols = parseInt(document.getElementById("customCols").value);
    const rows = parseInt(document.getElementById("customRows").value);
    const minePercentage = parseInt(document.getElementById("customMines").value) / 100;

    // Calcula el total de minas según la configuración actual
    const totalMines = Math.round(cols * rows * minePercentage);
    startGame('custom', cols, rows, totalMines);
}
