import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  Building2, 
  Phone, 
  AlertCircle, 
  CheckCircle2, 
  LogIn, 
  UserPlus, 
  Clock,
  KeyRound,
  Info
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { HOSPITAL_DEPARTMENTS } from '../../data/mockData';
import { UserRole } from '../../types';

export const AuthModal: React.FC<{ isOpen: boolean; onClose?: () => void }> = ({ isOpen, onClose }) => {
  const { login, registerUser, currentUser } = useApp();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  // Login fields
  const [loginUsername, setLoginUsername] = useState('admin');
  const [loginPassword, setLoginPassword] = useState('admin1234');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Register fields
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regDepartment, setRegDepartment] = useState('3. ผู้ป่วยนอก');
  const [regRole, setRegRole] = useState<UserRole>('department_staff');
  const [regPhone, setRegPhone] = useState('');
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen && currentUser) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsSubmitting(true);

    const result = login(loginUsername.trim(), loginPassword);
    setIsSubmitting(false);

    if (!result.success) {
      setLoginError(result.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    } else {
      if (onClose) onClose();
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    if (!regFullName.trim() || !regUsername.trim() || !regPassword) {
      setRegError('กรุณากรอกข้อมูลให้ครบถ้วนทุกช่อง');
      return;
    }

    if (regPassword.length < 4) {
      setRegError('รหัสผ่านต้องมีความยาวอย่างน้อย 4 ตัวอักษร');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegError('รหัสผ่านยืนยันไม่ตรงกัน');
      return;
    }

    setIsSubmitting(true);
    const result = await registerUser({
      fullName: regFullName.trim(),
      username: regUsername.trim().toLowerCase(),
      password: regPassword,
      department: regDepartment,
      role: regRole,
      phone: regPhone.trim() || '034-595021'
    });
    setIsSubmitting(false);

    if (!result.success) {
      setRegError(result.message || 'ไม่สามารถสมัครสมาชิกได้ ชื่อผู้ใช้นี้อาจมีอยู่ในระบบแล้ว');
    } else {
      setRegSuccess(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Branding */}
        <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 text-white p-6 relative overflow-hidden">
          <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center gap-3.5 relative z-10">
            <div className="w-14 h-14 bg-white rounded-2xl p-1.5 shadow-md shrink-0 flex items-center justify-center">
              <img
                src="/public/assets/aistudio/Logo_SK_-_______26693d5e.png"
                alt="Logo SK"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div>
              <span className="inline-block text-[10px] tracking-wider font-semibold text-emerald-200 uppercase bg-emerald-950/60 px-2 py-0.5 rounded-full mb-1">
                กระทรวงสาธารณสุข · สสจ.กาญจนบุรี
              </span>
              <h2 className="text-base sm:text-lg font-bold font-display leading-tight">
                โรงพยาบาลสังขละบุรี
              </h2>
              <p className="text-xs text-emerald-100/90 font-medium">
                ระบบซ่อมบำรุงครุภัณฑ์และบริหารจัดการงานซ่อม (CMMS)
              </p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-1 bg-emerald-950/70 p-1 rounded-xl mt-5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => { setMode('login'); setLoginError(null); }}
              className={`py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                mode === 'login'
                  ? 'bg-white text-emerald-950 shadow-xs'
                  : 'text-emerald-200 hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>เข้าสู่ระบบ (Sign In)</span>
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setRegError(null); setRegSuccess(false); }}
              className={`py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                mode === 'register'
                  ? 'bg-white text-emerald-950 shadow-xs'
                  : 'text-emerald-200 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>สมัครเข้าใช้งาน (Register)</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {mode === 'login' ? (
            /* Login Form */
            <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
              
              {/* Default Admin Notice Pill */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-start gap-2.5 text-emerald-900">
                <KeyRound className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  <div className="font-bold text-emerald-950 mb-0.5">
                    🔑 บัญชีผู้ดูแลระบบตั้งต้น (Default Admin):
                  </div>
                  <div>ชื่อผู้ใช้ (Username): <strong className="font-mono bg-emerald-100/80 px-1.5 py-0.5 rounded text-emerald-800">admin</strong></div>
                  <div className="mt-0.5">รหัสผ่าน (Password): <strong className="font-mono bg-emerald-100/80 px-1.5 py-0.5 rounded text-emerald-800">admin1234</strong></div>
                </div>
              </div>

              {loginError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl flex items-start gap-2 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{loginError}</span>
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  ชื่อผู้ใช้ (Username) *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    placeholder="เช่น admin หรือชื่อผู้ใช้ของคุณ"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  รหัสผ่าน (Password) *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="กรอกรหัสผ่านของคุณ"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 active:scale-99 text-white font-bold rounded-xl transition shadow-md shadow-emerald-700/20 cursor-pointer flex items-center justify-center gap-2 text-sm"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{isSubmitting ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}</span>
                </button>
              </div>

              <div className="text-center pt-2">
                <p className="text-[11px] text-slate-500">
                  ยังไม่มีบัญชีใช้งาน?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('register'); setRegError(null); setRegSuccess(false); }}
                    className="text-emerald-700 font-bold hover:underline cursor-pointer"
                  >
                    สมัครขอเข้าใช้งานที่นี่
                  </button>
                </p>
              </div>
            </form>
          ) : regSuccess ? (
            /* Registration Success View */
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <Clock className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 font-display">
                  ส่งคำขอสมัครสมาชิกสำเร็จแล้ว!
                </h3>
                <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto leading-relaxed">
                  บัญชีของคุณ <strong className="text-emerald-800 font-semibold">{regUsername}</strong> ได้รับการบันทึกลงระบบและอยู่ระหว่าง
                  <span className="font-bold text-amber-700"> รอการตรวจสอบและอนุมัติจากสิทธิแอดมิน (Admin)</span>
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-left text-xs text-slate-600 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 mb-1">
                  <Info className="w-4 h-4 text-emerald-600" />
                  <span>ขั้นตอนการเปิดใช้งาน:</span>
                </div>
                <p>1. ข้อมูลการสมัครถูกบันทึกลงฐานข้อมูล Firebase Real-time ทันที</p>
                <p>2. ผู้ดูแลระบบสารสนเทศ (Admin) จะตรวจสอบและกดอนุมัติสิทธิ์ในระบบ</p>
                <p>3. เมื่อได้รับการอนุมัติแล้ว ท่านจะสามารถเข้าสู่ระบบด้วยรหัสผ่านที่ตั้งไว้ได้ทันที</p>
              </div>

              <button
                type="button"
                onClick={() => { setMode('login'); setRegSuccess(false); setLoginUsername(regUsername); }}
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl transition cursor-pointer text-xs"
              >
                กลับไปหน้าเข้าสู่ระบบ
              </button>
            </div>
          ) : (
            /* Registration Form */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs">
              <div className="bg-blue-50 border border-blue-200 text-blue-900 p-2.5 rounded-xl flex items-start gap-2 text-[11px] leading-snug">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  <strong>การสมัครเข้าใช้งาน:</strong> จำเป็นต้องได้รับการอนุมัติจากสิทธิแอดมินก่อนเท่านั้น จึงจะเริ่มใช้งานระบบได้
                </span>
              </div>

              {regError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 p-2.5 rounded-xl flex items-start gap-2 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{regError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    ชื่อ-นามสกุล จริง *
                  </label>
                  <input
                    type="text"
                    required
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="เช่น พว.สมหญิง วงศ์ใจ"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    ชื่อผู้ใช้ (Username ภาษาอังกฤษ) *
                  </label>
                  <input
                    type="text"
                    required
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="เช่น somying.er"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    รหัสผ่าน (Password) *
                  </label>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="อย่างน้อย 4 ตัวอักษร"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    ยืนยันรหัสผ่าน *
                  </label>
                  <input
                    type="password"
                    required
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="กรอกรหัสผ่านซ้ำอีกครั้ง"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    แผนก/หน่วยงานที่สังกัด *
                  </label>
                  <select
                    value={regDepartment}
                    onChange={(e) => setRegDepartment(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none text-xs"
                  >
                    {HOSPITAL_DEPARTMENTS.filter(d => d !== 'ทั้งหมด').map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    ประเภทสิทธิ์ที่ขอ *
                  </label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none text-xs"
                  >
                    <option value="department_staff">เจ้าหน้าที่ประจำแผนก/พยาบาล (แจ้งซ่อมและตรวจรับ)</option>
                    <option value="technician">ช่างเทคนิค/วิศวกรซ่อมบำรุง (รับงานและบันทึกผล)</option>
                    <option value="supervisor">หัวหน้ากลุ่มงาน/ผู้ตรวจการ (อนุมัติงานซ่อม)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  เบอร์โทรศัพท์ติดต่อ / เบอร์ต่อภายใน *
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="เช่น 081-xxx-xxxx หรือ ต่อ 105"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl transition shadow-md shadow-emerald-700/20 cursor-pointer flex items-center justify-center gap-2 text-xs"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{isSubmitting ? 'กำลังส่งข้อมูล...' : 'ส่งคำขอสมัครสมาชิก (รอแอดมินอนุมัติ)'}</span>
                </button>
              </div>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => { setMode('login'); setRegError(null); }}
                  className="text-slate-500 hover:text-slate-800 text-[11px] underline cursor-pointer"
                >
                  มีบัญชีอยู่แล้ว? กลับไปหน้าเข้าสู่ระบบ
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
