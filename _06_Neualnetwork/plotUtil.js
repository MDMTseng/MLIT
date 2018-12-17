window.chartColors = {
	red_light: 'rgba(255, 99, 132,0.1)',
	orange: 'rgb(255, 159, 64)',
	yellow: 'rgb(255, 205, 86)',
	green: 'rgb(75, 192, 192)',
	blue: 'rgb(54, 162, 235)',
	purple: 'rgb(153, 102, 255)',
	grey: 'rgb(201, 203, 207)'
};

var color = Chart.helpers.color;
var scatterChartData = {
    datasets: [{
        label: 'Creature Score',
        xAxisID: 'x-axis-1',
        yAxisID: 'y-axis-1',
        borderColor: window.chartColors.blue,
        backgroundColor: color(window.chartColors.blue).alpha(0.2).rgbString(),
        data: []
    }, {
        label: 'Environment',
        xAxisID: 'x-axis-1',
        yAxisID: 'y-axis-2',
        borderColor: window.chartColors.red_light,
        backgroundColor: color(window.chartColors.red_light).alpha(0.2).rgbString(),
        data: []
    }]
};

var ctx = document.getElementById('myChart').getContext('2d');
let WorldPlot = Chart.Scatter(ctx, {
    data: scatterChartData,
    options: {
        animation:false,
        responsive: true,
        hoverMode: 'nearest',
        intersect: true,
        title: {
            display: true,
            text: 'Chart.js Scatter Chart - Multi Axis'
        },
        scales: {
            xAxes: [{
                position: 'bottom',
                gridLines: {
                    zeroLineColor: 'rgba(0,0,0,1)'
                }
            }],
            yAxes: [{
                type: 'linear', // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
                display: true,
                position: 'left',
                id: 'y-axis-1',
                ticks : {
                    max : 2,    
                    min : -2
                }
            }, {
                type: 'linear', // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
                display: true,
                position: 'right',
                reverse: true,
                id: 'y-axis-2',

                // grid line settings
                gridLines: {
                    drawOnChartArea: false, // only want the grid lines for one axis to show up
                },
                ticks : {
                    max : 2,    
                    min : -2
                }
            }],
        }
    }
});




function setPlotYLimit(chart,idx,tick={min:-2,max:2})
{
    chart.options.scales.yAxes[idx].ticks=tick;
}


function setPlot(chart,idx,arr_xy)
{
    chart.data.datasets[idx].data=arr_xy;
}


