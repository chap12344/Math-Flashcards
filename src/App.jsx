/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  RotateCcw, 
  Maximize2, 
  Plus, 
  X, 
  BookOpen, 
  FileText, 
  Laptop, 
  ChevronRight, 
  Trash2,
  EyeOff
} from 'lucide-react';

const CLOAK_PRESETS = [
  {
    id: 'gdocs',
    name: 'Google Docs',
    title: 'Semester Study Notes - Google Docs',
    favicon: 'https://ssl.gstatic.com/docs/documents/images/kix-favicon-7.ico',
    iconSrc: '📄'
  },
  {
    id: 'classroom',
    name: 'Google Classroom',
    title: 'Google Classroom',
    favicon: 'https://ssl.gstatic.com/onebox/media/classroom/classroom_favicon_v2.ico',
    iconSrc: '🏫'
  },
  {
    id: 'canvas',
    name: 'Canvas LMS Dashboard',
    title: 'Dashboard - Canvas LMS',
    favicon: 'https://du11hjcvx0uqb.cloudfront.net/dist/images/favicon-e05d21095a.ico',
    iconSrc: '🎨'
  },
  {
    id: 'calculator',
    name: 'Graphing Practice',
    title: 'Scientific Calculator v4.02',
    favicon: 'https://www.google.com/images/branding/product/ico/calculator_logo_32dp.png',
    iconSrc: '🧮'
  }
];

