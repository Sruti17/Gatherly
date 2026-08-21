import React from 'react';
import { motion } from 'framer-motion';

function HeroBanner({ onJoinGang }) {
  const personCollageA = (
    <motion.div initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="gatherly-collage left-[8%] top-1/2 hidden -translate-y-1/2 md:block">
      <div className="relative h-24 w-36 -rotate-6 overflow-hidden rounded-[45%] border-4 border-white shadow-sm">
        <img src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&q=80" alt="Friends gathering" className="size-full object-cover" />
        <span className="gatherly-sticker bottom-1 left-2 rotate-[-4deg] bg-[#f7c8eb] text-[#4314A0]">NEAR YOU ✨</span>
      </div>
      <div className="relative -mt-1 ml-4 h-24 w-36 rotate-6 overflow-hidden rounded-[45%] border-4 border-white shadow-sm">
        <img src="https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=400&q=80" alt="People at a dance class" className="size-full object-cover" />
        <span className="gatherly-sticker bottom-1 left-2 rotate-[4deg] bg-[#ffb3d1] text-[#641b2c]">DANCE CLASS 🎶</span>
      </div>
    </motion.div>
  );

  const personCollageB = (
    <motion.div initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="gatherly-collage right-[8%] top-1/2 hidden -translate-y-1/2 md:block">
      <div className="relative ml-6 h-24 w-36 rotate-6 overflow-hidden rounded-[45%] border-4 border-white shadow-sm">
        <img src="https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=400&q=80" alt="Friends at a book club" className="size-full object-cover" />
        <span className="gatherly-sticker bottom-1 right-2 rotate-[4deg] bg-[#ffb3d1] text-[#641b2c]">BOOK CLUB 📚</span>
      </div>
      <div className="relative -mt-1 h-24 w-36 -rotate-6 overflow-hidden rounded-[45%] border-4 border-white shadow-sm">
        <img src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&q=80" alt="Friends meeting outdoors" className="size-full object-cover" />
        <span className="gatherly-sticker bottom-1 right-2 rotate-[-4deg] bg-[#f5d789] text-[#493615]">MEETUPS EVERY WEEK ⚡</span>
      </div>
    </motion.div>
  );

  return (
    <section className="gatherly-hero relative overflow-hidden px-4 py-8 text-center md:py-10">
      <span className="gatherly-hero-emoji left-[13%] top-5">♡</span>
      <span className="gatherly-hero-emoji right-[12%] top-8">✦</span>
      <span className="gatherly-hero-emoji left-[25%] top-10 text-xl">💜</span>
      <span className="gatherly-hero-emoji left-[30%] bottom-8 text-2xl">😊</span>
      <span className="gatherly-hero-emoji right-[26%] top-12 text-xl">⚡</span>
      <span className="gatherly-hero-emoji right-[20%] bottom-10 text-2xl">💛</span>
      <span className="gatherly-hero-emoji left-[8%] bottom-8 text-lg">🎹</span>
      <span className="gatherly-hero-emoji right-[8%] bottom-7 text-xl">🎶</span>
      <span className="gatherly-hero-emoji left-[18%] top-20 text-lg">☆</span>
      <span className="gatherly-hero-emoji right-[17%] top-20 text-lg">☀️</span>
      <span className="gatherly-hero-emoji left-[4%] top-24 text-xl">🐱</span>
      <span className="gatherly-hero-emoji right-[4%] bottom-5 text-xl">🐱</span>
      {personCollageA}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: 'easeOut' }} className="relative z-10 mx-auto max-w-xl">
        <h1 className="gatherly-title font-sans text-3xl font-extrabold leading-[1.02] tracking-tight md:text-[34px]">
          The Gatherly Platform.<br />
          Find ur people. Turn connections<br />
          into *vibe* communities. ✨💜
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm font-medium text-gray-700">
          Spill the tea on dope local events and meet-ups<br /> near you. We out here! 🔥
        </p>
        <motion.button type="button" onClick={onJoinGang} whileHover={{ scale: 1.05, rotate: [-1, 1, 0] }} whileTap={{ scale: 0.97 }} className="gatherly-glow-button mt-4 px-7 py-2 text-base font-black text-[#241455]">
          LETS GOOOOOO! 🚀
        </motion.button>
      </motion.div>
      {personCollageB}
    </section>
  );
}

export default HeroBanner;