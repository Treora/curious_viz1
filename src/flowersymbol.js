import { selectEnter } from './utils'


export default function defineSymbol(symbolProps) {
    return {
        props: symbolProps,
        init: initSymbol,
        draw: (selection, args) =>
            drawSymbol(selection, {...args, ...symbolProps}),
        remove: (selection, args) =>
            removeSymbol(selection, {...args, ...symbolProps}),
    }
}

const leafTemplateLength = 23

function initSymbol(svg) {
    // Sepal leaf template (size ~23x13)
    const sepalLeaf = svg.append('defs').append('g')
        .attr('id', 'sepal')
    sepalLeaf.append('path')
        .attr('d', 'm 0,0 c -0.01243992,-3.259328 3.8853466,-1.8882521 7.0264487,-2.8892116 1.5986793,-0.5094431 3.0444543,-1.9693275 4.5477473,-2.613618 3.129959,-1.3413926 6.885029,-1.6266204 9.917496,0.1062182 2.153102,1.2303767 1.035605,4.4087796 0.67529,5.33745144 0.435879,1.22121506 1.104625,4.58385906 -0.713742,5.48504206 -2.985128,1.479425 -6.992694,1.385595 -9.381411,0.437693 -1.70552,-0.676831 -3.840481,-2.996249 -5.1239864,-3.148556 -3.8347744,-0.692418 -7.01833001,0.2596563 -6.9478426,-2.7150191 z')
        .attr('fill', '#aa00dd')
        .attr('stroke', 'purple')
        .attr('stroke-width', '0.5')
    sepalLeaf.append('path')
        .attr('d', 'm 3.6605536,0 c -0.028757,-1.0242833 5.9060256,-0.9339947 8.8974964,-1.3018422 1.944119,-0.2390594 3.989216,-0.4031132 6.158762,0.6532684 0.989706,0.4819014 0.804216,1.0134884 -0.0082,1.3541007 -2.184486,0.915867 -4.111961,0.864691 -6.153256,0.5851979 -2.895796,-0.3964909 -8.8660475,-0.2664415 -8.8948054,-1.2907248 z')
        .attr('fill', '#ffff00')

    // Petal leaf template (size ~21x14)
    const petalLeaf = svg.append('defs').append('g')
        .attr('id', 'petal')
    petalLeaf.append('path')
        .attr('d', 'm 0.79262509,1.0305564 c 1.08850101,1.1301447 5.70167031,4.6290015 9.15403871,5.4888965 1.3851352,0.345001 2.9646512,0.340287 4.2765932,-0.222251 3.058928,-1.311584 7.271343,-4.4113012 7.249551,-6.86578045 -0.01588,-1.79199455 -4.259605,-5.19446125 -7.267222,-6.31239735 -1.258145,-0.4676545 -2.736469,-0.3561376 -4.026692,0.0139 -3.5226722,1.0103078 -8.2689232,4.6478103 -9.34295133,5.7947158 -1.07402805,1.14690549 -1.13181858,0.97277159 -0.0433177,2.1029163 z')
        .attr('fill', '#ff2bc4')
        .attr('stroke', 'purple')
        .attr('stroke-width', '0.5')
    petalLeaf.append('path')
        .attr('d', 'm 2.3532031,-0.1604504 c 5.2864077,-1.0200571 9.6877839,-0.68626948 12.9176009,-0.40236091')
        .attr('stroke', '#aa0099')
        .attr('stroke-width', '1')
        .attr('stroke-linecap', 'round')
}

function drawSymbol(selection, {
    symbolRadius = 4,
    expandedSymbolRadius = 30,
    opacity = 0.6,
    enterDuration = 500,
    drawLeavesDuration = 500,
    hideLeavesAverageDelay = 1500,
    hideLeavesDuration = 500,
    xScale, yScale,
}) {
    const xmax = xScale.domain()[1]
    const ymax = yScale.domain()[1]

    function drawLeaves(selection) {
        selection.select('.bud').style('fill-opacity', 1)
        // Insert the group for leaves behind the bud
        const leavesGroup = selection.insert('g', ':first-child')
            .attr('class', 'leaves')
            .attr('transform', d => `rotate(${60*(-1+2*Math.random())})`)
        // Amount (of the leaf template) hidden behind the bud
        const leafOverlap = 3
        // Maximum size of a leaf to fit in the requested symbol size
        const leafRadius = expandedSymbolRadius - symbolRadius
        const leafScaleFactor = leafRadius / (leafTemplateLength-leafOverlap)
        // Maximum leaf area, which will correspond to maximum symbol size.
        const xymax = Math.max(xmax, ymax)
        for (let leafNr=0; leafNr<6; leafNr++) {
            // Specify the templates to use. Three sepals, three petals.
            const leafUrl = leafNr<3 ? '#sepal' : '#petal'
            // Set the angle
            const angle = 360/3 * (leafNr%3) + (leafNr<3 ? 360/6 : 0)
            // Scale the sepals' and petals' areas by the data x or y values.
            const leafRelativeArea = d => Math.max(0, leafNr<3 ? d.x/xymax : d.y/xymax)
            leavesGroup.append('use')
                .attr('xlink:xlink:href', leafUrl)
                .attr('transform', (
                      `rotate(${angle})`
                    + `translate(${symbolRadius}, 0)`
                    + `scale(0)`
                    + `translate(${-leafOverlap}, 0)`
                ))
              .transition()
                .duration(drawLeavesDuration)
                .attr('transform', d => (
                      `rotate(${angle})`
                    + `translate(${symbolRadius}, 0)`
                    + `scale(${leafScaleFactor * Math.sqrt(leafRelativeArea(d))})`
                    + `translate(${-leafOverlap}, 0)`
                ))
        }
    }

    function hideLeaves(selection) {
        const delay = (0.5+Math.random())*hideLeavesAverageDelay
        selection.select('.bud')
          .transition()
            .delay(delay)
            .style('fill-opacity', opacity)
        selection.select('.leaves')
          .transition()
            .delay(delay)
            .duration(hideLeavesDuration)
            .attr('transform', 'scale(0)')
            .remove()
    }

    // Draw bud
    selectEnter(selection, '.bud')
      .append('g')
        .attr('class', 'symbol')
      .append('circle')
        .attr('class', 'bud')
        .attr('r', 0)
        .style('fill-opacity', 0)
        .style('fill', 'purple')
        // Mousing over the bud reveals the leaves
        .on('mouseover', function () {
            const point = d3.select(this.parentNode)
            if (point.select('.leaves').empty()) {
                point.raise()
                point.call(drawLeaves)
            }
        })
        .on('mouseout', function () {
            d3.select(this.parentNode).call(hideLeaves)
        })

    const bud = selection.select('.bud')
    bud
      .transition()
        .duration(enterDuration)
        .attr('r', symbolRadius)
        .style('fill-opacity', opacity)

    // Add an item title (tooltip) if any is defined
    selectEnter(bud, 'title').append('title')
    bud.select('title').text(d=>d.title)
}

function removeSymbol(selection, {exitDuration=500}) {
    selection.select('.symbol')
      .transition()
        .duration(exitDuration)
        .attr('transform', 'scale(0)')
        .style('fill-opacity', 0)
    selection
      .transition()
        .delay(exitDuration)
        .remove()
}
