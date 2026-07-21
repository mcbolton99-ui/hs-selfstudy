import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Home, User, Key, LogOut, CheckCircle, AlertCircle, ShieldAlert, Clock, ArrowLeft, GraduationCap } from 'lucide-react';
import { dbService, Reservation } from '../db';

interface MyPageScreenProps {
  studentId: string;
  onNavigate: (screen: 'main' | 'mypage' | 'reserve' | 'admin') => void;
  onLogout: () => void;
  refreshKey: number;
  onTriggerRefresh: () => void;
}

export default function MyPageScreen({ 
  studentId, 
  onNavigate, 
  onLogout, 
  refreshKey, 
  onTriggerRefresh 
}: MyPageScreenProps) {
  const [mySeat, setMySeat] = useState<Reservation | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showCheckoutConfirm, setShowCheckoutConfirm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function loadUsage() {
      try {
        const resList = await dbService.getReservations();
        const found = resList.find(r => r.student_id === studentId);
        setMySeat(found || null);
      } catch (err) {
        console.error("Failed to load user reservation status:", err);
      }
    }
    loadUsage();
  }, [studentId, refreshKey]);

  // Handle password change
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      setError('현재 비밀번호와 새 비밀번호를 모두 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const student = await dbService.getStudent(studentId);
      if (!student || student.password !== currentPassword) {
        setError('현재 비밀번호가 일치하지 않습니다.');
        setIsLoading(false);
        return;
      }

      await dbService.updateStudent({ id: studentId, password: newPassword });
      setSuccess('비밀번호가 성공적으로 변경되었습니다!');
      
      // Clear form
      setCurrentPassword('');
      setNewPassword('');

      // Auto close and refresh after delay
      setTimeout(() => {
        setIsChangingPassword(false);
        setSuccess(null);
        onTriggerRefresh(); // Trigger a page refresh/reload state
      }, 1500);

    } catch (err) {
      console.error(err);
      setError('비밀번호 변경 중 에러가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick checkout function
  const handleCheckout = () => {
    if (!mySeat) return;
    setShowCheckoutConfirm(true);
  };

  const handleConfirmCheckout = async () => {
    if (!mySeat) return;
    try {
      await dbService.releaseSeat(mySeat.seat_id);
      setShowCheckoutConfirm(false);
      onTriggerRefresh();
    } catch (err) {
      console.error("Failed to checkout:", err);
    }
  };

  // Format timestamp nicely
  const formatTime = (isoString: string | null) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  return (
    <div className="w-full h-full flex flex-col justify-between bg-slate-50 select-none">
      
      {/* Top Header Bar */}
      <div className="bg-white px-4 py-4 border-b border-slate-100 flex items-center justify-between">
        <button 
          id="back-to-home"
          onClick={() => onNavigate('main')}
          className="p-1.5 hover:bg-slate-100 rounded-full text-slate-500 transition-all"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-sm font-bold text-slate-800">마이페이지</h2>
        <div className="w-8" /> {/* Balance spacer */}
      </div>

      {/* Main Body content */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
        
        {/* Profile Card Summary */}
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl p-6 text-white shadow-xl shadow-indigo-700/10 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0">
            <GraduationCap size={28} />
          </div>
          <div>
            <p className="text-xs text-indigo-200 font-bold tracking-wide">한서고등학교 학생</p>
            <h3 className="text-lg font-extrabold font-mono tracking-tight">{studentId}</h3>
          </div>
        </div>

        {/* MY SEAT USAGE STATUS */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-4">
          <h3 className="text-slate-800 font-bold text-sm border-b border-slate-50 pb-3">
            나의 자습실 사용현황
          </h3>

          {mySeat ? (
            <div className="space-y-4">
              <div className="flex items-start gap-4 bg-indigo-50/50 p-4 rounded-xl border border-indigo-50">
                <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-600 shrink-0">
                  <Clock size={18} />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500 font-medium">현재 사용 중인 좌석</p>
                  <p className="text-sm font-bold text-slate-800">
                    <span className="text-indigo-600 text-lg font-extrabold mr-1 font-mono">{mySeat.seat_id}</span>번 책상
                  </p>
                  <p className="text-xs text-slate-400">
                    사용 시작: <span className="font-bold text-slate-600 font-mono">{formatTime(mySeat.reserved_at)}</span> 부터
                  </p>
                </div>
              </div>

              <button
                id="mypage-checkout"
                onClick={handleCheckout}
                className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-bold text-sm rounded-xl transition-all duration-150 shadow-md shadow-red-500/10"
              >
                퇴실 처리하기
              </button>
            </div>
          ) : (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <ShieldAlert size={22} />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-700">자습실을 사용하지 않고 있습니다</p>
                <p className="text-xs text-slate-400 max-w-[240px] break-keep">
                  자습실 예약 화면에서 원하는 빈 좌석을 선택해 예약할 수 있습니다.
                </p>
              </div>
              <button
                id="mypage-go-reserve"
                onClick={() => onNavigate('reserve')}
                className="mt-2 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-lg transition-all"
              >
                좌석 예약하러 가기
              </button>
            </div>
          )}
        </div>

        {/* ACTIONS SECTION */}
        <div className="space-y-3">
          <button
            id="mypage-change-password-toggle"
            onClick={() => setIsChangingPassword(true)}
            className="w-full bg-white hover:bg-slate-50 text-slate-700 font-semibold py-4 px-5 rounded-2xl flex items-center justify-between border border-slate-100 shadow-sm transition-all"
          >
            <span className="flex items-center gap-2.5">
              <Key size={18} className="text-slate-400" />
              <span className="text-sm">비밀번호 변경</span>
            </span>
            <span className="text-xs text-slate-400 font-bold">&gt;</span>
          </button>

          <button
            id="mypage-logout"
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full bg-white hover:bg-red-50 text-red-500 font-semibold py-4 px-5 rounded-2xl flex items-center justify-between border border-red-50 shadow-sm transition-all"
          >
            <span className="flex items-center gap-2.5">
              <LogOut size={18} className="text-red-400" />
              <span className="text-sm">로그아웃</span>
            </span>
            <span className="text-xs text-red-300 font-bold">&gt;</span>
          </button>
        </div>

      </div>

      {/* CHANGE PASSWORD BOTTOM SLIDE-UP DRAWER/MODAL */}
      <AnimatePresence>
        {isChangingPassword && (
          <div className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-end">
            {/* Background Dimmer Dismissal click */}
            <div className="absolute inset-0" onClick={() => !isLoading && setIsChangingPassword(false)} />

            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative z-10 w-full bg-white rounded-t-3xl p-6 border-t border-slate-200 shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                <h3 className="text-slate-800 font-bold text-base flex items-center gap-2">
                  <Key size={18} className="text-indigo-600" />
                  <span>비밀번호 변경</span>
                </h3>
                <button
                  id="close-password-modal"
                  disabled={isLoading}
                  onClick={() => setIsChangingPassword(false)}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600 p-1"
                >
                  취소
                </button>
              </div>

              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1 pl-1">현재 비밀번호</label>
                  <input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="현재 설정된 비밀번호"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1 pl-1">새 비밀번호</label>
                  <input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="새로운 비밀번호 입력"
                    disabled={isLoading}
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-1.5 text-xs text-red-500 font-medium bg-red-50 p-3 rounded-lg border border-red-100">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {success && (
                  <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-semibold bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                    <CheckCircle size={14} className="shrink-0" />
                    <span>{success}</span>
                  </div>
                )}

                <button
                  id="password-submit"
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-indigo-600/10"
                >
                  {isLoading ? '변경 중...' : '비밀번호 변경하기'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* LOGOUT CONFIRMATION MODAL */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-xs">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-xs rounded-2xl p-5 shadow-2xl border border-slate-100 flex flex-col items-center text-center space-y-4 shadow-slate-950/20"
            >
              <div className="w-11 h-11 rounded-full bg-red-50 flex items-center justify-center text-red-500">
                <LogOut size={20} />
              </div>
              <div className="space-y-1">
                <h3 className="text-slate-900 font-bold text-base">로그아웃 안내</h3>
                <p className="text-slate-500 text-xs break-keep">
                  정말로 로그아웃 하시겠습니까?
                </p>
              </div>
              <div className="flex w-full gap-2.5">
                <button
                  id="cancel-logout-btn"
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl text-xs transition-all"
                >
                  취소
                </button>
                <button
                  id="confirm-logout-btn"
                  onClick={() => {
                    setShowLogoutConfirm(false);
                    onLogout();
                  }}
                  className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl text-xs shadow-md shadow-red-500/10 transition-all"
                >
                  로그아웃
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CHECKOUT CONFIRMATION MODAL */}
      <AnimatePresence>
        {showCheckoutConfirm && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-xs">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-xs rounded-2xl p-5 shadow-2xl border border-slate-100 flex flex-col items-center text-center space-y-4 shadow-slate-950/20"
            >
              <div className="w-11 h-11 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500">
                <LogOut size={20} />
              </div>
              <div className="space-y-1">
                <h3 className="text-slate-900 font-bold text-base">퇴실 안내</h3>
                <p className="text-slate-500 text-xs break-keep">
                  이용 중인 좌석을 퇴실 처리하시겠습니까?
                </p>
              </div>
              <div className="flex w-full gap-2.5">
                <button
                  id="cancel-checkout-btn"
                  onClick={() => setShowCheckoutConfirm(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl text-xs transition-all"
                >
                  취소
                </button>
                <button
                  id="confirm-checkout-btn"
                  onClick={handleConfirmCheckout}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs shadow-md shadow-indigo-600/10 transition-all"
                >
                  퇴실 처리
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation Tabs */}
      <div className="bg-white border-t border-slate-100 px-6 py-2.5 flex justify-around items-center">
        <button 
          id="mypage-nav-home"
          onClick={() => onNavigate('main')}
          className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600"
        >
          <Home size={22} strokeWidth={2} />
          <span className="text-[10px] font-medium">홈</span>
        </button>
        <button 
          id="mypage-nav-mypage"
          onClick={() => onNavigate('mypage')}
          className="flex flex-col items-center gap-1 text-indigo-600"
        >
          <User size={22} strokeWidth={2.5} />
          <span className="text-[10px] font-bold">마이페이지</span>
        </button>
      </div>

    </div>
  );
}
