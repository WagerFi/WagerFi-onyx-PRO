'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isTradeClicked, setIsTradeClicked] = useState(false);
  const [isButtonHovered, setIsButtonHovered] = useState(false);
  const [isDocsHovered, setIsDocsHovered] = useState(false);
  const [isXHovered, setIsXHovered] = useState(false);
  const [isTelegramHovered, setIsTelegramHovered] = useState(false);
  const [isNavHovered, setIsNavHovered] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleTradeClick = () => {
    setIsTradeClicked(true);
    // Navigate to /trade when solid background has fully faded in (6s delay + 2s duration)
    setTimeout(() => {
      router.push('/trade');
    }, 700);
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Enhanced SVG Filters for shockwave distortion */}
      <svg className="absolute w-0 h-0">
        <defs>
          <filter id="ripple-edge">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.015"
              numOctaves="4"
              result="turbulence"
            >
              <animate
                attributeName="seed"
                from="0"
                to="100"
                dur="7.5s"
                repeatCount="1"
              />
            </feTurbulence>
            <feDisplacementMap
              in="SourceGraphic"
              in2="turbulence"
              scale="80"
              xChannelSelector="R"
              yChannelSelector="G"
            />
            <feGaussianBlur stdDeviation="2" />
          </filter>
        </defs>
      </svg>

      {/* Base gradient background - Dark */}
      <div 
        className="absolute inset-0" 
        style={{
        background: 'radial-gradient(ellipse at center, #2a2a2a 0%, #000000 100%)'
        }}
      />

      {/* Off-white background expanding - 50% slower */}
      {isTradeClicked && (
        <motion.div 
          className="absolute left-1/2 top-1/2"
          style={{
            width: '100vmax',
            height: '100vmax',
            borderRadius: '50%',
            background: 'radial-gradient(circle, #f5f5f5 0%, #e8e8e8 40%, #d8d8f8 70%, transparent 100%)',
            filter: 'blur(50px)',
            willChange: 'transform, opacity',
            x: '-50%',
            y: '-50%'
          }}
          initial={{ 
            scale: 0,
            opacity: 0
          }}
          animate={{ 
            scale: 4,
            opacity: [0, 0.3, 0.6, 0.9, 1]
          }}
          transition={{ 
            duration: 7.5, 
            ease: [0.12, 0.8, 0.24, 1], 
            delay: 0.3,
            opacity: {
              times: [0, 0.2, 0.4, 0.7, 1]
            }
          }}
        />
      )}

      {/* Grid pattern on expanding white background - distorted */}
      {isTradeClicked && (
        <motion.div 
          className="absolute left-1/2 top-1/2"
          style={{
            width: '100vmax',
            height: '100vmax',
            borderRadius: '50%',
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.06) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(0, 0, 0, 0.06) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
            maskImage: 'radial-gradient(circle, transparent 0%, white 20%, white 85%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(circle, transparent 0%, white 20%, white 85%, transparent 100%)',
            filter: 'url(#ripple-edge)',
            willChange: 'transform, opacity',
            x: '-50%',
            y: '-50%',
            zIndex: 1
          }}
          initial={{ 
            scale: 0,
            opacity: 0
          }}
          animate={{ 
            scale: 4,
            opacity: [0, 0.4, 0.6, 0.8, 0.9]
          }}
          transition={{ 
            duration: 7.5, 
            ease: [0.12, 0.8, 0.24, 1], 
            delay: 0.3,
            opacity: {
              times: [0, 0.2, 0.4, 0.7, 1]
            }
          }}
        />
      )}

      {/* Iridescent ring at the edge - thicker and slower */}
      {isTradeClicked && (
        <motion.div 
          className="absolute left-1/2 top-1/2 pointer-events-none"
          style={{
            width: '100vmax',
            height: '100vmax',
            borderRadius: '50%',
            background: 'conic-gradient(from 0deg, #ff006e, #fb5607, #ffbe0b, #8338ec, #3a86ff, #06ffa5, #ff006e)',
            maskImage: 'radial-gradient(circle, transparent 55%, white 62%, white 88%, transparent 95%)',
            WebkitMaskImage: 'radial-gradient(circle, transparent 55%, white 62%, white 88%, transparent 95%)',
            filter: 'blur(20px)',
            willChange: 'transform, opacity',
            x: '-50%',
            y: '-50%',
            zIndex: 20
          }}
          initial={{ 
            scale: 0,
            opacity: 0,
            rotate: 0
          }}
          animate={{ 
            scale: 4,
            opacity: [0, 1, 1, 1, 0.8, 0.5],
            rotate: 180
          }}
          transition={{ 
            duration: 7.5, 
            ease: [0.12, 0.8, 0.24, 1], 
            delay: 0.3,
            opacity: {
              times: [0, 0.2, 0.4, 0.6, 0.8, 1]
            }
          }}
        />
      )}

      {/* Grid pattern on iridescent ring - distorted by fractal noise */}
      {isTradeClicked && (
        <motion.div 
          className="absolute left-1/2 top-1/2 pointer-events-none"
          style={{
            width: '100vmax',
            height: '100vmax',
            borderRadius: '50%',
            backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.8) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(255, 255, 255, 0.8) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
            maskImage: 'radial-gradient(circle, transparent 55%, white 62%, white 88%, transparent 95%)',
            WebkitMaskImage: 'radial-gradient(circle, transparent 55%, white 62%, white 88%, transparent 95%)',
            filter: 'url(#ripple-edge)',
            willChange: 'transform, opacity',
            mixBlendMode: 'overlay',
            x: '-50%',
            y: '-50%',
            zIndex: 21.5
          }}
          initial={{ 
            scale: 0,
            opacity: 0,
            rotate: 0
          }}
          animate={{ 
            scale: 4,
            opacity: [0, 0.8, 0.8, 0.8, 0.6, 0.4],
            rotate: 180
          }}
          transition={{ 
            duration: 7.5, 
            ease: [0.12, 0.8, 0.24, 1], 
            delay: 0.3,
            opacity: {
              times: [0, 0.2, 0.4, 0.6, 0.8, 1]
            }
          }}
        />
      )}

      {/* Distorted edge with fractal noise - visible warping */}
      {isTradeClicked && (
        <motion.div 
          className="absolute left-1/2 top-1/2 pointer-events-none"
          style={{
            width: '100vmax',
            height: '100vmax',
            borderRadius: '50%',
            background: 'conic-gradient(from 0deg, #ff006e, #fb5607, #ffbe0b, #8338ec, #3a86ff, #06ffa5, #ff006e)',
            maskImage: 'radial-gradient(circle, transparent 65%, white 70%, white 85%, transparent 90%)',
            WebkitMaskImage: 'radial-gradient(circle, transparent 65%, white 70%, white 85%, transparent 90%)',
            filter: 'url(#ripple-edge) blur(8px)',
            willChange: 'transform, opacity',
            mixBlendMode: 'screen',
            x: '-50%',
            y: '-50%',
            zIndex: 21
          }}
          initial={{ 
            scale: 0,
            opacity: 0
          }}
          animate={{ 
            scale: 4,
            opacity: [0, 1, 1, 0.8, 0.6]
          }}
          transition={{ 
            duration: 7.5, 
            ease: [0.12, 0.8, 0.24, 1], 
            delay: 0.3,
            opacity: {
              times: [0, 0.2, 0.4, 0.7, 1]
            }
          }}
        />
      )}

      {/* Additional warped shockwave layer on background edge */}
      {isTradeClicked && (
        <motion.div 
          className="absolute left-1/2 top-1/2 pointer-events-none"
          style={{
            width: '100vmax',
            height: '100vmax',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, rgba(200, 200, 255, 0.2) 50%, transparent 100%)',
            maskImage: 'radial-gradient(circle, transparent 72%, white 75%, white 78%, transparent 82%)',
            WebkitMaskImage: 'radial-gradient(circle, transparent 72%, white 75%, white 78%, transparent 82%)',
            filter: 'url(#ripple-edge)',
            willChange: 'transform, opacity',
            x: '-50%',
            y: '-50%',
            zIndex: 22
          }}
          initial={{ 
            scale: 0,
            opacity: 0
          }}
          animate={{ 
            scale: 4,
            opacity: [0, 0.7, 0.6, 0.4, 0]
          }}
          transition={{ 
            duration: 7.5, 
            ease: [0.12, 0.8, 0.24, 1], 
            delay: 0.3,
            opacity: {
              times: [0, 0.25, 0.5, 0.75, 1]
            }
          }}
        />
      )}

      {/* Solid background layer */}
      {isTradeClicked && (
        <motion.div 
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at center, #f5f5f5 0%, #e8e8e8 50%, #d8d8f8 100%)'
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2, ease: 'easeOut', delay: 6 }}
        />
      )}
      
      {/* Grid pattern */}
      <motion.div 
        className="absolute inset-0"
        animate={{
          backgroundImage: isTradeClicked
            ? `linear-gradient(rgba(0, 0, 0, 0.06) 1px, transparent 1px),
               linear-gradient(90deg, rgba(0, 0, 0, 0.06) 1px, transparent 1px)`
            : `linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
               linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)`
        }}
        style={{
        backgroundSize: '50px 50px',
        maskImage: 'radial-gradient(ellipse at center, rgba(0, 0, 0, 0.8) 0%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse at center, rgba(0, 0, 0, 0.8) 0%, transparent 100%)'
        }}
        transition={{ duration: 0.8, delay: 0.8 }}
      />

      {/* Navbar */}
      <AnimatePresence>
        {isTradeClicked && (
          <motion.nav
            className="absolute top-0 left-0 right-0 z-50 p-6"
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.8 }}
          >
            <motion.div 
              className="relative inline-flex items-center gap-2 px-4 py-2 rounded-xl cursor-pointer"
              style={{
                background: 'rgba(30, 30, 30, 1)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)'
              }}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
                e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
              }}
              onMouseEnter={() => setIsNavHovered(true)}
              onMouseLeave={() => setIsNavHovered(false)}
            >
              {/* Iridescent hover border */}
              <motion.div
                className="absolute pointer-events-none"
                style={{
                  inset: 0,
                  borderRadius: '12px',
                  padding: '2px',
                  background: `radial-gradient(100px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), #ff006e 0%, #fb5607 8%, #ffbe0b 16%, #8338ec 24%, #3a86ff 32%, #06ffa5 40%, transparent 50%)`,
                  WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  WebkitMaskComposite: 'xor',
                  mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  maskComposite: 'exclude'
                }}
                animate={{
                  opacity: isNavHovered ? 1 : 0
                }}
                transition={{ duration: 0.2 }}
              />

              <span className="relative z-10 text-xl tracking-tight select-none uppercase mt-0.5 flex items-center gap-2 pr-1" style={{ fontFamily: 'Geist, sans-serif' }}>
                <span className="font-light text-white">WAGERFI</span>
                <span className="w-0.5 h-6 bg-gradient-to-b from-transparent via-white/30 to-transparent"></span>
                <span 
                  className="font-bold pr-1"
                  style={{
                    background: 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 50%, #d4d4d4 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    fontFamily: 'Varien Outline, sans-serif'
                  }}
                >
                  ONYX
                </span>
              </span>
              <span 
                className="relative z-10 bg-white text-[#2a2a2a] text-sm font-extrabold px-2 py-0.5 rounded-md mt-1"
              >
                PRO
              </span>
            </motion.div>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* Content */}
      <AnimatePresence>
        {!isTradeClicked && (
          <motion.div 
            className="relative z-10 flex flex-col items-center gap-8"
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ 
              duration: 0.3,
              ease: 'easeOut'
            }}
          >
      {/* Title */}
            <h1 className="text-6xl text-white tracking-tight flex items-center gap-3 select-none">
              <motion.span
                className="relative inline-block uppercase flex items-center gap-3"
                style={{ 
                  fontFamily: 'Varien, sans-serif'
                }}
                initial={{ opacity: 0, y: 100 }}
                animate={mounted ? { opacity: 1, y: 0 } : { opacity: 0, y: 100 }}
                transition={{ 
                  duration: 0.8,
                  ease: [0.22, 1, 0.36, 1]
                }}
              >
                <span className="font-light">WAGERFI</span>
                <span className="w-0.5 h-16 bg-gradient-to-b from-transparent via-white/30 to-transparent"></span>
                <span 
                  className="font-bold pr-2"
                  style={{
                    background: 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 50%, #d4d4d4 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    fontFamily: 'Varien Outline, sans-serif'
                  }}
                >
                  ONYX
                </span>
                <motion.span
                  className="absolute inset-0 pointer-events-none flex items-center gap-3"
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.3) 40%, rgba(255, 255, 255, 1) 50%, rgba(255, 255, 255, 0.3) 60%, transparent 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    backgroundSize: '200% 100%',
                    filter: 'brightness(1.5)',
                    fontFamily: 'Varien Outline, sans-serif'
                  }}
                  animate={{
                    backgroundPosition: ['200% 0', '-200% 0']
                  }}
                  transition={{
                    duration: 2,
                    ease: 'easeInOut',
                    repeat: Infinity,
                    repeatDelay: Math.random() * 3 + 2
                  }}
                >
          <span className="font-light">WAGERFI</span>
          <span className="w-0.5 h-16 opacity-0"></span>
          <span className="font-bold">ONYX</span>
                </motion.span>
              </motion.span>
              <motion.span
                className="bg-white text-[#2a2a2a] text-3xl font-black px-3 py-1 rounded-lg mt-2"
                style={{ 
                  fontWeight: 900
                }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={mounted ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                transition={{ 
                  duration: 0.6,
                  delay: 0.8,
                  ease: [0.22, 1, 0.36, 1]
                }}
              >
                PRO
              </motion.span>
      </h1>

            {/* Trade Button */}
            <motion.div
                className="relative"
                initial={{ opacity: 0, y: 20 }}
                animate={mounted ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ 
                  duration: 0.6,
                  delay: 1.4,
                  ease: [0.22, 1, 0.36, 1]
                }}
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const y = e.clientY - rect.top;
                  e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
                  e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
                }}
                onMouseEnter={() => setIsButtonHovered(true)}
                onMouseLeave={() => setIsButtonHovered(false)}
              >
              {/* Rainbow glow behind button */}
              {!isTradeClicked && (
                <motion.div
                  className="absolute pointer-events-none"
                  style={{
                    top: '-20px',
                    left: '-20px',
                    right: '-20px',
                    bottom: '-20px',
                    borderRadius: '20px',
                    background: `radial-gradient(200px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), #ff006e, #fb5607, #ffbe0b, #8338ec, #3a86ff, #06ffa5, transparent)`,
                    filter: 'blur(30px)',
                    opacity: 0.4,
                    zIndex: 0
                  }}
                  animate={{
                    opacity: isButtonHovered ? 0.6 : 0
                  }}
                  transition={{ duration: 0.3 }}
                />
              )}

              <motion.button
                className="relative z-10 px-10 py-2 text-white font-light text-lg tracking-wide cursor-pointer select-none"
                style={{ 
                  borderRadius: '12px',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: '2px solid transparent'
                }}
                onClick={handleTradeClick}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {/* Optimized button background */}
                <motion.div
                  className="absolute inset-0 rounded-xl"
                  style={{
                    background: isTradeClicked 
                      ? 'linear-gradient(135deg, #ff006e, #fb5607, #3a86ff, #06ffa5)'
                      : 'linear-gradient(135deg, rgba(45, 45, 45, 0.95), rgba(30, 30, 30, 0.95))',
                    backgroundSize: '200% 200%',
                    willChange: 'background-position'
                  }}
                  animate={{
                    backgroundPosition: isTradeClicked ? ['0% 50%', '100% 50%', '0% 50%'] : '0% 50%'
                  }}
                  transition={{ 
                    backgroundPosition: { duration: 3, repeat: Infinity, ease: 'linear' }
                  }}
                />

                {/* Optimized hover border - on button itself */}
                {!isTradeClicked && (
                  <motion.div
                    className="absolute inset-0 rounded-xl pointer-events-none overflow-hidden"
                    style={{
                      padding: '2px',
                      background: `radial-gradient(80px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), #ff006e 0%, #fb5607 8%, #ffbe0b 16%, #8338ec 24%, #3a86ff 32%, #06ffa5 40%, transparent 50%)`,
                      WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                      WebkitMaskComposite: 'xor',
                      mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                      maskComposite: 'exclude'
                    }}
                    animate={{
                      opacity: isButtonHovered ? 1 : 0
                    }}
                    transition={{ duration: 0.2 }}
                  />
                )}

                <span className="relative z-10">Enter</span>
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Docs Button - Bottom Left */}
      <AnimatePresence>
        {!isTradeClicked && (
          <motion.div
            className="absolute bottom-8 left-8 z-10"
            initial={{ opacity: 0, y: 20 }}
            animate={mounted ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ 
              duration: 0.6,
              delay: 1.5,
              ease: [0.22, 1, 0.36, 1]
            }}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const y = e.clientY - rect.top;
              e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
              e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
            }}
            onMouseEnter={() => setIsDocsHovered(true)}
            onMouseLeave={() => setIsDocsHovered(false)}
          >
            <motion.button
              className="relative px-5 py-1.5 text-white font-light text-sm tracking-wide cursor-pointer select-none"
              style={{ 
                borderRadius: '10px',
                background: 'linear-gradient(135deg, rgba(45, 45, 45, 0.95), rgba(30, 30, 30, 0.95))',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                fontFamily: 'Geist, sans-serif'
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Iridescent hover border */}
              <motion.div
                className="absolute pointer-events-none"
                style={{
                  top: '-2px',
                  left: '-2px',
                  right: '-2px',
                  bottom: '-2px',
                  borderRadius: '12px',
                  padding: '2px',
                  background: `radial-gradient(80px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), #ff006e 0%, #fb5607 8%, #ffbe0b 16%, #8338ec 24%, #3a86ff 32%, #06ffa5 40%, transparent 50%)`,
                  WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  WebkitMaskComposite: 'xor',
                  mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  maskComposite: 'exclude'
                }}
                animate={{
                  opacity: isDocsHovered ? 1 : 0
                }}
                transition={{ duration: 0.2 }}
              />
              <span className="relative z-10">Docs</span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Social Buttons - Bottom Right */}
      <AnimatePresence>
        {!isTradeClicked && (
          <div className="absolute bottom-8 right-8 flex gap-4 z-10">
            {/* X Button */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, y: 20 }}
              animate={mounted ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ 
                duration: 0.6,
                delay: 1.6,
                ease: [0.22, 1, 0.36, 1]
              }}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
                e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
              }}
              onMouseEnter={() => setIsXHovered(true)}
              onMouseLeave={() => setIsXHovered(false)}
            >
              <motion.button
                className="relative w-9 h-9 flex items-center justify-center text-white cursor-pointer select-none"
                style={{ 
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, rgba(45, 45, 45, 0.95), rgba(30, 30, 30, 0.95))',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.open('https://twitter.com', '_blank')}
              >
                {/* Iridescent hover border */}
                <motion.div
                  className="absolute pointer-events-none"
                  style={{
                    top: '-2px',
                    left: '-2px',
                    right: '-2px',
                    bottom: '-2px',
                    borderRadius: '12px',
                    padding: '2px',
                    background: `radial-gradient(80px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), #ff006e 0%, #fb5607 8%, #ffbe0b 16%, #8338ec 24%, #3a86ff 32%, #06ffa5 40%, transparent 50%)`,
                    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    WebkitMaskComposite: 'xor',
                    mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    maskComposite: 'exclude'
                  }}
                  animate={{
                    opacity: isXHovered ? 1 : 0
                  }}
                  transition={{ duration: 0.2 }}
                />
                <svg className="relative z-10 w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </motion.button>
            </motion.div>

            {/* Telegram Button */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, y: 20 }}
              animate={mounted ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ 
                duration: 0.6,
                delay: 1.7,
                ease: [0.22, 1, 0.36, 1]
              }}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
                e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
              }}
              onMouseEnter={() => setIsTelegramHovered(true)}
              onMouseLeave={() => setIsTelegramHovered(false)}
            >
              <motion.button
                className="relative w-9 h-9 flex items-center justify-center text-white cursor-pointer select-none"
                style={{ 
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, rgba(45, 45, 45, 0.95), rgba(30, 30, 30, 0.95))',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.open('https://t.me', '_blank')}
              >
                {/* Iridescent hover border */}
                <motion.div
                  className="absolute pointer-events-none"
                  style={{
                    top: '-2px',
                    left: '-2px',
                    right: '-2px',
                    bottom: '-2px',
                    borderRadius: '12px',
                    padding: '2px',
                    background: `radial-gradient(80px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), #ff006e 0%, #fb5607 8%, #ffbe0b 16%, #8338ec 24%, #3a86ff 32%, #06ffa5 40%, transparent 50%)`,
                    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    WebkitMaskComposite: 'xor',
                    mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    maskComposite: 'exclude'
                  }}
                  animate={{
                    opacity: isTelegramHovered ? 1 : 0
                  }}
                  transition={{ duration: 0.2 }}
                />
                {/* Telegram Icon SVG */}
                <svg className="relative z-10 w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                </svg>
              </motion.button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

