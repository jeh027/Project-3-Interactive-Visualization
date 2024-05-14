// Sets the dimensions and margins of the graph
const margin = {top: 10, right: 30, bottom: 20, left: 40},
    width = 460 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

// Appends the svg object to the body of the page
const svg = d3.select("#my_dataviz")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform",`translate(${margin.left},${margin.top})`);

// Reads the data
d3.csv("cleaned-owid-energy-data.csv").then(function(data) {
    console.log(data);

    // List of groups (here I have one group per column)
    const uniqueCountries = data.map(function(d){return d.country})
    const menu = new Set(uniqueCountries)

    // Add the options to the button
    d3.select("#selectButton")
      .selectAll('myOptions')
      .data(menu)
      .enter()
      .append('option')
      .text(d => d) // text showed in the menu
      .attr("value", d => d) // value returned by the button

    let dataFilter = data.filter(function(d) {return d.country == 'Africa'}).slice(0, 38)
    let max = Math.max(...dataFilter.map(function(d){return parseInt(d.fossil_fuel_consumption)}))
    let x_domain = Math.ceil(max / (10 ** (max.toString().length - 1))) * (10 ** (max.toString().length - 1))

    d3.select("#selectButton").on("change", function() { // this is for the drop down
        // Recovers the option that has been chosen
        let selectedOption = d3.select(this).property("value")
        update(selectedOption)
    })

    // Add X axis
    const x = d3.scaleLinear().range([0, width]);
    const xAxis = d3.axisBottom().tickFormat(d3.format("~f")).scale(x); // removes the comma delimiter for thousands

    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .attr("class", "myXaxis")


    // Add Y axis
    const y = d3.scaleLinear().range([height, 0]);
    const yAxis = d3.axisLeft().scale(y);
    
    svg.append("g")
        .attr("class","myYaxis")


    // Initial Viz
    x.domain([1965, 2022]);
    svg.selectAll(".myXaxis")
            .transition()
            .duration(1000)
            .call(xAxis);

    y.domain([0, x_domain]);
    svg.selectAll(".myYaxis")
            .transition()
            .duration(1000)
            .call(yAxis);

    // Function to update the y-axis
    function updateXYAxis(newDomain) {
        // Update the X axis:
        x.domain([1965, 2022]); // fixed for time in dataset
        svg.selectAll(".myXaxis")
            .transition()
            .duration(1000)
            .call(xAxis); // maps domain to scaleLinear (axes)

        // Update the Y axis
        y.domain(newDomain);
        svg.selectAll(".myYaxis")
            .transition()
            .duration(1000)
            .call(yAxis);
    }

    // Initialize line with group a
    const line = svg
      .append('g') // why do we always append to 'g'?
      .append("path")
      .datum(dataFilter)
      .attr("d", d3.line()
        .x(d => x(+parseInt(d.year)))
        .y(d => y(+parseFloat(d.fossil_fuel_consumption))))
      .attr("stroke", "black")
      .style("stroke-width", 2)
      .style("fill", "none")

    // Initialize dots with group a
    const dot = svg
      .selectAll('circle')
      .data(dataFilter)
      .join('circle')
      .attr("cx", d => x(+parseInt(d.year)))
      .attr("cy", d => y(+parseFloat(d.fossil_fuel_consumption)))
      .attr("r", 2.3)
      .style("fill", "#104e8b")
    
    // Create a tooltip
    const tooltip = d3.select("#my_dataviz")
        .append("div")
        .style("opacity", 0)
        .attr("class", "tooltip")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "2px")
        .style("border-radius", "5px")
        .style("padding", "5px")
        .style("max-width", "430px")
        
    // Three function that change the tooltip when user hover / move / leave a cell
    const mouseover = function(event,d) {
        tooltip
            .style("opacity", 1)
    }
    const mousemove = function(event, d) {
        tooltip
            .html("Energy Consumption from Fossil Fuels: " + d.fossil_fuel_consumption + " terawatt-hours")
            .style("left", (event.x)/2 + "px")
            .style("top", (event.y)/2 + "px")
    }
    const mouseleave = function(event, d) {
        tooltip
            .transition()
            .duration(200)
            .style("opacity", 0)
    }
        
    // Add the points
    const interative_points = svg
        .append("g")
        .selectAll("dot")
        .data(dataFilter)
        .join("circle")
            .attr("class", "myCircle")
            .attr("cx", d => x(d.year))
            .attr("cy", d => y(d.fossil_fuel_consumption))
            .attr("r", 2.5).attr("stroke", "#7639E9")
            .attr("stroke-width", 3)
            .attr("fill", "#7639E9")
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave);

    // A function that update the chart
    function update(selectedGroup) {

        // Filters data to get only the selected country in the drop down
        dataFilter = data.filter(function(d) {return d.country == selectedGroup}).slice(0, 38)
        max = Math.max(...dataFilter.map(function(d){return parseInt(d.fossil_fuel_consumption)}))
        x_domain = Math.ceil(max / (10 ** (max.toString().length - 1))) * (10 ** (max.toString().length - 1))
        
        updateXYAxis([0, x_domain]) // updates the domain for y-axis
        
        // Give these new data to update line
        line
            .datum(dataFilter)
            .transition()
            .duration(1000)
            .attr("d", d3.line()
                .x(d => x(+parseInt(d.year)))
                .y(d => y(+parseFloat(d.fossil_fuel_consumption))))
        dot
            .data(dataFilter)
            .transition()
            .duration(1000)
            .attr("cx", d => x(+parseInt(d.year)))
            .attr("cy", d => y(+parseFloat(d.fossil_fuel_consumption)))

        interative_points
            .data(dataFilter)
            .transition()
            .duration(1000)
            .attr("cx", d => x(d.year))
            .attr("cy", d => y(d.fossil_fuel_consumption))
    }

    svg.append("text")
    .attr("class", "x label")
    .attr("text-anchor", "end")
    .attr("x", width)
    .attr("y", height - 6)
    .text("Years");

    svg.append("text")
    .attr("class", "y label")
    .attr("text-anchor", "end")
    .attr("y", 6)
    .attr("dy", ".75em")
    .attr("transform", "rotate(-90)")
    .text("Terawatt Hours");
})
