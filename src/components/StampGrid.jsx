import React, { useRef, useCallback } from 'react';
import { GRID_COLS, GRID_ROWS, CELL_SIZE } from '../utils/mirror.js';
import { PIECE_MAP } from '../data/pieces.js';
import PlacedPiece from './PlacedPiece.jsx';

const GRID_W = GRID_COLS * CELL_SIZE;
const GRID_H = GRID_ROWS * CELL_SIZE;

export default function StampGrid({
  pieces,
  selectedIds,
  displayMode,
  zoom,
  dropPreview,    // { x, y, w, h, valid } | null
  onPieceMouseDown,
  onGridMouseDown,
  onGridDragOver,
  onGridDrop,
  onGridClick,
}) {
  const svgRef = useRef(null);

  // Build grid lines
  const gridLines = [];
  for (let c = 0; c <= GRID_COLS; c++) {
    const isMajor = c % 4 === 0;
    gridLines.push(
      <line
        key={`v${c}`}
        className={isMajor ? 'grid-line-major' : 'grid-line'}
        x1={c * CELL_SIZE} y1={0}
        x2={c * CELL_SIZE} y2={GRID_H}
      />
    );
  }
  for (let r = 0; r <= GRID_ROWS; r++) {
    const isMajor = r % 4 === 0;
    gridLines.push(
      <line
        key={`h${r}`}
        className={isMajor ? 'grid-line-major' : 'grid-line'}
        x1={0} y1={r * CELL_SIZE}
        x2={GRID_W} y2={r * CELL_SIZE}
      />
    );
  }

  // Sort pieces by layer
  const sorted = [...pieces].sort((a, b) => a.layer - b.layer);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const rawX = (e.clientX - rect.left) / zoom;
    const rawY = (e.clientY - rect.top) / zoom;
    onGridDragOver && onGridDragOver(rawX, rawY);
  }, [zoom, onGridDragOver]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const rawX = (e.clientX - rect.left) / zoom;
    const rawY = (e.clientY - rect.top) / zoom;
    onGridDrop && onGridDrop(rawX, rawY, e.dataTransfer.getData('pieceType'));
  }, [zoom, onGridDrop]);

  return (
    <div
      className="stamp-grid-wrap"
      style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
    >
      <svg
        ref={svgRef}
        className="stamp-grid"
        width={GRID_W}
        height={GRID_H}
        viewBox={`0 0 ${GRID_W} ${GRID_H}`}
        onMouseDown={onGridMouseDown}
        onClick={onGridClick}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Grid lines */}
        <g>{gridLines}</g>

        {/* Drop preview */}
        {dropPreview && (
          <rect
            x={dropPreview.x * CELL_SIZE}
            y={dropPreview.y * CELL_SIZE}
            width={dropPreview.w * CELL_SIZE}
            height={dropPreview.h * CELL_SIZE}
            className={dropPreview.valid ? 'drop-cell-ok' : 'drop-cell-bad'}
            rx={1}
          />
        )}

        {/* Placed pieces */}
        {sorted.map(piece => {
          const isSetup = displayMode === 'setup';
          let overrideX, overrideFlipX;

          if (isSetup) {
            const def = PIECE_MAP[piece.pieceType];
            if (def) {
              const isRot90 = piece.rotation === 90 || piece.rotation === 270;
              const effW = isRot90 ? def.heightCells : def.widthCells;
              overrideX = GRID_COLS - piece.x - effW;
              overrideFlipX = !piece.flipX;
            }
          }

          return (
            <PlacedPiece
              key={piece.id}
              piece={piece}
              displayMode={displayMode}
              isSelected={selectedIds.includes(piece.id)}
              overrideX={isSetup ? overrideX : undefined}
              overrideFlipX={isSetup ? overrideFlipX : undefined}
              onMouseDown={(e) => onPieceMouseDown && onPieceMouseDown(e, piece.id)}
            />
          );
        })}
      </svg>
    </div>
  );
}
