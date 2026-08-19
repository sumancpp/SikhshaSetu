import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  onFinish?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [phase, setPhase] = useState<'enter' | 'pulse' | 'zoom' | 'done'>('enter');

  useEffect(() => {
    // Phase 1: Logo enters & glows (0ms - 400ms)
    const enterTimer = setTimeout(() => {
      setPhase('pulse');
    }, 400);

    // Phase 2: Logo expands/zooms outward (1600ms - 2200ms)
    const zoomTimer = setTimeout(() => {
      setPhase('zoom');
    }, 1600);

    // Phase 3: Transition complete, reveal main app (2200ms)
    const doneTimer = setTimeout(() => {
      setPhase('done');
      if (onFinish) onFinish();
    }, 2200);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(zoomTimer);
      clearTimeout(doneTimer);
    };
  }, [onFinish]);

  if (phase === 'done') {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black text-white select-none overflow-hidden">
      {/* Background Animated Atmosphere Aura */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-blue-600/30 via-indigo-500/20 to-purple-600/30 blur-3xl transition-transform duration-1000 ${
            phase === 'zoom' ? 'scale-[3] opacity-0' : 'scale-100 opacity-100 animate-pulse'
          }`}
        />
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full border border-blue-400/20 transition-all duration-1000 ${
            phase === 'zoom' ? 'scale-[4] opacity-0' : 'scale-100 opacity-60'
          }`}
        />
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[220px] h-[220px] rounded-full border border-indigo-400/30 transition-all duration-1000 ${
            phase === 'zoom' ? 'scale-[3] opacity-0' : 'scale-100 opacity-80'
          }`}
        />
      </div>

      {/* Center Logo Container with Zoom Transformation */}
      <div
        className={`relative flex flex-col items-center justify-center transition-all ease-in-out ${
          phase === 'enter'
            ? 'scale-75 opacity-0 duration-500'
            : phase === 'pulse'
            ? 'scale-100 opacity-100 duration-700'
            : 'scale-[4.5] opacity-0 duration-700'
        }`}
      >
        {/* Center Logo Badge Container */}
        <div className="relative p-3.5 sm:p-4 rounded-3xl bg-white shadow-[0_0_45px_rgba(59,130,246,0.6),0_0_90px_rgba(147,51,234,0.35)] border border-white/80 mb-2">
          {/* Official ShikshaSetu Logo */}
          <img
            src="/logo.png"
            alt="ShikshaSetu Logo"
            className="w-24 h-24 sm:w-32 sm:h-32 object-contain rounded-2xl"
          />
        </div>

        {/* High-Contrast Brand Title */}
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-center mt-2">
          <span className="text-white drop-shadow-[0_2px_12px_rgba(255,255,255,0.4)]">Shiksha</span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">Setu</span>
        </h1>

        {/* Tagline text visible during pulse phase */}
        <div
          className={`mt-2 text-center transition-opacity duration-300 ${
            phase === 'zoom' ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="h-0.5 w-6 bg-gradient-to-r from-transparent to-blue-400" />
            <p className="text-xs sm:text-sm font-semibold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-indigo-200 to-purple-300 uppercase">
              Learn • Collaborate • Compete • Grow
            </p>
            <span className="h-0.5 w-6 bg-gradient-to-l from-transparent to-purple-400" />
          </div>

          {/* Minimalist Loading Bar */}
          <div className="w-36 sm:w-48 h-1 bg-slate-800/80 rounded-full mx-auto mt-5 overflow-hidden border border-slate-700/50">
            <div className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full animate-[progress_1.8s_ease-in-out_infinite]" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
