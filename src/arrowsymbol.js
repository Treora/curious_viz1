export default function defineSymbol({
    arrowLength=15,
    arrowHeadlength=3,
    ...otherSymbolProps
}) {
    let symbolProps = {
        arrowLength,
        arrowHeadlength,
        symbolRadius: arrowLength+3,
        ...otherSymbolProps,
    }
    return {
        props: symbolProps,
        draw: (selection, args) =>
            drawSymbol(selection, {...args, ...symbolProps}),
        remove: (selection, args) =>
            removeSymbol(selection, {...args, ...symbolProps}),
    }
}

function drawSymbol(selection, {enterDuration, arrowLength, arrowHeadlength}) {
    selection
      .append('g')
        .attr('class', 'symbol')
      .append('path')
        .attr('transform', d=>`rotate(${angle(d)})`)
        .attr('d', d => {
            const length = arrowLength * norm(d)
            const h = Math.min(arrowHeadlength, length/3) // limit head/shaft ratio
            return `m 0 0 l ${length} 0 l -${h} -${h} m ${h} ${h} l -${h} ${h}`
        })
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

function angle(d) {
    if (d.angle !== undefined)
        return d.angle
    else
        return Math.atan2(d.dy, d.dx) * 180/Math.PI
}

function norm(d) {
    if (d.length !== undefined)
        return d.length
    else
        return Math.sqrt(Math.pow(d.dx,2) + Math.pow(d.dy,2))
}
