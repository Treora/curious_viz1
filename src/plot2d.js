import _ from 'lodash'
import randomSeed from 'random-seed'
import gaussian from 'gaussian'
import linspace from 'linspace'
import jsonStableStringify from 'json-stable-stringify'

import { sq } from './utils'
import scatterPlot from './scatterplot'
import arrowSymbol from './arrowsymbol'
import pointSymbol from './pointsymbol'
import generateBananaData from './gaussianbananas'
import { addSlider, addSliderController, getSliderValue } from './slider'
import images from './images'

const rand = randomSeed.create()

function optimalDenoise({noisySample, originalData, noiseDistribution}) {
    // The probability, for each datum, that corrupting it produces noisySample.
    const pNoise = originalData.map(datum => (
        noiseDistribution.pdf(noisySample.x - datum.x)
      * noiseDistribution.pdf(noisySample.y - datum.y)
    ))
    // The optimal denoised value is the weighted average of the data points,
    // weighted with the probability of each being the origin of the corrupted
    // sample.
    const numX = _.mean(originalData.map((datum, i) => datum.x*pNoise[i]))
    const numY = _.mean(originalData.map((datum, i) => datum.y*pNoise[i]))
    const pNoisySample = _.mean(pNoise)
    return {x: numX/pNoisySample, y: numY/pNoisySample, pNoisySample}
}

// Substract coordinates for drawing arrows from sourceData to targetData
function compareData(sourceData, targetData) {
    return sourceData.map((d, i) => {
      const target = (targetData[i].id === d.id)
        ? targetData[i] // quick heuristic: test item at same index
        : _.find(targetData, t => (t.id === d.id))
      return {
        id: d.id,
        x: d.x,
        y: d.y,
        dx: target.x - d.x,
        dy: target.y - d.y,
        pNoisySample: targetData[i].pNoisySample,
    }})
}

// Computes the data for the plots
function computeAll({dataStdDev, noiseStdDev, xDomain, yDomain}) {
    const originalData = generateBananaData({stdDev: dataStdDev})

    rand.seed(4321)
    const noiseVariance = sq(noiseStdDev);
    const noiseDistribution = gaussian(0, noiseVariance)
    const sampleNoise = () => noiseDistribution.ppf(rand.random())

    // Apply gaussian noise to the data points.
    const noisyData = originalData.map(d => ({
        ...d,
        x: d.x + sampleNoise(),
        y: d.y + sampleNoise(),
    }))

    // Calculate denoising function's vector field
    const vectorFieldSize = 12
    const gridPoints = _.flatten(
        linspace(...xDomain, vectorFieldSize).map(
            x => linspace(...yDomain, vectorFieldSize).map(
                y => ({x, y, id: 'x'+x+'y'+y})
            )
        )
    )
    const denoisedGridPoints = gridPoints.map(gridPoint => ({
        ...gridPoint,
        ...optimalDenoise({noisySample: gridPoint, originalData, noiseDistribution}),
    }))
    const denoiseField = compareData(gridPoints, denoisedGridPoints)

    return {originalData, noisyData, denoiseField}
}

// Wrap a cache around computeAll, to prevent recomputing things.
const getOrComputeAll = _.memoize(computeAll, (...args) => jsonStableStringify(args))


export default function init(containerId, {sliderInitialValue}) {
    const container = d3.select(containerId)

    // Create four plots
    const subplots = ['data', 'noisy', 'denoise']
    for (let i in subplots) {
        container.append('div')
            .attr('class', 'plotContainer ' + subplots[i])
    }

    // Add the slider input
    const slider = addSlider({
        container,
        name: 'stdDev',
        label: 'variance:',
        min: 0.2, max: 1.0, step: 0.2,
        value: sliderInitialValue || 0.4,
        onInput: updateAll,
        tooltip: false,
    })

    // Dragging on data plot also controls the slider
    addSliderController({
        controller: container.select('.data'),
        slider,
    })

    const getSettings = () => ({
        dataStdDev: getSliderValue(slider),
        noiseStdDev: 1.0,
    })

    // Set the data domain so all plots have exactly the same size and scale.
    const xDomain = [0, 12]
    const yDomain = [0, 12]

    // Configure the plots.
    const sharedPlotConfig = {
        keepAspectRatio: true,
        xDomain, yDomain,
        symbol: pointSymbol({
            opacity: 0.5,
            color: '#33f',
            exitDuration: 0,
        }),
        updateDuration: 300,
    }

    function updateAll() {
        let { originalData, noisyData, denoiseField } = getOrComputeAll({
            ...getSettings(),
            xDomain, yDomain,
        })

        container.select('.data')
            .datum(originalData)
            .call(scatterPlot({
                ...sharedPlotConfig,
                xLabelImage: images['x_1'],
                yLabelImage: images['x_2'],
            }))

        container.select('.noisy')
            .datum(noisyData)
            .call(scatterPlot({
                ...sharedPlotConfig,
                xLabelImage: images['\\tilde x_1'],
                yLabelImage: images['\\tilde x_2'],
            }))

        container.select('.denoise')
            .datum(denoiseField)
            .call(scatterPlot({
                ...sharedPlotConfig,
                symbol: arrowSymbol({
                    // Faint arrows from highly improbable (corrupted) points
                    opacity: d => Math.min(0.5, 10*Math.sqrt(d.pNoisySample)),
                    // Alternatively, simply faint long arrows
                    // opacity: d => 0.5*Math.min(1, 1/(sq(d.dx)+sq(d.dy))),
                }),
                xLabelImage: images['\\tilde x_1 \\rightarrow \\hat x_1'],
                yLabelImage: images['\\tilde x_2 \\rightarrow \\hat x_2'],
            }))

    }

    updateAll()
}
