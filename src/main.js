import _ from 'lodash'
import gaussian from 'gaussian'
import { extendDomainBy } from './utils'

import scatterPlot from './scatterplot'
import flowerSymbol from './flowersymbol'
import arrowSymbol from './arrowsymbol'
import irisData from './irisdata'
import generateBananaData from './gaussianbananas'

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

// Substract coordinates for drawing arrows from sourceData to targetData
function compareData(sourceData, targetData) {
    return sourceData.map((d, i) => ({
        ...d,
        dx: targetData[i].x - d.x,
        dy: targetData[i].y - d.y,
    }))
}

// Maximum stdDev plot should expect (hardcoded for now)
const maxNoiseStdDev = 1.5

function drawPlot2d({dataset, dataStdDev=0.1, noiseStdDev=1.0}) {

    const container = d3.select('#plot_2d')

    const noiseVariance = Math.pow(noiseStdDev, 2);
    const noiseDistribution = gaussian(0, noiseVariance)
    const sampleNoise = () => noiseDistribution.ppf(Math.random())

    const originalData = generateBananaData({stdDev: dataStdDev})
    // const originalData = Math.random()>0.5 ? irisData : bananaData

    // We want all plots to have exactly the same size and scale.
    // Set the domain to the original data plus one stddev of noise
    const xDomain = extendDomainBy(d3.extent(originalData, d=>d.x), maxNoiseStdDev)
    const yDomain = extendDomainBy(d3.extent(originalData, d=>d.y), maxNoiseStdDev)

    // Configure the flower and arrow plots.
    const sharedPlotConfig = {
        // width: 400,
        // height: 300,
        keepAspectRatio: true,
        xDomain, yDomain,
    }
    const drawFlowers = scatterPlot({
        ...sharedPlotConfig,
        symbol: flowerSymbol(),
    })
    const drawArrows = scatterPlot({
        ...sharedPlotConfig,
        symbol: arrowSymbol(),
    })

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
