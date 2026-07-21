/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wifi, Battery, Signal, Smartphone, BookOpen, ExternalLink, HelpCircle } from 'lucide-react';
import LoginScreen from './components/LoginScreen';
import MainScreen from './components/MainScreen';
import MyPageScreen from './components/MyPageScreen';
import ReservationScreen from './components/ReservationScreen';
import AdminScreen from './components/AdminScreen';

type ScreenType = 'login' | 'main' | 'mypage' | 'reserve' | 'admin';

export default function App() {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [role, setRole] = useState<'admin' | 'student' | null>(null);
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('login');
  const [refreshKey, setRefreshKey] = useState(0);

  // Real-time clock for smartphone status bar
  const [timeStr, setTimeStr] = useState('18:47');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hh = now.getHours().toString().padStart(2, '0');
      const mm = now.getMinutes().toString().padStart(2, '0');
      setTimeStr(`${hh}:${mm}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Handle logout
  const handleLogout = () => {
    setCurrentUser(null);
    setRole(null);
    setCurrentScreen('login');
    triggerRefresh();
  };

  // Force fetch updates
  const triggerRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="h-screen w-full bg-slate-900 flex items-center justify-center overflow-hidden selection:bg-indigo-500 selection:text-white font-sans">
      
      {/* SMARTPHONE FRAME CONTAINER */}
      <div className="relative select-none w-full h-full md:h-auto md:w-auto flex items-center justify-center">
        
        {/* Physical Side Buttons on phone - hidden on mobile */}
        <div className="hidden md:block absolute top-[130px] -left-1 w-1 h-8 bg-slate-800 rounded-l" />
        <div className="hidden md:block absolute top-[175px] -left-1 w-1 h-12 bg-slate-800 rounded-l" />
        <div className="hidden md:block absolute top-[230px] -left-1 w-1 h-12 bg-slate-800 rounded-l" />
        <div className="hidden md:block absolute top-[150px] -right-1 w-1 h-16 bg-slate-800 rounded-r" />

        {/* Smartphone Outer Shell - full-screen on mobile, structured device on desktop */}
        <div className="w-full h-full md:w-[340px] md:h-[700px] bg-slate-950 md:rounded-[40px] p-0 md:p-2 shadow-none md:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.8)] border-0 md:border-[4px] md:border-slate-800 flex flex-col overflow-hidden relative">

          {/* Internal Viewport */}
          <div className="w-full h-full bg-white rounded-none md:rounded-[32px] overflow-hidden relative flex flex-col shadow-inner pt-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentScreen}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full h-full"
              >
                {currentScreen === 'login' && (
                  <LoginScreen 
                    onLoginSuccess={(id, userRole) => {
                      setCurrentUser(id);
                      setRole(userRole);
                      setCurrentScreen(userRole === 'admin' ? 'admin' : 'main');
                      triggerRefresh();
                    }} 
                  />
                )}

                {currentScreen === 'main' && currentUser && (
                  <MainScreen 
                    studentId={currentUser} 
                    onNavigate={setCurrentScreen}
                    refreshKey={refreshKey}
                  />
                )}

                {currentScreen === 'mypage' && currentUser && (
                  <MyPageScreen 
                    studentId={currentUser} 
                    onNavigate={setCurrentScreen}
                    onLogout={handleLogout}
                    refreshKey={refreshKey}
                    onTriggerRefresh={triggerRefresh}
                  />
                )}

                {currentScreen === 'reserve' && currentUser && (
                  <ReservationScreen 
                    studentId={currentUser} 
                    onNavigate={setCurrentScreen}
                    refreshKey={refreshKey}
                    onTriggerRefresh={triggerRefresh}
                  />
                )}

                {currentScreen === 'admin' && (
                  <AdminScreen 
                    onLogout={handleLogout}
                    refreshKey={refreshKey}
                    onTriggerRefresh={triggerRefresh}
                    onNavigate={setCurrentScreen}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Home Indicator line (iOS style) */}
          <div className="hidden md:block absolute bottom-1 left-1/2 -translate-x-1/2 w-28 h-1 bg-white/30 rounded-full z-40 pointer-events-none" />

        </div>
      </div>

    </div>
  );
}
