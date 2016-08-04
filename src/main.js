import _ from 'lodash'
import gaussian from 'gaussian'

import flowerPlot from './flowerplot'
import arrowPlot from './arrowplot'
import originalData from './irisdata'
//import originalData from './gaussianbananas'


function optimalDenoise({noisySample, originalData, noiseDistribution}) {
    const pNoise = originalData.map(datum => (
        noiseDistribution.pdf(noisySample.x - datum.x)
      * noiseDistribution.pdf(noisySample.y - datum.y)
    ))
    const numX = _.mean(originalData.map((datum, i) => datum.x*pNoise[i]))
    const numY = _.mean(originalData.map((datum, i) => datum.y*pNoise[i]))
    const den = _.mean(pNoise)
    return {x: numX/den, y: numY/den}
}

const noiseStdDev = 1.3;
const noiseMean = 0;
const noiseVariance = Math.pow(noiseStdDev, 2);
const noiseDistribution = gaussian(noiseMean, noiseVariance)
const sampleNoise = () => noiseDistribution.ppf(Math.random())


function drawPlot2d() {
    const container = d3.select('#plot_2d')

    // We want all plots to have exactly the same size and scale.
    // Set the domain to the original data plus one stddev of noise
    const xDomain = extendDomainBy(d3.extent(originalData, d=>d.x), noiseStdDev)
    const yDomain = extendDomainBy(d3.extent(originalData, d=>d.y), noiseStdDev)

    // Config shared by the 2d plots
    const plotconfig = {
        // width: 400,
        // height: 300,
        margin: 40,
        keepAspectRatio: true,
        xDomain, yDomain,
    }
    const drawFlowers = flowerPlot(plotconfig)
    const drawArrows = arrowPlot(plotconfig)

    // Apply gaussian noise to the data points.
    const noisyData = originalData.map(d => ({
        ...d,
        x: d.x + sampleNoise(),
        y: d.y + sampleNoise(),
    }))

    // Denoise the noisy data using optimal denoising function.
    const denoisedData = noisyData.map(noisySample => ({
        ...noisySample,
        ...optimalDenoise({noisySample, originalData, noiseDistribution}),
    }))

    container.select('#plot_2d_data')
        .datum(originalData)
        .call(drawFlowers)

    container.select('#plot_2d_noise')
        .datum(compareData(originalData, noisyData))
        .call(drawArrows)

    container.select('#plot_2d_noisy')
        .datum(noisyData)
        .call(drawFlowers)

    container.select('#plot_2d_denoise')
        .datum(compareData(noisyData, denoisedData))
        .call(drawArrows)

    container.select('#plot_2d_denoised')
        .datum(denoisedData)
        .call(drawFlowers)

}

window.drawPlot2d = drawPlot2d


// Utils

function compareData(sourceData, targetData) {
    return sourceData.map((d, i) => ({
        ...d,
        dx: targetData[i].x - d.x,
        dy: targetData[i].y - d.y,
    }))
}

const extendDomainBy = (domain, margin) => [
    domain[0] - margin, domain[1] + margin
]
