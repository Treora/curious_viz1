import linspace from 'linspace'

import { selectEnter, extendDomainByFactor } from './utils'

export default function functionPlot(config) {
    let {
        width, height,
        margin={top: 10, right: 10, bottom: 25, left: 25},
        updateDuration=500,
        xDomain, yDomain,
        approxTickCount=3,
        lineColor='blue',
        lineOpacity=1,
        nLinePoints=100,
    } = config

    const xScale = d3.scaleLinear()
    const yScale = d3.scaleLinear()

    const xAxis = d3.axisBottom(xScale)
    const yAxis = d3.axisLeft(yScale)

    function plot(selection) {
        selection.each(function (func) { // 'each' = for each chart
            const container = d3.select(this)

            // Add SVG element if needed and set its size
            const svgWidth = (width !== undefined) ? width : '100%'
            const svgHeight = (height !== undefined) ? height : '100%'
            selectEnter(container, '.distributionPlotSvg')
              .append('svg')
                .attr('class', 'distributionPlotSvg')
            const svg = container.select('svg')
            svg.attr('height', svgHeight)
            svg.attr('width', svgWidth)

            // Determine where to draw
            if (typeof margin === 'number') {
                margin = {top: margin, right: margin, bottom: margin, left: margin}
            }
            let plotWidth =
                (svgWidth==='100%' ? container.node().clientWidth : width)
                - margin.left - margin.right
            let plotHeight =
                (svgHeight==='100%' ? container.node().clientHeight: height)
                - margin.top - margin.bottom
            xScale.range([0, plotWidth])
            yScale.range([plotHeight, 0]) // flip axis, higher y is up.

            if (xDomain === undefined) {
                xScale.domain([0,10])
            } else {
                xScale.domain(xDomain)
            }

            const linePoints = linspace(...xScale.domain(), nLinePoints)

            // Determine the vertical domain (= the function's range)
            if (yDomain === undefined) {
                const domain = extendDomainByFactor(
                    d3.extent(linePoints, d => func(d)),
                    1.5
                )
                yScale.domain(domain).nice()
            } else {
                yScale.domain(yDomain)
            }

            // Add a group for the whole plot if not there yet
            const plotGroupEnter = selectEnter(svg, '.distributionPlotGroup')
              .append('g')
                .attr('class', 'distributionPlotGroup')
            plotGroupEnter.append('g').attr('class', 'xAxis')
                .attr('transform', `translate(0, ${yScale.range()[0]})`)
            plotGroupEnter.append('g').attr('class', 'yAxis')
                .attr('transform', `translate(0, ${xScale.range()[0]})`)

            // Move the whole plot to create margins around it
            const plotGroup = svg.select('.distributionPlotGroup')
                .attr('transform', `translate(${margin.left}, ${margin.top})`)

            // Draw the axes
            xAxis
                .ticks(approxTickCount)
                .tickSizeOuter(0) // (no extra tick at end of axis)
            yAxis
                .ticks(approxTickCount)
                .tickSizeOuter(0)
            plotGroup.select('.xAxis')
              .transition()
                .duration(updateDuration)
                .attr('transform', `translate(0, ${yScale.range()[0]})`)
                .call(xAxis)
            plotGroup.select('.yAxis')
              .transition()
                .duration(updateDuration)
                .attr('transform', `translate(0, ${xScale.range()[0]})`)
                .call(yAxis)

            // Draw the line
            const line = d3.line()
                .x(d => xScale(d))
                .y(d => yScale(func(d)))
                .curve(d3.curveMonotoneX)
            selectEnter(plotGroup, '.line')
              .append('path')
                .attr('class', 'line')
                .attr('fill', 'none')
                .attr('stroke', lineColor)
                .attr('opacity', lineOpacity)
            plotGroup.select('.line')
                .datum(linePoints)
              .transition()
                .duration(updateDuration)
                .attr('stroke', lineColor)
                .attr('opacity', lineOpacity)
                .attr('d', line)

        })
    }

    return plot
}
