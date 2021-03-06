import * as d3 from 'd3'
import linspace from 'linspace'

import functionPlot from '../plotcomponents/functionplot'
import { addSlider, addSliderController, getSliderValue } from '../common/slider'
import images from '../common/images'
import { createSubplots } from '../common/subplots'

export function plot1dOthers(containerId, plotDatases, options={}) {
    const container = d3.select(containerId)
    if (container.empty()) {
        console.log(`No element found with id ${containerId}. Skipping this plot.`)
        return
    }
    const names = ['uniform', 'exponential', 'laplacian']
    names.forEach((name, i) => {
        container.append('input')
            .attr('type', 'radio')
            .attr('name', 'otherDistributionSelector')
            .attr('id', `select_${name}`)
            .on('click', () => init(subcontainer.node(), plotDatases[i], options))
        container.append('label')
            .attr('for', `select_${name}`)
            .text(name)
    })
    const subcontainer = container.append('div')
}

export default function init(containerId, plotDatas, options={}) {
    const container = d3.select(containerId)
    if (container.empty()) {
        console.log(`No element found with id ${containerId}. Skipping this plot.`)
        return
    }

    createSubplots(container, options)

    const slider = addSlider({
        container: container.select('.plotIncSliders.data'),
        name: 'stdDev',
        labelImage: images['\\sigma'],
        min: 0, max: plotDatas.length-1,
        value: Math.round((plotDatas.length-1)/2),
        tooltip: true,
        tooltipText: sliderValue => plotDatas[sliderValue]['sigma'],
        onInput: updateAll,
    })

    // Dragging on data plot also controls the slider
    addSliderController({
        controller: container.select('.plotContainer.data'),
        slider,
    })

    const getSettings = () => {
        return {
            plotNumber: getSliderValue(slider),
        }
    }

    const sharedPlotConfig = {
        yDomain: [0, 0.8],
    }

    const plotOriginalDistribution = functionPlot({
        ...sharedPlotConfig,
        updateDuration: 0,
        xLabelImage: images['x'],
        yLabelImage: images['p(x)'],
    })

    const plotCorruptedDistribution = functionPlot({
        ...sharedPlotConfig,
        xLabelImage: images['\\tilde x'],
        yLabelImage: images['p(\\tilde x)'],
    })


    function updateAll() {
        let { plotNumber } = getSettings()

        const plotData = plotDatas[plotNumber]
        const x = (plotData.x !== undefined) ? plotData.x
            : linspace(...plotData.xDomain, plotData.data.length)

        container.select('.plotContainer.data')
            .datum({x, y: plotData.data})
            .call(plotOriginalDistribution)

        container.select('.plotContainer.noisy')
            .datum({x, y: plotData.noisy})
            .call(plotCorruptedDistribution)

        // Plot diagonal dashed line
        container.select('.plotContainer.denoise')
            .datum({x, y: x})
            .call(functionPlot({
                id: 1,
                xDomain: plotCorruptedDistribution.xScale.domain(),
                yDomain: plotOriginalDistribution.xScale.domain(),
                lineOpacity: 0.2,
                lineStyle: '--',
        }))

        container.select('.plotContainer.denoise')
            .datum({x, y: plotData.denoise})
            .call(functionPlot({
                id: 0,
                xDomain: plotCorruptedDistribution.xScale.domain(),
                yDomain: plotOriginalDistribution.xScale.domain(),
                xLabelImage: images['\\tilde x'],
                yLabelImage: images['g(\\tilde x)'],
        }))

    }

    updateAll()
}
