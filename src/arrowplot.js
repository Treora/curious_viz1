import scatterPlot from './scatterplot'
import arrowSymbol from './arrowsymbol'

export default function arrowPlot({container, ...props}) {
    const symbol = arrowSymbol({
        enterDuration: 500,
        exitDuration: 500,
    })

    const update = scatterPlot({symbol, updateDuration: 500, ...props})
    return update
}
