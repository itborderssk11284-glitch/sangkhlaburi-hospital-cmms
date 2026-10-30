import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  Wrench, 
  UserCheck, 
  Package, 
  CheckCircle, 
  AlertTriangle, 
  Save, 
  Plus, 
  Building2,
  Phone
} from 'lucide-react';
import { WorkOrder, WorkOrderStatus } from '../../types';
import { useApp } from '../../context/AppContext';

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
    issuePartToOrder 
  } = useApp();

  const [status, setStatus] = useState<WorkOrderStatus>(order.status);
  const [assignedTechId, setAssignedTechId] = useState(order.assignedTechId || '');
  const [rootCause, setRootCause] = useState(order.rootCause || '');
  const [actionTaken, setActionTaken] = useState(order.actionTaken || '');
  const [inspectorName, setInspectorName] = useState(order.inspectorName || order.reporterName || '');
  const [externalVendorName, setExternalVendorName] = useState(order.externalVendorName || '');
  const [externalCost, setExternalCost] = useState(order.externalCost || 0);

  // Spare parts issuance state
  const [selectedPartId, setSelectedPartId] = useState('');
  const [partQty, setPartQty] = useState(1);
  const [issueNotice, setIssueNotice] = useState<string | null>(null);

  const handleSaveDetails = (e: React.FormEvent) => {
    e.preventDefault();
    const assignedTech = technicians.find(t => t.id === assignedTechId);

    const today = new Date().toISOString().slice(0, 10);
    updateWorkOrder(order.id, {
      status,
      assignedTechId: assignedTechId || undefined,
      assignedTechName: assignedTech?.name || order.assignedTechName,
      rootCause: rootCause || undefined,
      actionTaken: actionTaken || undefined,
      externalVendorName: externalVendorName || undefined,
      externalCost: Number(externalCost) || 0,
      totalCost: (order.usedParts.reduce((s, p) => s + p.totalPrice, 0)) + (Number(externalCost) || 0),
      inspectorName: status === 'completed' ? inspectorName : order.inspectorName,
      inspectionDate: status === 'completed' ? today : order.inspectionDate,
      inspectionPassed: status === 'completed' ? true : order.inspectionPassed,
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
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-auto overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-700/80 rounded-xl">
              <Wrench className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-emerald-400">
                  {order.orderNumber}
                </span>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                  order.priority === 'emergency' ? 'bg-rose-500 text-white' :
                  order.priority === 'urgent' ? 'bg-amber-500 text-white' : 'bg-emerald-700 text-white'
                }`}>
                  {order.priority === 'emergency' ? 'ฉุกเฉินวิกฤต' :
                   order.priority === 'urgent' ? 'เร่งด่วนมาก' : 'ปกติ'}
                </span>
              </div>
              <h3 className="text-base font-bold text-white mt-0.5">
                {order.assetName}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPrint(order)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">พิมพ์ใบสั่งซ่อม</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 max-h-[78vh] overflow-y-auto space-y-6 text-xs">
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
              <span className="text-slate-400 block">ผู้แจ้งซ่อม:</span>
              <span className="font-semibold text-slate-800">{order.reporterName}</span>
            </div>
            <div>
              <span className="text-slate-400 block">วันที่และเวลาแจ้ง:</span>
              <span className="font-semibold text-slate-800">{order.reportDate}</span>
            </div>
          </div>

          {/* Symptom Box */}
          <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4">
            <div className="flex items-center gap-1.5 font-bold text-amber-900 mb-1">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>อาการเสีย / รายละเอียดความผิดปกติ:</span>
            </div>
            <p className="text-slate-800 text-xs leading-relaxed">{order.symptom}</p>
            {order.errorDetails && (
              <p className="text-slate-600 text-[11px] mt-1.5 italic">
                เพิ่มเติม: {order.errorDetails}
              </p>
            )}
          </div>

          <form onSubmit={handleSaveDetails} className="space-y-5">
            {/* Action & Status Workflow Control */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  ปรับปรุงสถานะการซ่อม (Repair Status) *
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as WorkOrderStatus)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-semibold text-slate-900 focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                >
                  <option value="pending">1. รอดำเนินการรับเรื่อง (Pending)</option>
                  <option value="assigned">2. รับงาน / มอบหมายช่างแล้ว (Assigned)</option>
                  <option value="in_progress">3. กำลังปฏิบัติงานซ่อม (In Progress)</option>
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
                  placeholder="เช่น สายชำรุดจากการถูกล้อเตียงทับ, แบตเตอรี่เสื่อม, โซลินอยด์วาล์วตัน..."
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
                  placeholder="เช่น ทำการเปลี่ยนอะไหล่สายเซ็นเซอร์ใหม่ ทำความสะอาดหน้าสัมผัส และทดสอบด้วยเครื่อง Patient Simulator..."
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
            {(status === 'external' || order.externalCost) && (
              <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    ชื่อศูนย์บริการหรือบริษัทที่ส่งซ่อมภายนอก
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น บริษัท ฟิลิปส์ อิเล็กทรอนิกส์ จำกัด"
                    value={externalVendorName}
                    onChange={(e) => setExternalVendorName(e.target.value)}
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
              <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-700" />
                    ตรวจรับงานและส่งมอบคืนหน่วยงาน
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    ผู้ตรวจรับงาน: <strong>{inspectorName}</strong> · แผนก {order.department}
                  </p>
                </div>
                <input
                  type="text"
                  placeholder="ชื่อผู้ตรวจรับงาน"
                  value={inspectorName}
                  onChange={(e) => setInspectorName(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg p-2 text-xs w-48"
                />
              </div>
            )}

            {/* Actions */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg font-medium transition cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-medium transition shadow-xs cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>บันทึกความคืบหน้างานซ่อม</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
