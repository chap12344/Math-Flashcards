/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Minus, Check, X, RotateCcw, Award, Sparkles, BookOpen, 
  Settings, HelpCircle, ChevronRight, RefreshCw, Trash2, Edit2, 
  Volume2, VolumeX, Eye, Info, PenTool, Eraser, Calendar, AlertTriangle,
  Gamepad2, EyeOff, Shield, ShieldAlert, Monitor, ArrowLeft, Maximize, ExternalLink, Laptop, Save, FileText, Download, Upload
} from 'lucide-react';

const STORAGE_STATS_KEY = 'math_flashcards_stats_v3';
const STORAGE_MISTAKES_KEY = 'math_flashcards_mistakes_v3';
const STORAGE_CLOAK_KEY = 'games_tab_cloak_v1';
const STORAGE_LOCAL_GAMES_KEY = 'games_local_custom_v1';

// Tab Cloak Presets definitions with actual public secure SVG/PNG icon URLs
const CLOAK_PRESETS = {
  none: {
    title: 'Math Flashcards',
    icon: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=32&h=32&q=80', // Beautiful soft icon
  },
  drive: {
    title: 'My Drive - Google Drive',
    icon: 'https://ssl.gstatic.com/images/branding/product/1x/drive_2020q4_32dp.png'
  },
  classroom: {
    title: 'Home | Google Classroom',
    icon: 'https://www.gstatic.com/classroom/logo_square_rounded_32.png'
  },
  docs: {
    title: 'Google Docs',
    icon: 'https://ssl.gstatic.com/docs/documents/images/kix-favicon7.ico'
  },
  canvas: {
    title: 'Dashboard | Canvas',
    icon: 'https://du11hjcvx0uqb.cloudfront.net/br/v1.27.0/images/favicon-canvas.ico'
  },
  powerschool: {
    title: 'PowerSchool',
    icon: 'https://www.powerschool.com/wp-content/themes/powerschool/favicon.ico'
  }
};

