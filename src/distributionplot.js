import _ from 'lodash'

import pointSymbol from './pointsymbol'
import { selectEnter } from './utils'

export default function distributionPlot(config) {
    let {
        width, height,
        // keepAspectRatio=false,
        margin={top: 10, right: 10, bottom: 25, left: 25},
        symbol=pointSymbol({symbolRadius: 2}),
        updateDuration=500,
        xDomain, yDomain,
        approxTickCount=3,
        nSamples=100,
        random=Math.random,
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
                .call(symbol.init || _.noop)
            const svg = container.select('svg')
            svg.attr('height', svgHeight)
            svg.attr('width', svgWidth)

            if (typeof margin === 'number') {
                margin = {top: margin, right: margin, bottom: margin, left: margin}
            }

            let plotWidth =
                (svgWidth==='100%' ? container.node().clientWidth : width)
                - margin.left - margin.right
            let plotHeight =
                (svgHeight==='100%' ? container.node().clientHeight: height)
                - margin.top - margin.bottom

            // Take samples from the distribution
            const samples = _.sortBy(Array.from({length: nSamples}).map(() =>
                distribution.ppf
                    ? distribution.ppf(random())
                    : distribution.sample()
            ))


            // Determine the domain to plot from taken samples
            if (xDomain === undefined) {
                const domain = d3.extent(samples)
                xScale.domain(domain).nice()
            } else {
                xScale.domain(xDomain)
            }
            if (yDomain === undefined) {
                const domain = d3.extent(samples, d => distribution.pdf(d))
                yScale.domain([0, domain[1]]).nice()
            } else {
                yScale.domain(yDomain)
            }
            xScale.range([0, plotWidth])
            yScale.range([plotHeight, 0]) // flip axis, higher y is up.

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

            // Draw the samples
            let points = plotGroup.selectAll('.point').data(samples)
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
                // .on('mouseover', function (d) {
                // TODO highlight?
                // })
            // Exit: remove symbols of removed data points.
            points.exit()
                .call(symbol.remove)
        })
    }

    return plot
}
