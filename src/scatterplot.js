import _ from 'lodash'
import pointSymbol from './pointsymbol'

export default function scatterPlot(config) {
    let {
        width, height,
        symbol=pointSymbol(),
        updateDuration,
        xmin=0, xmax=10, ymin=0, ymax=10,
    } = config

    const xScale = d3.scaleLinear()
    const yScale = d3.scaleLinear()

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
                // TODO add axes, move plot for margins
            }

            const svg = container.select('svg')
                .attr("width", width)
                .attr("height", height)

            const plotGroup = svg.select('.scatterPlotGroup')
            let points = plotGroup.selectAll('.point').data(data, d => d.id)

            xScale.domain(d3.extent(data, d=>d.x))
                .range([0, width])
            yScale.domain(d3.extent(data, d=>d.y))
                .range([height, 0])

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
                .call(symbol.draw, {xmax, ymax})
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