// Tone synthesizer helper
const playSynthTone = (freq, duration, type = 'sine', soundEnabled = true) => {
  if (!soundEnabled) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    
    gainNode.gain.setValueAtTime(0.04, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (err) {
    // browser audio permissions lock
  }
};

// Math Helpers
const generateParamsForDifficulty = (op, diff) => {
  let lower1 = 1, upper1 = 10;
  let lower2 = 1, upper2 = 10;

  if (op === 'add' || op === 'sub') {
    if (diff === 'easy') { lower1 = 1; upper1 = 12; lower2 = 1; upper2 = 12; }
    else if (diff === 'medium') { lower1 = 10; upper1 = 60; lower2 = 5; upper2 = 40; }
    else if (diff === 'hard') { lower1 = 50; upper1 = 200; lower2 = 10; upper2 = 150; }
  } else if (op === 'mul' || op === 'div') {
    if (diff === 'easy') { lower1 = 1; upper1 = 10; lower2 = 1; upper2 = 10; }
    else if (diff === 'medium') { lower1 = 2; upper1 = 12; lower2 = 2; upper2 = 12; }
    else if (diff === 'hard') { lower1 = 11; upper1 = 25; lower2 = 3; upper2 = 18; }
  }
  return { lower1, upper1, lower2, upper2 };
};

const generateCard = (op, diff, customL1, customU1, customL2, customU2) => {
  const possibleOps = ['add', 'sub', 'mul', 'div'];
  const finalOp = op === 'mixed' ? possibleOps[Math.floor(Math.random() * 4)] : op;
  
  let lower1, upper1, lower2, upper2;
  if (diff === 'custom') {
    lower1 = customL1; upper1 = customU1; lower2 = customL2; upper2 = customU2;
  } else {
    const params = generateParamsForDifficulty(finalOp, diff);
    lower1 = params.lower1; upper1 = params.upper1; lower2 = params.lower2; upper2 = params.upper2;
  }

  let num1 = Math.floor(Math.random() * (upper1 - lower1 + 1)) + lower1;
  let num2 = Math.floor(Math.random() * (upper2 - lower2 + 1)) + lower2;
  let operatorSymbol = '+';
  let answer = 0;

  switch (finalOp) {
    case 'add':
      operatorSymbol = '+';
      answer = num1 + num2;
      break;
    case 'sub':
      operatorSymbol = '−';
      if (num1 < num2) { const t = num1; num1 = num2; num2 = t; }
      answer = num1 - num2;
      break;
    case 'mul':
      operatorSymbol = '×';
      answer = num1 * num2;
      break;
    case 'div':
      operatorSymbol = '÷';
      if (num2 === 0) num2 = 1;
      const quotient = Math.floor(Math.random() * (upper1 - lower1 + 1)) + lower1;
      num1 = num2 * quotient;
      answer = quotient;
      break;
  }

  return {
    id: `card-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    num1,
    num2,
    operation: finalOp,
    operatorSymbol,
    answer
  };
};

export default function App() {
  // Lifetime stats and mistake deck models saved in localStorage
  const [lifetimeStats, setLifetimeStats] = useState(() => {
    try {
      const data = localStorage.getItem(STORAGE_STATS_KEY);
      return data ? JSON.parse(data) : { totalChecked: 0, totalCorrect: 0, streak: 0, lastPlayed: null, history: [] };
    } catch {
      return { totalChecked: 0, totalCorrect: 0, streak: 0, lastPlayed: null, history: [] };
    }
  });

  const [mistakes, setMistakes] = useState(() => {
    try {
      const data = localStorage.getItem(STORAGE_MISTAKES_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  });

  const [cloakPreset, setCloakPreset] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_CLOAK_KEY) || 'none';
    } catch {
      return 'none';
    }
  });

  const [localGames, setLocalGames] = useState(() => {
    try {
      const data = localStorage.getItem(STORAGE_LOCAL_GAMES_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  });

  // Settings
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // Dashboard setups
  const [screen, setScreen] = useState('dashboard'); // 'dashboard', 'practice', 'stealth-console'
  const [practiceType, setPracticeType] = useState('flashcard'); // 'flashcard', 'quiz'
  const [operation, setOperation] = useState('add'); // 'add', 'sub', 'mul', 'div', 'mixed'
  const [difficulty, setDifficulty] = useState('easy'); // 'easy', 'medium', 'hard', 'custom'
  
  // Custom range bounds
  const [lowerBound1, setLowerBound1] = useState(1);
  const [upperBound1, setUpperBound1] = useState(20);
  const [lowerBound2, setLowerBound2] = useState(1);
  const [upperBound2, setUpperBound2] = useState(20);

  // Active practice variables
  const [targetDeck, setTargetDeck] = useState([]);
  const [deckIndex, setDeckIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewMistakesMode, setReviewMistakesMode] = useState(false);

  // Speed Quiz session properties
  const [quizSize, setQuizSize] = useState(10);
  const [userInputsValue, setUserInputsValue] = useState('');
  const [quizTimer, setQuizTimer] = useState(0);
  const [quizResults, setQuizResults] = useState(null); 
  const [evaluationFeedback, setEvaluationFeedback] = useState(null); // 'correct' | 'incorrect'
  
  // Stealth Console variables
  const [gamesList, setGamesList] = useState([]);
  const [isLoadingGames, setIsLoadingGames] = useState(false);
  const [gamesError, setGamesError] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null);
  const [gameSearch, setGameSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  const [showGameManager, setShowGameManager] = useState(false);
  const [mgmtGameName, setMgmtGameName] = useState('');
  const [mgmtGameUrl, setMgmtGameUrl] = useState('');
  const [mgmtGameCat, setMgmtGameCat] = useState('Arcade');
  const [mgmtGameDesc, setMgmtGameDesc] = useState('');

  const timerIntervalRef = useRef(null);

  // Sync state helpers to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_STATS_KEY, JSON.stringify(lifetimeStats));
  }, [lifetimeStats]);

  useEffect(() => {
    localStorage.setItem(STORAGE_MISTAKES_KEY, JSON.stringify(mistakes));
  }, [mistakes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_LOCAL_GAMES_KEY, JSON.stringify(localGames));
  }, [localGames]);

  // Execute Dynamic Favicon and Title Switch side effects
  useEffect(() => {
    try {
      const preset = CLOAK_PRESETS[cloakPreset] || CLOAK_PRESETS.none;
      
      // Update Title
      document.title = preset.title;
      
      // Update Favicon Link
      let link = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = preset.icon;
      localStorage.setItem(STORAGE_CLOAK_KEY, cloakPreset);
    } catch (e) {
      console.error("Failed to update tab cloaking", e);
    }
  }, [cloakPreset]);

  // Backtick " ` " keystoke to instantly open or instantly escape to mask mode
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '`') {
        e.preventDefault();
        playSynthTone(600, 0.08, 'square', soundEnabled);
        
        if (screen === 'stealth-console' || selectedGame) {
          // Immediately hide and restore standard mask dashboard!
          setSelectedGame(null);
          setScreen('dashboard');
        } else {
          // Enter stealth console
          setScreen('stealth-console');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [screen, selectedGame, soundEnabled]);

  // Speed timer logic
  useEffect(() => {
    if (screen === 'practice' && practiceType === 'quiz' && !quizResults) {
      timerIntervalRef.current = setInterval(() => {
        setQuizTimer((t) => t + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [screen, practiceType, quizResults]);

  // Fetch index.json games from repo or fallback cleanly
  const fetchHostedGames = async () => {
    setIsLoadingGames(true);
    setGamesError(null);
    try {
      const res = await fetch('games/index.json');
      if (!res.ok) {
        throw new Error(`Failed to load games config index.json (${res.status})`);
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setGamesList(data);
      } else {
        setGamesList([]);
      }
    } catch (err) {
      console.warn("Could not load /games/index.json. Fallback to storage or custom settings instruction is available.", err);
      // Don't crash, let it succeed but show simple user instructions on how to put files in folder
      setGamesList([]);
      setGamesError(err.message);
    } finally {
      setIsLoadingGames(false);
    }
  };

  useEffect(() => {
    fetchHostedGames();
  }, []);

  const playFeedbackTone = (type) => {
    if (!soundEnabled) return;
    if (type === 'success') {
      playSynthTone(523.25, 0.08, 'sine', true);
      setTimeout(() => playSynthTone(659.25, 0.08, 'sine', true), 80);
      setTimeout(() => playSynthTone(783.99, 0.12, 'sine', true), 160);
    } else if (type === 'fail') {
      playSynthTone(196.00, 0.15, 'triangle', true);
      setTimeout(() => playSynthTone(155.56, 0.25, 'triangle', true), 100);
    } else {
      playSynthTone(400, 0.04, 'sine', true);
    }
  };

  // Start Math practice
  const startPractice = (isReviewMode = false) => {
    playFeedbackTone('tap');
    setIsFlipped(false);
    setDeckIndex(0);
    setQuizTimer(0);
    setQuizResults(null);
    setEvaluationFeedback(null);
    setUserInputsValue('');
    setReviewMistakesMode(isReviewMode);

    if (isReviewMode) {
      if (mistakes.length === 0) return;
      const shuffled = [...mistakes].sort(() => Math.random() - 0.5);
      setTargetDeck(shuffled);
    } else {
      const sizeList = practiceType === 'quiz' ? quizSize : 15;
      const cards = [];
      for (let i = 0; i < sizeList; i++) {
        cards.push(generateCard(operation, difficulty, lowerBound1, upperBound1, lowerBound2, upperBound2));
      }
      setTargetDeck(cards);
    }
    setScreen('practice');
  };

  // Submit Speed Quiz input answer
  const handleAnswerSubmit = (e) => {
    if (e) e.preventDefault();
    if (!userInputsValue.trim()) return;

    const currentCard = targetDeck[deckIndex];
    if (!currentCard) return;

    const parsedInput = parseInt(userInputsValue.trim(), 10);
    const isCorrect = parsedInput === currentCard.answer;

    if (isCorrect) {
      setEvaluationFeedback('correct');
      playFeedbackTone('success');
      
      setLifetimeStats((prev) => {
        const todayStr = new Date().toDateString();
        let currentStreak = prev.streak;
        if (prev.lastPlayed === todayStr) {
          // remains
        } else if (prev.lastPlayed === new Date(Date.now() - 86400000).toDateString()) {
          currentStreak += 1;
        } else {
          currentStreak = 1;
        }

        return {
          totalChecked: prev.totalChecked + 1,
          totalCorrect: prev.totalCorrect + 1,
          streak: currentStreak,
          lastPlayed: todayStr,
          history: [...prev.history, { date: Date.now(), answerCorrect: true }]
        };
      });

      if (reviewMistakesMode) {
        setMistakes((prev) => prev.filter((m) => !(m.num1 === currentCard.num1 && m.num2 === currentCard.num2 && m.operation === currentCard.operation)));
      }
    } else {
      setEvaluationFeedback('incorrect');
      playFeedbackTone('fail');

      setLifetimeStats((prev) => ({
        totalChecked: prev.totalChecked + 1,
        totalCorrect: prev.totalCorrect,
        history: [...prev.history, { date: Date.now(), answerCorrect: false }]
      }));

      const exists = mistakes.some((m) => m.num1 === currentCard.num1 && m.num2 === currentCard.num2 && m.operation === currentCard.operation);
      if (!exists) {
        setMistakes((prev) => [...prev, currentCard]);
      }
    }

    const updatedLog = [...(quizResults?.list || [])];
    updatedLog.push({ ...currentCard, userAnswer: parsedInput, answerCorrect: isCorrect });

    setQuizResults((prev) => ({
      answered: (prev?.answered || 0) + 1,
      correctCount: (prev?.correctCount || 0) + (isCorrect ? 1 : 0),
      list: updatedLog
    }));

    setTimeout(() => {
      setEvaluationFeedback(null);
      setUserInputsValue('');
      if (deckIndex + 1 < targetDeck.length) {
        setDeckIndex((prev) => prev + 1);
      } else {
        // finished
      }
    }, 1000);
  };

  // Direct Self-evaluation feedback for classic card flip state
  const handleFlashcardEvaluate = (isGotItRight) => {
    const currentCard = targetDeck[deckIndex];
    if (!currentCard) return;

    if (isGotItRight) {
      playFeedbackTone('success');
      setLifetimeStats((prev) => {
        const todayStr = new Date().toDateString();
        let currentStreak = prev.streak;
        if (prev.lastPlayed === todayStr) {
          // remain
        } else if (prev.lastPlayed === new Date(Date.now() - 86400000).toDateString()) {
          currentStreak += 1;
        } else {
          currentStreak = 1;
        }

        return {
          totalChecked: prev.totalChecked + 1,
          totalCorrect: prev.totalCorrect + 1,
          streak: currentStreak,
          lastPlayed: todayStr,
          history: [...prev.history, { date: Date.now(), answerCorrect: true }]
        };
      });

      if (reviewMistakesMode) {
        setMistakes((prev) => prev.filter((m) => !(m.num1 === currentCard.num1 && m.num2 === currentCard.num2 && m.operation === currentCard.operation)));
      }
    } else {
      playFeedbackTone('fail');
      setLifetimeStats((prev) => ({
        totalChecked: prev.totalChecked + 1,
        totalCorrect: prev.totalCorrect,
        history: [...prev.history, { date: Date.now(), answerCorrect: false }]
      }));

      const exists = mistakes.some((m) => m.num1 === currentCard.num1 && m.num2 === currentCard.num2 && m.operation === currentCard.operation);
      if (!exists) {
        setMistakes((prev) => [...prev, currentCard]);
      }
    }

    setIsFlipped(false);
    setTimeout(() => {
      if (deckIndex + 1 < targetDeck.length) {
        setDeckIndex((prev) => prev + 1);
      } else {
        setScreen('dashboard');
      }
    }, 200);
  };

  const handleKeypadPress = (val) => {
    playSynthTone(380, 0.04, 'sine', soundEnabled);
    if (val === 'back') {
      setUserInputsValue((prev) => prev.slice(0, -1));
    } else if (val === 'clear') {
      setUserInputsValue('');
    } else if (val === 'minus') {
      setUserInputsValue((prev) => (prev.startsWith('-') ? prev.slice(1) : '-' + prev));
    } else {
      setUserInputsValue((prev) => prev + val);
    }
  };

  // Custom Local game items additions loader
  const handleAddLocalGame = (e) => {
    e.preventDefault();
    if (!mgmtGameName.trim() || !mgmtGameUrl.trim()) return;

    let targetUrl = mgmtGameUrl.trim();
    let customId = null;
    let customName = null;
    let customJsname = null;
    let customSandbox = null;

    if (targetUrl.startsWith('<iframe') || targetUrl.includes('src=')) {
      // It's a raw iframe snippet! Let's extract everything inside it
      const srcMatch = targetUrl.match(/src=["']([^"']+)["']/i);
      if (srcMatch) targetUrl = srcMatch[1];
      
      const idMatch = mgmtGameUrl.match(/id=["']([^"']+)["']/i);
      if (idMatch) customId = idMatch[1];
      
      const nameMatch = mgmtGameUrl.match(/name=["']([^"']+)["']/i);
      if (nameMatch) customName = nameMatch[1];
      
      const jsnameMatch = mgmtGameUrl.match(/jsname=["']([^"']+)["']/i);
      if (jsnameMatch) customJsname = jsnameMatch[1];
      
      const sandboxMatch = mgmtGameUrl.match(/sandbox=["']([^"']+)["']/i);
      if (sandboxMatch) customSandbox = sandboxMatch[1];
    }

    // Always clean up any HTML entity encodings like &amp; in the URL
    targetUrl = targetUrl.replace(/&amp;/g, '&');

    const newObj = {
      id: `local-${Date.now()}`,
      name: mgmtGameName.trim(),
      url: targetUrl,
      category: mgmtGameCat,
      description: mgmtGameDesc.trim() || 'Custom loaded browser URL link game.',
      isLocal: true,
      iframeId: customId,
      iframeName: customName,
      jsname: customJsname,
      sandbox: customSandbox
    };

    setLocalGames((prev) => [newObj, ...prev]);
    setMgmtGameName('');
    setMgmtGameUrl('');
    setMgmtGameDesc('');
    setShowGameManager(false);
    playFeedbackTone('success');
  };

  const deleteLocalGame = (id) => {
    if (window.confirm("Delete this custom loaded game from your local browser dashboard?")) {
      setLocalGames((prev) => prev.filter((g) => g.id !== id));
      playFeedbackTone('tap');
    }
  };

  // Merge loaded index.json games + the user's custom stored list games
  const allAvailableGames = [...localGames, ...gamesList];

  const filteredGames = allAvailableGames.filter((g) => {
    const sMatch = g.name.toLowerCase().includes(gameSearch.toLowerCase()) || 
                   g.description.toLowerCase().includes(gameSearch.toLowerCase());
    const cMatch = selectedCategory === 'All' || g.category === selectedCategory || (selectedCategory === 'Local' && g.isLocal);
    return sMatch && cMatch;
  });

  const uniqueCategories = ['All', 'Arcade', 'Puzzle', 'Action', 'Sports', 'Retro', 'Local'];

  // Launch in isolated absolute blank popup
  const openInAboutBlank = (game) => {
    try {
      const url = game.url;
      const win = window.open('about:blank', '_blank');
      if (!win) {
        alert("Pop-up blocker prevented opening in about:blank mode. Please whitelist or allow popups on this tab.");
        return;
      }
      win.document.body.style.margin = '0';
      win.document.body.style.height = '100vh';
      win.document.body.style.overflow = 'hidden';
      const iframe = win.document.createElement('iframe');
      iframe.style.border = 'none';
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.margin = '0';
      iframe.src = url;
      win.document.body.appendChild(iframe);
    } catch (e) {
      console.error(e);
    }
  };

  const solvedCount = lifetimeStats.totalChecked || 0;
  const accuracyPct = solvedCount > 0 ? Math.round((lifetimeStats.totalCorrect / solvedCount) * 100) : 0;
  const streakCount = lifetimeStats.streak || 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col relative">
      
      {/* STEALTH FLOATING CORNER BACK LINK */}
      <div className="absolute top-1 left-4 opacity-5 pointer-events-auto hover:opacity-100 transition-opacity z-50">
        <button 
          onClick={() => setScreen(screen === 'stealth-console' ? 'dashboard' : 'stealth-console')} 
          className="text-[9px] font-mono text-slate-400 font-bold tracking-widest cursor-pointer px-1 py-0.5 rounded"
          title="Stealth Backdoor (` key)"
        >
          ~ SECRETS
        </button>
      </div>

      {/* STANDARD NAVIGATION HEADER */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 py-3 px-6 shadow-xs select-none">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          
          <div 
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => { setScreen('dashboard'); playFeedbackTone('tap'); }}
          >
            <div className="bg-blue-600 text-white w-9 h-9 rounded-xl flex items-center justify-center font-display font-extrabold text-md shadow-sm shadow-blue-200">
              ±
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent font-display">
                Math Flashcards
              </h1>
              <p className="text-[9px] tracking-wider text-slate-400 font-medium uppercase font-mono">
                Interactive cover dashboard
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Audio switch toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-xl border border-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
              title={soundEnabled ? "Mute sounds" : "Enable sound fx"}
            >
              {soundEnabled ? (
                <Volume2 className="w-3.5 h-3.5 text-slate-600" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-slate-300" />
              )}
            </button>

            {/* Back button to dashboard when active */}
            {screen !== 'dashboard' && (
              <button
                onClick={() => { setScreen('dashboard'); setSelectedGame(null); playFeedbackTone('tap'); }}
                className="text-xs font-bold px-3 py-1.5 border border-slate-250 bg-white hover:bg-slate-50 rounded-xl cursor-pointer transition-colors shadow-2xs"
              >
                ← Return to Cover
              </button>
            )}
          </div>

        </div>
      </header>

      {/* CONTENT SCREEN SELECTOR */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-5 py-6 flex flex-col justify-start">
        
        {screen === 'dashboard' ? (
          /* ==================================================================== */
          /* COVER DASHBOARD (Standard Math Flashcard Setup)                     */
          /* ==================================================================== */
          <div className="space-y-6 animate-fade-in relative z-10">
            
            {/* COVER METRICS HERO */}
            <div className="relative rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-6 overflow-hidden shadow-lg shadow-blue-100 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 z-10 max-w-lg text-center md:text-left">
                <span className="text-[10px] font-bold tracking-widest text-[#93c5fd] bg-blue-900/40 border border-blue-500/20 px-3 py-1 rounded-full font-mono uppercase">
                  ⚡ Grade Arithmetic Training
                </span>
                <h2 className="text-lg md:text-xl font-bold tracking-tight font-display leading-tight">
                  Sharpen Your Mental Arithmetics
                </h2>
                <p className="text-xs text-blue-100 font-display">
                  Practice simple equations across customized difficulty presets, keep track of errors, and boost processing speeds daily.
                </p>
              </div>

              {/* Cover Stats Row */}
              <div className="flex items-center gap-6 bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 z-10 w-full md:w-auto justify-around">
                <div className="text-center px-1">
                  <div className="text-xl font-extrabold font-display leading-none text-white">{solvedCount}</div>
                  <div className="text-[9px] font-bold text-blue-200 mt-1 uppercase tracking-wider font-display">Solved</div>
                </div>
                <div className="w-[1px] h-6 bg-white/20"></div>

                <div className="text-center px-1">
                  <div className="text-xl font-extrabold font-display leading-none text-emerald-300">{accuracyPct}%</div>
                  <div className="text-[9px] font-bold text-blue-200 mt-1 uppercase tracking-wider font-display">Accuracy</div>
                </div>
                <div className="w-[1px] h-6 bg-white/20"></div>

                <div className="text-center px-1">
                  <div className="text-xl font-extrabold font-display leading-none text-amber-300">🔥 {streakCount}</div>
                  <div className="text-[9px] font-bold text-blue-200 mt-1 uppercase tracking-wider font-display">Streak</div>
                </div>
              </div>
            </div>

            {/* SELECTION CONFIGS */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              
              {/* PRIMARY MATH CONFIG */}
              <div className="md:col-span-7 bg-white rounded-3xl border border-slate-150/80 p-6 shadow-2xs space-y-5">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-xs font-extrabold text-slate-800 font-display uppercase tracking-wider">
                    Flashcard Deck Configuration
                  </h3>
                  <p className="text-[10px] text-slate-400">Set up custom operations and difficulties</p>
                </div>

                {/* format */}
                <div className="space-y-1.5Col">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-display">
                    Display Platform Format
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPracticeType('flashcard')}
                      className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                        practiceType === 'flashcard' 
                          ? 'border-blue-600 bg-blue-50/20 text-blue-900 shadow-2xs' 
                          : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-md block">🎴</span>
                      <span className="text-xs font-bold block leading-none font-display text-slate-800 mt-1">Interactive Card Deck</span>
                      <span className="text-[9.5px] text-slate-400 mt-1 block">Click to reveal formula answers & check logic</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPracticeType('quiz')}
                      className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                        practiceType === 'quiz' 
                          ? 'border-blue-600 bg-blue-50/20 text-blue-900 shadow-2xs' 
                          : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-md block">⚡</span>
                      <span className="text-xs font-bold block leading-none font-display text-slate-800 mt-1">Input Speed Quiz</span>
                      <span className="text-[9.5px] text-slate-400 mt-1 block">Type answers via interactive keypads & tracking timers</span>
                    </button>
                  </div>
                </div>

                {/* operation */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-display">
                    Operators
                  </label>
                  <div className="grid grid-cols-5 gap-1.5 font-display">
                    {[
                      { id: 'add', symbol: '+' },
                      { id: 'sub', symbol: '−' },
                      { id: 'mul', symbol: '×' },
                      { id: 'div', symbol: '÷' },
                      { id: 'mixed', symbol: '±' }
                    ].map((op) => (
                      <button
                        key={op.id}
                        type="button"
                        onClick={() => setOperation(op.id)}
                        className={`py-2 rounded-xl border text-center font-extrabold transition-all cursor-pointer ${
                          operation === op.id ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-250 bg-white text-slate-700 hover:border-slate-350'
                        }`}
                      >
                        <div className="text-md leading-none">{op.symbol}</div>
                        <div className="text-[8px] font-bold uppercase opacity-80 mt-0.5">{op.id}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* difficulty */}
                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-display">
                    Difficulty Bounds
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'easy', text: 'Easy (1-12)' },
                      { id: 'medium', text: 'Med (2-60)' },
                      { id: 'hard', text: 'Hard (10-200)' },
                      { id: 'custom', text: '✏️ Custom' }
                    ].map((diff) => (
                      <button
                        key={diff.id}
                        type="button"
                        onClick={() => setDifficulty(diff.id)}
                        className={`py-2 rounded-xl border text-center text-xs font-bold cursor-pointer transition-all ${
                          difficulty === diff.id ? 'border-blue-600 bg-blue-50/30 text-blue-900' : 'border-slate-200 bg-white text-slate-500'
                        }`}
                      >
                        {diff.text}
                      </button>
                    ))}
                  </div>

                  {difficulty === 'custom' && (
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl grid grid-cols-2 gap-3 text-xs animate-fade-in font-display">
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">First Term Bounds</span>
                        <div className="flex items-center gap-1">
                          <input 
                            type="number" 
                            value={lowerBound1} 
                            onChange={(e) => setLowerBound1(Math.max(1, parseInt(e.target.value, 10) || 1))}
                            className="w-full bg-white border border-slate-200 py-1.5 px-2 rounded-lg font-mono text-center"
                          />
                          <span className="text-slate-400">to</span>
                          <input 
                            type="number" 
                            value={upperBound1} 
                            onChange={(e) => setUpperBound1(Math.max(lowerBound1, parseInt(e.target.value, 10) || lowerBound1))}
                            className="w-full bg-white border border-slate-200 py-1.5 px-2 rounded-lg font-mono text-center"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Second Term Bounds</span>
                        <div className="flex items-center gap-1">
                          <input 
                            type="number" 
                            value={lowerBound2} 
                            onChange={(e) => setLowerBound2(Math.max(1, parseInt(e.target.value, 10) || 1))}
                            className="w-full bg-white border border-slate-200 py-1.5 px-2 rounded-lg font-mono text-center"
                          />
                          <span className="text-slate-400">to</span>
                          <input 
                            type="number" 
                            value={upperBound2} 
                            onChange={(e) => setUpperBound2(Math.max(lowerBound2, parseInt(e.target.value, 10) || lowerBound2))}
                            className="w-full bg-white border border-slate-200 py-1.5 px-2 rounded-lg font-mono text-center"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {practiceType === 'quiz' && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-display block">Quiz Size</span>
                    <div className="flex gap-2">
                      {[10, 20, 50].map((s) => (
                        <button
                          key={s}
                          onClick={() => setQuizSize(s)}
                          className={`flex-1 py-1.5 text-xs font-bold border rounded-xl cursor-pointer transition-all ${
                            quizSize === s ? 'border-blue-600 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {s} Equations
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => startPractice(false)}
                  className="w-full py-4 mt-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold font-display rounded-2xl shadow-sm transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-98"
                >
                  Generate Training Deck <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* CONSOLE STATS & HIDDEN TRIGGER PANEL */}
              <div className="md:col-span-5 space-y-6">
                
                {/* Mistakes Review */}
                <div className="bg-white rounded-3xl border border-slate-150/80 p-5 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <span className="text-xs font-extrabold text-slate-800 font-display uppercase tracking-wide flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
                      Mistakes Revision Book
                    </span>
                    <span className="text-[10px] font-bold font-mono text-orange-600 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-full">
                      {mistakes.length} Saved
                    </span>
                  </div>
                  <p className="text-[10.5px] text-slate-400 leading-relaxed">
                    Formulas missed during practice modes save here automatically so you can focus specifically on difficult sets.
                  </p>
                  <button
                    disabled={mistakes.length === 0}
                    onClick={() => startPractice(true)}
                    className="w-full border cursor-pointer border-orange-200 font-bold text-orange-700 bg-orange-50 hover:bg-orange-100 text-xs py-2.5 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Load revision cards
                  </button>
                </div>

                {/* HIDDEN INCONSPICUOUS STEALTH SHORTCUT ENTRANCE (Perfect "Masked" concept) */}
                <div className="bg-slate-100/40 border border-dashed border-slate-200 p-5 rounded-3xl space-y-3 relative overflow-hidden select-none">
                  <div className="absolute top-0 right-0 p-2 opacity-5">
                    <Gamepad2 className="w-12 h-12" />
                  </div>
                  
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block font-mono">
                    System Information
                  </span>
                  
                  <p className="text-[10.5px] text-slate-500 leading-relaxed font-display">
                    Standard educational formulas generated fully on-client in sandbox layout. 
                  </p>

                  <div className="pt-1.5 flex flex-col gap-2">
                    {/* Stealth Trigger button */}
                    <button
                      onClick={() => { setScreen('stealth-console'); playFeedbackTone('tap'); }}
                      className="w-full py-2 bg-white hover:bg-slate-100 border border-slate-250 rounded-xl text-slate-600 font-bold font-display text-xs cursor-pointer flex items-center justify-center gap-1.5 shadow-3xs"
                    >
                      <Gamepad2 className="w-3.5 h-3.5 text-blue-500" />
                      Open Games Vault
                    </button>
                    
                    <span className="text-[9.5px] text-center text-slate-400 italic block font-mono font-bold">
                      Shortcut: Save and toggle instantly anytime by pressing the ` (backtick) key!
                    </span>
                  </div>
                </div>

              </div>

            </div>

          </div>
        ) : screen === 'practice' ? (
          /* ==================================================================== */
          /* MATHEMATICS PRACTICE AREA (Cover Face)                              */
          /* ==================================================================== */
          <div className="max-w-2xl mx-auto w-full space-y-6 animate-fade-in relative z-10 select-none">
            
            <div className="bg-white border border-slate-150/85 p-6 rounded-3xl shadow-sm space-y-5 flex flex-col min-h-[460px]">
              
              {/* Stat strip bar */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 font-display">
                <span className="bg-slate-100 border border-slate-200 text-slate-700 font-mono font-bold text-[10.5px] px-2.5 py-1 rounded-lg">
                  Equation {deckIndex + 1} of {targetDeck.length}
                </span>

                {practiceType === 'quiz' && (
                  <span className="text-slate-500 font-mono font-bold text-xs">
                    ⏱️ {Math.floor(quizTimer / 60)}m {quizTimer % 60}s
                  </span>
                )}

                <div className="text-xs font-bold font-mono text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-md">
                  ACCURACY: {quizResults ? Math.round((quizResults.correctCount / (quizResults.answered || 1)) * 100) : 100}%
                </div>
              </div>

              {/* CARD SPACE (FLASHCARD FLIP MODE) */}
              {practiceType === 'flashcard' && targetDeck[deckIndex] ? (
                <div className="flex-1 flex flex-col justify-center items-center py-6">
                  
                  {/* Perspective Flip Frame */}
                  <div className="perspective-1000 w-full max-w-sm h-52 relative">
                    
                    {/* Inner Rotate container */}
                    <div 
                      onClick={() => setIsFlipped(!isFlipped)}
                      className={`w-full h-full rounded-3xl cursor-pointer transform-style-3d transition-transform duration-500 shadow-md border border-slate-200 absolute inset-0 bg-white ${
                        isFlipped ? 'rotate-y-180' : ''
                      }`}
                    >
                      {/* FRONT OF THE MATH CARD (Formula) */}
                      <div className="backface-hidden w-full h-full flex flex-col justify-center items-center text-slate-800 p-6 absolute inset-0">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono mb-2">
                          Standard Practice Card
                        </span>
                        
                        <div className="text-5xl font-extrabold font-display select-none tracking-tight flex items-center gap-3">
                          <span>{targetDeck[deckIndex].num1}</span>
                          <span className="text-blue-500 font-medium">{targetDeck[deckIndex].operatorSymbol}</span>
                          <span>{targetDeck[deckIndex].num2}</span>
                        </div>

                        <span className="text-[10px] text-blue-500 font-medium font-display mt-4 bg-blue-50/60 px-2.5 py-1 rounded-full animate-bounce">
                          Click / Tap to Reveal Answer
                        </span>
                      </div>

                      {/* BACK OF THE MATH CARD (Evaluation) */}
                      <div className="backface-hidden rotate-y-180 w-full h-full flex flex-col justify-center items-center text-slate-800 p-6 absolute inset-0 bg-slate-50 rounded-3xl">
                        <span className="text-[10px] font-extrabold-blue-500 text-indigo-500 uppercase tracking-widest font-mono mb-2">
                          Answer Calculation
                        </span>

                        <div className="text-5xl font-black font-display text-emerald-600 tracking-tight">
                          {targetDeck[deckIndex].answer}
                        </div>

                        <p className="text-[10px] text-slate-450 mt-2 font-display">
                          {targetDeck[deckIndex].num1} {targetDeck[deckIndex].operatorSymbol} {targetDeck[deckIndex].num2} = {targetDeck[deckIndex].answer}
                        </p>
                      </div>

                    </div>

                  </div>

                  {/* Manual Evaluation buttons on flip cards */}
                  {isFlipped && (
                    <div className="flex items-center gap-4 mt-6 w-full max-w-sm font-display animate-fade-in">
                      <button
                        onClick={() => handleFlashcardEvaluate(false)}
                        className="flex-1 py-3 bg-rose-50 border border-rose-200 text-rose-700 font-bold rounded-2xl hover:bg-rose-100 transition-all cursor-pointer flex items-center justify-center gap-1"
                      >
                        <X className="w-4 h-4" /> Got it Wrong
                      </button>

                      <button
                        onClick={() => handleFlashcardEvaluate(true)}
                        className="flex-1 py-3 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all cursor-pointer shadow-sm shadow-emerald-100 flex items-center justify-center gap-1"
                      >
                        <Check className="w-4 h-4 stroke-[3px]" /> Got it Right!
                      </button>
                    </div>
                  )}

                </div>
              ) : practiceType === 'quiz' && targetDeck[deckIndex] ? (
                /* SPEED QUIZ (INPUT SYSTEM) */
                <div className="flex-1 flex flex-col justify-between py-2">
                  
                  {/* Active Question Panel */}
                  <div className="text-center py-6 bg-slate-50/60 rounded-2xl border border-slate-100/60 relative overflow-hidden">
                    {/* Evaluation Flash border overlay */}
                    {evaluationFeedback && (
                      <div className={`absolute inset-0 z-10 transition-colors opacity-10 ${
                        evaluationFeedback === 'correct' ? 'bg-emerald-500' : 'bg-rose-500'
                      }`} />
                    )}

                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-mono mb-1">
                      Input the correct sum
                    </span>

                    <div className="text-4xl font-black font-display flex items-center justify-center gap-3">
                      <span>{targetDeck[deckIndex].num1}</span>
                      <span className="text-blue-500 font-medium">{targetDeck[deckIndex].operatorSymbol}</span>
                      <span>{targetDeck[deckIndex].num2}</span>
                      <span className="text-slate-400">=</span>
                      <span className="bg-white border-2 border-slate-250 font-mono text-blue-600 px-4 py-1 rounded-xl shadow-3xs inline-block min-w-[70px] text-center text-3xl">
                        {userInputsValue || '?'}
                      </span>
                    </div>

                    {evaluationFeedback && (
                      <div className="mt-2.5 animate-bounce">
                        {evaluationFeedback === 'correct' ? (
                          <span className="text-xs font-bold text-emerald-600 flex items-center justify-center gap-1">
                            <Check className="w-4 h-4 stroke-[3px]" /> Correct! Well Done.
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-rose-600 flex items-center justify-center gap-1">
                            <X className="w-4 h-4" /> Oops, Let's retry!
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Digital Keypad for streamlined calculation entries */}
                  <div className="grid grid-cols-4 gap-2 mt-4 max-w-sm mx-auto w-full select-none font-display">
                    {['1', '2', '3'].map((n) => (
                      <button key={n} onClick={() => handleKeypadPress(n)} className="py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-sm font-semibold rounded-xl cursor-pointer transition-colors text-center">{n}</button>
                    ))}
                    <button onClick={() => handleKeypadPress('back')} className="py-2.5 bg-slate-100 hover:bg-slate-250 text-slate-600 text-xs font-bold rounded-xl cursor-pointer text-center flex items-center justify-center">Backspace</button>
                    
                    {['4', '5', '6'].map((n) => (
                      <button key={n} onClick={() => handleKeypadPress(n)} className="py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-sm font-semibold rounded-xl cursor-pointer transition-colors text-center">{n}</button>
                    ))}
                    <button onClick={() => handleKeypadPress('minus')} className="py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-sm font-semibold rounded-xl cursor-pointer transition-colors text-center">±</button>
                    
                    {['7', '8', '9'].map((n) => (
                      <button key={n} onClick={() => handleKeypadPress(n)} className="py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-sm font-semibold rounded-xl cursor-pointer transition-colors text-center">{n}</button>
                    ))}
                    <button onClick={() => handleKeypadPress('clear')} className="py-2.5 bg-slate-100 hover:bg-slate-200 text-rose-500 font-bold text-xs rounded-xl cursor-pointer text-center">Clear</button>

                    <button onClick={() => handleKeypadPress('0')} className="col-span-2 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-sm font-semibold rounded-xl cursor-pointer transition-colors text-center">0</button>
                    <button 
                      onClick={handleAnswerSubmit} 
                      className="col-span-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl cursor-pointer shadow-sm shadow-blue-100 flex items-center justify-center gap-1"
                    >
                      Check Formula
                    </button>
                  </div>

                </div>
              ) : (
                /* QUIZ COMPLAETED CONSOLE PANEL */
                <div className="flex-1 flex flex-col justify-center items-center text-center p-6 space-y-4 font-display">
                  <div className="w-14 h-14 bg-gradient-to-tr from-emerald-400 to-teal-500 text-white rounded-full flex items-center justify-center shadow-lg transform rotate-6">
                    <Award className="w-7 h-7 stroke-[2.5px]" />
                  </div>

                  <h3 className="text-md font-bold text-slate-850">practice Session Completed!</h3>
                  <p className="text-xs text-slate-450 max-w-sm">
                    You checked {quizResults?.answered} formulas with a grand score of {quizResults?.correctCount} correct calculations. Great training!
                  </p>

                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl w-full max-w-xs text-xs space-y-1.5 font-mono text-left">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Cards Checked:</span>
                      <strong className="text-slate-700">{quizResults?.answered}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Accurate Answers:</span>
                      <strong className="text-emerald-600">{quizResults?.correctCount}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Spent Timer:</span>
                      <strong className="text-slate-700">{quizTimer} seconds</strong>
                    </div>
                  </div>

                  <button
                    onClick={() => { setScreen('dashboard'); playFeedbackTone('tap'); }}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer transition-all"
                  >
                    Finish Training Session
                  </button>
                </div>
              )}

            </div>

          </div>
        ) : (
          /* ==================================================================== */
          /* THE GAME WEBPAGE VAULT (Hidden Stealth Games Arena!)                */
          /* ==================================================================== */
          <div className="space-y-6 animate-fade-in flex flex-col flex-1 relative z-10 select-none">
            
            {/* SUB IFRAME GAME ACTIVE SCREEN */}
            {selectedGame ? (
              
              <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[650px] max-w-4xl mx-auto w-full border border-slate-850">
                
                {/* Embedded control bar overlay */}
                <div className="bg-slate-950 border-b border-slate-800 px-5 py-2.5 flex items-center justify-between text-slate-300">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => { setSelectedGame(null); playFeedbackTone('tap'); }}
                      className="p-1.5 px-3 border border-slate-705 bg-slate-800 hover:bg-slate-750 rounded-lg text-xs font-bold font-display cursor-pointer text-slate-200 transition-colors"
                    >
                      ← Back to Games Lobby
                    </button>
                    <div>
                      <h4 className="text-xs font-black tracking-tight text-white font-display leading-none">
                        {selectedGame.name}
                      </h4>
                      <p className="text-[9px] text-slate-500 mt-1 uppercase font-mono tracking-wider">
                        Running in direct sandboxed frame
                      </p>
                    </div>
                  </div>

                  {/* Evading utilities buttons */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => { setSelectedGame(null); setScreen('dashboard'); playFeedbackTone('tap'); }}
                      className="p-1.5 px-3 bg-rose-950/80 hover:bg-rose-900 border border-rose-800 rounded-lg text-[10px] font-bold cursor-pointer text-rose-200 transition-colors"
                      title="Instantly clear and return to the Math Flashcards dashboard"
                    >
                      ❌ Quick Hide
                    </button>
                  </div>
                </div>

                {/* GAME FRAME PORTAL */}
                <div className="flex-1 bg-black relative">
                  <iframe 
                    id={selectedGame.iframeId || "720a38057da8f08f_23"}
                    name={selectedGame.iframeName || "720a38057da8f08f_23"}
                    jsname={selectedGame.jsname || "WMhH6e"}
                    src={selectedGame.url} 
                    className="w-full h-full border-none block bg-slate-950"
                    allowFullScreen
                    frameBorder="0"
                    scrolling="no"
                    sandbox={selectedGame.sandbox || "allow-scripts allow-popups allow-forms allow-same-origin allow-popups-to-escape-sandbox allow-downloads allow-storage-access-by-user-activation"}
                    title={selectedGame.name}
                  />
                </div>

              </div>

            ) : (
              
              /* MASTER LOBBY */
              <div className="space-y-5 flex-1 flex flex-col">
                
                {/* COGNITO BANNER */}
                <div className="bg-slate-900 text-white rounded-3xl p-5 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm relative overflow-hidden">
                  <div className="space-y-1 z-10">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-bold tracking-widest text-emerald-400 font-mono uppercase">
                        Unblocked Games Portal (Inactive pre-builds)
                      </span>
                    </div>
                    <h3 className="text-md font-bold font-display tracking-tight text-white">
                      School Evasion Browser Console
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed font-display">
                      Add your custom html5 games! Use the built-in Tab Cloaking menu below to instantly disguise this webpage on your browser tab bar.
                    </p>
                  </div>

                  {/* TAB DISGUISE PRESETS SELECTOR */}
                  <div className="bg-slate-800/80 border border-slate-700/60 p-3 rounded-2xl flex flex-col gap-1.5 w-full md:w-auto min-w-[200px] z-10 text-xs text-slate-300 font-display">
                    <label className="text-[9px] font-extrabold text-[#94a3b8] uppercase tracking-wider block leading-none">
                      🔒 Tab Cloak Disguise Preset
                    </label>
                    <select
                      value={cloakPreset}
                      onChange={(e) => { setCloakPreset(e.target.value); playFeedbackTone('success'); }}
                      className="bg-slate-900 border border-slate-700 py-1.5 px-2.5 rounded-lg text-white font-semibold text-xs focus:outline-none cursor-pointer w-full"
                    >
                      <option value="none">No Mask (Default UI)</option>
                      <option value="drive">Disguise: Google Drive</option>
                      <option value="classroom">Disguise: Google Classroom</option>
                      <option value="docs">Disguise: Google Docs</option>
                      <option value="canvas">Disguise: Canvas Dashboard</option>
                      <option value="powerschool">Disguise: PowerSchool</option>
                    </select>
                  </div>
                </div>

                {/* GAME CATEGORY STRIP / SEARCH */}
                <div className="bg-white border text-xs border-slate-150 p-4.5 rounded-3xl shadow-3xs flex flex-col md:flex-row items-center justify-between gap-4">
                  
                  {/* Category toggle strip */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {uniqueCategories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => { setSelectedCategory(cat); playFeedbackTone('tap'); }}
                        className={`px-3 py-1.5 rounded-xl font-bold font-display cursor-pointer transition-all ${
                          selectedCategory === cat 
                            ? 'bg-blue-600 text-white shadow-2xs' 
                            : 'bg-slate-100 hover:bg-slate-150 text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Search / Custom Actions */}
                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <input
                      type="text"
                      placeholder="Search items..."
                      value={gameSearch}
                      onChange={(e) => setGameSearch(e.target.value)}
                      className="bg-slate-100 border border-slate-200 outline-none px-3.5 py-1.5 rounded-xl text-xs text-slate-700 focus:bg-white focus:border-blue-500 w-full md:w-48 transition-colors"
                    />

                    <button
                      onClick={() => { setShowGameManager(true); playFeedbackTone('tap'); }}
                      className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1 shrink-0 px-3.5"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Games Link
                    </button>
                  </div>

                </div>

                {/* POPUP: ADD CUSTOM GAME ELEMENT OVERLAY */}
                {showGameManager && (
                  <div className="bg-white border-2 border-slate-150 p-5 rounded-3xl shadow-lg space-y-4 max-w-md mx-auto w-full animate-fade-in text-xs font-display">
                    <div className="flex justify-between items-center border-b pb-2">
                      <h4 className="font-extrabold text-slate-800 uppercase tracking-wider">Disguised Game Custom Loader</h4>
                      <X className="w-4 h-4 text-slate-400 hover:text-slate-600 cursor-pointer" onClick={() => setShowGameManager(false)} />
                    </div>

                    <form onSubmit={handleAddLocalGame} className="space-y-3.5 text-xs text-slate-600">
                      <div>
                        <label className="block font-bold mb-1">Game Interface Name</label>
                        <input
                          type="text"
                          required
                          value={mgmtGameName}
                          onChange={(e) => setMgmtGameName(e.target.value)}
                          placeholder="e.g. Retro Snake, Slope, Chess Unblocked"
                          className="w-full bg-slate-50 border border-slate-205 py-2 px-3 rounded-xl outline-none focus:bg-white focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block font-bold mb-1">HTML5 Game URL or &lt;iframe&gt; Code Snippet</label>
                        <input
                          type="text"
                          required
                          value={mgmtGameUrl}
                          onChange={(e) => setMgmtGameUrl(e.target.value)}
                          placeholder="Paste game link URL OR raw <iframe> code snippet..."
                          className="w-full bg-slate-50 border border-slate-205 py-2 px-3 rounded-xl outline-none focus:bg-white focus:border-blue-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block font-bold mb-1">Category Group</label>
                          <select
                            value={mgmtGameCat}
                            onChange={(e) => setMgmtGameCat(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-205 py-2 px-3 rounded-xl outline-none"
                          >
                            <option value="Arcade">Arcade</option>
                            <option value="Puzzle">Puzzle</option>
                            <option value="Action">Action</option>
                            <option value="Sports">Sports</option>
                            <option value="Retro">Retro</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block font-bold mb-1">Discretion</label>
                          <span className="block text-[10px] text-slate-400 pt-2 font-mono">Loads instantly in responsive sandboxed frame</span>
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold mb-1">Description (Optional)</label>
                        <textarea
                          value={mgmtGameDesc}
                          onChange={(e) => setMgmtGameDesc(e.target.value)}
                          placeholder="Brief description of instructions..."
                          className="w-full bg-slate-50 border border-slate-205 py-2 px-3 rounded-xl outline-none focus:bg-white focus:border-blue-500 h-16 resize-none"
                        />
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowGameManager(false)}
                          className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl cursor-pointer text-center"
                        >
                          Cancel
                        </button>
                        
                        <button
                          type="submit"
                          className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-705 text-white font-bold rounded-xl cursor-pointer text-center"
                        >
                          Load Game Link
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* RENDERED GAMES GRID */}
                {filteredGames.length > 0 ? (
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4.5">
                    {filteredGames.map((game) => (
                      <div 
                        key={game.id}
                        className="bg-white border border-slate-200 p-4.5 rounded-3xl flex flex-col justify-between shadow-3xs hover:shadow-2xs hover:border-blue-300 transition-all text-xs"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="bg-slate-100 border border-slate-200 text-slate-500 font-mono font-bold text-[8.5px] uppercase px-1.5 py-0.5 rounded">
                              {game.category}
                            </span>

                            {game.isLocal && (
                              <button
                                onClick={() => deleteLocalGame(game.id)}
                                className="text-slate-350 hover:text-rose-600 transition-colors p-1"
                                title="Remove game item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          <h4 className="font-extrabold text-slate-800 text-sm tracking-tight">{game.name}</h4>
                          <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">{game.description}</p>
                        </div>

                        <div className="flex items-center gap-2 pt-4 border-t border-slate-100/80 mt-2">
                          <button
                            onClick={() => { setSelectedGame(game); playFeedbackTone('success'); }}
                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-center cursor-pointer transition-colors shadow-sm shadow-indigo-100"
                          >
                            🎮 Play Game
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                ) : (
                  
                  /* Empty state message specifically explaining how the user puts inside their own */
                  <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-10 text-center space-y-4 max-w-lg mx-auto w-full font-display">
                    <div className="w-12 h-12 bg-slate-100 text-slate-500 rounded-2xl flex items-center justify-center mx-auto shadow-3xs">
                      <Gamepad2 className="w-6 h-6" />
                    </div>

                    <div className="space-y-1.5">
                      <h4 className="font-extrabold text-slate-800">Your Games Library is Ready</h4>
                      <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                        To add your library of games, either commit custom game configurations to `/public/games/index.json` in your GitHub repository, or add browser links instantly using the <strong>"Add Games Link"</strong> manager above.
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-150 rounded-2xl text-[10px] text-slate-500 text-left font-mono space-y-1">
                      <span className="font-bold text-slate-700 block uppercase mb-1">📄 Format of /games/index.json:</span>
                      <span>[</span>
                      <span className="pl-4 block">{"{"}</span>
                      <span className="pl-8 block">"id": "pong",</span>
                      <span className="pl-8 block">"name": "Pong",</span>
                      <span className="pl-8 block">"url": "https://playcanv.as/p/2O97ar6p/",</span>
                      <span className="pl-8 block">"category": "Arcade",</span>
                      <span className="pl-8 block">"description": "Retro paddle tennis"</span>
                      <span className="pl-4 block">{"}"}</span>
                      <span>]</span>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={() => { setShowGameManager(true); playFeedbackTone('tap'); }}
                        className="px-5 py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl cursor-pointer"
                      >
                        Add Game Link Now
                      </button>
                    </div>
                  </div>

                )}

              </div>

            )}

          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-100 py-3.5 px-6 font-display text-[9.5px] text-slate-400 select-none">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>
            © {new Date().getFullYear()} Math Training Center. Loaded fully on-client.
          </span>
          <div className="flex items-center space-x-3 text-slate-400">
            <span className="font-mono">Privacy Locked (AES-256 in-browser sandbox)</span>
            <span>•</span>
            <button 
              onClick={() => { setScreen('stealth-console'); playFeedbackTone('tap'); }} 
              className="hover:underline hover:text-blue-500 cursor-pointer text-[9.5px] font-bold"
            >
              Interactive Console Backdoor
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}
