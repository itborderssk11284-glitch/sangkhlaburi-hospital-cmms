import React from 'react';
import { 
  Menu, 
  Bell, 
  AlertTriangle, 
  ShieldCheck, 
  PlusCircle, 
  Search, 
  Sparkles,
  Building2,
  Calendar,
  Wind,
  Database,
  LogOut,
  LogIn,
  UserCheck,
  Trash2,
  Shield
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface TopBarProps {
  onToggleMobileMenu: () => void;
  onOpenNewRepairModal: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ 
  onToggleMobileMenu, 
  onOpenNewRepairModal 
}) => {
  const { 
    activeTab, 
    setActiveTab, 
    workOrders, 
    pmRecords, 
    assets,
    systemUsers,
    currentUser,
    isAuthModalOpen,
    setIsAuthModalOpen,
    logout,
    clearAllSampleData,
    firebaseConnected,
    firebaseSyncStatus,
    lastSyncedTime,
    syncAllDataToCloud
  } = useApp();

  // Pending user approvals
  const pendingApprovals = systemUsers.filter(u => u.status === 'pending');

  // Active emergency & urgent count
  const emergencyOrders = workOrders.filter(
    o => o.priority === 'emergency' && o.status !== 'completed' && o.status !== 'cancelled'
  );

  const urgentOrders = workOrders.filter(
    o => o.priority === 'urgent' && o.status !== 'completed' && o.status !== 'cancelled'
  );

  // Overdue PMs & AC
  const today = new Date();
  const acAssets = assets.filter(a => a.category === 'hvac_aircon' || a.btu !== undefined);
  const overdueACCount = acAssets.filter(ac => {
    if (!ac.nextCleanDate) return false;
    return new Date(ac.nextCleanDate).getTime() < today.getTime();
  }).length;
  const overduePMs = pmRecords.filter(p => p.status === 'overdue').length + overdueACCount;

  // Active Tab Title Lookup
  const getTabTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return { title: 'แดชบอร์ดภาพรวมระบบ', breadcrumb: 'Executive Analytics & KPIs' };
      case 'assets':
        return { title: 'ทะเบียนครุภัณฑ์ (Asset Ledger)', breadcrumb: '13 หมวดครุภัณฑ์มาตรฐาน สธ.' };
      case 'inventory':
        return { title: 'คลังอะไหล่และวัสดุซ่อมบำรุง', breadcrumb: 'Spare Parts & Inventory Balance' };
      case 'work-orders':
        return { title: 'ใบแจ้งซ่อมและติดตามสถานะ', breadcrumb: 'Work Orders & Maintenance Tickets' };
      case 'pm-calibration':
        return { title: 'บำรุงรักษาเชิงป้องกันและการสอบเทียบ', breadcrumb: 'Preventive Maintenance, Calibration & ล้างแอร์' };
      case 'reports':
        return { title: 'ระบบรายงานและวิเคราะห์ข้อมูล', breadcrumb: '3 หัวข้อรายงาน สรุปผล & แผนจัดซื้อทดแทน' };
      case 'workforce':
        return { title: 'จัดการผู้ใช้ระบบและทีมช่าง', breadcrumb: 'User Accounts, Roles & Technician Workload' };
      default:
        return { title: 'ระบบซ่อมบำรุงโรงพยาบาลสังขละบุรี', breadcrumb: 'Hospital CMMS' };
    }
  };

  const { title, breadcrumb } = getTabTitle();

  return (
    <header className="bg-white border-b border-slate-200/90 sticky top-0 z-30 shadow-2xs no-print">
      {/* Top Banner Header Strip */}
      <div className="bg-emerald-950 text-white px-4 lg:px-8 py-1 hidden sm:block">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-[11px] text-emerald-200 font-medium">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">กระทรวงสาธารณสุข</span>
            <span>·</span>
            <span>สำนักงานสาธารณสุขจังหวัดกาญจนบุรี</span>
            <span>·</span>
            <span className="text-emerald-100">โรงพยาบาลสังขละบุรี</span>
          </div>

          <div className="flex items-center gap-3 font-mono text-[10px]">
            <span>ระบบออนไลน์ความปลอดภัยเครื่องมือแพทย์ สธ.</span>
            <span>·</span>
            <span>โทร. 034-595021 ต่อ 141</span>
          </div>
        </div>
      </div>

      {/* Main TopBar Controls */}
      <div className="px-4 lg:px-8 py-3 flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Page Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
            aria-label="เปิดเมนูด้านซ้าย"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold font-display text-slate-900 tracking-tight leading-tight">
                {title}
              </h2>
            </div>
            <p className="text-xs text-slate-500 font-medium hidden sm:block">
              {breadcrumb}
            </p>
          </div>
        </div>

        {/* Right: Alert Indicators & Action Buttons */}
        <div className="flex items-center gap-2.5">
          {/* Firebase Cloud Sync Badge */}
          <button
            onClick={() => syncAllDataToCloud()}
            disabled={firebaseSyncStatus === 'syncing'}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer hover:shadow-xs active:scale-98 ${
              firebaseSyncStatus === 'syncing'
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : firebaseConnected
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300/80 hover:bg-emerald-100/70 shadow-2xs'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
            title={firebaseConnected ? `เชื่อมต่อ Google Firebase Cloud สำเร็จ (คลิกเพื่อซิงค์ข้อมูลทุกเครื่องทันที) • ซิงค์ล่าสุด ${lastSyncedTime || 'พร้อมใช้งาน'}` : 'คลิกเพื่อลองเชื่อมต่อและซิงค์ Cloud'}
          >
            <span className="relative flex h-2 w-2">
              {firebaseSyncStatus === 'syncing' ? (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              ) : firebaseConnected ? (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-40"></span>
              ) : null}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                firebaseSyncStatus === 'syncing' ? 'bg-amber-500' : firebaseConnected ? 'bg-emerald-600' : 'bg-slate-400'
              }`}></span>
            </span>
            <span className="font-mono text-[11px] flex items-center gap-1">
              <Database className="w-3.5 h-3.5 text-emerald-700" />
              <span>{firebaseSyncStatus === 'syncing' ? 'กำลังซิงค์ Cloud...' : firebaseConnected ? 'Firebase Cloud' : 'Local'}</span>
            </span>
          </button>

          {/* Emergency Alert Badge */}
          {emergencyOrders.length > 0 && (
            <button
              onClick={() => setActiveTab('work-orders')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition cursor-pointer text-xs font-bold animate-pulse"
              title="มีงานแจ้งซ่อมฉุกเฉินวิกฤต"
            >
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="hidden sm:inline">ฉุกเฉิน</span>
              <span className="bg-rose-600 text-white px-1.5 rounded-full text-[10px] font-mono">
                {emergencyOrders.length}
              </span>
            </button>
          )}

          {/* Overdue PMs Badge */}
          {overduePMs > 0 && (
            <button
              onClick={() => setActiveTab('pm-calibration')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition cursor-pointer text-xs font-semibold"
              title="มีรอบบำรุงรักษาหรือล้างแอร์เกินกำหนด"
            >
              <Wind className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="hidden sm:inline">ค้างตรวจ</span>
              <span className="bg-amber-600 text-white px-1.5 rounded-full text-[10px] font-mono">
                {overduePMs}
              </span>
            </button>
          )}

          {/* Pending User Approvals */}
          {currentUser?.role === 'super_admin' && pendingApprovals.length > 0 && (
            <button
              onClick={() => setActiveTab('workforce')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100 transition cursor-pointer text-xs font-bold"
              title="มีผู้สมัครขอเข้าใช้งานรอการอนุมัติจากแอดมิน"
            >
              <UserCheck className="w-4 h-4 text-purple-600 shrink-0" />
              <span className="hidden sm:inline">รออนุมัติ</span>
              <span className="bg-purple-600 text-white px-1.5 rounded-full text-[10px] font-mono">
                {pendingApprovals.length}
              </span>
            </button>
          )}

          {/* Clear Sample Data to Empty Database Button */}
          {(assets.length > 0 || workOrders.length > 0) && (
            <button
              onClick={() => {
                if (window.confirm('คุณต้องการลบข้อมูลตัวอย่างทั้งหมดให้เป็นฐานข้อมูลเปล่า เพื่อเตรียมบันทึกข้อมูลจริงใช่หรือไม่?')) {
                  clearAllSampleData();
                }
              }}
              className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition text-xs font-medium cursor-pointer"
              title="ล้างข้อมูลตัวอย่างให้เป็นฐานเปล่าพร้อมใช้งานจริง"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>ล้างเป็นฐานเปล่า</span>
            </button>
          )}

          {/* User Authentication Pill */}
          {currentUser ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-slate-800 flex items-center justify-end gap-1">
                  {currentUser.role === 'super_admin' && (
                    <span className="bg-purple-100 text-purple-800 text-[9px] px-1.5 py-0.2 rounded font-bold">Admin</span>
                  )}
                  <span>{currentUser.fullName}</span>
                </div>
                <div className="text-[10px] text-slate-500 font-medium">
                  {currentUser.department}
                </div>
              </div>
              <button
                onClick={logout}
                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                title="ออกจากระบบ (Sign Out)"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold transition cursor-pointer shadow-xs"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>เข้าสู่ระบบ</span>
            </button>
          )}

          {/* New Work Order Shortcut */}
          <button
            onClick={onOpenNewRepairModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold font-display transition shadow-sm shadow-emerald-700/30 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">แจ้งซ่อมครุภัณฑ์</span>
            <span className="sm:hidden">แจ้งซ่อม</span>
          </button>
        </div>
      </div>
    </header>
  );
};
