// interactive_slide_part_1.js
function initCharts() {
    d3.select("#donutChart").selectAll("*").remove();
    d3.select("#stackedBarChart").selectAll("*").remove();
    d3.select("#legend").selectAll("*").remove();

    const colorMap = {
        Walking: "#4e79a7",
        Elliptical: "#f28e2b",
        Running: "#e15759",
        FunctionalStrengthTraining: "#76b7b2",
        Swimming: "#59a14f",
        Other: "#edc948",
        Cycling: "#b07aa1",
        UnderwaterDiving: "#ff9da7"
    };

    const disabledTypes = new Set();

    let pieDataRaw, stackedDataRaw, keys;

    const tooltip = d3.select(".tooltip");

    const updateCharts = () => {
        d3.select("#donutChart").selectAll("*").remove();
        d3.select("#stackedBarChart").selectAll("*").remove();

        // Filtered pie data
        const filteredPie = pieDataRaw.filter(d => !disabledTypes.has(d.label));

        const pie = d3.pie().value(d => d.value)(filteredPie);
        const arc = d3.arc().innerRadius(100).outerRadius(180);
        const svgPie = d3.select("#donutChart")
            .append("g")
            .attr("transform", "translate(200,200)");

        svgPie.selectAll("path")
            .data(pie)
            .enter()
            .append("path")
            .attr("d", arc)
            .attr("fill", d => colorMap[d.data.label])
            .on("mousemove", (event, d) => {
                const total = d3.sum(filteredPie, d => d.value);
                const percent = ((d.data.value / total) * 100).toFixed(1);
                tooltip
                    .style("opacity", 1)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px")
                    .html(`<strong>${d.data.label}</strong><br/>${percent}%`);
            })
            .on("mouseout", () => tooltip.style("opacity", 0));

        // Filtered stacked data
        const filteredKeys = keys.filter(k => !disabledTypes.has(k));
        const stackedData = d3.stack().keys(filteredKeys)(stackedDataRaw);

        const margin = { top: 20, right: 20, bottom: 30, left: 40 },
            width = 600 - margin.left - margin.right,
            height = 400 - margin.top - margin.bottom;

        const svgBar = d3.select("#stackedBarChart")
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const x = d3.scaleBand()
            .domain(stackedDataRaw.map(d => d.year))
            .range([0, width])
            .padding(0.1);

        const y = d3.scaleLinear()
            .domain([0, d3.max(stackedDataRaw, d => {
                return d3.sum(filteredKeys, k => +d[k]);
            })])
            .nice()
            .range([height, 0]);

        svgBar.selectAll("g")
            .data(stackedData)
            .enter().append("g")
            .attr("fill", d => colorMap[d.key])
            .selectAll("rect")
            .data(d => d)
            .enter().append("rect")
            .attr("x", d => x(d.data.year))
            .attr("y", d => y(d[1]))
            .attr("height", d => y(d[0]) - y(d[1]))
            .attr("width", x.bandwidth())
            .on("mousemove", (event, d) => {
                const key = d3.select(event.target.parentNode).datum().key;
                tooltip
                    .style("opacity", 1)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px")
                    .html(`<strong>${key}</strong><br/>Count: ${d.data[key]}`);
            })
            .on("mouseout", () => tooltip.style("opacity", 0));

        svgBar.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x));

        svgBar.append("g").call(d3.axisLeft(y));
    };

    // Load data first, then render
    Promise.all([
        d3.csv("./data/breakout_by_workout_type.csv"),
        d3.csv("./data/activity_summary_by_year.csv")
    ]).then(([pieCSV, barCSV]) => {
        pieDataRaw = pieCSV.map(d => ({
            label: d.workoutActivityType,
            value: +d.count
        }));

        stackedDataRaw = barCSV.map(d => {
            d.year = d.year;
            for (const key in d) {
                if (key !== "year") d[key] = +d[key];
            }
            return d;
        });

        keys = barCSV.columns.slice(1);

        // Create legend
        const legend = d3.select("#legend");
        keys.forEach(key => {
            const shortLabel = key;
            const item = legend.append("div")
                .attr("class", "legend-item")
                .attr("data-key", key);

            item.append("div")
                .attr("class", "legend-color")
                .style("background-color", colorMap[shortLabel]);

            item.append("div").text(shortLabel);

            item.on("click", function() {
                if (disabledTypes.has(shortLabel)) {
                    disabledTypes.delete(shortLabel);
                    d3.select(this).classed("disabled", false);
                } else {
                    disabledTypes.add(shortLabel);
                    d3.select(this).classed("disabled", true);
                }
                updateCharts();
            });
        });

        updateCharts();
    });
}
