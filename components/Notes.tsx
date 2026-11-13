'use client';

import { useEffect, useRef, useState } from 'react';

export default function Notes({ slug, firstName }: { slug: string; firstName: string }) {
  const key = `notes:${slug}`;
  const [text, setText] = useState('');
  const [failed, setFailed] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    try {
      setText(window.localStorage.getItem(key) ?? '');
    } catch {
      setFailed(true);
    }
    loaded.current = true;
  }, [key]);

  function change(value: string) {
    setText(value);
    try {
      window.localStorage.setItem(key, value);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }

  function download() {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(firstName || 'my').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-chart-notes.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="card wide no-print">
      <h3>My notes</h3>
      <textarea
        value={text}
        onChange={(e) => change(e.target.value)}
        rows={8}
        placeholder="Write what stands out to you."
        aria-label="My notes"
      />
      <div className="row">
        <button type="button" className="btn" onClick={download}>Download my notes</button>
        <span className="muted">Your notes stay on this device only. Download them to keep a copy.</span>
      </div>
      {failed && <p className="error">Notes couldn't save on this device.</p>}
    </section>
  );
}
