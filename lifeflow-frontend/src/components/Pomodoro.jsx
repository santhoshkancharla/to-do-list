import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Flame, Hourglass, Award } from 'lucide-react';
import { motion } from 'framer-motion';

const MODES = {
  work: { label: 'Work Session', minutes: 25, color: '#8b5cf6', trackColor: 'stroke-violet-500/20', strokeColor: 'stroke-violet-500' },
  shortBreak: { label: 'Short Break', minutes: 5, color: '#10b981', trackColor: 'stroke-emerald-500/20', strokeColor: 'stroke-emerald-500' },
  longBreak: { label: 'Long Break', minutes: 15, color: '#3b82f6', trackColor: 'stroke-blue-500/20', strokeColor: 'stroke-blue-500' }
};

export default function Pomodoro() {
  const [mode, setMode] = useState('work');
  const [timeLeft, setTimeLeft] = useState(MODES.work.minutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [muted, setMuted] = useState(false);
  const timerRef = useRef(null);

  // Focus session counters
  const [todayFocusCount, setTodayFocusCount] = useState(0);

  useEffect(() => {
    // Reset timer on mode switch
    setTimeLeft(MODES[mode].minutes * 60);
    if (isRunning) {
      clearInterval(timerRef.current);
      setIsRunning(false);
    }
  }, [mode]);

  useEffect(() => {
    // Clean up timer on unmount
    return () => clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsRunning(false);
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [isRunning]);

  const handleTimerComplete = () => {
    // Play alert chime programmatically using Web Audio API
    if (!muted) {
      playAlertChime();
    }

    // Trigger Notification
    if (Notification.permission === 'granted') {
      new Notification("LifeFlow Focus Timer", {
        body: mode === 'work' ? "Session completed! Time for a well-deserved break." : "Break completed! Time to get back into focus flow.",
        icon: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%238b5cf6" stroke-width="2"%3E%3Ccircle cx="12" cy="12" r="10"/%3E%3C/svg%3E'
      });
    } else {
      alert(mode === 'work' ? "Focus session completed! Great job!" : "Break completed! Let's focus!");
    }

    // Log focus time to LocalStorage for Analytics
    if (mode === 'work') {
      const prevMinutes = parseInt(localStorage.getItem('lifeflow_focus_minutes') || '300', 10);
      const prevSessions = parseInt(localStorage.getItem('lifeflow_focus_sessions') || '12', 10);
      localStorage.setItem('lifeflow_focus_minutes', prevMinutes + MODES.work.minutes);
      localStorage.setItem('lifeflow_focus_sessions', prevSessions + 1);
      setTodayFocusCount(prev => prev + 1);
    }
  };

  // Programmatic Synth chime (no files needed!)
  const playAlertChime = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      
      // Node 1: Oscillator (Freq Pitch)
      const osc = audioCtx.createOscillator();
      // Node 2: Gain Node (Volume Envelope)
      const gainNode = audioCtx.createGain();
      
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      osc.type = 'sine';
      
      // Play a double chime: high note then higher note
      const now = audioCtx.currentTime;
      osc.frequency.setValueAtTime(523.25, now); // C5
      gainNode.gain.setValueAtTime(0.5, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.start(now);
      
      // Second pitch chord
      const osc2 = audioCtx.createOscillator();
      const gainNode2 = audioCtx.createGain();
      osc2.connect(gainNode2);
      gainNode2.connect(audioCtx.destination);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, now + 0.25); // E5
      gainNode2.gain.setValueAtTime(0.5, now + 0.25);
      gainNode2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
      osc2.start(now + 0.25);
      
      // Stop oscillators
      osc.stop(now + 0.5);
      osc2.stop(now + 0.8);
    } catch (err) {
      console.warn("Web Audio API not supported or blocked by browser:", err);
    }
  };

  const handleToggleStart = () => {
    // Request notification permission on interaction
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(MODES[mode].minutes * 60);
  };

  // Calculations for Circular SVG Ring
  const totalSeconds = MODES[mode].minutes * 60;
  const progressRatio = timeLeft / totalSeconds;
  const strokeDash = 2 * Math.PI * 80; // Radius is 80

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center justify-between h-full space-y-6">
      
      {/* Mode Switches */}
      <div className="flex gap-1.5 p-1 bg-slate-950/80 border border-slate-850 rounded-2xl w-full">
        {Object.entries(MODES).map(([key, config]) => (
          <button
            key={key}
            onClick={() => setMode(key)}
            className={`flex-1 py-2 text-[10px] font-bold rounded-xl transition-all cursor-pointer ${
              mode === key
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-350'
            }`}
            style={{ borderLeft: mode === key ? `2px solid ${config.color}` : 'none' }}
          >
            {config.label}
          </button>
        ))}
      </div>

      {/* Circle Countdown Timer */}
      <div className="relative flex items-center justify-center h-48 w-48 my-4">
        <svg className="w-full h-full transform -rotate-90">
          {/* Background Ring */}
          <circle
            cx="96"
            cy="96"
            r="80"
            className="stroke-slate-800 fill-none"
            strokeWidth="6"
          />
          {/* Progress Ring */}
          <circle
            cx="96"
            cy="96"
            r="80"
            className={`fill-none transition-all duration-300 ${MODES[mode].strokeColor}`}
            strokeWidth="6"
            strokeDasharray={strokeDash}
            strokeDashoffset={strokeDash * (1 - progressRatio)}
            strokeLinecap="round"
          />
        </svg>
        
        {/* Time Text Overlay */}
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-extrabold font-display text-white tracking-widest">
            {formatTime(timeLeft)}
          </span>
          <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 mt-1">
            {isRunning ? 'Flow State Active' : 'Session Paused'}
          </span>
        </div>
      </div>

      {/* Button Controls */}
      <div className="flex items-center gap-4">
        {/* Muted toggle */}
        <button
          onClick={() => setMuted(!muted)}
          className="p-2.5 rounded-xl border border-slate-850 bg-slate-950/40 text-slate-400 hover:text-white transition-colors cursor-pointer"
          title={muted ? "Unmute Alarm" : "Mute Alarm"}
        >
          {muted ? <VolumeX className="h-4.5 w-4.5" /> : <Volume2 className="h-4.5 w-4.5" />}
        </button>

        {/* Play/Pause */}
        <button
          onClick={handleToggleStart}
          className="h-14 w-14 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-neon-violet hover:brightness-110 active:scale-95 transition-all cursor-pointer"
        >
          {isRunning ? <Pause className="h-6 w-6 fill-current" /> : <Play className="h-6 w-6 fill-current translate-x-0.5" />}
        </button>

        {/* Reset */}
        <button
          onClick={handleReset}
          className="p-2.5 rounded-xl border border-slate-850 bg-slate-950/40 text-slate-400 hover:text-white transition-colors cursor-pointer"
          title="Reset timer"
        >
          <RotateCcw className="h-4.5 w-4.5" />
        </button>
      </div>

      {/* Completed session banner */}
      {todayFocusCount > 0 && (
        <div className="w-full mt-4 p-3.5 bg-violet-600/10 border border-violet-500/20 rounded-2xl flex items-center gap-3 text-violet-400 text-xs font-semibold">
          <Award className="h-4.5 w-4.5 text-violet-400 animate-bounce" />
          <span>Completed {todayFocusCount} sessions today! Keep flowing!</span>
        </div>
      )}

    </div>
  );
}
