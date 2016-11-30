export function createSubplots(container, options={}) {
    let { headers=['original', 'corrupted', 'denoising'] } = options
    const subplots = ['data', 'noisy', 'denoise']
    for (let i in subplots) {
        const plotIncSliders = container.append('div')
            .attr('class', 'plotIncSliders ' + subplots[i])
        plotIncSliders.append('span')
            .attr('class', 'plotHeader')
            .html(headers[i])
        plotIncSliders.append('div')
            .attr('class', 'plotContainer ' + subplots[i])
    }
}
