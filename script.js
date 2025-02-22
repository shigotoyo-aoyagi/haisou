document.addEventListener("DOMContentLoaded", function () {
    const areaSelect = document.getElementById("area-select");
    const regionSelect = document.getElementById("region-select");
    const resultDiv = document.getElementById("result");

    let deliveryData = {};

    // JSONデータを読み込む
    fetch("delivery_data.json")
        .then(response => response.json())
        .then(data => {
            deliveryData = data;
        })
        .catch(error => console.error("データの読み込みに失敗しました", error));

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

        if (selectedArea && selectedRegion && deliveryData[selectedArea] && deliveryData[selectedArea][selectedRegion]) {
            let schedule = `<h3>${selectedRegion}の配送スケジュール</h3>`;
            for (let time in deliveryData[selectedArea][selectedRegion]) {
                schedule += `<p>${time}: ${deliveryData[selectedArea][selectedRegion][time]}</p>`;
            }
            resultDiv.innerHTML = schedule;
        } else {
            resultDiv.innerHTML = "<p>該当するデータがありません。</p>";
        }
    }

    window.searchSchedule = searchSchedule;
});
