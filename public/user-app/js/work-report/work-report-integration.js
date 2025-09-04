// js/work-report/work-report-integration.js
// Work Report Integration (2025-09-01 15:00 KST 생성됨)

(function () {
  "use strict";

  function bindOpenButton() {
    // 하단 버튼 중 텍스트가 "근무현황"인 버튼을 찾아 바인딩 (동적 DOM 대응)
    const buttons = document.querySelectorAll(".bottom .button");
    buttons.forEach((btn) => {
      const txt = btn.textContent?.trim();
      if (txt && txt.includes("근무현황")) {
        btn.addEventListener("click", () => {
          window.WorkReportUI?.openWorkReport(new Date().getFullYear());
        });
      }
    });
  }

  // 초기화
  document.addEventListener("DOMContentLoaded", () => {
    window.WorkReportUI?.setupUIBindings();
    bindOpenButton();
  });
})();
