import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Wrench, 
  CheckCircle2, 
  Clock, 
  Phone, 
  Mail, 
  ShieldCheck, 
  Briefcase, 
  ArrowRight,
  TrendingUp,
  UserCheck,
  Shield,
  KeyRound,
  UserPlus,
  Search,
  Filter,
  Check,
  X,
  Lock,
  Building2,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Sliders,
  CheckSquare,
  Square,
  Settings2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Technician, SystemUser, UserRole } from '../../types';

export const WorkforceManagement: React.FC = () => {
  const { 
    technicians, 
    systemUsers, 
    workOrders, 
    assets,
    currentUser,
    updateTechStatus, 
    updateUserStatus,
    approveUser,
    updateUserPermissions,
    rejectUser,
    clearAllSampleData,
    loadSampleData,
    setSelectedOrderForDetail 
  } = useApp();

  const [mainView, setMainView] = useState<'users' | 'technicians'>('users');
  const [selectedTechId, setSelectedTechId] = useState<string>(technicians[0]?.id || '');
  const [searchUserQuery, setSearchUserQuery] = useState<string>('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ทั้งหมด');
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState<boolean>(false);
  const [dbNotice, setDbNotice] = useState<string | null>(null);

  // In-app Database clear confirmation modal state (replaces window.confirm)
  const [isClearDbConfirmOpen, setIsClearDbConfirmOpen] = useState<boolean>(false);
  const [isLoadSampleConfirmOpen, setIsLoadSampleConfirmOpen] = useState<boolean>(false);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);

  // Function permissions management modal state
  const [permissionModalUser, setPermissionModalUser] = useState<SystemUser | null>(null);
  const [selectedRoleForPerm, setSelectedRoleForPerm] = useState<UserRole>('department_staff');
  const [selectedMenusForPerm, setSelectedMenusForPerm] = useState<('dashboard' | 'assets' | 'inventory' | 'work-orders' | 'pm-calibration' | 'reports' | 'workforce')[]>([]);

  const pendingUsers = useMemo(() => {
    return systemUsers.filter(u => u.status === 'pending');
  }, [systemUsers]);

  // New user form state
  const [newUserData, setNewUserData] = useState<{
    username: string;
    fullName: string;
    role: UserRole;
    department: string;
    phone: string;
    email: string;
  }>({
    username: '',
    fullName: '',
    role: 'technician',
    department: '1. บริหารทั่วไป',
    phone: '',
    email: ''
  });

  const selectedTech = technicians.find(t => t.id === selectedTechId) || technicians[0];

  // Active tickets assigned to this selected technician
  const assignedTickets = workOrders.filter(
    w => (w.assignedTechId === selectedTech?.id || w.assignedTechName === selectedTech?.name) &&
         w.status !== 'completed' && w.status !== 'cancelled'
  );

  const completedTickets = workOrders.filter(
    w => (w.assignedTechId === selectedTech?.id || w.assignedTechName === selectedTech?.name) &&
         w.status === 'completed'
  );

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return systemUsers.filter(u => {
      const matchRole = selectedRoleFilter === 'ทั้งหมด' || u.role === selectedRoleFilter;
      const matchQuery = !searchUserQuery ||
        u.fullName.toLowerCase().includes(searchUserQuery.toLowerCase()) ||
        u.username.toLowerCase().includes(searchUserQuery.toLowerCase()) ||
        u.department.toLowerCase().includes(searchUserQuery.toLowerCase());
      return matchRole && matchQuery;
    });
  }, [systemUsers, selectedRoleFilter, searchUserQuery]);

  // User Stats
  const userStats = useMemo(() => {
    const total = systemUsers.length;
    const active = systemUsers.filter(u => u.status === 'active').length;
    const admins = systemUsers.filter(u => u.role === 'super_admin' || u.role === 'supervisor').length;
    const techs = systemUsers.filter(u => u.role === 'technician').length;
    const depts = systemUsers.filter(u => u.role === 'department_staff').length;

    return { total, active, admins, techs, depts };
  }, [systemUsers]);

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserData.fullName || !newUserData.username) return;

    const newUser: SystemUser = {
      id: `usr-${Date.now().toString().slice(-4)}`,
      username: newUserData.username,
      fullName: newUserData.fullName,
      role: newUserData.role,
      roleName: newUserData.role === 'super_admin' ? 'ผู้ดูแลระบบสารสนเทศสูงสุด (Super Admin)' :
                newUserData.role === 'supervisor' ? 'หัวหน้างานซ่อมบำรุง (Supervisor)' :
                newUserData.role === 'technician' ? 'นายช่างเทคนิค/วิศวกรชีวการแพทย์' : 'เจ้าหน้าที่แผนกผู้แจ้งซ่อม',
      department: newUserData.department,
      phone: newUserData.phone || '034-595021',
      email: newUserData.email || `${newUserData.username}@skh.moph.go.th`,
      status: 'active',
      lastLogin: 'เพิ่งสร้างบัญชี',
      permissions: newUserData.role === 'super_admin' ? ['all_access'] : ['repair_manage', 'asset_view']
    };

    systemUsers.push(newUser);
    setIsAddUserModalOpen(false);
    setNewUserData({
      username: '',
      fullName: '',
      role: 'technician',
      department: '1. บริหารทั่วไป',
      phone: '',
      email: ''
    });
  };

  const AVAILABLE_SYSTEM_MENUS = [
    { id: 'dashboard' as const, label: '01. แดชบอร์ดภาพรวม', sub: 'KPIs, กราฟแนวโน้มงานซ่อม, สถิติภาพรวม' },
    { id: 'assets' as const, label: '02. ทะเบียนครุภัณฑ์', sub: 'ค้นหา, ทะเบียนคุม สธ., QR Code, ประวัติการซ่อม' },
    { id: 'inventory' as const, label: '03. คลังอะไหล่', sub: 'สต็อกอะไหล่, เบิกจ่าย, จุดสั่งซื้อขั้นต่ำ' },
    { id: 'work-orders' as const, label: '04. ใบแจ้งซ่อม', sub: 'แจ้งซ่อมใหม่, ติดตามสถานะ, บันทึกการปิดงาน' },
    { id: 'pm-calibration' as const, label: '05. บำรุงรักษาเชิงป้องกัน', sub: 'แผน PM, สอบเทียบเครื่องมือแพทย์, ล้างแอร์' },
    { id: 'reports' as const, label: '06. ระบบรายงาน', sub: '3 รายงานสรุปผลงานซ่อม, อะไหล่คงเหลือ, แผนจัดซื้อใหม่' },
    { id: 'workforce' as const, label: '07. จัดการผู้ใช้ระบบ', sub: 'จัดการบัญชี, กำหนดสิทธิ์ฟังก์ชั่น (สงวนเฉพาะ Super Admin)' },
  ];

  const handleOpenPermissionModal = (user: SystemUser) => {
    setPermissionModalUser(user);
    setSelectedRoleForPerm(user.role || 'department_staff');
    if (user.allowedMenus && user.allowedMenus.length > 0) {
      setSelectedMenusForPerm(user.allowedMenus);
    } else {
      if (user.role === 'super_admin') {
        setSelectedMenusForPerm(['dashboard', 'assets', 'inventory', 'work-orders', 'pm-calibration', 'reports', 'workforce']);
      } else if (user.role === 'supervisor') {
        setSelectedMenusForPerm(['dashboard', 'assets', 'inventory', 'work-orders', 'pm-calibration', 'reports']);
      } else if (user.role === 'technician') {
        setSelectedMenusForPerm(['dashboard', 'assets', 'inventory', 'work-orders', 'pm-calibration']);
      } else {
        setSelectedMenusForPerm(['dashboard', 'assets', 'work-orders']);
      }
    }
  };

  const handleToggleMenuPerm = (menuId: 'dashboard' | 'assets' | 'inventory' | 'work-orders' | 'pm-calibration' | 'reports' | 'workforce') => {
    setSelectedMenusForPerm(prev => 
      prev.includes(menuId) ? prev.filter(m => m !== menuId) : [...prev, menuId]
    );
  };

  const handleApplyPreset = (preset: 'staff' | 'tech' | 'supervisor' | 'admin') => {
    if (preset === 'staff') {
      setSelectedRoleForPerm('department_staff');
      setSelectedMenusForPerm(['dashboard', 'assets', 'work-orders']);
    } else if (preset === 'tech') {
      setSelectedRoleForPerm('technician');
      setSelectedMenusForPerm(['dashboard', 'assets', 'inventory', 'work-orders', 'pm-calibration']);
    } else if (preset === 'supervisor') {
      setSelectedRoleForPerm('supervisor');
      setSelectedMenusForPerm(['dashboard', 'assets', 'inventory', 'work-orders', 'pm-calibration', 'reports']);
    } else {
      setSelectedRoleForPerm('super_admin');
      setSelectedMenusForPerm(['dashboard', 'assets', 'inventory', 'work-orders', 'pm-calibration', 'reports', 'workforce']);
    }
  };

  const handleSavePermissions = async () => {
    if (!permissionModalUser) return;
    setIsActionLoading(true);
    if (permissionModalUser.status === 'pending') {
      await approveUser(permissionModalUser.id, selectedMenusForPerm, selectedRoleForPerm);
      setDbNotice(`อนุมัติสิทธิ์และกำหนดฟังก์ชั่นให้ ${permissionModalUser.fullName} สำเร็จแล้ว`);
    } else {
      await updateUserPermissions(permissionModalUser.id, selectedMenusForPerm, selectedRoleForPerm);
      setDbNotice(`อัปเดตสิทธิ์ฟังก์ชั่นของ ${permissionModalUser.fullName} สำเร็จแล้ว`);
    }
    setIsActionLoading(false);
    setPermissionModalUser(null);
    setTimeout(() => setDbNotice(null), 5000);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-display text-slate-900 tracking-tight">
                จัดการผู้ใช้ระบบและทีมช่าง (User & Workforce Management)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                บริหารจัดการบัญชีผู้ใช้งานระบบ สิทธิ์การเข้าถึงข้อมูล (RBAC) และความพร้อมทีมช่างโรงพยาบาลสังขละบุรี
              </p>
            </div>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl text-xs self-start md:self-auto font-bold font-display">
          <button
            onClick={() => setMainView('users')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
              mainView === 'users'
                ? 'bg-white text-purple-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <KeyRound className="w-4 h-4 text-purple-600" />
            <span>บัญชีผู้ใช้งาน ({systemUsers.length})</span>
          </button>
          <button
            onClick={() => setMainView('technicians')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
              mainView === 'technicians'
                ? 'bg-white text-purple-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wrench className="w-4 h-4 text-indigo-600" />
            <span>ทีมช่าง & ภาระงาน ({technicians.length})</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: จัดการบัญชีผู้ใช้ระบบ (User Accounts & Role Permissions)          */}
      {/* ========================================================================= */}
      {mainView === 'users' && (
        <div className="space-y-6">

          {/* Pending Approval Requests Panel (สิทธิแอดมินอนุมัติ) */}
          {pendingUsers.length > 0 && (
            <div className="bg-gradient-to-r from-amber-500/10 via-amber-50 to-orange-50 border-2 border-amber-300 rounded-3xl p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm font-display flex items-center gap-2">
                      <span>คำขอสมัครเข้าใช้งานระบบ รอการอนุมัติจากแอดมิน</span>
                      <span className="bg-amber-600 text-white text-[11px] px-2 py-0.5 rounded-full font-mono font-bold">
                        {pendingUsers.length} คำขอ
                      </span>
                    </h3>
                    <p className="text-xs text-amber-900/80">
                      ผู้ใช้งานเหล่านี้จะไม่สามารถเข้าสู่ระบบได้จนกว่าผู้ดูแลระบบจะกดอนุมัติสิทธิ์
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pendingUsers.map((pUser) => (
                  <div 
                    key={pUser.id}
                    className="bg-white p-4 rounded-2xl border border-amber-200 shadow-2xs flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-sm">
                          {pUser.fullName}
                        </span>
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          รออนุมัติ
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 mt-1 space-y-0.5">
                        <p>ชื่อผู้ใช้: <strong className="font-mono text-slate-800">{pUser.username}</strong></p>
                        <p>แผนก/หน่วยงาน: <strong className="text-slate-800">{pUser.department}</strong></p>
                        <p>สิทธิ์ที่ขอ: <strong className="text-slate-800">{pUser.roleName}</strong></p>
                        <p>เบอร์โทรศัพท์: <strong className="font-mono text-slate-800">{pUser.phone}</strong></p>
                        {pUser.registeredDate && (
                          <p className="text-[10px] text-slate-400">ยื่นคำขอเมื่อ: {pUser.registeredDate}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => handleOpenPermissionModal(pUser)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs transition shadow-xs cursor-pointer"
                        title="กำหนดว่าผู้ใช้นี้เข้าถึงฟังก์ชั่นใดได้บ้างก่อนอนุมัติ"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>กำหนดสิทธิ์ฟังก์ชั่น & อนุมัติ</span>
                      </button>
                      <button
                        onClick={() => approveUser(pUser.id)}
                        className="flex items-center justify-center gap-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-xs cursor-pointer"
                        title="อนุมัติสิทธิ์เข้าใช้งานทันที"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>อนุมัติ</span>
                      </button>
                      <button
                        onClick={() => rejectUser(pUser.id)}
                        className="flex items-center justify-center gap-1 py-2 px-2.5 border border-slate-200 text-slate-500 hover:bg-rose-50 hover:text-rose-700 rounded-xl text-xs transition cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>ปฏิเสธ</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Database Tools Card (ล้างข้อมูลตัวอย่าง / ฐานข้อมูลเปล่าสำหรับโรงพยาบาลจริง) */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-slate-900 text-sm font-display">
                  จัดการฐานข้อมูลระบบ (Database Reset & Clear Tools)
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                สถานะปัจจุบัน: ครุภัณฑ์ <strong>{assets.length}</strong> รายการ | ใบแจ้งซ่อม <strong>{workOrders.length}</strong> รายการ
                {assets.length === 0 && workOrders.length === 0 && (
                  <span className="text-emerald-700 font-bold ml-1.5 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    ✓ ฐานข้อมูลว่างเปล่า 100% พร้อมบันทึกข้อมูลจริง
                  </span>
                )}
              </p>
              {dbNotice && (
                <div className="mt-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 inline-block animate-in fade-in">
                  {dbNotice}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsClearDbConfirmOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 active:scale-98 border border-rose-200 rounded-xl transition cursor-pointer shadow-2xs"
                title="ล้างข้อมูลตัวอย่างทั้งหมดเป็นฐานเปล่า"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>ล้างข้อมูลเป็นฐานเปล่า</span>
              </button>

              <button
                type="button"
                onClick={() => setIsLoadSampleConfirmOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 active:scale-98 border border-slate-200 rounded-xl transition cursor-pointer"
                title="โหลดข้อมูลตัวอย่างสำหรับการทดสอบ"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
                <span>โหลดตัวอย่างทดสอบ</span>
              </button>
            </div>
          </div>

          {/* User Metrics Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500 font-display">ผู้ใช้งานในระบบทั้งหมด</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 font-mono tabular-nums">{userStats.total}</span>
                <span className="text-xs text-slate-500">บัญชี</span>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>พร้อมใช้งาน {userStats.active}</span>
                <span className="text-emerald-700 font-bold">100% Active</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500 font-display">ผู้ดูแลระบบ & หัวหน้างาน</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-purple-700 font-mono tabular-nums">{userStats.admins}</span>
                <span className="text-xs text-slate-500">ท่าน</span>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                Super Admin & Supervisor
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500 font-display">วิศวกร & ช่างเทคนิค</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-blue-700 font-mono tabular-nums">{userStats.techs}</span>
                <span className="text-xs text-slate-500">นาย</span>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                ปฏิบัติการซ่อมบำรุง & PM
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500 font-display">เจ้าหน้าที่ 17 แผนก</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-800 font-mono tabular-nums">{userStats.depts}</span>
                <span className="text-xs text-slate-500">ท่าน</span>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                ผู้แจ้งซ่อมและตรวจรับงาน
              </div>
            </div>
          </div>

          {/* User Table & Search Toolbar */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="ค้นหาชื่อ, username หรือแผนก..."
                    value={searchUserQuery}
                    onChange={(e) => setSearchUserQuery(e.target.value)}
                    className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs w-60 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <select
                  value={selectedRoleFilter}
                  onChange={(e) => setSelectedRoleFilter(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="ทั้งหมด">บทบาททั้งหมด</option>
                  <option value="super_admin">ผู้ดูแลระบบสูงสุด (Super Admin)</option>
                  <option value="supervisor">หัวหน้างานซ่อมบำรุง (Supervisor)</option>
                  <option value="technician">ช่างเทคนิค/วิศวกร (Technician)</option>
                  <option value="department_staff">บุคลากรประจำแผนก (Department Staff)</option>
                </select>
              </div>

              <button
                onClick={() => setIsAddUserModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition shadow-xs cursor-pointer self-start sm:self-auto"
              >
                <UserPlus className="w-4 h-4" />
                <span>เพิ่มผู้ใช้งานระบบ</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">ชื่อ - นามสกุล / ชื่อผู้ใช้</th>
                    <th className="py-3 px-4">บทบาทในระบบ</th>
                    <th className="py-3 px-4">แผนกต้นสังกัด</th>
                    <th className="py-3 px-4">เบอร์โทรศัพท์ / อีเมล</th>
                    <th className="py-3 px-4">สถานะบัญชี</th>
                    <th className="py-3 px-4">เข้าสู่ระบบล่าสุด</th>
                    <th className="py-3 px-4 text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                            {user.fullName.slice(0, 2)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{user.fullName}</div>
                            <div className="text-[11px] text-slate-400 font-mono">@{user.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          user.role === 'super_admin'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : user.role === 'supervisor'
                            ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                            : user.role === 'technician'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {user.roleName}
                        </span>
                        {/* Function Badges */}
                        <div className="mt-1 flex flex-wrap gap-1 max-w-[200px]">
                          {(user.allowedMenus && user.allowedMenus.length > 0 
                            ? user.allowedMenus 
                            : user.role === 'super_admin'
                            ? ['dashboard', 'assets', 'inventory', 'work-orders', 'pm-calibration', 'reports', 'workforce']
                            : user.role === 'supervisor'
                            ? ['dashboard', 'assets', 'inventory', 'work-orders', 'pm-calibration', 'reports']
                            : user.role === 'technician'
                            ? ['dashboard', 'assets', 'inventory', 'work-orders', 'pm-calibration']
                            : ['dashboard', 'assets', 'work-orders']
                          ).map(m => (
                            <span key={m} className="bg-slate-100 text-slate-600 text-[9px] px-1.5 py-0.2 rounded font-medium">
                              {m === 'dashboard' ? 'แดชบอร์ด' : m === 'assets' ? 'ครุภัณฑ์' : m === 'inventory' ? 'คลังอะไหล่' : m === 'work-orders' ? 'แจ้งซ่อม' : m === 'pm-calibration' ? 'บำรุงรักษา' : m === 'reports' ? 'รายงาน' : 'ผู้ใช้'}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {user.department}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <div>{user.phone}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{user.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          user.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : user.status === 'pending'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {user.status === 'active' ? '● ปกติ' : user.status === 'pending' ? '● รออนุมัติ' : '✕ ระงับการใช้งาน'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {user.lastLogin || user.registeredDate || '-'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {user.status === 'pending' ? (
                            <>
                              <button
                                onClick={() => handleOpenPermissionModal(user)}
                                className="text-xs font-bold px-2.5 py-1 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition cursor-pointer flex items-center gap-1 shadow-2xs"
                                title="กำหนดสิทธิ์ฟังก์ชั่นและอนุมัติ"
                              >
                                <Sliders className="w-3 h-3" />
                                <span>กำหนดสิทธิ์</span>
                              </button>
                              <button
                                onClick={() => approveUser(user.id)}
                                className="text-xs font-bold px-2 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition cursor-pointer"
                              >
                                อนุมัติ
                              </button>
                              <button
                                onClick={() => rejectUser(user.id)}
                                className="text-xs font-medium px-2 py-1 rounded-lg border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                              >
                                ปฏิเสธ
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleOpenPermissionModal(user)}
                                className="text-xs font-bold px-2 py-1 rounded-lg border border-purple-200 text-purple-700 bg-purple-50/60 hover:bg-purple-100 transition cursor-pointer flex items-center gap-1"
                                title="กำหนดฟังก์ชั่นที่เข้าใช้งานได้"
                              >
                                <Settings2 className="w-3 h-3" />
                                <span>สิทธิ์ฟังก์ชั่น</span>
                              </button>
                              <button
                                onClick={() => updateUserStatus(user.id, user.status === 'active' ? 'suspended' : 'active')}
                                className={`text-xs font-semibold px-2 py-1 rounded-lg border transition cursor-pointer ${
                                  user.status === 'active'
                                    ? 'text-rose-600 hover:bg-rose-50 border-rose-200'
                                    : 'text-emerald-700 hover:bg-emerald-50 border-emerald-200'
                                }`}
                              >
                                {user.status === 'active' ? 'ระงับ' : 'เปิด'}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: ทีมช่างและภาระงาน (Technicians & Workload)                        */}
      {/* ========================================================================= */}
      {mainView === 'technicians' && (
        <div className="space-y-6">
          {/* Technicians Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {technicians.map((tech) => {
              const isSelected = tech.id === selectedTech?.id;
              const currentActiveCount = workOrders.filter(
                w => (w.assignedTechId === tech.id || w.assignedTechName === tech.name) &&
                     w.status !== 'completed' && w.status !== 'cancelled'
              ).length;

              return (
                <div
                  key={tech.id}
                  onClick={() => setSelectedTechId(tech.id)}
                  className={`bg-white p-5 rounded-2xl border cursor-pointer transition shadow-2xs ${
                    isSelected
                      ? 'border-indigo-600 ring-2 ring-indigo-600/20 bg-indigo-50/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl ${tech.avatarColor} text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs`}>
                        {tech.name.split(' ')[1]?.slice(0, 2) || tech.name.slice(0, 2)}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900 leading-tight">
                          {tech.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                          {tech.roleTitle}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Status Selector */}
                  <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <select
                      value={tech.status}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => updateTechStatus(tech.id, e.target.value as any)}
                      className={`text-[11px] font-semibold rounded-lg px-2 py-0.5 border cursor-pointer ${
                        tech.status === 'available'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : tech.status === 'busy'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      <option value="available">● พร้อมรับงาน</option>
                      <option value="busy">● ติดหน้างาน</option>
                      <option value="leave">● ลางาน / อบรม</option>
                    </select>

                    <div className="text-right">
                      <span className="text-[11px] text-slate-500 font-medium">งานค้างซ่อม: </span>
                      <span className={`font-mono font-bold ${currentActiveCount > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                        {currentActiveCount} งาน
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed Selected Technician Panel */}
          {selectedTech && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sm:p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3.5">
                  <div className={`w-12 h-12 rounded-2xl ${selectedTech.avatarColor} text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0`}>
                    {selectedTech.name.split(' ')[1]?.slice(0, 2) || selectedTech.name.slice(0, 2)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900 font-display">
                        {selectedTech.name}
                      </h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                        {selectedTech.roleTitle}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {selectedTech.phone}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1 font-mono">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        {selectedTech.email}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-center">
                    <div className="text-amber-800 font-bold text-base">{assignedTickets.length}</div>
                    <div className="text-[10px] text-amber-700 font-sans">กำลังดำเนินการ</div>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-center">
                    <div className="text-emerald-800 font-bold text-base">{completedTickets.length}</div>
                    <div className="text-[10px] text-emerald-700 font-sans">ซ่อมเสร็จสมบูรณ์</div>
                  </div>
                </div>
              </div>

              {/* Active Jobs for Selected Tech */}
              <div>
                <h4 className="font-bold text-slate-900 text-xs font-display mb-3">
                  ภาระงานที่มอบหมายอยู่ในปัจจุบัน ({assignedTickets.length} รายการ)
                </h4>

                {assignedTickets.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                    ช่างท่านนี้ไม่มีงานซ่อมค้างอยู่ พร้อมรับมอบหมายงานใหม่
                  </div>
                ) : (
                  <div className="space-y-2">
                    {assignedTickets.map(order => (
                      <div
                        key={order.id}
                        onClick={() => setSelectedOrderForDetail(order)}
                        className="p-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 transition flex items-center justify-between gap-3 text-xs cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-slate-900">{order.orderNumber}</span>
                          <div>
                            <span className="font-bold text-slate-800">{order.assetName}</span>
                            <span className="text-slate-400 ml-2 font-mono text-[11px]">{order.assetCode}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-slate-500">{order.department}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            order.priority === 'emergency' ? 'bg-rose-100 text-rose-800' :
                            order.priority === 'urgent' ? 'bg-amber-100 text-amber-800' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {order.priority === 'emergency' ? 'ฉุกเฉิน' : order.priority === 'urgent' ? 'เร่งด่วน' : 'ปกติ'}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add User Modal */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm font-display flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-purple-600" />
                <span>เพิ่มผู้ใช้งานระบบใหม่</span>
              </h3>
              <button
                onClick={() => setIsAddUserModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">ชื่อ - นามสกุล *</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น นายธนากร สุขเกษม"
                  value={newUserData.fullName}
                  onChange={(e) => setNewUserData({ ...newUserData, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ชื่อผู้ใช้ (Username) *</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น thanakorn.med"
                  value={newUserData.username}
                  onChange={(e) => setNewUserData({ ...newUserData, username: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">บทบาทและสิทธิ์ในระบบ (Role) *</label>
                <select
                  value={newUserData.role}
                  onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold"
                >
                  <option value="technician">ช่างเทคนิค / วิศวกร (Technician)</option>
                  <option value="supervisor">หัวหน้างานซ่อมบำรุง (Supervisor)</option>
                  <option value="department_staff">บุคลากรประจำแผนก (Department Staff)</option>
                  <option value="super_admin">ผู้ดูแลระบบสูงสุด (Super Admin)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">แผนกต้นสังกัด</label>
                <input
                  type="text"
                  placeholder="เช่น 1. บริหารทั่วไป หรือ 5. อุบัติเหตุฉุกเฉิน"
                  value={newUserData.department}
                  onChange={(e) => setNewUserData({ ...newUserData, department: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">เบอร์โทรศัพท์ติดต่อ</label>
                <input
                  type="text"
                  placeholder="เช่น 081-xxx-xxxx"
                  value={newUserData.phone}
                  onChange={(e) => setNewUserData({ ...newUserData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-xs cursor-pointer"
                >
                  บันทึกผู้ใช้ใหม่
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clear Database In-App Confirmation Modal (Zero window.confirm) */}
      {isClearDbConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 border border-rose-200">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base font-display">
                  ยืนยันล้างข้อมูลเป็นฐานเปล่า 100%
                </h3>
                <p className="text-xs text-rose-600 font-semibold">
                  การกระทำนี้จะล้างข้อมูลตัวอย่างทั้งหมด
                </p>
              </div>
            </div>

            <div className="text-xs text-slate-600 space-y-2 py-3 border-y border-slate-100">
              <p>ระบบจะทำการล้างข้อมูลตัวอย่างทั้งหมดดังต่อไปนี้:</p>
              <ul className="list-disc pl-5 space-y-1 text-slate-700 font-medium">
                <li>ลบรายการทะเบียนครุภัณฑ์ทั้งหมด ({assets.length} รายการ)</li>
                <li>ลบประวัติและใบแจ้งซ่อมทั้งหมด ({workOrders.length} รายการ)</li>
                <li>ล้างข้อมูลใน Firebase Cloud Firestore และหน่วยความจำ LocalStorage</li>
              </ul>
              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-amber-900 font-medium">
                💡 หลังจากล้างฐานข้อมูลแล้ว ระบบจะพร้อมสำหรับการบันทึกทะเบียนครุภัณฑ์และใบแจ้งซ่อมจริงของโรงพยาบาลสังขละบุรีทันที
              </div>
            </div>

            <div className="pt-4 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isActionLoading}
                onClick={() => setIsClearDbConfirmOpen(false)}
                className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={isActionLoading}
                onClick={async () => {
                  setIsActionLoading(true);
                  try {
                    await clearAllSampleData();
                    setDbNotice('✓ ทำการล้างข้อมูลเป็นฐานเปล่า 100% เรียบร้อยแล้ว พร้อมบันทึกข้อมูลจริง');
                    setTimeout(() => setDbNotice(null), 5000);
                  } finally {
                    setIsActionLoading(false);
                    setIsClearDbConfirmOpen(false);
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-rose-600/20 cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isActionLoading ? 'กำลังล้างฐานข้อมูล...' : 'ยืนยันล้างเป็นฐานเปล่า'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load Sample Data In-App Confirmation Modal */}
      {isLoadSampleConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 border border-slate-200">
            <div className="flex items-center gap-3 text-indigo-600 mb-3">
              <div className="w-11 h-11 rounded-2xl bg-indigo-100 flex items-center justify-center shrink-0">
                <RefreshCw className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base font-display">
                  โหลดข้อมูลตัวอย่างสำหรับการทดสอบ
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  เติมข้อมูลจำลองครุภัณฑ์การแพทย์และใบแจ้งซ่อม
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 py-3 border-y border-slate-100">
              ระบบจะนำเข้าตัวอย่างครุภัณฑ์การแพทย์ 8 รายการ และประวัติใบแจ้งซ่อม 7 รายการเพื่อใช้ในการทดสอบระบบและรายงาน
            </p>

            <div className="pt-4 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isActionLoading}
                onClick={() => setIsLoadSampleConfirmOpen(false)}
                className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={isActionLoading}
                onClick={async () => {
                  setIsActionLoading(true);
                  try {
                    await loadSampleData();
                    setDbNotice('✓ โหลดข้อมูลตัวอย่างทดสอบเรียบร้อยแล้ว');
                    setTimeout(() => setDbNotice(null), 5000);
                  } finally {
                    setIsActionLoading(false);
                    setIsLoadSampleConfirmOpen(false);
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-indigo-600/20 cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw className="w-4 h-4" />
                <span>{isActionLoading ? 'กำลังโหลด...' : 'ยืนยันโหลดข้อมูลตัวอย่าง'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Function Permissions & RBAC Modal (สิทธิแอดมินกำหนดฟังก์ชั่นให้ user) */}
      {permissionModalUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base font-display">
                    กำหนดสิทธิ์ฟังก์ชั่นการใช้งานระบบ (Function Access Control)
                  </h3>
                  <p className="text-xs text-slate-500">
                    ผู้ใช้: <strong className="text-slate-800">{permissionModalUser.fullName}</strong> (@{permissionModalUser.username})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPermissionModalUser(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mt-4 text-xs">
              {/* Role Selection */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5 font-display">
                  บทบาทหลักในระบบ (System Role)
                </label>
                <select
                  value={selectedRoleForPerm}
                  onChange={(e) => setSelectedRoleForPerm(e.target.value as UserRole)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold text-xs"
                >
                  <option value="department_staff">บุคลากรประจำแผนก (Department Staff)</option>
                  <option value="technician">ช่างเทคนิค / วิศวกรชีวการแพทย์ (Technician)</option>
                  <option value="supervisor">หัวหน้างานซ่อมบำรุง (Supervisor)</option>
                  <option value="super_admin">ผู้ดูแลระบบสารสนเทศสูงสุด (Super Admin)</option>
                </select>
              </div>

              {/* Quick Preset Buttons */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5 font-display">
                  ชุดสิทธิ์สำเร็จรูป (Quick Presets)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('staff')}
                    className="p-2 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50/50 text-left transition cursor-pointer"
                  >
                    <p className="font-bold text-slate-800 text-[11px]">บุคลากรแผนก</p>
                    <p className="text-[10px] text-slate-500">แจ้งซ่อม + ดูครุภัณฑ์</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('tech')}
                    className="p-2 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50/50 text-left transition cursor-pointer"
                  >
                    <p className="font-bold text-slate-800 text-[11px]">ทีมช่างซ่อม</p>
                    <p className="text-[10px] text-slate-500">ซ่อม + อะไหล่ + PM</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('supervisor')}
                    className="p-2 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50/50 text-left transition cursor-pointer"
                  >
                    <p className="font-bold text-slate-800 text-[11px]">หัวหน้างาน</p>
                    <p className="text-[10px] text-slate-500">ดูรายงาน + ซ่อมบำรุง</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('admin')}
                    className="p-2 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50/50 text-left transition cursor-pointer"
                  >
                    <p className="font-bold text-slate-800 text-[11px]">Super Admin</p>
                    <p className="text-[10px] text-slate-500">เข้าถึงได้ทุก 7 ฟังก์ชั่น</p>
                  </button>
                </div>
              </div>

              {/* Individual Menu Checkboxes */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-bold text-slate-700 font-display">
                    เลือกฟังก์ชั่นที่อนุญาตให้เข้าใช้งานได้ ({selectedMenusForPerm.length}/7 เมนู)
                  </label>
                  <span className="text-[11px] text-slate-400">
                    เมนูที่ไม่ได้รับอนุญาตจะไม่แสดงในแถบเมนูด้านซ้าย
                  </span>
                </div>

                <div className="space-y-2 border border-slate-200 rounded-2xl p-3 bg-slate-50/50">
                  {AVAILABLE_SYSTEM_MENUS.map((menu) => {
                    const isChecked = selectedMenusForPerm.includes(menu.id);
                    return (
                      <div
                        key={menu.id}
                        onClick={() => handleToggleMenuPerm(menu.id)}
                        className={`flex items-start gap-3 p-2.5 rounded-xl border transition cursor-pointer ${
                          isChecked
                            ? 'bg-purple-50/80 border-purple-300 text-slate-900 shadow-2xs'
                            : 'bg-white border-slate-200/80 text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        <div className="mt-0.5">
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-purple-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className={`font-bold text-xs ${isChecked ? 'text-purple-950 font-display' : 'text-slate-700'}`}>
                            {menu.label}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {menu.sub}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isActionLoading}
                  onClick={() => setPermissionModalUser(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  disabled={isActionLoading}
                  onClick={handleSavePermissions}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md shadow-purple-600/20 cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {isActionLoading
                      ? 'กำลังบันทึก...'
                      : permissionModalUser.status === 'pending'
                      ? 'อนุมัติผู้ใช้พร้อมสิทธิ์ที่เลือก'
                      : 'บันทึกการกำหนดสิทธิ์'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

