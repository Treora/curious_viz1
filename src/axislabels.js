xAxisG.append('use')
    .attr('class', 'tickSymbolMax')
    .attr('xlink:xlink:href', '#sepal')
xAxisG.append('use')
    .attr('class', 'tickSymbolMin')
    .attr('xlink:xlink:href', '#sepal')



            xAxisGroup.select('.tickSymbolMax')
                .attr('transform',
                    `translate(${xScale.range()[1]}, ${10})`
                    //+ `scale(${xScale.domain()[1]})`
                )

            xAxisGroup.select('.tickSymbolMin')
                .attr('transform',
                    `translate(${xScale.range()[0]}, ${10})`
                    //+ `scale(${xScale.domain()[0]})`
                )


                svgEnter.append('defs').append('marker')
                    .attr('id', 'triangle')
                    .attr('viewBox', '0 0 10 10')
                    .attr('refX', '0')
                    .attr('refY', '5')
                    .attr('markerWidth', '4')
                    .attr('markerHeight', '3')
                    .attr('orient', 'auto')
                  .append('path')
                    .attr('d', 'M 0 0 L 10 5 L 0 10 z')
                    .attr('fill', '#000');
