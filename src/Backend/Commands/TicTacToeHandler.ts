function* chunk(arr: string[], length: number) {
    for(let i = 0; i < arr.length; i += length) {
        yield arr.slice(i, i + length);
    }
}

class TicTacToe {
    board: string[][] = Array.from(chunk(Array(81).fill(' '), 9));
    state = {
        pos: {
            1: ' ',
            2: ' ',
            3: ' ',
            4: ' ',
            5: ' ',
            6: ' ',
            7: ' ',
            8: ' ',
            9: ' '
        },
        turn: 'X'
    }

    go(at: number) {
        if(this.state.pos[at + 1] !== ' ') {
            return 0;
        }

        this.state.pos[at + 1] = this.state.turn;
        this.board[at][4] = this.state.turn;
        
        if(this.checkWinner()) {
            return 2;
        }

        this.setTurn();
        return 1;
    }

    goRandom() {
        if(this.state.turn === 'X') {
            return 0;
        }
        
        while(true) {
            const random = Math.floor(Math.random() * 8 + 1);
            if(this.state.pos[random] === ' ') {
                this.state.pos[random] = this.state.turn;
                
                if(this.checkWinner()) {
                    return 2;
                }

                this.setTurn();
                return 1;
            }
        }
    }

    setTurn() {
        return this.state.turn = this.state.turn === 'X' ? 'O' : 'X';
    }

    checkWinner() {
        const lines = [
            [0, 1, 2],
            [3, 4, 5],
            [6, 7, 8],
            [0, 3, 6],
            [1, 4, 7],
            [2, 5, 8],
            [0, 4, 8],
            [2, 4, 6],
        ];
        
        const squares = Object.values(this.state.pos);
        for(let i = 0; i < lines.length; i++) {
            const [a,b,c] = lines[i];
            if( squares[a] !== ' ' && 
                squares[a] === squares[b] && squares[a] === squares[c]
            ) {
                return this.state.turn;
            }
        }
        
        return null;
    }

    formatBoard() {
        const { pos } = this.state;

        return `
     │     │    
  ${pos[1]}  │  ${pos[2]}  │  ${pos[3]}
     │     │
─────────────────
     │     │
  ${pos[4]}  │  ${pos[5]}  │  ${pos[6]}
     │     │
─────────────────
     │     │
  ${pos[7]}  │  ${pos[8]}  │  ${pos[9]}
     │     │
        `;
    }
}

export { TicTacToe };