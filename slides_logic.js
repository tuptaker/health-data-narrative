const colorMap = {
    Walking: "#4e79a7",
    Elliptical: "#f28e2b",
    Running: "#e15759",
    FunctionalStrengthTraining: "#76b7b2",
    Swimming: "#59a14f",
    Other: "#edc948",
    Cycling: "#b07aa1",
    UnderwaterDiving: "#ff9da7",
    HeartRate: "#2bbadc",
    RestingHeartRate: "#9d68ea"
};

function initSlide0() {
    d3.select("#donutChart").selectAll("*").remove();
    d3.select("#stackedBarChart").selectAll("*").remove();
    d3.select("#legend").selectAll("*").remove();

    const disabledTypes = new Set();
    let pieDataRaw, stackedDataRaw, keys;
    const tooltip = d3.select(".tooltip");

    let pieAnnotationsVisible = true;

    function toggleAnnotations(forceHide = false) {
        pieAnnotationsVisible = forceHide ? false : !pieAnnotationsVisible;
        d3.selectAll(".annotation-group")
            .style("display", pieAnnotationsVisible ? "block" : "none");
        d3.select("#annotationToggleBtn")
            .text(pieAnnotationsVisible ? "Hide Annotations" : "Show Annotations");
    }

    const chartsContainer = document.querySelector(".charts-container");
    if (chartsContainer && !document.getElementById("annotationToggleBtn")) {
        const button = document.createElement("button");
        button.id = "annotationToggleBtn";
        button.innerText = "Hide Annotations";
        button.style.position = "absolute";
        button.style.top = "10px";
        button.style.right = "10px";
        button.style.zIndex = "10";
        button.onclick = () => toggleAnnotations();

        chartsContainer.style.position = "relative";
        chartsContainer.appendChild(button);
    }

    const updateCharts = () => {
        d3.select("#donutChart").selectAll("*").remove();
        d3.select("#stackedBarChart").selectAll("*").remove();

        // Define arrow marker
        d3.select("svg defs").remove();
        const defs = d3.select("#donutChart").append("defs");
        defs.append("marker")
            .attr("id", "arrow")
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 5)
            .attr("refY", 0)
            .attr("markerWidth", 4)
            .attr("markerHeight", 4)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M0,-5L10,0L0,5")
            .attr("fill", "black");

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

        // Custom pie annotation (elbowed arrow to top-left)
        const pieGroup = svgPie.append("g").attr("class", "annotation-group");

        pieGroup.append("path")
            .attr("d", "M 0 0 L -60 -100 L -140 -132")
            .attr("stroke", "black")
            .attr("fill", "none")
            .attr("marker-end", "url(#arrow)");

        pieGroup.append("rect")
            .attr("x", -200)
            .attr("y", -200)
            .attr("width", 172)
            .attr("height", 66)
            .attr("rx", 8)
            .attr("ry", 8)
            .attr("fill", "#f9f9f9")
            .attr("stroke", "black");

        pieGroup.append("text")
            .attr("x", -194)
            .attr("y", -178)
            .text("Different kinds of workouts as")
            .style("font-size", "12px");

        pieGroup.append("text")
            .attr("x", -194)
            .attr("y", -162)
            .text("a percentage of all workout")
            .style("font-size", "12px");

        pieGroup.append("text")
            .attr("x", -194)
            .attr("y", -148)
            .text("sessions since 2017.")
            .style("font-size", "12px");

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
            .domain([0, d3.max(stackedDataRaw, d => d3.sum(filteredKeys, k => +d[k]))])
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

        // Custom bar annotation (elbowed arrow to top-right)
        const barGroup = svgBar.append("g").attr("class", "annotation-group");

        barGroup.append("path")
            .attr("d", "M 320 100 L 360 20 L 400 10")
            .attr("stroke", "black")
            .attr("fill", "none")
            .attr("marker-end", "url(#arrow)");

        barGroup.append("rect")
            .attr("x", 402)
            .attr("y", -5)
            .attr("width", 126)
            .attr("height", 100)
            .attr("rx", 8)
            .attr("ry", 8)
            .attr("fill", "#f9f9f9")
            .attr("stroke", "black");

        barGroup.append("text")
            .attr("x", 408)
            .attr("y", 16)
            .text("Total workouts by")
            .style("font-size", "12px");

        barGroup.append("text")
            .attr("x", 408)
            .attr("y", 32)
            .text("type per year.")
            .style("font-size", "12px");

        barGroup.append("text")
            .attr("x", 408)
            .attr("y", 48)
            .text("Note that walking,")
            .style("font-size", "12px");

        barGroup.append("text")
            .attr("x", 408)
            .attr("y", 64)
            .text("running, and elliptical")
            .style("font-size", "12px");

        barGroup.append("text")
            .attr("x", 408)
            .attr("y", 80)
            .text("are the most frequent.")
            .style("font-size", "12px");

        if (!pieAnnotationsVisible) toggleAnnotations(true);
    };

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

        const legend = d3.select("#legend");
        keys.forEach(key => {
            const item = legend.append("div")
                .attr("class", "legend-item")
                .attr("data-key", key);

            item.append("div")
                .attr("class", "legend-color")
                .style("background-color", colorMap[key]);

            item.append("div").text(key);

            item.on("click", function() {
                if (disabledTypes.has(key)) {
                    disabledTypes.delete(key);
                    d3.select(this).classed("disabled", false);
                } else {
                    disabledTypes.add(key);
                    d3.select(this).classed("disabled", true);
                }
                toggleAnnotations(true);
                updateCharts();
            });
        });

        updateCharts();
    });
}


