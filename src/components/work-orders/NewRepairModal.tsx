import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Wrench, 
  AlertTriangle, 
  Send, 
  Database, 
  Upload, 
  Image as ImageIcon, 
  Trash2, 
  Eye, 
  CheckCircle2, 
  FileText,
  ShieldCheck
} from 'lucide-react';
import { Asset, PriorityLevel } from '../../types';
import { useApp } from '../../context/AppContext';
import { HOSPITAL_DEPARTMENTS } from '../../data/mockData';

export const NewRepairModal: React.FC<{
  initialAsset?: Asset | null;
  onClose: () => void;
}> = ({ initialAsset, onClose }) => {
  const { assets, addWorkOrder, currentUser } = useApp();

  const [selectedAssetId, setSelectedAssetId] = useState(initialAsset?.id || '');
  const [assetCode, setAssetCode] = useState(initialAsset?.code || '');
  const [assetName, setAssetName] = useState(initialAsset?.name || '');
  const [brand, setBrand] = useState(initialAsset?.brand || '');
  const [model, setModel] = useState(initialAsset?.model || '');
  const [vendor, setVendor] = useState(initialAsset?.vendor || '');
  const [vendorPhone, setVendorPhone] = useState(initialAsset?.vendorPhone || '');
  const [department, setDepartment] = useState(
    initialAsset?.department || currentUser?.department || '5. อุบัติเหตุฉุกเฉิน'
  );
  
  // Priority strictly 2 levels: 'urgent' (ด่วนมาก) and 'normal' (งานปกติ)
  const [priority, setPriority] = useState<PriorityLevel>('urgent');
  const [symptom, setSymptom] = useState('');
  const [errorDetails, setErrorDetails] = useState('');
  const [reporterName, setReporterName] = useState(currentUser?.fullName || '');
  const [reporterPhone, setReporterPhone] = useState(currentUser?.phone || '034-595021');

  // Attached Photos
  const [images, setImages] = useState<string[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // When selectedAssetId changes, auto-fill
  useEffect(() => {
    if (selectedAssetId) {
      const target = assets.find(a => a.id === selectedAssetId);
      if (target) {
        setAssetCode(target.code);
        setAssetName(target.name);
        setDepartment(target.department);
        setBrand(target.brand || '');
        setModel(target.model || '');
        setVendor(target.vendor || '');
        setVendorPhone(target.vendorPhone || '');
        if (target.criticality === 'life_support') {
          setPriority('urgent');
        }
      }
    }
  }, [selectedAssetId, assets]);

  // Image Upload handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        if (base64) {
          setImages(prev => [...prev, base64]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetName.trim() || !symptom.trim() || !reporterName.trim()) {
      alert('กรุณากรอกข้อมูล: ครุภัณฑ์, อาการเสีย และชื่อผู้ส่งซ่อม');
      return;
    }

    addWorkOrder({
      assetId: selectedAssetId || (assets[0]?.id ?? 'ast-001'),
      assetCode: assetCode || 'SK-MD-CUSTOM',
      assetName: assetName.trim(),
      brand: brand.trim(),
      model: model.trim(),
      vendor: vendor.trim(),
      vendorPhone: vendorPhone.trim(),
      department,
      priority,
      symptom: symptom.trim(),
      errorDetails: errorDetails.trim() || undefined,
      reporterName: reporterName.trim(),
      reporterPhone: reporterPhone.trim() || '034-595021',
      documentNo: 'กจ ๐๐๓.๓๐๘.๑/',
      images,
      photoUrl: images.length > 0 ? images[0] : undefined,
      approvalStatus: 'pending_approval',
      repairTypeAssessment: 'internal_free',
      headOfficerName: 'นางสาวชุติญา จรัสกุลธาดา',
      headOfficerTitle: 'หัวหน้าเจ้าหน้าที่',
      headOfficerOpinion: 'เรียน ผู้อำนวยการโรงพยาบาลสังขละบุรี เพื่อโปรดพิจารณาอนุมัติให้ดำเนินการซ่อมบำรุงตามเสนอ',
      approverName: 'นายแพทย์จิรวัฒน์ วงษ์สวัสดิ์',
      approverTitle: 'นายแพทย์ชำนาญการ (ด้านเวชกรรม) รักษาการในตำแหน่งผู้อำนวยการโรงพยาบาลสังขละบุรี',
      approvalComments: ''
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full my-auto overflow-hidden border border-slate-200">
        
        {/* Modal Header */}
        <div className="bg-emerald-950 text-white p-5 flex items-center justify-between border-b border-emerald-900">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-800/80 rounded-xl">
              <Wrench className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-bold text-base">เปิดใบแจ้งซ่อมครุภัณฑ์ออนไลน์ (Work Order Request)</h3>
              <p className="text-xs text-emerald-200/80">
                แบบฟอร์มขออนุมัติซ่อมบำรุงพัสดุ-ครุภัณฑ์ โรงพยาบาลสังขละบุรี
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-emerald-300 hover:text-white rounded transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto text-xs">
          
          {/* Approval Pre-Notice */}
          <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-amber-900">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong>ข้อกำหนดระเบียบราชการ:</strong> ใบแจ้งซ่อมนี้จะถูกส่งเข้าสู่กระบวนการ{' '}
              <strong>"รออนุมัติก่อนซ่อม (Pending Approval)"</strong> โดยอัตโนมัติ เพื่อให้หัวหน้าเจ้าหน้าที่ (นางสาวชุติญา จรัสกุลธาดา) และผู้อำนวยการโรงพยาบาลสังขละบุรี (นายแพทย์จิรวัฒน์ วงษ์สวัสดิ์) ตรวจสอบและลงนามอนุมัติก่อนเริ่มการซ่อมบำรุง
            </div>
          </div>

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
                รหัสครุภัณฑ์ (Asset Code) *
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
                แผนกผู้ส่งซ่อม *
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-semibold mb-1">
                ชื่อเครื่อง / รายการครุภัณฑ์ *
              </label>
              <input
                type="text"
                value={assetName}
                onChange={(e) => setAssetName(e.target.value)}
                placeholder="เช่น เครื่องกระตุกหัวใจ Biphasic Defibrillator"
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none font-semibold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                ยี่ห้อ / รุ่น (Brand / Model)
              </label>
              <input
                type="text"
                value={model ? `${brand} ${model}`.trim() : brand}
                onChange={(e) => {
                  setModel(e.target.value);
                }}
                placeholder="เช่น Philips TC30"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Priority Selection: STRICTLY 2 LEVELS: ด่วนมาก vs งานปกติ */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <label className="block text-slate-800 font-bold mb-1.5 flex items-center justify-between">
              <span>ระดับความเร่งด่วนของงานซ่อม (Priority) *</span>
              <span className="text-[11px] font-normal text-emerald-800">
                (กำหนดเฉพาะ: ด่วนมาก และ งานปกติ)
              </span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: ด่วนมาก */}
              <label
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                  priority === 'urgent'
                    ? 'border-rose-500 bg-rose-50 text-rose-950 font-bold ring-1 ring-rose-500 shadow-xs'
                    : 'border-slate-200 hover:bg-white text-slate-700 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="priority"
                  value="urgent"
                  checked={priority === 'urgent'}
                  onChange={() => setPriority('urgent')}
                  className="accent-rose-600 w-4 h-4"
                />
                <div>
                  <div className="font-bold text-rose-700 text-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                    <span>ด่วนมาก (High Priority)</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    เครื่องมือสำคัญ ส่งผลกระทบต่อการตรวจรักษาผู้ป่วย
                  </div>
                </div>
              </label>

              {/* Option 2: งานปกติ */}
              <label
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                  priority === 'normal'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold ring-1 ring-emerald-500 shadow-xs'
                    : 'border-slate-200 hover:bg-white text-slate-700 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="priority"
                  value="normal"
                  checked={priority === 'normal'}
                  onChange={() => setPriority('normal')}
                  className="accent-emerald-600 w-4 h-4"
                />
                <div>
                  <div className="font-bold text-emerald-700 text-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    <span>งานปกติ (Routine Priority)</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    งานซ่อมบำรุงทั่วไป มีเครื่องทดแทนพร้อมใช้งาน
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Symptom */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              ลักษณะ / อาการชำรุด หรือรหัสข้อผิดพลาดที่พบ *
            </label>
            <textarea
              rows={2}
              value={symptom}
              onChange={(e) => setSymptom(e.target.value)}
              placeholder="อธิบายอาการที่เกิดขึ้น เช่น จอภาพกระพริบ, ไม่จ่ายแรงดัน, มีกลิ่นไหม้, รหัสข้อผิดพลาด Error Code..."
              required
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              รายละเอียดเพิ่มเติม / สภาพแวดล้อมขณะเกิดเหตุ
            </label>
            <input
              type="text"
              value={errorDetails}
              onChange={(e) => setErrorDetails(e.target.value)}
              placeholder="เช่น เกิดขึ้นหลังไฟตก, ได้ยินเสียงสั่นเตือน, มีสายหัก..."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          {/* Photo Attachments */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-800 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-emerald-700" />
                <span>แนบไฟล์ภาพถ่ายสภาพครุภัณฑ์และอาการชำรุด ({images.length} ภาพ)</span>
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageUpload}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg font-semibold text-slate-700 transition cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-slate-600" />
                <span>เพิ่มภาพถ่าย</span>
              </button>
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
                {images.map((img, idx) => (
                  <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-200 bg-white aspect-video shadow-2xs">
                    <img src={img} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewImage(img)}
                        className="p-1 bg-white/90 hover:bg-white text-slate-900 rounded"
                        title="ดูภาพขยาย"
                      >
                        <Eye className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="p-1 bg-rose-600 hover:bg-rose-700 text-white rounded"
                        title="ลบภาพนี้"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <span className="text-[10px] text-slate-400 block">
              รองรับไฟล์ JPG, PNG (ภาพจะถูกบันทึกและแสดงในแบบฟอร์มบันทึกข้อความราชการเพื่อขออนุมัติ)
            </span>
          </div>

          {/* Reporter details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                ชื่อ-นามสกุล ผู้ส่งซ่อม (ผู้รายงาน) *
              </label>
              <input
                type="text"
                placeholder="เช่น พว.สมหญิง วงศ์ใจ (พยาบาลวิชาชีพ)"
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none font-medium"
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
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Firebase Auto-Sync Notice */}
          <div className="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-200/80 rounded-xl text-emerald-800 text-xs">
            <Database className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="leading-snug">
              บันทึกข้อมูลแบบ <strong>Real-time</strong> สู่ฐานข้อมูล <strong>Google Firebase Firestore Cloud</strong> อัตโนมัติทันที
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
              className="flex items-center gap-1.5 px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold transition shadow-xs cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>ส่งใบแจ้งซ่อม (ขออนุมัติซ่อมบำรุง)</span>
            </button>
          </div>
        </form>

        {/* Enlarged Image Preview */}
        {previewImage && (
          <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
            <div className="relative max-w-2xl max-h-[85vh] bg-white rounded-2xl overflow-hidden shadow-2xl p-2">
              <button
                onClick={() => setPreviewImage(null)}
                className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black text-white rounded-full transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <img src={previewImage} alt="Enlarged photo" className="max-w-full max-h-[80vh] object-contain rounded-xl" />
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
