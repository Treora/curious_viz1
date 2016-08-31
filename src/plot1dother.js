import gaussian from 'gaussian'

import distributionPlot from './distributionplot'
import functionPlot from './functionplot'
import { addSlider, addSliderController } from './slider'
import images from './images'

const sq = x => Math.pow(x, 2)

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
        label: 'data&nbsp;variance',
        min: 0, max: plotDatas.length-1,
        value: Math.round((plotDatas.length-1)/2),
        oninput: function () { if (hasCurrentValueChanged(this)) updateAll() },
    })

    // Dragging on data plot also controls the slider
    addSliderController({
        controller: container.select('.data'),
        slider,
    })

    const getSettings = () => {
        const sliderInput = container.select('.slider').node()
        return {
            plotNumber: +sliderInput.value,
        }
    }

    const sharedPlotConfig = {
        // xDomain: [-4, 4],
        yDomain: [0, 0.8],
    }

    const plotOriginalDistribution = functionPlot({
        ...sharedPlotConfig,
        updateDuration: 0,
        xLabelImage: images['x'],
        yLabelImage: images['p(x)'],
    })

    function updateAll() {
        updateData();
        updateAfterData();
    }

    function updateData() {
        let { plotNumber } = getSettings()
        const plotData = plotDatas[plotNumber]

        container.select('.data')
            .datum({x: plotData.x, y: plotData.data})
            .call(plotOriginalDistribution)

    }

    function updateAfterData() {
        let { plotNumber } = getSettings()
        const plotData = plotDatas[plotNumber]

        const plotCorruptedDistribution = functionPlot({
            ...sharedPlotConfig,
            yDomain: plotOriginalDistribution.yScale.domain(),
            xLabelImage: images['\\tilde x'],
            yLabelImage: images['p(\\tilde x)'],
        })

        container.select('.noisy')
            .datum({x: plotData.x, y: plotData.noisy})
            .call(plotCorruptedDistribution)

        container.select('.denoise')
            .datum({x: plotData.x, y: plotData.x})
            .call(functionPlot({
                id: 1,
                xDomain: plotCorruptedDistribution.xScale.domain(),
                yDomain: plotOriginalDistribution.xScale.domain(),
                lineOpacity: 0.2,
                lineStyle: '--',
        }))

        container.select('.denoise')
            .datum({x: plotData.x, y: plotData.denoise})
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
