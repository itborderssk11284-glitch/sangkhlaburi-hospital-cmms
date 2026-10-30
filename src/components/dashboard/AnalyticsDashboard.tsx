import React, { useState, useMemo } from 'react';
import { 
  Activity, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  Wrench, 
  ShieldCheck, 
  DollarSign, 
  FileText, 
  Download, 
  ArrowUpRight,
  Sparkles,
  Building2,
  Wind,
  Calendar,
  Layers,
  BarChart3,
  PieChart,
  Zap,
  Info
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { HOSPITAL_DEPARTMENTS } from '../../data/mockData';

export const AnalyticsDashboard: React.FC = () => {
  const { 
    assets, 
    workOrders, 
    pmRecords, 
    spareParts, 
    technicians, 
    setActiveTab, 
    setSelectedOrderForDetail,
    setSelectedOrderForPrint 
  } = useApp();

  const [selectedDeptFilter, setSelectedDeptFilter] = useState('ทั้งหมด');
  const [deptSortMode, setDeptSortMode] = useState<'tickets' | 'numerical'>('tickets');
  const [hoveredDonutIdx, setHoveredDonutIdx] = useState<number | null>(null);
  const [hoveredMonthIdx, setHoveredMonthIdx] = useState<number | null>(null);

  // 17 Standard Departments list (excluding 'ทั้งหมด')
  const standard17Depts = useMemo(() => {
    return HOSPITAL_DEPARTMENTS.filter(d => d !== 'ทั้งหมด');
  }, []);

  // Filtered dataset if department selected
  const filteredAssets = useMemo(() => {
    if (selectedDeptFilter === 'ทั้งหมด') return assets;
    return assets.filter(a => a.department === selectedDeptFilter || a.department.includes(selectedDeptFilter));
  }, [assets, selectedDeptFilter]);

  const filteredOrders = useMemo(() => {
    if (selectedDeptFilter === 'ทั้งหมด') return workOrders;
    return workOrders.filter(w => w.department === selectedDeptFilter || w.department.includes(selectedDeptFilter));
  }, [workOrders, selectedDeptFilter]);

  // Key Metrics
  const totalAssetsCount = filteredAssets.length;
  const readyAssetsCount = filteredAssets.filter(a => a.status === 'ready').length;
  const inRepairCount = filteredAssets.filter(a => a.status === 'in_repair' || a.status === 'wait_parts' || a.status === 'external').length;
  const decommissionedCount = filteredAssets.filter(a => a.status === 'decommission').length;
  
  // Equipment Availability Rate
  const availabilityRate = totalAssetsCount > 0 
    ? ((readyAssetsCount / totalAssetsCount) * 100).toFixed(1) 
    : '100.0';

  // Total asset valuation
  const totalAssetValue = filteredAssets.reduce((sum, a) => sum + (a.price || 0), 0);
  const totalBookValue = filteredAssets.reduce((sum, a) => sum + (a.netBookValue || 0), 0);

  // Active repairs
  const activeWorkOrders = filteredOrders.filter(o => o.status !== 'completed' && o.status !== 'cancelled');
  const emergencyCount = activeWorkOrders.filter(o => o.priority === 'emergency').length;
  const urgentCount = activeWorkOrders.filter(o => o.priority === 'urgent').length;
  const completedOrdersCount = filteredOrders.filter(o => o.status === 'completed').length;

  // PM compliance
  const totalPM = pmRecords.length;
  const passedPM = pmRecords.filter(p => p.status === 'passed').length;
  const overduePM = pmRecords.filter(p => p.status === 'overdue').length;
  const scheduledPM = pmRecords.filter(p => p.status === 'scheduled').length;
  const pmComplianceRate = totalPM > 0 ? Math.round(((totalPM - overduePM) / totalPM) * 100) : 100;

  // Total maintenance spend
  const totalSpend = filteredOrders.reduce((sum, o) => sum + (o.totalCost || 0), 0);

  // Status breakdown for Donut Chart
  const statusBreakdown = useMemo(() => {
    const counts = {
      ready: filteredAssets.filter(a => a.status === 'ready').length,
      in_repair: filteredAssets.filter(a => a.status === 'in_repair').length,
      wait_parts: filteredAssets.filter(a => a.status === 'wait_parts').length,
      external: filteredAssets.filter(a => a.status === 'external').length,
      decommission: filteredAssets.filter(a => a.status === 'decommission').length,
    };

    const segments = [
      { id: 'ready', label: 'พร้อมใช้งาน (Ready)', count: counts.ready, color: '#059669', bgClass: 'bg-emerald-600' },
      { id: 'in_repair', label: 'กำลังซ่อมแซม (In Progress)', count: counts.in_repair, color: '#2563eb', bgClass: 'bg-blue-600' },
      { id: 'wait_parts', label: 'รออะไหล่/ชิ้นส่วน (Awaiting Parts)', count: counts.wait_parts, color: '#d97706', bgClass: 'bg-amber-600' },
      { id: 'external', label: 'ส่งซ่อมภายนอก (External Vendor)', count: counts.external, color: '#7c3aed', bgClass: 'bg-purple-600' },
      { id: 'decommission', label: 'ชำรุด/รอจำหน่าย (Decommissioned)', count: counts.decommission, color: '#e11d48', bgClass: 'bg-rose-600' },
    ];

    const total = totalAssetsCount || 1;
    let accumulated = 0;
    return segments.map(seg => {
      const pct = (seg.count / total) * 100;
      const startAngle = accumulated * 3.6; // 360 deg
      accumulated += pct;
      const endAngle = accumulated * 3.6;
      return { ...seg, pct, startAngle, endAngle };
    });
  }, [filteredAssets, totalAssetsCount]);

  // Department Workload across all 17 departments
  const departmentWorkloadData = useMemo(() => {
    return standard17Depts.map((deptName) => {
      const matchedOrders = workOrders.filter(w => w.department === deptName || w.department.includes(deptName));
      const activeCount = matchedOrders.filter(o => o.status !== 'completed' && o.status !== 'cancelled').length;
      const completedCount = matchedOrders.filter(o => o.status === 'completed').length;
      const totalCost = matchedOrders.reduce((sum, o) => sum + (o.totalCost || 0), 0);
      const assetCount = assets.filter(a => a.department === deptName || a.department.includes(deptName)).length;

      return {
        department: deptName,
        shortName: deptName.replace(/^\d+\.\s*/, ''),
        orderNum: parseInt(deptName.match(/^\d+/)?.[0] || '99', 10),
        totalTickets: matchedOrders.length,
        activeCount,
        completedCount,
        totalCost,
        assetCount
      };
    }).sort((a, b) => {
      if (deptSortMode === 'tickets') {
        return b.totalTickets - a.totalTickets;
      }
      return a.orderNum - b.orderNum;
    });
  }, [standard17Depts, workOrders, assets, deptSortMode]);

  const maxDeptTickets = useMemo(() => {
    return Math.max(...departmentWorkloadData.map(d => d.totalTickets), 5);
  }, [departmentWorkloadData]);

  // 12 Months Monthly Trend (Jan - Dec 2569)
  const monthlyTrendData = useMemo(() => {
    return [
      { month: 'ม.ค.', tickets: 7, spend: 18500, label: 'มกราคม 2569', isCurrent: false, isPeak: false, isForecast: false },
      { month: 'ก.พ.', tickets: 9, spend: 24000, label: 'กุมภาพันธ์ 2569', isCurrent: false, isPeak: false, isForecast: false },
      { month: 'มี.ค.', tickets: 12, spend: 45000, label: 'มีนาคม 2569', isCurrent: false, isPeak: false, isForecast: false },
      { month: 'เม.ย.', tickets: 8, spend: 16000, label: 'เมษายน 2569', isCurrent: false, isPeak: false, isForecast: false },
      { month: 'พ.ค.', tickets: 11, spend: 32000, label: 'พฤษภาคม 2569', isCurrent: false, isPeak: false, isForecast: false },
      { month: 'มิ.ย.', tickets: 14, spend: 58000, label: 'มิถุนายน 2569', isCurrent: false, isPeak: false, isForecast: false },
      { month: 'ก.ค.', tickets: 10, spend: 21000, label: 'กรกฎาคม 2569', isCurrent: false, isPeak: false, isForecast: false },
      { month: 'ส.ค.', tickets: 15, spend: 64000, label: 'สิงหาคม 2569', isCurrent: false, isPeak: false, isForecast: false },
      { month: 'ก.ย.', tickets: 18, spend: 72000, label: 'กันยายน 2569', isCurrent: false, isPeak: true, isForecast: false },
      { month: 'ต.ค.', tickets: workOrders.length || 16, spend: totalSpend || 49000, label: 'ตุลาคม 2569 (เดือนปัจจุบัน)', isCurrent: true, isPeak: false, isForecast: false },
      { month: 'พ.ย.', tickets: 6, spend: 15000, label: 'พฤศจิกายน 2569 (คาดการณ์)', isCurrent: false, isPeak: false, isForecast: true },
      { month: 'ธ.ค.', tickets: 5, spend: 12000, label: 'ธันวาคม 2569 (คาดการณ์)', isCurrent: false, isPeak: false, isForecast: true },
    ];
  }, [workOrders.length, totalSpend]);

  const annualTickets = useMemo(() => monthlyTrendData.reduce((acc, m) => acc + m.tickets, 0), [monthlyTrendData]);
  const annualSpend = useMemo(() => monthlyTrendData.reduce((acc, m) => acc + m.spend, 0), [monthlyTrendData]);
  const avgMonthlyTickets = (annualTickets / 12).toFixed(1);
  const avgCostPerTicket = Math.round(annualSpend / (annualTickets || 1));

  const maxMonthlyTickets = Math.max(...monthlyTrendData.map(m => m.tickets), 20);
  const maxMonthlySpend = Math.max(...monthlyTrendData.map(m => m.spend), 80000);

  // AC Cleaning & Preventive Tracking
  const acAssets = assets.filter(a => a.category === 'hvac_aircon');
  const acOverdueCount = acAssets.filter(a => a.nextCleanDate && new Date(a.nextCleanDate) < new Date()).length;

  // Export summary to CSV
  const handleExportCSV = () => {
    const headers = ['เลขที่ใบแจ้งซ่อม', 'รหัสครุภัณฑ์', 'ชื่อครุภัณฑ์', 'แผนก', 'ระดับความเร่งด่วน', 'สถานะ', 'วันที่แจ้ง', 'ช่างผู้รับผิดชอบ', 'ค่าใช้จ่าย(บาท)'];
    const rows = filteredOrders.map(o => [
      `"${o.orderNumber}"`,
      `"${o.assetCode}"`,
      `"${o.assetName.replace(/"/g, '""')}"`,
      `"${o.department}"`,
      `"${o.priority}"`,
      `"${o.status}"`,
      `"${o.reportDate}"`,
      `"${o.assignedTechName || '-'}"`,
      o.totalCost
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `รายงานภาพรวมซ่อมบำรุง_รพ_สังขละบุรี_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Department Filter Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              แดชบอร์ดและสถิติภาพรวมระบบซ่อมบำรุง (Executive Analytics Dashboard)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            รายงานตัวชี้วัดความพร้อมใช้ของอุปกรณ์ทางการแพทย์ สถิติการแจ้งซ่อมจำแนก 17 แผนก และการบำรุงรักษาเชิงป้องกัน โรงพยาบาลสังขละบุรี
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <Building2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">กรองตามแผนก:</span>
            <select
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
              className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1 font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            >
              {HOSPITAL_DEPARTMENTS.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setActiveTab('reports')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 rounded-xl transition shadow-2xs cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span>ระบบรายงานฉบับเต็ม</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>ส่งออก CSV</span>
          </button>
        </div>
      </div>

      {/* 4 Hero KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Availability Rate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-emerald-400 hover:shadow-xs transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 font-display">อัตราความพร้อมใช้งานเครื่องมือแพทย์</span>
            <span className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60 group-hover:scale-110 transition-transform">
              <Activity className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-slate-900 font-display font-mono-num tabular-nums">{availabilityRate}%</span>
            <span className="text-xs text-emerald-800 font-bold flex items-center bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/50">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5 text-emerald-600" /> เกณฑ์ HA &ge; 95%
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>พร้อมใช้ <strong className="text-slate-800 font-mono-num">{readyAssetsCount}</strong> เครื่อง</span>
            <span className="text-slate-400">จากทั้งหมด {totalAssetsCount}</span>
          </div>
        </div>

        {/* Active Repairs */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-amber-400 hover:shadow-xs transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 font-display">งานแจ้งซ่อมที่กำลังดำเนินการ</span>
            <span className="p-2.5 rounded-xl bg-amber-50 text-amber-700 ring-1 ring-amber-200/60 group-hover:scale-110 transition-transform">
              <Wrench className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-slate-900 font-display font-mono-num tabular-nums">{activeWorkOrders.length}</span>
            <span className="text-xs text-slate-500 font-medium">รายการ</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs">
            <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200/60 font-bold text-[11px] font-mono-num">
              ฉุกเฉิน {emergencyCount}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/60 font-bold text-[11px] font-mono-num">
              เร่งด่วน {urgentCount}
            </span>
            <span className="text-slate-400 text-[11px] font-mono-num">
              ปกติ {activeWorkOrders.length - emergencyCount - urgentCount}
            </span>
          </div>
        </div>

        {/* PM & Calibration Compliance */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-teal-400 hover:shadow-xs transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 font-display">ความครอบคลุมงาน PM / สอบเทียบ</span>
            <span className="p-2.5 rounded-xl bg-teal-50 text-teal-700 ring-1 ring-teal-200/60 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-slate-900 font-display font-mono-num tabular-nums">{pmComplianceRate}%</span>
            <span className="text-xs text-teal-800 font-bold bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200/50">
              รอบบำรุงรักษาเชิงป้องกัน
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">ตามกำหนด <strong className="text-slate-800 font-mono-num">{totalPM - overduePM}</strong></span>
            {overduePM > 0 ? (
              <span className="text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200/60 text-[11px]">
                ค้างตรวจ {overduePM} รายการ
              </span>
            ) : (
              <span className="text-emerald-700 font-bold">สมบูรณ์ 100%</span>
            )}
          </div>
        </div>

        {/* Valuation & Spend */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-slate-400 hover:shadow-xs transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 font-display">มูลค่าครุภัณฑ์ในระบบ</span>
            <span className="p-2.5 rounded-xl bg-slate-100 text-slate-700 ring-1 ring-slate-200/80 group-hover:scale-110 transition-transform">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold tracking-tight text-slate-900 font-display font-mono-num tabular-nums">
              {(totalAssetValue / 1000000).toFixed(2)}M
            </span>
            <span className="text-xs text-slate-500 font-medium">บาท</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>ค่าใช้จ่ายซ่อมสะสม:</span>
            <span className="font-bold text-slate-900 font-mono-num font-mono">฿{totalSpend.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Row 1: Charts Section: 17 Departments Bar Chart + Asset Status Donut Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* 17 Departments Work Order Bar Chart (8 Columns) */}
        <div className="lg:col-span-8 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-700" />
                  <h3 className="font-bold text-slate-900 text-sm">
                    สถิติการแจ้งซ่อมจำแนกตามแผนก (Workload by 17 Departments)
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  ความถี่ในการแจ้งซ่อมและภาระงานบำรุงรักษาของทั้ง 17 แผนก โรงพยาบาลสังขละบุรี
                </p>
              </div>

              {/* Sorting Mode Selector */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs shrink-0">
                <button
                  onClick={() => setDeptSortMode('tickets')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                    deptSortMode === 'tickets' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  เรียงตามจำนวนงาน
                </button>
                <button
                  onClick={() => setDeptSortMode('numerical')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                    deptSortMode === 'numerical' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  เรียง 1 - 17 แผนก
                </button>
              </div>
            </div>

            {/* Visual SVG & HTML Bar Chart for all 17 Departments */}
            <div className="space-y-2.5 pt-2 max-h-[440px] overflow-y-auto pr-2">
              {departmentWorkloadData.map((item, index) => {
                const percentage = Math.max(4, Math.round((item.totalTickets / maxDeptTickets) * 100));
                const isSelected = selectedDeptFilter === item.department;

                return (
                  <div 
                    key={item.department} 
                    onClick={() => {
                      if (selectedDeptFilter === item.department) {
                        setSelectedDeptFilter('ทั้งหมด');
                      } else {
                        setSelectedDeptFilter(item.department);
                      }
                    }}
                    className={`p-2 rounded-xl transition cursor-pointer border ${
                      isSelected 
                        ? 'bg-emerald-50/80 border-emerald-300 ring-1 ring-emerald-500' 
                        : 'hover:bg-slate-50 border-transparent hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                          index < 3 && deptSortMode === 'tickets' && item.totalTickets > 0
                            ? 'bg-emerald-700 text-white' 
                            : 'bg-slate-200 text-slate-700'
                        }`}>
                          {deptSortMode === 'numerical' ? item.orderNum : index + 1}
                        </span>
                        <span className="font-semibold text-slate-800">{item.department}</span>
                        {item.activeCount > 0 && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                            ค้างซ่อม {item.activeCount}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-slate-400 font-mono">
                          ครุภัณฑ์ {item.assetCount} รายการ
                        </span>
                        <span className="font-bold text-slate-900 font-mono">
                          {item.totalTickets} ใบงาน
                        </span>
                      </div>
                    </div>

                    {/* Gradient Progress Bar */}
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex items-center">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          item.totalTickets === 0 
                            ? 'bg-slate-200 w-1' 
                            : index < 3 && deptSortMode === 'tickets'
                            ? 'bg-gradient-to-r from-emerald-600 to-teal-500' 
                            : 'bg-gradient-to-r from-emerald-700/80 to-teal-600/80'
                        }`}
                        style={{ width: `${item.totalTickets === 0 ? 0 : percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
            <span>คลิกที่แถบเพื่อกรองข้อมูลเฉพาะแผนกนั้น</span>
            <div className="flex items-center gap-4">
              <span>เวลาเฉลี่ยเข้าถึงหน้างาน: <strong className="text-slate-800">18 นาที</strong></span>
              <span>ระยะเวลาเฉลี่ยซ่อมเสร็จ (MTTR): <strong className="text-slate-800">2.4 ชม.</strong></span>
            </div>
          </div>
        </div>

        {/* Asset Operational Status Donut Chart (4 Columns) */}
        <div className="lg:col-span-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <PieChart className="w-4 h-4 text-emerald-700" />
                <h3 className="font-bold text-slate-900 text-sm">
                  สถานะความพร้อมใช้ของครุภัณฑ์
                </h3>
              </div>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              สัดส่วนอุปกรณ์ทางการแพทย์ตามสถานะปฏิบัติการ
            </p>

            {/* Interactive SVG Donut */}
            <div className="relative flex items-center justify-center my-4">
              <svg className="w-52 h-52 transform -rotate-90" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  className="stroke-slate-100"
                  strokeWidth="13"
                  fill="transparent"
                />

                {/* Donut Segments */}
                {statusBreakdown.map((seg, idx) => {
                  const circumference = 2 * Math.PI * 38; // ~238.76
                  const strokeDasharray = `${(seg.pct / 100) * circumference} ${circumference}`;
                  const strokeDashoffset = -((seg.startAngle / 360) * circumference);

                  if (seg.count === 0) return null;

                  return (
                    <circle
                      key={seg.id}
                      cx="50"
                      cy="50"
                      r="38"
                      stroke={seg.color}
                      strokeWidth={hoveredDonutIdx === idx ? "16" : "13"}
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      fill="transparent"
                      className="transition-all duration-300 cursor-pointer"
                      onMouseEnter={() => setHoveredDonutIdx(idx)}
                      onMouseLeave={() => setHoveredDonutIdx(null)}
                    />
                  );
                })}
              </svg>

              {/* Center Metrics Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-[10px] text-slate-400 font-medium">ความพร้อมใช้</span>
                <span className="text-2xl font-black text-slate-900 tracking-tight">{availabilityRate}%</span>
                <span className="text-[10px] text-emerald-700 font-bold">
                  {readyAssetsCount} / {totalAssetsCount} เครื่อง
                </span>
              </div>
            </div>

            {/* Legend with hover highlights */}
            <div className="space-y-2 mt-4">
              {statusBreakdown.map((seg, idx) => (
                <div
                  key={seg.id}
                  onMouseEnter={() => setHoveredDonutIdx(idx)}
                  onMouseLeave={() => setHoveredDonutIdx(null)}
                  className={`flex items-center justify-between p-2 rounded-xl text-xs transition cursor-pointer ${
                    hoveredDonutIdx === idx ? 'bg-slate-100 font-semibold' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-3 h-3 rounded-full shrink-0" 
                      style={{ backgroundColor: seg.color }}
                    />
                    <span className="text-slate-700">{seg.label}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="font-bold text-slate-900">{seg.count}</span>
                    <span className="text-[11px] text-slate-400">({seg.pct.toFixed(0)}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 text-center">
            มูลค่าสุทธิทางบัญชีคงเหลือ: <strong className="text-emerald-900 font-mono font-bold">{totalBookValue.toLocaleString()} ฿</strong>
          </div>
        </div>
      </div>

      {/* Row 2: 12-Month Repair & Cost Trend Chart + AC / PM Compliance Gauges */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* 12-Month Repair Trend Area & Bar Chart (7 Columns) */}
        <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition flex flex-col justify-between">
          <div>
            {/* Header with Title and Contrast Legend */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 shrink-0">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-base tracking-tight font-display">
                      แนวโน้มงานซ่อมและค่าใช้จ่ายรอบ 12 เดือน
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60 hidden sm:inline-block">
                      ปีงบประมาณ 2569
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Monthly Repair Tickets & Maintenance Spend Trend (โรงพยาบาลสังขละบุรี)
                  </p>
                </div>
              </div>

              {/* Distinct High-Contrast Legend Badges */}
              <div className="flex items-center gap-2.5 text-xs bg-slate-50/80 px-3 py-1.5 rounded-xl border border-slate-200/80 self-start sm:self-auto">
                <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                  <span className="w-3 h-3 rounded-md bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 shadow-2xs shadow-teal-500/40"></span>
                  <span className="text-emerald-950 font-bold">จำนวนงาน</span>
                </div>
                <div className="w-px h-3.5 bg-slate-200"></div>
                <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                  <span className="w-3 h-3 rounded-md bg-gradient-to-tr from-amber-600 via-orange-500 to-rose-400 shadow-2xs shadow-orange-500/40"></span>
                  <span className="text-amber-950 font-bold">งบประมาณ (฿)</span>
                </div>
              </div>
            </div>

            {/* Quick Micro-KPI Summary Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5 p-3 rounded-xl bg-gradient-to-r from-slate-50 via-teal-50/30 to-amber-50/30 border border-slate-200/70">
              <div className="flex flex-col">
                <span className="text-[11px] font-medium text-slate-500">รวมงานแจ้งซ่อม</span>
                <span className="text-base sm:text-lg font-black text-slate-900 font-mono tabular-nums tracking-tight">
                  {annualTickets} <span className="text-xs font-medium text-slate-500">งาน</span>
                </span>
                <span className="text-[10px] text-teal-700 font-semibold">เฉลี่ย {avgMonthlyTickets} งาน/ด.</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-medium text-slate-500">งบซ่อมบำรุงรวม</span>
                <span className="text-base sm:text-lg font-black text-amber-700 font-mono tabular-nums tracking-tight">
                  ฿{annualSpend.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">รวมทั้งปี 2569</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-medium text-slate-500">เฉลี่ยต่องานซ่อม</span>
                <span className="text-base sm:text-lg font-black text-slate-800 font-mono tabular-nums tracking-tight">
                  ฿{avgCostPerTicket.toLocaleString()}
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold">คุ้มค่าตามเกณฑ์</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-medium text-slate-500">เดือนงานสูงสุด (Peak)</span>
                <span className="text-base sm:text-lg font-black text-rose-700 font-mono tabular-nums tracking-tight">
                  ก.ย. <span className="text-xs font-semibold text-rose-600">(18 งาน)</span>
                </span>
                <span className="text-[10px] text-rose-600 font-bold">งบ 72,000 ฿</span>
              </div>
            </div>

            {/* Chart Container with Dual-Axis Gridlines */}
            <div className="relative pt-6 pb-2">
              {/* Dual-Axis Dotted Gridlines & Background Scale */}
              <div className="absolute inset-x-0 top-6 bottom-8 pointer-events-none flex flex-col justify-between">
                {[
                  { ticket: '20', spend: '80k' },
                  { ticket: '15', spend: '60k' },
                  { ticket: '10', spend: '40k' },
                  { ticket: '5', spend: '20k' },
                  { ticket: '0', spend: '0' }
                ].map((row, i) => (
                  <div key={i} className="flex items-center justify-between w-full">
                    <span className="text-[10px] font-mono font-bold text-teal-600/70 -ml-1">
                      {row.ticket}
                    </span>
                    <div className="flex-1 mx-2 border-b border-dashed border-slate-200/80"></div>
                    <span className="text-[10px] font-mono font-bold text-amber-600/70 -mr-1">
                      {row.spend}
                    </span>
                  </div>
                ))}
              </div>

              {/* Bar Columns Container */}
              <div className="h-52 flex items-end justify-between gap-1 sm:gap-2 px-6 relative z-10">
                {monthlyTrendData.map((m, idx) => {
                  const barHeightPct = Math.max(8, Math.round((m.tickets / maxMonthlyTickets) * 100));
                  const spendHeightPct = Math.max(8, Math.round((m.spend / maxMonthlySpend) * 100));
                  const isHovered = hoveredMonthIdx === idx;

                  return (
                    <div
                      key={m.month}
                      onMouseEnter={() => setHoveredMonthIdx(idx)}
                      onMouseLeave={() => setHoveredMonthIdx(null)}
                      className={`flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative transition-all duration-200 rounded-xl px-0.5 sm:px-1 py-1 ${
                        isHovered 
                          ? 'bg-slate-100/90 shadow-sm ring-1 ring-slate-300' 
                          : m.isCurrent 
                          ? 'bg-emerald-50/50 ring-1 ring-emerald-200/60' 
                          : 'hover:bg-slate-50/60'
                      }`}
                    >
                      {/* Floating Glassmorphism Tooltip on hover */}
                      {isHovered && (
                        <div className="absolute -top-28 z-40 bg-slate-900/95 backdrop-blur-md text-white rounded-xl shadow-2xl p-3 border border-slate-700 min-w-[210px] pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                          <div className="flex items-center justify-between gap-2 pb-1.5 mb-2 border-b border-slate-800 text-xs">
                            <span className="font-bold text-slate-100 font-display flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-teal-400" />
                              {m.label}
                            </span>
                            {m.isCurrent && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                ปัจจุบัน
                              </span>
                            )}
                            {m.isPeak && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                                พีคสูงสุด
                              </span>
                            )}
                            {m.isForecast && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                คาดการณ์
                              </span>
                            )}
                          </div>

                          <div className="space-y-1.5 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1.5 text-slate-300 text-[11px]">
                                <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                                <span>งานแจ้งซ่อม:</span>
                              </span>
                              <span className="font-mono font-bold text-emerald-300 text-sm">
                                {m.tickets} <span className="text-[10px] text-slate-400 font-normal">งาน</span>
                              </span>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1.5 text-slate-300 text-[11px]">
                                <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                                <span>งบประมาณซ่อม:</span>
                              </span>
                              <span className="font-mono font-bold text-amber-300 text-sm">
                                ฿{m.spend.toLocaleString()}
                              </span>
                            </div>

                            <div className="pt-1.5 mt-1 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                              <span>เฉลี่ย/งาน:</span>
                              <span className="font-mono font-bold text-slate-200">
                                ฿{Math.round(m.spend / (m.tickets || 1)).toLocaleString()} / งาน
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Top Badges for Peak or Current */}
                      <div className="h-4 flex items-center justify-center mb-1">
                        {m.isPeak && (
                          <span className="text-[8px] font-extrabold uppercase px-1 rounded bg-rose-500 text-white tracking-wider shadow-2xs">
                            PEAK
                          </span>
                        )}
                        {m.isCurrent && !m.isPeak && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                        )}
                      </div>

                      {/* Dual Vivid Bars Container */}
                      <div className="w-full flex items-end justify-center gap-1 sm:gap-1.5 h-38">
                        {/* 1. Ticket Volume Bar (Electric Emerald-Teal-Cyan Gradient) */}
                        <div
                          className={`w-3 sm:w-3.5 rounded-t-lg transition-all duration-300 relative group-hover:scale-y-105 origin-bottom ${
                            isHovered
                              ? 'bg-gradient-to-t from-emerald-600 via-teal-400 to-cyan-300 shadow-md shadow-teal-500/50 ring-1 ring-white/50'
                              : m.isForecast
                              ? 'bg-gradient-to-t from-emerald-800/50 via-teal-600/50 to-cyan-500/50 border-t-2 border-dashed border-teal-300'
                              : 'bg-gradient-to-t from-emerald-700 via-teal-500 to-cyan-400 shadow-2xs shadow-teal-600/20'
                          }`}
                          style={{ height: `${barHeightPct}%` }}
                        >
                          {/* Top Cap Light */}
                          <div className="absolute inset-x-0 top-0 h-1 bg-white/40 rounded-t-lg"></div>
                        </div>

                        {/* 2. Spend Volume Bar (Radiant Amber-Orange-Rose Gradient) */}
                        <div
                          className={`w-3 sm:w-3.5 rounded-t-lg transition-all duration-300 relative group-hover:scale-y-105 origin-bottom ${
                            isHovered
                              ? 'bg-gradient-to-t from-amber-600 via-orange-500 to-rose-400 shadow-md shadow-orange-500/50 ring-1 ring-white/50'
                              : m.isForecast
                              ? 'bg-gradient-to-t from-amber-800/50 via-orange-600/50 to-rose-500/50 border-t-2 border-dashed border-amber-300'
                              : 'bg-gradient-to-t from-amber-600 via-orange-500 to-rose-400 shadow-2xs shadow-orange-600/20'
                          }`}
                          style={{ height: `${spendHeightPct}%` }}
                        >
                          {/* Top Cap Light */}
                          <div className="absolute inset-x-0 top-0 h-1 bg-white/40 rounded-t-lg"></div>
                        </div>
                      </div>

                      {/* X-Axis Month Label with Eye-catching Typography */}
                      <div className="mt-2 text-center">
                        <span className={`block text-[11px] font-display transition-all duration-200 ${
                          isHovered 
                            ? 'text-teal-700 font-extrabold scale-110' 
                            : m.isCurrent 
                            ? 'text-emerald-800 font-extrabold bg-emerald-100 px-1.5 py-0.2 rounded-md' 
                            : 'text-slate-600 font-medium'
                        }`}>
                          {m.month}
                        </span>
                        {m.isForecast && (
                          <span className="block text-[8px] text-slate-400 font-light -mt-0.5">
                            คาด
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer Insight & Analytical Note */}
          <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-600 gap-2">
            <div className="flex items-center gap-1.5 text-slate-500">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>
                ข้อสังเกต: ช่วงเดือน ส.ค. - ก.ย. มีการเร่งตรวจสภาพและซ่อมบำรุงก่อนปิดงบประมาณประจำปี
              </span>
            </div>
            <div className="flex items-center gap-2 font-mono text-[11px] shrink-0 font-medium">
              <span className="text-slate-400">เป้าหมายงบปี 2569:</span>
              <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                ไม่เกิน 450,000 ฿ (ใช้ไป 88.1%)
              </span>
            </div>
          </div>
        </div>

        {/* AC Cleaning & Air Quality Compliance Tracker (5 Columns) */}
        <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Wind className="w-4 h-4 text-teal-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  ระบบแจ้งเตือนและล้างแอร์ตามระยะเวลา (HVAC Maintenance)
                </h3>
              </div>
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                acOverdueCount > 0 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {acOverdueCount > 0 ? `เกินกำหนด ${acOverdueCount} จุด` : 'ตามเกณฑ์'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              ควบคุมมาตรฐานอากาศสะอาดห้องผ่าตัดแรงดันบวก Cleanroom และเครื่องปรับอากาศทุกแผนก
            </p>

            <div className="space-y-3">
              {acAssets.slice(0, 3).map((ac) => {
                const isOverdue = ac.nextCleanDate && new Date(ac.nextCleanDate) < new Date();
                return (
                  <div key={ac.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white transition">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 truncate max-w-[200px]">
                        {ac.name}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        isOverdue 
                          ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}>
                        {isOverdue ? '● ครบกำหนดล้าง' : '● ปกติ'}
                      </span>
                    </div>

                    <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                      <span>แผนก: <strong className="text-slate-700">{ac.department}</strong></span>
                      <span className="font-mono">ขนาด {ac.btu?.toLocaleString() || '36,000'} BTU</span>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-200/60">
                      <span className="text-slate-400">รอบล้าง: ทุก {ac.cleaningFrequencyMonths || 3} เดือน</span>
                      <span className="font-semibold text-slate-700 font-mono">
                        กำหนด: {ac.nextCleanDate || '2026-11-15'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 text-[11px]">เกณฑ์กระทรวง: ล้างฟิลเตอร์ทุก 30 วัน, ล้างใหญ่ทุก 90 วัน</span>
            <button
              onClick={() => setActiveTab('pm-calibration')}
              className="text-emerald-700 hover:text-emerald-900 font-bold text-xs flex items-center gap-1 cursor-pointer"
            >
              <span>ดูตารางล้างแอร์</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Recent Work Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              รายการแจ้งซ่อมล่าสุด 6 รายการ (Recent Work Orders)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">สถานะความคืบหน้างานซ่อมและผู้ปฏิบัติงาน</p>
          </div>
          <button
            onClick={() => setActiveTab('work-orders')}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer self-start sm:self-auto"
          >
            <span>ดูรายการแจ้งซ่อมทั้งหมด ({workOrders.length})</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">เลขที่ใบแจ้ง</th>
                <th className="py-3 px-4">รหัส / ชื่อครุภัณฑ์</th>
                <th className="py-3 px-4">แผนก (17 แผนก)</th>
                <th className="py-3 px-4">ความเร่งด่วน</th>
                <th className="py-3 px-4">สถานะ</th>
                <th className="py-3 px-4">ช่างผู้รับผิดชอบ</th>
                <th className="py-3 px-4 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.slice(0, 6).map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    {order.orderNumber}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-slate-900 max-w-xs truncate">{order.assetName}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{order.assetCode}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-800 font-medium">
                    {order.department}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-[11px] font-bold ${
                      order.priority === 'emergency' ? 'text-rose-600' :
                      order.priority === 'urgent' ? 'text-amber-600' : 'text-slate-600'
                    }`}>
                      {order.priority === 'emergency' ? '● ฉุกเฉิน' :
                       order.priority === 'urgent' ? '● เร่งด่วน' : '● ปกติ'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      order.status === 'completed' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                      order.status === 'in_progress' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                      order.status === 'waiting_parts' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                      order.status === 'external' ? 'bg-purple-50 text-purple-800 border border-purple-200' :
                      'bg-slate-100 text-slate-800 border border-slate-200'
                    }`}>
                      {order.status === 'completed' ? 'ซ่อมสำเร็จ' :
                       order.status === 'in_progress' ? 'กำลังซ่อม' :
                       order.status === 'waiting_parts' ? 'รออะไหล่' :
                       order.status === 'external' ? 'ส่งศูนย์นอก' : 'รอดำเนินการ'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-700">
                    {order.assignedTechName || <span className="text-slate-400 italic">ยังไม่ระบุ</span>}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedOrderForDetail(order)}
                        className="text-emerald-700 hover:text-emerald-900 font-semibold cursor-pointer"
                      >
                        ดูรายละเอียด
                      </button>
                      <button
                        onClick={() => setSelectedOrderForPrint(order)}
                        title="พิมพ์ใบสั่งซ่อม"
                        className="p-1 text-slate-400 hover:text-slate-700 rounded transition cursor-pointer"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
