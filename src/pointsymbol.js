import { selectEnter } from './utils'


export default function defineSymbol(symbolProps) {
    return {
        props: symbolProps,
        draw: (selection, args) =>
            drawSymbol(selection, {...symbolProps, ...args}),
        remove: (selection, args) =>
            removeSymbol(selection, {...symbolProps, ...args}),
    }
}

function drawSymbol(selection, {
    enterDuration=500,
    updateDuration=500,
    symbolRadius=4,
    opacity=0.5,
    color='blue',
}) {
    selection.select('.symbol')
      .transition()
        .duration(updateDuration)
        .attr('r', symbolRadius)
        .style('fill-opacity', opacity)
        .style('fill', color)

    selectEnter(selection, '.symbol')
      .append('circle')
        .attr('class', 'symbol')
        .attr('r', 0)
        .style('fill-opacity', opacity)
        .style('fill', color)
      .transition()
        .duration(enterDuration)
        .attr('r', symbolRadius)
}

function removeSymbol(selection, {exitDuration=500}) {
    selection.select('.symbol')
      .transition()
        .duration(exitDuration)
        .attr('r', 0)
        .remove()
}
