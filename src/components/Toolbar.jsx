import React from 'react';

export default function Toolbar({
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  snapToGrid,
  onToggleSnap,
  onClearCanvas,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}) {
  return (
    <div className="toolbar">
      <div className="toolbar__group">
        <button className="toolbar-btn" onClick={onUndo} disabled={!canUndo} title="Undo (Cmd+Z)">
          Undo
        </button>
        <button className="toolbar-btn" onClick={onRedo} disabled={!canRedo} title="Redo (Cmd+Shift+Z)">
          Redo
        </button>
      </div>

      <div className="toolbar__separator" />

      <div className="toolbar__group">
        <button className="toolbar-btn" onClick={onZoomOut} title="Zoom out">−</button>
        <span className="zoom-level">{Math.round(zoom * 100)}%</span>
        <button className="toolbar-btn" onClick={onZoomIn} title="Zoom in">+</button>
        <button className="toolbar-btn" onClick={onZoomReset} title="Reset zoom">Reset</button>
      </div>

      <div className="toolbar__separator" />

      <div className="toolbar__group">
        <button
          className={`toolbar-btn${snapToGrid ? ' active' : ''}`}
          onClick={onToggleSnap}
          title="Snap to grid"
        >
          Snap
        </button>
      </div>

      <div className="toolbar__separator" />

      <div className="toolbar__group">
        <button className="toolbar-btn danger" onClick={onClearCanvas} title="Clear all pieces">
          Clear Canvas
        </button>
      </div>
    </div>
  );
}
