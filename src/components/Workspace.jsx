import React from 'react';
import StampGrid from './StampGrid.jsx';

export default function Workspace({
  pieces,
  selectedIds,
  mode,
  zoom,
  dropPreview,
  onPieceMouseDown,
  onGridMouseDown,
  onGridDragOver,
  onGridDrop,
  onGridClick,
}) {
  const gridProps = {
    pieces,
    selectedIds,
    zoom,
    dropPreview,
    onPieceMouseDown,
    onGridMouseDown,
    onGridDragOver,
    onGridDrop,
    onGridClick,
  };

  if (mode === 'split') {
    return (
      <main className="workspace">
        <div className="workspace__inner">
          <div className="workspace__split">
            <div className="workspace__panel">
              <div className="workspace__panel-label print">
                Print Preview
                <span className="workspace__panel-sublabel">— what appears on paper</span>
              </div>
              <StampGrid {...gridProps} displayMode="print" />
            </div>
            <div className="workspace__panel">
              <div className="workspace__panel-label setup">
                Setup View
                <span className="workspace__panel-sublabel">— mirror this to place blocks</span>
              </div>
              <StampGrid {...gridProps} displayMode="setup" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  const displayMode = mode === 'setup' ? 'setup' : 'print';
  const labelClass = displayMode;
  const labelText = displayMode === 'print'
    ? 'Print Preview — what appears on paper'
    : 'Setup View — mirror this to place blocks';

  return (
    <main className="workspace">
      <div className="workspace__inner">
        <div className="workspace__panel">
          <div className={`workspace__panel-label ${labelClass}`}>
            {labelText}
          </div>
          <StampGrid {...gridProps} displayMode={displayMode} />
        </div>
      </div>
    </main>
  );
}
