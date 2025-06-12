export class graph_name {
    constructor(name, graph_name, time_select, topic, response_topic, date_range, flat_pick, daySelect) {
        this.name = name;
        this.ctx_running_light_graph = document.getElementById(this.name).getContext('2d');
        this.chart_running_light_graph = null; // Initialize chart instance
        this.yAxisLabel = 'Power Consumption (Wh)';
        const blueRedGradient_running_light_graph = this.ctx_running_light_graph.createLinearGradient(0, 0, 0, 400);
        blueRedGradient_running_light_graph.addColorStop(0, '#2959FF');
        blueRedGradient_running_light_graph.addColorStop(1, '#9EB3FC');
        this.backgroundColor_blue = blueRedGradient_running_light_graph;
        const greenGradient_running_light_graph = this.ctx_running_light_graph.createLinearGradient(0, 0, 0, 200);
        greenGradient_running_light_graph.addColorStop(0, '#23D900');
        greenGradient_running_light_graph.addColorStop(1, '#23D400');
        this.backgroundColor_green = greenGradient_running_light_graph;
        this.backgroundColor = null;
        this.start_date = null;
        this.end_date = null;
        this.isSetDateActive_running_light_graph = false;
        this.power_consumption = null;
        this.power_savings = null;
        this.active_runtime = null;
        this.graph_name = graph_name;
        this.topic = topic;
        this.time_select = time_select;
        this.response_topic = response_topic;
        this.date_range = date_range;
        this.flat_pick = flat_pick;
        this.daySelect = daySelect;
    }

    createChart(labels, data, dataType, backgroundColor) {

        const shouldConvertToKWh = data.some(value => value > 1000);

        // const convertedData = shouldConvertToKWh ? data.map(value => value > 1000 ? value / 1000 : value) : data;
        const convertedData = shouldConvertToKWh ? data.map(value => (value / 1000).toFixed(2)) : data;

        const unitLabel = shouldConvertToKWh ? 'kWh' : 'Wh';
        
        if (dataType.includes('Power Consumption')) {
            this.yAxisLabel = `Power Consumption (${unitLabel})`;
        } else if (dataType.includes('Power Savings')) {
            this.yAxisLabel = `Power Savings (${unitLabel})`;
        } else if (dataType.includes('Time')) {
            this.yAxisLabel = 'Time (minutes)';
        } else {
            console.error('Unknown data type:', dataType);
            this.yAxisLabel = 'Unknown';
        }
        if (backgroundColor == 'blue') {
            this.backgroundColor = this.backgroundColor_blue;
        }
        else {
            this.backgroundColor = this.backgroundColor_green
        }
       
        if (this.chart_running_light_graph) {
            this.chart_running_light_graph.destroy();
        }

        // Create the datasets array
        const datasets = [
            {
                label: this.yAxisLabel,
                data: convertedData,
                backgroundColor: this.backgroundColor,
                borderColor: this.backgroundColor,
                borderWidth: 1,
                borderRadius: 50,
                zIndex: 1,

            }
        ];

        // Add the "Line Connection" dataset if the background color is green
        if (backgroundColor === 'green') {
            datasets.push({
                label: this.yAxisLabel,
                data: convertedData,
                type: 'line',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 2,
                tension: 0,
                pointBackgroundColor: 'rgba(255, 99, 132, 1)',
                backgroundColor: 'rgba(255, 99, 132, 1)',
                fill: false,
                zIndex: 2,

            });
        }

        this.chart_running_light_graph = new Chart(this.ctx_running_light_graph, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: datasets.map(dataset => {
                    const wrapper = document.getElementById(this.name).closest('.main_canvas_wrapper');
            
                    // Calculate dynamic width based on label length
                    let baseWidth = 100; // Starting width in percentage
                    let incrementPerLabel = 5; // Width increase per label (adjust as needed)
            
                    if (labels.length < 5) {
                        dataset.barThickness = 70;
                        wrapper.style.width = `${baseWidth}%`; // Set a minimum width for small label sets
                    } else {
                        // Dynamically calculate width for larger label sets
                        const dynamicWidth = baseWidth + (labels.length - 5) * incrementPerLabel;
                        wrapper.style.width = `${dynamicWidth}%`;
                    }
            
                    return dataset;
                })
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: ''
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: this.yAxisLabel
                        },
                        beginAtZero: true
                    }
                },
                plugins: {
                      zoom: {
                        zoom: {
                          wheel: {
                            enabled: true
                          },
                          pinch: {
                            enabled: true
                          },
                          mode: "x"
                        },
                        pan: {
                          enabled: true
                        }
                      },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                            
                                const rawValue = context.raw;
                                const label = context.dataset.label;
                                
                                if (context.dataset.label.includes('Power Consumption (wh)')) {
                                    
                                    return `${rawValue.toFixed(2)} ${unitLabel}`;
                                }
                               
                    
                                if (context.dataset.label === 'Time (minutes)') {
                                    const rawValue = context.raw;
                                    const minutes = parseFloat(rawValue);
                                    
                                    const hours = Math.floor(minutes / 60);
                                    const remainingMinutes = Math.floor(minutes % 60);
                                    const seconds = Math.round((minutes % 1) * 60);
                
                                   
                                    let formattedTime = '';
                                    if (hours > 0) formattedTime += `${hours} hr `;
                                    if (remainingMinutes > 0 || hours > 0) formattedTime += `${remainingMinutes} min `;
                                    formattedTime += `${seconds} sec`;
                                    return `${context.dataset.label}: ${formattedTime} /(${minutes.toFixed(2)} min)`;
                                } else {
                                  
                                    return `${context.dataset.label}: ${context.raw}`;
                                }
                            }
                        }
                    },
                    // plugins: {
                    legend: {
                        display: "Hi2"
                        // display: true
                    }
                }
            }
        });
    }

    chart_destroy() {
        if (this.chart_running_light_graph) {
            this.chart_running_light_graph.destroy();
            this.chart_running_light_graph = null; // Reset chart instance
        }
    }
}