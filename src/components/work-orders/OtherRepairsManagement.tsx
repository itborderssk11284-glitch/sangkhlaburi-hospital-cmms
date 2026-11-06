import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Printer, 
  Hammer, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Building2, 
  User, 
  ArrowRight,
  Eye,
  FileText,
  Edit3,
  ShieldCheck,
  Image as ImageIcon,
  Trash2,
  Loader2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { WorkOrder, WorkOrderStatus, PriorityLevel } from '../../types';
import { HOSPITAL_DEPARTMENTS } from '../../data/mockData';
import { WorkOrderDetailModal } from './WorkOrderDetailModal';
import { EditWorkOrderModal } from './EditWorkOrderModal';

export const OtherRepairsManagement: React.FC<{
  onOpenNewOtherRepairModal: () => void;
}> = ({ onOpenNewOtherRepairModal }) => {
  const { 
    workOrders, 
    selectedOrderForDetail, 
    setSelectedOrderForDetail, 
    setSelectedOrderForPrint,
    updateWorkOrderStatus,
    deleteWorkOrder,
    firebaseConnected,
    lastSyncedTime,
    currentUser
  } = useApp();

  const canEdit = currentUser?.role === 'super_admin' || currentUser?.role === 'technician';
  const isSupervisor = currentUser?.role === 'supervisor';
  const isDepartmentStaff = currentUser?.role === 'department_staff';

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ทั้งหมด');
  const [priorityFilter, setPriorityFilter] = useState<string>('ทั้งหมด');
  const [deptFilter, setDeptFilter] = useState('ทั้งหมด');
  const [approvalFilter, setApprovalFilter] = useState<string>('ทั้งหมด');

  // Direct editing modal state
  const [editingOrder, setEditingOrder] = useState<WorkOrder | null>(null);
  const [deleteTargetOrder, setDeleteTargetOrder] = useState<WorkOrder | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter general repair orders (orderType === 'general' or legacy orders without asset code)
  const generalOrders = workOrders.filter(
    order => order.orderType === 'general' || order.assetCode === '-' || order.assetId === 'general'
  );

  const filteredOrders = generalOrders.filter((order) => {
    const q = searchQuery.toLowerCase().trim();
    const itemName = (order.customItemName || order.assetName || '').toLowerCase();
    const matchesSearch = 
      !q ||
      order.orderNumber.toLowerCase().includes(q) ||
      (order.documentNo && order.documentNo.toLowerCase().includes(q)) ||
      itemName.includes(q) ||
      order.reporterName.toLowerCase().includes(q) ||
      order.symptom.toLowerCase().includes(q) ||
      (order.assignedTechName && order.assignedTechName.toLowerCase().includes(q));

    const matchesStatus = statusFilter === 'ทั้งหมด' || order.status === statusFilter;
    
    // Priority filter (treat legacy emergency as urgent)
    const orderPriority = (order.priority === 'emergency' ? 'urgent' : order.priority) || 'normal';
    const matchesPriority = priorityFilter === 'ทั้งหมด' || orderPriority === priorityFilter;
    
    const matchesDept = deptFilter === 'ทั้งหมด' || order.department.includes(deptFilter);

    const orderApproval = order.approvalStatus || 'pending_approval';
    const matchesApproval = approvalFilter === 'ทั้งหมด' || orderApproval === approvalFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesDept && matchesApproval;
  });

  // Calculate summary metrics
  const totalCount = generalOrders.length;
  const urgentCount = generalOrders.filter(o => (o.priority === 'urgent' || o.priority === 'emergency') && o.status !== 'completed').length;
  const pendingApprovalCount = generalOrders.filter(o => o.approvalStatus === 'pending_approval' || !o.approvalStatus).length;
  const inProgressCount = generalOrders.filter(o => o.status === 'in_progress' || o.status === 'assigned').length;
  const completedCount = generalOrders.filter(o => o.status === 'completed').length;

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="p-1.5 bg-amber-100 text-amber-800 rounded-lg">
                <Hammer className="w-5 h-5" />
              </span>
              <span>ระบบใบแจ้งซ่อมอื่นๆ (General & Facility Repairs)</span>
            </h2>
            {firebaseConnected && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Firebase Real-time Cloud {lastSyncedTime ? `(${lastSyncedTime})` : ''}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            งานอาคาร สถานที่ สาธารณูปโภค และงานซ่อมทั่วไป (พิมพ์รายการซ่อมได้เอง ไม่ต้องระบุรหัสครุภัณฑ์) พร้อมระบบอนุมัติและพิมพ์บันทึกข้อความ A4 14pt
          </p>
        </div>

        {!isSupervisor && (
          <button
            onClick={onOpenNewOtherRepairModal}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition shadow-xs cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>+ เปิดใบแจ้งซ่อมอื่นๆ ใหม่</span>
          </button>
        )}
      </div>

      {/* KPI Stats Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] text-slate-500 font-medium">รายการซ่อมอื่นๆ ทั้งหมด</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">{totalCount}</p>
          </div>
          <div className="p-2.5 bg-slate-100 text-slate-700 rounded-xl">
            <Hammer className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] text-rose-600 font-medium">ด่วนมาก (ยังไม่เสร็จ)</p>
            <p className="text-xl font-black text-rose-600 mt-0.5">{urgentCount}</p>
          </div>
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] text-amber-600 font-medium">รอการอนุมัติก่อนซ่อม</p>
            <p className="text-xl font-black text-amber-600 mt-0.5">{pendingApprovalCount}</p>
          </div>
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] text-blue-600 font-medium">กำลังดำเนินการซ่อม</p>
            <p className="text-xl font-black text-blue-600 mt-0.5">{inProgressCount}</p>
          </div>
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between col-span-2 sm:col-span-1">
          <div>
            <p className="text-[11px] text-emerald-600 font-medium">ซ่อมเสร็จสมบูรณ์</p>
            <p className="text-xl font-black text-emerald-600 mt-0.5">{completedCount}</p>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="ค้นหาเลขที่, รายการที่ซ่อม, ผู้แจ้ง..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white"
            />
          </div>

          {/* Department Filter (18 departments) */}
          <div>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
            >
              <option value="ทั้งหมด">แผนกที่แจ้ง: ทั้งหมด</option>
              {HOSPITAL_DEPARTMENTS.filter(d => d !== 'ทั้งหมด').map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Priority filter */}
          <div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
            >
              <option value="ทั้งหมด">ความเร่งด่วน: ทั้งหมด</option>
              <option value="urgent">ด่วนมาก (Urgent)</option>
              <option value="normal">งานปกติ (Normal)</option>
            </select>
          </div>

          {/* Status filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
            >
              <option value="ทั้งหมด">สถานะงานซ่อม: ทั้งหมด</option>
              <option value="pending">รอดำเนินการ</option>
              <option value="assigned">มอบหมายช่างแล้ว</option>
              <option value="in_progress">กำลังปฏิบัติงาน</option>
              <option value="waiting_parts">รออะไหล่</option>
              <option value="external">ส่งซ่อมภายนอก</option>
              <option value="testing">รอตรวจรับ</option>
              <option value="completed">เสร็จสมบูรณ์</option>
            </select>
          </div>

          {/* Approval filter */}
          <div>
            <select
              value={approvalFilter}
              onChange={(e) => setApprovalFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
            >
              <option value="ทั้งหมด">การอนุมัติ: ทั้งหมด</option>
              <option value="approved">อนุมัติแล้ว</option>
              <option value="pending_approval">รอการพิจารณา</option>
              <option value="rejected">ไม่อนุมัติ</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
          <span>พบรายการแจ้งซ่อมอื่นๆ ทั้งหมด {filteredOrders.length} รายการ</span>
          {(searchQuery || deptFilter !== 'ทั้งหมด' || priorityFilter !== 'ทั้งหมด' || statusFilter !== 'ทั้งหมด' || approvalFilter !== 'ทั้งหมด') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setDeptFilter('ทั้งหมด');
                setPriorityFilter('ทั้งหมด');
                setStatusFilter('ทั้งหมด');
                setApprovalFilter('ทั้งหมด');
              }}
              className="text-amber-600 hover:underline cursor-pointer"
            >
              ล้างตัวกรองทั้งหมด
            </button>
          )}
        </div>
      </div>

      {/* Orders List / Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {filteredOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">เลขที่ใบแจ้งซ่อม</th>
                  <th className="py-3 px-4">แผนกที่แจ้ง</th>
                  <th className="py-3 px-4">รายการที่ซ่อม (พิมพ์เอง)</th>
                  <th className="py-3 px-4">อาการชำรุด / ปัญหา</th>
                  <th className="py-3 px-4">ความเร่งด่วน</th>
                  <th className="py-3 px-4">การอนุมัติ</th>
                  <th className="py-3 px-4">สถานะงาน</th>
                  <th className="py-3 px-4">ผู้ส่งซ่อม / ช่าง</th>
                  <th className="py-3 px-4 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((order) => {
                  const isUrgent = order.priority === 'urgent' || order.priority === 'emergency';
                  const isApproved = order.approvalStatus === 'approved';
                  const isRejected = order.approvalStatus === 'rejected';
                  const hasImages = (order.images && order.images.length > 0) || !!order.photoUrl;

                  return (
                    <tr 
                      key={order.id} 
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isUrgent ? 'bg-rose-50/20' : ''
                      }`}
                    >
                      {/* Ticket Number */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-mono font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{order.orderNumber}</span>
                          {hasImages && (
                            <span title="มีไฟล์ภาพถ่ายแนบ" className="p-0.5 rounded bg-emerald-100 text-emerald-800">
                              <ImageIcon className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-[10px] text-slate-400 block">
                          กจ 003.308.1/
                        </span>
                      </td>

                      {/* Department */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {order.department}
                        </span>
                      </td>

                      {/* Custom Repair Item */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-bold text-slate-900 truncate">
                          {order.customItemName || order.assetName}
                        </div>
                        <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200/60 font-semibold inline-block mt-0.5">
                          งานซ่อมทั่วไป/อาคาร
                        </span>
                      </td>

                      {/* Symptom */}
                      <td className="py-3 px-4 max-w-xs truncate text-slate-600">
                        <span>{order.symptom}</span>
                        {order.errorDetails && (
                          <span className="text-[10px] text-slate-400 block truncate">
                            {order.errorDetails}
                          </span>
                        )}
                      </td>

                      {/* Priority */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                          isUrgent 
                            ? 'bg-rose-100 text-rose-800 border border-rose-300' 
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isUrgent ? 'bg-rose-600 animate-pulse' : 'bg-emerald-600'}`} />
                          {isUrgent ? 'ด่วนมาก' : 'งานปกติ'}
                        </span>
                      </td>

                      {/* Approval Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1 ${
                          isApproved 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                            : isRejected 
                            ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {isApproved ? '✓ อนุมัติแล้ว' : isRejected ? '✕ ไม่อนุมัติ' : 'รอการอนุมัติ'}
                        </span>
                      </td>

                      {/* Work Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          order.status === 'completed' ? 'bg-slate-100 text-slate-700' :
                          order.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'waiting_parts' ? 'bg-purple-100 text-purple-800' :
                          order.status === 'assigned' ? 'bg-teal-100 text-teal-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {order.status === 'completed' ? 'เสร็จสมบูรณ์' :
                           order.status === 'in_progress' ? 'กำลังซ่อม' :
                           order.status === 'waiting_parts' ? 'รออะไหล่' :
                           order.status === 'assigned' ? 'มอบหมายแล้ว' :
                           'รอดำเนินการ'}
                        </span>
                      </td>

                      {/* Reporter & Technician */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="text-slate-800 font-medium">
                          {order.reporterName}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          ช่าง: {order.assignedTechName || 'ยังไม่ระบุ'}
                        </div>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3 px-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Print Memo Button */}
                          <button
                            onClick={() => setSelectedOrderForPrint(order)}
                            title="พิมพ์บันทึกข้อความขออนุมัติซ่อมบำรุง (TH SarabunPSK 14pt)"
                            className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition cursor-pointer border border-slate-200"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Modal Button */}
                          {canEdit && (
                            <button
                              onClick={() => setEditingOrder(order)}
                              title="แก้ไขข้อมูล / บันทึกผลช่าง / พิจารณาอนุมัติ"
                              className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition cursor-pointer border border-slate-200"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Detail Modal Button */}
                          <button
                            onClick={() => setSelectedOrderForDetail(order)}
                            title="ดูรายละเอียดใบแจ้งซ่อม"
                            className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition cursor-pointer border border-slate-200"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Modal Button */}
                          {canEdit && (
                            <button
                              onClick={() => setDeleteTargetOrder(order)}
                              title="ลบใบแจ้งซ่อมนี้ออกจากระบบ"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer border border-slate-200"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400">
            <Hammer className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">ยังไม่มีรายการใบแจ้งซ่อมอื่นๆ ในระบบ</p>
            <p className="text-xs text-slate-400 mt-1">คลิกปุ่ม &quot;เปิดใบแจ้งซ่อมอื่นๆ ใหม่&quot; เพื่อสร้างรายการซ่อมอาคาร สถานที่ หรือระบบทั่วไป</p>
            {!isSupervisor && (
              <button
                onClick={onOpenNewOtherRepairModal}
                className="mt-4 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition shadow-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>เปิดใบแจ้งซ่อมอื่นๆ ใหม่</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedOrderForDetail && (
        <WorkOrderDetailModal
          order={selectedOrderForDetail}
          onClose={() => setSelectedOrderForDetail(null)}
          onPrint={(order) => {
            setSelectedOrderForDetail(null);
            setSelectedOrderForPrint(order);
          }}
        />
      )}

      {/* Edit Modal */}
      {editingOrder && (
        <EditWorkOrderModal
          order={editingOrder}
          onClose={() => setEditingOrder(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteTargetOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-rose-200">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">ยืนยันการลบใบแจ้งซ่อมอื่นๆ</h3>
                <p className="text-xs text-slate-500 font-mono">{deleteTargetOrder.orderNumber}</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 mb-4">
              คุณแน่ใจหรือไม่ว่าต้องการลบใบแจ้งซ่อม <strong className="text-slate-900 font-semibold">{deleteTargetOrder.orderNumber}</strong> ({deleteTargetOrder.customItemName || deleteTargetOrder.assetName}) ออกจากระบบและ Firebase Firestore อย่างถาวร?
            </p>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteTargetOrder(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={async () => {
                  setIsDeleting(true);
                  try {
                    await deleteWorkOrder(deleteTargetOrder.id);
                    setDeleteTargetOrder(null);
                  } finally {
                    setIsDeleting(false);
                  }
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>กำลังลบ...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>ยืนยันลบใบแจ้งซ่อม</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
