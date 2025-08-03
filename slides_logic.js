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
            .attr("fill", "#f3ecad")
            .attr("stroke", "#4a4a49");

        pieGroup.append("text")
            .attr("x", -194)
            .attr("y", -178)
            .attr("fill", "#4a4a49")
            .text("Different kinds of workouts as")
            .style("font-size", "12px");

        pieGroup.append("text")
            .attr("x", -194)
            .attr("y", -162)
            .attr("fill", "#4a4a49")
            .text("a percentage of all workout")
            .style("font-size", "12px");

        pieGroup.append("text")
            .attr("x", -194)
            .attr("y", -148)
            .attr("fill", "#4a4a49")
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
            .attr("fill", "#f3ecad")
            .attr("stroke", "#4a4a49");

        barGroup.append("text")
            .attr("x", 408)
            .attr("y", 16)
            .attr("fill", "#4a4a49")
            .text("Total workouts by")
            .style("font-size", "12px");

        barGroup.append("text")
            .attr("x", 408)
            .attr("y", 32)
            .attr("fill", "#4a4a49")
            .text("type per year.")
            .style("font-size", "12px");

        barGroup.append("text")
            .attr("x", 408)
            .attr("y", 48)
            .attr("fill", "#4a4a49")
            .text("Note that walking,")
            .style("font-size", "12px");

        barGroup.append("text")
            .attr("x", 408)
            .attr("y", 64)
            .attr("fill", "#4a4a49")
            .text("running, and elliptical")
            .style("font-size", "12px");

        barGroup.append("text")
            .attr("x", 408)
            .attr("y", 80)
            .attr("fill", "#4a4a49")
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
    let annotationsVisible = true;
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

        const plotArea = g.append("g").attr("clip-path", "url(#clip)");

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

        const annotationGroup = g.append("g").attr("class", "resting-annotations");

        resting.forEach(d => {
            // Clear previous annotations if any
            annotationGroup.selectAll("*").remove();

            // Stagger logic: alternate vertical spacing
            const chartRight = chartWidth;
            const filtered = resting.filter(d => d.bpm > 70);
            const annotationSpacing = [-70, -110, -150]; // spaced more

            filtered.forEach((d, i) => {
                const x = xScale(d.creationDate);
                const y = yScale(d.bpm);

                const dx = -120;  // always right
                const dy = annotationSpacing[i % annotationSpacing.length];
                const rectWidth = 230;
                const rectHeight = 20;

                // Line
                annotationGroup.append("line")
                    .attr("x1", x)
                    .attr("y1", y)
                    .attr("x2", x + dx)
                    .attr("y2", y + dy + 10)
                    .attr("stroke", "black")
                    .attr("stroke-width", 1);

                // Background
                annotationGroup.append("rect")
                    .attr("x", x + dx)
                    .attr("y", y + dy)
                    .attr("width", rectWidth)
                    .attr("height", rectHeight)
                    .attr("rx", 6)
                    .attr("fill", "#f3ecad")
                    .attr("stroke", "#4a4a49");

                // Text
                annotationGroup.append("text")
                    .attr("x", x + dx + 5)
                    .attr("y", y + dy + 15)
                    .attr("text-anchor", "start")
                    .attr("font-size", 12)
                    .attr("fill", "#4a4a49")
                    .text(`Possible anomalous resting heart rate: ${d.bpm}`)
            });


        });

        // Zoom toggle
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
                annotationGroup.style("display", annotationsVisible ? "block" : "none");
                g.select(".brush").remove();
                brushing = false;
                toggleText.text("Enable Zoom");
                annotationsVisible = !annotationsVisible;
                annotationGroup.style("display", annotationsVisible ? "block" : "none");
                toggleAnnText.text(annotationsVisible ? "Hide Annotations" : "Show Annotations");
            });

        const controlY = margin.top;
        const toggleGroup = svg.append("g").attr("transform", `translate(${width - 150},${controlY})`).style("cursor", "pointer");
        toggleGroup.append("rect").attr("width", 120).attr("height", 24).attr("rx", 4).attr("fill", "#eee").attr("stroke", "#999");
        const toggleText = toggleGroup.append("text").attr("x", 60).attr("y", 16).attr("text-anchor", "middle").attr("font-size", 12).attr("fill", "#333").text("Enable Zoom");
        toggleGroup.on("click", () => {
            if (!brushing) {
                g.append("g").attr("class", "brush").call(brush);
                brushing = true;
                toggleText.text("Disable Zoom");
            } else {
                g.select(".brush").remove();
                brushing = false;
                toggleText.text("Enable Zoom");
            }
        });

        const resetGroup = svg.append("g").attr("transform", `translate(${width - 150},${controlY + 35})`).style("cursor", "pointer");
        resetGroup.append("rect").attr("width", 120).attr("height", 24).attr("rx", 4).attr("fill", "#eee").attr("stroke", "#999");
        resetGroup.append("text").attr("x", 60).attr("y", 16).attr("text-anchor", "middle").attr("font-size", 12).attr("fill", "#333").text("Reset Zoom");
        resetGroup.on("click", () => {
            xScale.domain(xExtent);
            xAxis.transition().duration(750).call(d3.axisBottom(xScale).ticks(6).tickFormat(d3.timeFormat("%b %Y")));
            circles.transition().duration(750).attr("cx", d => xScale(d.creationDate));
            linePath.transition().duration(750).attr("d", restingLine);
            annotationGroup.style("display", annotationsVisible ? "block" : "none");
        });

        const toggleAnnGroup = svg.append("g").attr("transform", `translate(${width - 150},${controlY + 70})`).style("cursor", "pointer");
        toggleAnnGroup.append("rect").attr("width", 120).attr("height", 24).attr("rx", 4).attr("fill", "#eee").attr("stroke", "#999");
        const toggleAnnText = toggleAnnGroup.append("text").attr("x", 60).attr("y", 16).attr("text-anchor", "middle").attr("font-size", 12).attr("fill", "#333").text("Hide Annotations");
        toggleAnnGroup.on("click", () => {
            annotationsVisible = !annotationsVisible;
            annotationGroup.style("display", annotationsVisible ? "block" : "none");
            toggleAnnText.text(annotationsVisible ? "Hide Annotations" : "Show Annotations");
        });

        // Legend
        const legendContainer = d3.select("#legend").html("").classed("legend-noninteractive", true).style("pointer-events", "none");
        [
            { label: "Heart Rate", color: colorMap.HeartRate },
            { label: "Resting Heart Rate", color: colorMap.RestingHeartRate },
        ].forEach(item => {
            const legendItem = legendContainer.append("div").attr("class", "legend-item");
            legendItem.append("div").attr("class", "legend-color").style("background-color", item.color);
            legendItem.append("div").text(item.label);
        });
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
        const allData = walkingData.map(d => ({ ...d, type: "Walking", color: colorMap.Walking }))
            .concat(runningData.map(d => ({ ...d, type: "Running", color: colorMap.Running })));

        const xExtent = d3.extent(allData, d => d.date);
        const yExtent = [0, d3.max(allData, d => d.distance)];

        let xScale = d3.scaleTime().domain(xExtent).range([0, chartWidth]);
        let yScale = d3.scaleLinear().domain(yExtent).range([chartHeight, 0]);

        const xAxis = g.append("g")
            .attr("transform", `translate(0,${chartHeight})`)
            .call(d3.axisBottom(xScale).ticks(6));

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
            .text("distance (mi)");

        const pointsGroup = g.append("g");
        const updatePoints = () => {
            const circles = pointsGroup.selectAll("circle").data(allData);
            circles.enter()
                .append("circle")
                .merge(circles)
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
            circles.exit().remove();
        };

        updatePoints();

        const annotationGroup = g.append("g").attr("class", "annotations");
        function renderAnnotations() {
            annotationGroup.selectAll("*").remove();
            const annotated = runningData.filter(d => d.distance > 11);

            annotated.forEach((d) => {
                const x = xScale(d.date);
                const y = yScale(d.distance);
                annotationGroup.append("circle")
                    .attr("cx", x)
                    .attr("cy", y)
                    .attr("r", 6)
                    .attr("fill", "none")
                    .attr("stroke", "black")
                    .attr("stroke-width", 1.2);
            });

            const boxX = chartWidth - 450;
            const boxY = 50;

            const textBox = annotationGroup.append("g");
            textBox.append("rect")
                .attr("x", 50)
                .attr("y", 15)
                .attr("rx", 6)
                .attr("ry", 6)
                .attr("width", 365)
                .attr("height", 32)
                .attr("fill", "#f3ecad")
                .attr("stroke", "#4a4a49");

            textBox.append("text")
                .attr("x", 76)
                .attr("y", 35)
                .attr("fill", "#4a4a49")
                .style("font-size", "12px")
                .text("Runs over 11 miles may be counting errors in data processing.");

            textBox.append("circle")
                .attr("cx", 65)
                .attr("cy", 30)
                .attr("r", 6)
                .attr("fill", "white")
                .attr("stroke", "black")
                .attr("stroke-width", 1.5)

            textBox.append("circle")
                .attr("cx", 65)
                .attr("cy", 30)
                .attr("r", 3)
                .attr("fill", colorMap.Running);
        }

        let annotationsVisible = true;
        renderAnnotations();

        let brushing = false;
        const brush = d3.brushX()
            .extent([[0, 0], [chartWidth, chartHeight]])
            .on("end", (event) => {
                if (!event.selection) return;
                const [x0, x1] = event.selection.map(xScale.invert);
                xScale.domain([x0, x1]);
                xAxis.transition().duration(500).call(d3.axisBottom(xScale).ticks(6));
                updatePoints();
                g.select(".brush").remove();
                brushing = false;
                zoomText.text("Enable Zoom");
                annotationsVisible = false;
                annotationGroup.style("display", "none");
                annotationText.text("Show Annotations");
            });

        const controls = svg.append("g").attr("transform", `translate(${width - 500},${margin.top})`);

        function addControlButton(xOffset, label, callback) {
            const btn = controls.append("g")
                .attr("transform", `translate(${xOffset}, 0)`)
                .style("cursor", "pointer")
                .on("click", callback);

            btn.append("rect")
                .attr("width", 130)
                .attr("height", 24)
                .attr("rx", 4)
                .attr("fill", "#eee")
                .attr("stroke", "#999");

            return btn.append("text")
                .attr("x", 65)
                .attr("y", 16)
                .attr("text-anchor", "middle")
                .attr("font-size", 12)
                .attr("fill", "#333")
                .text(label);
        }

        const zoomText = addControlButton(0, "Enable Zoom", () => {
            if (!brushing) {
                g.append("g").attr("class", "brush").call(brush);
                brushing = true;
                zoomText.text("Disable Zoom");
            } else {
                g.select(".brush").remove();
                brushing = false;
                zoomText.text("Enable Zoom");
            }
        });

        addControlButton(140, "Reset Zoom", () => {
            xScale.domain(xExtent);
            xAxis.transition().duration(750).call(d3.axisBottom(xScale).ticks(6));
            updatePoints();
            annotationsVisible = true;
            annotationGroup.style("display", "inline");
            annotationText.text("Hide Annotations");
        });

        const annotationText = addControlButton(280, "Hide Annotations", () => {
            annotationsVisible = !annotationsVisible;
            annotationGroup.style("display", annotationsVisible ? "inline" : "none");
            annotationText.text(annotationsVisible ? "Hide Annotations" : "Show Annotations");
        });

        const legendContainer = d3.select("#legend");
        legendContainer.html("");

        [
            { label: "Running", color: colorMap.Running },
            { label: "Walking", color: colorMap.Walking },
        ].forEach(item => {
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
