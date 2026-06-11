import React from "react";
import { createMedicalShareText, downloadTextFile } from "./shareReport";

export default function MedicalSharePanel({ report }) {
  const handleDownload = () => {
    const content = createMedicalShareText(report);
    downloadTextFile("ara-medical-report.txt", content);
  };

  return (
    <div className="junyoung-medical-share">
      <button type="button" onClick={handleDownload} disabled={!report}>
        병원 공유용 자료 다운로드
      </button>
    </div>
  );
}
