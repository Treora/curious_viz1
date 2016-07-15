import _ from 'lodash'

const pointRadius = 15
const updateDuration = 200
const enterDuration = 200
const exitDuration = 200

export default function scatterPlot({container, ...props}) {
    const svg = d3.select(container).append('svg')

    function update({data, width, height, xmin, xmax, ymin, ymax}) {
        if (width !== undefined)
            svg.attr('width', width)
        else
            width = svg.attr('width')

        if (height !== undefined)
            svg.attr('height', height)
        else
            height = svg.attr('height')

        if (xmin === undefined)
            xmin = _.minBy(data, 'x').x
        if (xmax === undefined)
            xmax = _.maxBy(data, 'x').x
        if (ymin === undefined)
            ymin = _.minBy(data, 'y').y
        if (ymax === undefined)
            ymax = _.maxBy(data, 'y').y

        let points = svg.selectAll('.point')
        if (data !== undefined) {
            points = points.data(data, d => d.id)
        }

        function setPosition(selection) {
            selection
                .attr('cx', d => (d.x - xmin)/(xmax-xmin) * width)
                .attr('cy', d => (d.y - ymin)/(ymax-ymin) * height)
        }

        // Update
        points
          .transition()
            .duration(updateDuration)
            .call(setPosition)

        // Enter
        points.enter().append('circle')
            .attr('class', 'point')
            .attr('id', d => 'id'+d.id)
            .call(setPosition)
            .attr('r', 0)
            .style('fill-opacity', 0)
          .transition()
            .duration(enterDuration)
            .attr('r', pointRadius)
            .style('fill-opacity', 1)

        // Exit
        points.exit()
          .transition()
            .duration(exitDuration)
            .attr('r', 0)
            .style('fill-opacity', 0)
            .remove()
    }
    update({...props})

    return update
}
