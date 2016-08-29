import gaussian from 'gaussian'

import distributionPlot from './distributionplot'
import functionPlot from './functionplot'

const sq = x => Math.pow(x, 2)

export default function init(containerId, plotDatas) {
    const container = d3.select(containerId)
    const subplots = ['data', 'noisy', 'denoise']
    for (let i in subplots) {
        container.append('div')
            .attr('class', 'plotContainer ' + subplots[i])
    }
    const sliderContainer = container.append('div')
        .attr('class', 'sliderContainer')
    sliderContainer.append('span')
        .attr('class', 'sliderText')
        .html('data&nbsp;variance:')
    const slider = sliderContainer.append('input')
        .attr('class', 'slider')
        .attr('type', 'range')
        .attr('min', 0)
        .attr('max', plotDatas.length-1)
        .attr('value', Math.round((plotDatas.length-1)/2))
        .on('input', function () { if (hasCurrentValueChanged(this)) updateAll() })

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

    const getSettings = () => {
        const sliderInput = container.select('.slider').node()
        return {
            plotNumber: +sliderInput.value,
        }
    }

    const sharedPlotConfig = {
        // xDomain: [-4, 4],
        yDomain: [0, 0.8],
        xLabel: 'x1',
        yLabel: 'x2',
    }

    const plotOriginalDistribution = functionPlot({
        ...sharedPlotConfig,
        updateDuration: 0,
    })

    function updateAll() {
        updateData();
        updateAfterData();
    }

    function updateData() {
        let { plotNumber } = getSettings()
        const plotData = plotDatas[plotNumber]

        container.select('.data')
            .datum({x: plotData.x, y: plotData.data})
            .call(plotOriginalDistribution)

    }

    function updateAfterData() {
        let { plotNumber } = getSettings()
        const plotData = plotDatas[plotNumber]

        const plotCorruptedDistribution = functionPlot({
            ...sharedPlotConfig,
            yDomain: plotOriginalDistribution.yScale.domain(),
        })

        container.select('.noisy')
            .datum({x: plotData.x, y: plotData.noisy})
            .call(plotCorruptedDistribution)

        container.select('.denoise')
            .datum({x: plotData.x, y: plotData.x})
            .call(functionPlot({
                id: 1,
                xDomain: plotCorruptedDistribution.xScale.domain(),
                yDomain: plotOriginalDistribution.xScale.domain(),
                lineOpacity: 0.2,
                lineStyle: '--',
        }))

        container.select('.denoise')
            .datum({x: plotData.x, y: plotData.denoise})
            .call(functionPlot({
                id: 0,
                xDomain: plotCorruptedDistribution.xScale.domain(),
                yDomain: plotOriginalDistribution.xScale.domain(),
                xLabel: 'corrupted x',
                yLabel: 'denoised x',
        }))

    }

    updateAll()
}
