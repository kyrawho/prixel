import { PIECE_MAP } from '../data/pieces.js';

/** Returns a map of { pieceTypeId -> usedCount } */
export function computeUsedCounts(placedPieces) {
  const counts = {};
  for (const p of placedPieces) {
    counts[p.pieceType] = (counts[p.pieceType] || 0) + 1;
  }
  return counts;
}

/** Returns true if placing one more of pieceTypeId would exceed inventory */
export function wouldExceedInventory(pieceTypeId, placedPieces) {
  const def = PIECE_MAP[pieceTypeId];
  if (!def) return false;
  const used = placedPieces.filter(p => p.pieceType === pieceTypeId).length;
  return used >= def.inventoryCount;
}
