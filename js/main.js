$(document).ready(function () {

    let since = 1994
    to = 2020;

    for (let i = since; i <= to; i++) {
        $('#init_date').append($('<option>', {
            value: i,
            text: i
        }));
        $('#finish_date').append($('<option>', {
            value: i,
            text: i
        }));
    }
    
    $.ajax({
        type: "GET",
        url: "datos.csv",
        dataType: "text",
        success: function(data) {processData(data);}
     });

    //Genera la lista de empresas para agregar al filtro desde la fuente CSV
    let empresas = [];
  
   
    
    
   


    $("#init_date").val(1994)
    $("#finish_date").val(2020)
    $("#top_n").val(10)
    $("#btn_graficar").on('click', graficar)

    $('input.floatNumber').on('input', function () {
        this.value = this.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
    });

    /*$('#navbarSupportedContent').find('a').on('shown.bs.tab', function () {
        prepareFiltersStack();
    });*/
    graficar()


    $("#btn_graficar_stacked").on('click', plotStackedGraph);

    $('#filter_stack').change(function () {
        console.log("change")
        $("#labels_filter").children().remove()
        $('#filter_stack').val().forEach(f => {
            let html = "";
            html = "<span id='span_" + f + "' class='mr-3'><small>" + f + " <i class='fa fa-times text-danger rm_label' style='cursor:pointer' onclick='removeLabel(this)' id='" + f + "'></i></small></span>"
            $("#labels_filter").append(html)

        })

    });



})
function processData(allText) {
    var allTextLines = allText.split(/\r\n|\n/);
    var headers = allTextLines[0].split(',');
    var lines = [];

    for (var i=1; i<allTextLines.length; i++) {
        var data = allTextLines[i].split(',');
        if (data.length == headers.length) {
           lines.push(data[0])
            
        }
    }
    let result = lines.filter((item,index)=>{
        return lines.indexOf(item) === index;
      })
      result.sort()

       //Agrega las empresas al componente de filtro
       result.forEach(e => {
        let selected = ['AMERICA MOVIL PERU', 'ENTEL PERU', 'TELEFONICA DEL PERU', 'VIETTEL PERU', 'DIRECTV PERU', 'CENTURYLINK PERU', 'OPTICAL NETWORKS', 'AMERICATEL PERU']
       
        $('#filter_stack').append($('<option>', {
            value: e,
            text: e,
            selected: (selected.find(element => element == e)) ? true : false
        }));
    });

    $('#filter_stack').val().forEach(f => {
        console.log(f)
        let html = "";
        html = "<span id='span_" + f + "' class='mr-3'><small>" + f + " <i class='fa fa-times text-danger rm_label' style='cursor:pointer'  onclick='removeLabel(this)' id='" + f + "' ></i></small></span>"
        $("#labels_filter").append(html)

    })


      
   
}

function removeLabel(e) {


    $(e).parent().parent().remove()
    let id = $(e).attr('id')


    $("#filter_stack option[value='" + id + "']").prop("selected", false);



};


