import * as d3 from 'd3'

import gaussian from 'gaussian'

import distributionPlot from '../plotcomponents/distributionplot'
import functionPlot from '../plotcomponents/functionplot'
import { addSlider, addSliderController, getSliderValue } from '../common/slider'
import images from '../common/images'
import { createSubplots } from '../common/subplots'

import { sq } from '../common/utils'

export default function init(containerId, options={}) {
    const container = d3.select(containerId)
    if (container.empty()) {
        console.log(`No element found with id ${containerId}. Skipping this plot.`)
        return
    }

    createSubplots(container, options)

    const sliderStdDev = addSlider({
        container: container.select('.plotIncSliders.data'),
        name: 'stdDev',
        labelImage: images['\\sigma'],
        min: 0.2, max: 1.8, step: 0.4,
        value: 1.0,
        onInput: updateAll,
        tooltip: true,
    })
    const sliderDataMean = addSlider({
        container: container.select('.plotIncSliders.data'),
        name: 'dataMean',
        labelImage: images['\\mu'],
        min: -2, max: 2, step: 1,
        value: 0.0,
        onInput: updateAll,
        tooltip: true,
    })
    const sliderNoiseStdDev = addSlider({
        container: container.select('.plotIncSliders.noisy'),
        name: 'noiseStdDev',
        labelImage: images['\\sigma_n'],
        min: 0.2, max: 1.8, step: 0.4,
        value: 1.0,
        onInput: updateAfterData,
        tooltip: true,
    })

    // Dragging on data plot also controls the slider
    addSliderController({
        controller: container.select('.plotContainer.data'),
        slider: sliderStdDev,
    })
    addSliderController({
        controller: container.select('.plotContainer.noisy'),
        slider: sliderNoiseStdDev,
    })

    const sharedPlotConfig = {
        xDomain: [-4, 4],
        yDomain: [0, 1.25],
        drawSamples: false,
        lineOpacity: 1,
    }

    const getSettings = () => {
        return {
            dataStdDev: getSliderValue(sliderStdDev),
            dataMean: getSliderValue(sliderDataMean),
            noiseStdDev: getSliderValue(sliderNoiseStdDev),
        }
    }

    function updateAll() {
        updateData()
        updateAfterData()
    }

    function updateData() {
        let { dataMean, dataStdDev } = getSettings()

        const dataDistribution = gaussian(dataMean, sq(dataStdDev))
        container.select('.plotContainer.data')
            .datum(dataDistribution)
            .call(distributionPlot({
                ...sharedPlotConfig,
                xLabelImage: images['x'],
                yLabelImage: images['p(x)'],
            }))
    }

    function updateAfterData() {
        let { dataMean, dataStdDev, noiseStdDev } = getSettings()

        const corruptedStdDev = Math.sqrt(sq(dataStdDev) + sq(noiseStdDev))
        const corruptedDistribution = gaussian(dataMean, sq(corruptedStdDev))

        const v = sq(dataStdDev) / sq(corruptedStdDev)
        const denoiseFunction = noisyValue => v * noisyValue + (1-v) * dataMean

        const plotCorruptedDistribution = distributionPlot({
            ...sharedPlotConfig,
            xLabelImage: images['\\tilde x'],
            yLabelImage: images['p(\\tilde x)'],
        })

        container.select('.plotContainer.noisy')
            .datum(corruptedDistribution)
            .call(plotCorruptedDistribution)

        container.select('.plotContainer.denoise')
            .datum(() => x=>x)
            .call(functionPlot({
                id: 1,
                xDomain: plotCorruptedDistribution.xScale.domain(),
                yDomain: plotCorruptedDistribution.xScale.domain(),
                lineOpacity: 0.2,
                lineStyle: '--',
        }))
        container.select('.plotContainer.denoise')
            .datum(() => denoiseFunction)
            .call(functionPlot({
                id: 0,
                xDomain: plotCorruptedDistribution.xScale.domain(),
                yDomain: plotCorruptedDistribution.xScale.domain(),
                xLabelImage: images['\\tilde x'],
                yLabelImage: images['g(\\tilde x)'],
        }))

    }

    updateAll()
}
