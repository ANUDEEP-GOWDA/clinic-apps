'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, AnimatePresence, useMotionValueEvent } from 'framer-motion';

/* ─── tiny helper: in-view hook ─────────────────────────────────── */
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
    <div className="overflow-hidden whitespace-nowrap py-4 bg-[#b5c940] text-[#1a2a00] font-black text-sm tracking-widest uppercase">
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
function PillBtn({ children, dark = false, href = '#' }: { children: React.ReactNode; dark?: boolean; href?: string }) {
  return (
    <a
      href={href}
      className={`inline-flex items-center gap-2 px-7 py-3 rounded-full font-bold text-sm transition-all duration-200 hover:scale-105 active:scale-95 ${
        dark
          ? 'bg-[#1a2a00] text-white hover:bg-[#263d00]'
          : 'bg-[#b5c940] text-[#1a2a00] hover:bg-[#c9de4a]'
      }`}
    >
      {children}
    </a>
  );
}

/* ─── fade-up wrapper ─────────────────────────────────────────────── */
function FadeUp({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, visible } = useInView();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(40px)',
        transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

/* ─── accordion (FAQ) ─────────────────────────────────────────────── */
function Accordion({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[#d6dfc0] py-5 cursor-pointer" onClick={() => setOpen(!open)}>
      <div className="flex justify-between items-center">
        <span className="font-bold text-[#1a2a00] text-lg">{q}</span>
        <span className={`text-2xl transition-transform duration-300 ${open ? 'rotate-45' : ''}`}>+</span>
      </div>
      <AnimatePresence>
        {open && (
          <motion.p
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="overflow-hidden text-[#4a5e1a] mt-3 leading-relaxed"
          >
            {a}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   AUTO-IMAGE: picks a relevant stock photo based on treatment name
══════════════════════════════════════════════════════════════════════ */
const MEDICAL_IMAGES: Array<{ keywords: string[]; url: string }> = [
  { keywords: ['mri', 'magnetic'],          url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?q=80&w=600&auto=format&fit=crop' },
  { keywords: ['ct', 'scan', 'x-ray', 'xray'], url: 'https://images.unsplash.com/photo-1530497610245-b489b3d8d14e?q=80&w=600&auto=format&fit=crop' },
  { keywords: ['dental', 'teeth', 'whitening', 'orthodont'], url: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?q=80&w=600&auto=format&fit=crop' },
  { keywords: ['physio', 'therapy', 'rehab', 'exercise'], url: 'https://images.unsplash.com/photo-1598256989800-fea5ce5146f2?q=80&w=600&auto=format&fit=crop' },
  { keywords: ['ivf', 'fertility', 'pregnan', 'reproductive'], url: 'https://images.unsplash.com/photo-1584515933487-779824d29309?q=80&w=600&auto=format&fit=crop' },
  { keywords: ['eye', 'vision', 'ophthal', 'lasik'], url: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?q=80&w=600&auto=format&fit=crop' },
  { keywords: ['cardio', 'heart', 'ecg', 'echo'], url: 'https://images.unsplash.com/photo-1628348070889-cb656235b4eb?q=80&w=600&auto=format&fit=crop' },
  { keywords: ['ortho', 'bone', 'joint', 'knee', 'spine'], url: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?q=80&w=600&auto=format&fit=crop' },
  { keywords: ['skin', 'derma', 'cosmet', 'facial'], url: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=600&auto=format&fit=crop' },
  { keywords: ['child', 'pediatr', 'paediatr', 'baby', 'infant'], url: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?q=80&w=600&auto=format&fit=crop' },
  { keywords: ['nutrition', 'diet', 'weight'], url: 'https://images.unsplash.com/photo-1490645935967-10de6dacaf1b?q=80&w=600&auto=format&fit=crop' },
  { keywords: ['lab', 'blood', 'test', 'pathol'], url: 'https://images.unsplash.com/photo-1579165466991-467135ad3110?q=80&w=600&auto=format&fit=crop' },
  { keywords: ['surgery', 'operat'], url: 'https://images.unsplash.com/photo-1551190822-a9ce113ac30b?q=80&w=600&auto=format&fit=crop' },
  { keywords: ['checkup', 'general', 'full body', 'health'], url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=600&auto=format&fit=crop' },
];
const FALLBACK_IMG = 'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?q=80&w=600&auto=format&fit=crop';

function autoImage(name: string): string {
  const lower = name.toLowerCase();
  for (const entry of MEDICAL_IMAGES) {
    if (entry.keywords.some((kw) => lower.includes(kw))) return entry.url;
  }
  return FALLBACK_IMG;
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN TEMPLATE
══════════════════════════════════════════════════════════════════════ */
export default function TemplateVoldog({ snap }: { snap: any }) {
  const s = snap?.settings ?? {};
  const sc = snap?.siteContent ?? {};
  const clinicSlug  = snap?.clinic?.slug || 'test-clinic';
  const clinicName  = s.clinicName || 'MediCore Clinic';
  const tagline     = s.tagline   || 'Expert Care, exactly as it should be.';
  const phone       = s.phone     || '+91 98765 43210';
  const about       = s.about     || 'We deliver world-class healthcare with cutting-edge technology and genuine compassion. Trusted by thousands of patients across the region.';
  const bookUrl     = `/c/${clinicSlug}/book`;

  /* Services — from CMS → Services page */
  const dbServices = (snap?.services ?? []).map((svc: any) => ({
    title: svc.name,
    desc: svc.description,
  }));
  const services = dbServices.length > 0 ? dbServices : [
    { title: 'General Medicine', desc: 'Comprehensive checkups & preventive care for the whole family.' },
    { title: 'Dental Care',      desc: 'Advanced dental treatments in a pain-free environment.' },
    { title: 'Physiotherapy',    desc: 'Personalised rehab plans to get you moving freely again.' },
    { title: 'Nutrition & Diet', desc: 'Science-backed dietary plans tailored to your health goals.' },
    { title: 'Paediatrics',      desc: 'Gentle, expert care designed specifically for children.' },
  ];

  /* Packages — from CMS → Website → Packages */
  const dbPackages = Array.isArray(sc.packages) ? sc.packages : [];
  const packages = dbPackages.length > 0 ? dbPackages : [
    { name: 'Full Body Checkup', label: 'Most Popular', price: '₹1,499', img: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=600&auto=format&fit=crop' },
    { name: 'Dental Whitening Package', label: 'New', price: '₹2,999', img: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?q=80&w=600&auto=format&fit=crop' },
    { name: 'Physiotherapy Program (10 Sessions)', label: 'Best Value', price: '₹4,499', img: 'https://images.unsplash.com/photo-1598256989800-fea5ce5146f2?q=80&w=600&auto=format&fit=crop' },
  ];

  /* Reviews — from CMS → Reviews page */
  const dbReviews = (snap?.reviews ?? []).map((r: any) => ({
    name: r.author,
    stars: r.rating,
    text: r.text,
  }));
  const reviews = dbReviews.length > 0 ? dbReviews : [
    { name: 'Priya S.', stars: 5, text: 'Absolutely outstanding experience. The doctors were incredibly thorough and kind.' },
    { name: 'Rahul M.', stars: 5, text: 'World-class facilities and zero wait time. Best clinic I have ever visited.' },
    { name: 'Ananya K.', stars: 5, text: 'The dental team transformed my smile completely. Highly recommend!' },
    { name: 'Vikram T.', stars: 5, text: 'Transparent pricing and genuinely caring staff. A breath of fresh air.' },
  ];

  /* FAQs — from CMS → Website → FAQ */
  const dbFaqs = Array.isArray(sc.faq) ? sc.faq.map((f: any) => ({ q: f.question, a: f.answer })) : [];
  const faqs = dbFaqs.length > 0 ? dbFaqs : [
    { q: 'How do I book an appointment?', a: 'You can call us directly, use our online booking form, or walk in during clinic hours. We typically confirm your slot within a few minutes.' },
    { q: 'Do you accept insurance?', a: 'Yes, we work with all major insurance providers. Our front desk team will help verify your coverage before your first visit.' },
    { q: 'What should I bring for my first visit?', a: 'Please bring a valid ID, your insurance card (if applicable), and any previous medical records or reports relevant to your condition.' },
    { q: 'Are your facilities equipped for emergencies?', a: 'We have a dedicated emergency bay and trained staff available during all clinic hours for urgent cases.' },
  ];

  /* Why Choose Us — from CMS → Website → Highlights */
  const dbHighlights = Array.isArray(sc.why_choose_us) ? sc.why_choose_us : [];

  /* Gallery — from CMS → Website → Clinic Photos */
  const galleryImages: string[] = Array.isArray(sc.gallery_images) ? sc.gallery_images : [];

  /* ─────────────────────────────────────────────────────────────────
     SCROLL SETUP
     Document-level scroll tracking for the hero-to-navbar morph.
  ──────────────────────────────────────────────────────────────── */
  const { scrollY } = useScroll();

  const heroRef = useRef<HTMLDivElement>(null);
  const [heroHeight, setHeroHeight] = useState(700);
  useEffect(() => {
    const measure = () => { if (heroRef.current) setHeroHeight(heroRef.current.offsetHeight); };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const MORPH_END = heroHeight * 0.55;

  /* hero brand text → shrinks + rises into navbar center */
  const heroTextScale   = useTransform(scrollY, [0, MORPH_END], [1, 0.12]);
  const heroTextY       = useTransform(scrollY, [0, MORPH_END], [0, -heroHeight * 0.48]);
  const heroTextOpacity = useTransform(scrollY, [MORPH_END * 0.7, MORPH_END], [1, 0]);

  /* navbar logo fades in as hero text arrives */
  const navLogoOpacity  = useTransform(scrollY, [MORPH_END * 0.5, MORPH_END], [0, 1]);

  /* navbar bg: transparent → frosted on scroll */
  const navBg           = useTransform(scrollY, [0, MORPH_END * 0.6], ['rgba(45,71,0,0)', 'rgba(26,42,0,0.85)']);
  const navBlur         = useTransform(scrollY, [0, MORPH_END * 0.6], ['blur(0px)', 'blur(16px)']);

  /* emblem parallax */
  const imgY = useTransform(scrollY, [0, heroHeight], ['0%', '-15%']);



  return (
    <div
      className="antialiased overflow-x-hidden"
      style={{
        fontFamily: "'DM Sans', sans-serif",
        fontWeight: 500,
        fontSize: '14px',
        lineHeight: 1.7,
        color: '#666',
        backgroundColor: '#fff',
        WebkitFontSmoothing: 'antialiased',
        textRendering: 'optimizeLegibility',
        boxSizing: 'border-box',
      }}
    >
      {/* ── FONTS — DM Sans (closest free match to Peridot PE Variable) ── */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap"
      />
      <style suppressHydrationWarning>{`
        *, *::before, *::after { box-sizing: border-box; }
        a { text-decoration: none; color: inherit; }
      `}</style>

      {/* ══════════════════════════════════════════════════════════
          NAVBAR  (fixed, sits visually INSIDE the hero card)
          - Fully transparent on load, frosted on scroll
          - Links: left and right. Logo: dead center (morphs in)
      ══════════════════════════════════════════════════════════ */}
      <motion.header
        className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-10 py-7"
        style={{
          backgroundColor: navBg,
          backdropFilter: navBlur,
          WebkitBackdropFilter: navBlur,
          transition: 'transform 0.5s',
        }}
      >
        {/* LEFT NAV */}
        <nav className="hidden md:flex items-center gap-8" style={{ fontSize: '14px', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
          <a href="#services" className="hover:text-white transition-colors duration-200">Services</a>
          <a href="#packages" className="hover:text-white transition-colors duration-200">Packages</a>
        </nav>

        {/* CENTER — morphed logo (hidden initially, fades in on scroll) */}
        <motion.div
          className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap"
          style={{
            opacity: navLogoOpacity,
            fontSize: '1.5rem',
            fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#ffffff',
          }}
        >
          {clinicName}
        </motion.div>

        {/* RIGHT NAV */}
        <nav className="hidden md:flex items-center gap-8" style={{ fontSize: '14px', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
          <a href="#why-us" className="hover:text-white transition-colors duration-200">Why Us</a>
          <a href="#contact" className="hover:text-white transition-colors duration-200">Contact</a>
        </nav>
      </motion.header>

      {/* ══════════════════════════════════════════════════════════
          HERO CARD
          - Floating card: 16px margin on all sides, 24px radius
          - Nearly full viewport height (100vh - 32px)
          - White page background visible around the card edges
      ══════════════════════════════════════════════════════════ */}
      <section
        ref={heroRef}
        className="relative overflow-hidden flex flex-col"
        style={{
          margin: '16px',
          borderRadius: '24px',
          height: 'calc(100vh - 32px)',
          backgroundColor: '#2d4700',
          transition: 'transform 0.5s',
        }}
      >
        {/* dot grid texture */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, #b5c940 1.2px, transparent 1.2px)',
            backgroundSize: '30px 30px',
          }}
        />

        {/* ── THE HERO BRAND TEXT ──────────────────────────────
            Giant wordmark behind everything.
            DM Sans at weight 900, white, nearly full-width.
            On scroll → shrinks + rises into navbar center.
        ─────────────────────────────────────────────────── */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
          style={{ zIndex: 1 }}
        >
          <motion.span
            className="text-center leading-none px-4"
            style={{
              fontSize: 'clamp(5rem, 16vw, 14rem)',
              fontWeight: 900,
              letterSpacing: '-0.02em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.15)',
              scale: heroTextScale,
              y: heroTextY,
              opacity: heroTextOpacity,
              display: 'block',
              transformOrigin: 'center top',
            }}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          >
            {clinicName}
          </motion.span>
        </motion.div>

        {/* ── FOREGROUND CONTENT ─────────────────────────────── */}
        <div className="relative flex flex-col items-center justify-center flex-1" style={{ zIndex: 2 }}>
        </div>

        {/* ── BOTTOM BAR: CTA centered ─────────────────────── */}
        <motion.div
          className="relative z-10 flex items-center justify-center px-8 pb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <a
            href={bookUrl}
            className="group inline-flex items-center gap-3 rounded-full pl-7 pr-2 py-2 transition-all duration-300 hover:scale-105 active:scale-95"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }}
          >
            <span style={{ color: '#fff', fontSize: '13px', fontWeight: 600, letterSpacing: '0.04em' }}>
              Book Appointment
            </span>
            <span className="w-10 h-10 rounded-full bg-[#b5c940] flex items-center justify-center text-[#1a2a00] font-bold text-lg group-hover:bg-white transition-colors duration-200">
              →
            </span>
          </a>
        </motion.div>
      </section>



      {/* ── PACKAGES (dark section) ───────────────────────────────────── */}
      <section id="packages" className="bg-[#1a2a00] py-24 rounded-[3rem] mx-4 md:mx-10 my-10 overflow-hidden relative">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle, #b5c940 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <FadeUp>
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
              <div>
                <p className="text-[#b5c940] text-xs font-black tracking-widest uppercase mb-3">Our Packages</p>
                <h2 className="text-4xl md:text-5xl font-black text-white leading-tight">Premium care,<br />transparent pricing.</h2>
              </div>
              <PillBtn href="#contact">View All Packages →</PillBtn>
            </div>
          </FadeUp>
          <div className="grid md:grid-cols-3 gap-6">
            {packages.map((pkg: any, i: number) => {
              const imgSrc = pkg.img ? pkg.img : autoImage(pkg.name);
              return (
                <FadeUp key={i} delay={i * 0.1}>
                  <div className="group bg-white/5 rounded-[2rem] overflow-hidden border border-white/10 hover:border-[#b5c940]/60 transition-all duration-300 hover:-translate-y-1">
                    <div className="relative h-56 overflow-hidden">
                      <img src={imgSrc} alt={pkg.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      {pkg.label && <span className="absolute top-4 left-4 bg-[#b5c940] text-[#1a2a00] text-xs font-black px-3 py-1 rounded-full">{pkg.label}</span>}
                      <span className="absolute bottom-4 right-4 text-white font-black text-2xl">{pkg.price}</span>
                    </div>
                  <div className="p-6">
                    <h3 className="text-white font-black text-lg mb-5">{pkg.name}</h3>
                    <a href={bookUrl} className="block w-full text-center bg-[#b5c940] hover:bg-[#c9de4a] text-[#1a2a00] font-black py-3 rounded-xl transition-all duration-200 hover:scale-[1.02]">
                      Book This
                    </a>
                  </div>
                </div>
              </FadeUp>
            );
          })}
          </div>
        </div>
      </section>

      {/* ── WHY US ─────────────────────────────────────────────────────── */}
      <section id="why-us" className="py-24 max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <FadeUp>
            <p className="text-xs font-black tracking-widest uppercase text-[#7a9e20] mb-4">Why Choose Us?</p>
            <h2 className="text-4xl md:text-5xl font-black leading-tight mb-8">The benefits speak<br />for themselves!</h2>
            <div className="space-y-6">
              {(dbHighlights.length > 0 ? dbHighlights.map((h: any) => ({ title: h.title, desc: h.description })) : [
                { title: 'Zero Wait Times',        desc: 'We run on schedule. Your time is never wasted.' },
                { title: 'Latest Technology',      desc: 'State-of-the-art diagnostic and treatment equipment.' },
                { title: 'Transparent Pricing',    desc: 'No hidden fees or unexpected bills, ever.' },
                { title: '5-Star Patient Care',    desc: 'Rated the highest in patient satisfaction in the region.' },
              ]).map((item: any, i: number) => (
                <div key={i} className="flex gap-5 p-5 rounded-2xl bg-white border border-[#dde5b6] hover:border-[#b5c940] hover:shadow-md transition-all duration-300">
                  <div className="w-10 h-10 rounded-full bg-[#2d4700] flex items-center justify-center flex-shrink-0" style={{ fontSize: '12px', fontWeight: 700, color: '#b5c940' }}>{String.fromCharCode(65 + i)}</div>
                  <div>
                    <h4 className="font-black text-lg mb-1">{item.title}</h4>
                    <p className="text-[#4a6020] font-medium">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </FadeUp>
          <FadeUp delay={0.2}>
            <div className="relative h-[550px] rounded-[3rem] overflow-hidden shadow-2xl">
              <img src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?q=80&w=900&auto=format&fit=crop" alt="Clinic" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1a2a00]/50 to-transparent" />
              <div className="absolute bottom-8 left-8 right-8 bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20">
                <p className="text-white font-black text-2xl">10,000+</p>
                <p className="text-[#b5c940] font-bold text-sm">Happy Patients & Counting</p>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── REVIEWS ────────────────────────────────────────────────────── */}
      <section id="reviews" className="bg-[#2d4700] py-24 rounded-[3rem] mx-4 md:mx-10 my-10">
        <div className="max-w-7xl mx-auto px-6">
          <FadeUp>
            <p className="text-[#b5c940] text-xs font-black tracking-widest uppercase mb-4 text-center">Patient Reviews</p>
            <h2 className="text-4xl md:text-5xl font-black text-white text-center mb-16">What our patients say</h2>
          </FadeUp>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {reviews.map((r, i) => (
              <FadeUp key={i} delay={i * 0.08}>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-[#b5c940]/50 transition-all duration-300">
                  <div className="text-[#b5c940] text-lg mb-3" style={{ letterSpacing: '0.1em' }}>{'★'.repeat(r.stars)}</div>
                  <p className="text-white/80 font-medium italic mb-5">"{r.text}"</p>
                  <p className="text-[#b5c940] font-black text-sm">— {r.name}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── GALLERY ──────────────────────────────────────────────── */}
      {galleryImages.length > 0 && (
        <section id="gallery" className="py-24 max-w-7xl mx-auto px-6">
          <FadeUp>
            <p className="text-xs font-black tracking-widest uppercase text-[#7a9e20] mb-4 text-center">Our Clinic</p>
            <h2 className="text-4xl md:text-5xl font-black text-center mb-16">Take a look inside</h2>
          </FadeUp>
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
            {galleryImages.map((url: string, i: number) => (
              <FadeUp key={i} delay={i * 0.05}>
                <div className="rounded-2xl overflow-hidden break-inside-avoid">
                  <img
                    src={url}
                    alt={`Clinic photo ${i + 1}`}
                    className="w-full h-auto object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
              </FadeUp>
            ))}
          </div>
        </section>
      )}

      {/* ── FAQ ────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-24 max-w-5xl mx-auto px-6">
        <FadeUp>
          <p className="text-xs font-black tracking-widest uppercase text-[#7a9e20] mb-4">FAQ</p>
          <h2 className="text-4xl md:text-5xl font-black leading-tight mb-12">Get to know us better.<br/>We have answers.</h2>
        </FadeUp>
        <FadeUp delay={0.1}>
          {faqs.map((f, i) => <Accordion key={i} q={f.q} a={f.a} />)}
        </FadeUp>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────────── */}
      <footer className="bg-[#1a2a00] text-white pt-16 pb-10 mt-10 rounded-t-[3rem]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-10 mb-12">
            <div>
              <h3 className="text-2xl font-black mb-4">{clinicName}</h3>
              <p className="text-white/60 font-medium leading-relaxed">{about.slice(0, 100)}…</p>
            </div>
            <div>
              <h4 className="font-black uppercase tracking-widest text-xs text-[#b5c940] mb-4">Our Services</h4>
              <ul className="space-y-2">
                {services.map((s: any, i: number) => (
                  <li key={i}><a href="#services" className="text-white/60 hover:text-[#b5c940] font-medium transition">{s.title}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-black uppercase tracking-widest text-xs text-[#b5c940] mb-4">Contact</h4>
              <a href={`tel:${phone}`} className="text-white/60 hover:text-[#b5c940] font-medium transition block mb-2">{phone}</a>
              <PillBtn href={bookUrl}>Book Appointment →</PillBtn>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-white/40 text-sm">
            <span>© {new Date().getFullYear()} {clinicName}. All rights reserved.</span>
            <span>Built with our Clinic Website Builder</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
