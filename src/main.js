// Uncomment the plots that should be included

import plot2d from './plots/plot2d'
// Valid slider values: 0.2, 0.4, 0.6, 0.8, 1.0
plot2d('#plot_2d', {sliderInitialValue: 0.4});


import plot1dGaussian from './plots/plot1dgaussian'
plot1dGaussian('#plot_1d_gaussian');


import plot1dOther from './plots/plot1dother'

import uniformData from '../plotdata/plotdata_uniform'
plot1dOther('#plot_1d_uniform', uniformData);

import expData from '../plotdata/plotdata_exp'
plot1dOther('#plot_1d_exp', expData);

import laplaceData from '../plotdata/plotdata_laplace'
plot1dOther('#plot_1d_laplace', laplaceData);


import plot1dMultigauss from './plots/plot1dmultigauss'
import multigaussData from '../plotdata/plotdata_multigauss'
plot1dMultigauss('#plot_1d_multigauss', multigaussData);
