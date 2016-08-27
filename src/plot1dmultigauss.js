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
        .attr('class', 'slider w1')
        .attr('type', 'range')
        .attr('min', 0)
        .attr('max', plotDatas.length-1)
        .attr('value', Math.round((plotDatas.length-1)/2))
        .on('input', function () { if (hasCurrentValueChanged(this)) updateData() })
        .on('change', onchange)
        .on('keyup', onchange)
    container.append('input')
        .attr('class', 'slider sigma_1')
        .attr('type', 'range')
        .attr('min', 0)
        .attr('max', plotDatas[0].length-1)
        .attr('value', Math.round((plotDatas[0].length-1)/2))
        .on('input', function () { if (hasCurrentValueChanged(this)) updateData() })
        .on('change', onchange)
        .on('keyup', onchange)
    container.append('input')
        .attr('class', 'slider sigma_2')
        .attr('type', 'range')
        .attr('min', 0)
        .attr('max', plotDatas[0][0].length-1)
        .attr('value', Math.round((plotDatas[0][0].length-1)/2))
        .on('input', function () { if (hasCurrentValueChanged(this)) updateData() })
        .on('change', onchange)
        .on('keyup', onchange)

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
        xLabel: 'x',
        yLabel: 'p(x)',
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
                // updateDuration: 0,
            }))

    }

    function updateAfterData() {
        let { plotData } = getSettings()

        const plotCorruptedDistribution = functionPlot({
            ...sharedPlotConfig,
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
                xLabel: 'corrupted x',
                yLabel: 'denoised x',
            }))

    }

    updateAll()
}