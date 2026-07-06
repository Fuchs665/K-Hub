import React, { useEffect, useState } from 'react';

/**
 * PageBackground — sfondo cinematografico del redesign.
 *  - variant="video": clip di sfondo (SOLO Home, regole §1). Su mobile o con
 *    prefers-reduced-motion mostra SOLO il poster, niente video.
 *  - variant="photo": foto statica ottimizzata con overlay scuro + parallasse
 *    leggera (CSS transform), per le altre pagine.
 *
 * Il contenuto della pagina va passato come children: viene renderizzato SOPRA
 * lo sfondo, dentro un layer con overlay glass per leggibilità.
 *
 * Props:
 *  - variant: 'video' | 'photo'      (default 'photo')
 *  - videoSrc: string | string[]     sorgenti video (webm/mp4) per variant video
 *  - posterSrc: string               fermo-immagine (poster video / fallback)
 *  - photoSrc: string                foto per variant photo (fallback: posterSrc)
 *  - overlay: number                 opacità overlay scuro 0..1 (default 0.6)
 *  - parallax: boolean               parallasse leggera su scroll (default true, ignorata se ridotta)
 *  - className: string               classi extra sul contenitore
 */
function PageBackground({
  variant = 'photo',
  videoSrc,
  posterSrc,
  photoSrc,
  overlay = 0.6,
  parallax = true,
  className = '',
  children,
}) {
  const [minimalMotion, setMinimalMotion] = useState(true); // safe default: niente video/parallasse in SSR/first paint
  const [offset, setOffset] = useState(0);

  // Rileva mobile + prefers-reduced-motion: in entrambi i casi niente video/parallasse.
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mobile = window.matchMedia('(max-width: 768px)');
    const update = () => setMinimalMotion(reduce.matches || mobile.matches);
    update();
    reduce.addEventListener('change', update);
    mobile.addEventListener('change', update);
    return () => {
      reduce.removeEventListener('change', update);
      mobile.removeEventListener('change', update);
    };
  }, []);

  // Parallasse leggera solo su transform (nessun jank), disattivata in minimalMotion.
  useEffect(() => {
    if (!parallax || minimalMotion) {
      setOffset(0);
      return;
    }
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setOffset(window.scrollY * 0.15));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [parallax, minimalMotion]);

  const sources = Array.isArray(videoSrc) ? videoSrc : videoSrc ? [videoSrc] : [];
  const showVideo = variant === 'video' && !minimalMotion && sources.length > 0;
  const photo = photoSrc || posterSrc;

  return (
    <div className={`page-bg ${className}`.trim()}>
      <div className="page-bg-media" style={{ transform: offset ? `translate3d(0, ${offset}px, 0)` : undefined }}>
        {showVideo ? (
          <video
            className="page-bg-video"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster={posterSrc}
          >
            {sources.map((src) => {
              const type = src.endsWith('.webm') ? 'video/webm' : 'video/mp4';
              return <source key={src} src={src} type={type} />;
            })}
          </video>
        ) : (
          photo && (
            <img className="page-bg-photo" src={photo} alt="" aria-hidden="true" loading="lazy" />
          )
        )}
      </div>
      <div className="page-bg-overlay" style={{ '--overlay-opacity': overlay }} aria-hidden="true" />
      <div className="page-bg-content">{children}</div>
    </div>
  );
}

export default PageBackground;
