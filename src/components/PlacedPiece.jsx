import React from 'react';
import { CELL_SIZE } from '../utils/mirror.js';
import { PIECE_MAP } from '../data/pieces.js';

/**
 * Renders a single placed piece as an SVG <g> element.
 * Handles rotation, flipX/Y, and display color (ink or block).
 */
export default function PlacedPiece({
  piece,
  displayMode, // 'print' | 'setup'
  isSelected,
  overrideX,    // optional: mirrored x in setup view
  overrideFlipX, // optional: net flipX in setup view
  onMouseDown,
  onContextMenu,
}) {
  const def = PIECE_MAP[piece.pieceType];
  if (!def) return null;

  const color = displayMode === 'setup' ? piece.blockColor : piece.inkColor;

  // Logical dimensions in cells (accounting for rotation swap)
  const isRotated90or270 = piece.rotation === 90 || piece.rotation === 270;
  const logicalW = isRotated90or270 ? def.heightCells : def.widthCells;
  const logicalH = isRotated90or270 ? def.widthCells : def.heightCells;

  const px = (overrideX !== undefined ? overrideX : piece.x) * CELL_SIZE;
  const py = piece.y * CELL_SIZE;
  const flipX = overrideFlipX !== undefined ? overrideFlipX : piece.flipX;
  const flipY = piece.flipY;

  // Natural SVG size (from viewBox, pre-rotation)
  const [, , vbW, vbH] = def.viewBox.split(' ').map(Number);

  // We render the piece into a square of logicalW*CELL_SIZE × logicalH*CELL_SIZE
  // by composing: translate to center → rotate → scale/flip → translate back
  const bboxW = logicalW * CELL_SIZE;
  const bboxH = logicalH * CELL_SIZE;

  // Build inner transform for the <svg> that holds the piece art
  // The piece art lives in its natural vbW×vbH space.
  // We need to rotate it and optionally flip it, then fit it into bboxW×bboxH.
  const transforms = [];
  const cx = vbW / 2;
  const cy = vbH / 2;

  if (piece.rotation !== 0) {
    transforms.push(`translate(${cx} ${cy}) rotate(${piece.rotation}) translate(${-cx} ${-cy})`);
  }
  if (flipX) {
    transforms.push(`translate(${vbW} 0) scale(-1 1)`);
  }
  if (flipY) {
    transforms.push(`translate(0 ${vbH}) scale(1 -1)`);
  }

  // After rotation, the bounding box of the piece may swap w/h.
  // We use a nested svg with a viewBox that covers the (possibly rotated) space,
  // then scale it to the pixel bbox.
  // For 90/270 rotations, after rotation the shape occupies vbH wide × vbW tall,
  // so we set the outer viewBox accordingly.
  const outerVbW = isRotated90or270 ? vbH : vbW;
  const outerVbH = isRotated90or270 ? vbW : vbH;

  // After rotation we need to re-center the shape into the outer viewBox
  const postRotTranslate = piece.rotation === 90
    ? `translate(0 ${-vbW})`
    : piece.rotation === 180
      ? `translate(${-vbW} ${-vbH})`
      : piece.rotation === 270
        ? `translate(${-vbH} 0)`
        : '';

  const finalTransform = [postRotTranslate, ...transforms].filter(Boolean).join(' ');

  return (
    <g
      className={`placed-piece${isSelected ? ' selected' : ''}`}
      transform={`translate(${px} ${py})`}
      onMouseDown={onMouseDown}
      onContextMenu={onContextMenu}
      data-piece-id={piece.id}
    >
      {/* Render piece art */}
      <svg
        x={0}
        y={0}
        width={bboxW}
        height={bboxH}
        viewBox={`0 0 ${outerVbW} ${outerVbH}`}
        overflow="visible"
        style={{ overflow: 'visible' }}
      >
        <g
          fill={color}
          transform={finalTransform || undefined}
          dangerouslySetInnerHTML={{ __html: def.svgPath }}
        />
      </svg>

      {/* Bounding box for hit testing & selection ring */}
      <rect
        className="piece-selection-ring"
        x={1}
        y={1}
        width={bboxW - 2}
        height={bboxH - 2}
      />
      <rect
        className="piece-outline"
        x={0}
        y={0}
        width={bboxW}
        height={bboxH}
      />
    </g>
  );
}
