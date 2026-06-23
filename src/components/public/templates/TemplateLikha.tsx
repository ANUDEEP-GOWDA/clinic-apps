'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- In-view hook ---
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

// --- Icons ---
function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}
function InstagramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

// --- Service card (hook at component level, not inside .map) ---
function ServiceCard({ svc, idx }: { svc: any; idx: number }) {
  const { ref, visible } = useInView();
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={visible ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: idx * 0.1 }}
      className="group block">
      <div className="aspect-[4/5] rounded-t-full rounded-b-full overflow-hidden relative mb-6 border"
        style={{ borderColor: 'var(--color-primary)' }}>
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center transition-colors"
          style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 5%, transparent)' }}>
          <span className="text-4xl mb-6">{svc.icon || '✦'}</span>
          <h4 className="text-2xl font-serif mb-4" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{svc.name}</h4>
          <p className="text-sm opacity-60 line-clamp-4">{svc.description}</p>
        </div>
      </div>
      <div className="text-center">
        <span className="text-xs uppercase tracking-widest transition-colors" style={{ color: 'var(--color-primary)' }}>
          Learn More
        </span>
      </div>
    </motion.div>
  );
}

// --- Doctor card ---
function DoctorCard({ doctor, idx }: { doctor: any; idx: number }) {
  const { ref, visible } = useInView();
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={visible ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: idx * 0.1 }}
      className="text-center group">
      <div className="w-48 h-48 mx-auto rounded-full overflow-hidden mb-5 border"
        style={{ borderColor: 'color-mix(in srgb, var(--color-primary) 30%, transparent)' }}>
        {doctor.photoUrl
          ? <img src={doctor.photoUrl} alt={doctor.name} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-4xl"
              style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 10%, transparent)', color: 'var(--color-primary)' }}>✦</div>
        }
      </div>
      <h4 className="text-xl font-serif mb-1" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{doctor.name}</h4>
      <p className="text-xs uppercase tracking-widest mb-2 text-gray-500">{doctor.specialties || doctor.qualifications}</p>
      {doctor.bio && <p className="text-sm opacity-60 max-w-xs mx-auto line-clamp-3">{doctor.bio}</p>}
    </motion.div>
  );
}

// --- Fullscreen menu ---
function FullscreenMenu({ isOpen, close, clinicName, clinicSlug, tagline, phone, email, facebookUrl, instagramUrl }: {
  isOpen: boolean; close: () => void;
  clinicName: string; clinicSlug: string; tagline: string;
  phone: string; email: string; facebookUrl: string; instagramUrl: string;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, visibility: 'hidden' as any }}
          animate={{ opacity: 1, visibility: 'visible' as any }}
          exit={{ opacity: 0, transition: { delay: 0 } }}
          transition={{ duration: 0.4, ease: [0.76, 0, 0.24, 1], delay: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{ background: 'linear-gradient(rgb(250, 242, 240), rgb(253, 252, 252))', color: 'rgb(35, 31, 32)' }}>
          <button onClick={close} className="absolute top-10 right-10 p-2 hover:scale-110 transition-transform">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>

          <div className="w-full max-w-[1200px] px-8 grid md:grid-cols-2 gap-16 items-center">
            {/* Left: brand circle */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, ease: [0.15, 0.9, 0.34, 0.95], delay: 0.6 }}
              className="flex justify-center md:justify-start">
              <div className="relative w-[300px] h-[300px] md:w-[500px] md:h-[500px] rounded-full border flex flex-col items-center justify-center p-12 text-center"
                style={{ borderColor: 'var(--color-primary)' }}>
                {tagline && <span className="text-[10px] tracking-[0.3em] uppercase mb-4" style={{ color: 'var(--color-primary)' }}>{tagline}</span>}
                <h2 className="text-5xl md:text-7xl font-light tracking-widest font-serif" style={{ color: 'var(--color-primary)', fontFamily: "'Cormorant Garamond', serif" }}>
                  {clinicName}
                </h2>
                <div className="absolute top-0 bottom-0 w-[1px]" style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 30%, transparent)' }} />
              </div>
            </motion.div>

            {/* Right: links */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="grid grid-cols-2 gap-8">
              <div>
                <h4 className="text-[10px] font-bold tracking-[0.2em] text-gray-400 mb-8 uppercase">Navigate</h4>
                <ul className="space-y-6 text-[14px] tracking-wide">
                  <li><a href="#treatments" onClick={close} className="hover:opacity-70 transition-opacity">Treatments</a></li>
                  <li><a href="#doctors" onClick={close} className="hover:opacity-70 transition-opacity">Our Doctors</a></li>
                  <li><a href="#reviews" onClick={close} className="hover:opacity-70 transition-opacity">Reviews</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-[10px] font-bold tracking-[0.2em] text-gray-400 mb-8 uppercase">Get in Touch</h4>
                <ul className="space-y-6 text-[14px] tracking-wide">
                  <li><a href={`/c/${clinicSlug}/book`} style={{ color: 'var(--color-primary)' }}>Book Appointment</a></li>
                  {phone && <li><a href={`tel:${phone}`} className="hover:opacity-70 transition-opacity">{phone}</a></li>}
                  {email && <li><a href={`mailto:${email}`} className="hover:opacity-70 transition-opacity">{email}</a></li>}
                </ul>
              </div>
            </motion.div>
          </div>

          {/* Footer of menu */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
            className="absolute bottom-10 left-10 right-10">
            <div className="max-w-[1200px] mx-auto flex items-end justify-between">
              {(facebookUrl || instagramUrl) && (
                <div>
                  <h4 className="text-[10px] font-bold tracking-[0.2em] text-gray-400 mb-6 uppercase">Follow Us</h4>
                  <div className="flex gap-4">
                    {facebookUrl && (
                      <a href={facebookUrl} target="_blank" rel="noopener noreferrer"
                        className="w-12 h-12 rounded-full border flex items-center justify-center hover:text-white transition-colors"
                        style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-primary)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = ''; }}>
                        <FacebookIcon />
                      </a>
                    )}
                    {instagramUrl && (
                      <a href={instagramUrl} target="_blank" rel="noopener noreferrer"
                        className="w-12 h-12 rounded-full border flex items-center justify-center hover:text-white transition-colors"
                        style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-primary)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = ''; }}>
                        <InstagramIcon />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Main Template ────────────────────────────────────────────────── */
