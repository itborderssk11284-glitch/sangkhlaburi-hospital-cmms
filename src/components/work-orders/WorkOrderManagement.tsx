import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Printer, 
  Wrench, 
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

export const WorkOrderManagement: React.FC<{
  onOpenNewRepairModal: () => void;
}> = ({ onOpenNewRepairModal }) => {
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

  // Filter
  const filteredOrders = workOrders.filter((order) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = 
      !q ||
      order.orderNumber.toLowerCase().includes(q) ||
      (order.documentNo && order.documentNo.toLowerCase().includes(q)) ||
      order.assetCode.toLowerCase().includes(q) ||
      order.assetName.toLowerCase().includes(q) ||
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

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">
              ระบบจัดการใบแจ้งซ่อมและติดตามสถานะ (Work Order Management)
            </h2>
            {firebaseConnected && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Firebase Real-time Cloud {lastSyncedTime ? `(${lastSyncedTime})` : ''}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            แบบฟอร์มบันทึกข้อความขออนุมัติซ่อมบำรุงพัสดุ-ครุภัณฑ์ แนบไฟล์ภาพถ่าย และระบบอนุมัติก่อนซ่อม
          </p>
        </div>

        {!isSupervisor && (
          <button
            onClick={onOpenNewRepairModal}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition shadow-xs cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>เปิดใบแจ้งซ่อมใหม่ (ขออนุมัติ)</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="ค้นหาเลขที่, รหัส, ชื่อเครื่อง, ผู้แจ้ง..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
            />
          </div>

          {/* Status selector */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
            >
              <option value="ทั้งหมด">สถานะงานซ่อมทั้งหมด</option>
              <option value="pending">รอดำเนินการ (Pending)</option>
              <option value="assigned">มอบหมายแล้ว (Assigned)</option>
              <option value="in_progress">กำลังซ่อม (In Progress)</option>
              <option value="waiting_parts">รออะไหล่ (Awaiting Parts)</option>
              <option value="external">ส่งศูนย์บริการนอก (External)</option>
              <option value="testing">รอตรวจรับ (Testing)</option>
              <option value="completed">ซ่อมสำเร็จ (Completed)</option>
            </select>
          </div>

          {/* Priority selector: STRICTLY 2 OPTIONS: ด่วนมาก vs งานปกติ */}
          <div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 font-medium"
            >
              <option value="ทั้งหมด">ความเร่งด่วนทั้งหมด</option>
              <option value="urgent">ด่วนมาก (High Priority)</option>
              <option value="normal">งานปกติ (Routine Priority)</option>
            </select>
          </div>

          {/* Approval filter */}
          <div>
            <select
              value={approvalFilter}
              onChange={(e) => setApprovalFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 font-medium"
            >
              <option value="ทั้งหมด">การอนุมัติก่อนซ่อมทั้งหมด</option>
              <option value="pending_approval">⏳ รออนุมัติก่อนซ่อม</option>
              <option value="approved">✅ อนุมัติแล้ว</option>
              <option value="rejected">❌ ไม่อนุมัติ</option>
            </select>
          </div>

          {/* Department selector */}
          <div>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
            >
              <option value="ทั้งหมด">ทุกแผนก</option>
              {HOSPITAL_DEPARTMENTS.filter(d => d !== 'ทั้งหมด').map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>พบใบแจ้งซ่อม: <strong>{filteredOrders.length}</strong> รายการ</span>
          {(searchQuery || statusFilter !== 'ทั้งหมด' || priorityFilter !== 'ทั้งหมด' || deptFilter !== 'ทั้งหมด' || approvalFilter !== 'ทั้งหมด') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('ทั้งหมด');
                setPriorityFilter('ทั้งหมด');
                setApprovalFilter('ทั้งหมด');
                setDeptFilter('ทั้งหมด');
              }}
              className="text-emerald-700 hover:text-emerald-900 font-semibold cursor-pointer"
            >
              ล้างตัวกรอง
            </button>
          )}
        </div>
      </div>

      {/* Orders List Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-3.5">เลขที่ / บันทึกข้อความ</th>
                <th className="py-3 px-3.5">รหัส / ครุภัณฑ์</th>
                <th className="py-3 px-3.5">แผนกผู้แจ้ง</th>
                <th className="py-3 px-3.5">อาการชำรุด</th>
                <th className="py-3 px-3.5 text-center">ความเร่งด่วน</th>
                <th className="py-3 px-3.5 text-center">อนุมัติก่อนซ่อม</th>
                <th className="py-3 px-3.5 text-center">สถานะงาน</th>
                <th className="py-3 px-3.5">ช่างผู้รับผิดชอบ</th>
                <th className="py-3 px-3.5 text-right">ดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    ไม่พบรายการใบแจ้งซ่อมตามเงื่อนไข
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const isUrgent = order.priority === 'urgent' || order.priority === 'emergency';
                  const isApproved = order.approvalStatus === 'approved';
                  const isRejected = order.approvalStatus === 'rejected';
                  const imagesCount = (order.images?.length || (order.photoUrl ? 1 : 0));

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-3.5">
                        <div className="font-mono font-bold text-slate-900">{order.orderNumber}</div>
                        <div className="text-[10px] text-emerald-800 font-mono truncate max-w-[130px]" title={order.documentNo}>
                          {order.documentNo || 'กจ ๐๐๓.๓๐๘.๑/...'}
                        </div>
                        <div className="text-[10px] text-slate-400">{order.reportDate}</div>
                      </td>

                      <td className="py-3 px-3.5 max-w-[190px]">
                        <div className="font-semibold text-slate-900 truncate" title={order.assetName}>
                          {order.assetName}
                        </div>
                        <div className="text-[11px] font-mono text-slate-600">{order.assetCode}</div>
                        {order.model && (
                          <div className="text-[10px] text-slate-400 truncate">รุ่น: {order.model}</div>
                        )}
                      </td>

                      <td className="py-3 px-3.5 text-slate-700">
                        <div className="font-medium">{order.department.split(' ')[0]}</div>
                        <div className="text-[11px] text-slate-400">{order.reporterName.split(' ')[0]}</div>
                      </td>

                      <td className="py-3 px-3.5 max-w-[200px]">
                        <div className="text-slate-800 line-clamp-2" title={order.symptom}>
                          {order.symptom}
                        </div>
                        {imagesCount > 0 && (
                          <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-semibold mt-0.5">
                            <ImageIcon className="w-3 h-3" />
                            <span>แนบ {imagesCount} ภาพ</span>
                          </div>
                        )}
                      </td>

                      {/* Priority: STRICTLY 2 options */}
                      <td className="py-3 px-3.5 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isUrgent ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {isUrgent ? '● ด่วนมาก' : '● งานปกติ'}
                        </span>
                      </td>

                      {/* Approval Status */}
                      <td className="py-3 px-3.5 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          isApproved ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                          isRejected ? 'bg-rose-50 text-rose-800 border border-rose-200' :
                          'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}>
                          {isApproved ? '✓ อนุมัติแล้ว' :
                           isRejected ? '✕ ไม่อนุมัติ' : '⏳ รออนุมัติ'}
                        </span>
                      </td>

                      {/* Repair Status */}
                      <td className="py-3 px-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          order.status === 'completed' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                          order.status === 'in_progress' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                          order.status === 'waiting_parts' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                          order.status === 'external' ? 'bg-purple-50 text-purple-800 border border-purple-200' :
                          'bg-slate-100 text-slate-800 border border-slate-200'
                        }`}>
                          {order.status === 'completed' ? 'ซ่อมสำเร็จ' :
                           order.status === 'in_progress' ? 'กำลังซ่อม' :
                           order.status === 'waiting_parts' ? 'รออะไหล่' :
                           order.status === 'external' ? 'ส่งศูนย์นอก' :
                           order.status === 'assigned' ? 'มอบหมายแล้ว' : 'รอดำเนินการ'}
                        </span>
                      </td>

                      <td className="py-3 px-3.5 text-slate-700">
                        {order.assignedTechName ? (
                          <span className="font-medium">{order.assignedTechName.split(' ')[0]}</span>
                        ) : (
                          <span className="text-slate-400 italic">ยังไม่มอบหมาย</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {canEdit && (
                            <button
                              onClick={() => setEditingOrder(order)}
                              title="แก้ไขแบบฟอร์มใบแจ้งซ่อม"
                              className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded transition cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedOrderForDetail(order)}
                            title={canEdit ? 'ตรวจดูรายละเอียดและบันทึกความคืบหน้า' : 'ดูรายละเอียดใบแจ้งซ่อม'}
                            className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded transition cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setSelectedOrderForPrint(order)}
                            title="พิมพ์บันทึกข้อความราชการ"
                            className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded transition cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          {canEdit && (
                            <button
                              onClick={() => setDeleteTargetOrder(order)}
                              title="ลบใบแจ้งซ่อมนี้ออกจากระบบ"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
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

      {/* Editing Modal */}
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
                <h3 className="font-bold text-slate-900 text-base">ยืนยันการลบใบแจ้งซ่อม</h3>
                <p className="text-xs text-slate-500 font-mono">{deleteTargetOrder.orderNumber}</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 mb-4">
              คุณแน่ใจหรือไม่ว่าต้องการลบใบแจ้งซ่อม <strong className="text-slate-900 font-semibold">{deleteTargetOrder.orderNumber}</strong> ({deleteTargetOrder.assetName}) ออกจากระบบและ Firebase Firestore อย่างถาวร?
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
