'use client'

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';

function CertificateContent() {
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [html2canvasLoaded, setHtml2canvasLoaded] = useState(false);
  const [jsPDFLoaded, setJsPDFLoaded] = useState(false);

  const scriptsLoaded = html2canvasLoaded && jsPDFLoaded;

  useEffect(() => {
    setMounted(true);

    // Load html2canvas
    const html2canvasScript = document.createElement('script');
    html2canvasScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    html2canvasScript.async = true;
    html2canvasScript.onload = () => {
      console.log('✅ html2canvas loaded');
      setHtml2canvasLoaded(true);
    };
    html2canvasScript.onerror = () => {
      console.error('❌ Failed to load html2canvas');
    };
    document.body.appendChild(html2canvasScript);

    // Load jsPDF
    const jsPDFScript = document.createElement('script');
    jsPDFScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    jsPDFScript.async = true;
    jsPDFScript.onload = () => {
      console.log('✅ jsPDF loaded');
      setJsPDFLoaded(true);
    };
    jsPDFScript.onerror = () => {
      console.error('❌ Failed to load jsPDF');
    };
    document.body.appendChild(jsPDFScript);

    return () => {
      try {
        if (html2canvasScript.parentNode) {
          document.body.removeChild(html2canvasScript);
        }
        if (jsPDFScript.parentNode) {
          document.body.removeChild(jsPDFScript);
        }
      } catch (e) {
        // Scripts already removed
      }
    };
  }, []);

  if (!mounted) return null;

  const student = searchParams.get('student') || 'Student Name';
  const course = searchParams.get('course') || 'Course Name';
  const grade = searchParams.get('grade') || '100%';
  const instructor = searchParams.get('instructor') || 'Instructor';
  const date = searchParams.get('date') || new Date().toLocaleDateString();
  const certNumber = searchParams.get('number') || 'CERT-2024-001234';

  const downloadPDF = async () => {
    if (!scriptsLoaded) {
      alert('Please wait, loading PDF libraries...');
      return;
    }

    try {
      // @ts-ignore
      const { jsPDF } = window.jspdf;
      // @ts-ignore
      const html2canvas = window.html2canvas;
      
      const certificate = document.getElementById('certificate');
      const controls = document.querySelector('.controls') as HTMLElement;
      
      if (controls) controls.style.display = 'none';
      
      const canvas = await html2canvas(certificate, {
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      if (controls) controls.style.display = 'flex';
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`certificate-${certNumber}.pdf`);
      
      console.log('✅ PDF downloaded successfully');
    } catch (error) {
      console.error('PDF Download Error:', error);
      alert('Failed to download PDF. Please try again.');
    }
  };

  const shareCertificate = () => {
    const url = window.location.href;
    
    if (navigator.share) {
      navigator.share({
        title: 'My Course Completion Certificate',
        text: `I just completed ${course}!`,
        url: url
      });
    } else {
      navigator.clipboard.writeText(url);
      alert('Certificate link copied to clipboard! 📋');
    }
  };

  return (
    <>
      <style jsx global>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Georgia', 'Times New Roman', serif;
          background: #e5e5e5;
          min-height: 100vh;
          padding: 20px;
        }

        .cert-container {
          max-width: 1200px;
          width: 100%;
          margin: 0 auto;
        }

        .controls {
          display: flex;
          justify-content: center;
          gap: 15px;
          margin-bottom: 30px;
          flex-wrap: wrap;
        }

        .btn {
          background: #003d6b;
          color: white;
          border: none;
          padding: 12px 30px;
          font-size: 15px;
          font-weight: 600;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .btn:hover {
          background: #002a4a;
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }

        .btn:disabled {
          background: #ccc;
          cursor: not-allowed;
          transform: none;
        }

        .certificate {
          background: white;
          padding: 0;
          border-radius: 0;
          box-shadow: 0 10px 40px rgba(0,0,0,0.15);
          position: relative;
          overflow: hidden;
          aspect-ratio: 297/210;
        }

        /* Diagonal blue and gold stripes on left */
        .left-stripe {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 320px;
          background: linear-gradient(165deg, 
            #003d6b 0%, 
            #003d6b 45%, 
            #d4af37 45%, 
            #d4af37 55%, 
            #f5f5f5 55%
          );
          clip-path: polygon(0 0, 100% 0, 65% 100%, 0 100%);
        }

        /* Diagonal blue and gold stripes on right */
        .right-stripe {
          position: absolute;
          right: 0;
          top: 0;
          bottom: 0;
          width: 320px;
          background: linear-gradient(15deg, 
            #003d6b 0%, 
            #003d6b 45%, 
            #d4af37 45%, 
            #d4af37 55%, 
            #f5f5f5 55%
          );
          clip-path: polygon(35% 0, 100% 0, 100% 100%, 0 100%);
        }

        .cert-content {
          position: relative;
          z-index: 10;
          padding: 60px 80px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100%;
        }

        /* Gold award badge */
        .award-badge {
          position: absolute;
          top: 80px;
          right: 120px;
          width: 120px;
          height: 120px;
          z-index: 20;
        }

        .badge-circle {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: linear-gradient(135deg, #f4d03f 0%, #d4af37 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          box-shadow: 0 4px 15px rgba(212, 175, 55, 0.4);
        }

        .badge-inner {
          width: 85%;
          height: 85%;
          border-radius: 50%;
          background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border: 3px dashed rgba(255,255,255,0.5);
        }

        .badge-text {
          color: white;
          font-size: 11px;
          font-weight: 700;
          text-align: center;
          line-height: 1.2;
          text-transform: uppercase;
        }

        .badge-stars {
          color: white;
          font-size: 10px;
          margin: 3px 0;
        }

        /* Blue ribbons */
        .ribbon {
          position: absolute;
          bottom: -25px;
          width: 35px;
          height: 50px;
          background: #003d6b;
          clip-path: polygon(0 0, 100% 0, 100% 85%, 50% 100%, 0 85%);
        }

        .ribbon.left {
          left: 25px;
        }

        .ribbon.right {
          right: 25px;
        }

        .cert-title {
          text-align: center;
          font-size: 56px;
          font-weight: 700;
          color: #003d6b;
          margin-bottom: 5px;
          letter-spacing: 3px;
          text-transform: uppercase;
        }

        .cert-subtitle {
          text-align: center;
          font-size: 22px;
          color: #d4af37;
          margin-bottom: 40px;
          font-weight: 400;
          text-transform: uppercase;
          letter-spacing: 4px;
        }

        .presented-label {
          font-size: 14px;
          color: #003d6b;
          text-transform: uppercase;
          letter-spacing: 3px;
          margin-bottom: 20px;
          font-weight: 700;
          text-align: center;
        }

        .student-name {
          font-size: 52px;
          color: #d4af37;
          font-weight: 400;
          margin-bottom: 35px;
          text-align: center;
          font-family: 'Brush Script MT', cursive;
          font-style: italic;
        }

        .description-text {
          text-align: center;
          font-size: 14px;
          color: #999;
          line-height: 1.9;
          margin: 0 auto 40px;
          max-width: 650px;
          font-weight: 400;
        }

        .course-name {
          font-size: 20px;
          color: #003d6b;
          font-weight: 700;
          text-align: center;
          margin-bottom: 50px;
        }

        .bottom-section {
          display: flex;
          justify-content: center;
          gap: 150px;
          margin-top: 20px;
          width: 100%;
        }

        .signature-box {
          text-align: center;
          min-width: 180px;
        }

        .signature-line {
          width: 180px;
          border-bottom: 2px solid #d4af37;
          margin: 0 auto 10px;
          height: 1px;
        }

        .signature-label {
          font-size: 12px;
          color: #999;
          text-transform: uppercase;
          letter-spacing: 2px;
          font-weight: 600;
        }

        .signature-value {
          font-size: 14px;
          color: #003d6b;
          font-weight: 600;
          margin-top: 5px;
        }

        @media print {
          body {
            background: white;
            padding: 0;
          }
          .controls {
            display: none !important;
          }
          .certificate {
            box-shadow: none;
          }
        }

        @media (max-width: 768px) {
          .cert-content {
            padding: 40px 30px;
          }

          .left-stripe,
          .right-stripe {
            width: 200px;
          }

          .award-badge {
            width: 80px;
            height: 80px;
            top: 40px;
            right: 60px;
          }

          .cert-title {
            font-size: 36px;
          }

          .student-name {
            font-size: 32px;
          }

          .bottom-section {
            flex-direction: column;
            gap: 40px;
          }
        }
      `}</style>

      <div className="cert-container">
        <div className="controls">
          <button className="btn" onClick={downloadPDF} disabled={!scriptsLoaded}>
            {scriptsLoaded ? '📥 Download PDF' : '⏳ Loading...'}
          </button>
          <button className="btn" onClick={() => window.print()}>🖨️ Print Certificate</button>
          <button className="btn" onClick={shareCertificate}>🔗 Share</button>
        </div>

        <div className="certificate" id="certificate">
          {/* Left diagonal stripe */}
          <div className="left-stripe"></div>
          
          {/* Right diagonal stripe */}
          <div className="right-stripe"></div>

          {/* Award Badge */}
          <div className="award-badge">
            <div className="badge-circle">
              <div className="badge-inner">
                <div className="badge-stars">★ ★ ★</div>
                <div className="badge-text">BEST<br/>AWARD</div>
                <div className="badge-stars">★ ★ ★</div>
              </div>
              {/* Blue ribbons */}
              <div className="ribbon left"></div>
              <div className="ribbon right"></div>
            </div>
          </div>

          {/* Main Content */}
          <div className="cert-content">
            <h1 className="cert-title">CERTIFICATE</h1>
            <p className="cert-subtitle">OF APPRECIATION</p>

            <p className="presented-label">PROUDLY PRESENTED TO</p>

            <div className="student-name">{student}</div>

            <p className="description-text">
              Has successfully completed the requirements and demonstrated proficiency in the following course. 
              This achievement represents dedication, hard work, and commitment to excellence in learning.
            </p>

            <div className="course-name">{course}</div>

            <div className="bottom-section">
              <div className="signature-box">
                <div className="signature-line"></div>
                <div className="signature-label">Signature</div>
                <div className="signature-value">{instructor}</div>
              </div>

              <div className="signature-box">
                <div className="signature-line"></div>
                <div className="signature-label">Date</div>
                <div className="signature-value">{date}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function CertificatePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading certificate...</p>
        </div>
      </div>
    }>
      <CertificateContent />
    </Suspense>
  );
}