import React, { useState } from 'react';
import { 
  CalendarCheck2, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  FileCheck, 
  Search, 
  Plus, 
  Check, 
  X, 
  Wind, 
  Droplets, 
  Gauge, 
  Zap, 
  Calendar, 
  Building2, 
  ThermometerSnowflake,
  Filter
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PMRecord, PMStatus, Asset } from '../../types';

export const PMCalibrationManagement: React.FC = () => {
  const { pmRecords, completePMRecord, addPMRecord, assets, updateAsset, technicians } = useApp();

  // Tab: 'medical_pm' (PM & Medical Calibration) vs 'ac_maintenance' (AC Cleaning & HVAC)
  const [activeSubTab, setActiveSubTab] = useState<'medical_pm' | 'ac_maintenance'>('medical_pm');

  const [typeFilter, setTypeFilter] = useState<'all' | 'pm' | 'calibration'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'scheduled' | 'passed' | 'overdue'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Medical PM Recording Modal
  const [activeRecordToInspect, setActiveRecordToInspect] = useState<PMRecord | null>(null);
  const [checklistState, setChecklistState] = useState<{ [key: number]: boolean }>({});
  const [overallResult, setOverallResult] = useState<'pass' | 'conditional_pass' | 'fail'>('pass');
  const [deviationInput, setDeviationInput] = useState('');
  const [inspectionNotes, setInspectionNotes] = useState('');

  // New PM Plan modal
  const [isNewPlanOpen, setIsNewPlanOpen] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState(assets[0]?.id || '');
  const [planType, setPlanType] = useState<'pm' | 'calibration' | 'ac_cleaning'>('pm');
  const [scheduledDate, setScheduledDate] = useState(
    new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().slice(0, 10)
  );

  // AC Cleaning Record Modal
  const [activeACToClean, setActiveACToClean] = useState<Asset | null>(null);
  const [acFilterWashed, setAcFilterWashed] = useState(true);
  const [acIndoorCoil, setAcIndoorCoil] = useState(true);
  const [acOutdoorCoil, setAcOutdoorCoil] = useState(true);
  const [acDrainFlushed, setAcDrainFlushed] = useState(true);
  const [acPsi, setAcPsi] = useState<number>(140);
  const [acAmps, setAcAmps] = useState<number>(8.5);
  const [acCleanType, setAcCleanType] = useState<'normal' | 'chemical_overhaul'>('normal');
  const [acCleanTech, setAcCleanTech] = useState('นายอนุรักษ์ วงศ์สว่าง (ช่างอาคาร/เครื่องปรับอากาศ)');
  const [acCleanNotes, setAcCleanNotes] = useState('');

  // Air Conditioner Units
  const acAssets = assets.filter(a => a.category === 'hvac_aircon' || a.btu !== undefined);

  // Calculate AC Alerts
  const today = new Date();
  const acAlerts = acAssets.map(ac => {
    const nextDate = ac.nextCleanDate ? new Date(ac.nextCleanDate) : new Date(Date.now() + 30 * 24 * 3600 * 1000);
    const diffTime = nextDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const isOverdue = diffDays < 0;
    const isDueSoon = diffDays >= 0 && diffDays <= 15;

    return {
      ac,
      diffDays,
      isOverdue,
      isDueSoon,
    };
  }).sort((a, b) => a.diffDays - b.diffDays);

  const overdueACCount = acAlerts.filter(a => a.isOverdue).length;
  const dueSoonACCount = acAlerts.filter(a => a.isDueSoon).length;

  // Filter medical records
  const filteredRecords = pmRecords.filter((rec) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = 
      !q || 
      rec.assetCode.toLowerCase().includes(q) || 
      rec.assetName.toLowerCase().includes(q) ||
      rec.department.toLowerCase().includes(q);

    const matchesType = typeFilter === 'all' || rec.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || rec.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  // Handle submit AC Cleaning
  const handleSubmitACCleaning = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeACToClean) return;

    const todayStr = new Date().toISOString().slice(0, 10);
    const freq = activeACToClean.cleaningFrequencyMonths || 3;
    const nextClean = new Date();
    nextClean.setMonth(nextClean.getMonth() + freq);
    const nextCleanStr = nextClean.toISOString().slice(0, 10);

    // Update asset
    updateAsset(activeACToClean.id, {
      lastCleanedDate: todayStr,
      nextCleanDate: nextCleanStr,
      lastPMDate: todayStr,
      nextPMDate: nextCleanStr,
    });

    // Also record in pmRecords
    addPMRecord({
      assetId: activeACToClean.id,
      assetCode: activeACToClean.code,
      assetName: activeACToClean.name,
      department: activeACToClean.department,
      type: 'ac_cleaning',
      scheduledDate: todayStr,
      completedDate: todayStr,
      technicianName: acCleanTech,
      status: 'passed',
      overallResult: 'pass',
      checklist: [
        { item: 'ถอดล้างแผ่นกรองอากาศ (Air Pre-Filter)', passed: acFilterWashed },
        { item: 'ฉีดล้างแผงคอยล์เย็น (Evaporator Coil)', passed: acIndoorCoil },
        { item: 'ฉีดล้างแผงคอยล์ร้อนระบายความร้อน (Condenser Unit)', passed: acOutdoorCoil },
        { item: 'เป่าล้างท่อน้ำทิ้งป้องกันน้ำล้นหยด (Drain Pipe Flush)', passed: acDrainFlushed },
        { item: `ตรวจวัดแรงดันน้ำยาแอร์ (${acPsi} PSI) และกระแสไฟ (${acAmps} A)`, passed: true },
      ],
      acDetails: {
        btu: activeACToClean.btu,
        filterWashed: acFilterWashed,
        indoorCoilCleaned: acIndoorCoil,
        outdoorCoilCleaned: acOutdoorCoil,
        drainPipeFlushed: acDrainFlushed,
        refrigerantPsi: acPsi,
        currentAmp: acAmps,
        cleanType: acCleanType,
      },
      notes: `${acCleanType === 'chemical_overhaul' ? '[ล้างใหญ่ด้วยน้ำยาเคมี] ' : ''}${acCleanNotes || 'ล้างทำความสะอาดตามรอบปกติ ระบบทำความเย็นสมบูรณ์'}`,
      nextScheduledDate: nextCleanStr,
    });

    setActiveACToClean(null);
  };

  // Open medical inspection modal
  const handleOpenInspection = (record: PMRecord) => {
    setActiveRecordToInspect(record);
    const initialChecks: { [key: number]: boolean } = {};
    record.checklist.forEach((item, index) => {
      initialChecks[index] = item.passed;
    });
    setChecklistState(initialChecks);
    setOverallResult(record.overallResult || 'pass');
    setDeviationInput(record.deviationRate || '');
    setInspectionNotes(record.notes || '');
  };

  const handleSubmitInspection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRecordToInspect) return;

    completePMRecord(
      activeRecordToInspect.id,
      overallResult,
      deviationInput || undefined,
      inspectionNotes || undefined
    );

    setActiveRecordToInspect(null);
  };

  const handleCreateNewPlan = (e: React.FormEvent) => {
    e.preventDefault();
    const targetAsset = assets.find(a => a.id === selectedAssetId);
    if (!targetAsset) return;

    const nextDate = new Date(scheduledDate);
    nextDate.setMonth(nextDate.getMonth() + targetAsset.pmFrequencyMonths);

    addPMRecord({
      assetId: targetAsset.id,
      assetCode: targetAsset.code,
      assetName: targetAsset.name,
      department: targetAsset.department,
      type: planType,
      scheduledDate,
      status: 'scheduled',
      checklist: planType === 'ac_cleaning' ? [
        { item: 'ถอดล้างแผ่นกรองฝุ่นฟิลเตอร์', passed: true },
        { item: 'ฉีดล้างคอยล์เย็นและถาดน้ำทิ้ง', passed: true },
        { item: 'ฉีดล้างคอยล์ร้อนภายนอก', passed: true },
        { item: 'ตรวจวัดน้ำยาและกระแสไฟฟ้า', passed: true },
      ] : [
        { item: 'ตรวจสภาพโครงสร้าง สายไฟ และสายดิน (Electrical Grounding)', passed: true },
        { item: 'ทำความสะอาดแผ่นกรองอากาศและระบบระบายความร้อน Dust Filter', passed: true },
        { item: 'ทดสอบแบตเตอรี่สำรองและระบบจ่ายไฟฉุกเฉิน', passed: true },
        { item: 'ตรวจสอบและสอบเทียบค่าความเที่ยงตรงของตัวตรวจวัด', passed: true },
      ],
      nextScheduledDate: nextDate.toISOString().slice(0, 10),
    });

    setIsNewPlanOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>ระบบบำรุงรักษาเชิงป้องกันและการสอบเทียบ (PM & Calibration)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            วางแผนและแจ้งเตือนบำรุงรักษาเครื่องมือแพทย์ การสอบเทียบเครื่องมือวัด และ<strong>ระบบแจ้งเตือนล้างแอร์ตามระยะเวลา</strong>
          </p>
        </div>

        <button
          onClick={() => setIsNewPlanOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>สร้างแผนงานบำรุงรักษาใหม่</span>
        </button>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveSubTab('medical_pm')}
          className={`flex items-center gap-2 py-2.5 px-4 text-xs font-bold border-b-2 transition cursor-pointer ${
            activeSubTab === 'medical_pm'
              ? 'border-emerald-700 text-emerald-900 bg-white rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>งานบำรุงรักษา PM & สอบเทียบเครื่องมือแพทย์</span>
          <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-mono">
            {pmRecords.filter(r => r.type !== 'ac_cleaning').length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('ac_maintenance')}
          className={`flex items-center gap-2 py-2.5 px-4 text-xs font-bold border-b-2 transition cursor-pointer relative ${
            activeSubTab === 'ac_maintenance'
              ? 'border-teal-700 text-teal-900 bg-white rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ThermometerSnowflake className="w-4 h-4 text-teal-600" />
          <span>ระบบแจ้งเตือนและแผนล้างแอร์ (AC Cleaning Alerts)</span>
          {overdueACCount > 0 ? (
            <span className="text-[10px] bg-rose-600 text-white px-2 py-0.2 rounded-full font-bold animate-pulse">
              เกินกำหนด {overdueACCount}
            </span>
          ) : (
            <span className="text-[10px] bg-teal-100 text-teal-800 px-1.5 py-0.2 rounded font-mono">
              {acAssets.length} เครื่อง
            </span>
          )}
        </button>
      </div>

      {/* VIEW 1: AC MAINTENANCE & ALERTS */}
      {activeSubTab === 'ac_maintenance' && (
        <div className="space-y-5">
          {/* AC Notification Banners */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-rose-50/80 border border-rose-200 p-4 rounded-xl text-xs">
              <div className="flex items-center justify-between font-bold text-rose-900">
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  แอร์เกินกำหนดล้าง (Overdue)
                </span>
                <span className="text-xl font-bold font-mono text-rose-700">{overdueACCount}</span>
              </div>
              <p className="text-[11px] text-slate-600 mt-1.5">
                แอร์ที่เกินรอบกำหนดล้าง ส่งผลให้แอร์กินไฟ เสี่ยงน้ำหยด และสะสมเชื้อราในโรงพยาบาล
              </p>
            </div>

            <div className="bg-amber-50/80 border border-amber-200 p-4 rounded-xl text-xs">
              <div className="flex items-center justify-between font-bold text-amber-900">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-600" />
                  ครบกำหนดล้างใน 15 วัน (Due Soon)
                </span>
                <span className="text-xl font-bold font-mono text-amber-700">{dueSoonACCount}</span>
              </div>
              <p className="text-[11px] text-slate-600 mt-1.5">
                เตรียมจัดตารางช่างเข้าดำเนินการล้างฟิลเตอร์และฉีดล้างคอยล์
              </p>
            </div>

            <div className="bg-emerald-50/80 border border-emerald-200 p-4 rounded-xl text-xs">
              <div className="flex items-center justify-between font-bold text-emerald-900">
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  แอร์ทั้งหมดในระบบโรงพยาบาล
                </span>
                <span className="text-xl font-bold font-mono text-emerald-800">{acAssets.length}</span>
              </div>
              <p className="text-[11px] text-slate-600 mt-1.5">
                ครอบคลุมห้องผ่าตัด OR (Cleanroom), ห้องยา Cold Chain, Server IT, และหอผู้ป่วย
              </p>
            </div>
          </div>

          {/* AC Units List with Schedule & Countdown */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  <Wind className="w-4 h-4 text-teal-600" />
                  ตารางสถานะและแผนการล้างแอร์ตามระยะเวลา (Air Conditioner Units)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  ระบบแจ้งเตือนกำหนดล้างแอร์อัตโนมัติตามมาตรฐานงานวิศวกรรมอาคารและการควบคุมการติดเชื้อ
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400">รอบล้างมาตรฐาน:</span>
                <span className="font-semibold text-slate-700">ห้องผ่าตัด/ยา (3 เดือน) · ทั่วไป (6 เดือน)</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">รหัส / ตำแหน่งติดตั้ง</th>
                    <th className="py-3 px-4">ชื่ออุปกรณ์ / บีทียู (BTU)</th>
                    <th className="py-3 px-4">แผนก</th>
                    <th className="py-3 px-4 text-center">รอบล้าง</th>
                    <th className="py-3 px-4">ล้างล่าสุด</th>
                    <th className="py-3 px-4">กำหนดล้างครั้งถัดไป</th>
                    <th className="py-3 px-4">สถานะแจ้งเตือน</th>
                    <th className="py-3 px-4 text-right">ดำเนินการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {acAlerts.map(({ ac, diffDays, isOverdue, isDueSoon }) => (
                    <tr key={ac.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-slate-900">{ac.code}</div>
                        <div className="text-[11px] text-slate-500">{ac.locationDetail || '-'}</div>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-semibold text-slate-900 truncate" title={ac.name}>{ac.name}</div>
                        <div className="text-[11px] text-teal-800 font-medium flex items-center gap-1.5 mt-0.5">
                          <span>{ac.brand}</span>
                          <span>·</span>
                          <span className="font-mono">{ac.btu ? `${ac.btu.toLocaleString()} BTU` : 'AC'}</span>
                          <span>·</span>
                          <span className="uppercase text-[10px] px-1 bg-slate-100 rounded text-slate-600">{ac.acType || 'Split'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {ac.department}
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-slate-700">
                        ทุก {ac.cleaningFrequencyMonths || 3} เดือน
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 text-[11px]">
                        {ac.lastCleanedDate || ac.lastPMDate || '-'}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 text-[11px]">
                        {ac.nextCleanDate || ac.nextPMDate || '-'}
                      </td>
                      <td className="py-3 px-4">
                        {isOverdue ? (
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-100 text-rose-800 font-bold text-[11px] border border-rose-200">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                            <span>เกินกำหนด {Math.abs(diffDays)} วัน!</span>
                          </div>
                        ) : isDueSoon ? (
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-100 text-amber-900 font-bold text-[11px] border border-amber-200">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>ครบกำหนดในอีก {diffDays} วัน</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] text-emerald-800 font-semibold bg-emerald-50 border border-emerald-200">
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>ปกติ (อีก {diffDays} วัน)</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setActiveACToClean(ac);
                            setAcCleanNotes('');
                          }}
                          className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-semibold text-xs transition cursor-pointer shadow-2xs"
                        >
                          บันทึกการล้างแอร์
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* AC Cleaning History Feed */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
            <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-emerald-600" />
              ประวัติการล้างแอร์ล่าสุดที่บันทึกในระบบ
            </h4>
            <div className="space-y-2">
              {pmRecords.filter(r => r.type === 'ac_cleaning').slice(0, 3).map(rec => (
                <div key={rec.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">{rec.assetCode}</span>
                      <span className="text-slate-400">·</span>
                      <span className="font-medium text-slate-800">{rec.assetName}</span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-500">{rec.department}</span>
                    </div>
                    <p className="text-slate-600 text-[11px] mt-0.5">
                      {rec.notes} {rec.acDetails?.refrigerantPsi ? `(แรงดันน้ำยา: ${rec.acDetails.refrigerantPsi} PSI, กระแส: ${rec.acDetails.currentAmp} A)` : ''}
                    </p>
                  </div>
                  <div className="text-right text-[11px] text-slate-500 shrink-0">
                    <div>วันที่ล้าง: <strong>{rec.completedDate || rec.scheduledDate}</strong></div>
                    <div className="text-emerald-700 font-semibold">รอบถัดไป: {rec.nextScheduledDate}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: STANDARD MEDICAL PM & CALIBRATION */}
      {activeSubTab === 'medical_pm' && (
        <div className="space-y-5">
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/20 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-semibold text-rose-800">
                <span>เกินกำหนดต้องดำเนินการ (Overdue)</span>
                <AlertTriangle className="w-4 h-4 text-rose-600" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-rose-700">
                  {pmRecords.filter(r => r.status === 'overdue' && r.type !== 'ac_cleaning').length}
                </span>
                <span className="text-xs text-rose-600">รายการ</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">เครื่องมือที่พ้นรอบกำหนดตรวจเช็ค ต้องเข้าดำเนินการทันที</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/20 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-semibold text-amber-800">
                <span>รอตรวจตามแผนงาน (Upcoming)</span>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-amber-700">
                  {pmRecords.filter(r => r.status === 'scheduled' && r.type !== 'ac_cleaning').length}
                </span>
                <span className="text-xs text-amber-600">รายการ</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">กำหนดการในรอบ 30 วันข้างหน้า</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-semibold text-emerald-800">
                <span>ตรวจผ่านเกณฑ์เรียบร้อย (Passed)</span>
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-emerald-800">
                  {pmRecords.filter(r => r.status === 'passed' && r.type !== 'ac_cleaning').length}
                </span>
                <span className="text-xs text-emerald-700">รายการ</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">มีผลสอบเทียบและใบรับรองความปลอดภัยครบถ้วน</p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="ค้นหารหัส, ชื่อครุภัณฑ์, แผนก..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as any)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                >
                  <option value="all">ประเภททั้งหมด (PM & Calibration)</option>
                  <option value="pm">เฉพาะบำรุงรักษาเชิงป้องกัน (PM)</option>
                  <option value="calibration">เฉพาะการสอบเทียบเครื่องมือวัด (Calibration)</option>
                </select>
              </div>

              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                >
                  <option value="all">สถานะทั้งหมด</option>
                  <option value="overdue">เกินกำหนด (Overdue)</option>
                  <option value="scheduled">ตามกำหนดการ (Scheduled)</option>
                  <option value="passed">ผ่านการตรวจสอบ (Passed)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Records Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">ประเภทงาน</th>
                    <th className="py-3 px-4">รหัส / ชื่อครุภัณฑ์</th>
                    <th className="py-3 px-4">แผนก</th>
                    <th className="py-3 px-4">กำหนดการตรวจ</th>
                    <th className="py-3 px-4">สถานะ / ผลการสอบเทียบ</th>
                    <th className="py-3 px-4">รอบตรวจถัดไป</th>
                    <th className="py-3 px-4 text-right">ดำเนินการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRecords.filter(r => r.type !== 'ac_cleaning').map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          record.type === 'calibration'
                            ? 'bg-purple-50 text-purple-800 border border-purple-200'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}>
                          {record.type === 'calibration' ? 'สอบเทียบ (Calibration)' : 'บำรุงรักษา (PM)'}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-semibold text-slate-900 truncate">{record.assetName}</div>
                        <div className="text-[11px] font-mono text-emerald-800">{record.assetCode}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {record.department.split(' ')[0]}
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-800">
                        {record.scheduledDate}
                      </td>
                      <td className="py-3 px-4">
                        {record.status === 'overdue' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-1 w-fit">
                            <AlertTriangle className="w-3 h-3 text-rose-600" /> เกินกำหนด
                          </span>
                        ) : record.status === 'passed' ? (
                          <div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1 w-fit">
                              <Check className="w-3 h-3 text-emerald-600" /> ผ่านเกณฑ์มาตรฐาน
                            </span>
                            {record.certificateNumber && (
                              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                Cert: {record.certificateNumber}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1 w-fit">
                            <Clock className="w-3 h-3 text-amber-600" /> รอตรวจตามรอบ
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                        {record.nextScheduledDate}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleOpenInspection(record)}
                          className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded font-semibold text-xs border border-emerald-200 transition cursor-pointer"
                        >
                          {record.status === 'passed' ? 'ดูผลการตรวจ' : 'บันทึกผลตรวจ (Check)'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Record AC Cleaning */}
      {activeACToClean && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full my-auto overflow-hidden border border-slate-200">
            <div className="bg-teal-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Wind className="w-5 h-5 text-teal-300" />
                <div>
                  <h3 className="font-bold text-base">บันทึกผลการล้างเครื่องปรับอากาศ</h3>
                  <p className="text-xs text-teal-200/80">
                    {activeACToClean.code} · {activeACToClean.name} ({activeACToClean.department})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveACToClean(null)}
                className="p-1 text-teal-300 hover:text-white rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitACCleaning} className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
              <div className="bg-teal-50/50 p-3 rounded-xl border border-teal-200 text-slate-700 grid grid-cols-2 gap-2">
                <div>ขนาด: <strong>{activeACToClean.btu?.toLocaleString() || '-'} BTU</strong></div>
                <div>ประเภท: <strong>{activeACToClean.acType || 'Split'}</strong></div>
                <div>ตำแหน่ง: <strong>{activeACToClean.locationDetail}</strong></div>
                <div>รอบความถี่: <strong>ทุก {activeACToClean.cleaningFrequencyMonths || 3} เดือน</strong></div>
              </div>

              {/* Cleaning Checklist */}
              <div>
                <label className="block text-slate-800 font-bold mb-2">
                  รายการปฏิบัติงานล้างและตรวจสอบ (Checklist)
                </label>
                <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acFilterWashed}
                      onChange={(e) => setAcFilterWashed(e.target.checked)}
                      className="rounded accent-teal-700 w-4 h-4"
                    />
                    <span className="font-medium text-slate-800">1. ถอดล้างแผ่นกรองอากาศ Pre-filter และเช็ดทำความสะอาดหน้ากาก</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acIndoorCoil}
                      onChange={(e) => setAcIndoorCoil(e.target.checked)}
                      className="rounded accent-teal-700 w-4 h-4"
                    />
                    <span className="font-medium text-slate-800">2. ฉีดล้างแผงคอยล์เย็น (Evaporator Coil) และถาดรองน้ำทิ้ง</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acOutdoorCoil}
                      onChange={(e) => setAcOutdoorCoil(e.target.checked)}
                      className="rounded accent-teal-700 w-4 h-4"
                    />
                    <span className="font-medium text-slate-800">3. ฉีดล้างแผงระบายความร้อนคอยล์ร้อนภายนอก (Condenser Unit)</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acDrainFlushed}
                      onChange={(e) => setAcDrainFlushed(e.target.checked)}
                      className="rounded accent-teal-700 w-4 h-4"
                    />
                    <span className="font-medium text-slate-800">4. เป่าล้างท่อน้ำทิ้งและทดสอบการระบายน้ำ (Drain Pipe Flush)</span>
                  </label>
                </div>
              </div>

              {/* Technical Measurements */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    แรงดันน้ำยาแอร์ (Refrigerant PSI)
                  </label>
                  <input
                    type="number"
                    value={acPsi}
                    onChange={(e) => setAcPsi(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">เกณฑ์ R32/R410A: 130 - 150 PSI</span>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    กระแสไฟฟ้าคอมเพรสเซอร์ (Amps)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={acAmps}
                    onChange={(e) => setAcAmps(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">วัดขณะคอมเพรสเซอร์ทำงานเต็มที่</span>
                </div>
              </div>

              {/* Type of cleaning */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">ประเภทการล้าง</label>
                <div className="grid grid-cols-2 gap-2">
                  <label className={`p-2 rounded-lg border text-center cursor-pointer ${acCleanType === 'normal' ? 'border-teal-700 bg-teal-50 font-bold text-teal-900' : 'border-slate-200'}`}>
                    <input
                      type="radio"
                      name="cleanType"
                      checked={acCleanType === 'normal'}
                      onChange={() => setAcCleanType('normal')}
                      className="hidden"
                    />
                    ล้างน้ำแรงดันสูงปกติ
                  </label>
                  <label className={`p-2 rounded-lg border text-center cursor-pointer ${acCleanType === 'chemical_overhaul' ? 'border-teal-700 bg-teal-50 font-bold text-teal-900' : 'border-slate-200'}`}>
                    <input
                      type="radio"
                      name="cleanType"
                      checked={acCleanType === 'chemical_overhaul'}
                      onChange={() => setAcCleanType('chemical_overhaul')}
                      className="hidden"
                    />
                    ล้างใหญ่ด้วยน้ำยาเคมี (Overhaul)
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">ผู้ดำเนินการล้าง</label>
                <input
                  type="text"
                  value={acCleanTech}
                  onChange={(e) => setAcCleanTech(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">หมายเหตุ / สภาพหลังล้าง</label>
                <textarea
                  rows={2}
                  value={acCleanNotes}
                  onChange={(e) => setAcCleanNotes(e.target.value)}
                  placeholder="เช่น ทำความสะอาดเรียบร้อย ลมแรงขึ้น อุณหภูมิลดลงปกติ ไม่มีน้ำหยด..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveACToClean(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-semibold shadow-xs cursor-pointer"
                >
                  บันทึกการล้างและคำนวณรอบถัดไป
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Medical Inspection Modal */}
      {activeRecordToInspect && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-auto overflow-hidden border border-slate-200">
            <div className="bg-emerald-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">
                  บันทึกผลการตรวจสอบ {activeRecordToInspect.type === 'pm' ? 'PM' : 'สอบเทียบ (Calibration)'}
                </h3>
                <p className="text-xs text-emerald-200/80">
                  {activeRecordToInspect.assetName} ({activeRecordToInspect.assetCode})
                </p>
              </div>
              <button
                onClick={() => setActiveRecordToInspect(null)}
                className="p-1 text-emerald-300 hover:text-white rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitInspection} className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-slate-700 font-bold mb-2">
                  รายการตรวจสอบตามมาตรฐาน (Checklist)
                </label>
                <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {activeRecordToInspect.checklist.map((item, idx) => (
                    <label key={idx} className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checklistState[idx] ?? true}
                        onChange={(e) => setChecklistState(prev => ({ ...prev, [idx]: e.target.checked }))}
                        className="rounded accent-emerald-600 w-4 h-4"
                      />
                      <span className="text-slate-800 font-medium">{item.item}</span>
                    </label>
                  ))}
                </div>
              </div>

              {activeRecordToInspect.type === 'calibration' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      ค่าความคลาดเคลื่อนที่วัดได้ (Deviation Rate %)
                    </label>
                    <input
                      type="text"
                      placeholder="เช่น +0.8% (เกณฑ์ < 5%)"
                      value={deviationInput}
                      onChange={(e) => setDeviationInput(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      หน่วยงานผู้สอบเทียบ / ออกใบรับรอง
                    </label>
                    <input
                      type="text"
                      defaultValue={activeRecordToInspect.calibratedBy || 'ศูนย์สนับสนุนบริการสุขภาพที่ 5'}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  ผลการประเมินสรุป (Overall Assessment)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <label
                    className={`p-2.5 rounded-lg border text-center cursor-pointer transition ${
                      overallResult === 'pass'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold'
                        : 'border-slate-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="overall"
                      checked={overallResult === 'pass'}
                      onChange={() => setOverallResult('pass')}
                      className="hidden"
                    />
                    ผ่านเกณฑ์มาตรฐาน (Pass)
                  </label>

                  <label
                    className={`p-2.5 rounded-lg border text-center cursor-pointer transition ${
                      overallResult === 'conditional_pass'
                        ? 'border-amber-600 bg-amber-50 text-amber-900 font-bold'
                        : 'border-slate-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="overall"
                      checked={overallResult === 'conditional_pass'}
                      onChange={() => setOverallResult('conditional_pass')}
                      className="hidden"
                    />
                    ผ่านแบบมีเงื่อนไข
                  </label>

                  <label
                    className={`p-2.5 rounded-lg border text-center cursor-pointer transition ${
                      overallResult === 'fail'
                        ? 'border-rose-600 bg-rose-50 text-rose-900 font-bold'
                        : 'border-slate-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="overall"
                      checked={overallResult === 'fail'}
                      onChange={() => setOverallResult('fail')}
                      className="hidden"
                    />
                    ไม่ผ่านเกณฑ์ (Fail)
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  หมายเหตุ / ข้อสังเกตเพิ่มเติม
                </label>
                <textarea
                  rows={2}
                  value={inspectionNotes}
                  onChange={(e) => setInspectionNotes(e.target.value)}
                  placeholder="เช่น ทำความสะอาดระบบเป่าฝุ่นและต่อสายวัดใหม่ อุปกรณ์พร้อมใช้งานเต็มรูปแบบ..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveRecordToInspect(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  ปิด
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold shadow-xs cursor-pointer"
                >
                  บันทึกผลการตรวจสอบ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New PM Plan Modal */}
      {isNewPlanOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full my-auto overflow-hidden border border-slate-200">
            <div className="bg-emerald-900 text-white p-5 flex items-center justify-between">
              <h3 className="font-bold text-base">เพิ่มแผนงานบำรุงรักษาใหม่</h3>
              <button
                onClick={() => setIsNewPlanOpen(false)}
                className="p-1 text-emerald-300 hover:text-white rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewPlan} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">เลือกครุภัณฑ์ *</label>
                <select
                  value={selectedAssetId}
                  onChange={(e) => setSelectedAssetId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                >
                  {assets.map(a => (
                    <option key={a.id} value={a.id}>
                      [{a.code}] {a.name} ({a.department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">ประเภทการตรวจ *</label>
                <div className="grid grid-cols-3 gap-2">
                  <label className={`p-2 rounded-lg border text-center cursor-pointer ${planType === 'pm' ? 'bg-emerald-50 border-emerald-600 font-bold text-emerald-900' : 'border-slate-200'}`}>
                    <input
                      type="radio"
                      name="planType"
                      checked={planType === 'pm'}
                      onChange={() => setPlanType('pm')}
                      className="hidden"
                    />
                    บำรุงรักษา PM
                  </label>
                  <label className={`p-2 rounded-lg border text-center cursor-pointer ${planType === 'calibration' ? 'bg-purple-50 border-purple-600 font-bold text-purple-900' : 'border-slate-200'}`}>
                    <input
                      type="radio"
                      name="planType"
                      checked={planType === 'calibration'}
                      onChange={() => setPlanType('calibration')}
                      className="hidden"
                    />
                    สอบเทียบ
                  </label>
                  <label className={`p-2 rounded-lg border text-center cursor-pointer ${planType === 'ac_cleaning' ? 'bg-teal-50 border-teal-600 font-bold text-teal-900' : 'border-slate-200'}`}>
                    <input
                      type="radio"
                      name="planType"
                      checked={planType === 'ac_cleaning'}
                      onChange={() => setPlanType('ac_cleaning')}
                      className="hidden"
                    />
                    ล้างแอร์ (AC)
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">วันที่กำหนดตรวจ *</label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewPlanOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold shadow-xs cursor-pointer"
                >
                  บันทึกแผนงาน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
