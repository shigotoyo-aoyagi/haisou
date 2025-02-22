document.addEventListener("DOMContentLoaded", function () {
    const areaSelect = document.getElementById("area-select");
    const regionSelect = document.getElementById("region-select");
    const resultDiv = document.getElementById("result");

    let deliveryData = {};
    let routeDeliveryData = {};

    // 各JSONファイルをロード
    async function loadDeliveryData() {
        try {
            const [tokyo23, tokyoShibu, routeDelivery] = await Promise.all([
                fetch("tokyo_23ku.json").then(res => res.json()),
                fetch("tokyo_shibu.json").then(res => res.json()),
                fetch("route_delivery.json").then(res => res.json())
            ]);

            // データを統合
            deliveryData = { ...tokyo23, ...tokyoShibu };
            routeDeliveryData = routeDelivery["路線便エリア"];
        } catch (error) {
            console.error("データの読み込みに失敗しました", error);
        }
    }

    loadDeliveryData();

    // エリア選択時に地域の選択肢を更新
    areaSelect.addEventListener("change", function () {
        const selectedArea = areaSelect.value;
        regionSelect.innerHTML = "<option value=''>地域を選択してください</option>";

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

    // 配送スケジュールを検索
    function searchSchedule() {
        const selectedArea = areaSelect.value;
        const selectedRegion = regionSelect.value;
        resultDiv.innerHTML = "";

        if (selectedRegion in routeDeliveryData) {
            resultDiv.innerHTML = `<p style="color:red">${routeDeliveryData[selectedRegion]}</p>`;
        } else if (selectedArea && selectedRegion && deliveryData[selectedArea] && deliveryData[selectedArea][selectedRegion]) {
            let schedule = `<h3>${selectedRegion}の配送スケジュール</h3>`;
            for (let time in deliveryData[selectedArea][selectedRegion]) {
                const scheduleData = deliveryData[selectedArea][selectedRegion][time];
                schedule += `<p>${time}: 平日 - ${scheduleData["平日"]}, 土曜日 - ${scheduleData["土曜日"]}</p>`;
            }
            resultDiv.innerHTML = schedule;
        } else {
            resultDiv.innerHTML = "<p>該当するデータがありません。</p>";
        }
    }

    // searchSchedule 関数をグローバルに公開
    window.searchSchedule = searchSchedule;
});
