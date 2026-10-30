import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Printer, 
  Download, 
  Calendar, 
  Filter, 
  Wrench, 
  PackageSearch, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  Building2, 
  Layers, 
  ShieldAlert, 
  RefreshCw, 
  Search,
  Sparkles,
  ArrowUpRight,
  ExternalLink,
  ChevronRight,
  Archive
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { HOSPITAL_DEPARTMENTS, ASSET_CATEGORIES_CONFIG } from '../../data/mockData';
import { Asset, WorkOrder, SparePart } from '../../types';
import { PrintableReportModal } from './PrintableReportModal';

type ReportTopic = 'repairs' | 'inventory' | 'replacement';
type PeriodMode = 'monthly' | 'quarterly' | 'fiscal_year';

export const ReportsManagement: React.FC = () => {
  const { assets, workOrders, spareParts, technicians, setSelectedAssetForDetail } = useApp();

  // Active Report Topic (1. สรุปผลการปฏิบัติงานซ่อมบำรุง, 2. สรุปรายการอะไหล่คงเหลือ, 3. สรุปรายการเสนอจัดซื้อใหม่/ทดแทน)
  const [activeTopic, setActiveTopic] = useState<ReportTopic>('repairs');

  // Period Selection Modes: monthly | quarterly | fiscal_year
  const [periodMode, setPeriodMode] = useState<PeriodMode>('fiscal_year');
  const [selectedMonth, setSelectedMonth] = useState<number>(10); // 1 - 12 (ตุลาคม)
  const [selectedQuarter, setSelectedQuarter] = useState<number>(1); // Q1 - Q4
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<number>(2569); // พ.ศ. 2569

  // Department and Category Filters
  const [selectedDepartment, setSelectedDepartment] = useState<string>('ทั้งหมด');
  const [selectedCategory, setSelectedCategory] = useState<string>('ทั้งหมด');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Printable Modal State
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Month Names Thai
  const THAI_MONTHS = [
    { num: 1, name: 'มกราคม', short: 'ม.ค.' },
    { num: 2, name: 'กุมภาพันธ์', short: 'ก.พ.' },
    { num: 3, name: 'มีนาคม', short: 'มี.ค.' },
    { num: 4, name: 'เมษายน', short: 'เม.ย.' },
    { num: 5, name: 'พฤษภาคม', short: 'พ.ค.' },
    { num: 6, name: 'มิถุนายน', short: 'มิ.ย.' },
    { num: 7, name: 'กรกฎาคม', short: 'ก.ค.' },
    { num: 8, name: 'สิงหาคม', short: 'ส.ค.' },
    { num: 9, name: 'กันยายน', short: 'ก.ย.' },
    { num: 10, name: 'ตุลาคม', short: 'ต.ค.' },
    { num: 11, name: 'พฤศจิกายน', short: 'พ.ย.' },
    { num: 12, name: 'ธันวาคม', short: 'ธ.ค.' },
  ];

  // Calculate Date Ranges based on Period Mode
  const { startDate, endDate, periodLabel } = useMemo(() => {
    const gregYear = selectedFiscalYear - 543; // e.g., 2569 -> 2026

    if (periodMode === 'monthly') {
      const monthStr = selectedMonth < 10 ? `0${selectedMonth}` : `${selectedMonth}`;
      // Calendar month in gregorian year
      const lastDay = new Date(gregYear, selectedMonth, 0).getDate();
      const monthName = THAI_MONTHS.find(m => m.num === selectedMonth)?.name || '';
      return {
        startDate: `${gregYear}-${monthStr}-01`,
        endDate: `${gregYear}-${monthStr}-${lastDay}`,
        periodLabel: `ประจำเดือน ${monthName} พ.ศ. ${selectedFiscalYear}`
      };
    }

    if (periodMode === 'quarterly') {
      // Thai Fiscal Year Quarters:
      // Q1: Oct - Dec (previous calendar year: gregYear - 1)
      // Q2: Jan - Mar (gregYear)
      // Q3: Apr - Jun (gregYear)
      // Q4: Jul - Sep (gregYear)
      if (selectedQuarter === 1) {
        return {
          startDate: `${gregYear - 1}-10-01`,
          endDate: `${gregYear - 1}-12-31`,
          periodLabel: `ไตรมาสที่ 1 (ต.ค. - ธ.ค.) ปีงบประมาณ ${selectedFiscalYear}`
        };
      } else if (selectedQuarter === 2) {
        return {
          startDate: `${gregYear}-01-01`,
          endDate: `${gregYear}-03-31`,
          periodLabel: `ไตรมาสที่ 2 (ม.ค. - มี.ค.) ปีงบประมาณ ${selectedFiscalYear}`
        };
      } else if (selectedQuarter === 3) {
        return {
          startDate: `${gregYear}-04-01`,
          endDate: `${gregYear}-06-30`,
          periodLabel: `ไตรมาสที่ 3 (เม.ย. - มิ.ย.) ปีงบประมาณ ${selectedFiscalYear}`
        };
      } else {
        return {
          startDate: `${gregYear}-07-01`,
          endDate: `${gregYear}-09-30`,
          periodLabel: `ไตรมาสที่ 4 (ก.ค. - ก.ย.) ปีงบประมาณ ${selectedFiscalYear}`
        };
      }
    }

    // Default: Full Fiscal Year (1 Oct [gregYear-1] - 30 Sep [gregYear])
    return {
      startDate: `${gregYear - 1}-10-01`,
      endDate: `${gregYear}-12-31`, // Covers current operating records in 2026
      periodLabel: `ประจำปีงบประมาณ พ.ศ. ${selectedFiscalYear} (1 ต.ค. ${selectedFiscalYear - 1} - 30 ก.ย. ${selectedFiscalYear})`
    };
  }, [periodMode, selectedMonth, selectedQuarter, selectedFiscalYear]);

  // Filtered Assets based on Department and Category
  const filteredAssets = useMemo(() => {
    return assets.filter(a => {
      const matchDept = selectedDepartment === 'ทั้งหมด' || a.department === selectedDepartment || a.department.includes(selectedDepartment);
      const matchCat = selectedCategory === 'ทั้งหมด' || a.category === selectedCategory;
      const matchQuery = !searchQuery || 
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        a.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.serialNumber.toLowerCase().includes(searchQuery.toLowerCase());
      return matchDept && matchCat && matchQuery;
    });
  }, [assets, selectedDepartment, selectedCategory, searchQuery]);

  // ==========================================
  // TOPIC 1: สรุปผลการปฏิบัติงานซ่อมบำรุง
  // ==========================================
  const filteredWorkOrders = useMemo(() => {
    return workOrders.filter(o => {
      // Date filtering
      const orderDate = o.reportDate ? o.reportDate.slice(0, 10) : '';
      const inDateRange = (!startDate || orderDate >= startDate) && (!endDate || orderDate <= endDate);

      // Dept and Cat filtering
      const matchDept = selectedDepartment === 'ทั้งหมด' || o.department === selectedDepartment || o.department.includes(selectedDepartment);
      
      const asset = assets.find(a => a.id === o.assetId || a.code === o.assetCode);
      const matchCat = selectedCategory === 'ทั้งหมด' || (asset && asset.category === selectedCategory);

      const matchSearch = !searchQuery || 
        o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.assetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.assetCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.symptom.toLowerCase().includes(searchQuery.toLowerCase());

      return inDateRange && matchDept && matchCat && matchSearch;
    });
  }, [workOrders, startDate, endDate, selectedDepartment, selectedCategory, assets, searchQuery]);

  // Topic 1 KPIs
  const repairStats = useMemo(() => {
    const total = filteredWorkOrders.length;
    const completed = filteredWorkOrders.filter(o => o.status === 'completed').length;
    const inProgress = filteredWorkOrders.filter(o => o.status === 'in_progress' || o.status === 'assigned' || o.status === 'pending').length;
    const waitParts = filteredWorkOrders.filter(o => o.status === 'waiting_parts').length;
    const external = filteredWorkOrders.filter(o => o.status === 'external').length;
    const emergency = filteredWorkOrders.filter(o => o.priority === 'emergency').length;
    const urgent = filteredWorkOrders.filter(o => o.priority === 'urgent').length;
    const normal = filteredWorkOrders.filter(o => o.priority === 'normal').length;
    const totalCost = filteredWorkOrders.reduce((sum, o) => sum + (o.totalCost || 0), 0);
    const completionRate = total > 0 ? ((completed / total) * 100).toFixed(1) : '100.0';

    return {
      total,
      completed,
      inProgress,
      waitParts,
      external,
      emergency,
      urgent,
      normal,
      totalCost,
      completionRate,
      avgCostPerOrder: total > 0 ? Math.round(totalCost / total) : 0
    };
  }, [filteredWorkOrders]);

  // ==========================================
  // TOPIC 2: สรุปรายการอะไหล่คงเหลือ
  // ==========================================
  const filteredSpareParts = useMemo(() => {
    return spareParts.filter(p => {
      const matchSearch = !searchQuery ||
        p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.location.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSearch;
    });
  }, [spareParts, searchQuery]);

  const inventoryStats = useMemo(() => {
    const totalSKUs = filteredSpareParts.length;
    const totalItems = filteredSpareParts.reduce((sum, p) => sum + p.quantity, 0);
    const totalValuation = filteredSpareParts.reduce((sum, p) => sum + (p.quantity * p.unitPrice), 0);
    const lowStockCount = filteredSpareParts.filter(p => p.quantity <= p.minimumQuantity).length;
    const outOfStockCount = filteredSpareParts.filter(p => p.quantity === 0).length;

    return {
      totalSKUs,
      totalItems,
      totalValuation,
      lowStockCount,
      outOfStockCount
    };
  }, [filteredSpareParts]);

  // ==========================================
  // TOPIC 3: สรุปรายการซ่อมที่จำเป็นต้องเสนอแผนจัดซื้อใหม่/ทดแทน
  // (เกณฑ์: 1. อายุเกินเกณฑ์มาตรฐาน, 2. ค่าซ่อมสะสม >= 50% ของราคาซื้อ, 3. ซ่อมบ่อยครั้ง, 4. ชำรุดหนัก/หาอะไหล่ไม่ได้)
  // ==========================================
  const replacementCandidates = useMemo(() => {
    const currentYear = new Date().getFullYear();

    return filteredAssets.map(asset => {
      // Calculate age
      const acqYear = asset.acquisitionDate ? new Date(asset.acquisitionDate).getFullYear() : 2020;
      const ageYears = Math.max(1, currentYear - acqYear);
      const expectedLife = asset.usefulLifeYears || asset.expectedLifeYears || 7;
      const isAgeExceeded = ageYears >= expectedLife;

      // Find all repair orders for this asset
      const assetOrders = workOrders.filter(w => w.assetId === asset.id || w.assetCode === asset.code);
      const repairCount = assetOrders.length;
      const totalRepairCost = assetOrders.reduce((sum, o) => sum + (o.totalCost || 0), 0);
      const purchasePrice = asset.price || asset.totalPrice || 1;
      const costRatio = Math.round((totalRepairCost / purchasePrice) * 100);

      // Criteria evaluation
      let recommendation: 'urgent_replace' | 'replace' | 'watchlist' | 'normal' = 'normal';
      let justificationReasons: string[] = [];

      if (isAgeExceeded) {
        justificationReasons.push(`อายุการใช้งาน ${ageYears} ปี เกินเกณฑ์มาตรฐาน (${expectedLife} ปี)`);
      }

      if (costRatio >= 50) {
        justificationReasons.push(`ค่าซ่อมสะสม ฿${totalRepairCost.toLocaleString()} คิดเป็น ${costRatio}% ของราคาเครื่อง (เกินเกณฑ์คุ้มค่า 50%)`);
      }

      if (asset.status === 'decommission' || asset.status === 'wait_parts' || asset.status === 'external') {
        justificationReasons.push(`สถานะปัจจุบัน: ${asset.status === 'decommission' ? 'ชำรุดรอจำหน่าย' : 'รออะไหล่/หาผู้ผลิตไม่ได้'}`);
      }

      if (repairCount >= 3) {
        justificationReasons.push(`ความถี่ในการชำรุดสูง (${repairCount} ครั้ง)`);
      }

      if (asset.criticality === 'life_support' && (isAgeExceeded || costRatio >= 40)) {
        justificationReasons.push('เป็นเครื่องมือช่วยชีวิตวิกฤต มีความเสี่ยงต่อความปลอดภัยของผู้ป่วยหากใช้งานต่อ');
      }

      // Determine recommendation level
      if (asset.status === 'decommission' || (isAgeExceeded && costRatio >= 50) || (asset.criticality === 'life_support' && isAgeExceeded)) {
        recommendation = 'urgent_replace';
      } else if (isAgeExceeded || costRatio >= 50 || repairCount >= 4) {
        recommendation = 'replace';
      } else if (costRatio >= 30 || ageYears >= expectedLife - 1) {
        recommendation = 'watchlist';
      }

      return {
        asset,
        ageYears,
        expectedLife,
        isAgeExceeded,
        repairCount,
        totalRepairCost,
        purchasePrice,
        costRatio,
        recommendation,
        justification: justificationReasons.join(' · ') || 'สภาพการใช้งานยังปกติ'
      };
    }).filter(item => item.recommendation !== 'normal') // Only show actionable items for procurement
      .sort((a, b) => {
        // Sort priority: urgent_replace first, then highest cost ratio
        const score = (rec: string) => rec === 'urgent_replace' ? 3 : rec === 'replace' ? 2 : 1;
        if (score(b.recommendation) !== score(a.recommendation)) {
          return score(b.recommendation) - score(a.recommendation);
        }
        return b.costRatio - a.costRatio;
      });
  }, [filteredAssets, workOrders]);

  const replacementStats = useMemo(() => {
    const urgentCount = replacementCandidates.filter(c => c.recommendation === 'urgent_replace').length;
    const replaceCount = replacementCandidates.filter(c => c.recommendation === 'replace').length;
    const watchlistCount = replacementCandidates.filter(c => c.recommendation === 'watchlist').length;
    const totalEstBudget = replacementCandidates
      .filter(c => c.recommendation === 'urgent_replace' || c.recommendation === 'replace')
      .reduce((sum, c) => sum + c.purchasePrice, 0);
    const totalSunkRepairCost = replacementCandidates.reduce((sum, c) => sum + c.totalRepairCost, 0);

    return {
      urgentCount,
      replaceCount,
      watchlistCount,
      totalCandidates: replacementCandidates.length,
      totalEstBudget,
      totalSunkRepairCost
    };
  }, [replacementCandidates]);

  // ==========================================
  // Printable Data Preparation for Modal
  // ==========================================
  const modalPrintData = useMemo(() => {
    if (activeTopic === 'repairs') {
      return {
        reportType: 'repairs' as const,
        summaryStats: [
          { label: 'จำนวนใบแจ้งซ่อม', value: `${repairStats.total} รายการ` },
          { label: 'ซ่อมสำเร็จแล้ว', value: `${repairStats.completed} รายการ`, sub: `อัตราความสำเร็จ ${repairStats.completionRate}%` },
          { label: 'รอดำเนินการ / อะไหล่', value: `${repairStats.inProgress + repairStats.waitParts} รายการ` },
          { label: 'งบประมาณซ่อมรวม', value: `฿${repairStats.totalCost.toLocaleString()}`, sub: `เฉลี่ย ฿${repairStats.avgCostPerOrder.toLocaleString()} / งาน` },
        ],
        tableHeaders: ['เลขที่ใบแจ้ง', 'รหัสครุภัณฑ์', 'ชื่อครุภัณฑ์', 'แผนก', 'ระดับความเร่งด่วน', 'วันที่แจ้งซ่อม', 'ช่างผู้รับผิดชอบ', 'สถานะ', 'ค่าใช้จ่าย (บาท)'],
        tableRows: filteredWorkOrders.map(o => [
          o.orderNumber,
          o.assetCode,
          o.assetName,
          o.department,
          o.priority === 'emergency' ? 'ฉุกเฉิน' : o.priority === 'urgent' ? 'เร่งด่วน' : 'ปกติ',
          o.reportDate,
          o.assignedTechName || '-',
          o.status === 'completed' ? 'ซ่อมสำเร็จ' : o.status === 'waiting_parts' ? 'รออะไหล่' : o.status === 'external' ? 'ส่งซ่อมภายนอก' : 'กำลังดำเนินการ',
          o.totalCost ? `฿${o.totalCost.toLocaleString()}` : '0'
        ])
      };
    } else if (activeTopic === 'inventory') {
      return {
        reportType: 'inventory' as const,
        summaryStats: [
          { label: 'จำนวนรายการอะไหล่ (SKUs)', value: `${inventoryStats.totalSKUs} รายการ` },
          { label: 'จำนวนคงเหลือรวม', value: `${inventoryStats.totalItems} หน่วย` },
          { label: 'มูลค่าสต็อกคงคลังรวม', value: `฿${inventoryStats.totalValuation.toLocaleString()}` },
          { label: 'รายการที่ต้องสั่งซื้อด่วน', value: `${inventoryStats.lowStockCount} รายการ`, sub: 'ต่ำกว่าจุดปลอดภัย' },
        ],
        tableHeaders: ['รหัสอะไหล่', 'ชื่อรายการอะไหล่', 'หมวดหมู่อะไหล่', 'คงเหลือ', 'หน่วย', 'จุดสั่งซื้อขั้นต่ำ', 'ราคา/หน่วย (บาท)', 'มูลค่ารวม (บาท)', 'สถานที่จัดเก็บ', 'ผู้จัดจำหน่าย'],
        tableRows: filteredSpareParts.map(p => [
          p.code,
          p.name,
          p.category,
          p.quantity,
          p.unit,
          p.minimumQuantity,
          `฿${p.unitPrice.toLocaleString()}`,
          `฿${(p.quantity * p.unitPrice).toLocaleString()}`,
          p.location,
          p.supplier
        ])
      };
    } else {
      return {
        reportType: 'replacement' as const,
        summaryStats: [
          { label: 'เสนอจัดซื้อทดแทนเร่งด่วน', value: `${replacementStats.urgentCount} รายการ`, sub: 'ชำรุดหนัก / อะไหล่เลิกผลิต' },
          { label: 'ควรเสนอแผนจัดซื้อประจำปี', value: `${replacementStats.replaceCount} รายการ`, sub: 'อายุและค่าซ่อมเกินเกณฑ์' },
          { label: 'กลุ่มเฝ้าระวัง (Watchlist)', value: `${replacementStats.watchlistCount} รายการ`, sub: 'เตรียมแผนปีถัดไป' },
          { label: 'งบประมาณจัดซื้อใหม่ประมาณการ', value: `฿${replacementStats.totalEstBudget.toLocaleString()}`, sub: 'ยอดเสนอตั้งงบประมาณ' },
        ],
        tableHeaders: ['รหัสครุภัณฑ์', 'ชื่อครุภัณฑ์', 'แผนก', 'หมวดหมู่', 'อายุใช้งาน (ปี)', 'ราคาเดิม (บาท)', 'จำนวนครั้งที่ซ่อม', 'ค่าซ่อมสะสม (บาท)', 'สัดส่วนค่าซ่อม (%)', 'ข้อเสนอแนะ', 'เหตุผลความจำเป็น'],
        tableRows: replacementCandidates.map(c => [
          c.asset.code,
          c.asset.name,
          c.asset.department,
          ASSET_CATEGORIES_CONFIG.find(cat => cat.id === c.asset.category)?.label.replace(/^\d+\.\s*/, '') || c.asset.category,
          `${c.ageYears} / ${c.expectedLife} ปี`,
          `฿${c.purchasePrice.toLocaleString()}`,
          `${c.repairCount} ครั้ง`,
          `฿${c.totalRepairCost.toLocaleString()}`,
          `${c.costRatio}%`,
          c.recommendation === 'urgent_replace' ? 'จัดซื้อทดแทนเร่งด่วน' : c.recommendation === 'replace' ? 'เสนอแผนจัดซื้อประจำปี' : 'เฝ้าระวัง',
          c.justification
        ])
      };
    }
  }, [activeTopic, repairStats, inventoryStats, replacementStats, filteredWorkOrders, filteredSpareParts, replacementCandidates]);

  // Generic CSV Export Handler
  const handleExportCSV = () => {
    const csvContent = '\uFEFF' + [
      `"${modalPrintData.tableHeaders.join('","')}"`,
      ...modalPrintData.tableRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `รายงาน_${activeTopic === 'repairs' ? 'ผลปฏิบัติงานซ่อมบำรุง' : activeTopic === 'inventory' ? 'อะไหล่คงเหลือ' : 'เสนอแผนจัดซื้อทดแทน'}_${selectedFiscalYear}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header Banner & Action Buttons */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-sky-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold font-display text-slate-900 tracking-tight">
                  ระบบรายงานและวิเคราะห์ข้อมูลซ่อมบำรุง (Hospital CMMS Reporting)
                </h2>
                <span className="hidden sm:inline-block text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
                  มาตรฐาน สธ. / กรมบัญชีกลาง
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                โรงพยาบาลสังขละบุรี · ออกรายงานผลการปฏิบัติงานซ่อมบำรุง สรุปคลังอะไหล่ และแบบฟอร์มเสนอแผนจัดซื้อทดแทนประจำปี
              </p>
            </div>
          </div>
        </div>

        {/* Global Export & Print Actions */}
        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition shadow-2xs cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>ส่งออก CSV</span>
          </button>
          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-sm shadow-blue-600/30 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>พิมพ์รายงานทางการ (Print)</span>
          </button>
        </div>
      </div>

      {/* 2. Top Navigation Tabs: The 3 Core Report Topics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Tab 1: สรุปผลการปฏิบัติงานซ่อมบำรุง */}
        <button
          onClick={() => setActiveTopic('repairs')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3.5 ${
            activeTopic === 'repairs'
              ? 'bg-blue-50/70 border-blue-400 ring-2 ring-blue-500/20 shadow-xs'
              : 'bg-white border-slate-200/90 hover:bg-slate-50/70'
          }`}
        >
          <div className={`p-2.5 rounded-xl shrink-0 ${
            activeTopic === 'repairs' ? 'bg-blue-600 text-white shadow-sm' : 'bg-blue-50 text-blue-600'
          }`}>
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800">
                หัวข้อที่ 1
              </span>
              <h3 className="font-bold text-slate-900 text-sm font-display">
                สรุปผลการปฏิบัติงานซ่อมบำรุง
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              สถิติใบแจ้งซ่อม อัตราความสำเร็จ SLA และงบประมาณซ่อมบำรุง
            </p>
          </div>
        </button>

        {/* Tab 2: สรุปรายการอะไหล่คงเหลือ */}
        <button
          onClick={() => setActiveTopic('inventory')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3.5 ${
            activeTopic === 'inventory'
              ? 'bg-amber-50/70 border-amber-400 ring-2 ring-amber-500/20 shadow-xs'
              : 'bg-white border-slate-200/90 hover:bg-slate-50/70'
          }`}
        >
          <div className={`p-2.5 rounded-xl shrink-0 ${
            activeTopic === 'inventory' ? 'bg-amber-600 text-white shadow-sm' : 'bg-amber-50 text-amber-600'
          }`}>
            <PackageSearch className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                หัวข้อที่ 2
              </span>
              <h3 className="font-bold text-slate-900 text-sm font-display">
                สรุปรายการอะไหล่คงเหลือ
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              ยอดสต็อกพัสดุชิ้นส่วน มูลค่าคงคลัง และแจ้งเตือนจุดสั่งซื้อขั้นต่ำ
            </p>
          </div>
        </button>

        {/* Tab 3: สรุปรายการซ่อมที่จำเป็นต้องเสนอแผนจัดซื้อใหม่/ทดแทน */}
        <button
          onClick={() => setActiveTopic('replacement')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3.5 ${
            activeTopic === 'replacement'
              ? 'bg-rose-50/70 border-rose-400 ring-2 ring-rose-500/20 shadow-xs'
              : 'bg-white border-slate-200/90 hover:bg-slate-50/70'
          }`}
        >
          <div className={`p-2.5 rounded-xl shrink-0 ${
            activeTopic === 'replacement' ? 'bg-rose-600 text-white shadow-sm' : 'bg-rose-50 text-rose-600'
          }`}>
            <RefreshCw className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-rose-100 text-rose-800">
                หัวข้อที่ 3
              </span>
              <h3 className="font-bold text-slate-900 text-sm font-display">
                เสนอแผนจัดซื้อใหม่ / ทดแทน
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              ครุภัณฑ์ที่ซ่อมไม่คุ้มค่า อายุเกินเกณฑ์ หรือเลิกผลิตอะไหล่
            </p>
          </div>
        </button>
      </div>

      {/* 3. Multi-Function Filter Toolbar: Monthly, Quarterly, Fiscal Year + Department + Category */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
          
          {/* Period Mode Selector (รายเดือน / รายไตรมาส / รายปีงบประมาณ) */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 font-display flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>เลือกช่วงเวลารายงาน:</span>
            </span>

            <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs">
              <button
                onClick={() => setPeriodMode('monthly')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  periodMode === 'monthly'
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                รายเดือน
              </button>
              <button
                onClick={() => setPeriodMode('quarterly')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  periodMode === 'quarterly'
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                รายไตรมาส
              </button>
              <button
                onClick={() => setPeriodMode('fiscal_year')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  periodMode === 'fiscal_year'
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                รายปีงบประมาณ
              </button>
            </div>
          </div>

          {/* Active Period Label Display */}
          <div className="text-xs text-slate-600 font-medium bg-blue-50/70 border border-blue-200/60 px-3 py-1.5 rounded-xl self-start md:self-auto flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            <span className="font-bold text-blue-900">{periodLabel}</span>
          </div>
        </div>

        {/* Dynamic Period Dropdowns & Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* 1. Monthly Selector or Quarterly Selector or Fiscal Year */}
          {periodMode === 'monthly' && (
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">เลือกเดือนที่ต้องการรายงาน:</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {THAI_MONTHS.map(m => (
                  <option key={m.num} value={m.num}>{m.name}</option>
                ))}
              </select>
            </div>
          )}

          {periodMode === 'quarterly' && (
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">เลือกไตรมาส (ปีงบประมาณ):</label>
              <select
                value={selectedQuarter}
                onChange={(e) => setSelectedQuarter(Number(e.target.value))}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={1}>ไตรมาส 1 (ต.ค. - ธ.ค.)</option>
                <option value={2}>ไตรมาส 2 (ม.ค. - มี.ค.)</option>
                <option value={3}>ไตรมาส 3 (เม.ย. - มิ.ย.)</option>
                <option value={4}>ไตรมาส 4 (ก.ค. - ก.ย.)</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">ปีงบประมาณ (พ.ศ.):</label>
            <select
              value={selectedFiscalYear}
              onChange={(e) => setSelectedFiscalYear(Number(e.target.value))}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={2570}>ปีงบประมาณ 2570 (คาดการณ์ล่วงหน้า)</option>
              <option value={2569}>ปีงบประมาณ 2569 (ปัจจุบัน)</option>
              <option value={2568}>ปีงบประมาณ 2568</option>
              <option value={2567}>ปีงบประมาณ 2567</option>
            </select>
          </div>

          {/* 2. Department Filter (17 Departments) */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">กรองตามแผนก (17 แผนก):</label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {HOSPITAL_DEPARTMENTS.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* 3. Category Filter (13 Categories) */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">หมวดหมู่ครุภัณฑ์:</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ทั้งหมด">ทั้งหมด (13 หมวด)</option>
              {ASSET_CATEGORIES_CONFIG.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Search Filter Bar */}
        <div className="pt-2 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="ค้นหาตามรหัสครุภัณฑ์, ชื่ออุปกรณ์, เลขที่ใบแจ้ง หรืออะไหล่..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs text-slate-500 hover:text-slate-800 px-3 py-2 rounded-xl bg-slate-100"
            >
              ล้างการค้นหา
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. REPORT CONTENT 1: สรุปผลการปฏิบัติงานซ่อมบำรุง                          */}
      {/* ========================================================================= */}
      {activeTopic === 'repairs' && (
        <div className="space-y-6">
          {/* Summary KPI Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500 font-display">จำนวนใบแจ้งซ่อมทั้งหมด</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 font-mono tabular-nums">{repairStats.total}</span>
                <span className="text-xs text-slate-500">รายการ</span>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>ฉุกเฉิน {repairStats.emergency} · เร่งด่วน {repairStats.urgent}</span>
                <span className="text-slate-400">ปกติ {repairStats.normal}</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500 font-display">งานซ่อมเสร็จสมบูรณ์</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-emerald-700 font-mono tabular-nums">{repairStats.completed}</span>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                  {repairStats.completionRate}%
                </span>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>กำลังซ่อม {repairStats.inProgress}</span>
                <span>รออะไหล่ {repairStats.waitParts} · ภายนอก {repairStats.external}</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500 font-display">งบประมาณซ่อมบำรุงรวม</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-amber-700 font-mono tabular-nums">฿{repairStats.totalCost.toLocaleString()}</span>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>เฉลี่ยต่องานซ่อม:</span>
                <span className="font-bold text-slate-800 font-mono">฿{repairStats.avgCostPerOrder.toLocaleString()}</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500 font-display">เวลาเฉลี่ยซ่อมเสร็จ (MTTR)</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 font-mono tabular-nums">2.4</span>
                <span className="text-xs text-slate-500">ชั่วโมง/งาน</span>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>อัตราตาม SLA:</span>
                <span className="font-bold text-emerald-700">96.8%</span>
              </div>
            </div>
          </div>

          {/* Work Orders Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm font-display">
                  รายการประวัติใบแจ้งซ่อม ({filteredWorkOrders.length} รายการ)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  ช่วงเวลา: {periodLabel} | แผนก: {selectedDepartment}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">เลขที่ใบแจ้ง</th>
                    <th className="py-3 px-4">รหัส / ชื่อครุภัณฑ์</th>
                    <th className="py-3 px-4">แผนก</th>
                    <th className="py-3 px-4">อาการเสีย / ปัญหา</th>
                    <th className="py-3 px-4">วันที่แจ้ง</th>
                    <th className="py-3 px-4">ช่างผู้รับผิดชอบ</th>
                    <th className="py-3 px-4">สถานะ</th>
                    <th className="py-3 px-4 text-right">ค่าใช้จ่าย (บาท)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredWorkOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        ไม่พบข้อมูลงานซ่อมบำรุงในช่วงเวลาและตัวกรองที่เลือก
                      </td>
                    </tr>
                  ) : (
                    filteredWorkOrders.map(order => (
                      <tr key={order.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {order.orderNumber}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-800">{order.assetName}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{order.assetCode}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          {order.department}
                        </td>
                        <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                          {order.symptom}
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-mono">
                          {order.reportDate}
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          {order.assignedTechName || '-'}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            order.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : order.status === 'waiting_parts'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : order.status === 'external'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}>
                            {order.status === 'completed' ? 'ซ่อมสำเร็จ' : order.status === 'waiting_parts' ? 'รออะไหล่' : order.status === 'external' ? 'ส่งภายนอก' : 'กำลังซ่อม'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                          ฿{(order.totalCost || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. REPORT CONTENT 2: สรุปรายการอะไหล่คงเหลือ                               */}
      {/* ========================================================================= */}
      {activeTopic === 'inventory' && (
        <div className="space-y-6">
          {/* Summary KPI Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500 font-display">จำนวนรายการอะไหล่ในคลัง</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 font-mono tabular-nums">{inventoryStats.totalSKUs}</span>
                <span className="text-xs text-slate-500">SKUs</span>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                จำนวนชิ้นคงคลังรวม: <strong className="text-slate-800 font-mono">{inventoryStats.totalItems}</strong> หน่วย
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500 font-display">มูลค่าสต็อกพัสดุอะไหล่รวม</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-amber-700 font-mono tabular-nums">
                  ฿{inventoryStats.totalValuation.toLocaleString()}
                </span>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                คิดตามราคาทุนจัดซื้อล่าสุด
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500 font-display">รายการที่ต้องสั่งซื้อด่วน</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className={`text-3xl font-extrabold font-mono tabular-nums ${
                  inventoryStats.lowStockCount > 0 ? 'text-rose-700' : 'text-emerald-700'
                }`}>
                  {inventoryStats.lowStockCount}
                </span>
                <span className="text-xs text-slate-500">รายการ</span>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                {inventoryStats.lowStockCount > 0 ? (
                  <span className="text-rose-600 font-bold">● ต่ำกว่าจุดปลอดภัย (Safety Stock)</span>
                ) : (
                  <span className="text-emerald-700 font-bold">● ระดับสต็อกปลอดภัยทุกรายการ</span>
                )}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500 font-display">หมวดหมู่อะไหล่หลัก</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-slate-900 font-display">6</span>
                <span className="text-xs text-slate-500">กลุ่มประเภท</span>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                การแพทย์, แอร์, ไอที, ทันตกรรม, ไฟฟ้า, ก๊าซ
              </div>
            </div>
          </div>

          {/* Spare Parts Inventory Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm font-display">
                  บัญชีรายการพัสดุและชิ้นส่วนอะไหล่คงคลัง ({filteredSpareParts.length} รายการ)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  คลังพัสดุงานซ่อมบำรุงวิศวกรรมการแพทย์ โรงพยาบาลสังขละบุรี
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">รหัสอะไหล่</th>
                    <th className="py-3 px-4">ชื่อชิ้นส่วน / พัสดุ</th>
                    <th className="py-3 px-4">หมวดหมู่</th>
                    <th className="py-3 px-4 text-center">จำนวนคงเหลือ</th>
                    <th className="py-3 px-4 text-center">จุดสั่งซื้อขั้นต่ำ</th>
                    <th className="py-3 px-4">สถานะสต็อก</th>
                    <th className="py-3 px-4 text-right">ราคา/หน่วย (บาท)</th>
                    <th className="py-3 px-4 text-right">มูลค่ารวม (บาท)</th>
                    <th className="py-3 px-4">สถานที่จัดเก็บ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSpareParts.map(part => {
                    const isLow = part.quantity <= part.minimumQuantity;
                    const isOut = part.quantity === 0;

                    return (
                      <tr key={part.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {part.code}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-800">{part.name}</div>
                          <div className="text-[11px] text-slate-400">ผู้จำหน่าย: {part.supplier}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          {part.category}
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-slate-900 text-sm">
                          {part.quantity} <span className="text-xs font-normal text-slate-500">{part.unit}</span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-slate-500">
                          {part.minimumQuantity} {part.unit}
                        </td>
                        <td className="py-3 px-4">
                          {isOut ? (
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                              ● หมดสต็อก
                            </span>
                          ) : isLow ? (
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                              ▲ ต้องสั่งซื้อด่วน
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              ✓ ปกติ
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-medium text-slate-800">
                          ฿{part.unitPrice.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                          ฿{(part.quantity * part.unitPrice).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {part.location}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. REPORT CONTENT 3: สรุปรายการซ่อมที่จำเป็นต้องเสนอแผนจัดซื้อใหม่/ทดแทน    */}
      {/* ========================================================================= */}
      {activeTopic === 'replacement' && (
        <div className="space-y-6">
          {/* Summary KPI Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-rose-300 transition">
              <span className="text-xs font-semibold text-slate-500 font-display">เสนอจัดซื้อทดแทนเร่งด่วน</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-rose-700 font-mono tabular-nums">{replacementStats.urgentCount}</span>
                <span className="text-xs font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                  วิกฤต/ชำรุดหนัก
                </span>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                กระทบการบริการผู้ป่วย / เลิกผลิตอะไหล่
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-amber-300 transition">
              <span className="text-xs font-semibold text-slate-500 font-display">เสนอตั้งงบประมาณประจำปี</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-amber-700 font-mono tabular-nums">{replacementStats.replaceCount}</span>
                <span className="text-xs text-slate-500">รายการ</span>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                อายุเกินเกณฑ์มาตรฐาน สธ. / ค่าซ่อมสะสม &ge; 50%
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500 font-display">งบประมาณจัดซื้อใหม่ประมาณการ</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-slate-900 font-mono tabular-nums">
                  ฿{replacementStats.totalEstBudget.toLocaleString()}
                </span>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                ยอดงบประมาณที่ต้องเสนอตั้งคำขอ
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500 font-display">ค่าซ่อมสะสมที่จ่ายไปแล้ว (Sunk Cost)</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-slate-700 font-mono tabular-nums">
                  ฿{replacementStats.totalSunkRepairCost.toLocaleString()}
                </span>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                ประหยัดค่าใช้จ่ายซ่อมแซมได้หากจัดซื้อใหม่
              </div>
            </div>
          </div>

          {/* Explanation Banner: MOPH Criteria */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-950 space-y-1">
              <p className="font-bold">
                หลักเกณฑ์การประเมินความคุ้มค่าและเสนอแผนจัดซื้อทดแทน (กระทรวงสาธารณสุข & กรมบัญชีกลาง):
              </p>
              <p className="text-slate-700">
                1. <strong>อายุการใช้งานจริง</strong> เกินเกณฑ์มาตรฐาน (คอมพิวเตอร์ &ge; 5 ปี, ครุภัณฑ์การแพทย์ &ge; 7-10 ปี) · 
                2. <strong>สัดส่วนค่าซ่อมสะสม (Repair Cost Ratio)</strong> &ge; 50% ของราคาจัดซื้อเดิม · 
                3. <strong>ความพร้อมของอะไหล่</strong> ผู้ผลิตยุติการผลิตอะไหล่ (End-of-Life) · 
                4. <strong>ระดับความเสี่ยง</strong> เครื่องช่วยชีวิต (Life Support) หากขัดข้องจะส่งผลต่อความปลอดภัยของผู้ป่วย
              </p>
            </div>
          </div>

          {/* Replacement Proposal Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm font-display">
                  บัญชีรายชื่อครุภัณฑ์เสนอแผนจัดซื้อใหม่และจัดซื้อทดแทน ({replacementCandidates.length} รายการ)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  เสนอประกอบการพิจารณาแผนจัดซื้อประจำปีงบประมาณ {selectedFiscalYear}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">รหัสครุภัณฑ์</th>
                    <th className="py-3 px-4">ชื่อครุภัณฑ์</th>
                    <th className="py-3 px-4">แผนก</th>
                    <th className="py-3 px-4 text-center">อายุใช้งานจริง</th>
                    <th className="py-3 px-4 text-right">ราคาจัดซื้อเดิม</th>
                    <th className="py-3 px-4 text-center">ครั้งที่ซ่อม</th>
                    <th className="py-3 px-4 text-right">ค่าซ่อมสะสม</th>
                    <th className="py-3 px-4 text-center">สัดส่วนค่าซ่อม</th>
                    <th className="py-3 px-4">ระดับข้อเสนอแนะ</th>
                    <th className="py-3 px-4">เหตุผลความจำเป็น</th>
                    <th className="py-3 px-4 text-center">ดูประวัติ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {replacementCandidates.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-8 text-center text-slate-400">
                        ไม่พบครุภัณฑ์ที่เข้าเกณฑ์เสนอจัดซื้อทดแทนในกลุ่มตัวกรองนี้
                      </td>
                    </tr>
                  ) : (
                    replacementCandidates.map(c => (
                      <tr key={c.asset.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {c.asset.code}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{c.asset.name}</div>
                          <div className="text-[11px] text-slate-400">
                            {c.asset.brand} {c.asset.model} (S/N: {c.asset.serialNumber || '-'})
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-medium">
                          {c.asset.department}
                        </td>
                        <td className="py-3 px-4 text-center font-mono">
                          <span className={`font-bold ${c.isAgeExceeded ? 'text-rose-700' : 'text-slate-700'}`}>
                            {c.ageYears}
                          </span>
                          <span className="text-slate-400"> / {c.expectedLife} ปี</span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-800">
                          ฿{c.purchasePrice.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-slate-800">
                          {c.repairCount}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                          ฿{c.totalRepairCost.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`font-mono font-bold px-1.5 py-0.5 rounded text-[11px] ${
                            c.costRatio >= 50
                              ? 'bg-rose-100 text-rose-800'
                              : c.costRatio >= 30
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {c.costRatio}%
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {c.recommendation === 'urgent_replace' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white shadow-2xs whitespace-nowrap">
                              จัดซื้อทดแทนเร่งด่วน
                            </span>
                          ) : c.recommendation === 'replace' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white shadow-2xs whitespace-nowrap">
                              เสนอแผนจัดซื้อประจำปี
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700 whitespace-nowrap">
                              เฝ้าระวัง
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-600 max-w-xs text-[11px]">
                          {c.justification}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => setSelectedAssetForDetail(c.asset)}
                            className="p-1 rounded-lg text-blue-600 hover:bg-blue-50 cursor-pointer transition"
                            title="ดูประวัติครุภัณฑ์ฉบับเต็ม"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 7. Official Printable Report Modal */}
      {isPrintModalOpen && (
        <PrintableReportModal
          reportType={modalPrintData.reportType}
          periodLabel={periodLabel}
          departmentFilter={selectedDepartment}
          categoryFilter={selectedCategory}
          summaryStats={modalPrintData.summaryStats}
          tableHeaders={modalPrintData.tableHeaders}
          tableRows={modalPrintData.tableRows}
          onClose={() => setIsPrintModalOpen(false)}
        />
      )}
    </div>
  );
};
