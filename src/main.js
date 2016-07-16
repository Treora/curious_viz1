import scatterPlot from './scatterplot'
import dataset from './irisdata'

function load_plot_2d(container) {
    const width = 700;
    const height = 500;
    const data = [
        {id: 0, x: 2.5, y: 3},
        {id: 1, x: 1, y: 0.5},
        {id: 2, x: 3, y: 1.5},
        {id: 3, x: 2, y: 5},
        {id: 4, x: 1.5, y: 2},
    ];

    let update = scatterPlot({container, width, height, data: dataset})
}

window.load_plot_2d = load_plot_2d
