import React, { useRef, useEffect } from 'react';

const PRESETS = [
  '#222222', '#FFFFFF', '#EF3F4F', '#2F98D4', '#FFE24A', '#79A35D',
  '#78CFE8', '#8BC56A', '#16736D', '#FF7043', '#9C27B0', '#607D8B',
];

export default function ColorPicker({ color, onChange, onClose, anchorRect }) {
  const ref = useRef(null);

  // Position near anchor
  const style = {};
  if (anchorRect) {
    style.top = anchorRect.bottom + 6;
    style.left = anchorRect.left;
  }

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  return (
    <div className="color-picker-popover" style={style} ref={ref}>
      <h4>Ink Color</h4>
      <div className="color-picker-presets">
        {PRESETS.map(c => (
          <div
            key={c}
            className={`color-preset${color === c ? ' selected' : ''}`}
            style={{ background: c }}
            onClick={() => onChange(c)}
            title={c}
          />
        ))}
      </div>
      <div className="color-picker-custom">
        <label>Custom</label>
        <input
          type="color"
          value={color}
          onChange={e => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}
