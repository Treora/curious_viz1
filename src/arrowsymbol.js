export default function defineSymbol(symbolProps) {
    return {
        props: symbolProps,
        draw: (selection, args) =>
            drawSymbol(selection, {...args, ...symbolProps}),
        remove: (selection, args) =>
            removeSymbol(selection, {...args, ...symbolProps}),
    }
}

function drawSymbol(selection, {enterDuration, arrowHeadlength=3, xScale, yScale}) {
    const toSvgCoords = d => ({x: xScale(d.x), y: yScale(d.y)})

    function drawArrow(selection, d) {
        const endPoint = {x: d.x+d.dx, y: d.y+d.dy}
        const dSvg = toSvgCoords(d)
        const endSvg = toSvgCoords(endPoint)
        const arrowSvg = {x: endSvg.x-dSvg.x, y: endSvg.y-dSvg.y}
        const length = norm(arrowSvg)
        const h = Math.min(arrowHeadlength, length/3) // limit head/shaft ratio
        selection
            .attr('transform', `rotate(${angle(arrowSvg)})`)
            .attr('d', `m 0 0 l ${length} 0 l -${h} -${h} m ${h} ${h} l -${h} ${h}`)
    }

    selection
      .append('g')
        .attr('class', 'symbol')
      .append('path')
        .each(function (d) {drawArrow(d3.select(this), d)})
        .attr('stroke-width', '2')
        .attr('stroke', 'black')
        .attr('fill', 'none')
        .attr('stroke-linecap', 'round')
        .attr('stroke-linejoin', 'round')
        .attr('stroke-cor', 'round')
        .attr('opacity', 0)
      .transition()
        .duration(enterDuration)
        .attr('opacity', 0.6)
    selection.select('.symbol').append('title').text(d=>d.title)
}

function removeSymbol(selection, {exitDuration}) {
    selection.select('.symbol')
      .transition()
        .duration(exitDuration)
        .attr('transform', 'scale(0)')
        .style('fill-opacity', 0)
    selection
      .transition()
        .delay(exitDuration)
        .remove()
}


// Utils

function angle(d) {
    return Math.atan2(d.y, d.x) * 180/Math.PI
}

function norm(d) {
    return Math.sqrt(Math.pow(d.x,2) + Math.pow(d.y,2))
}
