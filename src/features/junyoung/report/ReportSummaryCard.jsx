import React from "react";

export default function ReportSummaryCard({ report }) {
  if (!report) return null;

  return (
    <section className="junyoung-report-card">
      <h3>{report.exerciseName}</h3>
      <dl>
        <div>
          <dt>정확도</dt>
          <dd>{report.accuracy}%</dd>
        </div>
        <div>
          <dt>반복</dt>
          <dd>{report.reps}/{report.targetReps}</dd>
        </div>
        <div>
          <dt>상태</dt>
          <dd>{report.stateLabel}</dd>
        </div>
      </dl>
      <p>{report.summary}</p>
    </section>
  );
}
