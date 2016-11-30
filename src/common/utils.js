import * as d3 from 'd3'

/* The equivalent of selectAll()...enter() but for select().
 * Instead of this: selection.select('.dot').enter().append('circle').class('dot')
 * Write like this: selectEnter(selection, '.dot').append('circle').class('dot')
 */
export function selectEnter(selection, selector) {
    if (selection.select(selector).empty())
        return selection
    else
        return d3.select() // return empty selection
}

export const extendDomainBy = (domain, margin) => [
    domain[0] - margin, domain[1] + margin
]

export function extendDomainByFactor(domain, factor) {
    const span = domain[1] - domain[0]
    return [
        domain[0] - span/2 * (factor-1),
        domain[1] + span/2 * (factor-1)
    ]
}

export const sq = x => Math.pow(x, 2)
