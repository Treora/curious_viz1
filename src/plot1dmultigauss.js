import gaussian from 'gaussian'

import distributionPlot from './distributionplot'
import functionPlot from './functionplot'
import { addSlider, addSliderController } from './slider'
import images from './images'
import { sq } from './utils'

export default function init(containerId, plotDatas) {
    const subplots = ['data', 'noisy', 'denoise']
    const container = d3.select(containerId)
    for (let i in subplots) {
        container.append('div')
            .attr('class', 'plotContainer ' + subplots[i])
    }
    const slider = addSlider({
        container,
        name: 'w1',
        label: 'mix&nbsp;ratio:',
        min: 0, max: plotDatas.length-1,
        value: Math.round((plotDatas.length-1)/2),
        onInput: updateAll,
    })
    addSlider({
        container,
        name: 'sigma_1',
        labelImage: images['\\sigma_1'],
        min: 0, max: plotDatas[0].length-1,
        value: Math.round((plotDatas[0].length-1)/2),
        onInput: updateAll,
    })
    addSlider({
        container,
        name: 'sigma_2',
        labelImage: images['\\sigma_2'],
        min: 0, max: plotDatas[0][0].length-1,
        value: Math.round((plotDatas[0][0].length-1)/2),
        onInput: updateAll,
    })

    // Dragging on data plot also controls the slider
    addSliderController({
        controller: container.select('.data'),
        slider,
    })


    const getSettings = () => {
        const w1 = +container.select('.slider.w1').node().value
        const sigma_1 = +container.select('.slider.sigma_1').node().value
        const sigma_2 = +container.select('.slider.sigma_2').node().value

        return {
            plotData: plotDatas[w1][sigma_1][sigma_2]
        }
    }

    const sharedPlotConfig = {
        // xDomain: [-4, 4],
        yDomain: [0, 0.8],
    }

    function updateAll() {
        updateData();
        updateAfterData();
    }

    function updateData() {
        let { plotData } = getSettings()

        container.select('.data')
            .datum({x: plotData.x, y: plotData.data})
            .call(functionPlot({
                ...sharedPlotConfig,
                xLabelImage: images['x'],
                yLabelImage: images['p(x)'],
            }))

    }

    function updateAfterData() {
        let { plotData } = getSettings()

        const plotCorruptedDistribution = functionPlot({
            ...sharedPlotConfig,
            xLabelImage: images['\\tilde x'],
            yLabelImage: images['p(\\tilde x)'],
        })

        container.select('.noisy')
            .datum({x: plotData.x, y: plotData.noisy})
            .call(plotCorruptedDistribution)

        container.select('.denoise')
            .datum({x: plotData.x, y: plotData.x})
            .call(functionPlot({
                xDomain: plotCorruptedDistribution.xScale.domain(),
                yDomain: plotCorruptedDistribution.xScale.domain(),
                id: 3,
                lineOpacity: 0.2,
                lineStyle: '--',
            }))

        container.select('.denoise')
            .datum({x: plotData.x, y: plotData.g1})
            .call(functionPlot({
                xDomain: plotCorruptedDistribution.xScale.domain(),
                yDomain: plotCorruptedDistribution.xScale.domain(),
                id: 1,
                lineOpacity: 0.5,
                lineStyle: ':',
            }))

        container.select('.denoise')
            .datum({x: plotData.x, y: plotData.g2})
            .call(functionPlot({
                xDomain: plotCorruptedDistribution.xScale.domain(),
                yDomain: plotCorruptedDistribution.xScale.domain(),
                id: 2,
                lineOpacity: 0.5,
                lineStyle: ':',
            }))

        container.select('.denoise')
            .datum({x: plotData.x, y: plotData.denoise})
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
