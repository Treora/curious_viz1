import _ from 'lodash'
import gaussian from 'gaussian'
import { extendDomainBy } from './utils'

import scatterPlot from './scatterplot'
import arrowSymbol from './arrowsymbol'
import pointSymbol from './pointsymbol'
import generateBananaData from './gaussianbananas'
import { addSlider, addSliderController } from './slider'
import images from './images'

export default function init(containerId) {
    const container = d3.select(containerId)
    const subplots = ['data', 'noisy', 'denoise', 'denoised']
    for (let i in subplots) {
        container.append('div')
            .attr('class', 'plotContainer ' + subplots[i])
    }

    const slider = addSlider({
        container,
        name: 'stdDev',
        label: 'variance:',
        min: 0.2, max: 1.0, step: 0.2,
        value: 0.3,
        onInput: updateData,
        onChange: updateAfterData,
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
        keepAspectRatio: true,
        xDomain, yDomain,
    }

    let originalData

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
                }),
                xLabelImage: images['x_1'],
                yLabelImage: images['x_2'],
            }))

            container.select('.noisy')
                .datum([])
                .call(scatterPlot({
                    ...sharedPlotConfig,
                    xLabelImage: null,
                    yLabelImage: null,
                }))
                .call(scatterPlot({
                    ...sharedPlotConfig,
                    id: 1,
                }))
    }

    function updateAfterData() {
        let { noiseStdDev } = getSettings()

        const noiseVariance = Math.pow(noiseStdDev, 2);
        const noiseDistribution = gaussian(0, noiseVariance)
        const sampleNoise = () => noiseDistribution.ppf(Math.random())

        // Apply gaussian noise to the data points.
        const noisyData = originalData.map(d => ({
            ...d,
            x: d.x + sampleNoise(),
            y: d.y + sampleNoise(),
        }))

        container.select('.noisy')
            .datum(compareData(originalData, noisyData))
            .call(scatterPlot({
                id: 1,
                ...sharedPlotConfig,
                symbol: arrowSymbol({
                    opacity: 0.3,
                }),
            }))

        // Denoise the noisy data using optimal denoising function.
        const denoisedData = noisyData.map(noisySample => ({
            ...noisySample,
            ...optimalDenoise({noisySample, originalData, noiseDistribution}),
        }))


        container.select('.noisy')
            .datum(originalData)
            .call(scatterPlot({
                ...sharedPlotConfig,
                updateDuration: 0,
                symbol: pointSymbol({
                    opacity: 0.3
                }),
                xLabelImage: images['x_1'],
                yLabelImage: images['x_2'],
            }))

    setTimeout(()=>
        container.select('.noisy')
            .datum(noisyData)
            .call(scatterPlot({
                ...sharedPlotConfig,
                symbol: pointSymbol({
                    opacity: 0.3
                }),
                xLabelImage: images['\\tilde x_1'],
                yLabelImage: images['\\tilde x_2'],
                updateDuration: 1500,
            }))
    , 500)

        container.select('.denoise')
            .datum(compareData(noisyData, denoisedData))
            .call(scatterPlot({
                ...sharedPlotConfig,
                symbol: arrowSymbol({
                    opacity: 0.6,
                }),
                xLabelImage: images['\\tilde x_1 \\rightarrow \\hat x_1'],
                yLabelImage: images['\\tilde x_2 \\rightarrow \\hat x_2'],
            }))

        container.select('.denoised')
            .datum(noisyData)
            .call(scatterPlot({
                ...sharedPlotConfig,
                symbol: pointSymbol({
                    opacity: 0.2
                }),
                xLabelImage: images['\\hat x_1'],
                yLabelImage: images['\\hat x_2'],
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
