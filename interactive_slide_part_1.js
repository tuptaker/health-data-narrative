// interactive_slide_part_2.js
function initCharts() {
    d3.select("#heartRateLineChart").selectAll("*").remove();
    d3.select("#heartRateLegend").selectAll("*").remove();

    const colorMap = {
    };

    const disabledTypes = new Set();

    let heartRateDataRaw, restingHeartRateDataRaw, keys;

    const tooltip = d3.select(".tooltip");

    const updateCharts = () => {
        d3.select("#heartRateLineChart").selectAll("*").remove();
        // TODO
    };

    // Load data first, then render
    Promise.all([
        d3.csv("./data/heart_rate.csv"),
        d3.csv("./data/resting_heart_rate.csv")
    ]).then(([linechartHeartRateCSV, linechartRestingHeartRateCSV]) => {
        // TODO
        // Create legend
        const legend = d3.select("#heartRateLegend");
        // keys.forEach(key => {
        //     // TODO
        // });

        updateCharts();
    });
}
