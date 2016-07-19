export default function defineSymbol(svg, symbolProps) {
    return {
        props: symbolProps,
        draw: (selection, args) =>
            drawSymbol(selection, {...symbolProps, ...args}),
        remove: (selection, args) =>
            removeSymbol(selection, {...symbolProps, ...args}),
    }
}

function drawSymbol(selection, {enterDuration, symbolRadius}) {
    selection
      .append('g')
        .attr('class', 'symbol')
      .append('circle')
        .attr('r', 0)
        .style('fill-opacity', 0)
        .style('fill', 'purple')
      .transition()
        .duration(enterDuration)
        .attr('r', symbolRadius)
        .style('fill-opacity', 1)
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
