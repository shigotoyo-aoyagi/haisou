document.addEventListener("DOMContentLoaded", function () {
    const areaSelect = document.getElementById("area-select");
    const regionSelect = document.getElementById("region-select");
    const subAreaContainer = document.getElementById("sub-area-container");
    const subAreaSelect = document.getElementById("sub-area-select");
    const resultDiv = document.getElementById("result");

    let deliveryData = {};
    let routeDeliveryData = {};

    // JSONファイル（自社便・路線便）のデータをロード
    async function loadDeliveryData() {
        try {
            const [tokyoData, routeDelivery] = await Promise.all([
                fetch("tokyo.json").then(res => res.json()),
                fetch("route_delivery.json").then(res => res.json())
            ]);
            deliveryData = tokyoData;
            routeDeliveryData = routeDelivery["路線便エリア"];
        } catch (error) {
            console.error("データの読み込みに失敗しました", error);
        }
    }
    loadDeliveryData();

    // エリア選択時：地域とサブエリアの選択肢を初期化して更新
    areaSelect.addEventListener("change", function () {
        const selectedArea = areaSelect.value;
        regionSelect.innerHTML = "<option value=''>地域を選択してください</option>";
        // サブエリアは初期状態で非表示にする
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

    // 地域選択時：対象地域（あきる野市、青梅市、西多摩郡日の出町、八王子市）の場合はサブエリア選択肢を更新＆表示
    regionSelect.addEventListener("change", function () {
        const selectedArea = areaSelect.value;
        const selectedRegion = regionSelect.value;
        subAreaSelect.innerHTML = "<option value=''>サブエリアを選択してください</option>";

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

    // 配送スケジュールを検索・表示（結果をカード形式で出力）
    function searchSchedule() {
        const selectedArea = areaSelect.value;
        const selectedRegion = regionSelect.value;
        const selectedSubArea = subAreaSelect.value;
        resultDiv.innerHTML = "";

        if (selectedSubArea && deliveryData[selectedArea][selectedRegion].subAreas[selectedSubArea]) {
            let scheduleData = deliveryData[selectedArea][selectedRegion].subAreas[selectedSubArea];
            let scheduleHTML = `<div class="result-header">${selectedRegion} / ${selectedSubArea} の配送スケジュール</div>`;
            for (let time in scheduleData) {
                let display = `<strong>${time}</strong>: 平日 - ${scheduleData[time]["平日"]}`;
                if (scheduleData[time]["土曜日"]) {
                    display += `, 土曜日 - ${scheduleData[time]["土曜日"]}`;
                }
                scheduleHTML += `<div class="result-card"><div class="result-item">${display}</div></div>`;
            }
            resultDiv.innerHTML = scheduleHTML;
        } else if (selectedRegion in routeDeliveryData) {
            resultDiv.innerHTML = `<div class="result-header">路線便エリア</div>
                                   <div class="result-card"><div class="result-item" style="color:red">${routeDeliveryData[selectedRegion]}</div></div>`;
        } else if (selectedArea && selectedRegion && deliveryData[selectedArea] && deliveryData[selectedArea][selectedRegion]) {
            let scheduleData = deliveryData[selectedArea][selectedRegion];
            let scheduleHTML = `<div class="result-header">${selectedRegion} の配送スケジュール</div>`;
            for (let time in scheduleData) {
                if (time === "subAreas") continue; // サブエリア情報は除外
                let display = `<strong>${time}</strong>: 平日 - ${scheduleData[time]["平日"]}`;
                if (scheduleData[time]["土曜日"]) {
                    display += `, 土曜日 - ${scheduleData[time]["土曜日"]}`;
                }
                scheduleHTML += `<div class="result-card"><div class="result-item">${display}</div></div>`;
            }
            resultDiv.innerHTML = scheduleHTML;
        } else {
            resultDiv.innerHTML = "<p>該当するデータがありません。</p>";
        }
    }

    window.searchSchedule = searchSchedule;
});
