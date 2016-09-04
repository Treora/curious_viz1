import { selectEnter, sq } from './utils'

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
    opacity=0.6,
    strokeWidth=2,
    xScale, yScale
}) {
    const toSvgCoords = d => ({x: xScale(d.x), y: yScale(d.y)})
    const angle = d => Math.atan2(d.y, d.x) * 180/Math.PI
    const norm = d => Math.sqrt(sq(d.x) + sq(d.y))

    function computeArrowPath(duration) {
        // This is not pretty, but I would not know how to get both the data
        // and own arguments (or a transition-selection) passed to this
        // callback in selection.each()/call(). Therefore we wrap this function.
        return function computeArrowPath(d) {
            selection = d3.select(this)
            const endPoint = {x: d.x+d.dx, y: d.y+d.dy}
            const dSvg = toSvgCoords(d)
            const endSvg = toSvgCoords(endPoint)
            const arrowSvg = {x: endSvg.x-dSvg.x, y: endSvg.y-dSvg.y}
            const length = norm(arrowSvg)
            const h = Math.min(arrowHeadlength, length/3) // limit head/shaft ratio
            selection
              .transition()
                .duration(duration)
                .attr('transform', `rotate(${angle(arrowSvg)})`)
                .attr('d', `m 0 0 l ${length} 0 l -${h} -${h} m ${h} ${h} l -${h} ${h}`)
                // TODO use path+marker instead
        }
    }

    // Update the arrow's shape and position
    selection.select('.symbol > .arrowPath')
        .attr('stroke-width', strokeWidth)
        .attr('stroke', color)
        .each(computeArrowPath(updateDuration))

    // If not there yet, add a group 'symbol' for the arrow, let it fade in, and
    // add a path that will be the arrow.
    const symbol = selectEnter(selection, '.symbol')
      .append('g')
        .attr('class', 'symbol')
        .attr('opacity', d3.min(0.1, opacity))
    symbol
      .transition()
        .duration(enterDuration)
        .attr('opacity', opacity)
    selectEnter(symbol, '.arrowPath')
      .append('path')
        .attr('class', 'arrowPath')
        .attr('fill', 'none')
        .attr('stroke-linecap', 'round')
        .attr('stroke-linejoin', 'round')
        .attr('stroke-width', strokeWidth)
        .attr('stroke', color)
        .each(computeArrowPath(0))

}

function removeSymbol(selection, {exitDuration=500}) {
    selection
      .transition()
        .duration(exitDuration)
        .remove()
      .select('.symbol')
        .style('opacity', 0)
}
