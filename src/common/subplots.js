export function createSubplots(container, options={}) {
    const defaultPlotHeaders = [
        'Data distribution',
        'Corrupted distribution',
        'Optimal denoising'
    ]
    let { headers=defaultPlotHeaders } = options

    // Delete container contents
    container.html('')

    // Add the three subplots
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
