import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { buildScales, buildLine, drawAxes } from './chartUtils';
import './CombinedWeightChart.css';

const SERIES_COLORS = ['#C98A6B', '#8FAE8B', '#E8B95A', '#7A9CC6', '#B57BA6', '#D98A8A'];

const CombinedWeightChart = ({ series }) => {
    const svgRef = useRef();
    const nonEmptySeries = series.filter(s => s.data && s.data.length > 0);

    useEffect(() => {
        if (nonEmptySeries.length === 0) {
            return;
        }

        const width = 700;
        const height = 360;
        const margin = { top: 20, right: 30, bottom: 40, left: 50 };

        d3.select(svgRef.current).selectAll('*').remove();

        const svg = d3.select(svgRef.current)
            .attr('viewBox', `0 0 ${width} ${height}`)
            .style('background', '#ffffff')
            .style('border-radius', '8px');

        const allPoints = nonEmptySeries.flatMap(s => s.data);
        const { xScale, yScale } = buildScales(allPoints, width, height, margin);
        const line = buildLine(xScale, yScale);

        nonEmptySeries.forEach((s, i) => {
            const sortedData = [...s.data].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            const color = SERIES_COLORS[i % SERIES_COLORS.length];

            svg.append('path')
                .datum(sortedData)
                .attr('fill', 'none')
                .attr('stroke', color)
                .attr('stroke-width', 3)
                .attr('d', line);

            svg.selectAll(null)
                .data(sortedData)
                .enter()
                .append('circle')
                .attr('cx', d => xScale(new Date(d.createdAt)))
                .attr('cy', d => yScale(d.value))
                .attr('r', 4)
                .attr('fill', color)
                .attr('stroke', 'white')
                .attr('stroke-width', 2);
        });

        drawAxes(svg, xScale, yScale, width, height, margin);

    }, [series]);

    return (
        <div className="combined-chart-container">
            <svg ref={svgRef} style={{ width: '100%', height: 'auto' }}></svg>
            <div className="chart-legend">
                {nonEmptySeries.map((s, i) => (
                    <span className="legend-item" key={s.petName}>
                        <span className="legend-swatch" style={{ backgroundColor: SERIES_COLORS[i % SERIES_COLORS.length] }}></span>
                        {s.petName}
                    </span>
                ))}
            </div>
        </div>
    );
};

export default CombinedWeightChart;
