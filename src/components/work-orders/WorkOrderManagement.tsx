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
  FileText
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { WorkOrder, WorkOrderStatus, PriorityLevel } from '../../types';
import { HOSPITAL_DEPARTMENTS } from '../../data/mockData';
import { WorkOrderDetailModal } from './WorkOrderDetailModal';

export const WorkOrderManagement: React.FC<{
  onOpenNewRepairModal: () => void;
}> = ({ onOpenNewRepairModal }) => {
  const { 
    workOrders, 
    selectedOrderForDetail, 
    setSelectedOrderForDetail, 
    setSelectedOrderForPrint,
    updateWorkOrderStatus,
    firebaseConnected,
    lastSyncedTime
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ทั้งหมด');
  const [priorityFilter, setPriorityFilter] = useState<string>('ทั้งหมด');
  const [deptFilter, setDeptFilter] = useState('ทั้งหมด');

  // Filter
  const filteredOrders = workOrders.filter((order) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = 
      !q ||
      order.orderNumber.toLowerCase().includes(q) ||
      order.assetCode.toLowerCase().includes(q) ||
      order.assetName.toLowerCase().includes(q) ||
      order.reporterName.toLowerCase().includes(q) ||
      order.symptom.toLowerCase().includes(q) ||
      (order.assignedTechName && order.assignedTechName.toLowerCase().includes(q));

    const matchesStatus = statusFilter === 'ทั้งหมด' || order.status === statusFilter;
    const matchesPriority = priorityFilter === 'ทั้งหมด' || order.priority === priorityFilter;
    const matchesDept = deptFilter === 'ทั้งหมด' || order.department.includes(deptFilter);

    return matchesSearch && matchesStatus && matchesPriority && matchesDept;
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
            ติดตามขั้นตอนการซ่อมบำรุง บันทึกการวิเคราะห์ปัญหา เบิกใช้อะไหล่ และพิมพ์ใบส่งซ่อมมาตรฐาน
          </p>
        </div>

        <button
          onClick={onOpenNewRepairModal}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>เปิดใบแจ้งซ่อมใหม่</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="ค้นหาเลขที่ใบแจ้ง, ชื่อเครื่อง, รหัส, ผู้แจ้ง..."
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

          {/* Priority selector */}
          <div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
            >
              <option value="ทั้งหมด">ความเร่งด่วนทั้งหมด</option>
              <option value="emergency">ฉุกเฉินวิกฤต (Emergency)</option>
              <option value="urgent">เร่งด่วนมาก (Urgent)</option>
              <option value="normal">ปกติ (Normal)</option>
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
          {(searchQuery || statusFilter !== 'ทั้งหมด' || priorityFilter !== 'ทั้งหมด' || deptFilter !== 'ทั้งหมด') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('ทั้งหมด');
                setPriorityFilter('ทั้งหมด');
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
                <th className="py-3 px-4">เลขที่ใบแจ้ง / วันที่</th>
                <th className="py-3 px-4">รหัส / ครุภัณฑ์</th>
                <th className="py-3 px-4">แผนกผู้แจ้ง</th>
                <th className="py-3 px-4">อาการเสีย / ปัญหา</th>
                <th className="py-3 px-4">ความเร่งด่วน</th>
                <th className="py-3 px-4">สถานะงาน</th>
                <th className="py-3 px-4">ช่างผู้รับผิดชอบ</th>
                <th className="py-3 px-4 text-right">ดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    ไม่พบรายการใบแจ้งซ่อมตามเงื่อนไข
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-slate-900">{order.orderNumber}</div>
                      <div className="text-[11px] text-slate-400">{order.reportDate}</div>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-semibold text-slate-900 truncate" title={order.assetName}>
                        {order.assetName}
                      </div>
                      <div className="text-[11px] font-mono text-emerald-800">{order.assetCode}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      <div className="font-medium">{order.department.split(' ')[0]}</div>
                      <div className="text-[11px] text-slate-400">{order.reporterName.split(' ')[0]}</div>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="text-slate-800 line-clamp-2" title={order.symptom}>
                        {order.symptom}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[11px] font-bold ${
                        order.priority === 'emergency' ? 'text-rose-600' :
                        order.priority === 'urgent' ? 'text-amber-600' : 'text-slate-600'
                      }`}>
                        {order.priority === 'emergency' ? '● ฉุกเฉินวิกฤต' :
                         order.priority === 'urgent' ? '● เร่งด่วนมาก' : '● ปกติ'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
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
                    <td className="py-3 px-4 text-slate-700">
                      {order.assignedTechName ? (
                        <span className="font-medium">{order.assignedTechName.split(' ')[0]}</span>
                      ) : (
                        <span className="text-slate-400 italic">ยังไม่มอบหมาย</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedOrderForDetail(order)}
                          title="จัดการและบันทึกผลการซ่อม"
                          className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded transition cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setSelectedOrderForPrint(order)}
                          title="พิมพ์ใบสั่งซ่อมและรายงานผล"
                          className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded transition cursor-pointer"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
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
    </div>
  );
};
