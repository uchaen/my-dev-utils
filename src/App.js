import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import './App.css';
import JwtEncode from './components/JwtEncode';
import JwtDecode from './components/JwtDecode';
import Sha256Tool from './components/Sha256Tool';
import JsonBeautifier from './components/JsonBeautifier';
import TimestampConverter from './components/TimestampConverter';
import ByteCounter from './components/ByteCounter';
import CharacterCounter from './components/CharacterCounter';
import DiffTool from './components/DiffTool';

const menuItems = [
  { path: '/jwt-encode', name: 'JWT Encoder' },
  { path: '/jwt-decode', name: 'JWT Decoder' },
  { path: '/sha256', name: 'SHA256 암호화' },
  { path: '/json', name: 'JSON Beautifier' },
  { path: '/timestamp', name: 'Timestamp 변환기' },
  { path: '/byte', name: 'Byte 계산기' },
  { path: '/char', name: '글자수 세기' },
  { path: '/diff', name: 'Text Diff 비교' },
];

// Simple SVG Icons
const Icons = {
  Menu: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>
    </svg>
  ),
  Panel: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/>
    </svg>
  ),
  Sun: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>
    </svg>
  ),
  Moon: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
    </svg>
  ),
};

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : true;
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  return (
    <div className="app">
      {/* Header */}
      <header className={`header ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="header-left">
          {/* 사이드바 닫혀있을 때만 헤더에 메뉴 버튼 표시 */}
          {!sidebarOpen && (
            <button 
              className="icon-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Icons.Panel />
            </button>
          )}
          <div className="logo">
            <span>Dev Utils</span>
          </div>
        </div>
        <button 
          className="icon-btn"
          onClick={() => setDarkMode(!darkMode)}
          aria-label="Toggle theme"
        >
          {darkMode ? <Icons.Sun /> : <Icons.Moon />}
        </button>
      </header>

      <div className="main-container">
        {/* Sidebar */}
        <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
          {/* 사이드바 헤더 - 열려있을 때 토글 버튼 표시 */}
          <div className="sidebar-header">
            <button 
              className="icon-btn"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close menu"
            >
              <Icons.Panel />
            </button>
          </div>
          <nav className="nav">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => 
                  `nav-item ${isActive ? 'active' : ''}`
                }
              >
                {item.name}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className={`content ${sidebarOpen ? '' : 'expanded'}`}>
          <Routes>
            <Route path="/" element={<Navigate to="/jwt-encode" replace />} />
            <Route path="/jwt-encode" element={<JwtEncode />} />
            <Route path="/jwt-decode" element={<JwtDecode />} />
            <Route path="/sha256" element={<Sha256Tool />} />
            <Route path="/json" element={<JsonBeautifier />} />
            <Route path="/timestamp" element={<TimestampConverter />} />
            <Route path="/byte" element={<ByteCounter />} />
            <Route path="/char" element={<CharacterCounter />} />
            <Route path="/diff" element={<DiffTool />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
