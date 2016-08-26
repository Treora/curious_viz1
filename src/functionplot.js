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
        yDomainDetectionExtendFactor=1.5,
    } = config

    const xScale = d3.scaleLinear()
    const yScale = d3.scaleLinear()

    const xAxis = d3.axisBottom(xScale)
    const yAxis = d3.axisLeft(yScale)

    function plot(selection) {
        selection.each(function (funcOrData) { // 'each' = for each chart
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

            // Determine the data to draw
            let linePoints
            if (typeof funcOrData === 'function') {
                if (xDomain === undefined) {
                    xScale.domain([0,10])
                } else {
                    xScale.domain(xDomain)
                }
                linePoints = linspace(...xScale.domain(), nLinePoints)
                    .map(point => ({x: point, y: funcOrData(point)}))
            }
            else {
                if (xDomain === undefined) {
                    xScale.domain(d3.extent(funcOrData.x))
                } else {
                    xScale.domain(xDomain)
                }
                linePoints = _.zipWith(funcOrData.x, funcOrData.y, (x, y) => ({x, y}))
            }

            // Determine the vertical domain (= the function's range)
            if (yDomain === undefined
                || (yDomain[0]===undefined && yDomain[1]===undefined)
            ) {
                const domain = extendDomainByFactor(
                    d3.extent(linePoints, d => d.y),
                    yDomainDetectionExtendFactor
                )
                yScale.domain(domain).nice()
            } else {
                // If either min or max is undefined, determine it from the data
                let minY = yDomain[0], maxY = yDomain[1]
                if (maxY===undefined) {
                    maxY = yDomain[0] + (d3.max(linePoints, d => d.y)-yDomain[0]) * yDomainDetectionExtendFactor
                }
                if (minY===undefined) {
                    minY = yDomain[1] + (d3.min(linePoints, d => d.y)-yDomain[1]) * yDomainDetectionExtendFactor
                }
                yScale.domain([minY, maxY])
            }

            // Add a group for the whole plot if not there yet
            const plotGroupEnter = selectEnter(svg, '.functionPlotGroup')
              .append('g')
                .attr('class', 'functionPlotGroup')
            plotGroupEnter.append('g').attr('class', 'xAxis')
                .attr('transform', `translate(0, ${yScale.range()[0]})`)
            plotGroupEnter.append('g').attr('class', 'yAxis')
                .attr('transform', `translate(0, ${xScale.range()[0]})`)

            // Move the whole plot to create margins around it
            const plotGroup = svg.select('.functionPlotGroup')
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
                .x(d => xScale(d.x))
                .y(d => yScale(d.y))
                .defined(d => isFinite(d.y))
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

    // XXX: The settings of [xy]Scale change on every call of plot. Watch out
    // when using the same functionPlot() instance for multiple plots.
    plot.xScale = xScale
    plot.yScale = yScale

    return plot
}