function initSlide0Old() {
    d3.select("#donutChart").selectAll("*").remove();
    d3.select("#stackedBarChart").selectAll("*").remove();
    d3.select("#legend").selectAll("*").remove();

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

function initSlide1() {
    const svg = d3.select("#heartRateLineChart");
    svg.selectAll("*").remove();

    const width = 1000;
    const height = 400;
    const margin = { top: 20, right: 30, bottom: 40, left: 60 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    svg.attr("width", width).attr("height", height);

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
    const tooltip = d3.select(".tooltip");

    const cutoffDate = new Date("2021-09-07");
    document.getElementById("loading").style.display = "block";

    Promise.all([
        d3.csv("./data/heart_rate.csv", d => ({
            creationDate: new Date(d.creationDate),
            bpm: +d.value
        })),
        d3.csv("./data/resting_heart_rate.csv", d => ({
            creationDate: new Date(d.creationDate),
            bpm: +d.value
        }))
    ]).then(([heartData, restingData]) => {
        const heart = heartData.filter(d => d.creationDate >= cutoffDate).filter((_, i) => i % 10 === 0);
        const resting = restingData.filter(d => d.creationDate >= cutoffDate).filter((_, i) => i % 2 === 0);

        const all = heart.concat(resting);
        const xExtent = d3.extent(all, d => d.creationDate);
        const yExtent = d3.extent(all, d => d.bpm);

        let xScale = d3.scaleTime().domain(xExtent).range([0, chartWidth]);
        const yScale = d3.scaleLinear().domain([Math.floor(yExtent[0] - 5), Math.ceil(yExtent[1] + 5)]).range([chartHeight, 0]);

        const xAxis = g.append("g")
            .attr("transform", `translate(0, ${chartHeight})`)
            .call(d3.axisBottom(xScale).ticks(6).tickFormat(d3.timeFormat("%b %Y")));

        const yAxis = g.append("g").call(d3.axisLeft(yScale).ticks(6));

        g.append("text")
            .attr("x", chartWidth / 2)
            .attr("y", chartHeight + 35)
            .attr("fill", "black")
            .attr("text-anchor", "middle")
            .text("time");

        g.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -chartHeight / 2)
            .attr("y", -45)
            .attr("fill", "black")
            .attr("text-anchor", "middle")
            .text("beats per minute");

        const plotArea = g.append("g")
            .attr("clip-path", "url(#clip)");

        const circles = plotArea.selectAll("circle")
            .data(heart)
            .enter()
            .append("circle")
            .attr("cx", d => xScale(d.creationDate))
            .attr("cy", d => yScale(d.bpm))
            .attr("r", 2)
            .attr("fill", colorMap.HeartRate)
            .on("mouseover", function (event, d) {
                const bounds = this.getBoundingClientRect();
                tooltip
                    .style("opacity", 1)
                    .style("left", `${bounds.left + bounds.width / 2}px`)
                    .style("top", `${bounds.top - 30}px`)
                    .html(`Heart Rate: ${d.bpm} bpm<br>${d.creationDate.toLocaleString()}`);
            })
            .on("mouseout", () => tooltip.style("opacity", 0));

        const restingLine = d3.line()
            .curve(d3.curveMonotoneX)
            .defined(d => !isNaN(d.bpm))
            .x(d => xScale(d.creationDate))
            .y(d => yScale(d.bpm));

        const linePath = plotArea.append("path")
            .datum(resting)
            .attr("fill", "none")
            .attr("stroke", colorMap.RestingHeartRate)
            .attr("stroke-width", 1.5)
            .attr("d", restingLine);

        // Brush setup
        let brushing = false;
        const brush = d3.brushX()
            .extent([[0, 0], [chartWidth, chartHeight]])
            .on("start", function () {
                d3.select(this).select(".overlay").attr("fill", "transparent");
                d3.select(this).select(".selection").attr("fill", "rgba(100,100,100,0.2)");
            })
            .on("end", (event) => {
                if (!event.selection) return;

                const [x0, x1] = event.selection.map(xScale.invert);
                xScale.domain([x0, x1]);

                xAxis.transition().duration(750).call(d3.axisBottom(xScale).ticks(6).tickFormat(d3.timeFormat("%b %Y")));
                circles.transition().duration(750).attr("cx", d => xScale(d.creationDate));
                linePath.transition().duration(750).attr("d", restingLine);

                g.select(".brush").remove();
                brushing = false;
                toggleText.text("Enable Zoom");
            });

        // Toggle zoom button
        const toggleGroup = svg.append("g")
            .attr("transform", `translate(${width - 150},${margin.top})`)
            .style("cursor", "pointer");

        toggleGroup.append("rect")
            .attr("width", 120)
            .attr("height", 24)
            .attr("rx", 4)
            .attr("fill", "#eee")
            .attr("stroke", "#999");

        const toggleText = toggleGroup.append("text")
            .attr("x", 60)
            .attr("y", 16)
            .attr("text-anchor", "middle")
            .attr("font-size", 12)
            .attr("fill", "#333")
            .text("Enable Zoom");

        toggleGroup.on("click", () => {
            if (!brushing) {
                const brushG = g.append("g")
                    .attr("class", "brush")
                    .call(brush);
                brushing = true;
                toggleText.text("Disable Zoom");
            } else {
                g.select(".brush").remove();
                brushing = false;
                toggleText.text("Enable Zoom");
            }
        });

        // Reset zoom button
        const resetGroup = svg.append("g")
            .attr("transform", `translate(${width - 150},${margin.top + 35})`)
            .style("cursor", "pointer");

        resetGroup.append("rect")
            .attr("width", 120)
            .attr("height", 24)
            .attr("rx", 4)
            .attr("fill", "#eee")
            .attr("stroke", "#999");

        resetGroup.append("text")
            .attr("x", 60)
            .attr("y", 16)
            .attr("text-anchor", "middle")
            .attr("font-size", 12)
            .attr("fill", "#333")
            .text("Reset Zoom");

        resetGroup.on("click", () => {
            xScale.domain(xExtent);
            xAxis.transition().duration(750).call(d3.axisBottom(xScale).ticks(6).tickFormat(d3.timeFormat("%b %Y")));
            circles.transition().duration(750).attr("cx", d => xScale(d.creationDate));
            linePath.transition().duration(750).attr("d", restingLine);
        });

        // Legend (non-interactive)
        const legendContainer = d3.select("#legend");
        legendContainer.html(""); // clear any existing content

        const legendItems = [
            { label: "Heart Rate", color: colorMap.HeartRate },
            { label: "Resting Heart Rate", color: colorMap.RestingHeartRate },
        ];

        legendItems.forEach(item => {
            const legendItem = legendContainer.append("div")
                .attr("class", "legend-item");

            legendItem.append("div")
                .attr("class", "legend-color")
                .style("background-color", item.color);

            legendItem.append("div").text(item.label);
        });

        legendContainer
            .classed("legend-noninteractive", true)
            .style("pointer-events", "none");

    }).catch(err => {
        console.error("Error loading data:", err);
        d3.select("#slideContainer").append("div").text("Failed to load heart rate data.");
    }).finally(() => {
        document.getElementById("loading").style.display = "none";
    });
}

function initSlide2() {
    console.log('loading slide 2');
    const svg = d3.select("#walkRunDetails");
    svg.selectAll("*").remove();

    const width = 1000;
    const height = 400;
    const margin = { top: 20, right: 30, bottom: 40, left: 60 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    svg.attr("width", width).attr("height", height);
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
    const tooltip = d3.select(".tooltip");

    document.getElementById("loading").style.display = "block";

    const parseDate = d3.timeParse("%Y-%m-%d");
    Promise.all([
        d3.csv("./data/walking_details_by_day.csv", d => ({
            date: parseDate(d.date.trim()),
            distance: +d.distance || 0
        })),
        d3.csv('./data/running_details_by_day.csv', d => ({
            date: parseDate(d.date.trim()),
            distance: +d.distance || 0
        }))
    ]).then(([walkingData, runningData]) => {
        const allDates = walkingData.map(d => d.date).concat(runningData.map(d => d.date));
        const allDistances = walkingData.map(d => d.distance).concat(runningData.map(d => d.distance));
        console.log("Sample parsed dates:", walkingData.slice(0, 5).map(d => d.date));

        const xScale = d3.scaleTime()
            .domain(d3.extent(allDates))
            .range([0, chartWidth]);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(allDistances)])
            .range([chartHeight, 0]);

        const xAxis = d3.axisBottom(xScale).ticks(6).tickFormat(d => {
            const formatMonthDay = d3.timeFormat("%b %d");
            const formatYear = d3.timeFormat("%Y");
            return d.getMonth() === 0 && d.getDate() === 1
                ? formatYear(d) : formatMonthDay(d);
        })
        ;
        const yAxis = d3.axisLeft(yScale).ticks(6);

        g.append("g")
            .attr("transform", `translate(0,${chartHeight})`)
            .call(xAxis);

        g.append("g")
            .call(yAxis);

        // Axis labels
        g.append("text")
            .attr("x", chartWidth / 2)
            .attr("y", chartHeight + 35)
            .attr("fill", "black")
            .attr("text-anchor", "middle")
            .text("time");

        g.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -chartHeight / 2)
            .attr("y", -45)
            .attr("fill", "black")
            .attr("text-anchor", "middle")
            .text("distance (mi)");

        const area = d3.area()
            .x(d => xScale(d.date))
            .y0(chartHeight)
            .y1(d => yScale(d.distance))
            .curve(d3.curveMonotoneX);

        g.append("path")
            .datum(runningData)
            .attr("fill", colorMap.Running)
            .attr("d", area)
            .attr("opacity", 0.6);

        g.append("path")
            .datum(walkingData)
            .attr("fill", "##1f77b4")
            .attr("d", area)
            .attr("opacity", 0.6);

        // Tooltip points
        const allData = walkingData.map(d => ({ ...d, type: "Walking", color: colorMap.Walking }))
            .concat(runningData.map(d => ({ ...d, type: "Running", color: colorMap.Running })));

        g.selectAll(".dot")
            .data(allData)
            .enter()
            .append("circle")
            .attr("cx", d => xScale(d.date))
            .attr("cy", d => yScale(d.distance))
            .attr("r", 3)
            .attr("fill", d => d.color)
            .on("mouseover", function (event, d) {
                const bounds = this.getBoundingClientRect();
                tooltip
                    .style("opacity", 1)
                    .style("left", `${bounds.left + bounds.width / 2}px`)
                    .style("top", `${bounds.top - 30}px`)
                    .html(`${d.type} Distance: ${d.distance.toFixed(2)} mi<br>${d3.timeFormat("%B %d, %Y")(d.date)}`);
            })
            .on("mouseout", () => tooltip.style("opacity", 0));

        // Legend (non-interactive)
        const legendContainer = d3.select("#legend");
        legendContainer.html(""); // clear any existing content

        const legendItems = [
            { label: "Running", color: colorMap.Running },
            { label: "Walking", color: colorMap.Walking },
        ];

        legendItems.forEach(item => {
            const legendItem = legendContainer.append("div")
                .attr("class", "legend-item");

            legendItem.append("div")
                .attr("class", "legend-color")
                .style("background-color", item.color);

            legendItem.append("div").text(item.label);
        });

        legendContainer
            .classed("legend-noninteractive", true)
            .style("pointer-events", "none");

    }).catch(err => {
        console.error("Error loading data:", err);
        d3.select("#slideContainer").append("div").text("Failed to load running and walking data.");
    }).finally(() => {
        document.getElementById("loading").style.display = "none";
    });
}
