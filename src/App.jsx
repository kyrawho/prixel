import React, { useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import './styles.css';

import Header from './components/Header.jsx';
import Sidebar from './components/Sidebar.jsx';
import Workspace from './components/Workspace.jsx';
import Inspector from './components/Inspector.jsx';
import Toolbar from './components/Toolbar.jsx';

import { PIECE_MAP } from './data/pieces.js';
import { GRID_COLS, GRID_ROWS, CELL_SIZE } from './utils/mirror.js';
import { wouldExceedInventory } from './utils/inventory.js';

const STORAGE_KEY = 'prixel-planner-v1';
const ZOOM_STEP = 0.1;
const ZOOM_MIN = 0.25;
const ZOOM_MAX = 3.0;

// ─── Geometry helpers ─────────────────────────────────────────────────────────

function getEffectiveDims(pieceType, rotation) {
  const def = PIECE_MAP[pieceType];
  if (!def) return { w: 1, h: 1 };
  const rot90 = rotation === 90 || rotation === 270;
  return rot90
    ? { w: def.heightCells, h: def.widthCells }
    : { w: def.widthCells, h: def.heightCells };
}

function isOutOfBounds(x, y, w, h) {
  return x < 0 || y < 0 || x + w > GRID_COLS || y + h > GRID_ROWS;
}

function piecesOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function hasCollision(pieces, excludeId, x, y, w, h) {
  return pieces.some(p => {
    if (p.id === excludeId) return false;
    const { w: pw, h: ph } = getEffectiveDims(p.pieceType, p.rotation);
    return piecesOverlap(x, y, w, h, p.x, p.y, pw, ph);
  });
}

// ─── Default / persist state ──────────────────────────────────────────────────

function defaultState() {
  return {
    projectName: 'Untitled',
    mode: 'print',
    snapToGrid: true,
    enforceInventory: false,
    zoom: 1.0,
    selectedIds: [],
    pieces: [],
    history: [],
    future: [],
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...defaultState(), ...parsed, selectedIds: [], history: [], future: [] };
    }
  } catch (_) {}
  return defaultState();
}

