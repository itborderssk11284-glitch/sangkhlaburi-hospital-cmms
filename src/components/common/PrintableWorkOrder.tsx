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

  // Strictly "กจ 003.308.1/" without appended numbers as requested
  const docNo = 'กจ 003.308.1/';

  // ผู้ส่งซ่อม ให้ขึ้นชื่อตามที่ Login
  const reporterDisplayName = currentUser?.fullName || order.reporterName || '........................................................';

  // Format date display (Thai or ISO)
  const displayDate = order.reportDate ? order.reportDate.split(' ')[0] : '...........................................';

  // Identify if this is a general/other repair ticket
  const isGeneralOrder = order.orderType === 'general';
  const displayItemName = isGeneralOrder 
    ? (order.customItemName || order.assetName) 
    : (order.brand ? `${order.brand} ` : '') + order.assetName;
  const displayModel = isGeneralOrder ? '-' : (order.model || asset?.model || '-');
  const displayAssetCode = isGeneralOrder ? '-' : (order.assetCode || asset?.code || '-');
  const displayVendor = order.vendor || asset?.vendor || '-';
  const displayVendorPhone = order.vendorPhone || asset?.vendorPhone || '-';
  const displayPriority = (order.priority === 'urgent' || order.priority === 'emergency') ? 'ด่วนมาก' : 'งานปกติ';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      {/* Print Style Injections for A4 & TH SarabunPSK 14pt */}
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
          font-size: 14pt !important;
          line-height: 1.25 !important;
          color: #000000 !important;
        }
        .sarabun-memo strong, .sarabun-memo b, .sarabun-memo .font-bold {
          font-weight: 700 !important;
        }
        .sarabun-memo .memo-title {
          font-size: 20pt !important;
          font-weight: 700 !important;
          line-height: 1.2 !important;
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm 15mm 12mm 15mm;
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
          .photo-appendix-page {
            page-break-before: always;
            padding-top: 15mm;
          }
        }
      `}</style>

      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full my-auto overflow-hidden border border-slate-200">
        
        {/* Modal Action Bar (hidden on print) */}
        <div className="bg-slate-900 text-white px-6 py-3 flex items-center justify-between no-print border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-emerald-400" />
            <div>
              <span className="font-semibold text-sm">แบบฟอร์มบันทึกข้อความ ขออนุมัติซ่อมบำรุงพัสดุ-ครุภัณฑ์ (TH SarabunPSK ขนาด 14)</span>
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
          className="p-8 sm:p-12 text-black bg-white leading-tight font-sans sarabun-memo" 
          id="printable-order-sheet"
        >
          {/* Header: Centered Memorandum Title Without Any Logo / Image */}
          <div className="text-center pb-1 mb-1">
            <h1 className="memo-title font-bold text-center">
              บันทึกข้อความ
            </h1>
          </div>

          {/* Official Memorandum Metadata (แบบราชการสังขละบุรี) */}
          <div className="space-y-0.5 mb-1 text-black">
            <div className="flex items-baseline gap-1">
              <span className="font-bold">ส่วนราชการ</span>
              <span>โรงพยาบาลสังขละบุรี ฝ่ายบริหารทั่วไป โทร. 034 – 595030 ต่อ 205</span>
            </div>

            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-1 flex-1">
                <span className="font-bold">ที่</span>
                <span>{docNo}...........................................................................</span>
              </div>
              <div className="flex items-baseline gap-1 w-64 justify-start">
                <span className="font-bold">วันที่</span>
                <span>{displayDate}</span>
              </div>
            </div>

            <div className="flex items-baseline gap-1">
              <span className="font-bold">เรื่อง</span>
              <span>ขออนุมัติซ่อมบำรุงพัสดุ-ครุภัณฑ์</span>
            </div>

            <div className="flex items-baseline gap-1">
              <span className="font-bold">เรียน</span>
              <span>ผู้อำนวยการโรงพยาบาลสังขละบุรี</span>
            </div>
          </div>

          {/* Intro Paragraph */}
          <div className="mt-1 mb-1 text-black">
            <p className="indent-12 leading-relaxed">
              ด้วยฝ่าย/งาน {order.department ? <span>{order.department}</span> : '...................................................'} มีความประสงค์จะทำการซ่อมบำรุงพัสดุ-ครุภัณฑ์
            </p>
            <p className="leading-relaxed">
              การแพทย์ / สำนักงาน / ยานพาหนะ / อาคาร / สิ่งก่อสร้าง / งานบ้านงานครัว / อุปกรณ์และอื่นๆ ตามตารางดังต่อไปนี้
            </p>
          </div>

          {/* Section 1: Equipment Lines (ตามไฟล์ PDF แนบ) */}
          <div className="pl-6 space-y-0.5 mb-2 text-black">
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-1 flex-1">
                <span>1.เครื่อง</span>
                <span className="border-b border-dotted border-black flex-1 font-semibold pl-1">
                  {displayItemName}
                </span>
              </div>
              <div className="flex items-baseline gap-1 w-64 pl-2">
                <span>รุ่น</span>
                <span className="border-b border-dotted border-black flex-1 pl-1">
                  {displayModel}
                </span>
              </div>
            </div>

            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-1 flex-1">
                <span>ลักษณะ/อาการชำรุด</span>
                <span className="border-b border-dotted border-black flex-1 pl-1">
                  {order.symptom} {order.errorDetails ? `(${order.errorDetails})` : ''}
                </span>
              </div>
              <div className="flex items-baseline gap-1 w-64 pl-2">
                <span>หมายเลขครุภัณฑ์</span>
                <span className="border-b border-dotted border-black flex-1 pl-1 font-mono">
                  {displayAssetCode}
                </span>
              </div>
            </div>

            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-1 flex-1">
                <span>บริษัท</span>
                <span className="border-b border-dotted border-black flex-1 pl-1">
                  {displayVendor}
                </span>
              </div>
              <div className="flex items-baseline gap-1 w-64 pl-2">
                <span>เบอร์โทรศัพท์</span>
                <span className="border-b border-dotted border-black flex-1 pl-1 font-mono">
                  {displayVendorPhone}
                </span>
              </div>
            </div>

            <div className="flex items-baseline gap-1">
              <span>ระดับความเร่งด่วน</span>
              <span className="border-b border-dotted border-black w-48 pl-1 font-semibold">
                {displayPriority}
              </span>
            </div>

            <div className="pt-0.5">
              <span>จึงเรียนมาเพื่อโปรดพิจารณา</span>
            </div>
          </div>

          {/* Signature: ผู้ส่งซ่อม (ชิดขวา ตามชื่อที่ Login) */}
          <div className="flex justify-end mb-2">
            <div className="text-center w-72">
              <div className="flex items-baseline justify-center">
                <span>ลงชื่อ</span>
                <span className="border-b border-dotted border-black flex-1 mx-1 text-center font-semibold">
                  {reporterDisplayName}
                </span>
                <span>ผู้ส่งซ่อม</span>
              </div>
              <div className="mt-0.5">
                ({reporterDisplayName})
              </div>
            </div>
          </div>

          {/* Bottom Two-Column Section (บันทึกหน่วยงานซ่อมบำรุง ซ้าย / ลำดับเสนอและอนุมัติ ขวา) */}
          <div className="grid grid-cols-12 gap-3 pt-1">
            
            {/* Left Column (col-span-7): บันทึกหน่วยงานซ่อมบำรุง/ฝ่ายบริหารทั่วไป */}
            <div className="col-span-7 space-y-0.5 pr-2">
              <div className="font-bold">
                บันทึกหน่วยงานซ่อมบำรุง/ฝ่ายบริหารทั่วไป
              </div>
              <div>
                เสนอ ผู้อำนวยการโรงพยาบาลสังขละบุรี
              </div>

              {/* Option 1: ซ่อมได้เองโดยช่างของโรงพยาบาล ไม่เสียค่าใช้จ่าย */}
              <div className="flex items-baseline gap-1">
                <span>({assessment === 'internal_free' ? '✓' : '  '})</span>
                <span>ซ่อมได้เองโดยช่างของโรงพยาบาล ชื่อ</span>
                <span className="border-b border-dotted border-black flex-1 text-center">
                  {assessment === 'internal_free' ? (order.assignedTechName || '..........................................') : '..........................................'}
                </span>
                <span>ไม่เสียค่าใช้จ่าย</span>
              </div>

              {/* Option 2: ซ่อมได้เองโดยช่างของโรงพยาบาล โดยเสียค่าวัสดุเพิ่มเติม */}
              <div className="flex items-baseline gap-1">
                <span>({assessment === 'internal_with_materials' ? '✓' : '  '})</span>
                <span>ซ่อมได้เองโดยช่างของโรงพยาบาลชื่อ</span>
                <span className="border-b border-dotted border-black flex-1 text-center">
                  {assessment === 'internal_with_materials' ? (order.assignedTechName || '..........................................') : '..........................................'}
                </span>
                <span>โดยเสียค่าวัสดุเพิ่มเติม</span>
              </div>

              {/* Option 3: ส่งซ่อมกองช่างบำรุง */}
              <div className="flex items-baseline gap-1">
                <span>({assessment === 'division_repair' ? '✓' : '  '})</span>
                <span>ส่งซ่อมกองช่างบำรุง</span>
              </div>

              {/* Estimated duration and cost */}
              <div className="flex items-baseline gap-1 pl-4">
                <span>({assessment === 'division_repair' ? '✓' : '  '})</span>
                <span>ระยะเวลาการซ่อมประมาณ</span>
                <span className="border-b border-dotted border-black w-14 text-center font-mono">
                  {order.estimatedRepairDays || '........'}
                </span>
                <span>วัน ค่าใช้จ่ายประมาณ</span>
                <span className="border-b border-dotted border-black flex-1 text-center font-mono">
                  {order.estimatedRepairCost ? order.estimatedRepairCost.toLocaleString() : '...................'}
                </span>
                <span>บาท</span>
              </div>

              <div>
                <span>ไม่สามารถซ่อมเองได้ จำเป็นต้องส่งซ่อมภายนอกหน่วยงาน</span>
              </div>

              {/* Option 4: ส่งซ่อมบริษัท */}
              <div className="flex items-baseline gap-1">
                <span>({assessment === 'external_company' ? '✓' : '  '})</span>
                <span>ส่งซ่อมบริษัท</span>
                <span className="border-b border-dotted border-black flex-1 pl-1">
                  {assessment === 'external_company' 
                    ? (order.externalCompanyName || order.externalVendorName || order.vendor || '........................................................') 
                    : '........................................................'}
                </span>
              </div>

              {/* Option 5: อื่นๆ */}
              <div className="flex items-baseline gap-1">
                <span>({assessment === 'other' ? '✓' : '  '})</span>
                <span>อื่นๆ</span>
                <span className="border-b border-dotted border-black flex-1 pl-1">
                  {assessment === 'other' 
                    ? (order.otherRepairAssessmentText || '......................................................................') 
                    : '......................................................................'}
                </span>
              </div>
            </div>

            {/* Right Column (col-span-5): ลำดับการเสนอเพื่อโปรดพิจารณาอนุมัติ และ ความคิดเห็นของผู้มีอำนาจอนุมัติ */}
            <div className="col-span-5 space-y-4 pl-2 text-center">
              
              {/* Proposal to Approve (นางสาวชุติญา จรัสกุลธาดา) */}
              <div>
                <div className="font-bold mb-2">
                  จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติ
                </div>
                <div className="mt-4">
                  ({order.headOfficerName || 'นางสาวชุติญา จรัสกุลธาดา'})
                </div>
                <div>
                  ตำแหน่ง {order.headOfficerTitle || 'หัวหน้าเจ้าหน้าที่'}
                </div>
              </div>

              {/* Approver Decision (นายแพทย์จิรวัฒน์ วงษ์สวัสดิ์) */}
              <div className="pt-1">
                <div className="font-bold mb-1">
                  ความคิดเห็นของผู้มีอำนาจอนุมัติ
                </div>
                <div className="flex items-center justify-center gap-6 my-1">
                  <div className="flex items-baseline gap-1">
                    <span>({isApproved ? '✓' : '  '})</span>
                    <span className={isApproved ? 'font-bold' : ''}>อนุมัติ</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span>({isRejected ? '✓' : '  '})</span>
                    <span className={isRejected ? 'font-bold' : ''}>ไม่อนุมัติ</span>
                  </div>
                </div>

                <div className="mt-4">
                  ({order.approverName || 'นายจิรวัฒน์ วงษ์สวัสดิ์'})
                </div>
                <div>
                  นายแพทย์ชำนาญการ (ด้านเวชกรรม)
                </div>
                <div>
                  ตำแหน่ง {order.approverTitle || 'ผู้อำนวยการโรงพยาบาลสังขละบุรี'}
                </div>
              </div>

            </div>

          </div>

          {/* Section: Attached Photos (Cleanly rendered on Page 2 if present, without pushing Page 1) */}
          {images.length > 0 && (
            <div className="photo-appendix-page mt-8 pt-4 border-t border-slate-300">
              <h4 className="font-bold text-sm text-black mb-2 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4" />
                <span>ภาพถ่ายสภาพครุภัณฑ์และอาการชำรุดที่แนบประกอบการพิจารณา ({images.length} ภาพ)</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {images.map((img, idx) => (
                  <div key={idx} className="border border-slate-300 rounded overflow-hidden p-1 text-center bg-white">
                    <img 
                      src={img} 
                      alt={`ภาพแนบที่ ${idx + 1}`} 
                      className="w-full h-36 object-contain bg-slate-50" 
                    />
                    <span className="text-[11px] text-slate-700 mt-1 block">
                      ภาพที่ {idx + 1}: สภาพเครื่อง / ปัญหาที่ตรวจพบ
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
