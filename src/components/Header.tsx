import React from 'react';
import { 
  LayoutDashboard, 
  Stethoscope, 
  Wrench, 
  CalendarCheck2, 
  PackageSearch, 
  Users, 
  PlusCircle,
  AlertTriangle,
  RotateCcw,
  Wind,
  TrendingUp,
  ShieldCheck,
  ThermometerSnowflake,
  FileText
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Header: React.FC<{
  onOpenNewRepairModal: () => void;
}> = ({ onOpenNewRepairModal }) => {
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

  interface NavItem {
    id: 'dashboard' | 'assets' | 'work-orders' | 'pm-calibration' | 'inventory' | 'workforce' | 'reports';
    label: string;
    subLabel: string;
    icon: React.ComponentType<{ className?: string }>;
    accentColor: string;
    badge?: number;
    badgeColor?: string;
  }

  const navItems: NavItem[] = [
    { 
      id: 'dashboard', 
      label: 'แดชบอร์ดภาพรวม', 
      subLabel: 'Analytics & KPIs',
      icon: LayoutDashboard,
      accentColor: 'text-emerald-600',
    },
    { 
      id: 'assets', 
      label: 'ทะเบียนครุภัณฑ์', 
      subLabel: '13 หมวด & ทะเบียนคุม สธ.',
      icon: Stethoscope,
      accentColor: 'text-teal-600',
    },
    { 
      id: 'work-orders', 
      label: 'ใบแจ้งซ่อม & ติดตาม', 
      subLabel: 'Work Orders',
      icon: Wrench,
      accentColor: 'text-rose-600',
      badge: activeUrgentOrders > 0 ? activeUrgentOrders : undefined,
      badgeColor: 'bg-rose-600'
    },
    { 
      id: 'pm-calibration', 
      label: 'บำรุงรักษา & ล้างแอร์', 
      subLabel: 'PM, Calib & AC Alerts',
      icon: Wind,
      accentColor: 'text-cyan-600',
      badge: overduePMs > 0 ? overduePMs : undefined,
      badgeColor: 'bg-amber-600'
    },
    { 
      id: 'inventory', 
      label: 'คลังอะไหล่ & วัสดุ', 
      subLabel: 'Spare Parts & Stock',
      icon: PackageSearch,
      accentColor: 'text-amber-600',
      badge: lowStockParts > 0 ? lowStockParts : undefined,
      badgeColor: 'bg-orange-600'
    },
    { 
      id: 'workforce', 
      label: 'จัดการทีมช่าง', 
      subLabel: 'Technicians & SLA',
      icon: Users,
      accentColor: 'text-indigo-600',
    },
    { 
      id: 'reports', 
      label: 'ระบบรายงาน', 
      subLabel: 'สรุปผล & แผนจัดซื้อ',
      icon: FileText,
      accentColor: 'text-blue-600',
    },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs no-print">
      {/* Top hospital header bar */}
      <div className="bg-emerald-900 text-white px-4 lg:px-8 py-1.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-semibold tracking-wide text-emerald-200">
              กระทรวงสาธารณสุข · สำนักงานสาธารณสุขจังหวัดกาญจนบุรี
            </span>
            <span className="hidden sm:inline text-emerald-400">|</span>
            <span className="hidden sm:inline text-emerald-100">
              ระบบซ่อมบำรุงและบำรุงรักษาครุภัณฑ์ออนไลน์ (Sangkhlaburi CMMS)
            </span>
          </div>

          <div className="flex items-center gap-4 text-emerald-200">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>ระบบออนไลน์พร้อมใช้งาน</span>
            </div>
            <button
              onClick={() => {
                if (window.confirm('คุณต้องการรีเซ็ตข้อมูลตัวอย่างทั้งหมดกลับเป็นค่าเริ่มต้นหรือไม่?')) {
                  resetAllData();
                }
              }}
              title="รีเซ็ตข้อมูลตัวอย่าง"
              className="text-emerald-300 hover:text-white transition flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">รีเซ็ตข้อมูล</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main branding & actions */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 shrink-0 rounded-full bg-white p-0.5 shadow-sm border border-emerald-100 flex items-center justify-center overflow-hidden">
              <img 
                src="/assets/aistudio/Logo_SK_-_______26693d5e.png" 
                alt="ตราสัญลักษณ์โรงพยาบาลสังขละบุรี"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  โรงพยาบาลสังขละบุรี
                </h1>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                  ระบบซ่อมบำรุงครุภัณฑ์
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                กลุ่มงานบริหารทั่วไปและงานซ่อมบำรุงวิศวกรรมการแพทย์ (Medical Equipment & Engineering CMMS)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end md:self-auto">
            {activeUrgentOrders > 0 && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 text-xs font-medium">
                <AlertTriangle className="w-4 h-4 text-rose-600 animate-bounce" />
                <span>งานด่วนรอรับ: <strong>{activeUrgentOrders}</strong> รายการ</span>
              </div>
            )}
            
            <button
              onClick={onOpenNewRepairModal}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-medium text-sm rounded-lg shadow-xs transition duration-150 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>เปิดใบแจ้งซ่อมด่วน</span>
            </button>
          </div>
        </div>
      </div>

      {/* Smart, Elegant Navigation Menu with Icons */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <nav className="flex space-x-1.5 overflow-x-auto pb-1 scrollbar-none border-t border-slate-100 pt-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`group flex items-center gap-2.5 py-2 px-3 rounded-lg text-xs font-medium transition cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-50/80 text-emerald-950 font-bold border border-emerald-300 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                }`}
              >
                <div className={`p-1.5 rounded-md transition ${
                  isActive 
                    ? 'bg-emerald-700 text-white shadow-xs' 
                    : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-800'
                }`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                
                <div className="text-left">
                  <div className="leading-tight flex items-center gap-1.5">
                    <span>{item.label}</span>
                    {item.badge !== undefined && (
                      <span className={`text-[9px] font-bold text-white px-1.5 py-0.2 rounded-full ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 font-normal leading-tight hidden lg:block">
                    {item.subLabel}
                  </div>
                </div>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
