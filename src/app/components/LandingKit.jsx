'use client';
import { useEffect, useRef, useState } from 'react';

// Nombre de chapitres de la landing (pour l'index « 02 / 06 »)
export const CHAPTERS = 6;

export function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

// Apparition douce au scroll (désactivée si l'utilisateur réduit les animations)
export function Reveal({ as: Tag = 'div', delay = 0, className = '', children, ...rest }) {
  const [ref, visible] = useInView(0.12);
  return (
    <Tag
      ref={ref}
      className={`lk-reveal ${visible ? 'is-visible' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

// « 02 / 06 — Fonctionnalités »
export function Eyebrow({ index, label, tone = 'dark' }) {
  return (
    <p className={`font-data text-[13px] uppercase tracking-[0.14em] ${tone === 'dark' ? 'text-craie-2' : 'text-ardoise-500'}`}>
      <span className={tone === 'dark' ? 'text-orange-vif' : 'text-securite'}>
        {String(index).padStart(2, '0')}
      </span>
      <span className="mx-1.5 opacity-60">/</span>
      {String(CHAPTERS).padStart(2, '0')}
      <span className="mx-2 opacity-60">—</span>
      {label}
    </p>
  );
}

export function SectionHeading({ index, label, title, intro, tone = 'dark', className = '' }) {
  return (
    <Reveal className={`max-w-3xl ${className}`}>
      <Eyebrow index={index} label={label} tone={tone} />
      <h2 className={`mt-5 font-ui font-semibold text-[clamp(2.25rem,4.6vw,4rem)] leading-[1.02] tracking-[-0.025em] ${tone === 'dark' ? 'text-craie' : 'text-ardoise-900'}`}>
        {title}
      </h2>
      {intro && (
        <p className={`mt-5 text-lg leading-relaxed max-w-xl ${tone === 'dark' ? 'text-craie-2' : 'text-ardoise-500'}`}>
          {intro}
        </p>
      )}
    </Reveal>
  );
}
