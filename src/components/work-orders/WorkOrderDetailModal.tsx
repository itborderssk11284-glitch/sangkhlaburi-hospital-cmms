import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  Wrench, 
  Package, 
  CheckCircle, 
  AlertTriangle, 
  Save, 
  Plus, 
  Building2,
  Phone,
  Edit3,
  ShieldCheck,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  Clock,
  FileText
} from 'lucide-react';
import { WorkOrder, WorkOrderStatus, ApprovalStatus, RepairTypeAssessment } from '../../types';
import { useApp } from '../../context/AppContext';
import { EditWorkOrderModal } from './EditWorkOrderModal';

export const WorkOrderDetailModal: React.FC<{
  order: WorkOrder;
  onClose: () => void;
  onPrint: (order: WorkOrder) => void;
}> = ({ order, onClose, onPrint }) => {
  const { 
    technicians, 
    spareParts, 
    updateWorkOrderStatus, 
    updateWorkOrder, 
    issuePartToOrder,
    currentUser 
  } = useApp();

  const canEdit = currentUser?.role === 'super_admin' || currentUser?.role === 'technician';
  const isSupervisor = currentUser?.role === 'supervisor';
  const isDepartmentStaff = currentUser?.role === 'department_staff';

  const [status, setStatus] = useState<WorkOrderStatus>(order.status);
  const [assignedTechId, setAssignedTechId] = useState(order.assignedTechId || '');
  const [rootCause, setRootCause] = useState(order.rootCause || '');
  const [actionTaken, setActionTaken] = useState(order.actionTaken || '');
  const [inspectorName, setInspectorName] = useState(order.inspectorName || order.reporterName || '');
  const [externalVendorName, setExternalVendorName] = useState(order.externalVendorName || '');
  const [externalCost, setExternalCost] = useState(order.externalCost || 0);

  // Approval state
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus>(order.approvalStatus || 'pending_approval');
  const [headOfficerOpinion, setHeadOfficerOpinion] = useState(
    order.headOfficerOpinion || 'เรียน ผู้อำนวยการโรงพยาบาลสังขละบุรี เพื่อโปรดพิจารณาอนุมัติให้ดำเนินการซ่อมบำรุงตามเสนอ'
  );
  const [approvalComments, setApprovalComments] = useState(
    order.approvalComments || 'อนุมัติให้ดำเนินการซ่อมบำรุงตามเสนอ'
  );
  const [approvalWarning, setApprovalWarning] = useState<string | null>(null);

  // Maintenance Assessment State (บันทึกหน่วยงานซ่อมบำรุง/พัสดุ)
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

  // Edit Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Image preview state
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Spare parts issuance state
  const [selectedPartId, setSelectedPartId] = useState('');
  const [partQty, setPartQty] = useState(1);
  const [issueNotice, setIssueNotice] = useState<string | null>(null);

  const images = order.images || (order.photoUrl ? [order.photoUrl] : []);

  const handleStatusChange = (newStatus: WorkOrderStatus) => {
    // If not approved and attempting to start repair or complete, show warning
    if (approvalStatus !== 'approved' && (newStatus === 'in_progress' || newStatus === 'completed')) {
      setApprovalWarning('⚠️ ตามระเบียบราชการ: ต้องได้รับการอนุมัติจากผู้อำนวยการก่อนเริ่มการซ่อมบำรุง กรุณากดปุ่ม "อนุมัติ" ด้านบนก่อน');
    } else {
      setApprovalWarning(null);
    }
    setStatus(newStatus);
  };

  const handleSetApproval = (newApproval: ApprovalStatus) => {
    const today = new Date().toISOString().slice(0, 10);
    setApprovalStatus(newApproval);
    setApprovalWarning(null);

    updateWorkOrder(order.id, {
      approvalStatus: newApproval,
      approvalDate: newApproval !== 'pending_approval' ? today : undefined,
      approverName: order.approverName || 'นายแพทย์จิรวัฒน์ วงษ์สวัสดิ์',
      approverTitle: order.approverTitle || 'นายแพทย์ชำนาญการ (ด้านเวชกรรม) รักษาการในตำแหน่งผู้อำนวยการโรงพยาบาลสังขละบุรี',
      headOfficerName: order.headOfficerName || 'นางสาวชุติญา จรัสกุลธาดา',
      headOfficerTitle: order.headOfficerTitle || 'หัวหน้าเจ้าหน้าที่',
      headOfficerOpinion,
      approvalComments: newApproval === 'rejected' ? (approvalComments || 'ไม่อนุมัติการซ่อมบำรุง') : approvalComments
    });
  };

  const handleSaveDetails = (e: React.FormEvent) => {
    e.preventDefault();

    // Check approval block
    if (approvalStatus !== 'approved' && (status === 'in_progress' || status === 'completed')) {
      setApprovalWarning('⚠️ ไม่สามารถบันทึกสถานะกำลังซ่อมหรือซ่อมเสร็จได้ เนื่องจากใบแจ้งซ่อมยังไม่ได้รับการอนุมัติ กรุณากดปุ่ม "อนุมัติ" หรือปรับสถานะการอนุมัติเป็น "อนุมัติแล้ว"');
      return;
    }

    const assignedTech = technicians.find(t => t.id === assignedTechId);
    const today = new Date().toISOString().slice(0, 10);

    updateWorkOrder(order.id, {
      status,
      assignedTechId: assignedTechId || undefined,
      assignedTechName: assignedTech?.name || order.assignedTechName,
      rootCause: rootCause || undefined,
      actionTaken: actionTaken || undefined,
      externalVendorName: externalCompanyName || externalVendorName || undefined,
      externalCost: Number(externalCost) || 0,
      totalCost: (order.usedParts.reduce((s, p) => s + p.totalPrice, 0)) + (Number(externalCost) || 0),
      inspectorName: status === 'completed' ? inspectorName : order.inspectorName,
      inspectionDate: status === 'completed' ? today : order.inspectionDate,
      inspectionPassed: status === 'completed' ? true : order.inspectionPassed,
      // Maintenance assessment fields
      repairTypeAssessment,
      externalCompanyName: externalCompanyName.trim() || undefined,
      otherRepairAssessmentText: otherRepairAssessmentText.trim() || undefined,
      estimatedRepairDays: Number(estimatedRepairDays) || 1,
      estimatedRepairCost: Number(estimatedRepairCost) || 0,
      maintenanceSectionSigner: maintenanceSectionSigner.trim() || undefined,
      // Approval fields
      approvalStatus,
      headOfficerOpinion: headOfficerOpinion.trim() || undefined,
      approvalComments: approvalComments.trim() || undefined,
    });

    updateWorkOrderStatus(order.id, status);
    onClose();
  };

  const handleIssuePart = () => {
    if (!selectedPartId) return;
    const success = issuePartToOrder(order.id, selectedPartId, partQty);
    if (success) {
      setIssueNotice(`เบิกตัดสต็อกสำเร็จ: ${partQty} หน่วย`);
      setSelectedPartId('');
      setPartQty(1);
      setTimeout(() => setIssueNotice(null), 3000);
    } else {
      setIssueNotice('ยอดสต็อกอะไหล่ในคลังไม่เพียงพอ');
      setTimeout(() => setIssueNotice(null), 3000);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-auto overflow-hidden border border-slate-200">
          
          {/* Header */}
          <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-700/80 rounded-xl">
                <Wrench className="w-5 h-5 text-emerald-200" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm font-bold text-emerald-400">
                    {order.orderNumber}
                  </span>
                  <span className="font-mono text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                    กจ ๐๐๓.๓๐๘.๑/
                  </span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    order.priority === 'urgent' || order.priority === 'emergency' 
                      ? 'bg-rose-500 text-white' 
                      : 'bg-emerald-600 text-white'
                  }`}>
                    {order.priority === 'urgent' || order.priority === 'emergency' ? '● ด่วนมาก' : '● งานปกติ'}
                  </span>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                    approvalStatus === 'approved' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                    approvalStatus === 'rejected' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                    'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}>
                    {approvalStatus === 'approved' ? '✓ อนุมัติการซ่อมแล้ว' :
                     approvalStatus === 'rejected' ? '✕ ไม่อนุมัติ' : '⏳ รออนุมัติก่อนซ่อม'}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mt-1">
                  {order.assetName}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {canEdit && (
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer shadow-xs"
                  title="แก้ไขข้อมูลใบแจ้งซ่อมและแบบฟอร์ม"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>แก้ไขใบแจ้งซ่อม</span>
                </button>
              )}
              <button
                onClick={() => onPrint(order)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">พิมพ์บันทึกข้อความ</span>
              </button>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white rounded transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content Body */}
          <div className="p-6 max-h-[78vh] overflow-y-auto space-y-5 text-xs">
            
            {/* Approval Control Box with explicit "อนุมัติ" and "ไม่อนุมัติ" Buttons */}
            <div className="p-4 rounded-xl border border-slate-300 bg-slate-50 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className={`w-5 h-5 shrink-0 mt-0.5 ${
                    approvalStatus === 'approved' ? 'text-emerald-700' :
                    approvalStatus === 'rejected' ? 'text-rose-700' : 'text-amber-700'
                  }`} />
                  <div>
                    <div className="font-bold text-xs flex items-center gap-2">
                      <span>คำสั่งการอนุมัติก่อนซ่อมบำรุง (โดยผู้อำนวยการโรงพยาบาลสังขละบุรี)</span>
                      <span className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                        approvalStatus === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                        approvalStatus === 'rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {approvalStatus === 'approved' ? '● อนุมัติแล้ว' :
                         approvalStatus === 'rejected' ? '● ไม่อนุมัติ' : '● รอการพิจารณา'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      ผู้ลงนามอนุมัติ: <strong>นายแพทย์จิรวัฒน์ วงษ์สวัสดิ์</strong> (ผู้อำนวยการโรงพยาบาลสังขละบุรี)
                    </p>
                  </div>
                </div>

                {/* Explicit Action Buttons: อนุมัติ และ ไม่อนุมัติ */}
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => handleSetApproval('approved')}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-bold text-xs transition cursor-pointer shadow-xs ${
                      approvalStatus === 'approved'
                        ? 'bg-emerald-700 text-white ring-2 ring-emerald-500'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>✓ อนุมัติ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSetApproval('rejected')}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-bold text-xs transition cursor-pointer shadow-xs ${
                      approvalStatus === 'rejected'
                        ? 'bg-rose-700 text-white ring-2 ring-rose-500'
                        : 'bg-rose-50 text-rose-800 border border-rose-300 hover:bg-rose-100'
                    }`}
                  >
                    <XCircle className="w-4 h-4" />
                    <span>✕ ไม่อนุมัติ</span>
                  </button>

                  {approvalStatus !== 'pending_approval' && (
                    <button
                      type="button"
                      onClick={() => handleSetApproval('pending_approval')}
                      className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-200 transition text-[11px]"
                      title="รีเซ็ตสถานะเป็นรออนุมัติ"
                    >
                      <Clock className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Two Column Text Inputs: ความเห็นหัวหน้าเจ้าหน้าที่ และ คำสั่งอนุมัติ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-slate-800 font-bold mb-1">
                    ความเห็นของหัวหน้าเจ้าหน้าที่ (นางสาวชุติญา จรัสกุลธาดา)
                  </label>
                  <textarea
                    rows={2}
                    value={headOfficerOpinion}
                    onChange={(e) => setHeadOfficerOpinion(e.target.value)}
                    placeholder="เช่น เรียน ผู้อำนวยการโรงพยาบาลสังขละบุรี เพื่อโปรดพิจารณาอนุมัติให้ดำเนินการซ่อมบำรุงตามเสนอ"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-800 font-bold mb-1">
                    คำสั่ง / ข้อความการอนุมัติ (นายแพทย์จิรวัฒน์ วงษ์สวัสดิ์)
                  </label>
                  <textarea
                    rows={2}
                    value={approvalComments}
                    onChange={(e) => setApprovalComments(e.target.value)}
                    placeholder="เช่น อนุมัติให้ดำเนินการซ่อมบำรุงตามเสนอ"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Warning Message if blocked */}
            {approvalWarning && (
              <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="font-semibold text-xs">{approvalWarning}</span>
              </div>
            )}

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 block">รหัสครุภัณฑ์:</span>
                <span className="font-mono font-bold text-slate-900">{order.assetCode}</span>
              </div>
              <div>
                <span className="text-slate-400 block">แผนกผู้แจ้ง:</span>
                <span className="font-semibold text-slate-800">{order.department}</span>
              </div>
              <div>
                <span className="text-slate-400 block">ผู้ส่งซ่อม:</span>
                <span className="font-semibold text-slate-800">{order.reporterName}</span>
                {order.reporterPhone && <span className="text-[10px] text-slate-400 block">({order.reporterPhone})</span>}
              </div>
              <div>
                <span className="text-slate-400 block">วันที่ส่งซ่อม:</span>
                <span className="font-semibold text-slate-800">{order.reportDate}</span>
              </div>
            </div>

            {/* Symptom Box */}
            <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center gap-1.5 font-bold text-amber-900 mb-1">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>ลักษณะ / อาการชำรุดที่พบ:</span>
              </div>
              <p className="text-slate-800 text-xs leading-relaxed font-medium">{order.symptom}</p>
              {order.errorDetails && (
                <p className="text-slate-600 text-[11px] mt-1.5 italic">
                  เพิ่มเติม: {order.errorDetails}
                </p>
              )}
            </div>

            {/* Maintenance Department Assessment for User พัสดุ / ช่าง */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-300 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Wrench className="w-4 h-4 text-emerald-700" />
                  บันทึกหน่วยงานซ่อมบำรุง / ฝ่ายบริหารทั่วไป (สำหรับ user พัสดุ/งานซ่อมบำรุง)
                </span>
                <span className="text-[11px] text-slate-500">ผลการตรวจสอบสภาพเครื่อง</span>
              </div>

              <div className="space-y-2.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="repairAssessment"
                    value="internal_free"
                    checked={repairTypeAssessment === 'internal_free'}
                    onChange={() => setRepairTypeAssessment('internal_free')}
                    className="accent-emerald-700 w-4 h-4"
                  />
                  <span className="text-slate-800 font-medium">
                    ( ) ซ่อมได้เองโดยช่างของโรงพยาบาล <strong>ไม่เสียค่าใช้จ่าย</strong>
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="repairAssessment"
                    value="internal_with_materials"
                    checked={repairTypeAssessment === 'internal_with_materials'}
                    onChange={() => setRepairTypeAssessment('internal_with_materials')}
                    className="accent-emerald-700 w-4 h-4"
                  />
                  <span className="text-slate-800 font-medium">
                    ( ) ซ่อมได้เองโดยช่างของโรงพยาบาล <strong>โดยเสียค่าวัสดุเพิ่มเติม</strong>
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="repairAssessment"
                    value="division_repair"
                    checked={repairTypeAssessment === 'division_repair'}
                    onChange={() => setRepairTypeAssessment('division_repair')}
                    className="accent-emerald-700 w-4 h-4"
                  />
                  <span className="text-slate-800 font-medium">
                    ( ) ส่งซ่อมกองช่างบำรุง
                  </span>
                </label>

                {/* Option 4: ส่งซ่อมบริษัท (เพิ่มชื่อบริษัทได้) */}
                <div className="space-y-1.5 pl-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="repairAssessment"
                      value="external_company"
                      checked={repairTypeAssessment === 'external_company'}
                      onChange={() => setRepairTypeAssessment('external_company')}
                      className="accent-emerald-700 w-4 h-4"
                    />
                    <span className="text-slate-800 font-medium">
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

                {/* Option 5: อื่น ๆ (พิมพ์ข้อความเพิ่มได้) */}
                <div className="space-y-1.5 pl-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="repairAssessment"
                      value="other"
                      checked={repairTypeAssessment === 'other'}
                      onChange={() => setRepairTypeAssessment('other')}
                      className="accent-emerald-700 w-4 h-4"
                    />
                    <span className="text-slate-800 font-medium">
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
                        placeholder="เช่น แนะนำให้แทงจำหน่ายเนื่องจากอะไหล่เลิกผลิต, ส่งตรวจสอบศูนย์เครื่องมือแพทย์..."
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                      />
                    </div>
                  )}
                </div>

                {/* Days & Estimated Cost */}
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
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-center font-mono"
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
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-right font-mono font-bold text-emerald-950"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      ผู้บันทึกหน่วยงานซ่อมบำรุง / พัสดุ
                    </label>
                    <input
                      type="text"
                      value={maintenanceSectionSigner}
                      onChange={(e) => setMaintenanceSectionSigner(e.target.value)}
                      placeholder="เช่น นายช่างเทคนิคงานซ่อมบำรุง"
                      className="w-full bg-white border border-slate-300 rounded-lg p-2"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Attached Photos Gallery */}
            {images.length > 0 && (
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-emerald-700" />
                    ภาพถ่ายสภาพครุภัณฑ์และอาการชำรุด ({images.length} ภาพ)
                  </span>
                  <span className="text-[11px] text-slate-400">คลิกที่ภาพเพื่อดูรูปขยายใหญ่</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {images.map((img, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => setPreviewImage(img)}
                      className="relative group rounded-lg overflow-hidden border border-slate-300 bg-white aspect-video cursor-pointer hover:border-emerald-600 transition shadow-2xs"
                    >
                      <img src={img} alt={`Fault photo ${idx + 1}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[10px] font-semibold">
                        ดูภาพขยาย
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Workflow Form */}
            <form onSubmit={handleSaveDetails} className="space-y-4">
              
              {/* Action & Status Workflow Control */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    ปรับปรุงสถานะการซ่อม (Repair Status) *
                  </label>
                  <select
                    value={status}
                    onChange={(e) => handleStatusChange(e.target.value as WorkOrderStatus)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-semibold text-slate-900 focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  >
                    <option value="pending">1. รอดำเนินการรับเรื่อง (Pending)</option>
                    <option value="assigned">2. รับงาน / มอบหมายช่างแล้ว (Assigned)</option>
                    <option value="in_progress">3. กำลังปฏิบัติงานซ่อม (In Progress - ต้องอนุมัติก่อน)</option>
                    <option value="waiting_parts">4. รออะไหล่ / สั่งซื้อชิ้นส่วน (Awaiting Parts)</option>
                    <option value="external">5. ส่งศูนย์บริการภายนอก (External Service)</option>
                    <option value="testing">6. รอทดสอบความปลอดภัย / ตรวจรับ (Testing)</option>
                    <option value="completed">7. ซ่อมเสร็จสมบูรณ์ / ปิดงาน (Completed)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    มอบหมายช่างผู้รับผิดชอบ (Assigned Technician)
                  </label>
                  <select
                    value={assignedTechId}
                    onChange={(e) => setAssignedTechId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-medium text-slate-900 focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  >
                    <option value="">-- ยังไม่มอบหมายช่าง --</option>
                    {technicians.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.roleTitle})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Diagnosis & Action */}
              <div className="space-y-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    สาเหตุของความชำรุด (Root Cause Analysis)
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น สายชำรุดจากการถูกล้อเตียงทับ, แบตเตอรี่เสื่อม, บอร์ดคอนโทรลเสีย..."
                    value={rootCause}
                    onChange={(e) => setRootCause(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    รายละเอียดการปฏิบัติงานซ่อมบำรุง (Action Taken)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="เช่น ทำการเปลี่ยนอะไหล่ชุดใหม่ ตรวจสอบความปลอดภัยทางไฟฟ้า Medical Electrical Safety และทดสอบการทำงาน..."
                    value={actionTaken}
                    onChange={(e) => setActionTaken(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Spare Parts Section */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-emerald-700" />
                    รายการอะไหล่ที่เบิกใช้ในงานซ่อมนี้
                  </span>
                  <span className="font-bold text-emerald-800">
                    รวมค่าอะไหล่: {order.usedParts.reduce((s, p) => s + p.totalPrice, 0).toLocaleString()} ฿
                  </span>
                </div>

                {/* Add part inline form */}
                <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-slate-200">
                  <select
                    value={selectedPartId}
                    onChange={(e) => setSelectedPartId(e.target.value)}
                    className="flex-1 w-full bg-white border border-slate-300 rounded-lg p-2 text-xs"
                  >
                    <option value="">-- เลือกอะไหล่จากคลังเพื่อเบิกตัดสต็อก --</option>
                    {spareParts.map(p => (
                      <option key={p.id} value={p.id} disabled={p.quantity <= 0}>
                        {p.name} (คงเหลือ: {p.quantity} {p.unit}) - @{p.unitPrice.toLocaleString()} ฿
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <input
                      type="number"
                      min="1"
                      max="99"
                      value={partQty}
                      onChange={(e) => setPartQty(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 bg-white border border-slate-300 rounded-lg p-2 text-center text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleIssuePart}
                      disabled={!selectedPartId}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>เบิกใช้อะไหล่</span>
                    </button>
                  </div>
                </div>

                {issueNotice && (
                  <div className="text-xs font-semibold text-emerald-800 bg-emerald-100 p-2 rounded">
                    {issueNotice}
                  </div>
                )}

                {/* Parts table */}
                {order.usedParts.length > 0 && (
                  <div className="overflow-x-auto pt-2">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-200/60 text-slate-700 font-semibold">
                        <tr>
                          <th className="py-1.5 px-2 text-left">รหัส</th>
                          <th className="py-1.5 px-2 text-left">ชื่ออะไหล่</th>
                          <th className="py-1.5 px-2 text-center">จำนวน</th>
                          <th className="py-1.5 px-2 text-right">ราคา/หน่วย</th>
                          <th className="py-1.5 px-2 text-right">รวมเป็นเงิน</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {order.usedParts.map((p) => (
                          <tr key={p.partId}>
                            <td className="py-1 px-2 font-mono text-slate-600">{p.partCode}</td>
                            <td className="py-1 px-2 font-medium text-slate-900">{p.partName}</td>
                            <td className="py-1 px-2 text-center">{p.quantity}</td>
                            <td className="py-1 px-2 text-right">{p.unitPrice.toLocaleString()}</td>
                            <td className="py-1 px-2 text-right font-semibold">{p.totalPrice.toLocaleString()} ฿</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* External service details if applicable */}
              {(status === 'external' || order.externalCost || repairTypeAssessment === 'external_company') && (
                <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      ชื่อศูนย์บริการหรือบริษัทที่ส่งซ่อมภายนอก
                    </label>
                    <input
                      type="text"
                      placeholder="เช่น บริษัท ฟิลิปส์ อิเล็กทรอนิกส์ จำกัด"
                      value={externalCompanyName || externalVendorName}
                      onChange={(e) => {
                        setExternalCompanyName(e.target.value);
                        setExternalVendorName(e.target.value);
                      }}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      ค่าบริการส่งซ่อมภายนอก (บาท)
                    </label>
                    <input
                      type="number"
                      value={externalCost}
                      onChange={(e) => setExternalCost(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2"
                    />
                  </div>
                </div>
              )}

              {/* Inspection Sign-off */}
              {status === 'completed' && (
                <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-700" />
                      ตรวจรับงานและส่งมอบคืนหน่วยงาน
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      ผู้ตรวจรับงาน: <strong>{inspectorName || 'นางสาวชุติญา จรัสกุลธาดา'}</strong> · แผนก {order.department}
                    </p>
                  </div>
                  <input
                    type="text"
                    placeholder="ชื่อผู้ตรวจรับงาน"
                    value={inspectorName}
                    onChange={(e) => setInspectorName(e.target.value)}
                    className="bg-white border border-slate-300 rounded-lg p-2 text-xs w-full sm:w-56 font-semibold"
                  />
                </div>
              )}

              {/* Actions */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                {canEdit ? (
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(true)}
                    className="flex items-center gap-1.5 text-amber-700 hover:text-amber-800 font-bold transition cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>แก้ไขข้อมูลทั้งหมดในแบบฟอร์ม...</span>
                  </button>
                ) : isDepartmentStaff ? (
                  <span className="text-[11px] text-slate-500 italic">
                    (สิทธิ์ผู้ใช้งานทั่วไป: เข้าดูและพิมพ์ใบแจ้งซ่อมได้ แต่ไม่สามารถแก้ไขข้อมูลได้)
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-500 italic">
                    (สิทธิ์ผู้บริหาร: ดูได้อย่างเดียว และพิจารณาอนุมัติ/ไม่อนุมัติการซ่อม)
                  </span>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg font-medium transition cursor-pointer"
                  >
                    ปิดหน้าต่าง
                  </button>
                  {!isDepartmentStaff && (
                    <button
                      type="submit"
                      className="flex items-center gap-1.5 px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold transition shadow-xs cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>{isSupervisor ? 'บันทึกคำสั่งการอนุมัติ' : 'บันทึกความคืบหน้างานซ่อม'}</span>
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

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

      {/* Embedded Edit Modal */}
      {isEditModalOpen && (
        <EditWorkOrderModal
          order={order}
          onClose={() => {
            setIsEditModalOpen(false);
          }}
        />
      )}
    </>
  );
};
