import _ from 'lodash'
import gaussian from 'gaussian'

import flowerPlot from './flowerplot'
import arrowPlot from './arrowplot'
//import dataset from './irisdata'
import dataset from './gaussianbananas'

function load_plot_2d(container) {
    const width = 350;
    const height = 350;
    const plotconfig = {
        container, width, height,
        margin: 40,
        // xmin: 10,
        // xmax: 25,
        // ymin: -3,
        // ymax: 12,
        xmin: 0,
        xmax: 12,
        ymin: 0,
        ymax: 12,
    }

    const testdata = [
        {id: 0, x: 2.5, y: 3},
        {id: 1, x: 1, y: 0.5},
        {id: 2, x: 3, y: 1.5},
        {id: 3, x: 2, y: 5},
        {id: 4, x: 1.5, y: 2},
    ];
    //const dataset = testdata

    const update_data = flowerPlot({...plotconfig, data: dataset})

    const noiseMean = 0;
    const noiseStddev = 1.3;
    const noiseVariance = Math.pow(noiseStddev, 2);
    const noiseDistribution = gaussian(noiseMean, noiseVariance)
    const sampleNoise = () => noiseDistribution.ppf(Math.random())
    const noise = _.map(dataset, d => ({...d, dx: sampleNoise(), dy: sampleNoise()}))

    const update_noise = arrowPlot({...plotconfig, data: noise})

    const noisy = _.map(noise, d => ({...d, x: d.x+d.dx, y: d.y+d.dy, dx: undefined, dy: undefined}))

    const update_noisy = flowerPlot({...plotconfig, data: noisy})

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
    const update_denoise = arrowPlot({...plotconfig, data: denoise})

    const update_denoised = flowerPlot({...plotconfig, data: denoised})

}

window.load_plot_2d = load_plot_2d
