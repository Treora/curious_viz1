import _ from 'lodash'
import * as d3 from 'd3'
import randomSeed from 'random-seed'
import gaussian from 'gaussian'
import linspace from 'linspace'
import jsonStableStringify from 'json-stable-stringify'

import { sq } from '../common/utils'
import scatterPlot from '../plotcomponents/scatterplot'
import arrowSymbol from '../plotcomponents/symbols/arrowsymbol'
import pointSymbol from '../plotcomponents/symbols/pointsymbol'
import generateBananaData from '../datasets/gaussianbananas'
import { addSlider, addSliderController, getSliderValue } from '../common/slider'
import images from '../common/images'
import { createSubplots } from '../common/subplots'

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

    rand.seed(42)
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


export default function init(containerId, options={}) {
    const container = d3.select(containerId)
    if (container.empty()) {
        console.log(`No element found with id ${containerId}. Skipping this plot.`)
        return
    }

    const imgTag = img => `<br><img src="${img.uri}" width="${img.width}" height="${img.height}" />`

    createSubplots(container, {
        headers: [
            `Data distribution ${imgTag(images['p(x)'])}`,
            `Corrupted distribution ${imgTag(images['p(\\tilde x)'])}`,
            `Optimal denoising ${imgTag(images['\\tilde x \rightarrow g(\\tilde x)'])}`
        ],
        ...options
    })

    // Add the slider input
    const slider = addSlider({
        container: container.select('.plotIncSliders.data'),
        name: 'stdDev',
        label: 'data&nbsp;variance:',
        min: 0.2, max: 0.8, step: 0.2,
        value: options.sliderInitialValue || 0.4,
        onInput: updateAll,
        tooltip: false,
    })

    // Dragging on data plot also controls the slider
    addSliderController({
        controller: container.select('.plotContainer.data'),
        slider,
    })

    const getSettings = () => ({
        dataStdDev: getSliderValue(slider),
        noiseStdDev: 0.7,
    })

    // Set the data domain so all plots have exactly the same size and scale.
    const xDomain = [0, 12]
    const yDomain = [0, 12]

    // Configure the plots.
    const sharedPlotConfig = {
        margin: {top: 10, right: 10, bottom: 20, left: 20},
        approxTickCount: 0,
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

        container.select('.plotContainer.data')
            .datum(originalData)
            .call(scatterPlot({
                ...sharedPlotConfig,
                xLabelImage: images['x_1'],
                yLabelImage: images['x_2'],
            }))

        container.select('.plotContainer.noisy')
            .datum(noisyData)
            .call(scatterPlot({
                ...sharedPlotConfig,
                xLabelImage: images['x_1'],
                yLabelImage: images['x_2'],
            }))

        container.select('.plotContainer.denoise')
            .datum(denoiseField)
            .call(scatterPlot({
                ...sharedPlotConfig,
                symbol: arrowSymbol({
                    // Faint arrows from highly improbable (corrupted) points
                    opacity: d => Math.min(0.5, 20*Math.sqrt(d.pNoisySample)),
                    // Alternatively, simply faint long arrows
                    // opacity: d => 0.5*Math.min(1, 1/(sq(d.dx)+sq(d.dy))),
                }),
                xLabelImage: images['x_1'],
                yLabelImage: images['x_2'],
            }))

    }

    updateAll()
}
