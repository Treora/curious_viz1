import _ from 'lodash'
import linspace from 'linspace'

import pointSymbol from './pointsymbol'
import { selectEnter, extendDomainByFactor } from './utils'

export default function distributionPlot(config) {
    let {
        width, height,
        margin={top: 10, right: 10, bottom: 35, left: 45},
        updateDuration=500,
        xDomain, yDomain,
        xLabel, yLabel,
        approxTickCount=3,
        random=Math.random,

        lineColor='blue',
        lineOpacity=0.3,
        nLinePoints=100,

        drawSamples=true,
        symbol=pointSymbol({symbolRadius: 2}),
        nSamples=100,

    } = config

    const xScale = d3.scaleLinear()
    const yScale = d3.scaleLinear()

    const xAxis = d3.axisBottom(xScale)
    const yAxis = d3.axisLeft(yScale)

    function plot(selection) {
        selection.each(function (distribution) { // 'each' = for each chart
            const container = d3.select(this)

            // Add SVG element if needed and set its size
            const svgWidth = (width !== undefined) ? width : '100%'
            const svgHeight = (height !== undefined) ? height : '100%'
            selectEnter(container, '.distributionPlotSvg')
              .append('svg')
                .attr('class', 'distributionPlotSvg')
                .call((symbol && symbol.init) || _.noop)
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

            // Take samples from the distribution
            const samples = _.sortBy(Array.from({length: nSamples}).map(() =>
                distribution.ppf
                    ? distribution.ppf(random())
                    : distribution.sample()
            ))

            // Determine the domain to plot from taken samples
            if (xDomain === undefined) {
                const domain = extendDomainByFactor(d3.extent(samples), 2)
                xScale.domain(domain).nice()
            } else {
                xScale.domain(xDomain)
            }

            // Try to cover the whole domain adequately: compute pdf at regular
            // intervals as well as at the samples
            const linePoints = _.sortBy(_.concat(
                linspace(...xScale.domain(), nLinePoints),
                samples.filter(sample => _.inRange(sample, ...xScale.domain())),
            ))

            // Determine the vertical domain (= the pdf's range)
            if (yDomain === undefined) {
                const domain = d3.extent(linePoints, d => distribution.pdf(d))
                yScale.domain([0, domain[1]*1.5])//.nice()
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


            // Set axes' labels
            if (xLabel !== undefined) {
                const xCenter = xScale.range()[0]+(xScale.range()[1]-xScale.range()[0])/2
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
                const yCenter = yScale.range()[0]+(yScale.range()[1]-yScale.range()[0])/2
                selectEnter(plotGroup.select('.yAxis'), '.label')
                  .append('text')
                    .attr('class', 'label')
                    .style("text-anchor", "middle")
                    .style("dominant-baseline", "hanging")
                    .style('fill', '#000')
                plotGroup.select('.yAxis > .label')
                    .attr('transform', `translate(${-margin.left+2}, ${yCenter})`
                        + `rotate(-90)`)
                    .text(yLabel)
            }

            // Draw the samples
            if (drawSamples) {
                const points = plotGroup.selectAll('.point').data(samples)
                const setPosition = points => points.attr('transform',
                    d => `translate(${xScale(d)}, ${yScale(distribution.pdf(d))})`
                )
                // Update: moving existing points to their right location.
                points
                  .call(symbol.draw, {xScale, yScale, updateDuration})
                  .transition()
                    .duration(updateDuration)
                    .call(setPosition)
                // Enter: draw symbols for newly added data points.
                points.enter().append('g')
                    .attr('class', 'point')
                    .call(setPosition)
                    .call(symbol.draw, {xScale, yScale, updateDuration})
                // Exit: remove symbols of removed data points.
                points.exit()
                    .call(symbol.remove)
            }

            // Draw the line
            if (lineOpacity > 0) {
                const line = d3.line()
                    .x(d => xScale(d))
                    .y(d => yScale(distribution.pdf(d)))
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
            }
            else {
                plotGroup.select('.line')
                    .remove()
            }

        })
    }

    // XXX: The settings of [xy]Scale change on every call of plot. Watch out
    // when using the same distributionPlot() instance for multiple plots.
    plot.xScale = xScale
    plot.yScale = yScale

    return plot
}
