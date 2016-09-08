import { selectEnter } from './utils'

function hasCurrentValueChanged(input) {
    var changed = input.getAttribute('data-lastValue') !== input.value;
    input.setAttribute('data-lastValue', input.value);
    if (changed)
        input.setAttribute('data-sliderHasMoved', 'true');
    return changed;
}
function hasChosenValueChanged(input) {
    var changed = input.getAttribute('data-lastChosenValue') !== input.value;
    input.setAttribute('data-lastChosenValue', input.value);
    return changed;
}
function hasSliderMovedAtAll(input) {
    var moved = input.getAttribute('data-sliderHasMoved');
    input.setAttribute('data-sliderHasMoved', 'false');
    return moved==='true';
}

export function addSlider({
    container,
    name='',
    label,
    labelImage,
    min, max, step,
    value,
    tooltip,
    tooltipText = value => value,
    onInput = ()=>{},
    onChange = ()=>{},
    onChoice = ()=>{},
}) {
    function oninput() {
        if (hasCurrentValueChanged(this)) {
            onInput()
            if (tooltip)
                showTooltip(this)
        }
    }
    function onRelease() {
        if (hasSliderMovedAtAll(this)) {
            onChoice()
            if (hasChosenValueChanged(this))
                onChange()
        }
    }

    const sliderContainer = container.append('div')
        .attr('class', 'sliderContainer ' + name)
    if (label !== undefined) {
        sliderContainer.append('span')
            .attr('class', 'sliderLabelText')
            .html(label)
    }
    if (labelImage !== undefined) {
        sliderContainer.append('img')
            .attr('class', 'sliderLabelImage')
            .attr('width', labelImage.width)
            .attr('height', labelImage.height)
            .attr('src', labelImage.uri)
    }
    const slider = sliderContainer.append('input')
        .attr('class', 'slider ' + name)
        .attr('type', 'range')
        .attr('min', min)
        .attr('max', max)
        .attr('step', step)
        .attr('value', value)
        .on('input', oninput)
        .on('change', onRelease)
        .on('keyup', onRelease)
        .on('mouseup', onRelease)
        .on('touchend', onRelease)
        .on('blur', onRelease)

    // Setting attr('value') appears to not update the visual slider position.
    slider.node().value = value

    function showTooltip(sliderElement) {
        const tooltipHeight = 20
	const sliderKnobWidth = 16 // Guessing here, sorry.
        const el = sliderElement

        // Add element for the tooltip
        const tooltipEnter = selectEnter(sliderContainer, '.sliderTooltip')
        tooltipEnter.append('span')
            .attr('class', 'sliderTooltip')
            .style('position', 'absolute')
            .style('text-align', 'center')
            .style('height', tooltipHeight + 'px')
        const tooltip = sliderContainer.select('.sliderTooltip')
        const left = el.offsetLeft + sliderKnobWidth/2 + (+el.value-min)/(max-min) * (el.clientWidth-sliderKnobWidth)
        const top = el.offsetTop - tooltipHeight
        tooltip
          .transition()
            .on('start', function () {
                tooltip.style('display', 'inline-block')
                .style('top', top + 'px')
                .style('left', left + 'px')
                .style('opacity', 1)
                .html(tooltipText(el.value))
            })
          .transition()
            .delay(2000)
            .duration(500)
            .style('opacity', 0)
            .on('end', () => {
                tooltip.style('display', 'none')
            })
    }

    return slider
}


export function addSliderController({
    controller,
    slider,
}) {

    const coordsToValue = function ([x, y]) {
        const xNormalised = x / controller.node().offsetWidth
        return +slider.attr('min')
            + (+slider.attr('max')-+slider.attr('min')) * xNormalised
    }

    controller
        .on('mousedown', function () {
            d3.event.preventDefault()
            d3.event.stopPropagation()
            controller.on('mousemove', function() {
                const event = d3.event
                if (event.buttons & 1) {
                    event.preventDefault()
                    slider.node().value = coordsToValue(d3.mouse(this))
                    slider.node().dispatchEvent(new Event('input'))
                }
            })
            // The mouse-up could happen outside the controller, so we listen
            // on the whole window for this event.
            window.onmouseup = event => {
                event.preventDefault()
                event.stopPropagation()
                slider.node().dispatchEvent(new Event('change'))
                window.onmouseup = undefined
                controller.on('mousemove', undefined)
            }
        })
        .on('touchmove', function() {
            d3.event.preventDefault()
            d3.event.stopPropagation()
            const touch = d3.touches(this)[0] // Take first touch
            slider.node().value = coordsToValue(touch)
            slider.node().dispatchEvent(new Event('input'))
        })
        .on('touchend', function () {
            d3.event.preventDefault()
            d3.event.stopPropagation()
            slider.node().dispatchEvent(new Event('change'))
        });
}