function graficar() {
    $("#container svg").remove()
    // Feel free to change or delete any of the code you see in this editor!
    var svg = d3.select("#container").append("svg")
        .attr("width", 1000)
        .attr("height", 600);
    var tickDuration = 1000;
    var top_n = 12;
    var height = 600;
    var width = 800;

    //Alternativa para ingresar dato
    var yearinicio;
    var yearfin;
    //   let selection = [];
    yearinicio = parseInt($("#init_date").val())
    yearfin = parseInt($("#finish_date").val())
    //   selection = $('#filter').val();
    let top_n_value = parseInt($('#top_n').val())
    top_n = top_n_value > 0 ? top_n_value : top_n;


    const margin = {
        top: 80,
        right: 0,
        bottom: 10,
        left: 220
    };
    let barPadding = (height - (margin.bottom + margin.top)) / (top_n * 5);
    let title = svg.append('text')
        .attr('class', 'title')
        .attr('y', 24)
        .html(`Top ${top_n}, Ingresos de las empresas de comunicaciones en Perú`);
    let subTitle = svg.append("text")
        .attr("class", "subTitle")
        .attr("y", 55)
        .html("Ingresos millones de S/");
    let caption = svg.append('text')
        .attr('class', 'caption')
        .attr('x', width)
        .attr('y', height - 5)
        .style('text-anchor', 'end')
        .html('Source: Interbrand');
    let year = yearinicio;
    let data = [];

    let colores = [];
    //Colores conocidos de las empresas
    d3.csv('color.csv').then(function (colors) {
        colors.forEach(a => {
            if (a['H'] == "")
                a.color = d3.hsl(Math.random() * 360, 0.75, 0.75);
            else
                a.color = d3.hsl(a['H'], a['S'], a['L']);
        });
        colores = colors;
    });

    d3.csv('datos.csv').then(function (datos) {

        //   //Filtrar solamente las empresas seleccionadas, si no hay ninguna seleccionada, muestre todas
        //   if (selection.length>0) {
        //     datos = datos.filter(d=>selection.includes(d['Nombre']));
        //   }

        //Asignacion de colores para empresas conocidas
        datos.forEach(d => {
            colores.forEach(a => {
                if (d['Nombre'] == a['Nombre'])
                    d.colour = a['color'];
            });
            //d.colour = d3.hsl(Math.random() * 360, 0.75, 0.75);
        });

        let lastValues = {};
        //agrega color a cada elemento
        function normalizar() {
            let bandera = 2;
            const values = {};
            const years = {};
            const resultado = [];
            const lastValues = {};
            datos.forEach(d => {
                const name = d["Nombre"];
                let value = parseFloat(d["Ingreso"]) / 1000000;
                let year = parseInt(d["ano"]);
                let lastValue = lastValues[name];
                if (lastValue == null)
                    lastValue = value;
                if (years[name] == year) {
                    value = value + values[name];
                }

                resultado.map(function (res) {
                    if (res.name == name && res.year == year) {
                        res.value = value;
                        //res.lastValue = lastValue;
                        bandera = 1;
                    }
                });
                if (bandera == 1) {
                    bandera = 0;
                    lastValues[name] = value;
                }
                else {
                    if (bandera == 2) {
                        lastValues[name] = value;
                    }

                    resultado.push({
                        name: name,
                        colour: d.colour,
                        value: value,
                        year: year,
                        lastValue: lastValue
                    });

                    bandera = 2;

                }


                //recuperar valores previos por empresa
                values[name] = value;
                years[name] = year;
            });


            return resultado;
        }

        data = normalizar();


        //filtra los 12 primeros por año
        let yearSlice = data.filter(d => d.year == year && !isNaN(d.value))
            .sort((a, b) => b.value - a.value)
            .slice(0, top_n);
        //asigna el ranking por grupo
        yearSlice.forEach((d, i) => d.rank = i);


        //calcula las medidas para las graficas
        let x = d3.scaleLinear()
            .domain([0, d3.max(yearSlice, d => d.value)])
            .range([margin.left, width - margin.right - 65]);
        let y = d3.scaleLinear()
            .domain([top_n, 0])
            .range([height - margin.bottom, margin.top]);
        let xAxis = d3.axisTop()
            .scale(x)
            .ticks(width > 2000 ? 5 : 4)
            .tickSize(-(height - margin.top - margin.bottom))
            .tickFormat(d => d3.format(',')(d));

        //genera los margenes
        svg.append('g')
            .attr('class', 'axis xAxis')
            .attr('transform', `translate(0, ${margin.top})`)
            .call(xAxis)
            .selectAll('.tick line')
            .classed('origin', d => d == 0);

        //Dibuja las barras iniciales
        svg.selectAll('rect.bar')
            .data(yearSlice, d => d.name)
            .enter()
            .append('rect')
            .attr('class', 'bar')
            .attr('x', x(0) + 1)
            .attr('width', d => x(d.value) - x(0) - 1)
            .attr('y', d => y(d.rank) + 5)
            .attr('height', y(1) - y(0) - barPadding)
            .style('fill', d => d.colour)
            .append('title')
            .text((d) => `${d3.format(",.2f")(d.value)} millones en ${d.year}`);

        //agregar los nombres iniciales
        svg.selectAll('text.label')
            .data(yearSlice, d => d.name)
            .enter()
            .append('text')
            .attr('class', 'label')
            .attr('x', d => x(0) - 8) //texto se queda al margen
            //.attr('x', d => x(d.value) - 8) //texto acompañe a la barra
            .attr('y', d => y(d.rank) + 5 + ((y(1) - y(0)) / 2) + 1)
            .style('text-anchor', 'end')
            .html(d => d.name);

        //agrebar los valores iniciales
        svg.selectAll('text.valueLabel')
            .data(yearSlice, d => d.name)
            .enter()
            .append('text')
            .attr('class', 'valueLabel')
            .attr('x', d => x(d.value) + 5)
            .attr('y', d => y(d.rank) + 5 + ((y(1) - y(0)) / 2) + 1)
            .text(d => d3.format(',.0f')(d.lastValue));
        //agrega el año inicial al margen
        let yearText = svg.append('text')
            .attr('class', 'yearText')
            .attr('x', width - margin.right)
            .attr('y', height - 25)
            .style('text-anchor', 'end')
            .html(~~year)
            .call(halo, 10);

        //bucle carrera de barras
        let ticker = d3.interval(e => {
            yearSlice = data.filter(d => d.year == year && !isNaN(d.value))
                .sort((a, b) => b.value - a.value)
                .slice(0, top_n);

            yearSlice.forEach((d, i) => d.rank = i);

            //console.log('IntervalYear: ', yearSlice);
            x.domain([0, d3.max(yearSlice, d => d.value)]);

            svg.select('.xAxis')
                .transition()
                .duration(tickDuration)
                .ease(d3.easeLinear)
                .call(xAxis);

            let bars = svg.selectAll('.bar').data(yearSlice, d => d.name);

            bars
                .enter()
                .append('rect')
                .attr('class', d => `bar ${d.name.replace(/\s/g, '_')}`)
                .attr('x', x(0) + 1)
                .attr('width', d => { let w = x(d.value) - x(0) - 1; return w > 0 ? w : 0 })
                .attr('y', d => y(top_n + 1) + 5)
                .attr('height', y(1) - y(0) - barPadding)
                .style('fill', d => d.colour)
                .append('title')
                .text((d) => `${d3.format(",.2f")(d.value)} millones en ${d.year}`)
                .transition()
                .duration(tickDuration)
                .ease(d3.easeLinear)
                .attr('y', d => y(d.rank) + 5);
            bars
                .transition()
                .duration(tickDuration)
                .ease(d3.easeLinear)
                .attr('width', d => { let w = x(d.value) - x(0) - 1; return w > 0 ? w : 0 })
                .attr('y', d => y(d.rank) + 5);
            bars
                .exit()
                .transition()
                .duration(tickDuration)
                .ease(d3.easeLinear)
                .attr('width', d => { let w = x(d.value) - x(0) - 1; return w > 0 ? w : 0 })
                .attr('y', d => y(top_n + 1) + 5)
                .remove();

            let labels = svg.selectAll('.label')
                .data(yearSlice, d => d.name);

            labels
                .enter()
                .append('text')
                .attr('class', 'label')
                //.attr('x', d => x(d.value) - 8)
                .attr('x', d => x(0) - 8)
                .attr('y', d => y(top_n + 1) + 5 + ((y(1) - y(0)) / 2))
                .style('text-anchor', 'end')
                .html(d => d.name)
                .transition()
                .duration(tickDuration)
                .ease(d3.easeLinear)
                .attr('y', d => y(d.rank) + 5 + ((y(1) - y(0)) / 2) + 1);
            labels
                .transition()
                .duration(tickDuration)
                .ease(d3.easeLinear)
                //.attr('x', d => x(d.value) - 8)
                .attr('x', d => x(0) - 8)
                .attr('y', d => y(d.rank) + 5 + ((y(1) - y(0)) / 2) + 1);
            labels
                .exit()
                .transition()
                .duration(tickDuration)
                .ease(d3.easeLinear)
                //.attr('x', d => x(d.value) - 8)
                .attr('x', d => x(0) - 8)
                .attr('y', d => y(top_n + 1) + 5)
                .remove();

            let valueLabels = svg.selectAll('.valueLabel').data(yearSlice, d => d.name);

            valueLabels
                .enter()
                .append('text')
                .attr('class', 'valueLabel')
                .attr('x', d => x(d.value) + 5)
                .attr('y', d => y(top_n + 1) + 5)
                .text(d => d3.format(',.0f')(d.lastValue))
                .transition()
                .duration(tickDuration)
                .ease(d3.easeLinear)
                .attr('y', d => y(d.rank) + 5 + ((y(1) - y(0)) / 2) + 1);

            valueLabels
                .transition()
                .duration(tickDuration)
                .ease(d3.easeLinear)
                .attr('x', d => x(d.value) + 5)
                .attr('y', d => y(d.rank) + 5 + ((y(1) - y(0)) / 2) + 1)
                .tween("text", function (d) {
                    let i = d3.interpolateRound(d.lastValue, d.value);
                    return function (t) {
                        this.textContent = d3.format(',')(i(t));
                    };
                });

            valueLabels
                .exit()
                .transition()
                .duration(tickDuration)
                .ease(d3.easeLinear)
                .attr('x', d => x(d.value) + 5)
                .attr('y', d => y(top_n + 1) + 5)
                .remove();

            yearText.html(~~year);


            if (year == yearfin) ticker.stop();

            year = ((+year) + 1);
        }, tickDuration);
    });

    const halo = function (text, strokeWidth) {
        text.select(function () { return this.parentNode.insertBefore(this.cloneNode(true), this); })
            .style('fill', '#ffffff')
            .style('stroke', '#ffffff')
            .style('stroke-width', strokeWidth)
            .style('stroke-linejoin', 'round')
            .style('opacity', 1);

    }

}

function plotStackedGraph() {
    // Configura las dimensiones
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
        keys = $('#filter_stack').val()

        // color palette
        const color = d3.scaleOrdinal()
            .domain(keys)
            .range(d3.schemeSet2);

        //Colocar datos en un stack
        const stackedData = d3.stack().keys(keys)(data)
        



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
        let maxValue = Math.ceil(d3.max(stackedData, s => d3.max(s, e => e[1])) / 5000) * 5000;
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
            .x(function (d) {  return x(d.data.year); })
            .y0(function (d) {
                 return y(
                     (isNaN(d[0])) ? 0 : d[0]
                     );
                 })
            .y1(function (d) { 
                return y(
                    (isNaN(d[1])) ? 0 : d[1]
                    );
             })

        areaChart
            .selectAll("mylayers")
            .data(stackedData)
            .join("path")
            .attr("class", function (d) { return "myArea " + d.key.replace(' ', '_') })
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
            d3.select("." + d.replace(' ', '_')).style("opacity", 1)
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