export default function TemplateLikha({ snap }: { snap: any }) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&family=Montserrat:wght@300;400;500&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  const settings = snap?.settings ?? {};
  const sc = snap?.siteContent ?? {};
  const clinicName = settings.clinicName || snap?.clinic?.name || '';
  const clinicSlug = snap?.clinic?.slug ?? '';
  const tagline = settings.tagline || '';
  const heroImageUrl = settings.heroImageUrl || '';
  const heroHeadline = settings.heroHeadline || '';
  const heroSubheadline = settings.heroSubheadline || '';
  const phone = settings.phone || '';
  const email = settings.email || '';
  const address = settings.address || '';
  const about = settings.about || '';

  // Social links — from siteContent, not hardcoded
  const facebookUrl: string = typeof sc.facebook_url === 'string' ? sc.facebook_url : '';
  const instagramUrl: string = typeof sc.instagram_url === 'string' ? sc.instagram_url : '';

  // Services — only from CMS, no hardcoded aesthetic fallbacks
  const services: any[] = Array.isArray(snap?.services) && snap.services.length > 0 ? snap.services : [];

  // Doctors — only from CMS
  const doctors: any[] = snap?.doctors ?? [];

  // Reviews — only from CMS
  const reviews: any[] = snap?.reviews ?? [];

  return (
    <div className="min-h-screen relative font-sans overflow-x-hidden"
      style={{ background: 'linear-gradient(rgb(250, 242, 240), rgb(253, 252, 252))', color: 'rgb(35, 31, 32)', fontFamily: "'Montserrat', sans-serif" }}>

      <FullscreenMenu
        isOpen={menuOpen}
        close={() => setMenuOpen(false)}
        clinicName={clinicName}
        clinicSlug={clinicSlug}
        tagline={tagline}
        phone={phone}
        email={email}
        facebookUrl={facebookUrl}
        instagramUrl={instagramUrl}
      />

      {/* --- Sticky Header --- */}
      <header className="fixed top-0 left-0 right-0 z-40 p-6 md:p-10 flex justify-between items-center mix-blend-difference text-white">
        <button onClick={() => setMenuOpen(true)}
          className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors">
          <div className="w-5 h-5 flex flex-col justify-center gap-1.5">
            <span className="block w-full h-[1px] bg-white" />
            <span className="block w-full h-[1px] bg-white" />
            <span className="block w-full h-[1px] bg-white" />
          </div>
        </button>

        <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
          <h1 className="text-2xl tracking-[0.3em] font-serif uppercase">{clinicName}</h1>
          {tagline && <span className="text-[8px] tracking-[0.2em] opacity-60 uppercase mt-1">{tagline}</span>}
        </div>

        <a href={`/c/${clinicSlug}/book`}
          className="text-xs uppercase tracking-[0.1em] border border-white/20 px-6 py-3 rounded-full hover:bg-white hover:text-black transition-colors">
          Book Now
        </a>
      </header>

      {/* --- Hero Section --- */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 px-4">
        <div className="max-w-[1400px] w-full grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1], delay: 0.2 }}
            className="relative z-10 md:pl-20">
            {heroHeadline ? (
              <h2 className="text-5xl md:text-8xl font-serif leading-[1.1] mb-8"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}>{heroHeadline}</h2>
            ) : (
              <h2 className="text-5xl md:text-8xl font-serif leading-[1.1] mb-8"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}>{clinicName}</h2>
            )}
            {heroSubheadline && (
              <p className="text-lg md:text-xl opacity-80 max-w-md font-light leading-relaxed mb-12">{heroSubheadline}</p>
            )}
            {tagline && !heroSubheadline && (
              <p className="text-lg md:text-xl opacity-80 max-w-md font-light leading-relaxed mb-12">{tagline}</p>
            )}
            {services.length > 0 && (
              <a href="#treatments" className="group flex items-center gap-4 text-sm uppercase tracking-widest font-medium">
                <span className="w-12 h-12 rounded-full border flex items-center justify-center group-hover:text-white transition-all"
                  style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-primary)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = ''; }}>
                  ↓
                </span>
                <span>Discover Treatments</span>
              </a>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: [0.15, 0.9, 0.34, 0.95], delay: 0.4 }}
            className="relative h-[60vh] md:h-[85vh] w-full max-w-[600px] mx-auto rounded-t-full overflow-hidden border"
            style={{ borderColor: 'color-mix(in srgb, var(--color-primary) 30%, transparent)' }}>
            {heroImageUrl ? (
              <img src={heroImageUrl} alt={clinicName} className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center"
                style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 8%, transparent)' }}>
                <div className="text-6xl mb-4" style={{ color: 'var(--color-primary)' }}>✦</div>
                <p className="text-sm text-gray-400 tracking-widest uppercase">Add a hero image</p>
              </div>
            )}
            <div className="absolute inset-0" style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 10%, transparent)', mixBlendMode: 'overlay' }} />
          </motion.div>
        </div>
      </section>

      {/* --- Treatments / Services --- */}
      {services.length > 0 && (
        <section id="treatments" className="py-32 px-4 md:px-20 border-t" style={{ borderColor: 'color-mix(in srgb, var(--color-primary) 20%, transparent)' }}>
          <div className="max-w-[1400px] mx-auto">
            <h3 className="text-[10px] font-bold tracking-[0.2em] text-gray-400 mb-12 uppercase">Our Treatments</h3>
            <div className="grid md:grid-cols-3 gap-8">
              {services.map((svc: any, idx: number) => (
                <ServiceCard key={svc.id ?? idx} svc={svc} idx={idx} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* --- Doctors --- */}
      {doctors.length > 0 && (
        <section id="doctors" className="py-32 px-4 md:px-20 border-t" style={{ borderColor: 'color-mix(in srgb, var(--color-primary) 20%, transparent)' }}>
          <div className="max-w-[1400px] mx-auto">
            <h3 className="text-[10px] font-bold tracking-[0.2em] text-gray-400 mb-4 uppercase">Our Specialists</h3>
            <h2 className="text-4xl md:text-6xl font-serif mb-16 leading-tight"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}>Meet the team</h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-12">
              {doctors.map((doctor: any, idx: number) => (
                <DoctorCard key={doctor.id} doctor={doctor} idx={idx} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* --- About / Story --- */}
      {about && (
        <section id="about" className="py-32 px-4 md:px-20 border-t" style={{ borderColor: 'color-mix(in srgb, var(--color-primary) 20%, transparent)' }}>
          <div className="max-w-[1400px] mx-auto max-w-3xl">
            <h3 className="text-[10px] font-bold tracking-[0.2em] text-gray-400 mb-4 uppercase">About Us</h3>
            <h2 className="text-4xl md:text-6xl font-serif mb-8 leading-tight"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}>{clinicName}</h2>
            <p className="text-lg font-light leading-relaxed opacity-70">{about}</p>
          </div>
        </section>
      )}

      {/* --- Reviews --- */}
      {reviews.length > 0 && (
        <section id="reviews" className="py-32 px-4 md:px-20 border-t" style={{ borderColor: 'color-mix(in srgb, var(--color-primary) 20%, transparent)' }}>
          <div className="max-w-[1400px] mx-auto">
            <h3 className="text-[10px] font-bold tracking-[0.2em] text-gray-400 mb-4 uppercase">Patient Reviews</h3>
            <h2 className="text-4xl md:text-6xl font-serif mb-16 leading-tight"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}>What our patients say</h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8">
              {reviews.map((r: any, i: number) => (
                <div key={i} className="border p-8 rounded-2xl"
                  style={{ borderColor: 'color-mix(in srgb, var(--color-primary) 20%, transparent)' }}>
                  <div className="text-lg mb-4" style={{ color: 'var(--color-primary)' }}>{'★'.repeat(r.rating ?? r.stars ?? 5)}</div>
                  <p className="font-light leading-relaxed opacity-80 mb-6 italic">"{r.text}"</p>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-primary)' }}>— {r.author ?? r.name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* --- Footer --- */}
      <footer className="py-12 border-t" style={{ borderColor: 'color-mix(in srgb, var(--color-primary) 20%, transparent)' }}>
        <div className="max-w-[1400px] mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-xs tracking-widest opacity-60 uppercase">
            © {new Date().getFullYear()} {clinicName}. All rights reserved.
          </p>
          <div className="flex flex-wrap gap-6 text-xs tracking-widest uppercase items-center">
            {phone && <a href={`tel:${phone}`} className="opacity-60 hover:opacity-100 transition-opacity">{phone}</a>}
            {email && <a href={`mailto:${email}`} className="opacity-60 hover:opacity-100 transition-opacity">{email}</a>}
            {address && <span className="opacity-60">{address}</span>}
            <a href={`/c/${clinicSlug}/book`} className="font-bold" style={{ color: 'var(--color-primary)' }}>Book Now</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
