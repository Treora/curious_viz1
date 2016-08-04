import _ from 'lodash'
import pointSymbol from './pointsymbol'

export default function scatterPlot(config) {
    let {
        width, height,
        keepAspectRatio,
        margin=20,
        symbol=pointSymbol(),
        updateDuration,
        xDomain, yDomain,
    } = config

    if (typeof margin === 'number') {
        margin = {top: margin, right: margin, bottom: margin, left: margin}
    }

    const xScale = d3.scaleLinear()
    const yScale = d3.scaleLinear()

    const xAxis = d3.axisBottom(xScale).ticks(3).tickSizeOuter(0)
    const yAxis = d3.axisLeft(yScale).ticks(3).tickSizeOuter(0)

    function plot(selection) {
        selection.each(function (data) { // 'each' = for each chart

            const container = d3.select(this)

            if (container.select('.scatterPlotSvg').empty()) {
                const svg = container
                  .append('svg')
                    .attr('class', 'scatterPlotSvg')
                    .call(symbol.init || _.noop)

                const plotGroup = svg.append('g')
                    .attr('class', 'scatterPlotGroup')

                plotGroup.append('g').attr('class', 'xAxis')
                plotGroup.append('g').attr('class', 'yAxis')
            }

            const svg = container.select('svg')
            if (width !== undefined) {
                svg.attr('width', width)
            }
            else {
                svg.attr('width', '100%')
                width = svg.node().parentElement.clientWidth
            }
            if (height !== undefined) {
                svg.attr('height', height)
            }
            else {
                svg.attr('height', '100%')
                height = svg.node().parentElement.clientHeight
            }

            const plotGroup = svg.select('.scatterPlotGroup')
                .attr('transform', `translate(${margin.left}, ${margin.top})`)

            let points = plotGroup.selectAll('.point').data(data, d => d.id)

            if (xDomain === undefined)
                xDomain = d3.extent(data, d=>d.x)
            if (yDomain === undefined)
                yDomain = d3.extent(data, d=>d.y)

            let plotWidth = width - margin.left - margin.right
            let plotHeight = height - margin.top - margin.bottom

            if (keepAspectRatio) {
                const xSpan = xDomain[1]-xDomain[0]
                const ySpan = yDomain[1]-yDomain[0]
                const xRatio = plotWidth/xSpan
                const yRatio = plotHeight/ySpan
                if (xRatio < yRatio)
                    plotHeight = xRatio * ySpan
                else
                    plotWidth = yRatio * xSpan
            }


            xScale
                .domain(xDomain)
                .nice()
                .range([0, plotWidth])
            yScale
                .domain(yDomain)
                .nice()
                .range([plotHeight, 0])


            plotGroup.select('.xAxis')
                .attr('transform', `translate(0, ${yScale.range()[0]})`)
                .call(xAxis)

            plotGroup.select('.yAxis')
                .attr('transform', `translate(0, ${xScale.range()[0]})`)
                .call(yAxis)

            const setPosition = points => points.attr('transform',
                d => `translate(${xScale(d.x)}, ${yScale(d.y)})`
            )

            // Update
            points
              .transition()
                .duration(updateDuration)
                .call(setPosition)

            // Enter
            points.enter().append('g')
                .attr('class', 'point')
                .call(setPosition)
                .call(symbol.draw, {xScale, yScale})
                // .on('mouseover', function (d) {
                // TODO highlight?
                // })

            // Exit
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

    return plot
}
