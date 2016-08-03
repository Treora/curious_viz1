import scatterPlot from './scatterplot'
import flowerSymbol from './flowersymbol'

export default function flowerPlot({container, ...props}) {
    const symbol = flowerSymbol({
        // symbolRadius: 4,
        // expandedSymbolRadius: 30,
        // enterDuration: 500,
        // exitDuration: 500,
        // drawLeavesDuration: 500,
        // hideLeavesAverageDelay: 1500,
        // hideLeavesDuration: 500,
    })

    const update = scatterPlot({symbol, updateDuration: 500, ...props})
    return update
}
