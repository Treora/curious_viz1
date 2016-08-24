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


// Set the data domain so all plots have exactly the same size and scale.
// Set the domain to the original data plus one stddev of noise
// const xDomain = extendDomainBy(d3.extent(originalData, d=>d.x), noiseStdDev)
// const yDomain = extendDomainBy(d3.extent(originalData, d=>d.y), noiseStdDev)
// ...or whatever, let's just hard-code the domain to keep axes static.
const xDomain = [0, 12]
const yDomain = [0, 12]

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

let originalData, noisyData, noiseDistribution, denoisedData

function updateAll(settings) {
    updateData(settings)
    updateAfterData(settings)
}

function updateData(settings) {
    let { dataStdDev } = settings

    originalData = generateBananaData({stdDev: dataStdDev})

    d3.select('#plot_2d_data')
        .datum(originalData)
        .call(drawFlowers)

}

function updateAfterData(settings) {
    updateNoise(settings)
    updateAfterNoise(settings)
}

function updateNoise(settings) {
    let { noiseStdDev } = settings

    const noiseVariance = Math.pow(noiseStdDev, 2);
    noiseDistribution = gaussian(0, noiseVariance)
    const sampleNoise = () => noiseDistribution.ppf(Math.random())

    // Apply gaussian noise to the data points.
    noisyData = originalData.map(d => ({
        ...d,
        x: d.x + sampleNoise(),
        y: d.y + sampleNoise(),
    }))

    d3.select('#plot_2d_noise')
        .datum(compareData(originalData, noisyData))
        .call(drawArrows)

    return { noisyData, noiseDistribution }
}

function updateAfterNoise(settings) {
    let { dataStdDev, noiseStdDev } = settings

    // Denoise the noisy data using optimal denoising function.
    denoisedData = noisyData.map(noisySample => ({
        ...noisySample,
        ...optimalDenoise({noisySample, originalData, noiseDistribution}),
    }))

    d3.select('#plot_2d_noisy')
        .datum(noisyData)
        .call(drawFlowers)

    d3.select('#plot_2d_denoise')
        .datum(compareData(noisyData, denoisedData))
        .call(drawArrows)

    d3.select('#plot_2d_denoised')
        .datum(denoisedData)
        .call(drawFlowers)

}

window.plot2d = {
    updateAll,
    updateData,
    updateAfterData,
    updateNoise,
    updateAfterNoise,
}