function saveState(state) {
  try {
    // eslint-disable-next-line no-unused-vars
    const { history, future, ...persistable } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persistable));
  } catch (_) {}
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [state, setStateRaw] = useState(loadState);
  const [saved, setSaved] = useState(true);
  const [dropPreview, setDropPreview] = useState(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(true);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const saveTimerRef = useRef(null);
  const moveDragRef = useRef(null);

  // ─── Persist ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveState(state);
      setSaved(true);
    }, 400);
    return () => clearTimeout(saveTimerRef.current);
  }, [state]);

  // ─── Mutation helpers ─────────────────────────────────────────────────────────

  // Wraps a pieces update with history tracking
  const withHistory = useCallback((prev, newPieces) => ({
    ...prev,
    pieces: newPieces,
    history: [...prev.history.slice(-49), prev.pieces],
    future: [],
  }), []);

  const setState = useCallback((updater) => {
    setStateRaw(prev => typeof updater === 'function' ? updater(prev) : { ...prev, ...updater });
    setSaved(false);
  }, []);

  // ─── Undo / redo ─────────────────────────────────────────────────────────────

  const undo = useCallback(() => {
    setStateRaw(prev => {
      if (prev.history.length === 0) return prev;
      const past = prev.history[prev.history.length - 1];
      return {
        ...prev,
        pieces: past,
        history: prev.history.slice(0, -1),
        future: [prev.pieces, ...prev.future.slice(0, 49)],
        selectedIds: [],
      };
    });
    setSaved(false);
  }, []);

  const redo = useCallback(() => {
    setStateRaw(prev => {
      if (prev.future.length === 0) return prev;
      return {
        ...prev,
        pieces: prev.future[0],
        history: [...prev.history.slice(-49), prev.pieces],
        future: prev.future.slice(1),
        selectedIds: [],
      };
    });
    setSaved(false);
  }, []);

  // ─── Piece placement ──────────────────────────────────────────────────────────

  const placePiece = useCallback((pieceType, x, y, extraProps = {}) => {
    setStateRaw(prev => {
      const def = PIECE_MAP[pieceType];
      if (!def) return prev;
      const rotation = extraProps.rotation || 0;
      const { w, h } = getEffectiveDims(pieceType, rotation);
      if (isOutOfBounds(x, y, w, h)) return prev;
      if (hasCollision(prev.pieces, null, x, y, w, h)) return prev;
      if (prev.enforceInventory && wouldExceedInventory(pieceType, prev.pieces)) return prev;
      const newPiece = {
        id: uuidv4(),
        pieceType,
        x,
        y,
        rotation: 0,
        flipX: false,
        flipY: false,
        blockColor: def.blockColor,
        inkColor: def.defaultInkColor,
        layer: prev.pieces.length,
        ...extraProps,
      };
      return { ...withHistory(prev, [...prev.pieces, newPiece]), selectedIds: [newPiece.id] };
    });
    setSaved(false);
  }, [withHistory]);

  const updatePiece = useCallback((id, changes) => {
    setStateRaw(prev => {
      const newPieces = prev.pieces.map(p => p.id === id ? { ...p, ...changes } : p);
      return withHistory(prev, newPieces);
    });
    setSaved(false);
  }, [withHistory]);

  const deleteSelected = useCallback(() => {
    setStateRaw(prev => {
      if (prev.selectedIds.length === 0) return prev;
      const newPieces = prev.pieces.filter(p => !prev.selectedIds.includes(p.id));
      return { ...withHistory(prev, newPieces), selectedIds: [] };
    });
    setSaved(false);
  }, [withHistory]);

  const duplicateSelected = useCallback(() => {
    setStateRaw(prev => {
      if (prev.selectedIds.length === 0) return prev;
      const toClone = prev.pieces.filter(p => prev.selectedIds.includes(p.id));
      const newPieces = [...prev.pieces];
      const newIds = [];
      for (const p of toClone) {
        const { w, h } = getEffectiveDims(p.pieceType, p.rotation);
        const nx = Math.min(p.x + 1, GRID_COLS - w);
        const ny = Math.min(p.y + 1, GRID_ROWS - h);
        if (!hasCollision(newPieces, null, nx, ny, w, h)) {
          const clone = { ...p, id: uuidv4(), x: nx, y: ny, layer: newPieces.length };
          newPieces.push(clone);
          newIds.push(clone.id);
        }
      }
      return { ...withHistory(prev, newPieces), selectedIds: newIds };
    });
    setSaved(false);
  }, [withHistory]);

  const clearCanvas = useCallback(() => {
    setStateRaw(prev => ({ ...withHistory(prev, []), selectedIds: [] }));
    setSaved(false);
    setShowClearModal(false);
  }, [withHistory]);

  // ─── Transform operations ─────────────────────────────────────────────────────

  const rotatePiece = useCallback((id) => {
    setStateRaw(prev => {
      const piece = prev.pieces.find(p => p.id === id);
      if (!piece) return prev;
      const def = PIECE_MAP[piece.pieceType];
      if (!def || def.allowedRotations.length < 2) return prev;
      const allowed = def.allowedRotations;
      const nextRot = allowed[(allowed.indexOf(piece.rotation) + 1) % allowed.length];
      const { w, h } = getEffectiveDims(piece.pieceType, nextRot);
      const nx = Math.min(piece.x, GRID_COLS - w);
      const ny = Math.min(piece.y, GRID_ROWS - h);
      if (hasCollision(prev.pieces, id, nx, ny, w, h)) return prev;
      const newPieces = prev.pieces.map(p =>
        p.id === id ? { ...p, rotation: nextRot, x: nx, y: ny } : p
      );
      return withHistory(prev, newPieces);
    });
    setSaved(false);
  }, [withHistory]);

  const flipH = useCallback((id) => {
    setStateRaw(prev => {
      const newPieces = prev.pieces.map(p => p.id === id ? { ...p, flipX: !p.flipX } : p);
      return withHistory(prev, newPieces);
    });
    setSaved(false);
  }, [withHistory]);

  const flipV = useCallback((id) => {
    setStateRaw(prev => {
      const newPieces = prev.pieces.map(p => p.id === id ? { ...p, flipY: !p.flipY } : p);
      return withHistory(prev, newPieces);
    });
    setSaved(false);
  }, [withHistory]);

  // ─── Selection ────────────────────────────────────────────────────────────────

  const selectPiece = useCallback((id, additive) => {
    setStateRaw(prev => {
      if (additive) {
        const already = prev.selectedIds.includes(id);
        return {
          ...prev,
          selectedIds: already
            ? prev.selectedIds.filter(x => x !== id)
            : [...prev.selectedIds, id],
        };
      }
      return { ...prev, selectedIds: [id] };
    });
  }, []);

  const clearSelection = useCallback(() => {
    setStateRaw(prev => ({ ...prev, selectedIds: [] }));
  }, []);

  // ─── Piece mouse-drag (move) ───────────────────────────────────────────────────

  const handlePieceMouseDown = useCallback((e, id) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    const additive = e.shiftKey;
    selectPiece(id, additive);

    const svgEl = e.currentTarget.closest('svg');
    if (!svgEl) return;

    setStateRaw(prev => {
      const ids = additive
        ? (prev.selectedIds.includes(id) ? prev.selectedIds : [...prev.selectedIds, id])
        : [id];
      const svgRect = svgEl.getBoundingClientRect();
      const zoom = prev.zoom;
      const rawX = (e.clientX - svgRect.left) / zoom;
      const rawY = (e.clientY - svgRect.top) / zoom;
      const offsets = ids.map(pid => {
        const p = prev.pieces.find(x => x.id === pid);
        return p ? { id: pid, ox: p.x, oy: p.y } : null;
      }).filter(Boolean);

      moveDragRef.current = {
        active: true,
        svgRect,
        zoom,
        offsets,
        startCellX: Math.floor(rawX / CELL_SIZE),
        startCellY: Math.floor(rawY / CELL_SIZE),
        originalPieces: prev.pieces,
        committed: false,
      };

      return { ...prev, selectedIds: ids };
    });
  }, [selectPiece]);

  // ─── Document-level mouse events for piece drag ────────────────────────────────

  useEffect(() => {
    function onMouseMove(e) {
      const drag = moveDragRef.current;
      if (!drag || !drag.active) return;
      const rawX = (e.clientX - drag.svgRect.left) / drag.zoom;
      const rawY = (e.clientY - drag.svgRect.top) / drag.zoom;
      const dx = Math.floor(rawX / CELL_SIZE) - drag.startCellX;
      const dy = Math.floor(rawY / CELL_SIZE) - drag.startCellY;
      if (dx === 0 && dy === 0) return;

      setStateRaw(prev => {
        const movingIds = drag.offsets.map(o => o.id);
        let valid = true;
        for (const { id, ox, oy } of drag.offsets) {
          const p = drag.originalPieces.find(x => x.id === id);
          if (!p) continue;
          const { w, h } = getEffectiveDims(p.pieceType, p.rotation);
          if (isOutOfBounds(ox + dx, oy + dy, w, h)) { valid = false; break; }
          const others = prev.pieces.filter(x => !movingIds.includes(x.id));
          if (hasCollision(others, null, ox + dx, oy + dy, w, h)) { valid = false; break; }
        }
        if (!valid) return prev;

        const newPieces = prev.pieces.map(p => {
          const off = drag.offsets.find(o => o.id === p.id);
          return off ? { ...p, x: off.ox + dx, y: off.oy + dy } : p;
        });
        return { ...prev, pieces: newPieces };
      });
    }

    function onMouseUp() {
      const drag = moveDragRef.current;
      if (!drag || !drag.active) return;
      moveDragRef.current = null;
      setStateRaw(prev => {
        const moved = drag.offsets.some(({ id, ox, oy }) => {
          const p = prev.pieces.find(x => x.id === id);
          return p && (p.x !== ox || p.y !== oy);
        });
        if (!moved) return prev;
        return {
          ...prev,
          history: [...prev.history.slice(-49), drag.originalPieces],
          future: [],
        };
      });
      setSaved(false);
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  // ─── Library drag & drop ──────────────────────────────────────────────────────

  useEffect(() => {
    function onDragEnd() {
      window.__draggingPieceType = null;
      setDropPreview(null);
    }
    document.addEventListener('dragend', onDragEnd);
    return () => document.removeEventListener('dragend', onDragEnd);
  }, []);

  const handleGridDragOver = useCallback((rawX, rawY) => {
    const hoveredType = window.__draggingPieceType;
    if (!hoveredType) { setDropPreview(null); return; }
    const def = PIECE_MAP[hoveredType];
    if (!def) return;

    setStateRaw(prev => {
      const gx = prev.snapToGrid
        ? Math.floor(rawX / CELL_SIZE)
        : Math.round(rawX / CELL_SIZE - def.widthCells / 2);
      const gy = prev.snapToGrid
        ? Math.floor(rawY / CELL_SIZE)
        : Math.round(rawY / CELL_SIZE - def.heightCells / 2);
      const sx = Math.max(0, Math.min(gx, GRID_COLS - def.widthCells));
      const sy = Math.max(0, Math.min(gy, GRID_ROWS - def.heightCells));
      const valid = !hasCollision(prev.pieces, null, sx, sy, def.widthCells, def.heightCells)
        && !isOutOfBounds(sx, sy, def.widthCells, def.heightCells);
      setDropPreview({ x: sx, y: sy, w: def.widthCells, h: def.heightCells, valid });
      return prev;
    });
  }, []);

  const handleGridDrop = useCallback((rawX, rawY, pieceType) => {
    if (!pieceType) { setDropPreview(null); return; }
    const def = PIECE_MAP[pieceType];
    if (!def) return;
    const gx = Math.floor(rawX / CELL_SIZE);
    const gy = Math.floor(rawY / CELL_SIZE);
    const sx = Math.max(0, Math.min(gx, GRID_COLS - def.widthCells));
    const sy = Math.max(0, Math.min(gy, GRID_ROWS - def.heightCells));
    placePiece(pieceType, sx, sy);
    setDropPreview(null);
    window.__draggingPieceType = null;
  }, [placePiece]);

  // ─── Grid interactions ────────────────────────────────────────────────────────

  const handleGridMouseDown = useCallback((e) => {
    if (e.target.closest('[data-piece-id]')) return;
    clearSelection();
  }, [clearSelection]);

  const handleGridClick = useCallback((e) => {
    if (e.target.closest('[data-piece-id]')) return;
    clearSelection();
  }, [clearSelection]);

  // ─── Keyboard shortcuts ───────────────────────────────────────────────────────

  useEffect(() => {
    function onKeyDown(e) {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      const meta = e.metaKey || e.ctrlKey;

      if (meta && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); return; }
      if (meta && (e.key === 'Z' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); return; }
      if (meta && e.key === 'd') { e.preventDefault(); duplicateSelected(); return; }
      if (e.key === 'Escape') { clearSelection(); return; }
      if (e.key === 'Delete' || e.key === 'Backspace') { deleteSelected(); return; }

      if (e.key === 'r' || e.key === 'R') {
        setStateRaw(prev => {
          if (prev.selectedIds.length !== 1) return prev;
          const piece = prev.pieces.find(p => p.id === prev.selectedIds[0]);
          if (!piece) return prev;
          const def = PIECE_MAP[piece.pieceType];
          if (!def || def.allowedRotations.length < 2) return prev;
          const allowed = def.allowedRotations;
          const nextRot = allowed[(allowed.indexOf(piece.rotation) + 1) % allowed.length];
          const { w, h } = getEffectiveDims(piece.pieceType, nextRot);
          const nx = Math.min(piece.x, GRID_COLS - w);
          const ny = Math.min(piece.y, GRID_ROWS - h);
          if (hasCollision(prev.pieces, piece.id, nx, ny, w, h)) return prev;
          const newPieces = prev.pieces.map(p =>
            p.id === piece.id ? { ...p, rotation: nextRot, x: nx, y: ny } : p
          );
          return withHistory(prev, newPieces);
        });
        setSaved(false);
        return;
      }

      if (e.key === 'h' || e.key === 'H') {
        setStateRaw(prev => {
          if (prev.selectedIds.length !== 1) return prev;
          const id = prev.selectedIds[0];
          return withHistory(prev, prev.pieces.map(p => p.id === id ? { ...p, flipX: !p.flipX } : p));
        });
        setSaved(false);
        return;
      }

      if (e.key === 'v' || e.key === 'V') {
        setStateRaw(prev => {
          if (prev.selectedIds.length !== 1) return prev;
          const id = prev.selectedIds[0];
          return withHistory(prev, prev.pieces.map(p => p.id === id ? { ...p, flipY: !p.flipY } : p));
        });
        setSaved(false);
        return;
      }

      const arrows = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
      if (arrows[e.key]) {
        e.preventDefault();
        const [dx, dy] = arrows[e.key];
        setStateRaw(prev => {
          if (prev.selectedIds.length === 0) return prev;
          const movingIds = prev.selectedIds;
          let valid = true;
          for (const id of movingIds) {
            const p = prev.pieces.find(x => x.id === id);
            if (!p) continue;
            const { w, h } = getEffectiveDims(p.pieceType, p.rotation);
            if (isOutOfBounds(p.x + dx, p.y + dy, w, h)) { valid = false; break; }
            if (hasCollision(prev.pieces.filter(x => !movingIds.includes(x.id)), null, p.x + dx, p.y + dy, w, h)) {
              valid = false; break;
            }
          }
          if (!valid) return prev;
          const newPieces = prev.pieces.map(p =>
            movingIds.includes(p.id) ? { ...p, x: p.x + dx, y: p.y + dy } : p
          );
          return withHistory(prev, newPieces);
        });
        setSaved(false);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [undo, redo, duplicateSelected, deleteSelected, clearSelection, withHistory]);

  // ─── Render ───────────────────────────────────────────────────────────────────

  const { projectName, mode, snapToGrid, enforceInventory, zoom, selectedIds, pieces, history, future } = state;

  const gridCols = `${libraryOpen ? '220px' : '28px'} 1fr ${inspectorOpen ? '240px' : '28px'}`;

  return (
    <>
      <div className="app" style={{ gridTemplateColumns: gridCols }}>
        <Header
          projectName={projectName}
          onProjectNameChange={name => setState(prev => ({ ...prev, projectName: name }))}
          mode={mode}
          onModeChange={m => setState(prev => ({ ...prev, mode: m }))}
          saved={saved}
        />

        <Sidebar
          placedPieces={pieces}
          enforceInventory={enforceInventory}
          onToggleEnforce={() => setState(prev => ({ ...prev, enforceInventory: !prev.enforceInventory }))}
          isOpen={libraryOpen}
          onToggle={() => setLibraryOpen(o => !o)}
        />

        <Workspace
          pieces={pieces}
          selectedIds={selectedIds}
          mode={mode}
          zoom={zoom}
          dropPreview={dropPreview}
          onPieceMouseDown={handlePieceMouseDown}
          onGridMouseDown={handleGridMouseDown}
          onGridDragOver={handleGridDragOver}
          onGridDrop={handleGridDrop}
          onGridClick={handleGridClick}
        />

        <Inspector
          selectedIds={selectedIds}
          pieces={pieces}
          onUpdatePiece={updatePiece}
          onDeleteSelected={deleteSelected}
          onRotate={() => selectedIds.length === 1 && rotatePiece(selectedIds[0])}
          onFlipH={() => selectedIds.length === 1 && flipH(selectedIds[0])}
          onFlipV={() => selectedIds.length === 1 && flipV(selectedIds[0])}
          isOpen={inspectorOpen}
          onToggle={() => setInspectorOpen(o => !o)}
        />

        <Toolbar
          zoom={zoom}
          onZoomIn={() => setState(prev => ({ ...prev, zoom: Math.min(prev.zoom + ZOOM_STEP, ZOOM_MAX) }))}
          onZoomOut={() => setState(prev => ({ ...prev, zoom: Math.max(prev.zoom - ZOOM_STEP, ZOOM_MIN) }))}
          onZoomReset={() => setState(prev => ({ ...prev, zoom: 1.0 }))}
          snapToGrid={snapToGrid}
          onToggleSnap={() => setState(prev => ({ ...prev, snapToGrid: !prev.snapToGrid }))}
          onClearCanvas={() => setShowClearModal(true)}
          onUndo={undo}
          onRedo={redo}
          canUndo={history.length > 0}
          canRedo={future.length > 0}
        />
      </div>

      {showClearModal && (
        <div className="modal-overlay" onClick={() => setShowClearModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Clear Canvas?</h3>
            <p>This will remove all placed pieces. This action can be undone.</p>
            <div className="modal-actions">
              <button className="ctrl-btn" onClick={() => setShowClearModal(false)}>Cancel</button>
              <button className="ctrl-btn danger" onClick={clearCanvas}>Clear</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
