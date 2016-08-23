import gaussian from 'gaussian'

import distributionPlot from './distributionplot'
import functionPlot from './functionplot'

function drawPlot1d({distribution, dataStdDev, noiseStdDev}) {
    const container = d3.select('#plot_1d')

    const xDomain = [-2, 2]
    const drawDistribution = distributionPlot({
        xDomain,
        // yDomain: [0, 1],
    })
    const drawFunction = functionPlot({
        // yDomain: [0, 2],
    })

    const uniformDistribution = {
        ppf: p => p,
        sample: Math.random,
        pdf: x => 1,
    }

    const dataMean = 0
    const noiseMean = 0
    const dataDistribution = gaussian(dataMean, dataStdDev)
    const noiseDistribution = gaussian(noiseMean, noiseStdDev)
    const corruptedDistribution = gaussian(dataMean+noiseMean, dataStdDev+noiseStdDev)
    const denoiseFunction = () => () => Math.random()
    const denoisedDistribution = gaussian(0,1)

    container.select('#plot_1d_data')
        .datum(dataDistribution)
        .call(drawDistribution)

    container.select('#plot_1d_noise')
        .datum(noiseDistribution)
        .call(distributionPlot({
            xDomain,
            // yDomain: [0, 1/2/Math.sqrt(noiseStdDev)], // scale for constant height
        }))

    container.select('#plot_1d_noisy')
        .datum(corruptedDistribution)
        .call(drawDistribution)

    container.select('#plot_1d_denoise')
        .datum(denoiseFunction)
        .call(drawFunction)

    container.select('#plot_1d_denoised')
        .datum(denoisedDistribution)
        .call(drawDistribution)

}

window.drawPlot1d = drawPlot1d
