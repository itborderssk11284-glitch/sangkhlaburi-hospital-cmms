import React, { useState, useRef } from 'react';
import { 
  X, 
  Save, 
  Edit3, 
  Upload, 
  Image as ImageIcon, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Building2, 
  User, 
  Wrench, 
  Phone, 
  FileText, 
  CheckSquare, 
  Eye,
  Loader2
} from 'lucide-react';
import { WorkOrder, PriorityLevel, WorkOrderStatus, ApprovalStatus, RepairTypeAssessment } from '../../types';
import { useApp } from '../../context/AppContext';
import { HOSPITAL_DEPARTMENTS } from '../../data/mockData';

export const EditWorkOrderModal: React.FC<{
  order: WorkOrder;
  onClose: () => void;
}> = ({ order, onClose }) => {
  const { updateWorkOrder, technicians } = useApp();

  // Basic Information
  const [orderNumber] = useState(order.orderNumber);
  const [documentNo, setDocumentNo] = useState(order.documentNo || 'กจ ๐๐๓.๓๐๘.๑/');
  const [assetCode, setAssetCode] = useState(order.assetCode);
  const [assetName, setAssetName] = useState(order.assetName);
  const [model, setModel] = useState(order.model || '');
  const [brand, setBrand] = useState(order.brand || '');
  const [department, setDepartment] = useState(order.department);
  const [vendor, setVendor] = useState(order.vendor || '');
  const [vendorPhone, setVendorPhone] = useState(order.vendorPhone || '');

  // Priority (ONLY: urgent vs normal)
  const [priority, setPriority] = useState<PriorityLevel>(
    order.priority === 'emergency' ? 'urgent' : order.priority || 'normal'
  );

  // Symptoms & Details
  const [symptom, setSymptom] = useState(order.symptom || '');
  const [errorDetails, setErrorDetails] = useState(order.errorDetails || '');
  const [reporterName, setReporterName] = useState(order.reporterName || '');
  const [reporterPhone, setReporterPhone] = useState(order.reporterPhone || '');
  const [reportDate, setReportDate] = useState(order.reportDate || new Date().toISOString().slice(0, 10));

  // Maintenance Department Assessment (ตามแบบฟอร์มบันทึกข้อความ สธ.)
  const [repairTypeAssessment, setRepairTypeAssessment] = useState<RepairTypeAssessment>(
    order.repairTypeAssessment || 'internal_free'
  );
  const [externalCompanyName, setExternalCompanyName] = useState(
    order.externalCompanyName || order.externalVendorName || order.vendor || ''
  );
  const [otherRepairAssessmentText, setOtherRepairAssessmentText] = useState(
    order.otherRepairAssessmentText || ''
  );
  const [estimatedRepairDays, setEstimatedRepairDays] = useState<number>(order.estimatedRepairDays || 1);
  const [estimatedRepairCost, setEstimatedRepairCost] = useState<number>(order.estimatedRepairCost || 0);
  const [maintenanceSectionSigner, setMaintenanceSectionSigner] = useState(
    order.maintenanceSectionSigner || order.assignedTechName || 'นายช่างเทคนิคงานซ่อมบำรุง'
  );
  const [assignedTechId, setAssignedTechId] = useState(order.assignedTechId || '');

  // Approval Workflow
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus>(order.approvalStatus || 'pending_approval');
  const [approvalDate, setApprovalDate] = useState(order.approvalDate || new Date().toISOString().slice(0, 10));
  const [approverName, setApproverName] = useState(order.approverName || 'นายแพทย์จิรวัฒน์ วงษ์สวัสดิ์');
  const [approverTitle, setApproverTitle] = useState(
    order.approverTitle || 'นายแพทย์ชำนาญการ (ด้านเวชกรรม) ตำแหน่ง ผู้อำนวยการโรงพยาบาลสังขละบุรี'
  );
  const [headOfficerName, setHeadOfficerName] = useState(order.headOfficerName || 'นางสาวชุติญา จรัสกุลธาดา');
  const [headOfficerTitle, setHeadOfficerTitle] = useState(order.headOfficerTitle || 'หัวหน้าเจ้าหน้าที่');
  const [headOfficerOpinion, setHeadOfficerOpinion] = useState(
    order.headOfficerOpinion || 'เรียน ผู้อำนวยการโรงพยาบาลสังขละบุรี เพื่อโปรดพิจารณาอนุมัติให้ดำเนินการซ่อมบำรุงตามเสนอ'
  );
  const [approvalComments, setApprovalComments] = useState(
    order.approvalComments || 'อนุมัติให้ดำเนินการซ่อมบำรุงตามเสนอ'
  );

  // Status
  const [status, setStatus] = useState<WorkOrderStatus>(order.status || 'pending');

  // Images
  const [images, setImages] = useState<string[]>(order.images || (order.photoUrl ? [order.photoUrl] : []));
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Action status
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!assetName.trim()) {
      setErrorMessage('กรุณาระบุชื่อครุภัณฑ์');
      return;
    }
    if (!symptom.trim()) {
      setErrorMessage('กรุณาระบุลักษณะหรืออาการชำรุด');
      return;
    }
    if (!reporterName.trim()) {
      setErrorMessage('กรุณาระบุชื่อผู้ส่งซ่อม (ผู้แจ้ง)');
      return;
    }

    // Enforce Approval Rule: Cannot be in_progress or completed if not approved!
    if (approvalStatus !== 'approved' && (status === 'in_progress' || status === 'completed')) {
      setErrorMessage('⚠️ งานซ่อมนี้ยังไม่ได้รับการอนุมัติ กรุณาเลือก "อนุมัติแล้ว" ในส่วนการอนุมัติก่อนเริ่มดำเนินการซ่อมบำรุง');
      return;
    }

    setIsSaving(true);

    const assignedTech = technicians.find(t => t.id === assignedTechId);

    const updates: Partial<WorkOrder> = {
      documentNo: documentNo.trim(),
      assetCode: assetCode.trim(),
      assetName: assetName.trim(),
      model: model.trim(),
      brand: brand.trim(),
      department,
      vendor: vendor.trim(),
      vendorPhone: vendorPhone.trim(),
      priority,
      status,
      symptom: symptom.trim(),
      errorDetails: errorDetails.trim(),
      reporterName: reporterName.trim(),
      reporterPhone: reporterPhone.trim(),
      reportDate,
      // Maintenance assessment
      repairTypeAssessment,
      externalCompanyName: externalCompanyName.trim() || undefined,
      otherRepairAssessmentText: otherRepairAssessmentText.trim() || undefined,
      estimatedRepairDays: Number(estimatedRepairDays) || 1,
      estimatedRepairCost: Number(estimatedRepairCost) || 0,
      maintenanceSectionSigner: maintenanceSectionSigner.trim(),
      assignedTechId: assignedTechId || undefined,
      assignedTechName: assignedTech?.name || order.assignedTechName,
      // Approval
      approvalStatus,
      approvalDate: approvalStatus === 'approved' ? approvalDate : undefined,
      approverName: approverName.trim(),
      approverTitle: approverTitle.trim(),
      headOfficerName: headOfficerName.trim(),
      headOfficerTitle: headOfficerTitle.trim(),
      headOfficerOpinion: headOfficerOpinion.trim() || undefined,
      approvalComments: approvalComments.trim(),
      // Photos
      images,
      photoUrl: images.length > 0 ? images[0] : undefined
    };

    try {
      updateWorkOrder(order.id, updates);
      setIsSaving(false);
      setIsSaved(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setIsSaving(false);
      setErrorMessage(`เกิดข้อผิดพลาดในการบันทึก: ${err?.message || 'โปรดตรวจสอบการเชื่อมต่อ'}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-auto overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-xl">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base leading-tight">
                  แก้ไขแบบฟอร์มใบแจ้งซ่อมบำรุงพัสดุ-ครุภัณฑ์
                </h3>
                <span className="font-mono text-xs bg-slate-800 text-emerald-400 px-2 py-0.5 rounded border border-slate-700">
                  {orderNumber}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  approvalStatus === 'approved' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                  approvalStatus === 'rejected' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                  'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {approvalStatus === 'approved' ? '✓ อนุมัติการซ่อมแล้ว' :
                   approvalStatus === 'rejected' ? '✕ ไม่อนุมัติ' : '⏳ รออนุมัติก่อนซ่อม'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                ปรับปรุงรายละเอียดตามแบบฟอร์มบันทึกข้อความ สธ. แนบไฟล์ภาพ และตรวจสอบการอนุมัติก่อนซ่อม
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Banner */}
        {isSaved ? (
          <div className="p-10 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center animate-bounce shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-slate-900">
              บันทึกการแก้ไขใบแจ้งซ่อมสำเร็จ!
            </h4>
            <p className="text-xs text-slate-500">
              ข้อมูลใบแจ้งซ่อม {orderNumber} ได้รับการอัปเดตลงระบบและซิงค์ Firebase Cloud Firestore เรียบร้อยแล้ว
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-xs">
            
            {/* Inline Error Notice */}
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="font-semibold">{errorMessage}</span>
              </div>
            )}

            {/* Section 1: Official Header & Asset Information */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-emerald-800 pb-1.5">
                <h4 className="font-bold text-emerald-950 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-700" />
                  <span>๑. ข้อมูลหนังสือบันทึกข้อความและครุภัณฑ์ที่ขออนุมัติซ่อม</span>
                </h4>
                <span className="text-[11px] text-slate-500">ส่วนราชการ: โรงพยาบาลสังขละบุรี ฝ่ายบริหารทั่วไป</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    ที่เอกสารหนังสือ *
                  </label>
                  <input
                    type="text"
                    value={documentNo}
                    onChange={(e) => setDocumentNo(e.target.value)}
                    placeholder="เช่น กจ ๐๐๓.๓๐๘.๑/๐๐๐๑"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono text-slate-900 focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    รหัสครุภัณฑ์ *
                  </label>
                  <input
                    type="text"
                    value={assetCode}
                    onChange={(e) => setAssetCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono font-bold text-emerald-950 focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    ฝ่าย / งาน / แผนกผู้ส่งซ่อม *
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
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
                    placeholder="เช่น เครื่องตรวจคลื่นไฟฟ้าหัวใจ EKG 12 Lead"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-semibold text-slate-900 focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    รุ่น (Model)
                  </label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="เช่น PageWriter TC30"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    บริษัทคู่ค้า / ผู้ผลิต / ตัวแทนจำหน่าย
                  </label>
                  <input
                    type="text"
                    value={vendor}
                    onChange={(e) => setVendor(e.target.value)}
                    placeholder="เช่น บริษัท ฟิลิปส์ อิเล็กทรอนิกส์ (ประเทศไทย) จำกัด"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    เบอร์โทรศัพท์บริษัท
                  </label>
                  <input
                    type="text"
                    value={vendorPhone}
                    onChange={(e) => setVendorPhone(e.target.value)}
                    placeholder="เช่น 02-614-3333"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Symptom & Priority (ONLY 2 Levels: ด่วนมาก vs งานปกติ) */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between border-b border-emerald-800 pb-1.5">
                <h4 className="font-bold text-emerald-950 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-emerald-700" />
                  <span>๒. ลักษณะ/อาการชำรุด และระดับความเร่งด่วน</span>
                </h4>
                <span className="text-[11px] font-semibold text-emerald-800">
                  กำหนดเฉพาะ: ด่วนมาก และ งานปกติ
                </span>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  ลักษณะ / อาการชำรุด *
                </label>
                <textarea
                  rows={2}
                  value={symptom}
                  onChange={(e) => setSymptom(e.target.value)}
                  placeholder="ระบุอาการผิดปกติ เช่น เครื่องไม่เปิด, ไฟสถานะสีแดงกระพริบ, มีเสียงดังผิดปกติ..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">
                  ระดับความเร่งด่วน (Priority) *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Choice 1: ด่วนมาก */}
                  <label
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                      priority === 'urgent' || priority === 'emergency'
                        ? 'border-rose-500 bg-rose-50/80 text-rose-950 ring-1 ring-rose-500 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="priority"
                      value="urgent"
                      checked={priority === 'urgent' || priority === 'emergency'}
                      onChange={() => setPriority('urgent')}
                      className="accent-rose-600 w-4 h-4"
                    />
                    <div>
                      <div className="font-bold text-rose-700 text-xs flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                        <span>ด่วนมาก (High Priority)</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        กระทบต่อกระบวนการรักษาผู้ป่วย หรือระบบสำคัญที่ต้องแก้ไขเร่งด่วน
                      </div>
                    </div>
                  </label>

                  {/* Choice 2: งานปกติ */}
                  <label
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                      priority === 'normal'
                        ? 'border-emerald-500 bg-emerald-50/80 text-emerald-950 ring-1 ring-emerald-500 shadow-xs'
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
                      <div className="font-bold text-emerald-700 text-xs flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-600" />
                        <span>งานปกติ (Routine Priority)</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        งานซ่อมบำรุงทั่วไป มีเครื่องสำรองใช้งานได้ตามปกติ
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    ลงชื่อผู้ส่งซ่อม (ผู้รายงาน) *
                  </label>
                  <input
                    type="text"
                    value={reporterName}
                    onChange={(e) => setReporterName(e.target.value)}
                    placeholder="เช่น พว.วิภาดา รุ่งเรือง"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    เบอร์โทรศัพท์ผู้ส่งซ่อม
                  </label>
                  <input
                    type="text"
                    value={reporterPhone}
                    onChange={(e) => setReporterPhone(e.target.value)}
                    placeholder="เช่น 034-595021 ต่อ 115"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    วันที่ส่งซ่อม
                  </label>
                  <input
                    type="text"
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Photo Attachments */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between border-b border-emerald-800 pb-1.5">
                <h4 className="font-bold text-emerald-950 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-emerald-700" />
                  <span>๓. แนบไฟล์ภาพถ่ายสภาพครุภัณฑ์และอาการชำรุด (Photo Attachments)</span>
                </h4>
                <span className="text-[11px] text-slate-500">
                  แนบแล้ว {images.length} ภาพ (จะพิมพ์ลงในแบบฟอร์มบันทึกข้อความ)
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
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
                  className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl font-semibold text-slate-700 transition cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-slate-600" />
                  <span>เลือกภาพถ่ายอาการชำรุด / สภาพเครื่อง</span>
                </button>
                <span className="text-[11px] text-slate-400">
                  รองรับไฟล์ภาพ JPG, PNG, WebP (สามารถเลือกหลายภาพพร้อมกันได้)
                </span>
              </div>

              {/* Thumbnails Gallery */}
              {images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-video shadow-2xs">
                      <img src={img} alt={`Fault photo ${idx + 1}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPreviewImage(img)}
                          className="p-1.5 bg-white/90 hover:bg-white text-slate-900 rounded-lg cursor-pointer"
                          title="ดูภาพขนาดใหญ่"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg cursor-pointer"
                          title="ลบภาพนี้"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section 4: Maintenance Department Assessment (บันทึกหน่วยงานซ่อมบำรุง/ฝ่ายบริหารทั่วไป) */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between border-b border-emerald-800 pb-1.5">
                <h4 className="font-bold text-emerald-950 flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-emerald-700" />
                  <span>๔. บันทึกหน่วยงานซ่อมบำรุง / ฝ่ายบริหารทั่วไป (เสนอ ผู้อำนวยการโรงพยาบาลสังขละบุรี)</span>
                </h4>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
                <span className="font-bold text-slate-800 block text-xs">
                  ผลการตรวจสอบและแนวทางการดำเนินการซ่อม (ตามแบบ สธ.):
                </span>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="repairTypeAssessment"
                      value="internal_free"
                      checked={repairTypeAssessment === 'internal_free'}
                      onChange={() => setRepairTypeAssessment('internal_free')}
                      className="accent-emerald-700"
                    />
                    <span className="text-slate-800">
                      ( ) ซ่อมได้เองโดยช่างของโรงพยาบาล <strong>ไม่เสียค่าใช้จ่าย</strong>
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="repairTypeAssessment"
                      value="internal_with_materials"
                      checked={repairTypeAssessment === 'internal_with_materials'}
                      onChange={() => setRepairTypeAssessment('internal_with_materials')}
                      className="accent-emerald-700"
                    />
                    <span className="text-slate-800">
                      ( ) ซ่อมได้เองโดยช่างของโรงพยาบาล <strong>โดยเสียค่าวัสดุเพิ่มเติม</strong>
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="repairTypeAssessment"
                      value="division_repair"
                      checked={repairTypeAssessment === 'division_repair'}
                      onChange={() => setRepairTypeAssessment('division_repair')}
                      className="accent-emerald-700"
                    />
                    <span className="text-slate-800">
                      ( ) ส่งซ่อมกองช่างบำรุง
                    </span>
                  </label>

                  <div className="space-y-1.5 pl-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="repairTypeAssessment"
                        value="external_company"
                        checked={repairTypeAssessment === 'external_company'}
                        onChange={() => setRepairTypeAssessment('external_company')}
                        className="accent-emerald-700"
                      />
                      <span className="text-slate-800">
                        ( ) ไม่สามารถซ่อมเองได้ จำเป็นต้องส่งซ่อมภายนอกหน่วยงาน (ส่งซ่อมบริษัท)
                      </span>
                    </label>
                    {repairTypeAssessment === 'external_company' && (
                      <div className="pl-6 pt-1">
                        <label className="block text-slate-700 font-bold mb-1">
                          ระบุชื่อบริษัทส่งซ่อมภายนอก:
                        </label>
                        <input
                          type="text"
                          value={externalCompanyName}
                          onChange={(e) => setExternalCompanyName(e.target.value)}
                          placeholder="เช่น บริษัท ฟิลิปส์ อิเล็กทรอนิกส์ (ประเทศไทย) จำกัด, บริษัท เมดิทรอนิกส์..."
                          className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 pl-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="repairTypeAssessment"
                        value="other"
                        checked={repairTypeAssessment === 'other'}
                        onChange={() => setRepairTypeAssessment('other')}
                        className="accent-emerald-700"
                      />
                      <span className="text-slate-800">
                        ( ) อื่น ๆ (ระบุรายละเอียดเพิ่มเติม)
                      </span>
                    </label>
                    {repairTypeAssessment === 'other' && (
                      <div className="pl-6 pt-1">
                        <label className="block text-slate-700 font-bold mb-1">
                          พิมพ์ข้อความเพิ่มเติม:
                        </label>
                        <input
                          type="text"
                          value={otherRepairAssessmentText}
                          onChange={(e) => setOtherRepairAssessmentText(e.target.value)}
                          placeholder="เช่น แนะนำให้แทงจำหน่ายเนื่องจากอะไหล่เลิกผลิต, ส่งศูนย์เครื่องมือแพทย์..."
                          className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      ระยะเวลาการซ่อมประมาณ (วัน)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={estimatedRepairDays}
                      onChange={(e) => setEstimatedRepairDays(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      ค่าใช้จ่ายประมาณการ (บาท)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={estimatedRepairCost}
                      onChange={(e) => setEstimatedRepairCost(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold text-right text-emerald-950"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      ช่างผู้รับผิดชอบ / มอบหมาย
                    </label>
                    <select
                      value={assignedTechId}
                      onChange={(e) => setAssignedTechId(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2"
                    >
                      <option value="">-- เลือกช่างผู้รับผิดชอบ --</option>
                      {technicians.map(t => (
                        <option key={t.id} value={t.id}>{t.name} ({t.roleTitle})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    ลงชื่อผู้ประเมินหน่วยงานซ่อมบำรุง
                  </label>
                  <input
                    type="text"
                    value={maintenanceSectionSigner}
                    onChange={(e) => setMaintenanceSectionSigner(e.target.value)}
                    placeholder="เช่น นายกิตติศักดิ์ พัฒนไพศาล (ช่างเทคนิคงานซ่อมบำรุง)"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>
            </div>

            {/* Section 5: Pre-Repair Approval Workflow (การอนุมัติก่อนซ่อม) */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between border-b border-emerald-800 pb-1.5">
                <h4 className="font-bold text-emerald-950 flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-emerald-700" />
                  <span>๕. ขั้นตอนการอนุมัติก่อนซ่อมบำรุง (Approval Workflow)</span>
                </h4>
                <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  * ต้องได้รับการอนุมัติก่อนเริ่มดำเนินการซ่อม
                </span>
              </div>

              {/* Status Select & Approval Buttons */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 space-y-3">
                
                {/* Approval Action Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-200/80 pb-3">
                  <div>
                    <label className="block text-slate-800 font-bold mb-0.5">
                      คำสั่งการอนุมัติก่อนซ่อม *
                    </label>
                    <p className="text-[11px] text-slate-500">
                      โดย นายแพทย์จิรวัฒน์ วงษ์สวัสดิ์ ผู้อำนวยการโรงพยาบาลสังขละบุรี
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setApprovalStatus('approved')}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer ${
                        approvalStatus === 'approved'
                          ? 'bg-emerald-700 text-white ring-2 ring-emerald-500 shadow-xs'
                          : 'bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-50'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>✓ อนุมัติ</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setApprovalStatus('rejected')}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer ${
                        approvalStatus === 'rejected'
                          ? 'bg-rose-700 text-white ring-2 ring-rose-500 shadow-xs'
                          : 'bg-white text-rose-800 border border-rose-300 hover:bg-rose-50'
                      }`}
                    >
                      <X className="w-4 h-4" />
                      <span>✕ ไม่อนุมัติ</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setApprovalStatus('pending_approval')}
                      className={`px-3 py-1.5 rounded-lg font-medium text-xs transition cursor-pointer ${
                        approvalStatus === 'pending_approval'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      ⏳ รออนุมัติ
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-800 font-semibold mb-1">
                      สถานะงานซ่อมปัจจุบัน (Work Order Status)
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as WorkOrderStatus)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2.5 font-semibold text-xs text-slate-800 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                    >
                      <option value="pending">รอดำเนินการ (Pending)</option>
                      <option value="assigned">มอบหมายแล้ว (Assigned)</option>
                      <option value="in_progress">กำลังปฏิบัติงานซ่อม (In Progress - ต้องอนุมัติแล้ว)</option>
                      <option value="waiting_parts">รออะไหล่ (Waiting Parts)</option>
                      <option value="external">ส่งศูนย์บริการภายนอก (External)</option>
                      <option value="completed">ซ่อมสำเร็จ (Completed)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-800 font-semibold mb-1">
                      วันที่อนุมัติ
                    </label>
                    <input
                      type="text"
                      value={approvalDate}
                      onChange={(e) => setApprovalDate(e.target.value)}
                      placeholder="YYYY-MM-DD"
                      className="w-full bg-white border border-slate-300 rounded-lg p-2.5 font-mono text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Two Column Text Inputs: ความเห็นหัวหน้าเจ้าหน้าที่ และ คำสั่งอนุมัติ */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-amber-200/60">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-slate-800 font-bold">
                        ความเห็นของหัวหน้าเจ้าหน้าที่
                      </label>
                      <span className="text-[10px] text-slate-500 font-medium">({headOfficerName})</span>
                    </div>
                    <textarea
                      rows={2}
                      value={headOfficerOpinion}
                      onChange={(e) => setHeadOfficerOpinion(e.target.value)}
                      placeholder="เช่น เรียน ผู้อำนวยการโรงพยาบาลสังขละบุรี เพื่อโปรดพิจารณาอนุมัติให้ดำเนินการซ่อมบำรุงตามเสนอ"
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-slate-800 font-bold">
                        คำสั่ง / ข้อความการอนุมัติ
                      </label>
                      <span className="text-[10px] text-slate-500 font-medium">({approverName})</span>
                    </div>
                    <textarea
                      rows={2}
                      value={approvalComments}
                      onChange={(e) => setApprovalComments(e.target.value)}
                      placeholder="เช่น อนุมัติให้ดำเนินการซ่อมบำรุงตามเสนอ"
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-[11px] text-slate-500">
                ข้อมูลจะถูกอัปเดตลงระบบและซิงค์เชื่อมต่อไปยัง Firebase Firestore อัตโนมัติ
              </span>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSaving}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl font-medium transition cursor-pointer disabled:opacity-50"
                >
                  ยกเลิก
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-600 text-white rounded-xl font-bold transition shadow-xs cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>กำลังบันทึกและซิงค์...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>บันทึกการแก้ไขใบแจ้งซ่อม</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </form>
        )}

        {/* Enlarged Image Preview Modal */}
        {previewImage && (
          <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
            <div className="relative max-w-3xl max-h-[85vh] bg-white rounded-2xl overflow-hidden shadow-2xl p-2">
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
