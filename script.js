document.addEventListener("DOMContentLoaded", function () {
  const areaSelect = document.getElementById("area-select");
  const regionSelect = document.getElementById("region-select");
  const subAreaContainer = document.getElementById("sub-area-container");
  const subAreaSelect = document.getElementById("sub-area-select");
  const resultDiv = document.getElementById("result");

  let deliveryData = {};

  // JSONファイル（tokyo.json）のデータをロード
  async function loadDeliveryData() {
    try {
      const tokyoData = await fetch("tokyo.json").then(res => res.json());
      deliveryData = tokyoData;
    } catch (error) {
      console.error("データの読み込みに失敗しました", error);
    }
  }
  loadDeliveryData();

  // エリア選択時：地域とサブエリアの選択肢を初期化して更新
  areaSelect.addEventListener("change", function () {
    const selectedArea = areaSelect.value;
    regionSelect.innerHTML = "<option value=''>地域を選択してください</option>";
    subAreaSelect.innerHTML = "<option value=''>サブエリアを選択してください</option>";
    subAreaContainer.style.display = "none";

    if (selectedArea && deliveryData[selectedArea]) {
      Object.keys(deliveryData[selectedArea]).forEach(region => {
        const option = document.createElement("option");
        option.value = region;
        option.textContent = region;
        regionSelect.appendChild(option);
      });
      regionSelect.disabled = false;
    } else {
      regionSelect.disabled = true;
    }
  });

  // 地域選択時：対象地域（あきる野市、青梅市、西多摩郡日の出町、八王子市）の場合はサブエリアの選択肢を更新＆表示
  regionSelect.addEventListener("change", function () {
    const selectedArea = areaSelect.value;
    const selectedRegion = regionSelect.value;
    subAreaSelect.innerHTML = "<option value=''>サブエリアを選択してください</option>";
    // 対象地域ならサブエリアフォームを表示
    if (["あきる野市", "青梅市", "西多摩郡日の出町", "八王子市"].includes(selectedRegion)) {
      if (deliveryData[selectedArea][selectedRegion].subAreas) {
        const subAreas = Object.keys(deliveryData[selectedArea][selectedRegion].subAreas);
        subAreas.forEach(sub => {
          const option = document.createElement("option");
          option.value = sub;
          option.textContent = sub;
          subAreaSelect.appendChild(option);
        });
        subAreaContainer.style.display = "block";
      } else {
        subAreaContainer.style.display = "none";
      }
    } else {
      subAreaContainer.style.display = "none";
    }
  });

  // 各配送便のスケジュールを整形して返す関数（平日と土曜日を分ける）
  function formatScheduleItem(time, schedule) {
    const weekday = schedule["平日"] || "なし";
    const saturday = schedule["土曜日"] || "なし";
    return `
      <div class="result-card">
        <div class="result-item"><strong>${time}</strong></div>
        <div class="schedule-container">
          <div class="schedule-day schedule-weekday">
            <span class="day-label">平日:</span> ${weekday}
          </div>
          <div class="schedule-day schedule-saturday">
            <span class="day-label">土曜日:</span> ${saturday}
          </div>
        </div>
      </div>
    `;
  }

  // 配送スケジュールを検索・表示
  function searchSchedule() {
    const selectedArea = areaSelect.value;
    const selectedRegion = regionSelect.value;
    const selectedSubArea = subAreaSelect.value;
    resultDiv.innerHTML = "";

    if (selectedSubArea && deliveryData[selectedArea][selectedRegion].subAreas[selectedSubArea]) {
      let subData = deliveryData[selectedArea][selectedRegion].subAreas[selectedSubArea];
      let scheduleHTML = `<div class="result-header">${selectedRegion} / ${selectedSubArea}</div>`;
      if (typeof subData === "string") {
        // サブエリアが文字列の場合（例："路線便対応"）
        scheduleHTML += `<div class="result-card"><div class="result-item">${subData}</div></div>`;
      } else {
        // サブエリアがオブジェクトの場合
        for (let time in subData) {
          scheduleHTML += formatScheduleItem(time, subData[time]);
        }
      }
      resultDiv.innerHTML = scheduleHTML;
    } else if (selectedArea && selectedRegion && deliveryData[selectedArea] && deliveryData[selectedArea][selectedRegion]) {
      let scheduleData = deliveryData[selectedArea][selectedRegion];
      let scheduleHTML = `<div class="result-header">${selectedRegion} の配送スケジュール</div>`;
      for (let time in scheduleData) {
        if (time === "subAreas") continue; // サブエリア情報は除外
        scheduleHTML += formatScheduleItem(time, scheduleData[time]);
      }
      resultDiv.innerHTML = scheduleHTML;
    } else {
      resultDiv.innerHTML = "<p>該当するデータがありません。</p>";
    }
  }

  window.searchSchedule = searchSchedule;
});
