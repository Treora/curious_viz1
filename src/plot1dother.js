import gaussian from 'gaussian'
import linspace from 'linspace'

import distributionPlot from './distributionplot'
import functionPlot from './functionplot'
import { addSlider, addSliderController, getSliderValue } from './slider'
import images from './images'
import { sq } from './utils'

export default function init(containerId, plotDatas) {
    const container = d3.select(containerId)
    const subplots = ['data', 'noisy', 'denoise']
    for (let i in subplots) {
        container.append('div')
            .attr('class', 'plotContainer ' + subplots[i])
    }
    const slider = addSlider({
        container,
        name: 'stdDev',
        label: '&sigma;<sub>x</sub>:',
        min: 0, max: plotDatas.length-1,
        value: Math.round((plotDatas.length-1)/2),
        tooltip: true,
        tooltipText: sliderValue => plotDatas[sliderValue]['sigma'],
        onInput: updateAll,
    })

    // Dragging on data plot also controls the slider
    addSliderController({
        controller: container.select('.data'),
        slider,
    })

    const getSettings = () => {
        return {
            plotNumber: getSliderValue(slider),
        }
    }

    const sharedPlotConfig = {
        yDomain: [0, 0.8],
    }

    const plotOriginalDistribution = functionPlot({
        ...sharedPlotConfig,
        updateDuration: 0,
        xLabelImage: images['x'],
        yLabelImage: images['p(x)'],
    })

    const plotCorruptedDistribution = functionPlot({
        ...sharedPlotConfig,
        yDomain: plotOriginalDistribution.yScale.domain(),
        xLabelImage: images['\\tilde x'],
        yLabelImage: images['p(\\tilde x)'],
    })


    function updateAll() {
        let { plotNumber } = getSettings()

        const plotData = plotDatas[plotNumber]
        const x = (plotData.x !== undefined) ? plotData.x
            : linspace(...plotData.xDomain, plotData.data.length)

        container.select('.data')
            .datum({x, y: plotData.data})
            .call(plotOriginalDistribution)

        container.select('.noisy')
            .datum({x, y: plotData.noisy})
            .call(plotCorruptedDistribution)

        // Plot diagonal dashed line
        container.select('.denoise')
            .datum({x, y: x})
            .call(functionPlot({
                id: 1,
                xDomain: plotCorruptedDistribution.xScale.domain(),
                yDomain: plotOriginalDistribution.xScale.domain(),
                lineOpacity: 0.2,
                lineStyle: '--',
        }))

        container.select('.denoise')
            .datum({x, y: plotData.denoise})
            .call(functionPlot({
                id: 0,
                xDomain: plotCorruptedDistribution.xScale.domain(),
                yDomain: plotOriginalDistribution.xScale.domain(),
                xLabelImage: images['\\tilde x'],
                yLabelImage: images['g(\\tilde x)'],
        }))

    }

    updateAll()
}
