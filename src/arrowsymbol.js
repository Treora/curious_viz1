import { selectEnter } from './utils'


export default function defineSymbol(symbolProps) {
    return {
        props: symbolProps,
        draw: (selection, args) =>
            drawSymbol(selection, {...args, ...symbolProps}),
        remove: (selection, args) =>
            removeSymbol(selection, {...args, ...symbolProps}),
    }
}

function drawSymbol(selection, {
    enterDuration=500,
    updateDuration=500,
    arrowHeadlength=3,
    color='black',
    strokeWidth=2,
    xScale, yScale
}) {
    const toSvgCoords = d => ({x: xScale(d.x), y: yScale(d.y)})
    const angle = d => Math.atan2(d.y, d.x) * 180/Math.PI
    const norm = d => Math.sqrt(Math.pow(d.x,2) + Math.pow(d.y,2))

    // If not there yet, add a group 'symbol' for the arrow, let it fade in, and
    // add a path that will be the arrow.
    const symbol = selectEnter(selection, '.symbol')
      .append('g')
        .attr('class', 'symbol')
        .attr('opacity', 0.1)
    symbol
      .transition()
        .duration(updateDuration)
        .attr('opacity', 0.6)
    selectEnter(symbol, '.arrowPath')
      .append('path')
        .attr('class', 'arrowPath')
        .attr('fill', 'none')
        .attr('stroke-linecap', 'round')
        .attr('stroke-linejoin', 'round')

    // Update the arrow's shape and position
    selection.select('.arrowPath')
        .attr('stroke-width', strokeWidth)
        .attr('stroke', color)
        .each(function computeArrowPath(d) {
            selection = d3.select(this)
            const endPoint = {x: d.x+d.dx, y: d.y+d.dy}
            const dSvg = toSvgCoords(d)
            const endSvg = toSvgCoords(endPoint)
            const arrowSvg = {x: endSvg.x-dSvg.x, y: endSvg.y-dSvg.y}
            const length = norm(arrowSvg)
            const h = Math.min(arrowHeadlength, length/3) // limit head/shaft ratio
            selection
              .transition()
                .duration(updateDuration)
                .attr('transform', `rotate(${angle(arrowSvg)})`)
                .attr('d', `m 0 0 l ${length} 0 l -${h} -${h} m ${h} ${h} l -${h} ${h}`)
                // TODO use path+marker instead
        })

    // Set the tooltip title, if any.
    selection.select('.symbol').append('title').text(d=>d.title)
}

function removeSymbol(selection, {exitDuration}) {
    selection.select('.symbol')
      .transition()
        .duration(exitDuration)
        .attr('transform', 'scale(0)')
        .style('fill-opacity', 0)
        .remove()
}
