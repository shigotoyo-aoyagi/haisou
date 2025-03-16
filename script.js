document.addEventListener("DOMContentLoaded", function () {
  const prefectureSelect = document.getElementById("prefecture-select");
  const areaInput = document.getElementById("area-input");
  const areaList = document.getElementById("area-list");
  const regionInput = document.getElementById("region-input");
  const regionList = document.getElementById("region-list");
  const subAreaContainer = document.getElementById("sub-area-container");
  const subAreaInput = document.getElementById("sub-area-input");
  const subAreaList = document.getElementById("sub-area-list");
  const resultDiv = document.getElementById("result");
  const truck = document.querySelector("#truck-animation .truck");


  let deliveryData = {};
  let currentPrefecture = "";

  // 指定された都道府県に応じたJSONファイルをロードする関数
  async function loadDeliveryData(prefecture) {
    let fileName = "";
    if (prefecture === "tokyo") {
      fileName = "tokyo.json";
    } else if (prefecture === "kanagawa") {
      fileName = "kanagawa.json";
    } else if (prefecture === "saitama") {
      fileName = "saitama.json";
    } else if (prefecture === "chiba") {
      fileName = "chiba.json";
    } else {
      return;
    }
    try {
      deliveryData = await fetch(fileName).then(res => res.json());
    } catch (error) {
      console.error("データの読み込みに失敗しました", error);
    }
  }

  // **トラックのアニメーションを設定**
  function startTruckAnimation() {
    if (!truck) return;

    // 初期位置を設定
    truck.style.transform = "translateX(-100%)";
    truck.style.transition = "none"; // 最初はアニメーションなし

    // 画面サイズを取得して、トラックが完全に消えるまで移動する
    const screenWidth = window.innerWidth;
    const truckWidth = truck.clientWidth || 150; // トラックの幅

    // アニメーションを設定
    setTimeout(() => {
      truck.style.transition = "transform 6s linear"; // 6秒かけて移動
      truck.style.transform = `translateX(${screenWidth + truckWidth + 100}px)`;
    }, 500); // 0.5秒後に開始
  }

  // **トラックのアニメーションを制御する**
  if (Math.random() < 1 /1) {
    startTruckAnimation();
  }


  // 指定されたデータがスケジュール情報（直接「締め」情報がある）かどうか判定する関数
  function isSchedulingData(data) {
    if (typeof data === "string") return true;
    // "subAreas" プロパティは除外してチェック
    const keys = Object.keys(data).filter(key => key !== "subAreas");
    return keys.length > 0 && keys.every(key => key.includes("締め"));
  }

  // 都道府県選択時の処理
  prefectureSelect.addEventListener("change", async function () {
    currentPrefecture = prefectureSelect.value;
    // 入力内容と datalist をリセット
    areaInput.value = "";
    regionInput.value = "";
    subAreaInput.value = "";
    areaList.innerHTML = "";
    regionList.innerHTML = "";
    subAreaList.innerHTML = "";
    subAreaContainer.style.display = "none";
    resultDiv.innerHTML = "";

    areaInput.disabled = true;
    regionInput.disabled = true;

    if (!currentPrefecture) return;

    await loadDeliveryData(currentPrefecture);

    // 市町村の候補を設定
    if (deliveryData && Object.keys(deliveryData).length > 0) {
      Object.keys(deliveryData).forEach(area => {
        const option = document.createElement("option");
        option.value = area;
        areaList.appendChild(option);
      });
      areaInput.disabled = false;
    } else {
      areaList.innerHTML = "";
      areaInput.disabled = true;
    }
  });

  // 市町村入力確定時の処理
  areaInput.addEventListener("change", function () {
    const selectedArea = areaInput.value;
    regionInput.value = "";
    subAreaInput.value = "";
    regionList.innerHTML = "";
    subAreaList.innerHTML = "";
    subAreaContainer.style.display = "none";
    resultDiv.innerHTML = "";

    if (!selectedArea || !deliveryData[selectedArea]) {
      regionInput.disabled = true;
      return;
    }

    const data = deliveryData[selectedArea];
    // すべてのキー（"subAreas"除く）が「締め」を含む場合は、エリア入力は不要とする
    if (isSchedulingData(data)) {
      regionInput.value = "選択不要";
      regionInput.disabled = true;
    } else {
      // エリア候補（市町村直下のキー＝サブエリア名またはエリア名）を datalist に追加
      Object.keys(data).forEach(region => {
        const option = document.createElement("option");
        option.value = region;
        regionList.appendChild(option);
      });
      regionInput.disabled = false;
    }
  });

  // エリア入力確定時の処理（サブエリア候補がある場合）
  regionInput.addEventListener("change", function () {
    const selectedArea = areaInput.value;
    const selectedRegion = regionInput.value;
    subAreaInput.value = "";
    subAreaList.innerHTML = "";

    if (
      selectedRegion &&
      deliveryData[selectedArea] &&
      deliveryData[selectedArea][selectedRegion] &&
      deliveryData[selectedArea][selectedRegion].subAreas
    ) {
      Object.keys(deliveryData[selectedArea][selectedRegion].subAreas).forEach(sub => {
        const option = document.createElement("option");
        option.value = sub;
        subAreaList.appendChild(option);
      });
      subAreaContainer.style.display = "block";
    } else {
      subAreaContainer.style.display = "none";
    }
  });

  // 配送スケジュール表示用フォーマット関数
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
    const selectedArea = areaInput.value;
    let selectedRegion = regionInput.value;
    const selectedSubArea = subAreaInput.value;
    resultDiv.innerHTML = "";

    if (!selectedPrefecture || !selectedArea) {
      resultDiv.innerHTML = "<p>該当するデータがありません。</p>";
      return;
    }

    let scheduleData;
    // エリア入力が不要の場合
    if (regionInput.disabled) {
      scheduleData = deliveryData[selectedArea];
      resultDiv.innerHTML = `<div class="result-header">${selectedArea} の配送スケジュール</div>`;
    } else {
      if (selectedRegion && deliveryData[selectedArea][selectedRegion]) {
        scheduleData = deliveryData[selectedArea][selectedRegion];
        resultDiv.innerHTML = `<div class="result-header">${selectedRegion} の配送スケジュール</div>`;
      } else {
        resultDiv.innerHTML = "<p>該当するデータがありません。</p>";
        return;
      }
    }

    // サブエリアが選択され、かつ情報が存在する場合の処理
    if (selectedSubArea && scheduleData.subAreas && scheduleData.subAreas[selectedSubArea]) {
      let subData = scheduleData.subAreas[selectedSubArea];
      let scheduleHTML = `<div class="result-header">${selectedRegion} / ${selectedSubArea}</div>`;
      if (typeof subData === "string") {
        scheduleHTML += `<div class="result-card"><div class="result-item">${subData}</div></div>`;
      } else {
        for (let time in subData) {
          scheduleHTML += formatScheduleItem(time, subData[time]);
        }
      }
      resultDiv.innerHTML = scheduleHTML;
    } else {
      // スケジュール情報が直接ある場合
      if (typeof scheduleData === "string") {
        resultDiv.innerHTML += `<div class="result-card"><div class="result-item">${scheduleData}</div></div>`;
      } else {
        for (let time in scheduleData) {
          if (time === "subAreas") continue;
          if (typeof scheduleData[time] === "string") {
            resultDiv.innerHTML += `<div class="result-card"><div class="result-item">${scheduleData[time]}</div></div>`;
          } else {
            resultDiv.innerHTML += formatScheduleItem(time, scheduleData[time]);
          }
        }
      }
    }
  }

  window.searchSchedule = searchSchedule;
});
