import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, BookOpen, LogOut, Plus, Edit2, Trash2, 
  Settings, Key, CheckCircle, AlertCircle, Save, Home, User 
} from 'lucide-react';
import { dbService, Student, Reservation, RoomConfig } from '../db';

interface AdminScreenProps {
  onLogout: () => void;
  refreshKey: number;
  onTriggerRefresh: () => void;
  onNavigate?: (screen: 'login' | 'main' | 'mypage' | 'reserve' | 'admin') => void;
}

type AdminTab = 'usage' | 'students' | 'config';

export default function AdminScreen({ onLogout, refreshKey, onTriggerRefresh, onNavigate }: AdminScreenProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('usage');
  const [students, setStudents] = useState<Student[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [config, setConfig] = useState<RoomConfig>({ num_rows: 6, num_cols: 5 });

  // Inputs for Row / Column configuration
  const [configRows, setConfigRows] = useState(6);
  const [configCols, setConfigCols] = useState(5);

  // Modals / Editing States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Form fields for Add/Edit
  const [formStudentId, setFormStudentId] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Custom modals & messages
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [configSuccess, setConfigSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function loadAdminData() {
      try {
        const roomConfig = await dbService.getConfig();
        setConfig(roomConfig);
        setConfigRows(roomConfig.num_rows);
        setConfigCols(roomConfig.num_cols);

        const resList = await dbService.getReservations();
        setReservations(resList);

        const studentList = await dbService.getAllStudents();
        setStudents(studentList);
      } catch (err) {
        console.error("Failed to load admin dashboard:", err);
      }
    }
    loadAdminData();
  }, [refreshKey, activeTab]);

  // Handle student creation
  const handleAddStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formStudentId.trim() || !formPassword.trim()) {
      setError('아이디와 패스워드를 모두 입력해주세요.');
      return;
    }

    try {
      await dbService.addStudent({ id: formStudentId, password: formPassword });
      setSuccess('학생이 성공적으로 추가되었습니다!');
      
      // Clear inputs
      setFormStudentId('');
      setFormPassword('');
      setError(null);

      setTimeout(() => {
        setIsAddModalOpen(false);
        setSuccess(null);
        onTriggerRefresh();
        // Redirect to Student Management view automatically
        setActiveTab('students');
      }, 1200);

    } catch (err: any) {
      setError(err.message || '학생 추가 중 에러가 발생했습니다.');
    }
  };

  // Handle student editing update
  const handleEditStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    if (!formPassword.trim()) {
      setError('새로운 패스워드를 입력해주세요.');
      return;
    }

    try {
      await dbService.updateStudent({ id: editingStudent.id, password: formPassword });
      setSuccess('학생 정보가 성공적으로 변경되었습니다!');
      setError(null);

      setTimeout(() => {
        setEditingStudent(null);
        setFormPassword('');
        setSuccess(null);
        onTriggerRefresh();
      }, 1200);

    } catch (err) {
      console.error(err);
      setError('학생 수정 중 오류가 발생했습니다.');
    }
  };

  // Handle student deletion
  const handleDeleteStudent = (studentId: string) => {
    if (studentId === 'admin') return;
    setStudentToDelete(studentId);
  };

  const handleConfirmDeleteStudent = async () => {
    if (!studentToDelete) return;
    try {
      await dbService.deleteStudent(studentToDelete);
      setStudentToDelete(null);
      onTriggerRefresh();
    } catch (err) {
      console.error(err);
      setError('학생 삭제에 실패했습니다.');
    }
  };

  // Apply row/column classroom config updates
  const handleApplyConfig = async () => {
    setConfigError(null);
    setConfigSuccess(null);

    if (configRows < 1 || configCols < 1) {
      setConfigError('행과 열 개수는 최소 1개 이상이어야 합니다.');
      return;
    }

    try {
      await dbService.updateConfig(configRows, configCols);
      setConfigSuccess('자습실 배치가 성공적으로 변경되었습니다!');
      onTriggerRefresh();
      
      setTimeout(() => {
        setConfigSuccess(null);
      }, 3000);
    } catch (err) {
      console.error(err);
      setConfigError('배치 설정 변경 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="w-full h-full flex flex-col justify-between bg-slate-50 select-none overflow-hidden">
      
      {/* Top Header Section */}
      <div className="bg-slate-950 text-white px-5 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-indigo-500 flex items-center justify-center font-bold text-xs text-slate-900">
            A
          </div>
          <div>
            <h2 className="text-base font-extrabold">관리자</h2>
          </div>
        </div>
        
        <button
          id="admin-logout"
          onClick={() => setShowLogoutConfirm(true)}
          className="p-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-lg text-slate-300 transition-all flex items-center gap-1 text-xs"
        >
          <LogOut size={14} />
          <span>로그아웃</span>
        </button>
      </div>

      {/* Tab bar Navigation */}
      <div className="bg-white border-b border-slate-200 px-4 flex shrink-0">
        <button
          id="tab-usage"
          onClick={() => setActiveTab('usage')}
          className={`flex-1 py-3 text-xs font-bold transition-all text-center border-b-2 ${
            activeTab === 'usage' 
              ? 'border-indigo-600 text-indigo-600' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          이용현황
        </button>
        <button
          id="tab-students"
          onClick={() => setActiveTab('students')}
          className={`flex-1 py-3 text-xs font-bold transition-all text-center border-b-2 ${
            activeTab === 'students' 
              ? 'border-indigo-600 text-indigo-600' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          학생 관리
        </button>
        <button
          id="tab-config"
          onClick={() => setActiveTab('config')}
          className={`flex-1 py-3 text-xs font-bold transition-all text-center border-b-2 ${
            activeTab === 'config' 
              ? 'border-indigo-600 text-indigo-600' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          배치 설정
        </button>
      </div>

      {/* Main Body View */}
      <div className="flex-1 overflow-y-auto px-5 py-5">
        
        {/* TAB 1: USAGE STATUS (이용현황) */}
        {activeTab === 'usage' && (
          <div className="space-y-5">
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-800">자습실 사용 현황</h3>
              </div>
              <span className="text-indigo-600 font-mono font-extrabold text-base bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                {reservations.filter(r => r.student_id !== null).length} / {config.num_rows * config.num_cols}
              </span>
            </div>

            {/* Blackboard Screen */}
            <div className="w-full bg-slate-800 text-slate-300 py-2.5 rounded-xl shadow-inner text-center text-xs font-bold">
              교탁 / 칠판 (BOARD)
            </div>

            {/* Grid display: Reserved is Gray, Vacant is White, Click does nothing */}
            <div 
              className="grid gap-2.5 p-3.5 bg-white rounded-2xl border border-slate-100 shadow-sm mx-auto w-full"
              style={{ 
                gridTemplateColumns: `repeat(${config.num_cols}, minmax(0, 1fr))`,
              }}
            >
              {reservations.map((seat) => {
                const isReserved = seat.student_id !== null;
                return (
                  <div
                    key={seat.seat_id}
                    className={`aspect-square rounded-lg border text-center flex flex-col justify-center p-1 transition-all ${
                      isReserved 
                        ? 'bg-slate-200 border-slate-300 text-slate-500 font-medium' 
                        : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  >
                    <span className="text-[9px] font-mono opacity-50 block">{seat.seat_id}</span>
                    <span className="text-[10px] font-bold truncate mt-0.5">
                      {isReserved ? seat.student_id : '공석'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: STUDENT MANAGEMENT (학생 관리) */}
        {activeTab === 'students' && (
          <div className="space-y-4">
            
            {/* Header section with add student button */}
            <div className="flex items-center justify-between pb-1">
              <h3 className="text-sm font-bold text-slate-700">등록된 학생 목록</h3>
              <button
                id="admin-add-student-toggle"
                onClick={() => {
                  setFormStudentId('');
                  setFormPassword('');
                  setError(null);
                  setIsAddModalOpen(true);
                }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1 shadow-md shadow-indigo-600/10 transition-all"
              >
                <Plus size={14} />
                <span>학생 추가</span>
              </button>
            </div>

            {/* List of students */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-100">
              {students.filter((student) => student.id !== 'admin').map((student) => (
                <div key={student.id} className="p-4 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 font-mono">{student.id}</h4>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5 font-mono">
                      PW: {student.password}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      id={`edit-student-${student.id}`}
                      onClick={() => {
                        setEditingStudent(student);
                        setFormPassword(student.password || '');
                        setError(null);
                      }}
                      className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-lg border border-slate-100 transition-all"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      id={`delete-student-${student.id}`}
                      onClick={() => handleDeleteStudent(student.id)}
                      disabled={student.id === 'admin'}
                      className={`p-1.5 rounded-lg border transition-all ${
                        student.id === 'admin' 
                          ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' 
                          : 'bg-red-50 hover:bg-red-100 text-red-500 border-red-100'
                      }`}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: CLASSROOM CONFIG (배치 설정) */}
        {activeTab === 'config' && (
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-slate-800 font-bold text-sm flex items-center gap-2">
                <Settings size={16} className="text-indigo-600" />
                <span>교실 책상 배열 수정</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1 break-keep leading-relaxed">
                자습실의 구조에 맞춰 행(Rows)과 열(Cols)의 크기를 변경하여 좌석 배치를 실시간으로 재설정합니다.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500">행 개수 (Rows)</label>
                <input
                  id="config-rows-input"
                  type="number"
                  min="1"
                  max="12"
                  value={configRows}
                  onChange={(e) => setConfigRows(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500">열 개수 (Cols)</label>
                <input
                  id="config-cols-input"
                  type="number"
                  min="1"
                  max="10"
                  value={configCols}
                  onChange={(e) => setConfigCols(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl text-xs text-slate-400 space-y-1 font-medium leading-relaxed">
              <p>• 현재 총 책상 개수: <span className="font-extrabold text-slate-600 font-mono">{config.num_rows * config.num_cols}개</span></p>
              <p>• 변경 후 예상 책상 개수: <span className="font-extrabold text-indigo-600 font-mono">{configRows * configCols}개</span></p>
            </div>

            {configError && (
              <div className="flex items-center gap-1.5 text-xs text-red-500 font-medium bg-red-50 p-2.5 rounded-lg border border-red-100">
                <AlertCircle size={14} className="shrink-0" />
                <span>{configError}</span>
              </div>
            )}

            {configSuccess && (
              <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-semibold bg-indigo-50 p-2.5 rounded-lg border border-indigo-100">
                <CheckCircle size={14} className="shrink-0" />
                <span>{configSuccess}</span>
              </div>
            )}

            <button
              id="config-apply-btn"
              onClick={handleApplyConfig}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-indigo-600/10 flex items-center justify-center gap-2"
            >
              <Save size={16} />
              <span>배치 설정 적용하기</span>
            </button>
          </div>
        )}

      </div>

      {/* MODAL: ADD STUDENT */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-6">
            <div className="absolute inset-0" onClick={() => setIsAddModalOpen(false)} />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative z-10 bg-white w-full max-w-sm rounded-2xl p-5 shadow-2xl border border-slate-100 space-y-4"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                <h3 className="text-slate-800 font-bold text-sm">신규 학생 추가</h3>
                <button
                  id="close-add-modal"
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600"
                >
                  취소
                </button>
              </div>

              <form onSubmit={handleAddStudentSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1 pl-1">아이디 (학번)</label>
                  <input
                    id="add-student-id"
                    type="text"
                    value={formStudentId}
                    onChange={(e) => setFormStudentId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="예: student4"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1 pl-1">비밀번호</label>
                  <input
                    id="add-student-password"
                    type="password"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="초기 설정 비밀번호"
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-1.5 text-xs text-red-500 font-medium bg-red-50 p-2.5 rounded-lg border border-red-100">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {success && (
                  <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-semibold bg-indigo-50 p-2.5 rounded-lg border border-indigo-100">
                    <CheckCircle size={14} className="shrink-0" />
                    <span>{success}</span>
                  </div>
                )}

                <button
                  id="add-student-submit"
                  type="submit"
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-indigo-600/10"
                >
                  학생 추가 완료 (확인)
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: EDIT STUDENT */}
      <AnimatePresence>
        {editingStudent !== null && (
          <div className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-6">
            <div className="absolute inset-0" onClick={() => setEditingStudent(null)} />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative z-10 bg-white w-full max-w-sm rounded-2xl p-5 shadow-2xl border border-slate-100 space-y-4"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                <h3 className="text-slate-800 font-bold text-sm">학생 정보 편집</h3>
                <button
                  id="close-edit-modal"
                  onClick={() => setEditingStudent(null)}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600"
                >
                  취소
                </button>
              </div>

              <form onSubmit={handleEditStudentSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1 pl-1">아이디 (ID)</label>
                  <input
                    type="text"
                    value={editingStudent.id}
                    disabled
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl py-3 px-4 text-slate-400 text-sm font-mono cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1 pl-1">새 비밀번호 (Password)</label>
                  <input
                    id="edit-student-password"
                    type="password"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="변경할 비밀번호 입력"
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-1.5 text-xs text-red-500 font-medium bg-red-50 p-2.5 rounded-lg border border-red-100">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {success && (
                  <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-semibold bg-indigo-50 p-2.5 rounded-lg border border-indigo-100">
                    <CheckCircle size={14} className="shrink-0" />
                    <span>{success}</span>
                  </div>
                )}

                <button
                  id="edit-student-submit"
                  type="submit"
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-indigo-600/10"
                >
                  변경 정보 저장 (확인)
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADMIN LOGOUT CONFIRMATION MODAL */}
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
                  관리자 시스템에서 로그아웃 하시겠습니까?
                </p>
              </div>
              <div className="flex w-full gap-2.5">
                <button
                  id="admin-cancel-logout-btn"
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl text-xs transition-all"
                >
                  취소
                </button>
                <button
                  id="admin-confirm-logout-btn"
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

      {/* STUDENT DELETION CONFIRMATION MODAL */}
      <AnimatePresence>
        {studentToDelete !== null && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-xs">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-xs rounded-2xl p-5 shadow-2xl border border-slate-100 flex flex-col items-center text-center space-y-4 shadow-slate-950/20"
            >
              <div className="w-11 h-11 rounded-full bg-red-50 flex items-center justify-center text-red-500">
                <Trash2 size={20} />
              </div>
              <div className="space-y-1">
                <h3 className="text-slate-900 font-bold text-base">학생 삭제 확인</h3>
                <p className="text-slate-500 text-xs break-keep">
                  정말로 <span className="font-bold text-red-500 font-mono">{studentToDelete}</span> 학생을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                </p>
              </div>
              <div className="flex w-full gap-2.5">
                <button
                  id="admin-cancel-delete-btn"
                  onClick={() => setStudentToDelete(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl text-xs transition-all"
                >
                  취소
                </button>
                <button
                  id="admin-confirm-delete-btn"
                  onClick={handleConfirmDeleteStudent}
                  className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl text-xs shadow-md shadow-red-500/10 transition-all"
                >
                  삭제
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
