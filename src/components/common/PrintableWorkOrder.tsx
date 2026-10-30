import React from 'react';
import { Printer, X, CheckCircle, ShieldAlert } from 'lucide-react';
import { WorkOrder, Asset } from '../../types';
import { QRCodeView } from './QRCodeView';

export const PrintableWorkOrder: React.FC<{
  order: WorkOrder;
  asset?: Asset;
  onClose: () => void;
}> = ({ order, asset, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full my-auto overflow-hidden border border-slate-200">
        {/* Modal Action Bar (hidden on print) */}
        <div className="bg-slate-800 text-white px-6 py-3 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-emerald-400" />
            <span className="font-semibold text-sm">แบบฟอร์มใบสั่งซ่อมและรายงานผลการซ่อมบำรุง (เอกสารราชการ)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-sm font-medium transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์เอกสาร (Print / PDF)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-8 sm:p-12 text-slate-900 bg-white" id="printable-order-sheet">
          {/* Official Letterhead */}
          <div className="border-b-2 border-emerald-900 pb-4 mb-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <img
                  src="/assets/aistudio/Logo_SK_-_______26693d5e.png"
                  alt="Logo"
                  className="w-20 h-20 object-contain"
                />
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-emerald-950">
                    โรงพยาบาลสังขละบุรี
                  </h2>
                  <p className="text-xs text-slate-600">
                    สังกัดสำนักงานสาธารณสุขจังหวัดกาญจนบุรี กระทรวงสาธารณสุข
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    เลขที่ 1 หมู่ 3 ต.หนองลู อ.สังขละบุรี จ.กาญจนบุรี 71240 โทร. 034-595-021
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className="inline-block border border-slate-300 rounded p-2 text-center bg-slate-50">
                  <QRCodeView value={`SKH-WO:${order.orderNumber}`} size={64} />
                  <span className="text-[10px] text-slate-500 font-mono block mt-1">{order.orderNumber}</span>
                </div>
              </div>
            </div>

            <div className="text-center mt-3">
              <h3 className="text-base font-bold text-slate-800 uppercase tracking-wide">
                ใบแจ้งซ่อมและรายงานผลการซ่อมบำรุงครุภัณฑ์ (Work Order Report)
              </h3>
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs mb-6">
            <div>
              <span className="text-slate-500 block">เลขที่ใบแจ้งซ่อม:</span>
              <span className="font-bold text-sm text-slate-900 font-mono">{order.orderNumber}</span>
            </div>
            <div>
              <span className="text-slate-500 block">วันที่แจ้งซ่อม:</span>
              <span className="font-semibold text-slate-800">{order.reportDate}</span>
            </div>
            <div>
              <span className="text-slate-500 block">ระดับความเร่งด่วน:</span>
              <span className={`font-bold ${
                order.priority === 'emergency' ? 'text-rose-600' :
                order.priority === 'urgent' ? 'text-amber-600' : 'text-slate-700'
              }`}>
                {order.priority === 'emergency' ? 'ฉุกเฉินระดับวิกฤต (Life Support)' :
                 order.priority === 'urgent' ? 'เร่งด่วนมาก (High Priority)' : 'ปกติ (Routine)'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">สถานะปัจจุบัน:</span>
              <span className="font-bold text-emerald-800">
                {order.status === 'completed' ? 'ซ่อมเสร็จสมบูรณ์ / ตรวจรับแล้ว' :
                 order.status === 'in_progress' ? 'กำลังดำเนินการซ่อม' :
                 order.status === 'waiting_parts' ? 'รออะไหล่' :
                 order.status === 'external' ? 'ส่งซ่อมศูนย์ภายนอก' : 'รอดำเนินการ'}
              </span>
            </div>
          </div>

          {/* Section 1: Equipment & Reporter Info */}
          <div className="mb-6">
            <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider border-b border-emerald-800 pb-1 mb-2">
              1. ข้อมูลครุภัณฑ์และหน่วยงานผู้แจ้งซ่อม
            </h4>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
              <div>
                <span className="text-slate-500">รหัสครุภัณฑ์ (Asset No.): </span>
                <span className="font-semibold font-mono text-slate-900">{order.assetCode}</span>
              </div>
              <div>
                <span className="text-slate-500">หมายเลขซีเรียล (S/N): </span>
                <span className="font-semibold font-mono text-slate-800">{asset?.serialNumber || '-'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500">ชื่อครุภัณฑ์: </span>
                <span className="font-bold text-slate-900">{order.assetName}</span>
              </div>
              <div>
                <span className="text-slate-500">ยี่ห้อ / รุ่น: </span>
                <span className="font-semibold text-slate-800">{asset ? `${asset.brand} / ${asset.model}` : '-'}</span>
              </div>
              <div>
                <span className="text-slate-500">แผนก / ที่ตั้งเครื่อง: </span>
                <span className="font-semibold text-slate-800">{order.department} {asset?.locationDetail ? `(${asset.locationDetail})` : ''}</span>
              </div>
              <div>
                <span className="text-slate-500">ชื่อผู้แจ้งซ่อม: </span>
                <span className="font-semibold text-slate-800">{order.reporterName}</span>
              </div>
              <div>
                <span className="text-slate-500">เบอร์โทรศัพท์ / ต่อภายใน: </span>
                <span className="font-semibold text-slate-800">{order.reporterPhone}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Fault Symptom */}
          <div className="mb-6">
            <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider border-b border-emerald-800 pb-1 mb-2">
              2. อาการขัดข้อง / ปัญหาที่ตรวจพบ (Failure Symptom)
            </h4>
            <div className="bg-slate-50 border border-slate-200 rounded p-3 text-xs leading-relaxed text-slate-800">
              <p className="font-medium text-slate-900 mb-1">{order.symptom}</p>
              {order.errorDetails && (
                <p className="text-slate-600 mt-1 italic">
                  <strong>รายละเอียดเพิ่มเติม:</strong> {order.errorDetails}
                </p>
              )}
            </div>
          </div>

          {/* Section 3: Diagnosis & Action Taken */}
          <div className="mb-6">
            <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider border-b border-emerald-800 pb-1 mb-2">
              3. ผลการตรวจวิเคราะห์และการดำเนินการซ่อม (Action Taken)
            </h4>
            <div className="space-y-2 text-xs">
              <div>
                <span className="font-semibold text-slate-700">สาเหตุของปัญหา (Root Cause): </span>
                <span className="text-slate-800">{order.rootCause || 'ตรวจเช็คตามขั้นตอนมาตรฐาน'}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-700">การดำเนินการแก้ไข (Action Taken): </span>
                <span className="text-slate-800">{order.actionTaken || 'อยู่ระหว่างการดำเนินการตรวจซ่อม'}</span>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div>
                  <span className="text-slate-500">วันที่เริ่มดำเนินการ: </span>
                  <span className="font-semibold text-slate-800">{order.repairStartDate || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500">วันที่แล้วเสร็จ: </span>
                  <span className="font-semibold text-slate-800">{order.repairEndDate || '-'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Parts Consumed Table */}
          <div className="mb-6">
            <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider border-b border-emerald-800 pb-1 mb-2">
              4. รายการอะไหล่และอุปกรณ์ที่ใช้ (Spare Parts Consumed)
            </h4>
            <table className="w-full text-xs border border-slate-200 rounded">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-1.5 px-3 text-left">ลำดับ</th>
                  <th className="py-1.5 px-3 text-left">รหัสอะไหล่</th>
                  <th className="py-1.5 px-3 text-left">รายการอะไหล่ / ชิ้นส่วน</th>
                  <th className="py-1.5 px-3 text-center">จำนวน</th>
                  <th className="py-1.5 px-3 text-right">ราคาต่อหน่วย (บาท)</th>
                  <th className="py-1.5 px-3 text-right">รวมเป็นเงิน (บาท)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {order.usedParts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-3 text-center text-slate-400">
                      - ไม่มีการเบิกใช้อะไหล่ (ซ่อมปรับแต่ง/ตั้งค่าระบบ) -
                    </td>
                  </tr>
                ) : (
                  order.usedParts.map((part, idx) => (
                    <tr key={part.partId}>
                      <td className="py-1.5 px-3 text-center text-slate-500">{idx + 1}</td>
                      <td className="py-1.5 px-3 font-mono text-slate-700">{part.partCode}</td>
                      <td className="py-1.5 px-3 font-medium text-slate-900">{part.partName}</td>
                      <td className="py-1.5 px-3 text-center">{part.quantity}</td>
                      <td className="py-1.5 px-3 text-right">{part.unitPrice.toLocaleString()}</td>
                      <td className="py-1.5 px-3 text-right font-medium">{part.totalPrice.toLocaleString()}</td>
                    </tr>
                  ))
                )}
                {order.externalCost ? (
                  <tr>
                    <td colSpan={5} className="py-1.5 px-3 text-right font-medium text-slate-700">
                      ค่าบริการ/ส่งซ่อมศูนย์ภายนอก ({order.externalVendorName}):
                    </td>
                    <td className="py-1.5 px-3 text-right font-medium">{order.externalCost.toLocaleString()}</td>
                  </tr>
                ) : null}
                <tr className="bg-slate-50 font-bold border-t border-slate-300">
                  <td colSpan={5} className="py-2 px-3 text-right text-slate-900">
                    รวมมูลค่าค่าใช้จ่ายซ่อมบำรุงทั้งสิ้น:
                  </td>
                  <td className="py-2 px-3 text-right text-emerald-900 text-sm">
                    {order.totalCost.toLocaleString()} บาท
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 5: Three-Party Signatures */}
          <div className="pt-4 border-t border-slate-300">
            <div className="grid grid-cols-3 gap-6 text-center text-xs">
              <div className="flex flex-col items-center">
                <div className="h-14 border-b border-slate-400 w-44 flex items-end justify-center pb-1">
                  <span className="text-[11px] font-serif text-slate-600 italic">
                    {order.assignedTechName ? order.assignedTechName : '.........................................'}
                  </span>
                </div>
                <span className="font-semibold text-slate-800 mt-2">
                  ({order.assignedTechName || '...................................................'})
                </span>
                <span className="text-[11px] text-slate-500">ช่าง / วิศวกรผู้ดำเนินการซ่อม</span>
                <span className="text-[11px] text-slate-400 mt-1">วันที่ {order.repairEndDate || '....../....../......'}</span>
              </div>

              <div className="flex flex-col items-center">
                <div className="h-14 border-b border-slate-400 w-44 flex items-end justify-center pb-1">
                  <span className="text-[11px] font-serif text-slate-600 italic">นายอนุรักษ์ วงศ์สว่าง</span>
                </div>
                <span className="font-semibold text-slate-800 mt-2">(นายอนุรักษ์ วงศ์สว่าง)</span>
                <span className="text-[11px] text-slate-500">หัวหน้างานซ่อมบำรุงวิศวกรรมการแพทย์</span>
                <span className="text-[11px] text-slate-400 mt-1">วันที่ {order.repairEndDate || '....../....../......'}</span>
              </div>

              <div className="flex flex-col items-center">
                <div className="h-14 border-b border-slate-400 w-44 flex items-end justify-center pb-1">
                  <span className="text-[11px] font-serif text-slate-600 italic">
                    {order.inspectorName || order.reporterName}
                  </span>
                </div>
                <span className="font-semibold text-slate-800 mt-2">
                  ({order.inspectorName || order.reporterName || '...................................................'})
                </span>
                <span className="text-[11px] text-slate-500">ผู้ตรวจรับงาน / หัวหน้าแผนกผู้ใช้</span>
                <span className="text-[11px] text-slate-400 mt-1">วันที่ {order.inspectionDate || '....../....../......'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
