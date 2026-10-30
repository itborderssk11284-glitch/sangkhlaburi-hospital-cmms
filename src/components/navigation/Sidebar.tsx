import React from 'react';
import { 
  LayoutDashboard, 
  Stethoscope, 
  PackageSearch, 
  Wrench, 
  Wind, 
  FileSpreadsheet, 
  Users2, 
  PlusCircle, 
  RotateCcw, 
  ChevronRight, 
  ShieldCheck, 
  Sparkles,
  Server,
  Activity,
  Layers,
  FileText,
  Boxes,
  KeyRound,
  X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface SidebarProps {
  onOpenNewRepairModal: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  onOpenNewRepairModal,
  isMobileOpen = false,
  onCloseMobile
}) => {
  const { 
    activeTab, 
    setActiveTab, 
    workOrders, 
    pmRecords, 
    spareParts, 
    assets,
    resetAllData 
  } = useApp();

  // Active emergencies & urgent count
  const activeUrgentOrders = workOrders.filter(
    o => (o.priority === 'emergency' || o.priority === 'urgent') && 
         o.status !== 'completed' && o.status !== 'cancelled'
  ).length;

  // Overdue PMs & AC cleanings
  const today = new Date();
  const acAssets = assets.filter(a => a.category === 'hvac_aircon' || a.btu !== undefined);
  const overdueACCount = acAssets.filter(ac => {
    if (!ac.nextCleanDate) return false;
    return new Date(ac.nextCleanDate).getTime() < today.getTime();
  }).length;
  const overduePMs = pmRecords.filter(p => p.status === 'overdue').length + overdueACCount;

  // Low stock parts
  const lowStockParts = spareParts.filter(p => p.quantity <= p.minimumQuantity).length;

  // Menu Items in EXACT ORDER requested:
  // 1. แดชบอร์ดภาพรวม, 2. ทะเบียนครุภัณฑ์, 3. คลังอะไหล่, 4. ใบแจ้งซ่อม, 5. บำรุงรักษา, 6. รายงาน, 7. จัดการผู้ใช้ระบบ
  const navItems = [
    {
      id: 'dashboard' as const,
      num: '01',
      label: 'แดชบอร์ดภาพรวม',
      subLabel: 'Overview & KPIs',
      icon: LayoutDashboard,
      gradient: 'from-emerald-400 to-teal-500',
      activeRing: 'ring-emerald-500/40 text-emerald-400',
      glowShadow: 'shadow-emerald-500/25',
    },
    {
      id: 'assets' as const,
      num: '02',
      label: 'ทะเบียนครุภัณฑ์',
      subLabel: '13 หมวด & ทะเบียนคุม สธ.',
      icon: Stethoscope,
      gradient: 'from-cyan-400 to-blue-500',
      activeRing: 'ring-cyan-500/40 text-cyan-400',
      glowShadow: 'shadow-cyan-500/25',
    },
    {
      id: 'inventory' as const,
      num: '03',
      label: 'คลังอะไหล่',
      subLabel: 'Spare Parts & Stock',
      icon: PackageSearch,
      gradient: 'from-amber-400 to-orange-500',
      activeRing: 'ring-amber-500/40 text-amber-400',
      glowShadow: 'shadow-amber-500/25',
      badge: lowStockParts > 0 ? lowStockParts : undefined,
      badgeColor: 'bg-amber-500 text-slate-950 font-black',
    },
    {
      id: 'work-orders' as const,
      num: '04',
      label: 'ใบแจ้งซ่อม',
      subLabel: 'Work Orders & Dispatch',
      icon: Wrench,
      gradient: 'from-rose-400 to-red-500',
      activeRing: 'ring-rose-500/40 text-rose-400',
      glowShadow: 'shadow-rose-500/25',
      badge: activeUrgentOrders > 0 ? activeUrgentOrders : undefined,
      badgeColor: 'bg-rose-500 text-white font-black animate-pulse',
    },
    {
      id: 'pm-calibration' as const,
      num: '05',
      label: 'บำรุงรักษา',
      subLabel: 'PM, Calib & ล้างแอร์',
      icon: Wind,
      gradient: 'from-teal-300 to-emerald-400',
      activeRing: 'ring-teal-500/40 text-teal-300',
      glowShadow: 'shadow-teal-500/25',
      badge: overduePMs > 0 ? overduePMs : undefined,
      badgeColor: 'bg-teal-500 text-slate-950 font-black',
    },
    {
      id: 'reports' as const,
      num: '06',
      label: 'รายงาน',
      subLabel: '3 รายงาน & สรุปผลช่วงเวลา',
      icon: FileSpreadsheet,
      gradient: 'from-blue-400 to-indigo-500',
      activeRing: 'ring-blue-500/40 text-blue-400',
      glowShadow: 'shadow-blue-500/25',
    },
    {
      id: 'workforce' as const,
      num: '07',
      label: 'จัดการผู้ใช้ระบบ',
      subLabel: 'บัญชีผู้ใช้ & สิทธิ์ทีมช่าง',
      icon: Users2,
      gradient: 'from-purple-400 to-violet-500',
      activeRing: 'ring-purple-500/40 text-purple-400',
      glowShadow: 'shadow-purple-500/25',
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Modern IT Style Sidebar Container */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-gradient-to-b from-[#090E17] via-[#0D1524] to-[#0A101D] border-r border-slate-800/80 text-slate-300 flex flex-col justify-between transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } no-print`}
      >
        {/* Top Header & Hospital Branding */}
        <div>
          <div className="p-5 border-b border-slate-800/80 relative">
            {/* Close button on mobile */}
            <button
              onClick={onCloseMobile}
              className="md:hidden absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="relative group shrink-0">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-0.5 shadow-lg shadow-emerald-500/20">
                  <div className="w-full h-full bg-[#0D1524] rounded-[14px] flex items-center justify-center overflow-hidden">
                    <img 
                      src="/assets/aistudio/Logo_SK_-_______26693d5e.png" 
                      alt="โรงพยาบาลสังขละบุรี" 
                      className="w-8 h-8 object-contain"
                    />
                  </div>
                </div>
                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#090E17] shadow-xs"></div>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h1 className="font-extrabold text-white text-sm tracking-tight font-display truncate">
                    รพ.สังขละบุรี
                  </h1>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    CMMS
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                  ระบบซ่อมบำรุงออนไลน์
                </p>
                <div className="flex items-center gap-1.5 mt-1 text-[10px] text-emerald-400 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>ONLINE v2.4 (SLA 99.9%)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Action: New Repair Work Order */}
          <div className="px-4 pt-4 pb-2">
            <button
              onClick={() => {
                onOpenNewRepairModal();
                if (onCloseMobile) onCloseMobile();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-xs font-bold font-display shadow-md shadow-emerald-900/40 hover:shadow-emerald-500/30 transition-all cursor-pointer group"
            >
              <PlusCircle className="w-4 h-4 transition-transform group-hover:scale-110" />
              <span>+ แจ้งซ่อมด่วน (New Ticket)</span>
            </button>
          </div>

          {/* Navigation Menu in EXACT ORDER */}
          <div className="px-3 py-2">
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 font-display">
              เมนูหลักของระบบ (Main Navigation)
            </div>

            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                const IconComponent = item.icon;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      if (onCloseMobile) onCloseMobile();
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer group relative ${
                      isActive
                        ? 'bg-slate-800/90 text-white shadow-md ring-1 ring-slate-700/80 font-bold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 font-medium'
                    }`}
                  >
                    {/* Active Left Indicator Bar */}
                    {isActive && (
                      <div className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-gradient-to-b from-emerald-400 via-teal-400 to-cyan-400 shadow-sm shadow-emerald-500"></div>
                    )}

                    <div className="flex items-center gap-3 min-w-0">
                      {/* Modern IT Icon Container */}
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                        isActive
                          ? `bg-gradient-to-br ${item.gradient} text-slate-950 shadow-md ${item.glowShadow}`
                          : 'bg-slate-800/80 text-slate-400 group-hover:text-white group-hover:bg-slate-700/80'
                      }`}>
                        <IconComponent className="w-4 h-4" />
                      </div>

                      <div className="truncate">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-mono font-bold ${isActive ? 'text-slate-300' : 'text-slate-600'}`}>
                            {item.num}
                          </span>
                          <span className="text-xs truncate font-display">
                            {item.label}
                          </span>
                        </div>
                        <p className={`text-[10px] truncate ${isActive ? 'text-slate-400' : 'text-slate-500'}`}>
                          {item.subLabel}
                        </p>
                      </div>
                    </div>

                    {/* Badge or Arrow */}
                    <div className="shrink-0 flex items-center gap-1">
                      {item.badge !== undefined && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] ${item.badgeColor}`}>
                          {item.badge}
                        </span>
                      )}
                      <ChevronRight className={`w-3.5 h-3.5 transition-transform ${
                        isActive ? 'text-slate-300 translate-x-0.5' : 'text-slate-600 group-hover:text-slate-400'
                      }`} />
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Bottom Section: Current User Profile & Reset Demo */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 space-y-3">
          
          {/* User Profile Mini Card */}
          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                วร
              </div>
              <div className="truncate text-xs">
                <div className="font-bold text-slate-200 truncate">วรพจน์ ธนสารพาณิชย์</div>
                <div className="text-[10px] text-purple-400 font-medium">Super Admin · IT</div>
              </div>
            </div>

            <button
              onClick={() => {
                if (window.confirm('คุณต้องการรีเซ็ตข้อมูลตัวอย่างทั้งหมดกลับเป็นค่าเริ่มต้นหรือไม่?')) {
                  resetAllData();
                }
              }}
              title="รีเซ็ตข้อมูลตัวอย่าง (Reset Data)"
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer shrink-0"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <div className="text-[10px] text-slate-500 text-center flex items-center justify-center gap-1 font-mono">
            <span>รพ.สังขละบุรี CMMS</span>
            <span>·</span>
            <span>กลุ่มงานสารสนเทศและบริหาร</span>
          </div>
        </div>
      </aside>
    </>
  );
};
