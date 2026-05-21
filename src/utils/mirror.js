export const GRID_COLS = 24;
export const GRID_ROWS = 16;
export const CELL_SIZE = 24;

/**
 * Returns the mirrored grid X position for a piece in Setup View.
 * The piece's visual width may differ from its logical grid width when rotated 90/270°.
 */
export function mirrorX(x, effectiveWidth) {
  return GRID_COLS - x - effectiveWidth;
}

/**
 * Given a placed piece, return the effective width and height
 * accounting for rotation (90/270 swaps w/h).
 */
export function effectiveDimensions(piece, pieceDef) {
  const rot = piece.rotation % 180;
  if (rot === 90) {
    return { w: pieceDef.heightCells, h: pieceDef.widthCells };
  }
  return { w: pieceDef.widthCells, h: pieceDef.heightCells };
}

/**
 * Build the SVG transform string for a placed piece.
 * Local coordinate system origin is top-left of the piece's bounding box.
 * widthPx / heightPx are the piece's natural SVG dimensions (pre-rotation).
 */
export function buildTransform(rotation, flipX, flipY, widthPx, heightPx) {
  const cx = widthPx / 2;
  const cy = heightPx / 2;

  const transforms = [];

  // Translate to center, apply rotation, translate back
  if (rotation !== 0) {
    transforms.push(`translate(${cx},${cy}) rotate(${rotation}) translate(${-cx},${-cy})`);
  }

  // Apply flips around center
  if (flipX) {
    transforms.push(`translate(${widthPx},0) scale(-1,1)`);
  }
  if (flipY) {
    transforms.push(`translate(0,${heightPx}) scale(1,-1)`);
  }

  return transforms.join(' ') || undefined;
}

/**
 * In Setup View the whole grid is horizontally mirrored.
 * For each piece we need: mirrored X position + horizontal shape flip.
 * Returns { mirroredX, flipX } where flipX is whether to additionally
 * flip the shape (true for asymmetric pieces).
 */
export function setupTransform(piece, pieceDef) {
  const { w } = effectiveDimensions(piece, pieceDef);
  const mx = mirrorX(piece.x, w);

  // In setup view, position is mirrored. Shape is also mirrored (scaleX -1).
  // We combine the setup-mirror flip with any user-applied flipX.
  // net flipX = XOR of setupMirror and piece.flipX
  const netFlipX = !piece.flipX; // setup always adds one horizontal flip

  return { mirroredX: mx, mirroredY: piece.y, netFlipX, netFlipY: piece.flipY };
}
