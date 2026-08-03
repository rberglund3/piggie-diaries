import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { buildScales, buildLine, drawAxes } from './chartUtils';

const WeightChart = ({ data, petName }) => {
    const svgRef = useRef();

    useEffect(() => {
        if (!data || !Array.isArray(data) || data.length < 1) {
            return;
        }

        const width = 500;
        const height = 300;
        const margin = { top: 20, right: 30, bottom: 40, left: 50 };

        d3.select(svgRef.current).selectAll('*').remove();

        const svg = d3.select(svgRef.current)
            .attr('viewBox', `0 0 ${width} ${height}`)
                .style('background', '#ffffff')
                .style('border-radius', '8px');

        const sortedData = [...data].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        const { xScale, yScale } = buildScales(sortedData, width, height, margin);
        const line = buildLine(xScale, yScale);

        // draw line
        svg.append('path')
            .datum(sortedData)
            .attr('fill', 'none')
            .attr('stroke', '#8FAE8B')
            .attr('stroke-width', 3)
            .attr('d', line);

        // add points
        svg.selectAll('.data-point')
            .data(sortedData)
            .enter()
            .append('circle')
            .attr('cx', d => xScale(new Date(d.createdAt)))
            .attr('cy', d => yScale(d.value))
            .attr('r', 4)
            .attr('fill', '#8FAE8B')
            .attr('stroke', 'white')
            .attr('stroke-width', 2);

        drawAxes(svg, xScale, yScale, width, height, margin);

    }, [data]);

    return (
        <div className="weight-chart-container" style={{ textAlign: 'center' }}>
            <h4>{petName}'s Weight (g)</h4>
            <svg ref={svgRef} style={{ width: '100%', height: 'auto' }}></svg>
        </div>
    );
};

export default WeightChart;
