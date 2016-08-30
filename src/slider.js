
export default function addSlider({
    container,
    name='',
    label='',
    min, max, step,
    value,
    oninput,
    onchange,
}) {

    const sliderContainer = container.append('div')
        .attr('class', 'sliderContainer ' + name)
    sliderContainer.append('span')
        .attr('class', 'sliderText')
        .html(label)
    const slider = sliderContainer.append('input')
        .attr('class', 'slider ' + name)
        .attr('type', 'range')
        .attr('min', min)
        .attr('max', max)
        .attr('step', step)
        .attr('value', value)
        .on('input', oninput)
        .on('change', onchange)
        .on('keyup', onchange)

    // Setting attr('value') appears to not update the visual slider position.
    slider.node().value = value

    return slider
}
