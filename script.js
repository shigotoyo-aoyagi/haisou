document.addEventListener("DOMContentLoaded", function () {
  const prefectureSelect = document.getElementById("prefecture-select");
  const areaSelect = document.getElementById("area-select");
  const regionSelect = document.getElementById("region-select");
  const subAreaContainer = document.getElementById("sub-area-container");
  const subAreaSelect = document.getElementById("sub-area-select");
  const resultDiv = document.getElementById("result");

  let deliveryData = {};
  let currentPrefecture = "";

  // 指定された都道府県に応じたJSONファイルをロードする関数
  async function loadDeliveryData(prefecture) {
    let fileName = "";
    if (prefecture === "tokyo") {
      fileName = "tokyo.json";
    } else if (prefecture === "kanagawa") {
      fileName = "kanagawa.json";
    } else {
      return;
    }
    try {
      deliveryData = await fetch(fileName).then(res => res.json());
    } catch (error) {
      console.error("データの読み込みに失敗しました", error);
    }
  }

  // 都道府県選択時の処理
  prefectureSelect.addEventListener("change", async function () {
    currentPrefecture = prefectureSelect.value;
    areaSelect.innerHTML = "<option value=''>エリアを選択してください</option>";
    regionSelect.innerHTML = "<option value=''>地域を選択してください</option>";
    subAreaSelect.innerHTML = "<option value=''>サブエリアを選択してください</option>";
    subAreaContainer.style.display = "none";
    resultDiv.innerHTML = "";

    if (currentPrefecture) {
      await loadDeliveryData(currentPrefecture);
      // 東京都の場合は、tokyo.jsonのキー（例："東京都23区"、"東京都（23区外）"）をエリアに設定
      if (currentPrefecture === "tokyo") {
        Object.keys(deliveryData).forEach(area => {
          const option = document.createElement("option");
          option.value = area;
          option.textContent = area;
          areaSelect.appendChild(option);
        });
      }
      // 神奈川県の場合は、kanagawa.jsonのトップレベルキー（各自治体名）をエリアに設定
      else if (currentPrefecture === "kanagawa") {
        Object.keys(deliveryData).forEach(muni => {
          const option = document.createElement("option");
          option.value = muni;
          option.textContent = muni;
          areaSelect.appendChild(option);
        });
      }
      areaSelect.disabled = false;
      regionSelect.disabled = false;
    } else {
      areaSelect.disabled = true;
      regionSelect.disabled = true;
    }
  });

  // エリア選択時の処理
  areaSelect.addEventListener("change", function () {
    const selectedArea = areaSelect.value;
    regionSelect.innerHTML = "<option value=''>地域を選択してください</option>";
    subAreaSelect.innerHTML = "<option value=''>サブエリアを選択してください</option>";
    subAreaContainer.style.display = "none";
    resultDiv.innerHTML = "";

    if (!selectedArea) {
      regionSelect.disabled = true;
      return;
    }

    if (currentPrefecture === "tokyo") {
      // tokyo.jsonの場合、deliveryData[selectedArea]は地域（区や市）のオブジェクト
      Object.keys(deliveryData[selectedArea]).forEach(region => {
        const option = document.createElement("option");
        option.value = region;
        option.textContent = region;
        regionSelect.appendChild(option);
      });
      regionSelect.disabled = false;
    } else if (currentPrefecture === "kanagawa") {
      // kanagawa.jsonの場合、対象自治体によっては、直接スケジュールが設定されているか、または更に地域分けされているかを判定
      const data = deliveryData[selectedArea];
      const keys = Object.keys(data);
      if (keys.length > 0 && keys[0].includes("締め")) {
        // キーに「締め」が含まれているなら直接スケジュールが設定されているとみなし、地域選択は不要
        regionSelect.innerHTML = "<option value=''>直接データあり</option>";
        regionSelect.disabled = true;
      } else {
        // そうでなければ、地域選択用に子キーを表示
        Object.keys(data).forEach(region => {
          const option = document.createElement("option");
          option.value = region;
          option.textContent = region;
          regionSelect.appendChild(option);
        });
        regionSelect.disabled = false;
      }
    }
  });

  // 地域選択時の処理（サブエリアが設定されている場合）
  regionSelect.addEventListener("change", function () {
    const selectedArea = areaSelect.value;
    const selectedRegion = regionSelect.value;
    subAreaSelect.innerHTML = "<option value=''>サブエリアを選択してください</option>";
    if (selectedRegion &&
        deliveryData[selectedArea] &&
        deliveryData[selectedArea][selectedRegion] &&
        deliveryData[selectedArea][selectedRegion].subAreas) {
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
  });

  // 配送便のスケジュール表示用フォーマット関数
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

  // 検索処理
  function searchSchedule() {
    const selectedPrefecture = currentPrefecture;
    const selectedArea = areaSelect.value;
    let selectedRegion = regionSelect.value;
    const selectedSubArea = subAreaSelect.value;
    resultDiv.innerHTML = "";

    if (!selectedPrefecture || !selectedArea) {
      resultDiv.innerHTML = "<p>該当するデータがありません。</p>";
      return;
    }

    let scheduleData;
    if (selectedPrefecture === "tokyo") {
      if (selectedRegion && deliveryData[selectedArea][selectedRegion]) {
        if (selectedSubArea &&
            deliveryData[selectedArea][selectedRegion].subAreas &&
            deliveryData[selectedArea][selectedRegion].subAreas[selectedSubArea]) {
          scheduleData = deliveryData[selectedArea][selectedRegion].subAreas[selectedSubArea];
          resultDiv.innerHTML = `<div class="result-header">${selectedRegion} / ${selectedSubArea}</div>`;
        } else {
          scheduleData = deliveryData[selectedArea][selectedRegion];
          resultDiv.innerHTML = `<div class="result-header">${selectedRegion} の配送スケジュール</div>`;
        }
      } else {
        resultDiv.innerHTML = "<p>該当するデータがありません。</p>";
        return;
      }
    } else if (selectedPrefecture === "kanagawa") {
      if (regionSelect.disabled) {
        // 地域選択不要の場合
        scheduleData = deliveryData[selectedArea];
        resultDiv.innerHTML = `<div class="result-header">${selectedArea} の配送スケジュール</div>`;
      } else {
        if (selectedRegion && deliveryData[selectedArea][selectedRegion]) {
          if (selectedSubArea &&
              deliveryData[selectedArea][selectedRegion].subAreas &&
              deliveryData[selectedArea][selectedRegion].subAreas[selectedSubArea]) {
            scheduleData = deliveryData[selectedArea][selectedRegion].subAreas[selectedSubArea];
            resultDiv.innerHTML = `<div class="result-header">${selectedRegion} / ${selectedSubArea}</div>`;
          } else {
            scheduleData = deliveryData[selectedArea][selectedRegion];
            resultDiv.innerHTML = `<div class="result-header">${selectedRegion} の配送スケジュール</div>`;
          }
        } else {
          resultDiv.innerHTML = "<p>該当するデータがありません。</p>";
          return;
        }
      }
    }

    // 各配送便のスケジュール表示
    for (let time in scheduleData) {
      if (time === "subAreas") continue;
      resultDiv.innerHTML += formatScheduleItem(time, scheduleData[time]);
    }
  }

  window.searchSchedule = searchSchedule;
});
