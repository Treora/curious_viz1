import scatterPlot from './scatterplot'
import flowerSymbol from './flowersymbol'

export default function flowerPlot({container, ...props}) {
    const svg = d3.select(container).append('svg')

    const symbol = flowerSymbol(
        svg,
        {
            symbolRadius: 5,
            expandedSymbolRadius: 50,
            enterDuration: 500,
            exitDuration: 500,
            drawLeavesDuration: 500,
            hideLeavesAverageDelay: 1500,
            hideLeavesDuration: 500,
        }
    )

    const update = scatterPlot({svg, symbol, updateDuration: 500, ...props})
    return update
}
