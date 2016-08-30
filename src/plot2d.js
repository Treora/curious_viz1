import _ from 'lodash'
import gaussian from 'gaussian'
import { extendDomainBy } from './utils'

import scatterPlot from './scatterplot'
import arrowSymbol from './arrowsymbol'
import pointSymbol from './pointsymbol'
import generateBananaData from './gaussianbananas'

export default function init(containerId) {
    const container = d3.select(containerId)
    const subplots = ['data', 'noisy', 'noise', 'denoise', 'denoised']
    for (let i in subplots) {
        container.append('div')
            .attr('class', 'plotContainer ' + subplots[i])
    }
    const sliderContainer = container.append('div')
        .attr('class', 'sliderContainer stdDev')
    sliderContainer.append('span')
        .attr('class', 'sliderText')
        .html('data&nbsp;variance:')
    function onchange() { if (hasChosenValueChanged(this)) updateAfterData() }
    const slider = sliderContainer.append('input')
        .attr('class', 'slider stdDev')
        .attr('type', 'range')
        .attr('min', 0.2)
        .attr('max', 1.0)
        .attr('step', 0.2)
        .attr('value', 0.3)
        .on('input', function () { if (hasCurrentValueChanged(this)) updateAll() })
        .on('change', onchange)
        .on('keyup', onchange)
    slider.node().value = 0.3


    const getSettings = () => ({
        dataMean: 0,
        noiseMean: 0,
        dataStdDev: +container.select('.slider.stdDev').node().value,
        noiseStdDev: 1.0,
    })


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
        xLabel: 'x1',
        yLabel: 'x2',
    }

    const drawArrows = scatterPlot({
        ...sharedPlotConfig,
        symbol: arrowSymbol({
            opacity: 0.6,
        }),
    })

    let originalData, noisyData, noiseDistribution, denoisedData

    function updateAll() {
        updateData()
        updateAfterData()
    }

    function updateData() {
        let { dataStdDev } = getSettings()

        originalData = generateBananaData({stdDev: dataStdDev})

        container.select('.data')
            .datum(originalData)
            .call(scatterPlot({
                ...sharedPlotConfig,
                symbol: pointSymbol({
                    opacity: 0.3
                })
            }))

    }

    function updateAfterData() {
        updateNoise()
        updateAfterNoise()
    }

    function updateNoise() {
        let { noiseStdDev } = getSettings()

        const noiseVariance = Math.pow(noiseStdDev, 2);
        noiseDistribution = gaussian(0, noiseVariance)
        const sampleNoise = () => noiseDistribution.ppf(Math.random())

        // Apply gaussian noise to the data points.
        noisyData = originalData.map(d => ({
            ...d,
            x: d.x + sampleNoise(),
            y: d.y + sampleNoise(),
        }))

        container.select('.noise')
            .datum(compareData(originalData, noisyData))
            .call(drawArrows)

        return { noisyData, noiseDistribution }
    }

    function updateAfterNoise() {
        let { dataStdDev, noiseStdDev } = getSettings()

        // Denoise the noisy data using optimal denoising function.
        denoisedData = noisyData.map(noisySample => ({
            ...noisySample,
            ...optimalDenoise({noisySample, originalData, noiseDistribution}),
        }))

        container.select('.noisy')
            .datum(originalData)
            .call(scatterPlot({
                ...sharedPlotConfig,
                symbol: pointSymbol({
                    opacity: 0.3
                })
            }))
    setTimeout(()=>
        container.select('.noisy')
            .datum(noisyData)
            .call(scatterPlot({
                ...sharedPlotConfig,
                symbol: pointSymbol({
                    opacity: 0.3
                }),
                updateDuration: 1500,
            }))
    , 500)

        container.select('.denoise')
            .datum(compareData(noisyData, denoisedData))
            .call(drawArrows)

        container.select('.denoised')
            .datum(noisyData)
            .call(scatterPlot({
                ...sharedPlotConfig,
                symbol: pointSymbol({
                    opacity: 0.2
                })
            }))
    setTimeout(()=>
        container.select('.denoised')
            .datum(denoisedData)
            .call(scatterPlot({
                ...sharedPlotConfig,
                symbol: pointSymbol({
                    opacity: 0.2
                }),
                updateDuration: 1000,
            }))
    , 2000)

    }

    updateAll()
}
