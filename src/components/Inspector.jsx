import React, { useState, useRef } from 'react';
import { PIECE_MAP } from '../data/pieces.js';
import ColorPicker from './ColorPicker.jsx';

export default function Inspector({
  selectedIds,
  pieces,
  onUpdatePiece,
  onDeleteSelected,
  onRotate,
  onFlipH,
  onFlipV,
  isOpen,
  onToggle,
}) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [colorPickerAnchor, setColorPickerAnchor] = useState(null);
  const swatchRef = useRef(null);

  const selectedPieces = pieces.filter(p => selectedIds.includes(p.id));
  const count = selectedPieces.length;
  const currentInkColor = selectedPieces[0]?.inkColor || '#222222';

  const openColorPicker = () => {
    if (swatchRef.current) setColorPickerAnchor(swatchRef.current.getBoundingClientRect());
    setShowColorPicker(true);
  };

  const handleInkColorChange = (color) => {
    selectedPieces.forEach(p => onUpdatePiece(p.id, { inkColor: color }));
  };

  if (!isOpen) {
    return (
      <aside className="inspector" style={{ borderLeft: '2px solid #222', background: '#fff', display: 'flex', alignItems: 'stretch', padding: 0 }}>
        <button
          onClick={onToggle}
          className="panel-collapsed-btn panel-collapsed-btn--right"
          title="Show inspector"
        >
          <span className="panel-collapsed-caret">‹</span>
          <span className="panel-collapsed-label">INFO</span>
        </button>
      </aside>
    );
  }

  function renderContent() {
    if (count === 0) {
      return (
        <div className="inspector__empty">
          Select a piece on the canvas to edit its properties.
          <br /><br />
          Shift-click to select multiple pieces.
        </div>
      );
    }

    if (count > 1) {
      return (
        <>
          <div className="inspector__section">
            <div className="inspector__piece-title">{count} Selected</div>
            <div className="inspector__piece-cat">Multiple pieces</div>
          </div>
          <div className="inspector__section">
            <div className="inspector__row">
              <span className="inspector__key">Ink Color</span>
              <button
                ref={swatchRef}
                className="color-swatch-btn"
                style={{ background: currentInkColor }}
                onClick={openColorPicker}
                title="Set ink color for all selected"
              />
            </div>
          </div>
          <div className="inspector__section">
            <div className="ctrl-btn-group">
              <button className="ctrl-btn danger" onClick={onDeleteSelected}>Delete All</button>
            </div>
          </div>
          {showColorPicker && (
            <ColorPicker
              color={currentInkColor}
              onChange={handleInkColorChange}
              onClose={() => setShowColorPicker(false)}
              anchorRect={colorPickerAnchor}
            />
          )}
        </>
      );
    }

    const piece = selectedPieces[0];
    const def = PIECE_MAP[piece.pieceType];
    if (!def) return null;

    return (
      <>
        <div className="inspector__section">
          <div className="inspector__piece-title">{def.label}</div>
          <div className="inspector__piece-cat">{def.category}</div>
        </div>
        <div className="inspector__section">
          <div className="inspector__row">
            <span className="inspector__key">Position</span>
            <span className="inspector__val">{piece.x}, {piece.y}</span>
          </div>
          <div className="inspector__row">
            <span className="inspector__key">Size</span>
            <span className="inspector__val">{def.widthCells}×{def.heightCells}</span>
          </div>
          <div className="inspector__row">
            <span className="inspector__key">Rotation</span>
            <span className="inspector__val">{piece.rotation}°</span>
          </div>
          <div className="inspector__row">
            <span className="inspector__key">Flip</span>
            <span className="inspector__val">
              {piece.flipX && piece.flipY ? 'X + Y' : piece.flipX ? 'X' : piece.flipY ? 'Y' : 'None'}
            </span>
          </div>
        </div>
        <div className="inspector__section">
          <div className="inspector__row">
            <span className="inspector__key">Block Color</span>
            <div className="block-color-chip" style={{ background: piece.blockColor }} />
          </div>
          <div className="inspector__row">
            <span className="inspector__key">Ink Color</span>
            <button
              ref={swatchRef}
              className="color-swatch-btn"
              style={{ background: piece.inkColor }}
              onClick={openColorPicker}
              title="Click to change ink color"
            />
          </div>
        </div>
        <div className="inspector__section">
          <div className="inspector__key" style={{ marginBottom: 8 }}>Transform</div>
          <div className="ctrl-btn-group" style={{ marginBottom: 8 }}>
            {def.allowedRotations.length > 1 && (
              <button className="ctrl-btn" onClick={onRotate} title="Rotate 90° CW (R)">Rotate R</button>
            )}
            {def.canFlipX && (
              <button className="ctrl-btn" onClick={onFlipH} title="Flip horizontal (H)">Flip H</button>
            )}
            {def.canFlipY && (
              <button className="ctrl-btn" onClick={onFlipV} title="Flip vertical (V)">Flip V</button>
            )}
          </div>
        </div>
        <div className="inspector__section">
          <div className="ctrl-btn-group">
            <button className="ctrl-btn danger" onClick={onDeleteSelected}>Delete</button>
          </div>
        </div>
        {showColorPicker && (
          <ColorPicker
            color={piece.inkColor}
            onChange={handleInkColorChange}
            onClose={() => setShowColorPicker(false)}
            anchorRect={colorPickerAnchor}
          />
        )}
      </>
    );
  }

  return (
    <aside className="inspector">
      <div className="inspector__header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>Inspector</span>
        <button onClick={onToggle} className="panel-topbar-btn panel-topbar-btn--right" title="Hide inspector">›</button>
      </div>
      {renderContent()}
    </aside>
  );
}
