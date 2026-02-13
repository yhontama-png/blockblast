import { useState, useCallback, useRef } from 'react';
import type { Grid, Piece } from "./game/types";
import { generatePieces } from './game/pieces';
import {
  GRID_SIZE,
  createEmptyGrid,
  canPlace,
  placePiece,
  countPieceCells,
  findClears,
  markClearing,
  clearLines,
  calculateScore,
  isGameOver,
} from './game/logic';
import './App.css';

function App() {
  const [grid, setGrid] = useState<Grid>(createEmptyGrid);
  const [pieces, setPieces] = useState<(Piece | null)[]>(() => generatePieces());
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('blockblast-highscore');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [gameOver, setGameOver] = useState(false);
  const [combo, setCombo] = useState(0);
  const [animatingScore, setAnimatingScore] = useState<number | null>(null);

  // Drag state
  const [dragPieceIndex, setDragPieceIndex] = useState<number | null>(null);
  const [ghostPos, setGhostPos] = useState<{ row: number; col: number } | null>(null);
  const [validGhost, setValidGhost] = useState(false);

  // Clearing animation state
  const [clearingCells, setClearingCells] = useState<Set<string>>(new Set());
  const [isClearing, setIsClearing] = useState(false);

  const boardRef = useRef<HTMLDivElement>(null);
  const dragOffsetRef = useRef<{ row: number; col: number }>({ row: 0, col: 0 });

  const getBoardCell = useCallback((clientX: number, clientY: number) => {
    if (!boardRef.current) return null;
    const rect = boardRef.current.getBoundingClientRect();
    const cellSize = rect.width / GRID_SIZE;
    const col = Math.floor((clientX - rect.left) / cellSize);
    const row = Math.floor((clientY - rect.top) / cellSize);
    return { row, col };
  }, []);

  const handlePointerDown = useCallback((index: number, e: React.PointerEvent) => {
    if (isClearing) return;
    const piece = pieces[index];
    if (!piece) return;
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDragPieceIndex(index);

    const rows = piece.shape.length;
    const cols = piece.shape[0].length;
    dragOffsetRef.current = { row: Math.floor(rows / 2), col: Math.floor(cols / 2) };
  }, [pieces, isClearing]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (dragPieceIndex === null) return;
    const piece = pieces[dragPieceIndex];
    if (!piece) return;

    const cell = getBoardCell(e.clientX, e.clientY);
    if (!cell) {
      setGhostPos(null);
      return;
    }

    const placementRow = cell.row - dragOffsetRef.current.row;
    const placementCol = cell.col - dragOffsetRef.current.col;
    const valid = canPlace(grid, piece, placementRow, placementCol);

    setGhostPos({ row: placementRow, col: placementCol });
    setValidGhost(valid);
  }, [dragPieceIndex, pieces, grid, getBoardCell]);

  const doPlace = useCallback((pieceIndex: number, row: number, col: number) => {
    const piece = pieces[pieceIndex]!;
    const cellsPlaced = countPieceCells(piece);
    const newGrid = placePiece(grid, piece, row, col);

    const { rows, cols } = findClears(newGrid);
    const linesCleared = rows.length + cols.length;

    if (linesCleared > 0) {
      const markedGrid = markClearing(newGrid, rows, cols);
      const clearSet = new Set<string>();
      for (const r of rows) for (let c = 0; c < GRID_SIZE; c++) clearSet.add(`${r},${c}`);
      for (const c of cols) for (let r = 0; r < GRID_SIZE; r++) clearSet.add(`${r},${c}`);

      setClearingCells(clearSet);
      setIsClearing(true);
      setGrid(markedGrid);

      const newCombo = combo + 1;
      setCombo(newCombo);
      const points = calculateScore(cellsPlaced, linesCleared) * Math.max(1, newCombo);
      setAnimatingScore(points);

      setScore(prev => {
        const newScore = prev + points;
        if (newScore > highScore) {
          setHighScore(newScore);
          localStorage.setItem('blockblast-highscore', String(newScore));
        }
        return newScore;
      });

      setTimeout(() => {
        const result = clearLines(newGrid, rows, cols);
        setGrid(result.grid);
        setClearingCells(new Set());
        setIsClearing(false);
        setAnimatingScore(null);

        const newPieces = [...pieces];
        newPieces[pieceIndex] = null;
        const allUsed = newPieces.every(p => p === null);
        const nextPieces = allUsed ? generatePieces() : newPieces;
        setPieces(nextPieces);

        if (isGameOver(result.grid, nextPieces)) {
          setGameOver(true);
        }
      }, 350);
    } else {
      setCombo(0);
      const points = calculateScore(cellsPlaced, 0);
      setScore(prev => {
        const newScore = prev + points;
        if (newScore > highScore) {
          setHighScore(newScore);
          localStorage.setItem('blockblast-highscore', String(newScore));
        }
        return newScore;
      });
      setGrid(newGrid);

      const newPieces = [...pieces];
      newPieces[pieceIndex] = null;
      const allUsed = newPieces.every(p => p === null);
      const nextPieces = allUsed ? generatePieces() : newPieces;
      setPieces(nextPieces);

      if (isGameOver(newGrid, nextPieces)) {
        setGameOver(true);
      }
    }
  }, [pieces, grid, combo, highScore]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (dragPieceIndex === null) return;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch { /* ignore */ }

    if (ghostPos && validGhost) {
      doPlace(dragPieceIndex, ghostPos.row, ghostPos.col);
    }

    setDragPieceIndex(null);
    setGhostPos(null);
    setValidGhost(false);
  }, [dragPieceIndex, ghostPos, validGhost, doPlace]);

  const resetGame = useCallback(() => {
    setGrid(createEmptyGrid());
    setPieces(generatePieces());
    setScore(0);
    setCombo(0);
    setGameOver(false);
    setClearingCells(new Set());
    setIsClearing(false);
    setAnimatingScore(null);
  }, []);

  // Build ghost cells for rendering
  const ghostCells = new Set<string>();
  if (dragPieceIndex !== null && ghostPos && pieces[dragPieceIndex]) {
    const piece = pieces[dragPieceIndex]!;
    for (let r = 0; r < piece.shape.length; r++) {
      for (let c = 0; c < piece.shape[r].length; c++) {
        if (piece.shape[r][c]) {
          ghostCells.add(`${ghostPos.row + r},${ghostPos.col + c}`);
        }
      }
    }
  }

  const draggedPiece = dragPieceIndex !== null ? pieces[dragPieceIndex] : null;

  return (
    <div
      className="game-container"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <header className="game-header">
        <div className="score-box">
          <span className="score-label">SCORE</span>
          <span className="score-value">{score}</span>
        </div>
        <h1 className="game-title">BLOCK BLAST!</h1>
        <div className="score-box">
          <span className="score-label">BEST</span>
          <span className="score-value best">{highScore}</span>
        </div>
      </header>

      {animatingScore !== null && (
        <div className="score-popup" key={score}>
          +{animatingScore}
          {combo > 1 && <span className="combo-text"> Combo x{combo}!</span>}
        </div>
      )}

      <div className="board-wrapper">
        <div className="board" ref={boardRef}>
          {Array.from({ length: GRID_SIZE }, (_, r) =>
            Array.from({ length: GRID_SIZE }, (_, c) => {
              const cell = grid[r][c];
              const key = `${r},${c}`;
              const isGhost = ghostCells.has(key);
              const isClear = clearingCells.has(key);

              let className = 'cell';
              if (cell) className += ' filled';
              if (isClear) className += ' clearing';
              if (isGhost && validGhost && !cell) className += ' ghost-valid';

              const style: React.CSSProperties = {};
              if (cell && !isClear) {
                style.backgroundColor = cell.color;
                style.boxShadow = `inset 0 -2px 4px rgba(0,0,0,0.1), inset 0 2px 4px rgba(255,255,255,0.6)`;
              }
              if (isClear && cell) {
                style.backgroundColor = '#fff';
              }
              if (isGhost && validGhost && !cell && draggedPiece) {
                style.backgroundColor = draggedPiece.color;
                style.opacity = 0.4;
              }

              return <div key={key} className={className} style={style} />;
            })
          )}
        </div>
      </div>

      <div className="pieces-tray">
        {pieces.map((piece, index) => (
          <div
            key={piece ? piece.id : `empty-${index}`}
            className={`piece-slot ${!piece ? 'empty' : ''} ${dragPieceIndex === index ? 'dragging' : ''}`}
            onPointerDown={piece ? (e) => handlePointerDown(index, e) : undefined}
          >
            {piece && (
              <div
                className="piece-preview"
                style={{
                  gridTemplateColumns: `repeat(${piece.shape[0].length}, 1fr)`,
                  gridTemplateRows: `repeat(${piece.shape.length}, 1fr)`,
                }}
              >
                {piece.shape.flatMap((row, r) =>
                  row.map((filled, c) => (
                    <div
                      key={`${r}-${c}`}
                      className={`piece-cell ${filled ? 'filled' : ''}`}
                      style={filled ? {
                        backgroundColor: piece.color,
                        boxShadow: `inset 0 -1px 3px rgba(0,0,0,0.1), inset 0 1px 3px rgba(255,255,255,0.6)`,
                      } : undefined}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {gameOver && (
        <div className="game-over-overlay">
          <div className="game-over-modal">
            <h2>Oops!</h2>
            <p className="final-score">{score}</p>
            {score >= highScore && score > 0 && (
              <p className="new-best">New Best!</p>
            )}
            <button className="play-again-btn" onClick={resetGame}>
              Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
