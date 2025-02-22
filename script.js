document.addEventListener("DOMContentLoaded", function () {
    const areaSelect = document.getElementById("area-select");
    const regionSelect = document.getElementById("region-select");
    const subAreaSelect = document.getElementById("sub-area-select");
    const resultDiv = document.getElementById("result");

    let deliveryData = {};
    let routeDeliveryData = {};

    // JSONファイル（自社便・路線便）のデータをロード
    async function loadDeliveryData() {
        try {
            const [tokyo23, tokyoShibu, routeDelivery] = await Promise.all([
                fetch("tokyo_23ku.json").then(res => res.json()),
                fetch("tokyo_shibu.json").then(res => res.json()),
                fetch("route_delivery.json").then(res => res.json())
            ]);
            // 自社便データを統合
            deliveryData = { ...tokyo23, ...tokyoShibu };
            // 路線便エリアのデータ（例：富岡、裏高尾町など）
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
        subAreaSelect.innerHTML = "<option value=''>サブエリアを選択してください</option>";
        subAreaSelect.disabled = true;

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

    // 地域選択時：対象地域（あきる野市、青梅市、西多摩郡日の出町、八王子市）の場合はサブエリア選択肢を更新
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
                subAreaSelect.disabled = false;
            } else {
                subAreaSelect.disabled = true;
            }
        } else {
            subAreaSelect.disabled = true;
        }
    });

    // 配送スケジュールを検索・表示
    function searchSchedule() {
        const selectedArea = areaSelect.value;
        const selectedRegion = regionSelect.value;
        const selectedSubArea = subAreaSelect.value;
        resultDiv.innerHTML = "";

        // サブエリアが選択されている場合
        if (selectedSubArea && deliveryData[selectedArea][selectedRegion].subAreas[selectedSubArea]) {
            let scheduleData = deliveryData[selectedArea][selectedRegion].subAreas[selectedSubArea];
            let schedule = `<h3>${selectedRegion} / ${selectedSubArea} の配送スケジュール</h3>`;
            for (let time in scheduleData) {
                let display = `${time}: 平日 - ${scheduleData[time]["平日"]}`;
                if (scheduleData[time]["土曜日"]) {
                    display += `, 土曜日 - ${scheduleData[time]["土曜日"]}`;
                }
                schedule += `<p>${display}</p>`;
            }
            resultDiv.innerHTML = schedule;
        } else if (selectedRegion in routeDeliveryData) {
            // 路線便エリアの場合（例：富岡、裏高尾町など）
            resultDiv.innerHTML = `<p style="color:red">${routeDeliveryData[selectedRegion]}</p>`;
        } else if (selectedArea && selectedRegion && deliveryData[selectedArea] && deliveryData[selectedArea][selectedRegion]) {
            // サブエリアがない場合の通常の自社便スケジュール
            let scheduleData = deliveryData[selectedArea][selectedRegion];
            let schedule = `<h3>${selectedRegion} の配送スケジュール</h3>`;
            for (let time in scheduleData) {
                if (time === "subAreas") continue; // サブエリア情報は除外
                let display = `${time}: 平日 - ${scheduleData[time]["平日"]}`;
                if (scheduleData[time]["土曜日"]) {
                    display += `, 土曜日 - ${scheduleData[time]["土曜日"]}`;
                }
                schedule += `<p>${display}</p>`;
            }
            resultDiv.innerHTML = schedule;
        } else {
            resultDiv.innerHTML = "<p>該当するデータがありません。</p>";
        }
    }

    // searchSchedule 関数をグローバルに公開
    window.searchSchedule = searchSchedule;
});
