import gaussian from 'gaussian'
import linspace from 'linspace'

import distributionPlot from './distributionplot'
import functionPlot from './functionplot'
import { addSlider, addSliderController, getSliderValue } from './slider'
import images from './images'
import { sq } from './utils'

export default function init(containerId, plotDatas) {
    const subplots = ['data', 'noisy', 'denoise']
    const container = d3.select(containerId)
    for (let i in subplots) {
        container.append('div')
            .attr('class', 'plotContainer ' + subplots[i])
    }
    const sliderW1 = addSlider({
        container,
        name: 'w1',
        label: 'mix&nbsp;ratio:',
        min: 0, max: plotDatas.length-1,
        value: Math.round((plotDatas.length-1)/2),
        tooltip: true,
        tooltipText: sliderValue => (1-getPlotData()['w1']).toFixed(1) + '&nbsp:&nbsp' + getPlotData()['w1'],
        onInput: updateAll,
    })
    const sliderSigma1 = addSlider({
        container,
        name: 'sigma_1',
        labelImage: images['\\sigma_1'],
        min: 0, max: plotDatas[0].length-1,
        value: Math.round((plotDatas[0].length-1)/2),
        tooltip: true,
        tooltipText: sliderValue => getPlotData()['sigma_1'],
        onInput: updateAll,
    })
    const sliderSigma2 = addSlider({
        container,
        name: 'sigma_2',
        labelImage: images['\\sigma_2'],
        min: 0, max: plotDatas[0][0].length-1,
        value: Math.round((plotDatas[0][0].length-1)/2),
        tooltip: true,
        tooltipText: sliderValue => getPlotData()['sigma_2'],
        onInput: updateAll,
    })

    // Dragging on data plot also controls the slider
    addSliderController({
        controller: container.select('.data'),
        slider: sliderW1,
    })

    const getSettings = () => ({
        w1: plotDatas.length-1 - getSliderValue(sliderW1),
        sigma_1: getSliderValue(sliderSigma1),
        sigma_2: getSliderValue(sliderSigma2),
    })

    const getPlotData = () => {
        let { w1, sigma_1, sigma_2 } = getSettings()
        return plotDatas[w1][sigma_1][sigma_2]
    }

    const sharedPlotConfig = {
        yDomain: [0, 0.8],
    }

    function updateAll() {
        const plotData = getPlotData()
        const x = (plotData.x !== undefined) ? plotData.x
            : linspace(...plotData.xDomain, plotData.data.length)

        container.select('.data')
            .datum({x, y: plotData.data})
            .call(functionPlot({
                ...sharedPlotConfig,
                xLabelImage: images['x'],
                yLabelImage: images['p(x)'],
            }))

        const plotCorruptedDistribution = functionPlot({
            ...sharedPlotConfig,
            xLabelImage: images['\\tilde x'],
            yLabelImage: images['p(\\tilde x)'],
        })

        container.select('.noisy')
            .datum({x, y: plotData.noisy})
            .call(plotCorruptedDistribution)

        // Draw diagonal dashed line (identity function)
        container.select('.denoise')
            .datum({x, y: x})
            .call(functionPlot({
                xDomain: plotCorruptedDistribution.xScale.domain(),
                yDomain: plotCorruptedDistribution.xScale.domain(),
                id: 3,
                lineOpacity: 0.2,
                lineStyle: '--',
            }))

        // Draw g1 linear extrapolation, dotted
        container.select('.denoise')
            .datum({x, y: plotData.g1})
            .call(functionPlot({
                xDomain: plotCorruptedDistribution.xScale.domain(),
                yDomain: plotCorruptedDistribution.xScale.domain(),
                id: 1,
                lineOpacity: 0.5,
                lineStyle: ':',
            }))

        // Draw g2 linear extrapolation, dotted
        container.select('.denoise')
            .datum({x, y: plotData.g2})
            .call(functionPlot({
                xDomain: plotCorruptedDistribution.xScale.domain(),
                yDomain: plotCorruptedDistribution.xScale.domain(),
                id: 2,
                lineOpacity: 0.5,
                lineStyle: ':',
            }))

        // Draw optimal denoising function
        container.select('.denoise')
            .datum({x, y: plotData.denoise})
            .call(functionPlot({
                xDomain: plotCorruptedDistribution.xScale.domain(),
                yDomain: plotCorruptedDistribution.xScale.domain(),
                id: 0,
                xLabelImage: images['\\tilde x'],
                yLabelImage: images['g(\\tilde x)'],
            }))

    }

    updateAll()
}
