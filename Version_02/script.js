document.addEventListener('DOMContentLoaded', () => {
    // ... (Mantenha todas as declarações de variáveis)
    const boardElement = document.getElementById('board');
    const currentPlayerText = document.getElementById('current-player-text');
    const scoreBlackElement = document.getElementById('score-black');
    const scoreWhiteElement = document.getElementById('score-white');
    const restartButton = document.getElementById('restart-button');
    const modal = document.getElementById('game-over-modal');
    const modalMessage = document.getElementById('game-over-message');
    const modalRestartButton = document.getElementById('modal-restart-button');
    const modalCloseButton = document.querySelector('.close-button');

    const BOARD_SIZE = 8;
    // -1: Branco, 1: Preto, 0: Vazio
    const DIRECTIONS = [
        [-1, -1], [-1, 0], [-1, 1],
        [ 0, -1],          [ 0, 1],
        [ 1, -1], [ 1, 0], [ 1, 1]
    ];
    
    let boardState;
    let currentPlayer; // Inicia com Preto (1)

    // A duração da animação em milissegundos, deve coincidir com o CSS
    const FLIP_ANIMATION_DURATION = 600; 

    // **********************************************
    // 1. LÓGICA DE INICIALIZAÇÃO
    // **********************************************

    function initializeGame() {
        // ... (Mantenha o código de inicialização)
        // Inicializa o tabuleiro 8x8 com zeros (vazio)
        boardState = Array(BOARD_SIZE).fill(0).map(() => Array(BOARD_SIZE).fill(0));
        
        // Posições iniciais
        boardState[3][3] = -1; // Branco
        boardState[3][4] = 1;  // Preto
        boardState[4][3] = 1;  // Preto
        boardState[4][4] = -1; // Branco

        currentPlayer = 1;
        modal.style.display = 'none'; // Fecha o modal se estiver aberto
        
        // Nova função de renderização que cria a estrutura de disco com duas faces
        renderBoard();
        updateGameStatus();
    }

    // **********************************************
    // 2. LÓGICA DE REGRAS DO REVERSI (Mantenha o código)
    // **********************************************

    // Verifica se as coordenadas estão dentro dos limites do tabuleiro
    function isWithinBounds(row, col) {
        return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
    }

    /**
     * Encontra todas as peças do oponente que seriam viradas por uma jogada.
     * @param {number} row Linha da jogada.
     * @param {number} col Coluna da jogada.
     * @param {number} player Jogador atual (1 ou -1).
     * @returns {Array} Lista de coordenadas [row, col] de peças a serem viradas.
     */
    function getFlippedDiscs(row, col, player) {
        if (boardState[row][col] !== 0) {
            return []; // Célula já ocupada
        }

        const opponent = player * -1;
        let flippedList = [];

        // Verifica nas 8 direções
        for (const [dr, dc] of DIRECTIONS) {
            let path = [];
            let r = row + dr;
            let c = col + dc;

            // Percorre na direção, coletando peças do oponente
            while (isWithinBounds(r, c) && boardState[r][c] === opponent) {
                path.push([r, c]);
                r += dr;
                c += dc;
            }

            // Se o caminho terminar dentro do tabuleiro E na peça do jogador atual (flanqueamento)
            if (isWithinBounds(r, c) && boardState[r][c] === player) {
                flippedList.push(...path); // Adiciona todas as peças flanqueadas
            }
        }

        return flippedList;
    }

    /**
     * Verifica se um movimento é legal (vira pelo menos uma peça).
     * @param {number} row Linha da jogada.
     * @param {number} col Coluna da jogada.
     * @param {number} player Jogador atual (1 ou -1).
     * @returns {boolean} True se o movimento é legal.
     */
    function isValidMove(row, col, player) {
        // Um movimento é válido se a lista de peças a serem viradas não for vazia.
        return getFlippedDiscs(row, col, player).length > 0;
    }

    /**
     * Encontra todos os movimentos válidos para um dado jogador.
     * @param {number} player Jogador atual (1 ou -1).
     * @returns {Array} Lista de coordenadas [row, col] de movimentos válidos.
     */
    function getValidMoves(player) {
        let validMoves = [];
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                if (boardState[r][c] === 0 && isValidMove(r, c, player)) {
                    validMoves.push([r, c]);
                }
            }
        }
        return validMoves;
    }

    // **********************************************
    // 3. LÓGICA DE RENDERIZAÇÃO E EVENTOS
    // **********************************************

    function createDiscElement(state) {
        const discContainer = document.createElement('div');
        discContainer.classList.add('disc-container');

        const blackDisc = document.createElement('div');
        blackDisc.classList.add('disc', 'black');
        discContainer.appendChild(blackDisc);

        const whiteDisc = document.createElement('div');
        whiteDisc.classList.add('disc', 'white');
        discContainer.appendChild(whiteDisc);
        
        // Define o estado inicial da peça baseado no valor
        if (state === -1) { // Branco
            // A peça branca é visualmente 'flipped' em 180deg (disc.white está a 180deg, container está a 180deg)
            discContainer.classList.add('flipped');
        } 
        // Se for 1 (Preto), não adiciona 'flipped' (container está a 0deg)

        return discContainer;
    }


    function renderBoard() {
        boardElement.innerHTML = ''; // Limpa o tabuleiro

        const validMoves = getValidMoves(currentPlayer);
        
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.row = row;
                cell.dataset.col = col;

                // Checa se é um movimento válido para o jogador atual
                const isMoveValid = validMoves.some(move => move[0] === row && move[1] === col);
                
                if (boardState[row][col] === 0 && isMoveValid) {
                    cell.classList.add('valid-move');
                    cell.addEventListener('click', handleMove);
                } else if (boardState[row][col] !== 0) {
                    // Cria a nova estrutura de peça com faces
                    const discContainer = createDiscElement(boardState[row][col]);
                    
                    // Adiciona uma classe ao container principal da célula para fácil acesso se necessário
                    if (boardState[row][col] === 1) {
                         cell.classList.add('black-piece');
                    } else {
                         cell.classList.add('white-piece');
                    }
                    
                    cell.appendChild(discContainer);
                }
                
                boardElement.appendChild(cell);
            }
        }
    }

    function updateGameStatus() {
        let scoreBlack = 0;
        let scoreWhite = 0;

        // Calcula a pontuação
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                if (boardState[r][c] === 1) {
                    scoreBlack++;
                } else if (boardState[r][c] === -1) {
                    scoreWhite++;
                }
            }
        }
        
        scoreBlackElement.textContent = scoreBlack;
        scoreWhiteElement.textContent = scoreWhite;
        currentPlayerText.textContent = currentPlayer === 1 ? 'Preto' : 'Branco';

        // Checa se o jogo terminou
        checkGameEnd(scoreBlack, scoreWhite);
    }

    function checkGameEnd(scoreBlack, scoreWhite) {
        const movesForCurrent = getValidMoves(currentPlayer).length;
        const movesForOpponent = getValidMoves(currentPlayer * -1).length;
        
        // Se ambos os jogadores não puderem se mover ou o tabuleiro estiver cheio
        if ((movesForCurrent === 0 && movesForOpponent === 0) || (scoreBlack + scoreWhite === BOARD_SIZE * BOARD_SIZE)) {
            let message;
            if (scoreBlack > scoreWhite) {
                message = `Fim de Jogo! Preto vence por ${scoreBlack} a ${scoreWhite}.`;
            } else if (scoreWhite > scoreBlack) {
                message = `Fim de Jogo! Branco vence por ${scoreWhite} a ${scoreBlack}.`;
            } else {
                message = `Fim de Jogo! Empate em ${scoreBlack} a ${scoreWhite}.`;
            }
            modalMessage.textContent = message;
            modal.style.display = 'block';
            return;
        }

        // Se o jogador atual não tiver movimentos, pula a vez.
        if (movesForCurrent === 0) {
            alert(`Jogador ${currentPlayer === 1 ? 'Preto' : 'Branco'} não tem movimentos. Pulando a vez.`);
            currentPlayer *= -1; // Pula
            // Não é necessário renderizar duas vezes, o renderBoard já é chamado ao final de initializeGame
            renderBoard();
            updateGameStatus();
        }
    }

    /**
     * Lógica principal de uma jogada
     */
    function handleMove(event) {
        const row = parseInt(event.currentTarget.dataset.row);
        const col = parseInt(event.currentTarget.dataset.col);

        // 1. Obter a lista de peças a serem viradas
        const flippedList = getFlippedDiscs(row, col, currentPlayer);

        if (flippedList.length === 0) {
            return;
        }

        // 2. Colocar a nova peça NO ESTADO (MODELO)
        boardState[row][col] = currentPlayer;

        // 3. ENCONTRAR AS PEÇAS NO DOM PARA O EFEITO DE VIRADA
        const discsToFlipElements = [];
        
        // Pega a célula recém-colocada (onde o clique aconteceu)
        const newCellElement = event.currentTarget; 
        
        // Cria a peça nova ANTES de atualizar o estado do tabuleiro, mas depois de ter certeza do movimento
        const newDiscContainer = createDiscElement(currentPlayer);
        newCellElement.appendChild(newDiscContainer);
        newCellElement.classList.remove('valid-move'); // Remove o highlight

        // Pega as células a serem viradas
        flippedList.forEach(([r, c]) => {
            const cellElement = boardElement.querySelector(`[data-row="${r}"][data-col="${c}"]`);
            if (cellElement) {
                const discContainer = cellElement.querySelector('.disc-container');
                if (discContainer) {
                    discsToFlipElements.push(discContainer);
                }
            }
        });
        
        // 4. ACIONAR A ANIMAÇÃO DE GIRO NO DOM (Adiciona a classe 'flipped')
        discsToFlipElements.forEach(discContainer => {
            // A lógica de giro é: se a peça é preta (não flipped) -> vira (adiciona flipped)
            // se a peça é branca (flipped) -> desvira (remove flipped)
            // Como estamos virando todas para a cor do currentPlayer, o resultado será o mesmo.
            // Para simplificar, vamos forçar o giro.

            // Primeiro, garantir que a transição seja usada para o giro, mas não para a mudança de cor do DOM.
            // A forma mais simples é apenas alternar a classe 'flipped' no DOM.
            
            // Alternar a classe 'flipped' para iniciar a animação
            // Se o jogador for Preto (1), a peça precisa ir para o estado 'não flipped' (transform: rotateY(0deg))
            // Se o jogador for Branco (-1), a peça precisa ir para o estado 'flipped' (transform: rotateY(180deg))
            if (currentPlayer === 1) {
                discContainer.classList.remove('flipped');
            } else { // currentPlayer === -1
                discContainer.classList.add('flipped');
            }

        });
        
        // 5. ATUALIZAR O ESTADO (MODELO) APÓS O INÍCIO DA ANIMAÇÃO
        // Virar as peças do oponente no estado (modelo)
        flippedList.forEach(([r, c]) => {
            boardState[r][c] = currentPlayer;
        });
        
        // 6. Mudar a vez (no modelo)
        currentPlayer *= -1; 
        
        // 7. Renderizar o tabuleiro DEPOIS que a animação terminar
        // Isso garante que o estado do DOM (as classes black/white) só seja atualizado *após* o giro.
        // Usamos um timeout com a duração da animação CSS.
        setTimeout(() => {
            // Agora que a animação de giro terminou, podemos renderizar o novo estado.
            renderBoard();
            updateGameStatus();
        }, FLIP_ANIMATION_DURATION);
    }
    
    // **********************************************
    // 4. LISTENERS (Mantenha o código)
    // **********************************************

    // Botões de reiniciar
    restartButton.addEventListener('click', initializeGame);
    modalRestartButton.addEventListener('click', initializeGame);
    
    // Fechar o modal
    modalCloseButton.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Inicia o jogo ao carregar a página
    initializeGame();
});