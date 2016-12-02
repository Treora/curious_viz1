// Uncomment the plots that should be included

import plot2d from './plots/plot2d'
// Valid slider values: 0.2, 0.4, 0.6, 0.8, 1.0
plot2d('#plot_2d', {sliderInitialValue: 0.4});


import plot1dGaussian from './plots/plot1dgaussian'
plot1dGaussian('#plot_1d_gaussian');


import { default as plot1dOther, plot1dOthers } from './plots/plot1dother'
import uniformData from '../plotdata/plotdata_uniform'
import expData from '../plotdata/plotdata_exp'
import laplaceData from '../plotdata/plotdata_laplace'
// Plot them together with selection buttons
plot1dOthers('#plot_1d_others', [uniformData, expData, laplaceData]);
// Or plot them separately
plot1dOther('#plot_1d_uniform', uniformData);
plot1dOther('#plot_1d_exp', expData);
plot1dOther('#plot_1d_laplace', laplaceData);


import plot1dMultigauss from './plots/plot1dmultigauss'
import multigaussData from '../plotdata/plotdata_multigauss'
plot1dMultigauss('#plot_1d_multigauss', multigaussData);