export default function App() {
  // Navigation & Data
  const [games, setGames] = useState([]);
  const [selectedGameId, setSelectedGameId] = useState(null);
  const [selectedGameData, setSelectedGameData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('All Games');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Custom Game Creation
  const [showAddModal, setShowAddModal] = useState(false);
  const [newGameTitle, setNewGameTitle] = useState('');
  const [newGameDesc, setNewGameDesc] = useState('');
  const [newGameCat, setNewGameCat] = useState('Classic');
  const [newGameCode, setNewGameCode] = useState('');
  const [newGameUseBlank, setNewGameUseBlank] = useState(true);

  // Evasion Frame Options
  const [forceBlankMathMode, setForceBlankMathMode] = useState(true);
  const [iframeKey, setIframeKey] = useState(0); 
  const [isFullscreen, setIsFullscreen] = useState(false);

  // School Cover / Cloaking system
  const [isCloaked, setIsCloaked] = useState(false);
  const [selectedCloak, setSelectedCloak] = useState(CLOAK_PRESETS[0]);
  const [showCloakMenu, setShowCloakMenu] = useState(false);
  
  // Simulated school notes
  const [schoolNotes, setSchoolNotes] = useState(() => {
    return localStorage.getItem('school_notes') || 
      "Algebra 2 - Semester Examination Study Log\n" +
      "============================================\n\n" +
      "1. Quadratic Equations:\n" +
      "   Standard Form formula: ax^2 + bx + c = 0\n" +
      "   Quadratic formula: x = [-b \u00B1 \u221A(b^2 - 4ac)] / 2a\n" +
      "   Note: Discriminant D = b^2 - 4ac determines the type of roots.\n" +
      "   - If D > 0, roots are real and distinct.\n" +
      "   - If D = 0, root is real and repeated.\n" +
      "   - If D < 0, roots are complex conjugates.\n\n" +
      "2. Exponential Growth & Decay:\n" +
      "   y = a(1 + r)^t or y = ae^(kt)\n" +
      "   Remember: constant rate calculations must match units of compounding semesters.\n\n" +
      "3. Scratch notes:\n" +
      "   - Complete homework question #14 to #22 by Monday.\n" +
      "   - Review logarithms base transform theorem.";
  });

  const [calcDisplay, setCalcDisplay] = useState('0');
  const [calcMemory, setCalcMemory] = useState('');
  const [calcOperation, setCalcOperation] = useState('');
  const [calcResetOnNextInput, setCalcResetOnNextInput] = useState(false);

  // Read initial games list on load
  useEffect(() => {
    const fetchGames = async () => {
      try {
        const res = await fetch('games/index.json');
        const data = await res.json();
        
        // Grab custom built locally stored games
        const localGamesRaw = localStorage.getItem('unblocked_custom_games');
        if (localGamesRaw) {
          const localGames = JSON.parse(localGamesRaw);
          setGames([...data, ...localGames]);
        } else {
          setGames(data);
        }
      } catch (err) {
        console.error("Failed loading unblocked games directory:", err);
      }
    };
    fetchGames();
  }, [showAddModal]);

  // Handle Tab title and Icon Cloaking side effects
  useEffect(() => {
    let originalTitle = "Unblocked Games";
    let originalFavicon = "favicon.ico";

    const updateMetadata = () => {
      if (isCloaked) {
        document.title = selectedCloak.title;
        let link = document.querySelector("link[rel~='icon']");
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.getElementsByTagName('head')[0].appendChild(link);
        }
        link.href = selectedCloak.favicon;
      } else {
        document.title = originalTitle;
        let link = document.querySelector("link[rel~='icon']");
        if (link) {
          link.href = originalFavicon;
        }
      }
    };

    updateMetadata();

    return () => {
      document.title = originalTitle;
    };
  }, [isCloaked, selectedCloak]);

  // Escape key global panic trigger
  useEffect(() => {
    const handleGlobalPanic = (e) => {
      if (e.key === 'Escape') {
        setIsCloaked(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalPanic);
    return () => window.removeEventListener('keydown', handleGlobalPanic);
  }, []);

  const handleNotesChange = (text) => {
    setSchoolNotes(text);
    localStorage.setItem('school_notes', text);
  };

  const handleSelectGame = async (gameId) => {
    setIsLoading(true);
    setSelectedGameId(gameId);
    
    const localStoreGamesRaw = localStorage.getItem('unblocked_custom_games_detailed');
    let localFound = null;
    if (localStoreGamesRaw) {
      const storageDetails = JSON.parse(localStoreGamesRaw);
      localFound = storageDetails.find(g => g.id === gameId);
    }

    if (localFound) {
      setSelectedGameData(localFound);
      setForceBlankMathMode(localFound.useBlankMath);
      setIsLoading(false);
    } else {
      try {
        const res = await fetch(`games/${gameId}.json`);
        const item = await res.json();
        setSelectedGameData(item);
        setForceBlankMathMode(item.useBlankMath);
        setIsLoading(false);
      } catch (err) {
        console.error("Failed fetching self-contained game file:", err);
        setIsLoading(false);
        setSelectedGameId(null);
      }
    }
  };

  const writeIframeContent = (iframeRef) => {
    if (!iframeRef || !selectedGameData) return;
    try {
      const doc = iframeRef.contentDocument || iframeRef.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(selectedGameData.html);
        doc.close();
      }
    } catch (err) {
      console.error("Evasion frame writes forbidden by system boundaries:", err);
    }
  };

  const handleAddCustomGame = () => {
    if (!newGameTitle || !newGameCode) return;
    const cleanId = 'custom-' + Date.now();
    const newMeta = {
      id: cleanId,
      title: newGameTitle,
      description: newGameDesc || "Self-crafted custom sandbox game injected into unblocked library.",
      category: "Custom",
      icon: "Gamepad",
      useBlankMath: newGameUseBlank,
      iframeUrl: "about:blank"
    };

    const newDetailed = {
      ...newMeta,
      html: newGameCode
    };

    const existingListRaw = localStorage.getItem('unblocked_custom_games') || '[]';
    const list = JSON.parse(existingListRaw);
    list.push(newMeta);
    localStorage.setItem('unblocked_custom_games', JSON.stringify(list));

    const existingDetailedRaw = localStorage.getItem('unblocked_custom_games_detailed') || '[]';
    const detailedList = JSON.parse(existingDetailedRaw);
    detailedList.push(newDetailed);
    localStorage.setItem('unblocked_custom_games_detailed', JSON.stringify(detailedList));

    setNewGameTitle('');
    setNewGameDesc('');
    setNewGameCode('');
    setNewGameCat('Classic');
    setShowAddModal(false);
  };

  const handleDeleteCustomGame = (gameId, e) => {
    e.stopPropagation();
    
    const existingListRaw = localStorage.getItem('unblocked_custom_games') || '[]';
    const list = JSON.parse(existingListRaw);
    const filteredList = list.filter(g => g.id !== gameId);
    localStorage.setItem('unblocked_custom_games', JSON.stringify(filteredList));

    const existingDetailedRaw = localStorage.getItem('unblocked_custom_games_detailed') || '[]';
    const detailedList = JSON.parse(existingDetailedRaw);
    const filteredDetailedList = detailedList.filter(g => g.id !== gameId);
    localStorage.setItem('unblocked_custom_games_detailed', JSON.stringify(filteredDetailedList));

    const freshGames = games.filter(g => g.id !== gameId);
    setGames(freshGames);

    if (selectedGameId === gameId) {
      setSelectedGameId(null);
      setSelectedGameData(null);
    }
  };

  const handleCalcBtn = (val) => {
    playTone(350, 0.05);
    if (val === 'C') {
      setCalcDisplay('0');
      setCalcMemory('');
      setCalcOperation('');
    } else if (val === '=') {
      if (!calcMemory || !calcOperation) return;
      const num1 = parseFloat(calcMemory);
      const num2 = parseFloat(calcDisplay);
      let res = 0;
      switch (calcOperation) {
        case '+': res = num1 + num2; break;
        case '-': res = num1 - num2; break;
        case '*': res = num1 * num2; break;
        case '/': res = num2 !== 0 ? num1 / num2 : 0; break;
        case '^': res = Math.pow(num1, num2); break;
      }
      setCalcDisplay(String(Number(res.toFixed(10))));
      setCalcMemory('');
      setCalcOperation('');
      setCalcResetOnNextInput(true);
    } else if (['+', '-', '*', '/', '^'].includes(val)) {
      setCalcMemory(calcDisplay);
      setCalcOperation(val);
      setCalcResetOnNextInput(true);
    } else if (['sin', 'cos', 'tan', 'sqrt', 'log'].includes(val)) {
      const num = parseFloat(calcDisplay);
      let res = 0;
      if (val === 'sin') res = Math.sin(num);
      else if (val === 'cos') res = Math.cos(num);
      else if (val === 'tan') res = Math.tan(num);
      else if (val === 'sqrt') res = num >= 0 ? Math.sqrt(num) : 0;
      else if (val === 'log') res = num > 0 ? Math.log10(num) : 0;
      setCalcDisplay(String(Number(res.toFixed(8))));
      setCalcResetOnNextInput(true);
    } else if (val === 'pi') {
      setCalcDisplay(String(Math.PI));
      setCalcResetOnNextInput(true);
    } else {
      if (calcResetOnNextInput) {
        setCalcDisplay(val);
        setCalcResetOnNextInput(false);
      } else {
        setCalcDisplay(prev => prev === '0' ? val : prev + val);
      }
    }
  };

  const playTone = (freq, dur) => {
    try {
      const ac = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.frequency.setValueAtTime(freq, ac.currentTime);
      gain.gain.setValueAtTime(0.04, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
      osc.start();
      osc.stop(ac.currentTime + dur);
    } catch (e) {}
  };

  const filteredGames = games.filter(g => {
    const matchesSearch = g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          g.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All Games' || g.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getEmojiForIcon = (iconName) => {
    switch (iconName) {
      case 'Snake': return '🐍';
      case 'Gamepad2': return '🎮';
      case 'Box': return '🧱';
      case 'Bird': return '🐦';
      case 'Calculator': return '🧮';
      default: return '🎮';
    }
  };

  return (
    <div id="app-root" className="min-h-screen bg-[#070b13] text-[#f1f5f9] font-sans antialiased overflow-x-hidden flex flex-col selection:bg-purple-600 selection:text-white">
      
      {/* CLOAK LAYER */}
      {isCloaked && (
        <div id="cloak-overlay" className="fixed inset-0 z-[99999] bg-[#f8f9fa] text-[#202124] flex flex-col overflow-hidden animate-fade-in select-text">
          
          {/* TOP DOCS HEADER */}
          {selectedCloak.id === 'gdocs' && (
            <div id="gdocs-shell" className="w-full flex flex-col h-full">
              <div className="bg-[#f8f9fa] border-b border-[#dadce0] px-3 py-1 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-blue-600 text-2xl font-semibold"><FileText className="w-8 h-8 inline text-[#2684fc]" /></span>
                    <div className="flex flex-col">
                      <div className="flex items-center space-x-2">
                        <input 
                          type="text" 
                          value={selectedCloak.title.split(' - ')[0]} 
                          className="font-medium text-[16px] text-[#202124] bg-transparent border-0 outline-none w-52 focus:bg-white focus:border px-1 rounded"
                          onChange={() => {}}
                        />
                        <span className="text-[#5f6368] text-xs">Starred</span>
                      </div>
                      <div className="flex space-x-3 text-xs text-[#5f6368] font-medium py-0.5">
                        <span className="cursor-pointer hover:bg-gray-200 px-1 rounded py-0.5">File</span>
                        <span className="cursor-pointer hover:bg-gray-200 px-1 rounded py-0.5">Edit</span>
                        <span className="cursor-pointer hover:bg-gray-200 px-1 rounded py-0.5">View</span>
                        <span className="cursor-pointer hover:bg-gray-200 px-1 rounded py-0.5">Insert</span>
                        <span className="cursor-pointer hover:bg-gray-200 px-1 rounded py-0.5">Format</span>
                        <span className="cursor-pointer hover:bg-gray-200 px-1 rounded py-0.5">Tools</span>
                        <span className="cursor-pointer hover:bg-gray-200 px-1 rounded py-0.5">Extensions</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <span className="text-[11px] text-[#64748b] bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-full font-mono animate-pulse">
                      SCHOOL DEFENSE ENFORCED • PRESS ESC TO PLAY
                    </span>
                    <button 
                      onClick={() => setIsCloaked(false)}
                      className="bg-[#c2e7ff] text-[#001d35] hover:bg-[#b0dbf7] font-semibold text-xs px-4 py-2 rounded-full cursor-pointer transition-colors"
                    >
                      Return to Games
                    </button>
                  </div>
                </div>
              </div>
              
              {/* EDITOR SECTION */}
              <div className="flex-1 bg-[#f0f3f6] p-4 flex justify-center overflow-y-auto">
                <div className="w-[812px] min-h-[1056px] bg-white border border-[#dadce0] shadow-sm p-16 flex flex-col">
                  <textarea 
                    value={schoolNotes}
                    onChange={(e) => handleNotesChange(e.target.value)}
                    className="w-full h-full text-base font-serif leading-relaxed text-[#202124] border-0 outline-none resize-none align-baseline bg-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {/* CLASSROOM TEMPLATE */}
          {selectedCloak.id === 'classroom' && (
            <div id="classroom-shell" className="w-full h-full bg-[#f8f9fa] flex flex-col">
              <div className="bg-white border-b border-[#dadce0] h-14 flex items-center justify-between px-6 shadow-sm">
                <div className="flex items-center space-x-3">
                  <span className="text-[#137333] font-bold text-lg">🏫 Google Classroom</span>
                  <div className="h-6 w-[1px] bg-gray-300"></div>
                  <nav className="flex space-x-4 text-xs font-medium text-gray-600">
                    <span className="text-[#137333] border-b-2 border-[#137333] px-2 py-4 cursor-pointer">Stream</span>
                    <span className="hover:text-[#137333] px-2 py-4 cursor-pointer">Classwork</span>
                    <span className="hover:text-[#137333] px-2 py-4 cursor-pointer">People</span>
                    <span className="hover:text-[#137333] px-2 py-4 cursor-pointer">Grades</span>
                  </nav>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-xs bg-green-50 text-green-700 font-mono px-3 py-1 border border-green-200 rounded">
                    Cloaked Safe Mode Active
                  </span>
                  <button 
                    onClick={() => setIsCloaked(false)}
                    className="bg-[#137333] text-white font-medium text-xs px-4 py-1.5 rounded-md hover:bg-[#0f602b] transition-colors"
                  >
                    Quick Resume (ESC)
                  </button>
                </div>
              </div>

              <div className="flex-1 max-w-4xl w-full mx-auto p-6 overflow-y-auto">
                <div className="bg-[#1967d2] text-white p-8 rounded-lg mb-6 shadow-sm relative overflow-hidden">
                  <h1 className="text-3xl font-bold font-sans">AP Calculus BC</h1>
                  <p className="text-sm text-blue-100 mt-1">Section 4 — Fall Term 2026</p>
                  <div className="absolute right-4 bottom-4 text-3xl opacity-30">📐🧪</div>
                </div>

                <div className="grid grid-cols-4 gap-6">
                  <div className="col-span-1 bg-white border border-gray-200 rounded-lg p-4 h-fit">
                    <h3 className="text-xs font-bold text-gray-500 uppercase">Upcoming Events</h3>
                    <p className="text-xs text-gray-700 mt-2">Woohoo, no work due soon!</p>
                    <span className="text-xs text-blue-600 cursor-pointer hover:underline mt-4 block">View All</span>
                  </div>

                  <div className="col-span-3 space-y-4">
                    <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center space-x-3 cursor-text hover:border-blue-300">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold">T</div>
                      <input 
                        type="text" 
                        placeholder="Announce something to your class..." 
                        className="text-xs text-gray-500 border-none outline-none w-full bg-transparent"
                        readOnly
                      />
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-5">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-9 h-9 rounded-full bg-[#137333] flex items-center justify-center text-white text-xs font-bold">M</div>
                        <div>
                          <div className="text-xs font-bold text-gray-800">Mr. Matthew Fletcher</div>
                          <div className="text-[10px] text-gray-500">Posted at 8:12 AM</div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-700 leading-relaxed">
                        Good morning class. Please review chapter 7.4 of the Advanced Calculus worksheets. We will have a rapid mental training challenge on arithmetic operations today. Make sure to complete the exercises on equations below:
                      </p>
                      <div className="border border-gray-200 p-3 rounded-md mt-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer" onClick={() => setIsCloaked(false)}>
                        <div className="flex items-center space-x-3">
                          <span className="text-3xl">📝</span>
                          <div>
                            <div className="text-xs font-bold text-gray-800">Homework_Integration_By_Parts.pdf</div>
                            <div className="text-[10px] text-gray-400">PDF Document • 4.2 MB</div>
                          </div>
                        </div>
                        <span className="text-xs text-blue-600 font-semibold">Load Worksheet</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CANVAS TEMPLATE */}
          {selectedCloak.id === 'canvas' && (
            <div id="canvas-shell" className="w-full h-full bg-[#f5f5f5] flex">
              <div className="w-20 bg-[#30353c] h-full flex flex-col items-center justify-between py-6 text-white space-y-4">
                <div className="flex flex-col items-center space-y-6 w-full">
                  <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center font-bold text-lg select-none cursor-pointer">C</div>
                  <div className="text-[11px] text-red-500 font-bold flex flex-col items-center cursor-pointer">
                    <span className="text-lg">👤</span>
                    Account
                  </div>
                  <div className="text-[11px] text-red-500 font-bold flex flex-col items-center cursor-pointer">
                    <span className="text-lg">📊</span>
                    Dashboard
                  </div>
                  <div className="text-[11px] text-gray-400 flex flex-col items-center cursor-pointer hover:text-white">
                    <span className="text-lg">📚</span>
                    Courses
                  </div>
                  <div className="text-[11px] text-gray-400 flex flex-col items-center cursor-pointer hover:text-white">
                    <span className="text-lg">📅</span>
                    Calendar
                  </div>
                  <div className="text-[11px] text-gray-400 flex flex-col items-center cursor-pointer hover:text-white">
                    <span className="text-lg">📥</span>
                    Inbox
                  </div>
                </div>
                <button 
                  onClick={() => setIsCloaked(false)} 
                  className="bg-red-600 hover:bg-red-700 text-xs font-semibold py-1 px-3.5 rounded mt-4"
                >
                  Uncloak
                </button>
              </div>

              <div className="flex-1 p-8 overflow-y-auto">
                <div className="border-b border-gray-200 pb-3 flex justify-between items-center mb-6">
                  <h1 className="text-2xl font-normal text-gray-800">Canvas Dashboard</h1>
                  <span className="text-xs font-mono text-gray-500 bg-gray-200 px-3 py-1 rounded">
                    Parent Evasion Loaded • ESC to Toggle
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                    <div className="h-28 bg-[#009688]"></div>
                    <div className="p-4">
                      <h3 className="text-sm font-bold text-blue-600 hover:underline">AP Biology - 3rd Period</h3>
                      <p className="text-xs text-gray-500 mt-1">2026 Fall Semester</p>
                      <p className="text-xs text-orange-600 mt-4">⚠️ Quiz 5: Mendelian Genetics due tonight</p>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                    <div className="h-28 bg-[#3f51b5]"></div>
                    <div className="p-4">
                      <h3 className="text-sm font-bold text-blue-600 hover:underline">Pre-Calculus (A)</h3>
                      <p className="text-xs text-gray-500 mt-1">2026 Fall Semester</p>
                      <p className="text-xs text-gray-600 mt-4">✓ All assignments complete</p>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                    <div className="h-28 bg-[#e91e63]"></div>
                    <div className="p-4">
                      <h3 className="text-sm font-bold text-blue-600 hover:underline">English Literature II</h3>
                      <p className="text-xs text-gray-500 mt-1">2026 Fall Academic Session</p>
                      <p className="text-xs text-gray-600 mt-4">✓ No active assignments</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 bg-white border border-gray-200 rounded-lg p-5">
                  <h3 className="text-sm font-bold text-gray-800 mb-4">Enrolled Academic Performance</h3>
                  <div className="text-xs divide-y divide-gray-100">
                    <div className="flex justify-between py-2 text-gray-700">
                      <span>AP Biology</span>
                      <span className="font-bold text-green-700">96.5% (A)</span>
                    </div>
                    <div className="flex justify-between py-2 text-gray-700">
                      <span>Pre-Calculus (A)</span>
                      <span className="font-bold text-green-700">98.2% (A)</span>
                    </div>
                    <div className="flex justify-between py-2 text-gray-700">
                      <span>English Literature II</span>
                      <span className="font-bold text-green-700">94.0% (A)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SCIENTIFIC CALCULATOR CLOAK */}
          {selectedCloak.id === 'calculator' && (
            <div id="calculator-shell" className="w-[440px] m-auto bg-[#1e293b] border-4 border-[#334155] rounded-xl shadow-2xl overflow-hidden p-6 text-white flex flex-col space-y-4">
              <div className="flex justify-between items-center bg-[#0f172a] p-3 rounded-lg border border-[#334155]">
                <div className="text-left font-mono">
                  <div className="text-[10px] text-gray-500 h-4 uppercase">{calcMemory ? `${calcMemory} ${calcOperation}` : ''}</div>
                  <div className="text-2xl font-bold tracking-tight text-white">{calcDisplay}</div>
                </div>
                <div className="text-right">
                  <span className="text-[9px] bg-sky-950 text-sky-400 border border-sky-800 px-2.5 py-1 rounded font-bold uppercase animate-pulse">
                    Maths Cover Mode
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {['sin', 'cos', 'tan', 'sqrt', 'log'].map(op => (
                  <button 
                    key={op} 
                    onClick={() => handleCalcBtn(op)}
                    className="bg-[#334155] text-xs font-bold font-mono py-2.5 rounded hover:bg-[#475569] active:scale-95 transition-all text-sky-400"
                  >
                    {op}
                  </button>
                ))}
                {['^', 'pi', 'C', '(', ')'].map(op => (
                  <button 
                    key={op} 
                    onClick={() => handleCalcBtn(op)} 
                    className="bg-[#334155] text-slate-300 py-2.5 text-xs font-bold font-mono rounded hover:bg-[#475569] active:scale-95 transition-all"
                  >
                    {op}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-4 gap-2">
                {['7', '8', '9', '/'].map(op => (
                  <button 
                    key={op} 
                    onClick={() => handleCalcBtn(op)} 
                    className={`py-3 rounded font-mono font-bold hover:opacity-90 active:scale-95 transition-all ${op === '/' ? 'bg-indigo-600 text-white' : 'bg-slate-700'}`}
                  >
                    {op}
                  </button>
                ))}
                {['4', '5', '6', '*'].map(op => (
                  <button 
                    key={op} 
                    onClick={() => handleCalcBtn(op)} 
                    className={`py-3 rounded font-mono font-bold hover:opacity-90 active:scale-95 transition-all ${op === '*' ? 'bg-indigo-600 text-white' : 'bg-slate-700'}`}
                  >
                    {op}
                  </button>
                ))}
                {['1', '2', '3', '-'].map(op => (
                  <button 
                    key={op} 
                    onClick={() => handleCalcBtn(op)} 
                    className={`py-3 rounded font-mono font-bold hover:opacity-90 active:scale-95 transition-all ${op === '-' ? 'bg-indigo-600 text-white' : 'bg-slate-700'}`}
                  >
                    {op}
                  </button>
                ))}
                {['0', '.', '=', '+'].map(op => (
                  <button 
                    key={op} 
                    onClick={() => handleCalcBtn(op)} 
                    className={`py-3 rounded font-mono font-bold hover:opacity-90 active:scale-95 transition-all ${op === '=' ? 'bg-[#10b981] text-sky-950' : op === '+' ? 'bg-indigo-600 text-white' : 'bg-slate-700'}`}
                  >
                    {op}
                  </button>
                ))}
              </div>

              <div className="pt-2 text-center">
                <p className="text-[10px] text-gray-500">Fully functional scientific computations.</p>
                <button 
                  onClick={() => setIsCloaked(false)} 
                  className="mt-3 bg-[#e2e8f0] text-[#0f172a] text-xs font-semibold py-1.5 px-6 rounded-lg hover:bg-white transition-colors"
                >
                  Return to Active Tab
                </button>
              </div>
            </div>
          )}

        </div>
      )}

      {/* HEADER SECTION */}
      <header id="classic-header" className="sticky top-0 z-40 bg-[#090e1a]/95 backdrop-blur-md border-b border-slate-900/60 shadow-xl py-3.5 px-6">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => { setSelectedGameId(null); setSelectedGameData(null); }}>
            <span className="text-3xl">🎮</span>
            <div>
              <h1 className="text-xl font-bold tracking-wider bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent uppercase">
                Unblocked Hub
              </h1>
              <p className="text-[10px] tracking-widest text-[#64748b] font-mono">
                SECURE SANDBOXED ENVIRONMENT
              </p>
            </div>
          </div>

          {/* Quick Filters / Controls */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            
            {/* School Cover Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setShowCloakMenu(!showCloakMenu)}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-[#a0aec0] px-3.5 py-2 rounded-lg flex items-center space-x-1.5 cursor-pointer transition-all active:scale-95 focus:outline-none"
              >
                <span>{selectedCloak.iconSrc}</span>
                <span>Cloak: <b>{selectedCloak.name}</b></span>
              </button>
              
              {showCloakMenu && (
                <div className="absolute right-0 mt-2.5 w-56 bg-[#0f172a] border border-slate-800 rounded-xl shadow-2xl py-1.5 z-50 text-left">
                  <div className="px-3 py-1 border-b border-slate-800 mb-1">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Tab Hider Presets</span>
                  </div>
                  {CLOAK_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => {
                        setSelectedCloak(preset);
                        setShowCloakMenu(false);
                      }}
                      className={`w-full flex items-center space-x-2.5 px-3 py-2 text-xs hover:bg-slate-900 transition-colors text-left ${selectedCloak.id === preset.id ? 'text-cyan-400 bg-slate-900/50' : 'text-slate-300'}`}
                    >
                      <span className="text-md">{preset.iconSrc}</span>
                      <span className="font-medium">{preset.name}</span>
                    </button>
                  ))}
                  <div className="px-3 pt-1 border-t border-slate-800 mt-1.5">
                    <p className="text-[9px] text-slate-500 leading-tight">Selecting a cloak modifies the browser tab title and favicon, rendering interactive simulations if cloaked.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Panic Button */}
            <button 
              onClick={() => {
                setIsCloaked(true);
                playTone(200, 0.1);
              }}
              title="Instantly swap the tab into a safe study sheet or doc! Or hit ESC key anytime."
              className="bg-red-950/40 hover:bg-red-900/50 border border-red-800/80 text-red-400 font-semibold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 hover:shadow-lg hover:shadow-red-950/10 cursor-pointer transition-all active:scale-95"
            >
              <EyeOff className="w-3.5 h-3.5 text-red-400" />
              <span>Panic Button (ESC)</span>
            </button>

            {/* Add Custom Game Button */}
            <button 
              onClick={() => {
                setShowAddModal(true);
                playTone(400, 0.05);
              }}
              className="bg-purple-950/20 hover:bg-purple-900/30 border border-purple-800 text-purple-300 font-semibold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition-all cursor-pointer hover:shadow-md hover:shadow-purple-950/10 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Import Custom Game</span>
            </button>

          </div>

        </div>
      </header>

      {/* ACTION BLOCK / MAIN BODY GRID */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-6 flex flex-col items-stretch">
        
        {selectedGameId && selectedGameData ? (
          
          /* ACTIVE GAME PLAYER SCREEN VIEW */
          <div id="active-game-viewport" className="flex flex-col h-full space-y-4 animate-fade-in flex-1">
            
            {/* Control Strip & Info bar */}
            <div className="bg-[#0f172a] rounded-2xl border border-slate-900 px-5 py-3 flex flex-wrap items-center justify-between gap-4 shadow-xl">
              
              {/* Back to library & Title */}
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => {
                    setSelectedGameId(null);
                    setSelectedGameData(null);
                    playTone(250, 0.05);
                  }}
                  className="bg-slate-900 hover:bg-slate-800 hover:text-white border border-slate-800 rounded-xl px-3.5 py-2 text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
                >
                  ← Back to Library
                </button>
                <div className="h-6 w-[1px] bg-slate-800 hidden sm:block"></div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">{getEmojiForIcon(selectedGameData.icon)}</span>
                    <h2 className="font-bold text-md text-white tracking-wide">{selectedGameData.title}</h2>
                    <span className="text-[9px] font-mono text-purple-400 font-bold bg-purple-950/60 border border-purple-900 px-2 py-0.5 rounded uppercase">
                      {selectedGameData.category}
                    </span>
                  </div>
                </div>
              </div>

              {/* Utility togglers */}
              <div className="flex flex-wrap items-center gap-3">
                
                {/* Clone Filter evasion switcher */}
                <div className="flex items-center space-x-2 p-1.5 bg-slate-950 rounded-lg border border-slate-900 text-xs">
                  <span className="text-[#64748b] pl-1 font-mono">Cloaked URLs Mode:</span>
                  <button 
                    onClick={() => {
                      setForceBlankMathMode(!forceBlankMathMode);
                      setIframeKey(k => k + 1);
                      playTone(400, 0.05);
                    }}
                    title="Forces the iframe URL to load under clean school metadata tags to avoid inspection filters."
                    className={`px-3 py-1 rounded font-semibold text-[10px] uppercase font-mono transition-colors ${forceBlankMathMode ? 'bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30' : 'bg-slate-800 text-slate-400'}`}
                  >
                    {forceBlankMathMode ? 'about:blank#math' : 'standard'}
                  </button>
                </div>

                {/* Reload frame */}
                <button 
                  onClick={() => {
                    setIframeKey(k => k + 1);
                    playTone(300, 0.05);
                  }}
                  title="Reload current game session"
                  className="bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 cursor-pointer hover:text-white transition-all text-xs flex items-center space-x-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Reset Game</span>
                </button>

                {/* Fullscreen toggle */}
                <button 
                  onClick={() => {
                    setIsFullscreen(!isFullscreen);
                    playTone(450, 0.05);
                  }}
                  title="Expand to Fullscreen View"
                  className="bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 cursor-pointer hover:text-white transition-all text-xs flex items-center space-x-1"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{isFullscreen ? 'Exit Portal' : 'Theatre Portal'}</span>
                </button>

              </div>

            </div>

            {/* Frame Body Sandbox */}
            <div className={`grid grid-cols-1 ${isFullscreen ? '' : 'lg:grid-cols-4'} gap-6 flex-1 h-[60vh] min-h-[480px]`}>
              
              {/* IFRAME FRAME VIEWPORT CONTAINER */}
              <div className={`${isFullscreen ? 'lg:col-span-4' : 'lg:col-span-3'} bg-[#020617] rounded-3xl border border-slate-900 p-2 overflow-hidden flex flex-col shadow-2xl relative transition-all`}>
                
                {isLoading ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#020617] text-slate-500 z-10 font-mono">
                    <span className="text-3xl animate-spin py-2">🎮</span>
                    <span>Compiling game specifications...</span>
                  </div>
                ) : null}

                {/* Cloak/Sandbox Address display */}
                <div className="px-4 py-1.5 bg-[#090d16] border-b border-slate-900 rounded-t-2xl flex items-center justify-between text-left">
                  <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-500">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                    <span>Address Frame:</span>
                    <span className="text-cyan-400 font-semibold underline">
                      {forceBlankMathMode ? 'about:blank#math' : 'standard-sandbox-content'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-600 font-mono cursor-help" title="Standard schools block index domains. We utilize about:blank#math inside nested iframes which overrides search histories.">
                    🛡️ why is this unblocked?
                  </span>
                </div>

                {/* Secure Sandbox Frame Node */}
                <div className="flex-1 bg-black rounded-b-2xl overflow-hidden relative" id="sandbox-iframe-parent">
                  <iframe
                    key={`${selectedGameId}-${iframeKey}-${forceBlankMathMode}`}
                    title={selectedGameData.title}
                    src={forceBlankMathMode ? "about:blank#math" : undefined}
                    srcDoc={forceBlankMathMode ? undefined : selectedGameData.html}
                    onLoad={(e) => {
                      if (forceBlankMathMode) {
                        writeIframeContent(e.currentTarget);
                      }
                    }}
                    className="w-full h-full border-none outline-none absolute inset-0 bg-transparent"
                    sandbox="allow-scripts allow-same-origin allow-forms"
                  />
                </div>

              </div>

              {/* SIDE ALGEBRA SCRATCHPAD AND MATH CHEATSHEET */}
              {!isFullscreen && (
                <div className="col-span-1 flex flex-col gap-4 animate-fade-in">
                  
                  {/* Notes panel */}
                  <div className="bg-[#0f172a] rounded-2xl border border-slate-900 p-4 shadow-xl flex flex-col flex-1 min-h-[220px]">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-2 px-1">
                      <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300">
                        <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                        <span>Algebra Study Notes</span>
                      </div>
                      <span className="text-[9px] text-[#64748b] bg-slate-950 border border-slate-800 px-2 py-0.5 rounded font-mono">
                        Auto-Saves
                      </span>
                    </div>
                    <textarea
                      value={schoolNotes}
                      onChange={(e) => handleNotesChange(e.target.value)}
                      placeholder="Type formulas, notes, or classroom homework logs in school-friendly format..."
                      className="w-full flex-1 bg-slate-950 border border-slate-900 text-xs text-slate-400 p-2.5 rounded-xl outline-none resize-none font-mono focus:border-cyan-500/50"
                    />
                  </div>

                  {/* Arithmetic calculator helper widget */}
                  <div className="bg-[#0f172a] rounded-2xl border border-slate-900 p-4 shadow-xl flex flex-col">
                    <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300 border-b border-slate-800 pb-2.5 mb-2 px-1">
                      <Laptop className="w-3.5 h-3.5 text-purple-400" />
                      <span>Classroom Utilities</span>
                    </div>
                    <p className="text-[10px] text-[#64748b] leading-relaxed mb-3">
                      Hit the <b>Escape key</b> immediately if a supervisor approaches. It instantly exchanges your screen to represent complete education worksheets.
                    </p>
                    <button
                      onClick={() => {
                        setIsCloaked(true);
                        setSelectedCloak(CLOAK_PRESETS[3]); 
                      }}
                      className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold py-2 rounded-xl transition-all cursor-pointer hover:text-white"
                    >
                      Open Float Calculator Overlay
                    </button>
                  </div>

                </div>
              )}

            </div>

          </div>

        ) : (
          
          /* GAMES CATALOG HUB STAGE */
          <div id="catalog-stage" className="flex flex-col space-y-6 flex-1">
            
            {/* HERO PROMOTIONAL BLOCK */}
            <div className="relative rounded-3xl bg-gradient-to-br from-[#121c33] via-[#0e1627] to-[#070b13] border border-slate-900 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute bottom-0 left-10 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="max-w-xl text-center md:text-left z-10">
                <span className="text-[10px] font-mono tracking-widest text-[#a855f7] bg-purple-950/40 border border-purple-900 px-3 py-1 rounded-full font-bold uppercase">
                  ✓ NO FLASH REQUIRED • HTML5 RETRO
                </span>
                <h2 className="text-2xl md:text-3xl font-extrabold text-white mt-3.5 tracking-tight leading-tight">
                  YOUR UNBLOCKED DESKTOP COMPANION
                </h2>
                <p className="text-xs md:text-sm text-slate-400 mt-2.5 leading-relaxed">
                  Fast browser-based performance, completely custom canvas builds. Integrated with dynamic educational tab-cloaks, ensuring safe loading backgrounds.
                </p>
                <div className="flex flex-wrap gap-2.5 mt-5 justify-center md:justify-start">
                  <span className="text-[10px] bg-slate-900 border border-slate-800 text-[#a0aec0] px-3 py-1.5 rounded-xl font-mono">
                    💡 Press <b>ESC</b> instantly to Panic-Hide!
                  </span>
                  <span className="text-[10px] bg-slate-900 border border-slate-800 text-[#a0aec0] px-3 py-1.5 rounded-xl font-mono">
                    🛡️ Loaded in <b>about:blank#math</b> frames
                  </span>
                </div>
              </div>

              <div className="hidden lg:block relative text-7xl select-none animate-bounce duration-[4000ms] p-4 bg-slate-800/10 border border-slate-800/20 rounded-2xl">
                🎮
              </div>
            </div>

            {/* FILTERS AND SEARCH TRAY */}
            <div className="flex flex-col md:flex-row items-stretch justify-between gap-3 bg-[#0f172a]/60 border border-slate-900/40 px-5 py-4 rounded-2xl shadow-xl">
              
              {/* Category buttons tab bar */}
              <div className="flex flex-wrap items-center gap-1.5 order-2 md:order-1">
                {['All Games', 'Classic', 'Arcade', 'Action', 'Math', 'Custom'].map((cat) => {
                  const isActive = categoryFilter === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => {
                        setCategoryFilter(cat);
                        playTone(300 + (cat.charCodeAt(0) % 5) * 50, 0.05);
                      }}
                      className={`text-xs px-3.5 py-1.5 rounded-xl font-semibold transition-all duration-150 cursor-pointer active:scale-95 ${
                        isActive 
                          ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-md shadow-purple-950/50' 
                          : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>

              {/* Search textbox */}
              <div className="relative w-full md:w-72 order-1 md:order-2 flex items-center bg-slate-950 rounded-xl border border-slate-900 px-3 py-2 text-slate-400 focus-within:border-cyan-500/50 group">
                <Search className="w-4 h-4 text-slate-500 mr-2 group-focus-within:text-cyan-400 transition-colors" />
                <input
                  type="text"
                  placeholder="Search retro library..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-0 outline-none text-xs text-[#f1f5f9] placeholder-slate-600 w-full"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-slate-600 hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

            </div>

            {/* CATALOG CARDS GRID */}
            {filteredGames.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {filteredGames.map((game) => (
                  <div
                    key={game.id}
                    onClick={() => handleSelectGame(game.id)}
                    className="relative group bg-[#0f172a] hover:bg-[#131d35] border border-slate-900/60 rounded-3xl p-5 cursor-pointer shadow-lg transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-cyan-950/10 flex flex-col justify-between"
                  >
                    
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-400/0 to-purple-500/0 group-hover:from-cyan-400/10 group-hover:to-purple-500/10 rounded-3xl transition duration-500 -z-10 blur-md"></div>
                    
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-3xl bg-slate-950 border border-slate-900 w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                          {getEmojiForIcon(game.icon)}
                        </span>
                        
                        <div className="flex items-center space-x-1.5">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                            game.category === 'Custom' 
                              ? 'bg-amber-950/30 text-amber-400 border-amber-900/50' 
                              : game.category === 'Math'
                              ? 'bg-blue-950/30 text-blue-400 border-blue-900/50'
                              : 'bg-slate-950 text-slate-400 border-slate-800'
                          }`}>
                            {game.category}
                          </span>
                          
                          {game.category === 'Custom' && (
                            <button
                              onClick={(e) => handleDeleteCustomGame(game.id, e)}
                              title="Delete Imported Game"
                              className="text-slate-500 hover:text-red-400 hover:bg-slate-950 p-1 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <h3 className="font-bold text-base text-white mt-4 tracking-wide group-hover:text-cyan-400 transition-colors">
                        {game.title}
                      </h3>
                      
                      <p className="text-xs text-slate-400 mt-2.5 leading-relaxed line-clamp-3">
                        {game.description}
                      </p>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-900/50 flex items-center justify-between text-slate-500">
                      <span className="text-[10px] font-mono text-slate-600">
                        {game.useBlankMath ? 'Cloak Evasion: Frame#math' : 'Standard Web Frame'}
                      </span>
                      <span className="text-xs font-semibold text-cyan-400/80 group-hover:text-cyan-400 flex items-center group-hover:translate-x-1.5 transition-all">
                        Launch Play <ChevronRight className="w-4 h-4 ml-0.5" />
                      </span>
                    </div>

                  </div>
                ))}

              </div>
            ) : (
              <div className="py-20 flex flex-col items-center justify-center text-slate-500 bg-[#0f172a]/20 border border-slate-900/20 rounded-3xl">
                <span className="text-4xl">📭</span>
                <p className="text-sm font-semibold mt-4">We couldn't find any games matching those search tags.</p>
                <button 
                  onClick={() => { setSearchQuery(''); setCategoryFilter('All Games'); }} 
                  className="mt-3.5 text-xs text-cyan-400 hover:underline"
                >
                  Clear catalog filters
                </button>
              </div>
            )}

            {/* HELPFUL FAQ AREA */}
            <section className="bg-[#0f172a]/25 border border-slate-900/30 p-5 rounded-3xl mt-6">
              <h3 className="text-xs font-bold text-[#64748b] tracking-wider uppercase mb-3 text-center md:text-left">
                Unblocked Hub — Operational Manual
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-[11px] text-slate-400 leading-relaxed">
                <div>
                  <h4 className="font-bold text-slate-300 border-l border-cyan-500 pl-2 mb-1">What is about:blank#math?</h4>
                  <p>School block filters inspect URLs parsed inside internet histories. This portal encapsulates game engines nested inside blank iframes, hiding game assets beneath harmless educational hashtags.</p>
                </div>
                <div>
                  <h4 className="font-bold text-slate-300 border-l border-purple-500 pl-2 mb-1">How can I escape school monitors?</h4>
                  <p>In case of emergencies, hit the <b>ESC</b> hotkey immediately. This replaces your entire portal viewport with interactive Google Docs or Calculus Calculators without losing game records.</p>
                </div>
                <div>
                  <h4 className="font-bold text-slate-300 border-l border-amber-500 pl-2 mb-1">Can I add generic web games?</h4>
                  <p>Yes! Click the <b>Import Custom Game</b> button above, tag the title, and copy the unified HTML script structure inside to run custom sandbox games inside your browser.</p>
                </div>
              </div>
            </section>

          </div>

        )}

      </main>

      {/* FOOTER BAR */}
      <footer className="mt-auto border-t border-slate-900/60 bg-[#060a11] py-4 px-6 text-center text-[10px] text-slate-600">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <p>Unblocked Hub © 2026 • Encrypted offline sandbox structure</p>
          <div className="flex space-x-3">
            <span className="hover:text-slate-400">Classroom Proxy</span>
            <span>•</span>
            <span className="hover:text-slate-400">Evasion Frames V2</span>
            <span>•</span>
            <span className="hover:text-slate-400 cursor-pointer" onClick={() => {
              if (confirm("Reset application local storage cache? This deletes imported games.")) {
                localStorage.clear();
                window.location.reload();
              }
            }}>Clear Memory Cache</span>
          </div>
        </div>
      </footer>

      {/* ADD CUSTOM GAME POPUP MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-[#020617]/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-900 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden p-6 animate-fade-in flex flex-col space-y-4 max-h-[90vh]">
            
            <div className="flex items-center justify-between border-b border-slate-900 pb-3">
              <div className="flex items-center space-x-2">
                <span className="text-xl">📥</span>
                <h3 className="font-bold text-md text-white">Import Custom Playable HTML Game</h3>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white bg-slate-900/50 p-1 px-2.5 rounded-lg border border-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 flex-1 overflow-y-auto pr-1">
              <div>
                <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Game Name</label>
                <input
                  type="text"
                  placeholder="e.g. Cyber TicTacToe"
                  value={newGameTitle}
                  onChange={(e) => setNewGameTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-cyan-500/50 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Category</label>
                  <select
                    value={newGameCat}
                    onChange={(e) => setNewGameCat(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-xs text-slate-300 focus:border-cyan-500/50 outline-none"
                  >
                    <option value="Classic">Classic</option>
                    <option value="Arcade">Arcade</option>
                    <option value="Action">Action</option>
                    <option value="Math">Math</option>
                  </select>
                </div>
                <div className="flex items-center pt-5 pl-1 select-none">
                  <label className="flex items-center cursor-pointer text-xs text-slate-400">
                    <input
                      type="checkbox"
                      checked={newGameUseBlank}
                      onChange={(e) => setNewGameUseBlank(e.target.checked)}
                      className="mr-2 accent-cyan-400"
                    />
                    Force about:blank#math Sandbox
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Short Description</label>
                <input
                  type="text"
                  placeholder="Explain gameplay details..."
                  value={newGameDesc}
                  onChange={(e) => setNewGameDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-cyan-500/50 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">HTML, CSS, JS Content</label>
                <p className="text-[9px] text-[#64748b] leading-tight mb-1.5">Paste standalone, complete HTML code containing index script styles which runs smoothly in static browsers.</p>
                <textarea
                  placeholder="<!DOCTYPE html><html><head><style>...</style></head><body>...</body></html>"
                  value={newGameCode}
                  onChange={(e) => setNewGameCode(e.target.value)}
                  rows={8}
                  className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-xs text-slate-300 placeholder-slate-700 focus:border-cyan-500/50 outline-none font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-900/50">
              <button
                onClick={() => setShowAddModal(false)}
                className="bg-slate-900 text-slate-400 hover:text-white border border-slate-800 py-2 px-4 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCustomGame}
                disabled={!newGameTitle || !newGameCode}
                className="bg-[#10b981] disabled:bg-slate-800 disabled:text-slate-600 hover:bg-[#0ea271] text-slate-950 font-bold py-2 px-5 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Save to Catalog
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
