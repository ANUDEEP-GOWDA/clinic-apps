'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';

/* ─── in-view hook ───────────────────────────────────────────────── */
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

/* ─── marquee ────────────────────────────────────────────────────── */
function Marquee({ text, reverse = false }: { text: string; reverse?: boolean }) {
  const repeated = Array(12).fill(text).join('  ✦  ');
  return (
    <div className="overflow-hidden whitespace-nowrap py-4 font-black text-sm tracking-widest uppercase"
      style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}>
      <motion.div
        className="inline-block"
        animate={{ x: reverse ? ['0%', '50%'] : ['0%', '-50%'] }}
        transition={{ duration: 22, ease: 'linear', repeat: Infinity }}
      >
        {repeated}&nbsp;&nbsp;&nbsp;&nbsp;{repeated}
      </motion.div>
    </div>
  );
}

/* ─── pill button ─────────────────────────────────────────────────── */
function PillBtn({ children, href = '#' }: { children: React.ReactNode; href?: string }) {
  return (
    <a href={href}
      className="inline-flex items-center gap-2 px-7 py-3 rounded-full font-bold text-sm transition-all duration-200 hover:scale-105 active:scale-95 text-white"
      style={{ backgroundColor: 'var(--color-primary)' }}>
      {children}
    </a>
  );
}

