import { useState } from 'react';

const COLOR_MAP = {
  red: '#ef4444', blue: '#3b82f6', green: '#22c55e', yellow: '#eab308',
  black: '#1a1a1a', white: '#f5f5f5', pink: '#ec4899', purple: '#a855f7',
  orange: '#f97316', brown: '#92400e', gray: '#6b7280', navy: '#1e3a5f',
  beige: '#d4a574', cream: '#fffdd0', maroon: '#800000', teal: '#0d9488',
};

const getDotColor = (name) => COLOR_MAP[name.toLowerCase()] || '#888';

export default function ColorTagsInput({ value = [], onChange }) {
  const [input, setInput] = useState('');

  const add = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    if (value.map(c => c.toLowerCase()).includes(trimmed.toLowerCase())) { setInput(''); return; }
    onChange([...value, trimmed]);
    setInput('');
  };

  const remove = (idx) => onChange(value.filter((_, i) => i !== idx));

  return (
    <div>
      <div className="color-tags" style={{ marginBottom: value.length ? 8 : 0 }}>
        {value.map((c, i) => (
          <span key={i} className="color-tag">
            <span className="color-dot" style={{ background: getDotColor(c) }} />
            {c}
            <button className="color-tag-remove" onClick={() => remove(i)} type="button">✕</button>
          </span>
        ))}
      </div>
      <div className="color-add-row">
        <input
          className="form-input"
          placeholder="e.g. Red, Blue..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          style={{ maxWidth: 180 }}
        />
        <button type="button" className="btn btn-secondary btn-sm" onClick={add}>Add</button>
      </div>
    </div>
  );
}

export { getDotColor };
