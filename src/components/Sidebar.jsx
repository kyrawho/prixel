import React from 'react';
import PieceLibrary from './PieceLibrary.jsx';
import InventoryPanel from './InventoryPanel.jsx';

export default function Sidebar({ placedPieces, enforceInventory, onToggleEnforce, isOpen, onToggle }) {
  if (!isOpen) {
    return (
      <div style={{
        gridArea: 'library',
        borderRight: '2px solid #222',
        background: '#fff',
        display: 'flex',
        alignItems: 'stretch',
      }}>
        <button
          onClick={onToggle}
          className="panel-collapsed-btn"
          title="Show piece library"
        >
          <span className="panel-collapsed-label">PIECES</span>
          <span className="panel-collapsed-caret">›</span>
        </button>
      </div>
    );
  }

  return (
    <div style={{
      gridArea: 'library',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      borderRight: '2px solid #222',
    }}>
      {/* Collapse button in the category header area */}
      <div className="library-topbar">
        <button onClick={onToggle} className="panel-topbar-btn" title="Hide piece library">‹</button>
      </div>

      <div className="library-scroll" style={{ flex: 1, overflowX: 'hidden', minHeight: 0 }}>
        <PieceLibrary placedPieces={placedPieces} enforceInventory={enforceInventory} />
      </div>
      <InventoryPanel
        placedPieces={placedPieces}
        enforceInventory={enforceInventory}
        onToggleEnforce={onToggleEnforce}
      />
    </div>
  );
}
