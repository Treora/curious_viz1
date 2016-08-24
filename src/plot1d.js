import gaussian from 'gaussian'

import distributionPlot from './distributionplot'
import functionPlot from './functionplot'

const xDomain = [-2, 2]

function updateAll(settings) {
    updateData(settings)
    updateAfterData(settings)
}

function updateData(settings) {
    let { dataMean, dataStdDev } = settings

    const dataDistribution = gaussian(dataMean, dataStdDev)
    d3.select('#plot_1d_data')
        .datum(dataDistribution)
        .call(distributionPlot({
            xDomain,
        }))
}

function updateAfterData(settings) {
    updateNoise(settings)
    updateAfterNoise(settings)
}

function updateNoise(settings) {
    let { noiseMean, noiseStdDev } = settings

    const noiseDistribution = gaussian(noiseMean, noiseStdDev)

    d3.select('#plot_1d_noise')
        .datum(noiseDistribution)
        .call(distributionPlot({
            xDomain,
            // yDomain: [0, 1/2/Math.sqrt(noiseStdDev)], // scale for constant height
            drawSamples: false,
        }))
}

function updateAfterNoise(settings) {
    let { dataMean, noiseMean, dataStdDev, noiseStdDev } = settings

    const corruptedDistribution = gaussian(dataMean+noiseMean, dataStdDev+noiseStdDev)
    const denoiseFunction = () => () => Math.random()
    const denoisedDistribution = gaussian(0,1)

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
        .datum(denoiseFunction)
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
