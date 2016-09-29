import linspace from 'linspace'

import functionPlot from '../plotcomponents/functionplot'
import { addSlider, addSliderController, getSliderValue } from '../common/slider'
import images from '../common/images'
import { createSubplots } from '../common/subplots'

export default function init(containerId, plotDatas, options={}) {
    const container = d3.select(containerId)

    createSubplots(container, options)

    const slider = addSlider({
        container: container.select('.plotIncSliders.data'),
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
        controller: container.select('.plotContainer.data'),
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
        xLabelImage: images['\\tilde x'],
        yLabelImage: images['p(\\tilde x)'],
    })


    function updateAll() {
        let { plotNumber } = getSettings()

        const plotData = plotDatas[plotNumber]
        const x = (plotData.x !== undefined) ? plotData.x
            : linspace(...plotData.xDomain, plotData.data.length)

        container.select('.plotContainer.data')
            .datum({x, y: plotData.data})
            .call(plotOriginalDistribution)

        container.select('.plotContainer.noisy')
            .datum({x, y: plotData.noisy})
            .call(plotCorruptedDistribution)

        // Plot diagonal dashed line
        container.select('.plotContainer.denoise')
            .datum({x, y: x})
            .call(functionPlot({
                id: 1,
                xDomain: plotCorruptedDistribution.xScale.domain(),
                yDomain: plotOriginalDistribution.xScale.domain(),
                lineOpacity: 0.2,
                lineStyle: '--',
        }))

        container.select('.plotContainer.denoise')
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
