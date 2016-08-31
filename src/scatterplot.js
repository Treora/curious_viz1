import _ from 'lodash'

import pointSymbol from './pointsymbol'
import { selectEnter } from './utils'

export default function scatterPlot(config) {
    let {
        width, height,
        keepAspectRatio=false,
        margin={top: 10, right: 10, bottom: 35, left: 45},
        symbol=pointSymbol(),
        updateDuration=500,
        xDomain, yDomain,
        approxTickCount=3,
        xLabel, yLabel,
        xLabelImage, yLabelImage,
    } = config

    const xScale = d3.scaleLinear()
    const yScale = d3.scaleLinear()

    const xAxis = d3.axisBottom(xScale)
    const yAxis = d3.axisLeft(yScale)

    function plot(selection) {
        selection.each(function (data) { // 'each' = for each chart

            const container = d3.select(this)

            // Add SVG element if needed and set its size
            const svgWidth = (width !== undefined) ? width : '100%'
            const svgHeight = (height !== undefined) ? height : '100%'
            selectEnter(container, '.scatterPlotSvg')
              .append('svg')
                .attr('class', 'scatterPlotSvg')
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

            // Set the plotted domain to the data minima and maxima.
            if (xDomain === undefined) {
                const domain = d3.extent(data, d=>d.x)
                xScale.domain(domain).nice()
            } else {
                xScale.domain(xDomain)
            }
            if (yDomain === undefined) {
                const domain = d3.extent(data, d=>d.y)
                yScale.domain(domain).nice()
            } else {
                yScale.domain(yDomain)
            }

            // Compute the svg-coord range where the plot will be drawn
            if (keepAspectRatio) {
                // Do not try to use the full svg size, but rather
                // ensure that a data unit has equal size on both the
                // x and y axes (so a square remains square).
                const xSpan = xScale.domain()[1]-xScale.domain()[0]
                const ySpan = yScale.domain()[1]-yScale.domain()[0]
                const xRatio = plotWidth/xSpan
                const yRatio = plotHeight/ySpan
                if (xRatio < yRatio)
                    plotHeight = xRatio * ySpan
                else
                    plotWidth = yRatio * xSpan
            }
            xScale.range([0, plotWidth])
            yScale.range([plotHeight, 0]) // flip axis, higher y is up.

            // Add a group for the whole plot if not there yet
            const plotGroupEnter = selectEnter(svg, '.scatterPlotGroup')
              .append('g')
                .attr('class', 'scatterPlotGroup')
            plotGroupEnter.append('g').attr('class', 'xAxis')
                .attr('transform', `translate(0, ${yScale.range()[0]})`)
            plotGroupEnter.append('g').attr('class', 'yAxis')
                .attr('transform', `translate(0, ${xScale.range()[0]})`)

            // Move the whole plot to create margins around it
            const plotGroup = svg.select('.scatterPlotGroup')
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
                    .attr('transform', `translate(${-margin.left+2}, ${yCenter})`
                        + `rotate(-90)`)
                    .text(yLabel)
            }

            if (xLabelImage !== undefined) {
                selectEnter(plotGroup.select('.xAxis'), '.labelImage')
                  .append('image')
                    .attr('class', 'labelImage')
                plotGroup.select('.xAxis > .labelImage')
                  .transition()
                    .duration(0)
                    .delay(updateDuration)
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
                  .transition()
                    .duration(0)
                    .delay(updateDuration)
                    .attr('transform', `translate(${-margin.left}, ${yCenter})`
                        + `rotate(-90)`
                        + `translate(${-yLabelImage.width/2}, 0)`)
                    .attr('xlink:xlink:href', yLabelImage.uri)
                    .attr('width', yLabelImage.width)
                    .attr('height', yLabelImage.height)
            }

            // Finally, draw the symbols.
            let points = plotGroup.selectAll('.point').data(data, d => d.id)
            const setPosition = points => points.attr('transform',
                d => `translate(${xScale(d.x)}, ${yScale(d.y)})`
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
    //
    // plot.width = w => {
    //     if (w !== undefined)
    //         width = w
    //     else
    //         return width
    // }
    // TODO make getters and setters

    return plot
}
