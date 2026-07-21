import React, { useState } from 'react';
import { motion } from 'motion/react';
import { LogIn, User, Lock, AlertTriangle } from 'lucide-react';
import { dbService } from '../db';
import schoolBg from '../assets/images/hanseo_school_background_1784598471668.jpg';

interface LoginScreenProps {
  onLoginSuccess: (id: string, role: 'admin' | 'student') => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id.trim() || !password.trim()) {
      setError('아이디와 패스워드를 모두 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const student = await dbService.getStudent(id);
      if (!student || student.password !== password) {
        setError('아이디와 패스워드가 일치하지 않습니다.');
        setIsLoading(false);
        return;
      }

      // Successful login
      if (id === 'admin') {
        onLoginSuccess(id, 'admin');
      } else {
        onLoginSuccess(id, 'student');
      }
    } catch (err) {
      console.error(err);
      setError('로그인 처리 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="relative w-full h-full flex flex-col justify-between bg-cover bg-center select-none"
      style={{ backgroundImage: `url(${schoolBg})` }}
    >
      {/* Semi-transparent Overlay */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[3px]" />

      <div className="relative z-10 w-full h-full flex flex-col justify-between p-6 overflow-y-auto">
        {/* Header Title Section */}
        <div className="text-center pt-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-block bg-indigo-500/20 text-indigo-300 text-xs px-3 py-1.5 rounded-full border border-indigo-500/30 font-medium mb-3 font-mono tracking-wider"
          >
            HANSEO HIGH SCHOOL
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-white text-2xl font-bold tracking-tight leading-snug drop-shadow-md break-keep font-display"
          >
            한서고등학교 자습실
            <br />
            <span className="text-indigo-300">좌석 예약 시스템</span>
          </motion.h1>
        </div>

        {/* Login Form Box */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="w-full bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-2xl border border-white/20 mb-8"
        >
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 pl-1">
                아이디 (ID)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <User size={18} />
                </span>
                <input
                  id="login-id"
                  type="text"
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                  placeholder="학번 또는 아이디 입력"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 pl-1">
                비밀번호 (Password)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Lock size={18} />
                </span>
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                  placeholder="비밀번호 입력"
                  disabled={isLoading}
                />
              </div>
            </div>

            <motion.button
              id="login-submit"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30 transition-all duration-200"
            >
              <LogIn size={18} />
              <span>{isLoading ? '로그인 중...' : '로그인'}</span>
            </motion.button>
          </form>


        </motion.div>
      </div>

      {/* Error Alert Dialog inside Phone Frame */}
      {error && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white w-full max-w-sm rounded-2xl p-5 shadow-2xl border border-red-100 flex flex-col items-center text-center"
          >
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500 mb-3">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-slate-900 font-bold text-base mb-1">로그인 실패</h3>
            <p className="text-slate-600 text-sm mb-5 break-keep leading-relaxed">
              {error}
            </p>
            <button
              id="close-error-modal"
              onClick={() => setError(null)}
              className="w-full py-2.5 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-semibold rounded-xl text-sm shadow-md shadow-red-500/10 hover:shadow-red-500/20 transition-all duration-150"
            >
              확인
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
