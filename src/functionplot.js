import linspace from 'linspace'

import { selectEnter, extendDomainByFactor } from './utils'

export default function functionPlot(config) {
    let {
        width, height,
        margin={top: 10, right: 10, bottom: 35, left: 45},
        updateDuration=500,
        xDomain, yDomain,
        xLabel, yLabel,
        xLabelImage, yLabelImage,
        approxTickCount=3,
        lineColor='blue',
        lineOpacity=1,
        lineStyle='solid',
        nLinePoints=100,
        yDomainDetectionExtendFactor=1.5,
        id=0,
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
            selectEnter(container, '.functionPlotSvg')
              .append('svg')
                .attr('class', 'functionPlotSvg')
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
                .attr('transform', `translate(${margin.left+2}, ${margin.top})`)

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

            // Set axes' labels
            const xCenter = xScale.range()[0]+(xScale.range()[1]-xScale.range()[0])/2
            const yCenter = yScale.range()[0]+(yScale.range()[1]-yScale.range()[0])/2
            if (xLabel !== undefined) {
                selectEnter(plotGroup.select('.xAxis'), '.label')
                  .append('text')
                    .attr('class', 'label')
                    .style("text-anchor", "middle")
                    .style('fill', '#000')
                plotGroup.select('.xAxis > .label')
                    .attr('transform', `translate(${xCenter}, ${margin.bottom-3})`)
                    .text(xLabel)
            }
            if (yLabel !== undefined) {
                selectEnter(plotGroup.select('.yAxis'), '.label')
                  .append('text')
                    .attr('class', 'label')
                    .style("text-anchor", "middle")
                    .style("dominant-baseline", "hanging")
                    .style('fill', '#000')
                plotGroup.select('.yAxis > .label')
                    .attr('transform', `translate(${-margin.left}, ${yCenter})`
                        + `rotate(-90)`)
                    .text(yLabel)
            }
            
            if (xLabelImage !== undefined) {
                selectEnter(plotGroup.select('.xAxis'), '.labelImage')
                  .append('image')
                    .attr('class', 'labelImage')
                plotGroup.select('.xAxis > .labelImage')
                    .attr('transform', `translate(${xCenter}, ${margin.bottom-xLabelImage.height})`
                        + `translate(${-xLabelImage.width/2}, 0)`)
                    .attr('xlink:xlink:href', xLabelImage.uri)
                    .attr('width', xLabelImage.width)
                    .attr('height', xLabelImage.height)
            }
            if (yLabelImage !== undefined) {
                selectEnter(plotGroup.select('.yAxis'), '.labelImage')
                  .append('image')
                    .attr('class', 'labelImage')
                plotGroup.select('.yAxis > .labelImage')
                    .attr('transform', `translate(${-margin.left}, ${yCenter})`
                        + `rotate(-90)`
                        + `translate(${-yLabelImage.width/2}, 0)`)
                    .attr('xlink:xlink:href', yLabelImage.uri)
                    .attr('width', yLabelImage.width)
                    .attr('height', yLabelImage.height)
            }

            // Draw the line
            const dasharrayValue =
                (lineStyle === ':')
                ? '1,10'
                : (lineStyle === '--')
                    ? '10,10'
                    : undefined
            const linecapValue = (lineStyle === ':') ? 'round' : undefined
            const line = d3.line()
                .x(d => xScale(d.x))
                .y(d => yScale(d.y))
                .defined(d => isFinite(d.y))
                .curve(d3.curveMonotoneX)
            selectEnter(plotGroup, '.line.id'+id)
              .append('path')
                .attr('class', 'line id'+id)
                .attr('fill', 'none')
                .attr('stroke', lineColor)
                .attr('opacity', lineOpacity)
            plotGroup.select('.line.id'+id)
                .datum(linePoints)
              .transition()
                .duration(updateDuration)
                .attr('stroke', lineColor)
                .attr('opacity', lineOpacity)
                .attr('stroke-dasharray', dasharrayValue)
                .attr('stroke-linecap', linecapValue)
                .attr('d', line)

        })
    }

    // XXX: The settings of [xy]Scale change on every call of plot. Watch out
    // when using the same functionPlot() instance for multiple plots.
    plot.xScale = xScale
    plot.yScale = yScale

    return plot
}
