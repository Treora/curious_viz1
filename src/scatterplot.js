import _ from 'lodash'

export default function update({
    svg,
    width, height,
    margin,
    symbol,
    updateDuration,
    xmin, xmax, ymin, ymax,
    data,
}) {
    if (width !== undefined)
        svg.attr('width', width)
    else
        width = svg.attr('width')

    if (height !== undefined)
        svg.attr('height', height)
    else
        height = svg.attr('height')

    if (margin === undefined)
        margin = symbol.props.expandedSymbolRadius || symbol.props.symbolRadius
    const marginX = margin
    const marginY = margin
    const plotWidth = width - 2*marginX
    const plotHeight = height - 2*marginY

    if (xmin === undefined)
        xmin = (_.minBy(data, 'x') || {x: 0}).x
    if (xmax === undefined)
        xmax = (_.maxBy(data, 'x') || {x: 1}).x
    if (ymin === undefined)
        ymin = (_.minBy(data, 'y') || {y: 0}).y
    if (ymax === undefined)
        ymax = (_.maxBy(data, 'y') || {y: 1}).y

    let points = svg.selectAll('.point')
    if (data !== undefined) {
        points = points.data(data, d => d.id)
    }

    function setPosition(selection) {
        selection
            .attr('transform', d => {
                const x = marginX + (d.x - xmin)/(xmax-xmin) * plotWidth
                const y = marginY + (d.y - ymin)/(ymax-ymin) * plotHeight
                return `translate(${x}, ${y})`
            })
    }

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
        // })

    // Exit
    points.exit()
        .call(symbol.remove)

}
