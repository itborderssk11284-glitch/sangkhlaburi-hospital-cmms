import React, { useState, useRef } from 'react';
import { 
  X, 
  Hammer, 
  Send, 
  Upload, 
  Image as ImageIcon, 
  Trash2, 
  AlertTriangle,
  FileText,
  Building2,
  Clock
} from 'lucide-react';
import { PriorityLevel } from '../../types';
import { useApp } from '../../context/AppContext';
import { HOSPITAL_DEPARTMENTS } from '../../data/mockData';

export const NewOtherRepairModal: React.FC<{
  onClose: () => void;
}> = ({ onClose }) => {
  const { addWorkOrder, currentUser } = useApp();

  const [department, setDepartment] = useState(
    currentUser?.department || 'งานบริหารทั่วไป'
  );
  
  // Custom repair item typed by user (เช่น ซ่อมก๊อกน้ำอ่างล้างมือ, เปลี่ยนบานพับประตู, ซ่อมไฟทางเดิน)
  const [customItemName, setCustomItemName] = useState('');
  const [symptom, setSymptom] = useState('');
  const [locationDetail, setLocationDetail] = useState('');
  
  // Priority strictly 2 levels: 'urgent' (ด่วนมาก) and 'normal' (งานปกติ)
  const [priority, setPriority] = useState<PriorityLevel>('normal');
  const [reporterName, setReporterName] = useState(currentUser?.fullName || '');
  const [reporterPhone, setReporterPhone] = useState(currentUser?.phone || '034-595021');

  // Attached Photos
  const [images, setImages] = useState<string[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (!customItemName.trim() || !symptom.trim() || !reporterName.trim()) {
      alert('กรุณากรอกข้อมูล: รายการที่ต้องการซ่อม, อาการชำรุด และชื่อผู้ส่งซ่อม');
      return;
    }

    addWorkOrder({
      orderType: 'general',
      customItemName: customItemName.trim(),
      assetId: 'general',
      assetCode: '-',
      assetName: customItemName.trim(),
      brand: '-',
      model: '-',
      vendor: '-',
      vendorPhone: '-',
      department,
      priority,
      symptom: symptom.trim(),
      errorDetails: locationDetail.trim() ? `สถานที่/บริเวณ: ${locationDetail.trim()}` : undefined,
      reporterName: reporterName.trim(),
      reporterPhone: reporterPhone.trim() || '034-595021',
      documentNo: 'กจ 003.308.1/',
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
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-600 rounded-xl">
              <Hammer className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base">เปิดใบแจ้งซ่อมอื่นๆ (General & Facility Ticket)</h3>
              <p className="text-xs text-slate-400">
                งานอาคาร สถานที่ ระบบสาธารณูปโภค และงานซ่อมทั่วไป (ไม่ผูกกับทะเบียนครุภัณฑ์)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
          
          {/* Information Notice */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">ฟังก์ชั่นใบแจ้งซ่อมอื่นๆ:</span>
              <p className="text-[11px] text-amber-800 mt-0.5">
                ใช้สำหรับแจ้งซ่อมงานอาคาร สถานที่ ไฟฟ้า ประปา ประตู-หน้าต่าง และงานซ่อมอื่นๆ โดยไม่ต้องระบุรหัสครุภัณฑ์ สามารถพิมพ์รายการที่ต้องการซ่อมได้เองโดยตรง
              </p>
            </div>
          </div>

          {/* Section 1: Department & Item name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                แผนกที่แจ้งซ่อม (Department) *
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                required
              >
                {HOSPITAL_DEPARTMENTS.filter(d => d !== 'ทั้งหมด').map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                รายการที่ซ่อม (พิมพ์ลงไปได้เอง) *
              </label>
              <input
                type="text"
                value={customItemName}
                onChange={(e) => setCustomItemName(e.target.value)}
                placeholder="เช่น ซ่อมก๊อกน้ำอ่างล้างมือ, เปลี่ยนบานพับประตู, ซ่อมไฟทางเดิน"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Section 2: Symptom & Location */}
          <div className="space-y-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                ลักษณะ / อาการชำรุด หรือปัญหาที่ตรวจพบ *
              </label>
              <textarea
                rows={3}
                value={symptom}
                onChange={(e) => setSymptom(e.target.value)}
                placeholder="อธิบายอาการชำรุด สภาพความเสียหาย หรือลักษณะปัญหาที่ต้องการให้ดำเนินการซ่อม..."
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                สถานที่เฉพาะ / บริเวณจุดติดตั้ง
              </label>
              <input
                type="text"
                value={locationDetail}
                onChange={(e) => setLocationDetail(e.target.value)}
                placeholder="เช่น ห้องน้ำหญิง ชั้น 2 อาคารผู้ป่วยนอก, ระเบียงทางเดินทิศใต้"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Section 3: Urgency Level (Strictly: ด่วนมาก vs งานปกติ) */}
          <div>
            <label className="block text-slate-700 font-bold mb-1.5">
              ระดับความเร่งด่วน (Priority) *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label 
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                  priority === 'urgent'
                    ? 'border-rose-500 bg-rose-50/70 text-rose-950 font-bold ring-2 ring-rose-500/30'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
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
                  <div className="flex items-center gap-1.5 text-rose-900 font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse"></span>
                    <span>ด่วนมาก (Urgent)</span>
                  </div>
                  <span className="text-[10px] text-rose-700 block">กระทบต่อบริการผู้ป่วย / ความปลอดภัยทันที</span>
                </div>
              </label>

              <label 
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                  priority === 'normal'
                    ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950 font-bold ring-2 ring-emerald-500/30'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
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
                  <div className="flex items-center gap-1.5 text-emerald-900 font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                    <span>งานปกติ (Normal)</span>
                  </div>
                  <span className="text-[10px] text-emerald-700 block">งานซ่อมบำรุงทั่วไป ดำเนินการตามรอบคิวงาน</span>
                </div>
              </label>
            </div>
          </div>

          {/* Section 4: Photo Attachments */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-slate-700 font-bold flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-slate-500" />
                <span>แนบภาพถ่ายสภาพความชำรุด (ไม่จำกัดจำนวน)</span>
              </label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>+ เลือกรูปภาพ / ถ่ายภาพ</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>

            {images.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                {images.map((img, idx) => (
                  <div key={idx} className="relative group border border-slate-200 rounded-lg overflow-hidden bg-white shadow-2xs">
                    <img
                      src={img}
                      alt={`ภาพที่ ${idx + 1}`}
                      className="w-full h-24 object-cover"
                    />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewImage(img)}
                        className="p-1.5 bg-white/90 text-slate-800 rounded-full hover:bg-white cursor-pointer"
                        title="ดูรูปภาพขนาดใหญ่"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="p-1.5 bg-rose-600 text-white rounded-full hover:bg-rose-700 cursor-pointer"
                        title="ลบภาพ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-xl p-4 text-center cursor-pointer transition bg-slate-50/50 hover:bg-emerald-50/30"
              >
                <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                <p className="text-[11px] text-slate-600 font-medium">คลิกเพื่ออัปโหลดภาพถ่าย หรือถ่ายรูปจากมือถือ</p>
                <p className="text-[10px] text-slate-400 mt-0.5">รองรับไฟล์ PNG, JPG, JPEG (จะนำไปแสดงในแบบฟอร์มขออนุมัติ)</p>
              </div>
            )}
          </div>

          {/* Section 5: Reporter Details */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <span className="font-bold text-slate-800 block text-[11px]">
              ข้อมูลผู้ส่งซ่อม (ขึ้นชื่อตามที่ Login อัตโนมัติ)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 mb-0.5">ชื่อ-นามสกุล ผู้ส่งซ่อม *</label>
                <input
                  type="text"
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-0.5">เบอร์โทรศัพท์ติดต่อ</label>
                <input
                  type="text"
                  value={reporterPhone}
                  onChange={(e) => setReporterPhone(e.target.value)}
                  placeholder="เช่น 081-xxx-xxxx หรือ ต่อ 141"
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl font-medium transition cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl font-bold shadow-md shadow-amber-900/20 transition cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>ส่งใบแจ้งซ่อม (ขออนุมัติ)</span>
            </button>
          </div>
        </form>

      </div>

      {/* Large Image Preview Modal */}
      {previewImage && (
        <div 
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4 cursor-zoom-out"
        >
          <div className="relative max-w-2xl max-h-[90vh]">
            <img src={previewImage} alt="Preview" className="max-w-full max-h-[85vh] rounded-lg shadow-2xl object-contain" />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-black/90"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
