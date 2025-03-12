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
    const truck = document.querySelector(".truck");

    if (!truck) return;

    // 画面幅を **固定値として取得**
    const screenWidth = window.innerWidth; 
    const truckWidth = truck.getBoundingClientRect().width; // トラックの実際の幅

    // 初期位置をセット
    truck.style.transition = "none";
    truck.style.transform = "translateX(-200px)"; // 画面外に設定

    setTimeout(() => {
      // 走るアニメーションを適用
      truck.style.transition = "transform 6s linear";
      truck.style.transform = `translateX(${screenWidth + truckWidth}px)`; // 画面の外まで走る
    }, 500); // 0.5秒後に発動
  }

  // **ランダムで20回に1回トラックを走らせる**
  if (Math.random() < 1 / 20) {
    startTruckAnimation();
  }

  // **配送検索の際にデータを表示**
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
    if (regionSelect.disabled) {
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

    // サブエリアが選択され、かつサブエリア情報が存在する場合の処理
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