/* ─── fade-up wrapper ─────────────────────────────────────────────── */
function FadeUp({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, visible } = useInView();
  return (
    <div ref={ref} className={className} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(40px)',
      transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`,
    }}>
      {children}
    </div>
  );
}

/* ─── accordion (FAQ) ─────────────────────────────────────────────── */
function Accordion({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-200 py-5 cursor-pointer" onClick={() => setOpen(!open)}>
      <div className="flex justify-between items-center">
        <span className="font-bold text-slate-900 text-lg">{q}</span>
        <span className={`text-2xl transition-transform duration-300 ${open ? 'rotate-45' : ''}`}>+</span>
      </div>
      <AnimatePresence>
        {open && (
          <motion.p
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="overflow-hidden text-slate-600 mt-3 leading-relaxed"
          >{a}</motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── auto-image for packages (keyword → relevant stock photo) ──── */
const PKG_IMAGES: Array<{ keywords: string[]; url: string }> = [
  { keywords: ['mri', 'magnetic'], url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?q=80&w=600&auto=format&fit=crop' },
  { keywords: ['ct', 'scan', 'x-ray', 'xray'], url: 'https://images.unsplash.com/photo-1530497610245-b489b3d8d14e?q=80&w=600&auto=format&fit=crop' },
  { keywords: ['dental', 'teeth', 'whitening', 'orthodont'], url: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?q=80&w=600&auto=format&fit=crop' },
  { keywords: ['physio', 'therapy', 'rehab'], url: 'https://images.unsplash.com/photo-1598256989800-fea5ce5146f2?q=80&w=600&auto=format&fit=crop' },
  { keywords: ['eye', 'vision', 'ophthal'], url: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?q=80&w=600&auto=format&fit=crop' },
  { keywords: ['cardio', 'heart', 'ecg'], url: 'https://images.unsplash.com/photo-1628348070889-cb656235b4eb?q=80&w=600&auto=format&fit=crop' },
  { keywords: ['skin', 'derma', 'facial'], url: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=600&auto=format&fit=crop' },
  { keywords: ['checkup', 'general', 'health', 'body'], url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=600&auto=format&fit=crop' },
];
const PKG_FALLBACK = 'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?q=80&w=600&auto=format&fit=crop';

function autoImage(name: string): string {
  const lower = name.toLowerCase();
  for (const entry of PKG_IMAGES) {
    if (entry.keywords.some((kw) => lower.includes(kw))) return entry.url;
  }
  return PKG_FALLBACK;
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN TEMPLATE
══════════════════════════════════════════════════════════════════════ */
export default function TemplateVoldog({ snap }: { snap: any }) {
  const s = snap?.settings ?? {};
  const sc = snap?.siteContent ?? {};
  const clinicSlug = snap?.clinic?.slug ?? '';
  const clinicName = s.clinicName || snap?.clinic?.name || '';
  const tagline    = s.tagline || '';
  const phone      = s.phone || '';
  const address    = s.address || '';
  const email      = s.email || '';
  const heroImageUrl = s.heroImageUrl || '';
  const about      = s.about || '';
  const bookUrl    = `/c/${clinicSlug}/book`;
  const doctors: any[] = snap?.doctors ?? [];

  // Services — only from CMS, no hardcoded fallbacks
  const services = (snap?.services ?? []).map((svc: any) => ({
    icon: svc.icon || '✦',
    title: svc.name,
    desc: svc.description,
  }));

  // Packages — only from siteContent, no hardcoded fallbacks
  const packages: any[] = Array.isArray(sc.packages) ? sc.packages : [];

  // Reviews — only from CMS, no hardcoded fallbacks
  const reviews = (snap?.reviews ?? []).map((r: any) => ({
    name: r.author, stars: r.rating, text: r.text,
  }));

  // FAQs — only from siteContent, no hardcoded fallbacks
  const faqs: Array<{ q: string; a: string }> = Array.isArray(sc.faq)
    ? sc.faq.map((f: any) => ({ q: f.question, a: f.answer }))
    : [];

  // Why Choose Us — only from siteContent, no hardcoded fallbacks
  const highlights: any[] = Array.isArray(sc.why_choose_us) ? sc.why_choose_us : [];

  // Gallery — only from siteContent
  const galleryImages: string[] = Array.isArray(sc.gallery_images) ? sc.gallery_images : [];

  /* Scroll animations */
  const { scrollY } = useScroll();
  const heroRef = useRef<HTMLDivElement>(null);
  const [heroHeight, setHeroHeight] = useState(700);
  useEffect(() => {
    const measure = () => { if (heroRef.current) setHeroHeight(heroRef.current.offsetHeight); };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const MORPH_END       = heroHeight * 0.55;
  const heroTextScale   = useTransform(scrollY, [0, MORPH_END], [1, 0.12]);
  const heroTextY       = useTransform(scrollY, [0, MORPH_END], [0, -heroHeight * 0.48]);
  const heroTextOpacity = useTransform(scrollY, [MORPH_END * 0.7, MORPH_END], [1, 0]);
  const navLogoOpacity  = useTransform(scrollY, [MORPH_END * 0.5, MORPH_END], [0, 1]);
  const navBg           = useTransform(scrollY, [0, MORPH_END * 0.6], ['rgba(0,0,0,0)', 'rgba(15,23,42,0.85)']);
  const navBlur         = useTransform(scrollY, [0, MORPH_END * 0.6], ['blur(0px)', 'blur(16px)']);

  return (
    <div className="antialiased overflow-x-hidden"
      style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: '14px', lineHeight: 1.7, color: '#666', backgroundColor: '#fff' }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap" />
      <style suppressHydrationWarning>{`*, *::before, *::after { box-sizing: border-box; } a { text-decoration: none; color: inherit; }`}</style>

      {/* ── NAVBAR ─────────────────────────────────────────────────── */}
      <motion.header
        className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-10 py-7"
        style={{ backgroundColor: navBg, backdropFilter: navBlur, WebkitBackdropFilter: navBlur }}>
        <nav className="hidden md:flex items-center gap-8" style={{ fontSize: '14px', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
          {services.length > 0 && <a href="#services" className="hover:text-white transition-colors">Services</a>}
          {packages.length > 0 && <a href="#packages" className="hover:text-white transition-colors">Packages</a>}
          {doctors.length > 0 && <a href="#doctors" className="hover:text-white transition-colors">Doctors</a>}
        </nav>
        <motion.div className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap"
          style={{ opacity: navLogoOpacity, fontSize: '1.5rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#ffffff' }}>
          {clinicName}
        </motion.div>
        <nav className="hidden md:flex items-center gap-8" style={{ fontSize: '14px', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
          {highlights.length > 0 && <a href="#why-us" className="hover:text-white transition-colors">Why Us</a>}
          {(phone || email || address) && <a href="#contact" className="hover:text-white transition-colors">Contact</a>}
        </nav>
      </motion.header>

      {/* ── HERO CARD ──────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative overflow-hidden flex flex-col"
        style={{ margin: '16px', borderRadius: '24px', height: 'calc(100vh - 32px)', backgroundColor: '#0f172a' }}>
        {/* hero background image if set */}
        {heroImageUrl && (
          <div className="absolute inset-0">
            <img src={heroImageUrl} alt={clinicName} className="w-full h-full object-cover opacity-30" />
          </div>
        )}
        {/* dot grid texture */}
        <div className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, var(--color-primary) 1.2px, transparent 1.2px)', backgroundSize: '30px 30px' }} />

        {/* Giant clinic name wordmark */}
        <motion.div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none" style={{ zIndex: 1 }}>
          <motion.span className="text-center leading-none px-4"
            style={{ fontSize: 'clamp(4rem, 14vw, 12rem)', fontWeight: 900, letterSpacing: '-0.02em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.12)', scale: heroTextScale, y: heroTextY, opacity: heroTextOpacity, display: 'block', transformOrigin: 'center top' }}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}>
            {clinicName}
          </motion.span>
        </motion.div>

        {/* Tagline centered in hero */}
        {tagline && (
          <div className="relative flex flex-col items-center justify-center flex-1" style={{ zIndex: 2 }}>
            <p className="text-white/60 text-lg font-medium tracking-wide text-center px-8 max-w-xl">{tagline}</p>
          </div>
        )}

        {/* Book CTA */}
        <motion.div className="relative z-10 flex items-center justify-center px-8 pb-8"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.5 }}>
          <a href={bookUrl}
            className="group inline-flex items-center gap-3 rounded-full pl-7 pr-2 py-2 transition-all duration-300 hover:scale-105 active:scale-95"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }}>
            <span style={{ color: '#fff', fontSize: '13px', fontWeight: 600, letterSpacing: '0.04em' }}>Book Appointment</span>
            <span className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg text-white transition-colors duration-200"
              style={{ backgroundColor: 'var(--color-primary)' }}>→</span>
          </a>
        </motion.div>
      </section>

      {/* ── MARQUEE ──────────────────────────────────────────────────── */}
      {tagline && <Marquee text={tagline} />}

      {/* ── SERVICES ─────────────────────────────────────────────────── */}
      {services.length > 0 && (
        <section id="services" className="py-24 max-w-7xl mx-auto px-6">
          <FadeUp>
            <p className="text-xs font-black tracking-widest uppercase mb-4" style={{ color: 'var(--color-primary)' }}>What We Offer</p>
            <h2 className="text-4xl md:text-5xl font-black leading-tight mb-16 text-slate-900">Our services</h2>
          </FadeUp>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
            {services.map((svc, i) => (
              <FadeUp key={i} delay={i * 0.08}>
                <div className="border border-slate-200 rounded-2xl p-6 hover:shadow-md transition-all duration-300 bg-white"
                  style={{ ['--hover-border' as any]: 'var(--color-primary)' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '')}>
                  <div className="text-3xl mb-3">{svc.icon}</div>
                  <h3 className="font-black text-lg mb-2 text-slate-900">{svc.title}</h3>
                  <p className="text-slate-500 font-medium text-sm leading-relaxed">{svc.desc}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </section>
      )}

      {tagline && <Marquee text={tagline} reverse />}

      {/* ── DOCTORS ───────────────────────────────────────────────────── */}
      {doctors.length > 0 && (
        <section id="doctors" className="py-24 bg-slate-50">
          <div className="max-w-7xl mx-auto px-6">
            <FadeUp>
              <p className="text-xs font-black tracking-widest uppercase mb-4" style={{ color: 'var(--color-primary)' }}>Our Team</p>
              <h2 className="text-4xl md:text-5xl font-black leading-tight mb-16 text-slate-900">Meet our doctors</h2>
            </FadeUp>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {doctors.map((doc: any, i: number) => (
                <FadeUp key={doc.id} delay={i * 0.07}>
                  <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 hover:shadow-md transition-all duration-300"
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = '')}>
                    {doc.photoUrl
                      ? <img src={doc.photoUrl} alt={doc.name} className="w-full h-48 object-cover" />
                      : <div className="w-full h-48 flex items-center justify-center text-5xl text-white"
                          style={{ backgroundColor: 'var(--color-primary)' }}>✦</div>
                    }
                    <div className="p-5">
                      <h3 className="font-black text-lg text-slate-900 mb-1">{doc.name}</h3>
                      <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--color-primary)' }}>{doc.specialties || doc.qualifications}</p>
                      {doc.bio && <p className="text-sm text-slate-500 line-clamp-3">{doc.bio}</p>}
                    </div>
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── PACKAGES ─────────────────────────────────────────────────── */}
      {packages.length > 0 && (
        <section id="packages" className="bg-slate-900 py-24 rounded-[3rem] mx-4 md:mx-10 my-10 overflow-hidden relative">
          <div className="absolute inset-0 opacity-5"
            style={{ backgroundImage: 'radial-gradient(circle, var(--color-primary) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
          <div className="relative z-10 max-w-7xl mx-auto px-6">
            <FadeUp>
              <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
                <div>
                  <p className="text-xs font-black tracking-widest uppercase mb-3" style={{ color: 'var(--color-primary)' }}>Our Packages</p>
                  <h2 className="text-4xl md:text-5xl font-black text-white leading-tight">Premium care,<br />transparent pricing.</h2>
                </div>
                <PillBtn href={bookUrl}>Book Now →</PillBtn>
              </div>
            </FadeUp>
            <div className="grid md:grid-cols-3 gap-6">
              {packages.map((pkg: any, i: number) => {
                const imgSrc = pkg.img || autoImage(pkg.name || '');
                return (
                  <FadeUp key={i} delay={i * 0.1}>
                    <div className="group bg-white/5 rounded-[2rem] overflow-hidden border border-white/10 hover:border-white/30 transition-all duration-300 hover:-translate-y-1">
                      <div className="relative h-56 overflow-hidden">
                        <img src={imgSrc} alt={pkg.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        {pkg.label && <span className="absolute top-4 left-4 text-white text-xs font-black px-3 py-1 rounded-full" style={{ backgroundColor: 'var(--color-primary)' }}>{pkg.label}</span>}
                        {pkg.price && <span className="absolute bottom-4 right-4 text-white font-black text-2xl">{pkg.price}</span>}
                      </div>
                      <div className="p-6">
                        <h3 className="text-white font-black text-lg mb-5">{pkg.name}</h3>
                        <a href={bookUrl} className="block w-full text-center text-white font-black py-3 rounded-xl transition-all duration-200 hover:scale-[1.02] hover:opacity-90"
                          style={{ backgroundColor: 'var(--color-primary)' }}>Book This</a>
                      </div>
                    </div>
                  </FadeUp>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── WHY US ─────────────────────────────────────────────────────── */}
      {highlights.length > 0 && (
        <section id="why-us" className="py-24 max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <FadeUp>
              <p className="text-xs font-black tracking-widest uppercase mb-4" style={{ color: 'var(--color-primary)' }}>Why Choose Us?</p>
              <h2 className="text-4xl md:text-5xl font-black leading-tight mb-8 text-slate-900">The benefits speak<br />for themselves!</h2>
              <div className="space-y-6">
                {highlights.map((h: any, i: number) => (
                  <div key={i} className="flex gap-5 p-5 rounded-2xl bg-white border border-slate-200 hover:shadow-md transition-all duration-300"
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = '')}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white"
                      style={{ backgroundColor: 'var(--color-primary)', fontSize: '12px', fontWeight: 700 }}>
                      {String.fromCharCode(65 + i)}
                    </div>
                    <div>
                      <h4 className="font-black text-lg mb-1 text-slate-900">{h.title}</h4>
                      <p className="text-slate-500 font-medium">{h.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </FadeUp>
            {heroImageUrl && (
              <FadeUp delay={0.2}>
                <div className="relative h-[500px] rounded-[3rem] overflow-hidden shadow-2xl">
                  <img src={heroImageUrl} alt={clinicName} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent" />
                  {(doctors.length > 0 || services.length > 0) && (
                    <div className="absolute bottom-8 left-8 right-8 bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20">
                      {doctors.length > 0 && <p className="text-white font-black text-2xl">{doctors.length}+ Doctors</p>}
                      {services.length > 0 && <p className="text-white/70 font-bold text-sm">{services.length} specialties available</p>}
                    </div>
                  )}
                </div>
              </FadeUp>
            )}
          </div>
        </section>
      )}

      {/* ── REVIEWS ────────────────────────────────────────────────────── */}
      {reviews.length > 0 && (
        <section id="reviews" className="py-24 rounded-[3rem] mx-4 md:mx-10 my-10" style={{ backgroundColor: '#0f172a' }}>
          <div className="max-w-7xl mx-auto px-6">
            <FadeUp>
              <p className="text-xs font-black tracking-widest uppercase mb-4 text-center" style={{ color: 'var(--color-primary)' }}>Patient Reviews</p>
              <h2 className="text-4xl md:text-5xl font-black text-white text-center mb-16">What our patients say</h2>
            </FadeUp>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {reviews.map((r, i) => (
                <FadeUp key={i} delay={i * 0.08}>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 transition-all duration-300"
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}>
                    <div className="text-lg mb-3" style={{ color: 'var(--color-primary)', letterSpacing: '0.1em' }}>{'★'.repeat(r.stars)}</div>
                    <p className="text-white/80 font-medium italic mb-5">"{r.text}"</p>
                    <p className="font-black text-sm" style={{ color: 'var(--color-primary)' }}>— {r.name}</p>
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── GALLERY ─────────────────────────────────────────────────── */}
      {galleryImages.length > 0 && (
        <section id="gallery" className="py-24 max-w-7xl mx-auto px-6">
          <FadeUp>
            <p className="text-xs font-black tracking-widest uppercase mb-4 text-center" style={{ color: 'var(--color-primary)' }}>Our Clinic</p>
            <h2 className="text-4xl md:text-5xl font-black text-center mb-16 text-slate-900">Take a look inside</h2>
          </FadeUp>
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
            {galleryImages.map((url: string, i: number) => (
              <FadeUp key={i} delay={i * 0.05}>
                <div className="rounded-2xl overflow-hidden break-inside-avoid">
                  <img src={url} alt={`Clinic photo ${i + 1}`} className="w-full h-auto object-cover hover:scale-105 transition-transform duration-500" />
                </div>
              </FadeUp>
            ))}
          </div>
        </section>
      )}

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      {faqs.length > 0 && (
        <section id="faq" className="py-24 max-w-5xl mx-auto px-6">
          <FadeUp>
            <p className="text-xs font-black tracking-widest uppercase mb-4" style={{ color: 'var(--color-primary)' }}>FAQ</p>
            <h2 className="text-4xl md:text-5xl font-black leading-tight mb-12 text-slate-900">Frequently asked<br />questions.</h2>
          </FadeUp>
          <FadeUp delay={0.1}>
            {faqs.map((f, i) => <Accordion key={i} q={f.q} a={f.a} />)}
          </FadeUp>
        </section>
      )}

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer id="contact" className="text-white pt-16 pb-10 mt-10 rounded-t-[3rem]" style={{ backgroundColor: '#0f172a' }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-10 mb-12">
            <div>
              <h3 className="text-2xl font-black mb-4">{clinicName}</h3>
              {about && <p className="text-white/60 font-medium leading-relaxed">{about.slice(0, 120)}{about.length > 120 ? '…' : ''}</p>}
            </div>
            {services.length > 0 && (
              <div>
                <h4 className="font-black uppercase tracking-widest text-xs mb-4" style={{ color: 'var(--color-primary)' }}>Our Services</h4>
                <ul className="space-y-2">
                  {services.slice(0, 6).map((s, i) => (
                    <li key={i}>
                      <a href="#services" className="text-white/60 hover:text-white font-medium transition">{s.title}</a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div>
              <h4 className="font-black uppercase tracking-widest text-xs mb-4" style={{ color: 'var(--color-primary)' }}>Contact</h4>
              {phone && <a href={`tel:${phone}`} className="text-white/60 hover:text-white font-medium transition block mb-2">{phone}</a>}
              {email && <a href={`mailto:${email}`} className="text-white/60 hover:text-white font-medium transition block mb-2">{email}</a>}
              {address && <p className="text-white/60 font-medium text-sm mb-4">{address}</p>}
              <PillBtn href={bookUrl}>Book Appointment →</PillBtn>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-white/40 text-sm">
            <span>© {new Date().getFullYear()} {clinicName}. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
