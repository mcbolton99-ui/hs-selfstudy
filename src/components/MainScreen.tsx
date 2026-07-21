import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Home, User, BookOpen, Clock, Calendar, Shield } from 'lucide-react';
import { dbService, Reservation } from '../db';
import schoolBg from '../assets/images/hanseo_school_background_1784598471668.jpg';

interface MainScreenProps {
  studentId: string;
  onNavigate: (screen: 'main' | 'mypage' | 'reserve' | 'admin') => void;
  refreshKey: number;
}

export default function MainScreen({ studentId, onNavigate, refreshKey }: MainScreenProps) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [totalSeats, setTotalSeats] = useState(30);
  const [occupiedCount, setOccupiedCount] = useState(0);
  const [mySeat, setMySeat] = useState<Reservation | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const config = await dbService.getConfig();
        const seats = config.num_rows * config.num_cols;
        setTotalSeats(seats);

        const resList = await dbService.getReservations();
        setReservations(resList);
        
        const occupied = resList.filter(r => r.student_id !== null).length;
        setOccupiedCount(occupied);

        const foundMySeat = resList.find(r => r.student_id === studentId);
        setMySeat(foundMySeat || null);
      } catch (err) {
        console.error("Failed to load main screen data:", err);
      }
    }
    loadData();
  }, [studentId, refreshKey]);

  const isFull = occupiedCount >= totalSeats && !mySeat;

  return (
    <div 
      className="relative w-full h-full flex flex-col justify-between bg-cover bg-center select-none"
      style={{ backgroundImage: `url(${schoolBg})` }}
    >
      {/* Background Dimmer */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" />

      {/* Main Container */}
      <div className="relative z-10 w-full h-full flex flex-col justify-between overflow-hidden">
        
        {/* Top Header Bar */}
        <div className="bg-white/95 backdrop-blur-md px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <BookOpen size={16} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Hanseo Study Room</p>
              <h2 className="text-sm font-bold text-slate-800">한서고등학교 자습실</h2>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-[11px] font-semibold text-slate-600 font-mono">{studentId}</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
          
          {/* Main School Welcome Hero */}
          <div className="text-center text-white space-y-1.5 py-4">
            <h1 className="text-3xl font-extrabold tracking-tight drop-shadow font-display">
              한서고등학교 자습실
            </h1>
            <p className="text-indigo-300 font-medium text-sm drop-shadow-sm font-mono">
              Self-Directed Study Center
            </p>
          </div>

          {/* Seat Status Widget - mimicking the screenshot's premium look */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-xl border border-slate-100"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-slate-800 font-bold text-sm flex items-center gap-1.5">
                <Clock size={16} className="text-indigo-600" />
                <span>현재 실시간 이용 현황</span>
              </h3>
              <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                실시간 집계
              </span>
            </div>

            {/* Occupied State */}
            <div className="flex justify-center items-baseline gap-1 py-4">
              <span className="text-5xl font-extrabold text-slate-800 font-mono tracking-tight">
                {occupiedCount}
              </span>
              <span className="text-xl font-medium text-slate-400 font-mono">
                / {totalSeats}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mb-3">
              <div 
                className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${(occupiedCount / totalSeats) * 100}%` }}
              />
            </div>

            <p className="text-center text-xs text-slate-500">
              현재 <span className="font-bold text-slate-700">{totalSeats - occupiedCount}석</span> 예약 가능합니다.
            </p>
          </motion.div>

          {/* My Active Reservation Card Shortcut if using a seat */}
          {mySeat && (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-center justify-between shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/10 flex items-center justify-center text-indigo-600">
                  <Calendar size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-indigo-700">이용 중인 좌석</p>
                  <p className="text-sm font-bold text-indigo-900 mt-0.5">
                    {mySeat.seat_id}번 좌석 사용 중
                  </p>
                </div>
              </div>
              <button 
                id="active-reservation-detail"
                onClick={() => onNavigate('reserve')}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-md shadow-indigo-600/10 transition-all duration-150"
              >
                상세보기
              </button>
            </motion.div>
          )}

          {/* Action Button: "자습실 예약" */}
          <motion.div 
            whileHover={!isFull ? { scale: 1.01 } : {}}
            whileTap={!isFull ? { scale: 0.99 } : {}}
          >
            <button
              id="reserve-button"
              disabled={isFull}
              onClick={() => onNavigate('reserve')}
              className={`w-full py-4.5 rounded-2xl font-bold text-base transition-all duration-200 flex items-center justify-center gap-2 shadow-xl ${
                isFull 
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none' 
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/10 hover:shadow-indigo-500/20 border border-indigo-500'
              }`}
            >
              <BookOpen size={20} />
              <span>{isFull ? '자습실 예약 (만석)' : '자습실 예약하기'}</span>
            </button>
          </motion.div>

        </div>

        {/* Bottom Navigation Tabs */}
        <div className="bg-white/95 backdrop-blur-md border-t border-slate-100 px-6 py-2.5 flex justify-around items-center">
          <button 
            id="nav-home"
            onClick={() => onNavigate('main')}
            className="flex flex-col items-center gap-1 text-indigo-600"
          >
            <Home size={22} strokeWidth={2.5} />
            <span className="text-[10px] font-bold">홈</span>
          </button>
          <button 
            id="nav-mypage"
            onClick={() => onNavigate('mypage')}
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600"
          >
            <User size={22} strokeWidth={2} />
            <span className="text-[10px] font-medium">마이페이지</span>
          </button>
        </div>

      </div>
    </div>
  );
}
