import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, BookOpen, AlertCircle, Clock, LogOut, Home, User } from 'lucide-react';
import { dbService, Reservation, RoomConfig } from '../db';

interface ReservationScreenProps {
  studentId: string;
  onNavigate: (screen: 'main' | 'mypage' | 'reserve' | 'admin') => void;
  refreshKey: number;
  onTriggerRefresh: () => void;
}

export default function ReservationScreen({ 
  studentId, 
  onNavigate, 
  refreshKey, 
  onTriggerRefresh 
}: ReservationScreenProps) {
  const [config, setConfig] = useState<RoomConfig>({ num_rows: 6, num_cols: 5 });
  const [reservations, setReservations] = useState<Reservation[]>([]);
  
  // Modals / Overlays
  const [confirmTargetSeat, setConfirmTargetSeat] = useState<number | null>(null);
  const [activeDetailSeat, setActiveDetailSeat] = useState<Reservation | null>(null);

  useEffect(() => {
    async function loadGrid() {
      try {
        const roomConfig = await dbService.getConfig();
        setConfig(roomConfig);

        const resList = await dbService.getReservations();
        setReservations(resList);
      } catch (err) {
        console.error("Failed to load reservation grid:", err);
      }
    }
    loadGrid();
  }, [refreshKey]);

  // Mask student ID: front 3 characters visible, rest replaced by '*'
  const maskId = (id: string | null) => {
    if (!id) return '';
    if (id.length <= 3) return id;
    const prefix = id.substring(0, 3);
    const maskedLength = Math.max(0, id.length - 3);
    return `${prefix}${'*'.repeat(maskedLength)}`;
  };

  // Click handler for desks
  const handleSeatClick = (seat: Reservation) => {
    if (seat.student_id === studentId) {
      // My reserved seat -> Open detail/checkout popup
      setActiveDetailSeat(seat);
    } else if (seat.student_id === null) {
      // Unreserved seat -> Open confirm reservation modal
      setConfirmTargetSeat(seat.seat_id);
    }
    // Reserved by someone else -> No action
  };

  // Proceed with seat reservation
  const handleConfirmReservation = async () => {
    if (confirmTargetSeat === null) return;
    try {
      await dbService.reserveSeat(confirmTargetSeat, studentId);
      setConfirmTargetSeat(null);
      onTriggerRefresh(); // Reload data
    } catch (err) {
      console.error("Reservation failed:", err);
    }
  };

  // Cancel reservation button action (strictly go back to main screen as requested)
  const handleCancelReservation = () => {
    setConfirmTargetSeat(null);
    onNavigate('main');
  };

  // Checkout (퇴실) handler
  const handleCheckout = async () => {
    if (!activeDetailSeat) return;
    try {
      await dbService.releaseSeat(activeDetailSeat.seat_id);
      setActiveDetailSeat(null);
      onTriggerRefresh();
    } catch (err) {
      console.error("Checkout failed:", err);
    }
  };

  // Format usage start time
  const formatTime = (isoString: string | null) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-50 select-none overflow-hidden">
      
      {/* Top Header Bar */}
      <div className="bg-white px-4 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
        <button 
          id="back-btn"
          onClick={() => onNavigate('main')}
          className="p-1.5 hover:bg-slate-100 rounded-full text-slate-500 transition-all"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-sm font-bold text-slate-800">자습실 좌석 예약</h2>
        <div className="w-8" /> {/* Balance spacer */}
      </div>

      {/* Classroom Container */}
      <div className="flex-1 overflow-y-auto px-5 py-6 flex flex-col justify-start space-y-6">
        
        {/* Classroom Blackboard (교탁 / 칠판) */}
        <div className="w-full bg-slate-800 text-slate-300 py-3 rounded-xl shadow-inner border-b-4 border-slate-700 flex flex-col items-center justify-center space-y-1 shrink-0">
          <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400 font-mono">FRONT</div>
          <div className="text-sm font-extrabold tracking-tight">교탁 및 칠판 (BOARD)</div>
        </div>

        {/* Desk Grid Scroll Container */}
        <div className="w-full flex-1 flex flex-col justify-center">
          <div 
            className="grid gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm mx-auto w-full"
            style={{ 
              gridTemplateColumns: `repeat(${config.num_cols}, minmax(0, 1fr))`,
            }}
          >
            {reservations.map((seat) => {
              const isMine = seat.student_id === studentId;
              const isReserved = seat.student_id !== null;

              // Color determination
              let bgClass = 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800';
              if (isMine) {
                bgClass = 'bg-red-500 border-red-600 text-white font-bold shadow-md shadow-red-500/20';
              } else if (isReserved) {
                bgClass = 'bg-slate-200 border-slate-300 text-slate-500 cursor-not-allowed';
              }

              return (
                <motion.button
                  key={seat.seat_id}
                  id={`seat-${seat.seat_id}`}
                  onClick={() => handleSeatClick(seat)}
                  whileTap={!isReserved || isMine ? { scale: 0.93 } : {}}
                  className={`aspect-square rounded-xl border flex flex-col items-center justify-center p-1 transition-all duration-150 ${bgClass}`}
                >
                  <span className="text-[10px] font-bold font-mono opacity-60">
                    {seat.seat_id}
                  </span>
                  
                  {isReserved ? (
                    <span className="text-[11px] font-extrabold tracking-tight truncate mt-0.5 max-w-full">
                      {maskId(seat.student_id)}
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-slate-300 mt-0.5">빈자리</span>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Color Index Indicator */}
        <div className="bg-white/80 p-3.5 rounded-xl border border-slate-100 flex justify-center gap-6 text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded bg-white border border-slate-200" />
            <span>예약 가능 (Vacant)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded bg-slate-200 border border-slate-300" />
            <span>예약 완료 (Reserved)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded bg-red-500 shadow-sm" />
            <span>내 좌석 (My Seat)</span>
          </div>
        </div>

      </div>

      {/* CONFIRM RESERVATION MODAL (자습실을 예약하시겠습니까) */}
      <AnimatePresence>
        {confirmTargetSeat !== null && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-xs">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-xs rounded-2xl p-5 shadow-2xl border border-slate-100 flex flex-col items-center text-center space-y-4"
            >
              <div className="w-11 h-11 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                <BookOpen size={20} />
              </div>
              
              <div className="space-y-1">
                <h3 className="text-slate-900 font-bold text-base">좌석 예약 안내</h3>
                <p className="text-slate-500 text-xs break-keep">
                  <span className="text-indigo-600 font-bold font-mono">{confirmTargetSeat}번</span> 좌석을 예약하시겠습니까?
                </p>
              </div>

              <div className="flex w-full gap-2.5">
                <button
                  id="cancel-reserve-btn"
                  onClick={handleCancelReservation}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl text-xs transition-all"
                >
                  취소
                </button>
                <button
                  id="confirm-reserve-btn"
                  onClick={handleConfirmReservation}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs shadow-md shadow-indigo-600/10 transition-all"
                >
                  확인
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MY RESERVED SEAT DETAIL & CHECKOUT POPUP */}
      <AnimatePresence>
        {activeDetailSeat !== null && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-xs">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-xs rounded-2xl p-5 shadow-2xl border border-slate-100 flex flex-col items-center text-center space-y-4"
            >
              <div className="w-11 h-11 rounded-full bg-red-50 flex items-center justify-center text-red-500">
                <Clock size={20} />
              </div>

              <div className="space-y-1.5 w-full">
                <h3 className="text-slate-900 font-bold text-base">내 좌석 이용 정보</h3>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1 text-xs text-slate-600">
                  <p>이용 좌석: <span className="font-extrabold text-slate-800 font-mono">{activeDetailSeat.seat_id}번</span></p>
                  <p>이용자 ID: <span className="font-bold text-slate-800 font-mono">{activeDetailSeat.student_id}</span></p>
                  <p>이용 시간: <span className="font-semibold text-slate-800 font-mono">{formatTime(activeDetailSeat.reserved_at)}</span> 부터 사용 중</p>
                </div>
              </div>

              <div className="flex w-full gap-2.5">
                <button
                  id="checkout-detail-close"
                  onClick={() => setActiveDetailSeat(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl text-xs transition-all"
                >
                  닫기
                </button>
                <button
                  id="checkout-detail-confirm"
                  onClick={handleCheckout}
                  className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl text-xs shadow-md shadow-red-500/10 transition-all"
                >
                  퇴실 (Checkout)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation Tabs */}
      <div className="bg-white border-t border-slate-100 px-6 py-2.5 flex justify-around items-center shrink-0">
        <button 
          id="nav-home"
          onClick={() => onNavigate('main')}
          className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600"
        >
          <Home size={22} strokeWidth={2} />
          <span className="text-[10px] font-medium">홈</span>
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
  );
}
