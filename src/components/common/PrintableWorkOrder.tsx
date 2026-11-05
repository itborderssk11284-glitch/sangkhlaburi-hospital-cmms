import React from 'react';
import { Printer, X, Image as ImageIcon } from 'lucide-react';
import { WorkOrder, Asset } from '../../types';
import { useApp } from '../../context/AppContext';

export const PrintableWorkOrder: React.FC<{
  order: WorkOrder;
  asset?: Asset;
  onClose: () => void;
}> = ({ order, asset, onClose }) => {
  const { currentUser } = useApp();

  const handlePrint = () => {
    window.print();
  };

  const images = order.images || (order.photoUrl ? [order.photoUrl] : []);

  // Determine checkbox states for maintenance assessment
  const assessment = order.repairTypeAssessment || 'internal_free';
  const isApproved = order.approvalStatus === 'approved';
  const isRejected = order.approvalStatus === 'rejected';

  // Strictly "กจ ๐๐๓.๓๐๘.๑/" without appended numbers as requested
  const docNo = 'กจ ๐๐๓.๓๐๘.๑/';

  // ผู้ส่งซ่อม ให้ขึ้นชื่อตามที่ Login
  const reporterDisplayName = currentUser?.fullName || order.reporterName || '........................................................';
  const reporterDisplayPhone = currentUser?.phone || order.reporterPhone || '';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      {/* Print Style Injections for A4 & TH SarabunPSK 16pt */}
      <style>{`
        @font-face {
          font-family: 'TH SarabunPSK';
          font-style: normal;
          font-weight: 400;
          font-display: swap;
          src: local('TH SarabunPSK'), local('THSarabunPSK'), local('TH Sarabun New'), local('THSarabunNew'),
               url('https://cdn.jsdelivr.net/gh/munichPMN/ThaiGovStdFonts@master/font/woff2/TH_Sarabun-Regular.woff2') format('woff2');
        }
        @font-face {
          font-family: 'TH SarabunPSK';
          font-style: normal;
          font-weight: 700;
          font-display: swap;
          src: local('TH SarabunPSK Bold'), local('THSarabunPSK-Bold'), local('TH Sarabun New Bold'), local('THSarabunNew-Bold'),
               url('https://cdn.jsdelivr.net/gh/munichPMN/ThaiGovStdFonts@master/font/woff2/TH_Sarabun-Bold.woff2') format('woff2');
        }

        .sarabun-memo, .sarabun-memo * {
          font-family: 'TH SarabunPSK', 'TH Sarabun', 'TH SarabunNew', 'Sarabun', sans-serif !important;
          font-size: 16pt !important;
          line-height: 1.25 !important;
          color: #000000 !important;
        }
        .sarabun-memo strong, .sarabun-memo b, .sarabun-memo .font-bold {
          font-weight: 700 !important;
        }
        .sarabun-memo .memo-title {
          font-size: 24pt !important;
          font-weight: 700 !important;
          line-height: 1.15 !important;
        }
        
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 15mm 10mm 15mm;
          }
          body {
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          #printable-order-sheet {
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          .page-break {
            page-break-before: always;
          }
        }
      `}</style>

      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full my-auto overflow-hidden border border-slate-200">
        
        {/* Modal Action Bar (hidden on print) */}
        <div className="bg-slate-900 text-white px-6 py-3 flex items-center justify-between no-print border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-emerald-400" />
            <div>
              <span className="font-semibold text-sm">แบบฟอร์มบันทึกข้อความ ขออนุมัติซ่อมบำรุงพัสดุ-ครุภัณฑ์ (TH SarabunPSK ขนาด 16)</span>
              <span className="text-xs text-slate-400 ml-2">ผู้ส่งซ่อม: {reporterDisplayName}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-sm font-medium transition cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์เอกสารราชการ (Print / PDF)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Government Memorandum Sheet */}
        <div 
          className="p-8 sm:p-12 text-slate-900 bg-white leading-tight font-sans sarabun-memo" 
          id="printable-order-sheet"
        >
          {/* Header: Centered Memorandum Title Without Any Image Above */}
          <div className="text-center pb-2 mb-2">
            <h1 className="memo-title font-bold text-slate-950 tracking-normal text-center">
              บันทึกข้อความ
            </h1>
          </div>

          {/* Memo Metadata Lines */}
          <div className="space-y-1 border-b-2 border-slate-900 pb-2 mb-2">
            <div className="flex flex-wrap items-baseline gap-1.5">
              <span className="font-bold">ส่วนราชการ:</span>
              <span className="flex-1 border-b border-dotted border-slate-500 pb-0.5">
                โรงพยาบาลสังขละบุรี ฝ่ายบริหารทั่วไป โทร. ๐๓๔-๕๙๕๐๓๐ ต่อ ๒๐๕
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-baseline gap-1.5">
                <span className="font-bold">ที่:</span>
                <span className="flex-1 border-b border-dotted border-slate-500 pb-0.5 font-mono">
                  {docNo}............................................................
                </span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-bold">วันที่:</span>
                <span className="flex-1 border-b border-dotted border-slate-500 pb-0.5">
                  {order.reportDate}
                </span>
              </div>
            </div>

            <div className="flex items-baseline gap-1.5">
              <span className="font-bold">เรื่อง:</span>
              <span className="flex-1 font-semibold border-b border-dotted border-slate-500 pb-0.5">
                ขออนุมัติซ่อมบำรุงพัสดุ-ครุภัณฑ์
              </span>
            </div>

            <div className="flex items-baseline gap-1.5 pt-0.5">
              <span className="font-bold">เรียน:</span>
              <span>ผู้อำนวยการโรงพยาบาลสังขละบุรี</span>
            </div>
          </div>

          {/* Body Section 1: Equipment and Symptom */}
          <div className="space-y-1.5 mb-2.5">
            <p className="indent-8 text-justify leading-snug">
              ด้วย {order.department ? <span className="font-bold">{order.department}</span> : '...................................................'} มีความประสงค์ขอส่งซ่อมบำรุงพัสดุ/ครุภัณฑ์ จำนวน ๑ รายการ ดังนี้
            </p>

            <div className="pl-6 space-y-1 border-l-2 border-emerald-900/40 ml-2">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="font-bold">๑. เครื่อง / ยี่ห้อ:</span>
                <span className="font-semibold text-slate-900 underline decoration-slate-400 underline-offset-4">
                  {order.brand ? `${order.brand} ` : ''}{order.assetName}
                </span>
                <span className="font-bold ml-2">รุ่น:</span>
                <span className="font-semibold text-slate-900 underline decoration-slate-400 underline-offset-4">
                  {order.model || asset?.model || '-'}
                </span>
              </div>

              <div className="flex flex-wrap items-baseline gap-2">
                <span className="font-bold">อาการชำรุด:</span>
                <span className="flex-1 text-slate-900 font-medium bg-amber-50/50 px-2 py-0.5 rounded border border-amber-200/60">
                  {order.symptom} {order.errorDetails ? `(${order.errorDetails})` : ''}
                </span>
              </div>

              <div className="flex flex-wrap items-baseline gap-2">
                <span className="font-bold">หมายเลขครุภัณฑ์:</span>
                <span className="font-mono font-bold text-slate-900 px-2 py-0.2 bg-slate-100 rounded">
                  {order.assetCode}
                </span>
                {asset?.serialNumber && (
                  <>
                    <span className="font-bold ml-2">S/N:</span>
                    <span className="font-mono text-slate-800">{asset.serialNumber}</span>
                  </>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-bold">บริษัท:</span>
                  <span className="flex-1 border-b border-dotted border-slate-400">
                    {order.vendor || asset?.vendor || '-'}
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-bold">โทรศัพท์:</span>
                  <span className="flex-1 border-b border-dotted border-slate-400 font-mono">
                    {order.vendorPhone || asset?.vendorPhone || '-'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-0.5">
                <span className="font-bold">ระดับความเร่งด่วน:</span>
                <span className={`px-2 py-0.2 rounded font-bold text-sm ${
                  order.priority === 'urgent' || order.priority === 'emergency' 
                    ? 'bg-rose-100 text-rose-900 border border-rose-300' 
                    : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                }`}>
                  {order.priority === 'urgent' || order.priority === 'emergency' ? '● ด่วนมาก' : '● งานปกติ'}
                </span>
              </div>
            </div>

            {/* Reporter Signature (ขึ้นชื่อตามที่ login) */}
            <div className="flex justify-end pt-0.5">
              <div className="text-center w-64">
                <div className="h-8 border-b border-dotted border-slate-500 flex items-end justify-center pb-0.5">
                  <span className="italic font-serif text-slate-700">{reporterDisplayName}</span>
                </div>
                <div className="mt-0.5 font-bold text-slate-900">
                  ({reporterDisplayName})
                </div>
                <div className="text-slate-700 text-sm">ผู้ส่งซ่อม</div>
                <div className="text-slate-500 text-xs font-mono">
                  {reporterDisplayPhone ? `โทร. ${reporterDisplayPhone}` : ''}
                </div>
              </div>
            </div>
          </div>

          {/* Body Section 2: Maintenance Section Assessment (บันทึกหน่วยงานซ่อมบำรุง) */}
          <div className="border border-slate-400 rounded-lg p-2.5 mb-2 bg-slate-50/50">
            <h3 className="font-bold text-slate-900 mb-1 border-b border-slate-300 pb-0.5 flex items-center justify-between">
              <span>บันทึกหน่วยงานซ่อมบำรุง / ฝ่ายบริหารทั่วไป</span>
              <span className="text-xs text-slate-500 font-normal">เรียน ผู้อำนวยการโรงพยาบาลสังขละบุรี</span>
            </h3>
            
            <p className="mb-1">ได้ตรวจสอบสภาพเครื่องดังกล่าวแล้ว เห็นสมควร:</p>

            <div className="space-y-1 pl-3">
              {/* Option 1: ซ่อมได้เอง ไม่เสียค่าใช้จ่าย */}
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold">
                  {assessment === 'internal_free' ? '[✓]' : '[  ]'}
                </span>
                <span>
                  ซ่อมได้เองโดยช่างของโรงพยาบาล ชื่อ{' '}
                  <span className="font-semibold underline decoration-slate-400">
                    {order.assignedTechName || '...................................................'}
                  </span>{' '}
                  <strong>ไม่เสียค่าใช้จ่าย</strong>
                </span>
              </div>

              {/* Option 2: ซ่อมได้เอง โดยเสียค่าวัสดุ */}
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold">
                  {assessment === 'internal_with_materials' ? '[✓]' : '[  ]'}
                </span>
                <span>
                  ซ่อมได้เองโดยช่างของโรงพยาบาล ชื่อ{' '}
                  <span className="font-semibold underline decoration-slate-400">
                    {order.assignedTechName || '...................................................'}
                  </span>{' '}
                  <strong>โดยเสียค่าวัสดุเพิ่มเติม</strong>
                </span>
              </div>

              {/* Option 3: ส่งซ่อมกองช่างบำรุง */}
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold">
                  {assessment === 'division_repair' ? '[✓]' : '[  ]'}
                </span>
                <span>ส่งซ่อมกองช่างบำรุง</span>
              </div>

              <div className="pl-6 text-slate-800 flex flex-wrap gap-4 pt-0.5">
                <span>
                  ระยะเวลาการซ่อมประมาณ{' '}
                  <strong className="underline font-mono">{order.estimatedRepairDays || '......'}</strong> วัน
                </span>
                <span>
                  ค่าใช้จ่ายประมาณ{' '}
                  <strong className="underline font-mono">
                    {order.estimatedRepairCost ? order.estimatedRepairCost.toLocaleString() : '..........'}
                  </strong> บาท
                </span>
              </div>

              <div className="pt-0.5 text-slate-900 font-semibold">
                ไม่สามารถซ่อมเองได้ จำเป็นต้องส่งซ่อมภายนอกหน่วยงาน
              </div>

              {/* Option 4: ส่งซ่อมบริษัท (ระบุชื่อบริษัทได้) */}
              <div className="flex items-center gap-1.5 pl-3">
                <span className="font-mono font-bold">
                  {assessment === 'external_company' ? '[✓]' : '[  ]'}
                </span>
                <span>
                  ส่งซ่อมบริษัท{' '}
                  <span className="underline decoration-slate-400 font-semibold">
                    {order.externalCompanyName || order.externalVendorName || order.vendor || '...........................................................................'}
                  </span>
                </span>
              </div>

              {/* Option 5: อื่น ๆ (พิมพ์ข้อความเพิ่มได้) */}
              <div className="flex items-center gap-1.5 pl-3">
                <span className="font-mono font-bold">
                  {assessment === 'other' ? '[✓]' : '[  ]'}
                </span>
                <span>
                  อื่น ๆ{' '}
                  <span className="underline decoration-slate-400 font-semibold">
                    {order.otherRepairAssessmentText || '...........................................................................'}
                  </span>
                </span>
              </div>
            </div>

            <div className="flex justify-end mt-1.5">
              <div className="text-center w-60">
                <div className="h-7 border-b border-dotted border-slate-500 flex items-end justify-center pb-0.5">
                  <span className="italic font-serif text-slate-700">
                    {order.maintenanceSectionSigner || order.assignedTechName || ''}
                  </span>
                </div>
                <div className="mt-0.5 font-bold text-slate-900 text-sm">
                  ({order.maintenanceSectionSigner || order.assignedTechName || '........................................................'})
                </div>
                <div className="text-slate-600 text-xs">เจ้าหน้าที่งานซ่อมบำรุง / พัสดุ</div>
              </div>
            </div>
          </div>

          {/* Two-Column Official Sign-off: ความเห็นหัวหน้าเจ้าหน้าที่ และ คำสั่งอนุมัติ */}
          <div className="grid grid-cols-2 gap-3 border border-slate-400 rounded-lg p-2.5 bg-white">
            
            {/* Left: ความเห็นของหัวหน้าเจ้าหน้าที่ */}
            <div className="flex flex-col justify-between border-r border-slate-300 pr-3">
              <div>
                <p className="font-bold text-slate-900 mb-0.5">ความเห็นของหัวหน้าเจ้าหน้าที่:</p>
                <div className="p-1.5 bg-slate-50 rounded border border-slate-200 text-slate-800 min-h-[44px] leading-snug">
                  {order.headOfficerOpinion || 'เรียน ผู้อำนวยการโรงพยาบาลสังขละบุรี เพื่อโปรดพิจารณาอนุมัติให้ดำเนินการซ่อมบำรุงตามเสนอ'}
                </div>
              </div>

              <div className="text-center mt-2">
                <div className="h-7 border-b border-dotted border-slate-500 flex items-end justify-center pb-0.5">
                  <span className="italic font-serif text-slate-700">
                    {order.headOfficerName || 'นางสาวชุติญา จรัสกุลธาดา'}
                  </span>
                </div>
                <div className="mt-0.5 font-bold text-slate-900">
                  ({order.headOfficerName || 'นางสาวชุติญา จรัสกุลธาดา'})
                </div>
                <div className="text-slate-700 text-sm">
                  ตำแหน่ง {order.headOfficerTitle || 'หัวหน้าเจ้าหน้าที่'}
                </div>
                <div className="text-slate-400 text-xs mt-0.5">
                  วันที่ {order.reportDate}
                </div>
              </div>
            </div>

            {/* Right: คำสั่ง / การอนุมัติ (ปุ่ม/เครื่องหมาย อนุมัติ และ ไม่อนุมัติ โชว์ชัดเจน) */}
            <div className="flex flex-col justify-between pl-2">
              <div>
                <p className="font-bold text-slate-900 mb-1 flex items-center justify-between">
                  <span>คำสั่ง / การอนุมัติ:</span>
                  {isApproved && (
                    <span className="text-emerald-800 text-xs font-bold bg-emerald-50 px-2 py-0.2 rounded border border-emerald-300">
                      ✓ อนุมัติแล้ว
                    </span>
                  )}
                  {isRejected && (
                    <span className="text-rose-800 text-xs font-bold bg-rose-50 px-2 py-0.2 rounded border border-rose-300">
                      ✕ ไม่อนุมัติ
                    </span>
                  )}
                </p>
                
                {/* Explicit Checkboxes for อนุมัติ and ไม่อนุมัติ */}
                <div className="flex items-center gap-6 my-1 font-bold">
                  <span className="flex items-center gap-1">
                    <span className="font-mono font-bold text-emerald-950">
                      {isApproved ? '[✓]' : '[  ]'}
                    </span>
                    <span className={isApproved ? 'text-emerald-950 underline font-bold' : 'text-slate-800'}>
                      อนุมัติ
                    </span>
                  </span>
                  
                  <span className="flex items-center gap-1">
                    <span className="font-mono font-bold text-rose-950">
                      {isRejected ? '[✓]' : '[  ]'}
                    </span>
                    <span className={isRejected ? 'text-rose-950 underline font-bold' : 'text-slate-800'}>
                      ไม่อนุมัติ
                    </span>
                  </span>
                </div>

                {order.approvalComments ? (
                  <p className="text-xs text-slate-700 mt-1 italic p-1 bg-slate-50 rounded border border-slate-200">
                    คำสั่งเพิ่มเติม: {order.approvalComments}
                  </p>
                ) : (
                  <div className="border-b border-dotted border-slate-300 mt-1 pb-0.5 text-xs text-slate-400">
                    ........................................................................................................
                  </div>
                )}
              </div>

              <div className="text-center mt-2">
                <div className="h-7 border-b border-dotted border-slate-500 flex items-end justify-center pb-0.5">
                  <span className="italic font-serif text-slate-700">
                    {order.approverName || 'นายแพทย์จิรวัฒน์ วงษ์สวัสดิ์'}
                  </span>
                </div>
                <div className="mt-0.5 font-bold text-slate-900">
                  ({order.approverName || 'นายแพทย์จิรวัฒน์ วงษ์สวัสดิ์'})
                </div>
                <div className="text-slate-700 text-sm">
                  {order.approverTitle || 'นายแพทย์ชำนาญการ (ด้านเวชกรรม) รักษาการในตำแหน่งผู้อำนวยการโรงพยาบาลสังขละบุรี'}
                </div>
                <div className="text-slate-500 text-xs font-mono">
                  วันที่ {order.approvalDate || order.reportDate || '....../....../......'}
                </div>
              </div>
            </div>

          </div>

          {/* Section: Attached Photos (if any, prints cleanly on separate page if needed) */}
          {images.length > 0 && (
            <div className="mt-3 pt-2 border-t-2 border-slate-300 page-break">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 mb-1.5 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-emerald-800" />
                <span>ภาพถ่ายสภาพครุภัณฑ์และอาการชำรุดที่แนบประกอบการพิจารณา ({images.length} ภาพ)</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {images.map((img, idx) => (
                  <div key={idx} className="border border-slate-300 rounded-lg overflow-hidden bg-slate-50 p-1 text-center">
                    <img 
                      src={img} 
                      alt={`Attached photo ${idx + 1}`} 
                      className="w-full h-32 object-contain bg-slate-100 rounded" 
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      ภาพที่ {idx + 1}: สภาพเครื่อง / ปัญหาที่ตรวจพบ
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Footer Note (No Barcode) */}
          <div className="mt-3 pt-1 border-t border-slate-200 text-xs text-slate-400 flex items-center justify-between">
            <span>แบบฟอร์มบันทึกข้อความขออนุมัติซ่อมบำรุงพัสดุ-ครุภัณฑ์ โรงพยาบาลสังขละบุรี (TH SarabunPSK ขนาด 16)</span>
            <span className="font-mono">รหัสครุภัณฑ์: {order.assetCode}</span>
          </div>

        </div>
      </div>
    </div>
  );
};
