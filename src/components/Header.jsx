import React from 'react';

export default function Header({ projectName, onProjectNameChange, mode, onModeChange, saved }) {
  return (
    <header className="header">
      <div className="header__logo">
        PRIXEL <span>PLANNER</span>
      </div>

      <input
        className="header__project-name"
        value={projectName}
        onChange={e => onProjectNameChange(e.target.value)}
        placeholder="Project name"
        spellCheck={false}
      />

      <div className="header__mode-toggle">
        <button
          className={`mode-btn${mode === 'print' ? ' active' : ''}`}
          onClick={() => onModeChange('print')}
          title="Print Preview — design in print space"
        >
          Print Preview
        </button>
        <button
          className={`mode-btn${mode === 'setup' ? ' active' : ''}`}
          onClick={() => onModeChange('setup')}
          title="Setup View — mirrored plate arrangement"
        >
          Setup View
        </button>
        <button
          className={`mode-btn${mode === 'split' ? ' active' : ''}`}
          onClick={() => onModeChange('split')}
          title="Split — both views side by side"
        >
          Split
        </button>
      </div>

      <div className={`header__save-indicator${saved ? ' saved' : ''}`}>
        {saved ? '● Saved' : '○ Saving…'}
      </div>
    </header>
  );
}
