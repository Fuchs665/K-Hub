import React from 'react';

/**
 * SectionEyebrow — micro-label mono con prefisso `//` (firma visiva del redesign).
 * Es: <SectionEyebrow>47 eventi · 12 regioni</SectionEyebrow>  →  // 47 eventi · 12 regioni
 *
 * Props:
 *  - children: contenuto della label (testo o nodi).
 *  - as:       tag da renderizzare (default 'span'); usa 'div'/'p' quando serve un blocco.
 *  - className: classi extra.
 */
function SectionEyebrow({ children, as: Tag = 'span', className = '' }) {
  return (
    <Tag className={`section-eyebrow ${className}`.trim()}>
      <span className="section-eyebrow-mark" aria-hidden="true">//</span>
      <span className="section-eyebrow-text">{children}</span>
    </Tag>
  );
}

export default SectionEyebrow;
