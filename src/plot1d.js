import gaussian from 'gaussian'

import distributionPlot from './distributionplot'
import functionPlot from './functionplot'

const sq = x => Math.pow(x, 2)

const xDomain = [-4, 4]

const getSettings = () => {
    const stdDevInput = document.getElementById('plot_1d_selectStdDev')
    const noiseInput = document.getElementById('plot_1d_selectNoise')
    return {
        dataMean: 0,
        dataStdDev: +stdDevInput.value || stdDevInput.defaultValue,
        noiseStdDev: +noiseInput.value || noiseInput.defaultValue,
    }
}

function updateAll() {
    updateData()
    updateAfterData()
}

function updateData() {
    let { dataMean, dataStdDev } = getSettings()

    const dataDistribution = gaussian(dataMean, sq(dataStdDev))
    d3.select('#plot_1d_data')
        .datum(dataDistribution)
        .call(distributionPlot({
            xDomain,
        }))
}

function updateAfterData() {
    updateNoise()
    updateAfterNoise()
}

function updateNoise() {
    let { noiseStdDev } = getSettings()

    const noiseDistribution = gaussian(0, sq(noiseStdDev))

    d3.select('#plot_1d_noise')
        .datum(noiseDistribution)
        .call(distributionPlot({
            xDomain,
            // yDomain: [0, 1/2/Math.sqrt(noiseStdDev)], // scale for constant height
            drawSamples: false,
        }))
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
        xDomain,
    })

    const plotDenoisedDistribution = distributionPlot({
        xDomain,
    })

    d3.select('#plot_1d_noisy')
        .datum(corruptedDistribution)
        .call(plotCorruptedDistribution)

    d3.select('#plot_1d_denoised')
        .datum(denoisedDistribution)
        .call(plotDenoisedDistribution)

    d3.select('#plot_1d_denoise')
        .datum(() => denoiseFunction)
        .call(functionPlot({
        xDomain: plotCorruptedDistribution.xScale.domain(),
        yDomain: plotDenoisedDistribution.xScale.domain(),
    }))

}

window.plot1d = {
    updateAll,
    updateData,
    updateAfterData,
    updateNoise,
    updateAfterNoise,
}
