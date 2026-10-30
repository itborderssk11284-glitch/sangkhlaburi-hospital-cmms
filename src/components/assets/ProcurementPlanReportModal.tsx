import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  FileText, 
  AlertTriangle, 
  TrendingUp, 
  ShieldAlert, 
  CheckCircle, 
  Clock, 
  DollarSign,
  Building,
  Check
} from 'lucide-react';
import { Asset, WorkOrder, ReplacementIndicator } from '../../types';
import { useApp } from '../../context/AppContext';

export const ProcurementPlanReportModal: React.FC<{
  onClose: () => void;
}> = ({ onClose }) => {
  const { assets, workOrders } = useApp();

  const [filterRecommendation, setFilterRecommendation] = useState<string>('all');
  const [fiscalYear, setFiscalYear] = useState('2570');

  // Calculate procurement indicators for every asset
  const currentYear = 2026;
  const indicators: ReplacementIndicator[] = assets.map(asset => {
    const acqYear = parseInt(asset.acquisitionDate.slice(0, 4)) || 2023;
    const ageYears = currentYear - acqYear;
    const expectedLife = asset.expectedLifeYears || (
      asset.category === 'computer_it' ? 5 :
      asset.category === 'vehicle_transport' ? 8 :
      asset.category === 'hvac_aircon' ? 7 :
      asset.category === 'medical_health' ? 8 : 10
    );

    const relatedOrders = workOrders.filter(o => o.assetId === asset.id || o.assetCode === asset.code);
    const repairCount = relatedOrders.length;
    const totalRepairCost = relatedOrders.reduce((sum, o) => sum + (o.totalCost || 0), 0);
    const repairCostRatio = asset.price > 0 ? (totalRepairCost / asset.price) * 100 : 0;
    const ageExceeded = ageYears >= expectedLife;

    let recommendation: 'urgent_replace' | 'watchlist' | 'good_condition' = 'good_condition';
    let justificationReason = 'สภาพพร้อมใช้งาน อัตราค่าซ่อมยังอยู่ในเกณฑ์มาตรฐาน';

    if ((ageExceeded && repairCostRatio > 15) || repairCostRatio > 40 || (ageExceeded && ageYears >= expectedLife + 2)) {
      recommendation = 'urgent_replace';
      justificationReason = `อายุใช้งาน ${ageYears} ปี (เกณฑ์ สธ. ${expectedLife} ปี) ${repairCostRatio > 0 ? `ค่าซ่อมสะสม ${repairCostRatio.toFixed(1)}%` : ''} ซ่อมซ้ำซาก อะไหล่เริ่มหายาก เข้าเกณฑ์ขอตั้งงบทดแทน`;
    } else if (ageExceeded || repairCostRatio > 20 || repairCount >= 3) {
      recommendation = 'watchlist';
      justificationReason = `ใกล้หมดอายุการใช้งานตามเกณฑ์ (${ageYears}/${expectedLife} ปี) มีประวัติซ่อม ${repairCount} ครั้ง เฝ้าระวังเพื่อเตรียมแผนงบประมาณ`;
    }

    return {
      assetId: asset.id,
      assetCode: asset.code,
      assetName: asset.name,
      department: asset.department,
      category: asset.category,
      price: asset.price,
      ageYears,
      expectedLifeYears: expectedLife,
      ageExceeded,
      repairCount,
      totalRepairCost,
      repairCostRatio,
      recommendation,
      justificationReason,
    };
  });

  const urgentList = indicators.filter(i => i.recommendation === 'urgent_replace');
  const watchlist = indicators.filter(i => i.recommendation === 'watchlist');
  const goodList = indicators.filter(i => i.recommendation === 'good_condition');

  const filteredIndicators = indicators.filter(i => {
    if (filterRecommendation === 'all') return true;
    return i.recommendation === filterRecommendation;
  });

  const estimatedUrgentBudget = urgentList.reduce((sum, i) => sum + i.price, 0);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = [
      'รหัสครุภัณฑ์',
      'ชื่อครุภัณฑ์',
      'แผนกที่ตั้ง',
      'มูลค่าจัดซื้อเดิม(บาท)',
      'อายุใช้งานจริง(ปี)',
      'เกณฑ์อายุ สธ.(ปี)',
      'จำนวนครั้งที่ซ่อม',
      'ค่าซ่อมสะสม(บาท)',
      'อัตราส่วนค่าซ่อมต่อราคา(%)',
      'ข้อเสนอแนะตัวชี้วัด',
      'เหตุผลความจำเป็นประกอบแผนจัดซื้อ'
    ];

    const rows = indicators.map(i => [
      `"${i.assetCode}"`,
      `"${i.assetName.replace(/"/g, '""')}"`,
      `"${i.department}"`,
      i.price,
      i.ageYears,
      i.expectedLifeYears,
      i.repairCount,
      i.totalRepairCost,
      i.repairCostRatio.toFixed(1),
      `"${i.recommendation === 'urgent_replace' ? 'เสนอปลดระวางจัดซื้อทดแทนเร่งด่วน' : i.recommendation === 'watchlist' ? 'เฝ้าระวังเตรียมตั้งงบประมาณ' : 'ใช้งานต่อได้'}"`,
      `"${i.justificationReason.replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `รายงานตัวชี้วัดแผนจัดซื้อครุภัณฑ์_รพ_สังขละบุรี_ปี_${fiscalYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full my-auto overflow-hidden border border-slate-200">
        {/* Top Control Bar (hidden on print) */}
        <div className="bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between no-print">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-emerald-400" />
            <div>
              <span className="font-bold text-sm">
                รายงานประวัติการซ่อมบำรุงและตัวชี้วัดเสนอแผนจัดซื้อครุภัณฑ์ประจำปีงบประมาณ
              </span>
              <p className="text-[11px] text-slate-300">
                โรงพยาบาลสังขละบุรี · เกณฑ์อายุการใช้งานและการวิเคราะห์ความคุ้มค่าการซ่อมบำรุง (สธ.)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ส่งออก CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>พิมพ์รายงาน (Print)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable & Interactive Body */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[82vh] overflow-y-auto bg-white" id="procurement-report-sheet">
          {/* Official Document Header */}
          <div className="border-b-2 border-emerald-900 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img
                  src="/assets/aistudio/Logo_SK_-_______26693d5e.png"
                  alt="Hospital Logo"
                  className="w-16 h-16 object-contain"
                />
                <div>
                  <h2 className="text-lg font-bold text-emerald-950">
                    โรงพยาบาลสังขละบุรี จังหวัดกาญจนบุรี
                  </h2>
                  <p className="text-xs text-slate-600 font-medium">
                    กลุ่มงานบริหารทั่วไปและงานซ่อมบำรุงวิศวกรรมการแพทย์
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    เอกสารประกอบการจัดทำแผนจัดซื้อครุภัณฑ์ทดแทนและแผนเงินบำรุง ประจำปีงบประมาณ พ.ศ. {fiscalYear}
                  </p>
                </div>
              </div>

              <div className="text-right text-xs">
                <span className="font-semibold text-slate-700 block">วันที่ประมวลผล:</span>
                <span className="text-slate-900 font-mono font-bold">{new Date().toISOString().slice(0, 10)}</span>
                <span className="inline-block mt-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                  ระบบวิเคราะห์อัตโนมัติ (CMMS)
                </span>
              </div>
            </div>
          </div>

          {/* Indicator Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200 text-xs">
              <div className="flex items-center justify-between font-bold text-rose-900">
                <span>1. เสนอจัดซื้อทดแทนเร่งด่วน</span>
                <ShieldAlert className="w-4 h-4 text-rose-600" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-rose-700">{urgentList.length}</span>
                <span className="text-xs text-rose-600">รายการ</span>
              </div>
              <p className="text-[11px] text-slate-600 mt-1">
                อายุเกินเกณฑ์ สธ. + ค่าซ่อมสะสมสูง หรือไม่มีอะไหล่รองรับ
              </p>
              <div className="mt-2 pt-2 border-t border-rose-200 text-[11px] font-semibold text-rose-800">
                ประมาณการงบประมาณ: {estimatedUrgentBudget.toLocaleString()} ฿
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs">
              <div className="flex items-center justify-between font-bold text-amber-900">
                <span>2. กลุ่มเฝ้าระวัง (Watchlist)</span>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-amber-700">{watchlist.length}</span>
                <span className="text-xs text-amber-600">รายการ</span>
              </div>
              <p className="text-[11px] text-slate-600 mt-1">
                เริ่มเข้าใกล้เกณฑ์ปลดระวาง มีประวัติซ่อม 2-3 ครั้ง
              </p>
              <div className="mt-2 pt-2 border-t border-amber-200 text-[11px] font-semibold text-amber-800">
                เตรียมจัดลำดับความสำคัญในแผนปีถัดไป
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs">
              <div className="flex items-center justify-between font-bold text-emerald-900">
                <span>3. สภาพพร้อมใช้งานต่อเนื่อง</span>
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-emerald-800">{goodList.length}</span>
                <span className="text-xs text-emerald-600">รายการ</span>
              </div>
              <p className="text-[11px] text-slate-600 mt-1">
                ประสิทธิภาพสมบูรณ์ ไม่จำเป็นต้องตั้งงบจัดซื้อทดแทน
              </p>
              <div className="mt-2 pt-2 border-t border-emerald-200 text-[11px] font-semibold text-emerald-800">
                ดำเนินการตามแผนบำรุงรักษา PM ปกติ
              </div>
            </div>
          </div>

          {/* Interactive filter (no-print) */}
          <div className="flex items-center justify-between no-print pt-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium">กรองตามข้อเสนอแนะ:</span>
              <button
                onClick={() => setFilterRecommendation('all')}
                className={`px-3 py-1 rounded-md transition font-medium cursor-pointer ${
                  filterRecommendation === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                ทั้งหมด ({indicators.length})
              </button>
              <button
                onClick={() => setFilterRecommendation('urgent_replace')}
                className={`px-3 py-1 rounded-md transition font-medium cursor-pointer ${
                  filterRecommendation === 'urgent_replace' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                }`}
              >
                ต้องจัดซื้อทดแทน ({urgentList.length})
              </button>
              <button
                onClick={() => setFilterRecommendation('watchlist')}
                className={`px-3 py-1 rounded-md transition font-medium cursor-pointer ${
                  filterRecommendation === 'watchlist' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                }`}
              >
                เฝ้าระวัง ({watchlist.length})
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">ปีงบประมาณ พ.ศ.:</span>
              <select
                value={fiscalYear}
                onChange={(e) => setFiscalYear(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded px-2 py-1 font-semibold"
              >
                <option value="2569">2569</option>
                <option value="2570">2570</option>
                <option value="2571">2571</option>
              </select>
            </div>
          </div>

          {/* Comprehensive Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">รหัส / ครุภัณฑ์</th>
                  <th className="py-2.5 px-3">แผนก</th>
                  <th className="py-2.5 px-3 text-center">อายุ / เกณฑ์ สธ.</th>
                  <th className="py-2.5 px-3 text-center">สถิติซ่อม</th>
                  <th className="py-2.5 px-3 text-right">ค่าซ่อมสะสม</th>
                  <th className="py-2.5 px-3 text-center">% ค่าซ่อม/ราคา</th>
                  <th className="py-2.5 px-3">ข้อเสนอแนะเชิงนโยบาย & เหตุผลประกอบแผน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredIndicators.map((item) => (
                  <tr key={item.assetId} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-3 max-w-xs">
                      <div className="font-mono font-bold text-slate-900">{item.assetCode}</div>
                      <div className="font-medium text-slate-800 line-clamp-1">{item.assetName}</div>
                      <div className="text-[10px] text-slate-400">ราคาเดิม: {item.price.toLocaleString()} ฿</div>
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {item.department.split(' ')[0]}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className={`font-bold font-mono ${item.ageExceeded ? 'text-rose-600' : 'text-slate-800'}`}>
                        {item.ageYears} ปี
                      </div>
                      <div className="text-[10px] text-slate-400">เกณฑ์ {item.expectedLifeYears} ปี</div>
                    </td>
                    <td className="py-3 px-3 text-center font-semibold text-slate-800">
                      {item.repairCount} ครั้ง
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-medium text-slate-800">
                      {item.totalRepairCost.toLocaleString()} ฿
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`font-mono font-bold text-xs ${
                        item.repairCostRatio > 40 ? 'text-rose-600' :
                        item.repairCostRatio > 20 ? 'text-amber-600' : 'text-emerald-700'
                      }`}>
                        {item.repairCostRatio.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 px-3 max-w-sm">
                      <div className="mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          item.recommendation === 'urgent_replace' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                          item.recommendation === 'watchlist' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                          'bg-emerald-100 text-emerald-800'
                        }`}>
                          {item.recommendation === 'urgent_replace' ? '● เสนอปลดระวางจัดซื้อทดแทน' :
                           item.recommendation === 'watchlist' ? '● เฝ้าระวังเตรียมตั้งงบ' : '● พร้อมใช้งาน'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-snug">
                        {item.justificationReason}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Official Endorsement Section (Signatures) */}
          <div className="pt-6 border-t border-slate-300">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 text-center text-xs">
              <div className="flex flex-col items-center">
                <div className="h-12 border-b border-slate-400 w-40 flex items-end justify-center pb-1">
                  <span className="text-[11px] font-serif text-slate-600 italic">นายกิตติศักดิ์ พัฒนไพศาล</span>
                </div>
                <span className="font-semibold text-slate-800 mt-2">(นายกิตติศักดิ์ พัฒนไพศาล)</span>
                <span className="text-[11px] text-slate-500">วิศวกรชีวการแพทย์ชำนาญการ / ผู้จัดทำรายงาน</span>
              </div>

              <div className="flex flex-col items-center">
                <div className="h-12 border-b border-slate-400 w-40 flex items-end justify-center pb-1">
                  <span className="text-[11px] font-serif text-slate-600 italic">นายอนุรักษ์ วงศ์สว่าง</span>
                </div>
                <span className="font-semibold text-slate-800 mt-2">(นายอนุรักษ์ วงศ์สว่าง)</span>
                <span className="text-[11px] text-slate-500">หัวหน้างานซ่อมบำรุงวิศวกรรมการแพทย์</span>
              </div>

              <div className="flex flex-col items-center col-span-2 sm:col-span-1">
                <div className="h-12 border-b border-slate-400 w-44 flex items-end justify-center pb-1">
                  <span className="text-[11px] font-serif text-slate-600 italic">...............................................</span>
                </div>
                <span className="font-semibold text-slate-800 mt-2">(ผู้อำนวยการโรงพยาบาลสังขละบุรี)</span>
                <span className="text-[11px] text-slate-500">ผู้อนุมัติบรรจุในแผนจัดซื้อประจำปี</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
