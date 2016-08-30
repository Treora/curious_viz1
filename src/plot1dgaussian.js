import gaussian from 'gaussian'

import distributionPlot from './distributionplot'
import functionPlot from './functionplot'
import addSlider from './slider'

const sq = x => Math.pow(x, 2)

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
        label: 'data&nbsp;variance',
        min: 0.2, max: 1.8, step: 0.4,
        value: 1.0,
        oninput: function () { if (hasCurrentValueChanged(this)) updateAll() },
    })
    const slider1 = addSlider({
        container,
        name: 'noiseStdDev',
        label: 'noise&nbsp;quantity',
        min: 0.2, max: 1.8, step: 0.4,
        value: 1.0,
        oninput: function () { if (hasCurrentValueChanged(this)) updateAfterData() },
    })

    // Dragging on data plot also controls the slider
    const sliderControl = container.select('.data')
    sliderControl
        .on('mousedown', function () {
            d3.event.preventDefault()
            sliderControl.on('mousemove', function() {
                const event = d3.event
                if (event.buttons & 1) {
                    event.preventDefault()
                    const xNormalised = d3.mouse(this)[0] / this.offsetWidth
                    slider.node().value = slider.attr('max') * xNormalised //Math.abs(xNormalised*2-1)
                    slider.node().dispatchEvent(new Event('input'))
                }
            })
            window.onmouseup = event => {
                event.preventDefault()
                slider.node().dispatchEvent(new Event('change'))
                window.onmouseup = undefined
            }
        })
        .on('touchmove', function() {
            d3.event.preventDefault()
            const touch = d3.touches(this)[0] // Take first touch
            const xNormalised = touch[0] / this.offsetWidth
            slider.node().value = slider.attr('max') * xNormalised //Math.abs(xNormalised*2-1)
            slider.node().dispatchEvent(new Event('input'))
        })
        .on('touchend', function () {
            d3.event.preventDefault()
            slider.node().dispatchEvent(new Event('change'))
        });

    const sharedPlotConfig = {
        xDomain: [-4, 4],
        yDomain: [0, 1.2],
        drawSamples: false,
        lineOpacity: 1,
    }

    const getSettings = () => {
        const stdDevInput = container.select('.slider.stdDev').node()
        const noiseInput = container.select('.slider.noiseStdDev').node()
        return {
            dataMean: 0,
            dataStdDev: +stdDevInput.value || +stdDevInput.defaultValue,
            noiseStdDev: +noiseInput.value || +noiseInput.defaultValue,
        }
    }

    function updateAll() {
        updateData()
        updateAfterData()
    }


    function updateData() {
        let { dataMean, dataStdDev } = getSettings()

        const dataDistribution = gaussian(dataMean, sq(dataStdDev))
        container.select('.data')
            .datum(dataDistribution)
            .call(distributionPlot({
                ...sharedPlotConfig,
                xLabel: 'x',
                yLabel: 'p(x)',
            }))
    }

    function updateAfterData() {
        updateNoise()
        updateAfterNoise()
    }

    function updateNoise() {
        let { noiseStdDev } = getSettings()

        const noiseDistribution = gaussian(0, sq(noiseStdDev))

        // d3.select('#plot_1d_gaussian_noise')
        //     .datum(noiseDistribution)
        //     .call(distributionPlot({
        //         ...sharedPlotConfig,
        //         xLabel: 'n',
        //         yLabel: 'p(n)',
        //         // yDomain: [0, 1/2/Math.sqrt(noiseStdDev)], // scale for constant height
        //     }))
    }

    function updateAfterNoise() {
        let { dataMean, dataStdDev, noiseStdDev } = getSettings()

        const corruptedStdDev = Math.sqrt(sq(dataStdDev) + sq(noiseStdDev))
        const corruptedDistribution = gaussian(dataMean, sq(corruptedStdDev))

        const v = sq(dataStdDev) / sq(corruptedStdDev)
        const denoiseFunction = noisyValue => v * noisyValue + (1-v) * dataMean

        const denoisedStdDev = corruptedStdDev * v
        const denoisedDistribution = gaussian(dataMean, sq(denoisedStdDev))

        const plotCorruptedDistribution = distributionPlot({
            ...sharedPlotConfig,
            xLabel: 'x_tilde',
            yLabel: 'p(x_tilde)',
        })

        const plotDenoisedDistribution = distributionPlot({
            ...sharedPlotConfig,
            xLabel: 'x_hat',
            yLabel: 'p(x_hat)',
        })

        container.select('.noisy')
            .datum(corruptedDistribution)
            .call(plotCorruptedDistribution)

        container.select('.denoised')
            .datum(denoisedDistribution)
            .call(plotDenoisedDistribution)

        container.select('.denoise')
            .datum(() => x=>x)
            .call(functionPlot({
                id: 1,
                xDomain: plotCorruptedDistribution.xScale.domain(),
                yDomain: plotDenoisedDistribution.xScale.domain(),
                lineOpacity: 0.2,
                lineStyle: '--',
        }))
        container.select('.denoise')
            .datum(() => denoiseFunction)
            .call(functionPlot({
                id: 0,
                xDomain: plotCorruptedDistribution.xScale.domain(),
                yDomain: plotDenoisedDistribution.xScale.domain(),
                xLabel: 'corrupted x',
                yLabel: 'denoised x',
        }))

    }

    updateAll()
}
