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
    // COnfigura las dimensiones
    const margin = { top: 60, right: 230, bottom: 50, left: 100 },
        width = 1000 - margin.left - margin.right,
        height = 600 - margin.top - margin.bottom;

    $("#container-stacked-chart svg").remove()

    // Agrega el objecto SVG a la pagina
    const svg = d3.select("#container-stacked-chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            `translate(${margin.left}, ${margin.top})`);

    // Lee los datos del CSV agrupado
    d3.csv("datos-columnas.csv").then(function (data) {


        // Lista de empresas telefonicas a filtrar
        //const keys = data.columns.slice(1)
        keys = ['AMERICA MOVIL PERU', 'ENTEL PERU', 'TELEFONICA DEL PERU', 'VIETTEL PERU', 'DIRECTV PERU', 'CENTURYLINK PERU','OPTICAL NETWORKS','AMERICATEL PERU'];

        // color palette
        const color = d3.scaleOrdinal()
            .domain(keys)
            .range(d3.schemeSet2);

        //Colocar datos en un stack
        const stackedData = d3.stack()
            .keys(keys)
            (data)

        console.log(stackedData)

        // Agregar eje X
        const x = d3.scaleLinear()
            .domain(d3.extent(data, function (d) { return d.year; }))
            .range([0, width]);
        const xAxis = svg.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(x).ticks(5))

        // Agregar etiqueta eje X
        svg.append("text")
            .attr("text-anchor", "end")
            .attr("x", width)
            .attr("y", height + 40)
            .text("Año");

        // Agregar etiquetas eje Y
        svg.append("text")
            .attr("text-anchor", "end")
            .attr("x", 0)
            .attr("y", -20)
            .text("Ingresos en millones de S")
            .attr("text-anchor", "start")

        // Agregar eje Y
        let maxValue = Math.ceil(d3.max(stackedData, s=>d3.max(s, e=>e[1]))/5000)*5000;
        const y = d3.scaleLinear()
            .domain([0, maxValue])
            .range([height, 0]);
        svg.append("g")
            .call(d3.axisLeft(y).ticks(5))

        // Solo dibujar lo que esta en esta area
        const clip = svg.append("defs").append("svg:clipPath")
            .attr("id", "clip")
            .append("svg:rect")
            .attr("width", width)
            .attr("height", height)
            .attr("x", 0)
            .attr("y", 0);

        const brush = d3.brushX()                 
            .extent([[0, 0], [width, height]]) 
            .on("end", updateChart) 

        const areaChart = svg.append('g')
            .attr("clip-path", "url(#clip)")

        // Generador de areas
        const area = d3.area()
            .x(function (d) { return x(d.data.year); })
            .y0(function (d) { return y(d[0]); })
            .y1(function (d) { return y(d[1]); })

        areaChart
            .selectAll("mylayers")
            .data(stackedData)
            .join("path")
            .attr("class", function (d) { return "myArea " + d.key.replace(' ','_') })
            .style("fill", function (d) { return color(d.key); })
            .attr("d", area)

        areaChart
            .append("g")
            .attr("class", "brush")
            .call(brush);

        let idleTimeout
        function idled() { idleTimeout = null; }

        // Function para actualizar el chart
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

            // Actualizar ejes
            xAxis.transition().duration(1000).call(d3.axisBottom(x).ticks(5))
            areaChart
                .selectAll("path")
                .transition().duration(1000)
                .attr("d", area)
        }

        // Resaltar cuando una empresa es seleccionada
        const highlight = function (event, d) {
            d3.selectAll(".myArea").style("opacity", .1)
            d3.select("." + d.replace(' ','_')).style("opacity", 1)
        }

        // Regresar las areas a sus colores normales
        const noHighlight = function (event, d) {
            d3.selectAll(".myArea").style("opacity", 1)
        }

        // Agregar nombres de las empresas
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

        // Agregar puntos para las leyendas de las empresas
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

