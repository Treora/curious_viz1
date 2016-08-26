import gaussian from 'gaussian'

import distributionPlot from './distributionplot'
import functionPlot from './functionplot'

const sq = x => Math.pow(x, 2)

export default function init(containerId, plotDatas) {
    const subplots = ['data', 'noisy', 'denoise']
    const container = d3.select(containerId)
    for (let i in subplots) {
        container.append('div')
            .attr('class', 'plotContainer ' + subplots[i])
    }
    function onchange() { if (hasChosenValueChanged(this)) updateAfterData() }
    container.append('input')
    .attr('class', 'slider')
    .attr('type', 'range')
    .attr('min', 0)
    .attr('max', plotDatas.length-1)
    .attr('value', Math.round((plotDatas.length-1)/2))
    .on('input', function () { if (hasCurrentValueChanged(this)) updateData() })
    .on('change', onchange)
    .on('keyup', onchange)

    const getSettings = () => {
        const sliderInput = container.select('.slider').node()
        return {
            plotNumber: +sliderInput.value,
        }
    }

    const sharedPlotConfig = {
        // xDomain: [-4, 4],
        yDomain: [0, 0.8],
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
            xDomain: plotCorruptedDistribution.xScale.domain(),
            yDomain: plotOriginalDistribution.xScale.domain(),
            id: 1,
            lineOpacity: 0.2,
            lineStyle: 'dashed',
        }))

        container.select('.denoise')
            .datum({x: plotData.x, y: plotData.denoise})
            .call(functionPlot({
            xDomain: plotCorruptedDistribution.xScale.domain(),
            yDomain: plotOriginalDistribution.xScale.domain(),
        }))

    }

    updateAll()
}
