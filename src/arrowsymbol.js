export default function defineSymbol(svg, symbolProps) {
    return {
        props: symbolProps,
        draw: (selection, args) =>
            drawSymbol(selection, {...symbolProps, ...args}),
        remove: (selection, args) =>
            removeSymbol(selection, {...symbolProps, ...args}),
    }
}

function drawSymbol(selection, {enterDuration, symbolRadius, arrowLength=15, arrowHeadlength=3}) {
    const l = arrowHeadlength
    selection
      .append('g')
        .attr('class', 'symbol')
      .append('path')
        .attr('transform', d=>`rotate(${d.angle || 0})`)
        .attr('d', d => `m 0 0 l ${arrowLength} 0 l -${l} -${l} m ${l} ${l} l -${l} ${l}`)
        .attr('stroke-width', '3')
        .attr('stroke', 'black')
        .attr('fill', 'none')
        .attr('stroke-linecap', 'round')
        .attr('stroke-linejoin', 'round')
        .attr('stroke-cor', 'round')
        .attr('opacity', 0)
      .transition()
        .duration(enterDuration)
        .attr('opacity', 1)
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
