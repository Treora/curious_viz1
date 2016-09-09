import _ from 'lodash'
import gaussian from 'gaussian'
import linspace from 'linspace'

import { extendDomainBy, sq } from './utils'
import scatterPlot from './scatterplot'
import arrowSymbol from './arrowsymbol'
import pointSymbol from './pointsymbol'
import generateBananaData from './gaussianbananas'
import { addSlider, addSliderController } from './slider'
import images from './images'

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


export default function init(containerId) {
    const container = d3.select(containerId)

    // Create four plots
    const subplots = ['data', 'noisy', 'denoise', 'denoised']
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
        value: 0.3,
        onInput: updateData,
        onChoice: updateAfterData,
	tooltip: false,
    })

    // Dragging on data plot also controls the slider
    addSliderController({
        controller: container.select('.data'),
        slider,
    })

    const getSettings = () => ({
        dataMean: 0,
        noiseMean: 0,
        dataStdDev: +container.select('.slider.stdDev').node().value,
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
    }

    const plotOriginalData = scatterPlot({
        ...sharedPlotConfig,
        xLabelImage: images['x_1'],
        yLabelImage: images['x_2'],
    })

    const plotTransitionArrows = scatterPlot({
        ...sharedPlotConfig,
        id: 1,
        symbol: arrowSymbol({
            opacity: 0.3,
        }),
    })
    // Ugly workaround to have zero exitDuration when clearing the plots.
    const plotTransitionArrowsQuickExit = scatterPlot({
        ...sharedPlotConfig,
        id: 1,
        symbol: arrowSymbol({
            opacity: 0.3,
            exitDuration: 0,
        }),
    })

    const plotNoisyData = scatterPlot({
        ...sharedPlotConfig,
        updateDuration: 1000,
        xLabelImage: images['\\tilde x_1'],
        yLabelImage: images['\\tilde x_2'],
    })

    const plotDenoiseArrows = scatterPlot({
        ...sharedPlotConfig,
        symbol: arrowSymbol({
            // Faint arrows from highly improbable (corrupted) points
            opacity: d => Math.min(0.5, 10*Math.sqrt(d.pNoisySample)),
            // Alternatively, simply faint long arrows
            // opacity: d => 0.5*Math.min(1, 1/(sq(d.dx)+sq(d.dy))),
            exitDuration: 0,
        }),
        xLabelImage: images['\\tilde x_1 \\rightarrow \\hat x_1'],
        yLabelImage: images['\\tilde x_2 \\rightarrow \\hat x_2'],
    })

    const plotDenoisedData = scatterPlot({
        ...sharedPlotConfig,
        updateDuration: 1000,
        xLabelImage: images['\\hat x_1'],
        yLabelImage: images['\\hat x_2'],
    })

    function updateAll() {
        updateData()
        updateAfterData()
    }

    // To remember the data between calls to updateData and updateAfterData.
    let originalData

    function updateData() {
        let { dataStdDev } = getSettings()

        originalData = generateBananaData({stdDev: dataStdDev})

        // Update the data
        container.select('.data')
            .datum(originalData)
            .call(plotOriginalData)

        // Clear all the other plots.
        // Use a named transition to make it cancel the animation (if playing).
        d3.transition('plot2dAnimation')
            .duration(0)
            .on('start', () => {
                container.select('.noisy')
                    .datum([])
                    .call(plotNoisyData)
                container.select('.noisy')
                    .datum([])
                    .call(plotTransitionArrowsQuickExit)
                container.select('.denoise')
                    .datum([])
                    .call(plotDenoiseArrows)
                container.select('.denoised')
                    .datum([])
                    .call(plotTransitionArrowsQuickExit)
                container.select('.denoised')
                    .datum([])
                    .call(plotDenoisedData)
            })
    }

    function updateAfterData() {
        let { noiseStdDev } = getSettings()

        const noiseVariance = sq(noiseStdDev);
        const noiseDistribution = gaussian(0, noiseVariance)
        const sampleNoise = () => noiseDistribution.ppf(Math.random())

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

        // Calculate denoising function's vector field
        const vectorFieldSize = 16
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

        d3.transition('plot2dAnimation')
            .duration(1000)
            .on('start', () => {
                container.select('.noisy')
                    .datum(originalData)
                    .call(plotOriginalData)
            })
            .on('end', () => {
                container.select('.noisy')
                    .datum(compareData(originalData, noisyData))
                    .call(plotTransitionArrows)
            })
          .transition()
            .duration(500)
            .on('end', () => {
                container.select('.noisy')
                    .datum(noisyData)
                    .call(plotNoisyData)
            })
          .transition()
            .duration(1000)
            .on('end', () => {
                container.select('.noisy')
                    .datum([])
                    .call(plotTransitionArrows)
            })
          .transition()
            .duration(500)
            .on('end', () => {
                container.select('.denoise')
                    .datum(compareData(gridPoints, denoisedGridPoints))
                    .call(plotDenoiseArrows)
            })
          .transition()
            .duration(1000)
            .on('end', () => {
                container.select('.denoised')
                    .datum(noisyData)
                    .call(plotNoisyData)
            })
          .transition()
            .duration(1000)
            .on('end', () => {
                container.select('.denoised')
                    .datum(compareData(noisyData, denoisedData))
                    .call(plotTransitionArrows)
            })
          .transition()
            .duration(500)
            .on('end', () => {
                container.select('.denoised')
                    .datum(denoisedData)
                    .call(plotDenoisedData)
            })
          .transition()
            .duration(1000)
            .on('end', () => {
                container.select('.denoised')
                    .datum([])
                    .call(plotTransitionArrows)
            })
    }

    updateAll()
}
