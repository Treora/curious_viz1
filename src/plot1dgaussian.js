import gaussian from 'gaussian'

import distributionPlot from './distributionplot'
import functionPlot from './functionplot'
import { addSlider, addSliderController } from './slider'
import images from './images'

const sq = x => Math.pow(x, 2)

export default function init(containerId) {
    const container = d3.select(containerId)

    const subplots = ['data', 'noisy', 'denoise', 'denoised']
    for (let i in subplots) {
        container.append('div')
            .attr('class', 'plotContainer ' + subplots[i])
    }
    const slider = addSlider({
        container,
        name: 'stdDev',
        label: '&sigma;<sub>x</sub>:',
        min: 0.2, max: 1.8, step: 0.4,
        value: 1.0,
        onInput: updateAll,
        tooltip: true,
    })
    const slider1 = addSlider({
        container,
        name: 'noiseStdDev',
        label: 'noise&nbsp;&sigma;<sub>n</sub>:',
        min: 0.2, max: 1.8, step: 0.4,
        value: 1.0,
        onInput: updateAfterData,
        tooltip: true,
    })

    // Dragging on data plot also controls the slider
    addSliderController({
        controller: container.select('.data'),
        slider,
    })

    const sharedPlotConfig = {
        xDomain: [-4, 4],
        yDomain: [0, 1.25],
        drawSamples: false,
        lineOpacity: 1,
    }

    const getSettings = () => {
        const stdDevInput = container.select('.slider.stdDev').node()
        const noiseInput = container.select('.slider.noiseStdDev').node()
        return {
            dataMean: 0,
            dataStdDev: +stdDevInput.value || +stdDevInput.defaultValue,
            noiseStdDev: +noiseInput.value || +noiseInput.defaultValue,
        }
    }

    function updateAll() {
        updateData()
        updateAfterData()
    }


    function updateData() {
        let { dataMean, dataStdDev } = getSettings()

        const dataDistribution = gaussian(dataMean, sq(dataStdDev))
        container.select('.data')
            .datum(dataDistribution)
            .call(distributionPlot({
                ...sharedPlotConfig,
                xLabelImage: images['x'],
                yLabelImage: images['p(x)'],
            }))
    }

    function updateAfterData() {
        updateNoise()
        updateAfterNoise()
    }

    function updateNoise() {
        let { noiseStdDev } = getSettings()

        const noiseDistribution = gaussian(0, sq(noiseStdDev))

        // d3.select('#plot_1d_gaussian_noise')
        //     .datum(noiseDistribution)
        //     .call(distributionPlot({
        //         ...sharedPlotConfig,
        //         xLabel: 'n',
        //         yLabel: 'p(n)',
        //         // yDomain: [0, 1/2/Math.sqrt(noiseStdDev)], // scale for constant height
        //     }))
    }

    function updateAfterNoise() {
        let { dataMean, dataStdDev, noiseStdDev } = getSettings()

        const corruptedStdDev = Math.sqrt(sq(dataStdDev) + sq(noiseStdDev))
        const corruptedDistribution = gaussian(dataMean, sq(corruptedStdDev))

        const v = sq(dataStdDev) / sq(corruptedStdDev)
        const denoiseFunction = noisyValue => v * noisyValue + (1-v) * dataMean

        const denoisedStdDev = corruptedStdDev * v
        const denoisedDistribution = gaussian(dataMean, sq(denoisedStdDev))

        const plotCorruptedDistribution = distributionPlot({
            ...sharedPlotConfig,
            xLabelImage: images['\\tilde x'],
            yLabelImage: images['p(\\tilde x)'],
        })

        const plotDenoisedDistribution = distributionPlot({
            ...sharedPlotConfig,
            xLabelImage: images['\\hat x'],
            yLabelImage: images['p(\\hat x)'],
        })

        container.select('.noisy')
            .datum(corruptedDistribution)
            .call(plotCorruptedDistribution)

        container.select('.denoised')
            .datum(denoisedDistribution)
            .call(plotDenoisedDistribution)

        container.select('.denoise')
            .datum(() => x=>x)
            .call(functionPlot({
                id: 1,
                xDomain: plotCorruptedDistribution.xScale.domain(),
                yDomain: plotDenoisedDistribution.xScale.domain(),
                lineOpacity: 0.2,
                lineStyle: '--',
        }))
        container.select('.denoise')
            .datum(() => denoiseFunction)
            .call(functionPlot({
                id: 0,
                xDomain: plotCorruptedDistribution.xScale.domain(),
                yDomain: plotDenoisedDistribution.xScale.domain(),
                xLabelImage: images['\\tilde x'],
                yLabelImage: images['g(\\tilde x)'],
        }))

    }

    updateAll()
}
