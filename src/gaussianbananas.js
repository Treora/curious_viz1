import randomSeed from 'random-seed'
import gaussian from 'gaussian'

const nSamples = 100

const rand = randomSeed.create()
rand.seed(123)

function banana({nSamples, width, curvature, xPosition, yPosition, xStdDev, yStdDev}) {
    const xVar = Math.pow(xStdDev, 2)
    const yVar = Math.pow(yStdDev, 2)
    return Array.from({length: nSamples}).map(() => {
        const xMean = xPosition - width/2 + width*rand.random()
        const x = gaussian(xMean, xVar).ppf(rand.random())
        const yMean = yPosition + curvature * Math.pow(xMean - xPosition, 2)
        const y = gaussian(yMean, yVar).ppf(rand.random())
        return {x, y}
    })
}

const banana1 = banana({
    nSamples: Math.round(nSamples/2),
    width: 5,
    curvature: 0.5,
    xPosition: 4,
    yPosition: 3,
    xStdDev: 0.2,
    yStdDev: 0.2,
})
const banana2 = banana({
    nSamples: nSamples - banana1.length,
    width: 5,
    curvature: -0.5,
    xPosition: 6.5,
    yPosition: 10,
    xStdDev: 0.2,
    yStdDev: 0.2,
})

const dataset = banana1.concat(banana2).map((sample, i) => ({
    id: i,
    ...sample,
}))

export default dataset
