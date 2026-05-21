import React, { useCallback } from 'react';
import { PIECES, CATEGORIES } from '../data/pieces.js';
import { computeUsedCounts } from '../utils/inventory.js';

const THUMB_SIZE = 36; // px for library thumbnails

function PieceThumbnail({ def }) {
  const [, , vbW, vbH] = def.viewBox.split(' ').map(Number);
  const maxDim = Math.max(vbW, vbH);
  const scale = THUMB_SIZE / maxDim;
  const displayW = vbW * scale;
  const displayH = vbH * scale;

  return (
    <svg
      width={displayW}
      height={displayH}
      viewBox={def.viewBox}
      style={{ overflow: 'visible', display: 'block' }}
    >
      <g
        fill={def.blockColor}
        dangerouslySetInnerHTML={{ __html: def.svgPath }}
      />
    </svg>
  );
}

export default function PieceLibrary({ placedPieces, enforceInventory }) {
  const usedCounts = computeUsedCounts(placedPieces);

  const handleDragStart = useCallback((e, pieceId) => {
    e.dataTransfer.setData('pieceType', pieceId);
    e.dataTransfer.effectAllowed = 'copy';
    // Set global so dragOver handlers can read pieceType (dataTransfer unreadable during dragover)
    window.__draggingPieceType = pieceId;
  }, []);

  return (
    <aside className="library">
      {CATEGORIES.map(cat => {
        const catPieces = PIECES.filter(p => p.category === cat);
        return (
          <div className="library__section" key={cat}>
            <div className="library__category-header">{cat}</div>
            <div className="library__grid">
              {catPieces.map(def => {
                const used = usedCounts[def.id] || 0;
                const overLimit = used > def.inventoryCount;
                return (
                  <div
                    key={def.id}
                    className={`library__piece-tile${overLimit ? ' over-limit' : ''}`}
                    draggable
                    onDragStart={e => handleDragStart(e, def.id)}
                    title={`${def.label} — ${def.widthCells}×${def.heightCells} — ${used}/${def.inventoryCount} used`}
                  >
                    <PieceThumbnail def={def} />
                    <div className="library__piece-label">{def.label}</div>
                    <div className={`library__piece-count${overLimit ? ' over-limit' : ''}`}>
                      {used}/{def.inventoryCount}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </aside>
  );
}
