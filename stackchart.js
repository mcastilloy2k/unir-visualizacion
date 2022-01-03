function prepareFiltersStack() {
    
    console.log("daafasdf")
    let since = 1994
    to = 2020;

    for (let i = since; i <= to; i++) {
        $('#init_date_stack').append($('<option>', {
            value: i,
            text: i
        }));
        $('#finish_date_stack').append($('<option>', {
            value: i,
            text: i
        }));
    }

    //Genera la lista de empresas para agregar al filtro desde la fuente CSV
    let empresas = [];
    d3.csv('datos.csv').then(function (datos) {
        //Agrega cada nombre de empresa unico a un array y luego lo ordena
        datos.forEach(d => {
            let nombre = d['Nombre'].trim();
            if (!empresas.includes(nombre)) {
                empresas.push(nombre);
            }
        });
        empresas.sort();

        //Agrega las empresas al componente de filtro
        empresas.forEach(e => {
            $('#filter_stack').append($('<option>', {
                value: e,
                text: e
            }));
        });

        $('#filter_stack').val(['AMERICA MOVIL PERU', 'ENTEL PERU', 'TELEFONICA DEL PERU', 'VIETTEL PERU', 'DIRECTV PERU', 'CENTURYLINK PERU','OPTICAL NETWORKS','AMERICATEL PERU']);
    });


    $("#init_date_stack").val(1994);
    $("#finish_date_stack").val(2020);
    $("#btn_graficar_stacked").on('click', plotStackedGraph());
    
}

function plotStackedGraph() {
    // set the dimensions and margins of the graph
    const margin = { top: 60, right: 230, bottom: 50, left: 100 },
        width = 1000 - margin.left - margin.right,
        height = 600 - margin.top - margin.bottom;

    $("#container-stacked-chart svg").remove()

    // append the svg object to the body of the page
    const svg = d3.select("#container-stacked-chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            `translate(${margin.left}, ${margin.top})`);

    // Parse the Data
    d3.csv("datos-columnas.csv").then(function (data) {

        //////////
        // GENERAL //
        //////////

        // List of groups = header of the csv files
        //const keys = data.columns.slice(1)
        keys = ['AMERICA MOVIL PERU', 'ENTEL PERU', 'TELEFONICA DEL PERU', 'VIETTEL PERU', 'DIRECTV PERU', 'CENTURYLINK PERU','OPTICAL NETWORKS','AMERICATEL PERU'];

        // color palette
        const color = d3.scaleOrdinal()
            .domain(keys)
            .range(d3.schemeSet2);

        //stack the data?
        const stackedData = d3.stack()
            .keys(keys)
            (data)

        console.log(stackedData)



        //////////
        // AXIS //
        //////////

        // Add X axis
        const x = d3.scaleLinear()
            .domain(d3.extent(data, function (d) { return d.year; }))
            .range([0, width]);
        const xAxis = svg.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(x).ticks(5))

        // Add X axis label:
        svg.append("text")
            .attr("text-anchor", "end")
            .attr("x", width)
            .attr("y", height + 40)
            .text("Año");

        // Add Y axis label:
        svg.append("text")
            .attr("text-anchor", "end")
            .attr("x", 0)
            .attr("y", -20)
            .text("Ingresos en millones de S")
            .attr("text-anchor", "start")

        // Add Y axis
        let maxValue = Math.ceil(d3.max(stackedData, s=>d3.max(s, e=>e[1]))/5000)*5000;
        const y = d3.scaleLinear()
            .domain([0, maxValue])
            .range([height, 0]);
        svg.append("g")
            .call(d3.axisLeft(y).ticks(5))



        //////////
        // BRUSHING AND CHART //
        //////////

        // Add a clipPath: everything out of this area won't be drawn.
        const clip = svg.append("defs").append("svg:clipPath")
            .attr("id", "clip")
            .append("svg:rect")
            .attr("width", width)
            .attr("height", height)
            .attr("x", 0)
            .attr("y", 0);

        // Add brushing
        const brush = d3.brushX()                 // Add the brush feature using the d3.brush function
            .extent([[0, 0], [width, height]]) // initialise the brush area: start at 0,0 and finishes at width,height: it means I select the whole graph area
            .on("end", updateChart) // Each time the brush selection changes, trigger the 'updateChart' function

        // Create the scatter variable: where both the circles and the brush take place
        const areaChart = svg.append('g')
            .attr("clip-path", "url(#clip)")

        // Area generator
        const area = d3.area()
            .x(function (d) { return x(d.data.year); })
            .y0(function (d) { return y(d[0]); })
            .y1(function (d) { return y(d[1]); })

        // Show the areas
        areaChart
            .selectAll("mylayers")
            .data(stackedData)
            .join("path")
            .attr("class", function (d) { return "myArea " + d.key })
            .style("fill", function (d) { return color(d.key); })
            .attr("d", area)

        // Add the brushing
        areaChart
            .append("g")
            .attr("class", "brush")
            .call(brush);

        let idleTimeout
        function idled() { idleTimeout = null; }

        // A function that update the chart for given boundaries
        function updateChart(event, d) {

            extent = event.selection

            // If no selection, back to initial coordinate. Otherwise, update X axis domain
            if (!extent) {
                if (!idleTimeout) return idleTimeout = setTimeout(idled, 350); // This allows to wait a little bit
                x.domain(d3.extent(data, function (d) { return d.year; }))
            } else {
                x.domain([x.invert(extent[0]), x.invert(extent[1])])
                areaChart.select(".brush").call(brush.move, null) // This remove the grey brush area as soon as the selection has been done
            }

            // Update axis and area position
            xAxis.transition().duration(1000).call(d3.axisBottom(x).ticks(5))
            areaChart
                .selectAll("path")
                .transition().duration(1000)
                .attr("d", area)
        }



        //////////
        // HIGHLIGHT GROUP //
        //////////

        // What to do when one group is hovered
        const highlight = function (event, d) {
            // reduce opacity of all groups
            d3.selectAll(".myArea").style("opacity", .1)
            // expect the one that is hovered
            d3.select("." + d).style("opacity", 1)
        }

        // And when it is not hovered anymore
        const noHighlight = function (event, d) {
            d3.selectAll(".myArea").style("opacity", 1)
        }



        //////////
        // LEGEND //
        //////////

        // Add one dot in the legend for each name.
        const size = 20
        svg.selectAll("myrect")
            .data(keys)
            .join("rect")
            .attr("x", 700)
            .attr("y", function (d, i) { return 10 + i * (size + 5) }) // 100 is where the first dot appears. 25 is the distance between dots
            .attr("width", size)
            .attr("height", size)
            .style("fill", function (d) { return color(d) })
            .on("mouseover", highlight)
            .on("mouseleave", noHighlight)

        // Add one dot in the legend for each name.
        svg.selectAll("mylabels")
            .data(keys)
            .join("text")
            .attr("x", 700 + size * 1.2)
            .attr("y", function (d, i) { return 10 + i * (size + 5) + (size / 2) }) // 100 is where the first dot appears. 25 is the distance between dots
            .style("fill", function (d) { return color(d) })
            .text(function (d) { return d })
            .attr("text-anchor", "left")
            .style("alignment-baseline", "middle")
            .on("mouseover", highlight)
            .on("mouseleave", noHighlight)

    })
};

