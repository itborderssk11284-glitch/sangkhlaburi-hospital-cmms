import React, { useState, useEffect } from 'react';
import { X, Wrench, AlertTriangle, Send, Database } from 'lucide-react';
import { Asset, PriorityLevel } from '../../types';
import { useApp } from '../../context/AppContext';
import { HOSPITAL_DEPARTMENTS } from '../../data/mockData';

export const NewRepairModal: React.FC<{
  initialAsset?: Asset | null;
  onClose: () => void;
}> = ({ initialAsset, onClose }) => {
  const { assets, addWorkOrder } = useApp();

  const [selectedAssetId, setSelectedAssetId] = useState(initialAsset?.id || '');
  const [assetCode, setAssetCode] = useState(initialAsset?.code || '');
  const [assetName, setAssetName] = useState(initialAsset?.name || '');
  const [department, setDepartment] = useState(initialAsset?.department || '5. อุบัติเหตุฉุกเฉิน');
  
  const [priority, setPriority] = useState<PriorityLevel>(
    initialAsset?.criticality === 'life_support' ? 'emergency' : 'urgent'
  );
  const [symptom, setSymptom] = useState('');
  const [errorDetails, setErrorDetails] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [reporterPhone, setReporterPhone] = useState('');

  // When selectedAssetId changes, auto-fill
  useEffect(() => {
    if (selectedAssetId) {
      const target = assets.find(a => a.id === selectedAssetId);
      if (target) {
        setAssetCode(target.code);
        setAssetName(target.name);
        setDepartment(target.department);
        if (target.criticality === 'life_support') {
          setPriority('emergency');
        }
      }
    }
  }, [selectedAssetId, assets]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetName || !symptom || !reporterName) {
      alert('กรุณากรอกข้อมูล: ครุภัณฑ์, อาการเสีย และชื่อผู้แจ้งซ่อม');
      return;
    }

    addWorkOrder({
      assetId: selectedAssetId || (assets[0]?.id ?? 'ast-001'),
      assetCode: assetCode || 'SK-MD-CUSTOM',
      assetName,
      department,
      priority,
      symptom,
      errorDetails: errorDetails || undefined,
      reporterName,
      reporterPhone: reporterPhone || '034-595021',
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-auto overflow-hidden border border-slate-200">
        <div className="bg-emerald-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Wrench className="w-5 h-5 text-emerald-300" />
            <div>
              <h3 className="font-bold text-base">เปิดใบแจ้งซ่อมครุภัณฑ์ออนไลน์ (Work Order Request)</h3>
              <p className="text-xs text-emerald-200/80">ระบบรับแจ้งงานซ่อมบำรุง โรงพยาบาลสังขละบุรี</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-emerald-300 hover:text-white rounded transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
          {/* Asset Selection */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              เลือกครุภัณฑ์ที่พบปัญหา *
            </label>
            <select
              value={selectedAssetId}
              onChange={(e) => setSelectedAssetId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none"
            >
              <option value="">-- เลือกจากทะเบียนครุภัณฑ์ในระบบ --</option>
              {assets.map((ast) => (
                <option key={ast.id} value={ast.id}>
                  [{ast.code}] {ast.name} ({ast.department})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                รหัสครุภัณฑ์ (Asset Code)
              </label>
              <input
                type="text"
                value={assetCode}
                onChange={(e) => setAssetCode(e.target.value)}
                placeholder="เช่น SK-MD-66-0045"
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono font-bold text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                แผนกที่ตั้งเครื่อง
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              >
                {HOSPITAL_DEPARTMENTS.filter(d => d !== 'ทั้งหมด').map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              ชื่ออุปกรณ์ / ครุภัณฑ์ *
            </label>
            <input
              type="text"
              value={assetName}
              onChange={(e) => setAssetName(e.target.value)}
              placeholder="เช่น เครื่องกระตุกหัวใจ Biphasic Defibrillator"
              required
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none font-medium"
            />
          </div>

          {/* Priority Selection */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              ระดับความเร่งด่วนของงานซ่อม (Priority) *
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              <label
                className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition ${
                  priority === 'emergency' 
                    ? 'border-rose-500 bg-rose-50 text-rose-900 font-bold' 
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="priority"
                  value="emergency"
                  checked={priority === 'emergency'}
                  onChange={() => setPriority('emergency')}
                  className="accent-rose-600"
                />
                <div>
                  <div className="font-semibold text-rose-700">ฉุกเฉินวิกฤต</div>
                  <div className="text-[10px] text-slate-500">เครื่องช่วยชีวิต/ส่งผลคนไข้</div>
                </div>
              </label>

              <label
                className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition ${
                  priority === 'urgent' 
                    ? 'border-amber-500 bg-amber-50 text-amber-900 font-bold' 
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="priority"
                  value="urgent"
                  checked={priority === 'urgent'}
                  onChange={() => setPriority('urgent')}
                  className="accent-amber-600"
                />
                <div>
                  <div className="font-semibold text-amber-700">ด่วนมาก</div>
                  <div className="text-[10px] text-slate-500">กระทบขั้นตอนตรวจรักษา</div>
                </div>
              </label>

              <label
                className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition ${
                  priority === 'normal' 
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold' 
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="priority"
                  value="normal"
                  checked={priority === 'normal'}
                  onChange={() => setPriority('normal')}
                  className="accent-emerald-600"
                />
                <div>
                  <div className="font-semibold text-emerald-800">งานปกติ</div>
                  <div className="text-[10px] text-slate-500">บำรุงรักษาทั่วไป</div>
                </div>
              </label>
            </div>
          </div>

          {/* Symptom */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              อาการเสีย / ปัญหาหรือรหัสข้อผิดพลาดที่พบ *
            </label>
            <textarea
              rows={3}
              value={symptom}
              onChange={(e) => setSymptom(e.target.value)}
              placeholder="อธิบายอาการที่เกิดขึ้น เช่น จอภาพกระพริบ, มีกลิ่นไหม้, แรงดันก๊าซไม่ขึ้น, หน้าจอเตือน Code Error..."
              required
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              รายละเอียดเพิ่มเติม / ข้อสังเกตสภาพแวดล้อม
            </label>
            <input
              type="text"
              value={errorDetails}
              onChange={(e) => setErrorDetails(e.target.value)}
              placeholder="เช่น เกิดขึ้นหลังไฟตก, ได้ยินเสียงสั่นเตือน, มีสายหัก..."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          {/* Reporter details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                ชื่อ-นามสกุล ผู้แจ้งซ่อม *
              </label>
              <input
                type="text"
                placeholder="เช่น พว.สมหญิง วงศ์ใจ (พยาบาลวิชาชีพ)"
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                เบอร์โทรศัพท์มือถือ / ต่อสายภายใน
              </label>
              <input
                type="text"
                placeholder="เช่น 081-xxx-xxxx หรือ ต่อ 112"
                value={reporterPhone}
                onChange={(e) => setReporterPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Firebase Auto-Sync Notice */}
          <div className="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-200/80 rounded-xl text-emerald-800 text-xs">
            <Database className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="leading-snug">
              บันทึกข้อมูลแบบ <strong>Real-time</strong> เข้าสู่ฐานข้อมูล <strong>Google Firebase Firestore Cloud</strong> อัตโนมัติทันที
            </span>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg font-medium transition cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-medium transition shadow-xs cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>ส่งข้อมูลแจ้งซ่อมทันที</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
