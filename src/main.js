import _ from 'lodash'
import gaussian from 'gaussian'

import flowerPlot from './flowerplot'
import arrowPlot from './arrowplot'
import dataset from './irisdata'
//import dataset from './gaussianbananas'

function load_plot_2d(containerElement) {
    const container = d3.select(containerElement)

    const noiseStddev = 1.3;

    const xDomain = extendDomainBy(noiseStddev)(d3.extent(dataset, d=>d.x))
    const yDomain = extendDomainBy(noiseStddev)(d3.extent(dataset, d=>d.y))

    const plotconfig = {
        // width: 400,
        // height: 300,
        margin: 40,
        keepAspectRatio: true,
        xDomain, yDomain,
    }

    const testdata = [
        {id: 0, x: 2.5, y: 3},
        {id: 1, x: 1, y: 0.5},
        {id: 2, x: 3, y: 1.5},
        {id: 3, x: 2, y: 5},
        {id: 4, x: 1.5, y: 2},
    ];
    // const dataset = testdata

    const plotData = flowerPlot(plotconfig)
    container.select('#plot_2d_data').datum(dataset).call(plotData)

    const noiseMean = 0;
    const noiseVariance = Math.pow(noiseStddev, 2);
    const noiseDistribution = gaussian(noiseMean, noiseVariance)
    const sampleNoise = () => noiseDistribution.ppf(Math.random())
    const noise = _.map(dataset, d => ({...d, dx: sampleNoise(), dy: sampleNoise()}))

    const plotNoise = arrowPlot(plotconfig)
    container.select('#plot_2d_noise').datum(noise).call(plotNoise)

    const noisy = _.map(noise, d => ({...d, x: d.x+d.dx, y: d.y+d.dy, dx: undefined, dy: undefined}))

    const plotNoisy = flowerPlot(plotconfig)
    container.select('#plot_2d_noisy').datum(noisy).call(plotNoisy)

    function optimalDenoise({noisySample, dataset, noiseDistribution}) {
        const pNoise = dataset.map(datum => (
            noiseDistribution.pdf(noisySample.x - datum.x)
          * noiseDistribution.pdf(noisySample.y - datum.y)
        ))
        const numX = _.mean(dataset.map((datum, i) => datum.x*pNoise[i]))
        const numY = _.mean(dataset.map((datum, i) => datum.y*pNoise[i]))
        const den = _.mean(pNoise)
        return {x: numX/den, y: numY/den}
    }
    const denoised = noisy.map(noisySample => ({
        ...noisySample,
        ...optimalDenoise({noisySample, dataset, noiseDistribution}),
    }))

    const denoise = noisy.map((noisySample, i) => ({
        ...noisySample,
        dx: denoised[i].x - noisySample.x,
        dy: denoised[i].y - noisySample.y,
    }))
    const plotDenoise = arrowPlot(plotconfig)
    container.select('#plot_2d_denoise').datum(denoise).call(plotDenoise)


    const plotDenoised = flowerPlot(plotconfig)
    container.select('#plot_2d_denoised').datum(denoised).call(plotDenoised)

}

window.load_plot_2d = load_plot_2d


// Utils

const extendDomainBy = margin => domain => [
    domain[0] - margin, domain[1] + margin
]
