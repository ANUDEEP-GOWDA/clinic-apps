'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Helper Hook ---
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

function LinkedInIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

// --- Menu Overlay Component ---
function FullscreenMenu({ isOpen, close, snap }: { isOpen: boolean; close: () => void; snap: any }) {
  // Using the exact cubic-bezier from the user's CSS
  const transitionSettings = { duration: 0.4, ease: [0.76, 0, 0.24, 1], delay: 0.2 };
  const clinicName = snap.settings.name || 'Likha Aesthetic Clinic';
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, visibility: 'hidden' as any }}
          animate={{ opacity: 1, visibility: 'visible' as any }}
          exit={{ opacity: 0, transition: { delay: 0 } }}
          transition={transitionSettings}
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{
            background: 'linear-gradient(rgb(250, 242, 240), rgb(253, 252, 252))',
            color: 'rgb(35, 31, 32)',
          }}
        >
          {/* Close Button */}
          <button 
            onClick={close}
            className="absolute top-10 right-10 p-2 hover:scale-110 transition-transform"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>

          <div className="w-full max-w-[1200px] px-8 grid md:grid-cols-2 gap-16 items-center">
            
            {/* Left Side: Massive Logo/Brand */}
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, ease: [0.15, 0.9, 0.34, 0.95], delay: 0.6 }}
              className="flex justify-center md:justify-start"
            >
              <div className="relative w-[300px] h-[300px] md:w-[500px] md:h-[500px] rounded-full border border-[#D19B8E] flex flex-col items-center justify-center p-12 text-center">
                <span className="text-[10px] tracking-[0.3em] uppercase text-[#D19B8E] mb-4">Dr. {clinicName}</span>
                <h2 className="text-5xl md:text-7xl font-light tracking-widest font-serif" style={{ color: '#D19B8E' }}>
                  LIKHA
                </h2>
                <span className="text-[10px] tracking-[0.2em] uppercase text-[#D19B8E] mt-4">Aesthetic Clinic</span>
                
                {/* Decorative lines matching the screenshot */}
                <div className="absolute top-0 bottom-0 w-[1px] bg-[#D19B8E]/30" />
              </div>
            </motion.div>

            {/* Right Side: Links */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="grid grid-cols-3 gap-8"
            >
              {/* Col 1 */}
              <div>
                <h4 className="text-[10px] font-bold tracking-[0.2em] text-[#A89D99] mb-8 uppercase">Explore</h4>
                <ul className="space-y-6 text-[14px] tracking-wide">
                  <li><a href="#treatments" onClick={close} className="hover:text-[#D19B8E] transition-colors">Treatments</a></li>
                  <li><a href="#products" onClick={close} className="hover:text-[#D19B8E] transition-colors">Products</a></li>
                  <li><a href="#reviews" onClick={close} className="hover:text-[#D19B8E] transition-colors">Reviews</a></li>
                  <li><a href="#store" onClick={close} className="hover:text-[#D19B8E] transition-colors">Store</a></li>
                </ul>
              </div>

              {/* Col 2 */}
              <div>
                <h4 className="text-[10px] font-bold tracking-[0.2em] text-[#A89D99] mb-8 uppercase">The Clinic</h4>
                <ul className="space-y-6 text-[14px] tracking-wide">
                  <li><a href="#about" onClick={close} className="hover:text-[#D19B8E] transition-colors">About</a></li>
                  <li><a href="#awards" onClick={close} className="hover:text-[#D19B8E] transition-colors">Awards</a></li>
                  <li><a href="#clinic" onClick={close} className="hover:text-[#D19B8E] transition-colors">Clinic of the Year</a></li>
                  <li><a href="#patient" onClick={close} className="hover:text-[#D19B8E] transition-colors">Patient Excellence</a></li>
                </ul>
              </div>

              {/* Col 3 */}
              <div>
                <h4 className="text-[10px] font-bold tracking-[0.2em] text-[#A89D99] mb-8 uppercase">Let's Talk</h4>
                <ul className="space-y-6 text-[14px] tracking-wide">
                  <li><a href="#enquiry" onClick={close} className="hover:text-[#D19B8E] transition-colors">Make an Enquiry</a></li>
                  <li><a href={`/c/${snap.slug}/book`} className="hover:text-[#D19B8E] transition-colors">Book Appointment</a></li>
                  <li><a href="#about" onClick={close} className="hover:text-[#D19B8E] transition-colors">About {clinicName}</a></li>
                </ul>
              </div>
            </motion.div>

          </div>

          {/* Socials & Footer of Menu */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="absolute bottom-10 left-10 right-10"
          >
            <div className="max-w-[1200px] mx-auto grid md:grid-cols-2 items-end">
              <div>
                <h4 className="text-[10px] font-bold tracking-[0.2em] text-[#A89D99] mb-6 uppercase">Elsewhere</h4>
                <div className="flex gap-4">
                  <a href="#" className="w-12 h-12 rounded-full border border-[#D19B8E] text-[#D19B8E] flex items-center justify-center hover:bg-[#D19B8E] hover:text-white transition-colors">
                    <FacebookIcon />
                  </a>
                  <a href="#" className="w-12 h-12 rounded-full border border-[#D19B8E] text-[#D19B8E] flex items-center justify-center hover:bg-[#D19B8E] hover:text-white transition-colors">
                    <InstagramIcon />
                  </a>
                  <a href="#" className="w-12 h-12 rounded-full border border-[#D19B8E] text-[#D19B8E] flex items-center justify-center hover:bg-[#D19B8E] hover:text-white transition-colors">
                    <LinkedInIcon />
                  </a>
                </div>
              </div>
              <div className="hidden md:flex gap-12 text-[12px] text-gray-500 justify-end">
                <a href="#" className="hover:text-[#D19B8E]">Contact {clinicName}</a>
                <a href="#" className="hover:text-[#D19B8E]">Privacy Policy</a>
                <a href="#" className="hover:text-[#D19B8E]">Terms & Conditions</a>
              </div>
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
  
  // Google Fonts for elegant serif and sans-serif
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&family=Montserrat:wght@300;400;500&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  const hero = snap.hero || {};
  const about = snap.about || {};
  const settings = snap.settings || {};
  const clinicName = settings.clinicName || settings.name || 'Likha Aesthetic';
  const services = Array.isArray(snap.services) && snap.services.length > 0
    ? snap.services
    : [
        { id: 1, icon: '💎', name: 'Skin Rejuvenation', description: 'Advanced non-surgical treatments to restore your natural radiance and youthful glow.' },
        { id: 2, icon: '✨', name: 'Anti-Ageing', description: 'Cutting-edge procedures that turn back the clock without invasive surgery.' },
        { id: 3, icon: '🌸', name: 'Body Contouring', description: 'Sculpt and define your silhouette with our state-of-the-art body treatments.' },
      ];

  return (
    <div 
      className="min-h-screen relative font-sans overflow-x-hidden selection:bg-[#D19B8E] selection:text-white"
      style={{
        background: 'linear-gradient(rgb(250, 242, 240), rgb(253, 252, 252))',
        color: 'rgb(35, 31, 32)',
        fontFamily: "'Montserrat', sans-serif"
      }}
    >
      <FullscreenMenu isOpen={menuOpen} close={() => setMenuOpen(false)} snap={snap} />

      {/* --- Sticky Header --- */}
      <header className="fixed top-0 left-0 right-0 z-40 p-6 md:p-10 flex justify-between items-center mix-blend-difference text-white">
        {/* Left: Brand / Hamburger */}
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setMenuOpen(true)}
            className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <div className="w-5 h-5 flex flex-col justify-center gap-1.5">
              <span className="block w-full h-[1px] bg-white"></span>
              <span className="block w-full h-[1px] bg-white"></span>
              <span className="block w-full h-[1px] bg-white"></span>
            </div>
          </button>
        </div>

        {/* Center: Brand Name (Morphing on scroll in full implementation, simple here) */}
        <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
          <h1 className="text-2xl tracking-[0.3em] font-serif uppercase">
            {clinicName}
          </h1>
          <span className="text-[8px] tracking-[0.2em] opacity-60 uppercase mt-1">Aesthetic Clinic</span>
        </div>

        {/* Right: Book Now */}
        <a 
          href={`/c/${snap.slug}/book`}
          className="text-xs uppercase tracking-[0.1em] border border-white/20 px-6 py-3 rounded-full hover:bg-white hover:text-black transition-colors"
        >
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
            className="relative z-10 md:pl-20"
          >
            <h2 className="text-5xl md:text-8xl font-serif leading-[1.1] mb-8" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              {hero.headline || 'Enhancing Your Natural Beauty'}
            </h2>
            <p className="text-lg md:text-xl opacity-80 max-w-md font-light leading-relaxed mb-12">
              {hero.subheadline || 'Award winning non-surgical beauty treatments delivered by medical professionals.'}
            </p>
            <a 
              href="#treatments"
              className="group flex items-center gap-4 text-sm uppercase tracking-widest font-medium"
            >
              <span className="w-12 h-12 rounded-full border border-[#D19B8E] flex items-center justify-center text-[#D19B8E] group-hover:bg-[#D19B8E] group-hover:text-white transition-all">
                ↓
              </span>
              <span>Discover Treatments</span>
            </a>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: [0.15, 0.9, 0.34, 0.95], delay: 0.4 }}
            className="relative h-[60vh] md:h-[85vh] w-full max-w-[600px] mx-auto rounded-t-full overflow-hidden border border-[#D19B8E]/30"
          >
            <img 
              src={snap.about.imageUrl || 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=1470&auto=format&fit=crop'} 
              alt="Clinic" 
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-[#D19B8E]/10 mix-blend-overlay"></div>
          </motion.div>
        </div>
      </section>

      {/* --- Treatments / Services --- */}
      <section id="treatments" className="py-32 px-4 md:px-20 border-t border-[#D19B8E]/20">
        <div className="max-w-[1400px] mx-auto">
          <h3 className="text-[10px] font-bold tracking-[0.2em] text-[#A89D99] mb-12 uppercase">Our Treatments</h3>
          
          <div className="grid md:grid-cols-3 gap-8">
            {snap.services.map((svc: any, idx: number) => {
              const { ref, visible } = useInView();
              return (
                <motion.div 
                  ref={ref}
                  initial={{ opacity: 0, y: 30 }}
                  animate={visible ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: idx * 0.1 }}
                  key={svc.id}
                  className="group block"
                >
                  <div className="aspect-[4/5] rounded-t-full rounded-b-full border border-[#D19B8E]/20 overflow-hidden relative mb-6">
                    <div className="absolute inset-0 bg-[#D19B8E]/5 group-hover:bg-[#D19B8E]/10 transition-colors flex flex-col items-center justify-center p-8 text-center">
                      <span className="text-4xl mb-6">{svc.icon}</span>
                      <h4 className="text-2xl font-serif mb-4" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{svc.name}</h4>
                      <p className="text-sm opacity-60 line-clamp-4">{svc.description}</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <span className="text-xs uppercase tracking-widest text-[#D19B8E] group-hover:text-black transition-colors">
                      Learn More
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* --- Footer (Minimalist) --- */}
      <footer className="py-12 border-t border-[#D19B8E]/20 text-center">
        <p className="text-xs tracking-widest opacity-60 uppercase">
          © {new Date().getFullYear()} {clinicName}. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
