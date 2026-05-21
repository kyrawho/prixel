import React from 'react';
import { PIECES } from '../data/pieces.js';
import { computeUsedCounts } from '../utils/inventory.js';

export default function InventoryPanel({ placedPieces, enforceInventory, onToggleEnforce }) {
  const usedCounts = computeUsedCounts(placedPieces);
  const overLimitCount = PIECES.filter(p => (usedCounts[p.id] || 0) > p.inventoryCount).length;

  return (
    <div className="inventory-panel">
      <div className="inventory-panel__header">
        <span>Inventory{overLimitCount > 0 ? ` — ${overLimitCount} over limit` : ''}</span>
        <label className="inventory-toggle">
          <div
            className={`toggle-switch${enforceInventory ? ' on' : ''}`}
            onClick={onToggleEnforce}
          />
          Enforce
        </label>
      </div>
    </div>
  );
}
