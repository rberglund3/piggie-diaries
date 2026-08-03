import * as d3 from 'd3';

export function buildScales(data, width, height, margin) {
    const xScale = d3.scaleTime()
        .domain(d3.extent(data, d => new Date(d.createdAt)))
        .range([margin.left, width - margin.right]);

    const yScale = d3.scaleLinear()
        .domain([
            d3.min(data, d => d.value) - 10,
            d3.max(data, d => d.value) + 10
        ])
        .range([height - margin.bottom, margin.top]);

    return { xScale, yScale };
}

export function buildLine(xScale, yScale) {
    return d3.line()
        .x(d => xScale(new Date(d.createdAt)))
        .y(d => yScale(d.value))
        .curve(d3.curveMonotoneX);
}

export function drawAxes(svg, xScale, yScale, width, height, margin) {
    svg.append('g')
        .attr('transform', `translate(0, ${height - margin.bottom})`)
        .call(d3.axisBottom(xScale).ticks(5).tickFormat(d3.timeFormat('%m/%d')));

    svg.append('g')
        .attr('transform', `translate(${margin.left}, 0)`)
        .call(d3.axisLeft(yScale));
}
