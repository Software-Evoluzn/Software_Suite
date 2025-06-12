// ******************* air conditioner script start *******************
let isSetDateActive_ac_device_graph = false;
let selectedStartDate_ac_device_graph, selectedEndDate_ac_device_graph;

// Initialize Flatpickr for date range selection
function formatDate_ac_device_graph(date) {
    if (!date) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

document.addEventListener('DOMContentLoaded', function () {
    flatpickr("#dateRange_ac_device_graph", {
        mode: "range",
        dateFormat: "d/m/Y",  // Format the date as DD/MM/YYYY
        onChange: function (selectedDates) {
            const startDate_ac_device_graph = selectedDates[0];
            const endDate_ac_device_graph = selectedDates[1];

            // Update the display of start and end dates
            document.getElementById('startDateDisplay_ac_device_graph').innerText = `Start Date: ${formatDate_ac_device_graph(startDate_ac_device_graph)}`;
            document.getElementById('endDateDisplay_ac_device_graph').innerText = `End Date: ${formatDate_ac_device_graph(endDate_ac_device_graph)}`;
        }
    });
});

// Chart.js context for the graph
var ctx_ac_device_graph = document.getElementById('myChart_ac_device_graph').getContext('2d');
var chart_ac_device_graph;


const blueRedGradient_ac_device_graph = ctx_ac_device_graph.createLinearGradient(0, 0, 0, 400);
blueRedGradient_ac_device_graph.addColorStop(0, '#2959FF');
blueRedGradient_ac_device_graph.addColorStop(1, '#9EB3FC');


var greenGradient_ac_device_graph = ctx_ac_device_graph.createLinearGradient(0, 0, 0, 200);
greenGradient_ac_device_graph.addColorStop(0, '#23D900');
greenGradient_ac_device_graph.addColorStop(1, '#23D400');

var staticDailyLabels = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

function generateDateRangeData_ac_device_graph(startDate, endDate, graphType) {
    var labels = [];
    var data = [];

    // Check if the start and end date are the same
    if (startDate.toDateString() === endDate.toDateString()) {
        // If the same, generate 24-hour labels for that day
        labels = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`); // Corrected string interpolation
        data = Array.from({ length: 24 }, () => Math.floor(Math.random() * 100));  // Simulating 24-hour data
    } else {
        var currentDate = new Date(startDate);
        while (currentDate <= endDate) { // Fixed comparison to endDate
            labels.push(currentDate.toLocaleDateString('en-GB')); // Format as DD/MM/YYYY
            data.push(Math.floor(Math.random() * 100));  // Simulating daily data
            currentDate.setDate(currentDate.getDate() + 1);
        }
    }

    return { labels: labels, data: data };
}



// Updated function to calculate active and inactive time for set-date option
function updateGraph_ac_device_graph(timeSelect, graphSelect, startDate, endDate) {
    var labels = [];
    var data = [];
    var yAxisLabel = '';
    var backgroundColor = '';

    if (graphSelect === 'power-consumption') {
        if (timeSelect === 'set-date' && startDate && endDate) {
            const dateRangeData = generateDateRangeData_ac_device_graph(startDate, endDate, graphSelect);
            labels = dateRangeData.labels;
            data = dateRangeData.data;
        } else {
            labels = staticDailyLabels;
            data = [3, 7, 4, 8, 5, 9, 6, 10, 7, 11, 8, 12, 9, 13, 10, 14, 11, 15, 12, 16, 13, 17, 14, 18];
        }
        yAxisLabel = 'Power Consumption (Wh)';
        backgroundColor = blueRedGradient_ac_device_graph;
    } else if (graphSelect === 'power-saving') {
        if (timeSelect === 'set-date' && startDate && endDate) {
            const dateRangeData = generateDateRangeData_ac_device_graph(startDate, endDate, graphSelect);
            labels = dateRangeData.labels;
            data = dateRangeData.data;
        } else {
            labels = staticDailyLabels;
            data = [2, 5, 3, 6, 4, 7, 5, 8, 6, 9, 7, 10, 8, 11, 9, 12, 10, 13, 11, 14, 12, 15, 13, 16];
        }
        yAxisLabel = 'Power Consumption (Rupees)';
        backgroundColor = greenGradient_ac_device_graph;
    } else if (graphSelect === 'active-run-time') {
        var activeTime = [20, 25, 30, 35, 40, 45, 50, 55, 60, 30, 25, 20, 15, 10, 5, 30, 35, 40, 45, 50, 55, 60, 20, 15];
        var inactiveTime = activeTime.map(active => 60 - active);
        labels = staticDailyLabels;
        yAxisLabel = 'Power Consumption (Minutes)';

        if (timeSelect === 'set-date' && startDate && endDate) {
            const dateRangeData = generateDateRangeData_ac_device_graph(startDate, endDate, graphSelect);
            labels = dateRangeData.labels;
            activeTime = dateRangeData.data;

            // Prevent inactiveTime from being negative
            inactiveTime = activeTime.map(active => Math.max(60 - active, 0));
        }

        data = {
            datasets: [
                {
                    label: 'Active Time',
                    data: activeTime,
                    backgroundColor: '#2959FF',
                    borderColor: '#2959FF',
                    borderWidth: 1,
                    stack: 'stack1',
                    borderRadius: 50
                },
                {
                    label: 'Inactive Time',
                    data: inactiveTime,
                    backgroundColor: '#9EB3FC',
                    borderColor: '#9EB3FC',
                    borderWidth: 1,
                    stack: 'stack1',
                    borderRadius: 50
                }
            ]
        };
    }

    if (chart_ac_device_graph) chart_ac_device_graph.destroy();

    chart_ac_device_graph = new Chart(ctx_ac_device_graph, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: graphSelect === 'active-run-time' ? data.datasets : [{
                label: yAxisLabel,
                data: data,
                backgroundColor: backgroundColor,
                borderColor: backgroundColor,
                borderWidth: 1,
                borderRadius: 50
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: (timeSelect === 'daily' || (isSetDateActive_ac_device_graph && selectedStartDate_ac_device_graph && selectedEndDate_ac_device_graph && selectedStartDate_ac_device_graph.toDateString() !== selectedEndDate_ac_device_graph.toDateString())) ? '(Dates)' : '(Hours)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: yAxisLabel
                    },
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    display: graphSelect === 'active-run-time'
                }
            }
        }
    });
}


document.getElementById('timeSelect_ac_device_graph').addEventListener('change', function () {
    var selectedValue = this.value;
    var dateRangeContainer = document.getElementById('dateRangeContainer_ac_device_graph');
    var dateDisplayDiv = document.getElementById('DateDisplay_css_ac_device_graph_div');

    if (selectedValue === 'set-date') {
        isSetDateActive_ac_device_graph = true;
        dateRangeContainer.style.display = 'block';  // Show date range selection
        dateDisplayDiv.style.display = 'flex';       // Show date display div
    } else {
        isSetDateActive_ac_device_graph = false;
        dateRangeContainer.style.display = 'none';   // Hide date range selection
        dateDisplayDiv.style.display = 'none';       // Hide date display div
        updateGraph_ac_device_graph(selectedValue, document.getElementById('graphSelect_ac_device_graph').value);
    }
});


document.getElementById('graphSelect_ac_device_graph').addEventListener('change', function () {
    if (isSetDateActive_ac_device_graph) {
        updateGraph_ac_device_graph('set-date', this.value, selectedStartDate_ac_device_graph, selectedEndDate_ac_device_graph);
    } else {
        updateGraph_ac_device_graph(document.getElementById('timeSelect_ac_device_graph').value, this.value);
    }
});

document.getElementById('applyDateRange_ac_device_graph').addEventListener('click', function () {
    var dateRangePicker = document.getElementById('dateRange_ac_device_graph')._flatpickr;
    selectedStartDate_ac_device_graph = dateRangePicker.selectedDates[0];
    selectedEndDate_ac_device_graph = dateRangePicker.selectedDates[1];

    // Update the display of start and end dates
    document.getElementById('startDateDisplay_ac_device_graph').innerText = `Start Date: ${formatDate_ac_device_graph(selectedStartDate_ac_device_graph)}`;
    document.getElementById('endDateDisplay_ac_device_graph').innerText = `End Date: ${formatDate_ac_device_graph(selectedEndDate_ac_device_graph)}`;

    updateGraph_ac_device_graph('set-date', document.getElementById('graphSelect_ac_device_graph').value, selectedStartDate_ac_device_graph, selectedEndDate_ac_device_graph);
});

// Initial graph load
updateGraph_ac_device_graph('daily', 'power-consumption');


// ******************* air conditioner script end *******************


// ******************* office light script start *******************

let isSetDateActive_office_light_graph = false;
let selectedStartDate_office_light_graph, selectedEndDate_office_light_graph;

// Initialize Flatpickr for date range selection
function formatDate_office_light_graph(date) {
    if (!date) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

document.addEventListener('DOMContentLoaded', function () {
    flatpickr("#dateRange_office_light_graph", {
        mode: "range",
        dateFormat: "d/m/Y",  // Format the date as DD/MM/YYYY
        onChange: function (selectedDates) {
            const startDate_office_light_graph = selectedDates[0];
            const endDate_office_light_graph = selectedDates[1];

            // Update the display of start and end dates
            document.getElementById('startDateDisplay_office_light_graph').innerText = `Start Date: ${formatDate_office_light_graph(startDate_office_light_graph)}`;
            document.getElementById('endDateDisplay_office_light_graph').innerText = `End Date: ${formatDate_office_light_graph(endDate_office_light_graph)}`;
        }
    });
});

// Chart.js context for the graph
var ctx_office_light_graph = document.getElementById('myChart_office_light_graph').getContext('2d');
var chart_office_light_graph;


const blueRedGradient_office_light_graph = ctx_office_light_graph.createLinearGradient(0, 0, 0, 400);
blueRedGradient_office_light_graph.addColorStop(0, '#2959FF');
blueRedGradient_office_light_graph.addColorStop(1, '#9EB3FC');


var greenGradient_office_light_graph = ctx_office_light_graph.createLinearGradient(0, 0, 0, 200);
greenGradient_office_light_graph.addColorStop(0, '#23D900');
greenGradient_office_light_graph.addColorStop(1, '#23D400');

var staticDailyLabels = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

function generateDateRangeData_office_light_graph(startDate, endDate, graphType) {
    var labels = [];
    var data = [];

    // Check if the start and end date are the same
    if (startDate.toDateString() === endDate.toDateString()) {
        // If the same, generate 24-hour labels for that day
        labels = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`); // Corrected string interpolation
        data = Array.from({ length: 24 }, () => Math.floor(Math.random() * 100));  // Simulating 24-hour data
    } else {
        var currentDate = new Date(startDate);
        while (currentDate <= endDate) { // Fixed comparison to endDate
            labels.push(currentDate.toLocaleDateString('en-GB')); // Format as DD/MM/YYYY
            data.push(Math.floor(Math.random() * 100));  // Simulating daily data
            currentDate.setDate(currentDate.getDate() + 1);
        }
    }

    return { labels: labels, data: data };
}



// Updated function to calculate active and inactive time for set-date option
function updateGraph_office_light_graph(timeSelect, graphSelect, startDate, endDate) {
    var labels = [];
    var data = [];
    var yAxisLabel = '';
    var backgroundColor = '';

    if (graphSelect === 'power-consumption') {
        if (timeSelect === 'set-date' && startDate && endDate) {
            const dateRangeData = generateDateRangeData_office_light_graph(startDate, endDate, graphSelect);
            labels = dateRangeData.labels;
            data = dateRangeData.data;
        } else {
            labels = staticDailyLabels;
            data = [3, 7, 4, 8, 5, 9, 6, 10, 7, 11, 8, 12, 9, 13, 10, 14, 11, 15, 12, 16, 13, 17, 14, 18];
        }
        yAxisLabel = 'Power Consumption (Wh)';
        backgroundColor = blueRedGradient_office_light_graph;
    } else if (graphSelect === 'power-saving') {
        if (timeSelect === 'set-date' && startDate && endDate) {
            const dateRangeData = generateDateRangeData_office_light_graph(startDate, endDate, graphSelect);
            labels = dateRangeData.labels;
            data = dateRangeData.data;
        } else {
            labels = staticDailyLabels;
            data = [2, 5, 3, 6, 4, 7, 5, 8, 6, 9, 7, 10, 8, 11, 9, 12, 10, 13, 11, 14, 12, 15, 13, 16];
        }
        yAxisLabel = 'Power Consumption (Rupees)';
        backgroundColor = greenGradient_office_light_graph;
    } else if (graphSelect === 'active-run-time') {
        var activeTime = [20, 25, 30, 35, 40, 45, 50, 55, 60, 30, 25, 20, 15, 10, 5, 30, 35, 40, 45, 50, 55, 60, 20, 15];
        var inactiveTime = activeTime.map(active => 60 - active);
        labels = staticDailyLabels;
        yAxisLabel = 'Power Consumption (Minutes)';

        if (timeSelect === 'set-date' && startDate && endDate) {
            const dateRangeData = generateDateRangeData_office_light_graph(startDate, endDate, graphSelect);
            labels = dateRangeData.labels;
            activeTime = dateRangeData.data;

            // Prevent inactiveTime from being negative
            inactiveTime = activeTime.map(active => Math.max(60 - active, 0));
        }

        data = {
            datasets: [
                {
                    label: 'Active Time',
                    data: activeTime,
                    backgroundColor: '#2959FF',
                    borderColor: '#2959FF',
                    borderWidth: 1,
                    stack: 'stack1',
                    borderRadius: 50
                },
                {
                    label: 'Inactive Time',
                    data: inactiveTime,
                    backgroundColor: '#9EB3FC',
                    borderColor: '#9EB3FC',
                    borderWidth: 1,
                    stack: 'stack1',
                    borderRadius: 50
                }
            ]
        };
    }

    if (chart_office_light_graph) chart_office_light_graph.destroy();

    chart_office_light_graph = new Chart(ctx_office_light_graph, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: graphSelect === 'active-run-time' ? data.datasets : [{
                label: yAxisLabel,
                data: data,
                backgroundColor: backgroundColor,
                borderColor: backgroundColor,
                borderWidth: 1,
                borderRadius: 50
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: (timeSelect === 'daily' || (isSetDateActive_office_light_graph && selectedStartDate_office_light_graph && selectedEndDate_office_light_graph && selectedStartDate_office_light_graph.toDateString() !== selectedEndDate_office_light_graph.toDateString())) ? '(Dates)' : '(Hours)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: yAxisLabel
                    },
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    display: graphSelect === 'active-run-time'
                }
            }
        }
    });
}


document.getElementById('timeSelect_office_light_graph').addEventListener('change', function () {
    var selectedValue = this.value;
    var dateRangeContainer = document.getElementById('dateRangeContainer_office_light_graph');
    var dateDisplayDiv = document.getElementById('DateDisplay_css_office_light_graph_div');

    if (selectedValue === 'set-date') {
        isSetDateActive_office_light_graph = true;
        dateRangeContainer.style.display = 'block';  // Show date range selection
        dateDisplayDiv.style.display = 'flex';       // Show date display div
    } else {
        isSetDateActive_office_light_graph = false;
        dateRangeContainer.style.display = 'none';   // Hide date range selection
        dateDisplayDiv.style.display = 'none';       // Hide date display div
        updateGraph_office_light_graph(selectedValue, document.getElementById('graphSelect_office_light_graph').value);
    }
});


document.getElementById('graphSelect_office_light_graph').addEventListener('change', function () {
    if (isSetDateActive_office_light_graph) {
        updateGraph_office_light_graph('set-date', this.value, selectedStartDate_office_light_graph, selectedEndDate_office_light_graph);
    } else {
        updateGraph_office_light_graph(document.getElementById('timeSelect_office_light_graph').value, this.value);
    }
});

document.getElementById('applyDateRange_office_light_graph').addEventListener('click', function () {
    var dateRangePicker = document.getElementById('dateRange_office_light_graph')._flatpickr;
    selectedStartDate_office_light_graph = dateRangePicker.selectedDates[0];
    selectedEndDate_office_light_graph = dateRangePicker.selectedDates[1];

    // Update the display of start and end dates
    document.getElementById('startDateDisplay_office_light_graph').innerText = `Start Date: ${formatDate_office_light_graph(selectedStartDate_office_light_graph)}`;
    document.getElementById('endDateDisplay_office_light_graph').innerText = `End Date: ${formatDate_office_light_graph(selectedEndDate_office_light_graph)}`;

    updateGraph_office_light_graph('set-date', document.getElementById('graphSelect_office_light_graph').value, selectedStartDate_office_light_graph, selectedEndDate_office_light_graph);
});

// Initial graph load
updateGraph_office_light_graph('daily', 'power-consumption');

// ******************* office light script end *******************

// ******************* hibay light script start *******************

let isSetDateActive_hibay_light_graph = false;
let selectedStartDate_hibay_light_graph, selectedEndDate_hibay_light_graph;

// Initialize Flatpickr for date range selection
function formatDate_hibay_light_graph(date) {
    if (!date) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

document.addEventListener('DOMContentLoaded', function () {
    flatpickr("#dateRange_hibay_light_graph", {
        mode: "range",
        dateFormat: "d/m/Y",  // Format the date as DD/MM/YYYY
        onChange: function (selectedDates) {
            const startDate_hibay_light_graph = selectedDates[0];
            const endDate_hibay_light_graph = selectedDates[1];

            // Update the display of start and end dates
            document.getElementById('startDateDisplay_hibay_light_graph').innerText = `Start Date: ${formatDate_hibay_light_graph(startDate_hibay_light_graph)}`;
            document.getElementById('endDateDisplay_hibay_light_graph').innerText = `End Date: ${formatDate_hibay_light_graph(endDate_hibay_light_graph)}`;
        }
    });
});

// Chart.js context for the graph
var ctx_hibay_light_graph = document.getElementById('myChart_hibay_light_graph').getContext('2d');
var chart_hibay_light_graph;


const blueRedGradient_hibay_light_graph = ctx_hibay_light_graph.createLinearGradient(0, 0, 0, 400);
blueRedGradient_hibay_light_graph.addColorStop(0, '#2959FF');
blueRedGradient_hibay_light_graph.addColorStop(1, '#9EB3FC');


var greenGradient_hibay_light_graph = ctx_hibay_light_graph.createLinearGradient(0, 0, 0, 200);
greenGradient_hibay_light_graph.addColorStop(0, '#23D900');
greenGradient_hibay_light_graph.addColorStop(1, '#23D400');

var staticDailyLabels = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

function generateDateRangeData_hibay_light_graph(startDate, endDate, graphType) {
    var labels = [];
    var data = [];

    // Check if the start and end date are the same
    if (startDate.toDateString() === endDate.toDateString()) {
        // If the same, generate 24-hour labels for that day
        labels = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`); // Corrected string interpolation
        data = Array.from({ length: 24 }, () => Math.floor(Math.random() * 100));  // Simulating 24-hour data
    } else {
        var currentDate = new Date(startDate);
        while (currentDate <= endDate) { // Fixed comparison to endDate
            labels.push(currentDate.toLocaleDateString('en-GB')); // Format as DD/MM/YYYY
            data.push(Math.floor(Math.random() * 100));  // Simulating daily data
            currentDate.setDate(currentDate.getDate() + 1);
        }
    }

    return { labels: labels, data: data };
}



// Updated function to calculate active and inactive time for set-date option
function updateGraph_hibay_light_graph(timeSelect, graphSelect, startDate, endDate) {
    var labels = [];
    var data = [];
    var yAxisLabel = '';
    var backgroundColor = '';

    if (graphSelect === 'power-consumption') {
        if (timeSelect === 'set-date' && startDate && endDate) {
            const dateRangeData = generateDateRangeData_hibay_light_graph(startDate, endDate, graphSelect);
            labels = dateRangeData.labels;
            data = dateRangeData.data;
        } else {
            labels = staticDailyLabels;
            data = [3, 7, 4, 8, 5, 9, 6, 10, 7, 11, 8, 12, 9, 13, 10, 14, 11, 15, 12, 16, 13, 17, 14, 18];
        }
        yAxisLabel = 'Power Consumption (Wh)';
        backgroundColor = blueRedGradient_hibay_light_graph;
    } else if (graphSelect === 'power-saving') {
        if (timeSelect === 'set-date' && startDate && endDate) {
            const dateRangeData = generateDateRangeData_hibay_light_graph(startDate, endDate, graphSelect);
            labels = dateRangeData.labels;
            data = dateRangeData.data;
        } else {
            labels = staticDailyLabels;
            data = [2, 5, 3, 6, 4, 7, 5, 8, 6, 9, 7, 10, 8, 11, 9, 12, 10, 13, 11, 14, 12, 15, 13, 16];
        }
        yAxisLabel = 'Power Consumption (Rupees)';
        backgroundColor = greenGradient_hibay_light_graph;
    } else if (graphSelect === 'active-run-time') {
        var activeTime = [20, 25, 30, 35, 40, 45, 50, 55, 60, 30, 25, 20, 15, 10, 5, 30, 35, 40, 45, 50, 55, 60, 20, 15];
        var inactiveTime = activeTime.map(active => 60 - active);
        labels = staticDailyLabels;
        yAxisLabel = 'Power Consumption (Minutes)';

        if (timeSelect === 'set-date' && startDate && endDate) {
            const dateRangeData = generateDateRangeData_hibay_light_graph(startDate, endDate, graphSelect);
            labels = dateRangeData.labels;
            activeTime = dateRangeData.data;

            // Prevent inactiveTime from being negative
            inactiveTime = activeTime.map(active => Math.max(60 - active, 0));
        }

        data = {
            datasets: [
                {
                    label: 'Active Time',
                    data: activeTime,
                    backgroundColor: '#2959FF',
                    borderColor: '#2959FF',
                    borderWidth: 1,
                    stack: 'stack1',
                    borderRadius: 50
                },
                {
                    label: 'Inactive Time',
                    data: inactiveTime,
                    backgroundColor: '#9EB3FC',
                    borderColor: '#9EB3FC',
                    borderWidth: 1,
                    stack: 'stack1',
                    borderRadius: 50
                }
            ]
        };
    }

    if (chart_hibay_light_graph) chart_hibay_light_graph.destroy();

    chart_hibay_light_graph = new Chart(ctx_hibay_light_graph, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: graphSelect === 'active-run-time' ? data.datasets : [{
                label: yAxisLabel,
                data: data,
                backgroundColor: backgroundColor,
                borderColor: backgroundColor,
                borderWidth: 1,
                borderRadius: 50
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: (timeSelect === 'daily' || (isSetDateActive_hibay_light_graph && selectedStartDate_hibay_light_graph && selectedEndDate_hibay_light_graph && selectedStartDate_hibay_light_graph.toDateString() !== selectedEndDate_hibay_light_graph.toDateString())) ? '(Dates)' : '(Hours)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: yAxisLabel
                    },
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    display: graphSelect === 'active-run-time'
                }
            }
        }
    });
}


document.getElementById('timeSelect_hibay_light_graph').addEventListener('change', function () {
    var selectedValue = this.value;
    var dateRangeContainer = document.getElementById('dateRangeContainer_hibay_light_graph');
    var dateDisplayDiv = document.getElementById('DateDisplay_css_hibay_light_graph_div');

    if (selectedValue === 'set-date') {
        isSetDateActive_hibay_light_graph = true;
        dateRangeContainer.style.display = 'block';  // Show date range selection
        dateDisplayDiv.style.display = 'flex';       // Show date display div
    } else {
        isSetDateActive_hibay_light_graph = false;
        dateRangeContainer.style.display = 'none';   // Hide date range selection
        dateDisplayDiv.style.display = 'none';       // Hide date display div
        updateGraph_hibay_light_graph(selectedValue, document.getElementById('graphSelect_hibay_light_graph').value);
    }
});


document.getElementById('graphSelect_hibay_light_graph').addEventListener('change', function () {
    if (isSetDateActive_hibay_light_graph) {
        updateGraph_hibay_light_graph('set-date', this.value, selectedStartDate_hibay_light_graph, selectedEndDate_hibay_light_graph);
    } else {
        updateGraph_hibay_light_graph(document.getElementById('timeSelect_hibay_light_graph').value, this.value);
    }
});

document.getElementById('applyDateRange_hibay_light_graph').addEventListener('click', function () {
    var dateRangePicker = document.getElementById('dateRange_hibay_light_graph')._flatpickr;
    selectedStartDate_hibay_light_graph = dateRangePicker.selectedDates[0];
    selectedEndDate_hibay_light_graph = dateRangePicker.selectedDates[1];

    // Update the display of start and end dates
    document.getElementById('startDateDisplay_hibay_light_graph').innerText = `Start Date: ${formatDate_hibay_light_graph(selectedStartDate_hibay_light_graph)}`;
    document.getElementById('endDateDisplay_hibay_light_graph').innerText = `End Date: ${formatDate_hibay_light_graph(selectedEndDate_hibay_light_graph)}`;

    updateGraph_hibay_light_graph('set-date', document.getElementById('graphSelect_hibay_light_graph').value, selectedStartDate_hibay_light_graph, selectedEndDate_hibay_light_graph);
});

// Initial graph load
updateGraph_hibay_light_graph('daily', 'power-consumption');



// ******************* hibay light script end *******************


// ******************* machine_oee_stats script start *******************
let isSetDateActive_machine_oee_stats = false;
let selectedStartDate_machine_oee_stats, selectedEndDate_machine_oee_stats;

// Initialize Flatpickr for date range selection
function formatDate_machine_oee_stats(date) {
    if (!date) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

document.addEventListener('DOMContentLoaded', function () {
    flatpickr("#dateRange_machine_oee_stats", {
        mode: "range",
        dateFormat: "d/m/Y",  // Format the date as DD/MM/YYYY
        onChange: function (selectedDates) {
            const startDate_machine_oee_stats = selectedDates[0];
            const endDate_machine_oee_stats = selectedDates[1];

            // Update the display of start and end dates
            document.getElementById('startDateDisplay_machine_oee_stats').innerText = `Start Date: ${formatDate_machine_oee_stats(startDate_machine_oee_stats)}`;
            document.getElementById('endDateDisplay_machine_oee_stats').innerText = `End Date: ${formatDate_machine_oee_stats(endDate_machine_oee_stats)}`;
        }
    });
});

// Chart.js context for the graph
var ctx_machine_oee_stats = document.getElementById('myChart_machine_oee_stats').getContext('2d');
var chart_machine_oee_stats;


const blueRedGradient_machine_oee_stats = ctx_machine_oee_stats.createLinearGradient(0, 0, 0, 400);
blueRedGradient_machine_oee_stats.addColorStop(0, '#2959FF');
blueRedGradient_machine_oee_stats.addColorStop(1, '#9EB3FC');


var greenGradient_machine_oee_stats = ctx_machine_oee_stats.createLinearGradient(0, 0, 0, 200);
greenGradient_machine_oee_stats.addColorStop(0, '#23D900');
greenGradient_machine_oee_stats.addColorStop(1, '#23D400');

var staticDailyLabels = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

function generateDateRangeData_machine_oee_stats(startDate, endDate, graphType) {
    var labels = [];
    var data = [];

    // Check if the start and end date are the same
    if (startDate.toDateString() === endDate.toDateString()) {
        // If the same, generate 24-hour labels for that day
        labels = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`); // Corrected string interpolation
        data = Array.from({ length: 24 }, () => Math.floor(Math.random() * 100));  // Simulating 24-hour data
    } else {
        var currentDate = new Date(startDate);
        while (currentDate <= endDate) { // Fixed comparison to endDate
            labels.push(currentDate.toLocaleDateString('en-GB')); // Format as DD/MM/YYYY
            data.push(Math.floor(Math.random() * 100));  // Simulating daily data
            currentDate.setDate(currentDate.getDate() + 1);
        }
    }

    return { labels: labels, data: data };
}



// Updated function to calculate active and inactive time for set-date option
function updateGraph_machine_oee_stats(timeSelect, graphSelect, startDate, endDate) {
    var labels = [];
    var data = [];
    var yAxisLabel = '';
    var backgroundColor = '';

    if (graphSelect === 'power-consumption') {
        if (timeSelect === 'set-date' && startDate && endDate) {
            const dateRangeData = generateDateRangeData_machine_oee_stats(startDate, endDate, graphSelect);
            labels = dateRangeData.labels;
            data = dateRangeData.data;
        } else {
            labels = staticDailyLabels;
            data = [3, 7, 4, 8, 5, 9, 6, 10, 7, 11, 8, 12, 9, 13, 10, 14, 11, 15, 12, 16, 13, 17, 14, 18];
        }
        yAxisLabel = 'Power Consumption (Wh)';
        backgroundColor = blueRedGradient_machine_oee_stats;
    } else if (graphSelect === 'power-saving') {
        if (timeSelect === 'set-date' && startDate && endDate) {
            const dateRangeData = generateDateRangeData_machine_oee_stats(startDate, endDate, graphSelect);
            labels = dateRangeData.labels;
            data = dateRangeData.data;
        } else {
            labels = staticDailyLabels;
            data = [2, 5, 3, 6, 4, 7, 5, 8, 6, 9, 7, 10, 8, 11, 9, 12, 10, 13, 11, 14, 12, 15, 13, 16];
        }
        yAxisLabel = 'Power Consumption (Rupees)';
        backgroundColor = greenGradient_machine_oee_stats;
    } else if (graphSelect === 'active-run-time') {
        var activeTime = [20, 25, 30, 35, 40, 45, 50, 55, 60, 30, 25, 20, 15, 10, 5, 30, 35, 40, 45, 50, 55, 60, 20, 15];
        var inactiveTime = activeTime.map(active => 60 - active);
        labels = staticDailyLabels;
        yAxisLabel = 'Power Consumption (Minutes)';

        if (timeSelect === 'set-date' && startDate && endDate) {
            const dateRangeData = generateDateRangeData_machine_oee_stats(startDate, endDate, graphSelect);
            labels = dateRangeData.labels;
            activeTime = dateRangeData.data;

            // Prevent inactiveTime from being negative
            inactiveTime = activeTime.map(active => Math.max(60 - active, 0));
        }

        data = {
            datasets: [
                {
                    label: 'Active Time',
                    data: activeTime,
                    backgroundColor: '#2959FF',
                    borderColor: '#2959FF',
                    borderWidth: 1,
                    stack: 'stack1',
                    borderRadius: 50
                },
                {
                    label: 'Inactive Time',
                    data: inactiveTime,
                    backgroundColor: '#9EB3FC',
                    borderColor: '#9EB3FC',
                    borderWidth: 1,
                    stack: 'stack1',
                    borderRadius: 50
                }
            ]
        };
    }

    if (chart_machine_oee_stats) chart_machine_oee_stats.destroy();

    chart_machine_oee_stats = new Chart(ctx_machine_oee_stats, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: graphSelect === 'active-run-time' ? data.datasets : [{
                label: yAxisLabel,
                data: data,
                backgroundColor: backgroundColor,
                borderColor: backgroundColor,
                borderWidth: 1,
                borderRadius: 50
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: (timeSelect === 'daily' || (isSetDateActive_machine_oee_stats && selectedStartDate_machine_oee_stats && selectedEndDate_machine_oee_stats && selectedStartDate_machine_oee_stats.toDateString() !== selectedEndDate_machine_oee_stats.toDateString())) ? '(Dates)' : '(Hours)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: yAxisLabel
                    },
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    display: graphSelect === 'active-run-time'
                }
            }
        }
    });
}


document.getElementById('timeSelect_machine_oee_stats').addEventListener('change', function () {
    var selectedValue = this.value;
    var dateRangeContainer = document.getElementById('dateRangeContainer_machine_oee_stats');
    var dateDisplayDiv = document.getElementById('DateDisplay_css_machine_oee_stats_div');

    if (selectedValue === 'set-date') {
        isSetDateActive_machine_oee_stats = true;
        dateRangeContainer.style.display = 'block';  // Show date range selection
        dateDisplayDiv.style.display = 'flex';       // Show date display div
    } else {
        isSetDateActive_machine_oee_stats = false;
        dateRangeContainer.style.display = 'none';   // Hide date range selection
        dateDisplayDiv.style.display = 'none';       // Hide date display div
        updateGraph_machine_oee_stats(selectedValue, document.getElementById('graphSelect_machine_oee_stats').value);
    }
});


document.getElementById('graphSelect_machine_oee_stats').addEventListener('change', function () {
    if (isSetDateActive_machine_oee_stats) {
        updateGraph_machine_oee_stats('set-date', this.value, selectedStartDate_machine_oee_stats, selectedEndDate_machine_oee_stats);
    } else {
        updateGraph_machine_oee_stats(document.getElementById('timeSelect_machine_oee_stats').value, this.value);
    }
});

document.getElementById('applyDateRange_machine_oee_stats').addEventListener('click', function () {
    var dateRangePicker = document.getElementById('dateRange_machine_oee_stats')._flatpickr;
    selectedStartDate_machine_oee_stats = dateRangePicker.selectedDates[0];
    selectedEndDate_machine_oee_stats = dateRangePicker.selectedDates[1];

    // Update the display of start and end dates
    document.getElementById('startDateDisplay_machine_oee_stats').innerText = `Start Date: ${formatDate_machine_oee_stats(selectedStartDate_machine_oee_stats)}`;
    document.getElementById('endDateDisplay_machine_oee_stats').innerText = `End Date: ${formatDate_machine_oee_stats(selectedEndDate_machine_oee_stats)}`;

    updateGraph_machine_oee_stats('set-date', document.getElementById('graphSelect_machine_oee_stats').value, selectedStartDate_machine_oee_stats, selectedEndDate_machine_oee_stats);
});

// Initial graph load
updateGraph_machine_oee_stats('daily', 'power-consumption');

// ******************* machine_oee_stats script end *******************


// ******************* all device power consumption graph script start *******************

let isSetDateActive_all_device_power_consumption_graph = false;
let selectedStartDate_all_device_power_consumption_graph, selectedEndDate_all_device_power_consumption_graph;

// Initialize Flatpickr for date range selection
function formatDate_all_device_power_consumption_graph(date) {
    if (!date) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

document.addEventListener('DOMContentLoaded', function () {
    flatpickr("#dateRange_all_device_power_consumption_graph", {
        mode: "range",
        dateFormat: "d/m/Y",  // Format the date as DD/MM/YYYY
        onChange: function (selectedDates) {
            const startDate_all_device_power_consumption_graph = selectedDates[0];
            const endDate_all_device_power_consumption_graph = selectedDates[1];

            // Update the display of start and end dates
            document.getElementById('startDateDisplay_all_device_power_consumption_graph').innerText = `Start Date: ${formatDate_all_device_power_consumption_graph(startDate_all_device_power_consumption_graph)}`;
            document.getElementById('endDateDisplay_all_device_power_consumption_graph').innerText = `End Date: ${formatDate_all_device_power_consumption_graph(endDate_all_device_power_consumption_graph)}`;
        }
    });
});

// Chart.js context for the graph
var ctx_all_device_power_consumption_graph = document.getElementById('myChart_all_device_power_consumption_graph').getContext('2d');
var chart_all_device_power_consumption_graph;


const blueRedGradient_all_device_power_consumption_graph = ctx_all_device_power_consumption_graph.createLinearGradient(0, 0, 0, 400);
blueRedGradient_all_device_power_consumption_graph.addColorStop(0, '#2959FF');
blueRedGradient_all_device_power_consumption_graph.addColorStop(1, '#9EB3FC');


var greenGradient_all_device_power_consumption_graph = ctx_all_device_power_consumption_graph.createLinearGradient(0, 0, 0, 200);
greenGradient_all_device_power_consumption_graph.addColorStop(0, '#23D900');
greenGradient_all_device_power_consumption_graph.addColorStop(1, '#23D400');

var staticDailyLabels = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

function generateDateRangeData_all_device_power_consumption_graph(startDate, endDate, graphType) {
    var labels = [];
    var data = [];

    // Check if the start and end date are the same
    if (startDate.toDateString() === endDate.toDateString()) {
        // If the same, generate 24-hour labels for that day
        labels = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`); // Corrected string interpolation
        data = Array.from({ length: 24 }, () => Math.floor(Math.random() * 100));  // Simulating 24-hour data
    } else {
        var currentDate = new Date(startDate);
        while (currentDate <= endDate) { // Fixed comparison to endDate
            labels.push(currentDate.toLocaleDateString('en-GB')); // Format as DD/MM/YYYY
            data.push(Math.floor(Math.random() * 100));  // Simulating daily data
            currentDate.setDate(currentDate.getDate() + 1);
        }
    }

    return { labels: labels, data: data };
}



// Updated function to calculate active and inactive time for set-date option
function updateGraph_all_device_power_consumption_graph(timeSelect, graphSelect, startDate, endDate) {
    var labels = [];
    var data = [];
    var yAxisLabel = '';
    var backgroundColor = '';

    if (graphSelect === 'power-consumption') {
        if (timeSelect === 'set-date' && startDate && endDate) {
            const dateRangeData = generateDateRangeData_all_device_power_consumption_graph(startDate, endDate, graphSelect);
            labels = dateRangeData.labels;
            data = dateRangeData.data;
        } else {
            labels = staticDailyLabels;
            data = [3, 7, 4, 8, 5, 9, 6, 10, 7, 11, 8, 12, 9, 13, 10, 14, 11, 15, 12, 16, 13, 17, 14, 18];
        }
        yAxisLabel = 'Power Consumption (Wh)';
        backgroundColor = blueRedGradient_all_device_power_consumption_graph;
    } else if (graphSelect === 'power-saving') {
        if (timeSelect === 'set-date' && startDate && endDate) {
            const dateRangeData = generateDateRangeData_all_device_power_consumption_graph(startDate, endDate, graphSelect);
            labels = dateRangeData.labels;
            data = dateRangeData.data;
        } else {
            labels = staticDailyLabels;
            data = [2, 5, 3, 6, 4, 7, 5, 8, 6, 9, 7, 10, 8, 11, 9, 12, 10, 13, 11, 14, 12, 15, 13, 16];
        }
        yAxisLabel = 'Power Consumption (Rupees)';
        backgroundColor = greenGradient_all_device_power_consumption_graph;
    } else if (graphSelect === 'active-run-time') {
        var activeTime = [20, 25, 30, 35, 40, 45, 50, 55, 60, 30, 25, 20, 15, 10, 5, 30, 35, 40, 45, 50, 55, 60, 20, 15];
        var inactiveTime = activeTime.map(active => 60 - active);
        labels = staticDailyLabels;
        yAxisLabel = 'Power Consumption (Minutes)';

        if (timeSelect === 'set-date' && startDate && endDate) {
            const dateRangeData = generateDateRangeData_all_device_power_consumption_graph(startDate, endDate, graphSelect);
            labels = dateRangeData.labels;
            activeTime = dateRangeData.data;

            // Prevent inactiveTime from being negative
            inactiveTime = activeTime.map(active => Math.max(60 - active, 0));
        }

        data = {
            datasets: [
                {
                    label: 'Active Time',
                    data: activeTime,
                    backgroundColor: '#2959FF',
                    borderColor: '#2959FF',
                    borderWidth: 1,
                    stack: 'stack1',
                    borderRadius: 50
                },
                {
                    label: 'Inactive Time',
                    data: inactiveTime,
                    backgroundColor: '#9EB3FC',
                    borderColor: '#9EB3FC',
                    borderWidth: 1,
                    stack: 'stack1',
                    borderRadius: 50
                }
            ]
        };
    }

    if (chart_all_device_power_consumption_graph) chart_all_device_power_consumption_graph.destroy();

    chart_all_device_power_consumption_graph = new Chart(ctx_all_device_power_consumption_graph, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: graphSelect === 'active-run-time' ? data.datasets : [{
                label: yAxisLabel,
                data: data,
                backgroundColor: backgroundColor,
                borderColor: backgroundColor,
                borderWidth: 1,
                borderRadius: 50
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: (timeSelect === 'daily' || (isSetDateActive_all_device_power_consumption_graph && selectedStartDate_all_device_power_consumption_graph && selectedEndDate_all_device_power_consumption_graph && selectedStartDate_all_device_power_consumption_graph.toDateString() !== selectedEndDate_all_device_power_consumption_graph.toDateString())) ? '(Dates)' : '(Hours)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: yAxisLabel
                    },
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    display: graphSelect === 'active-run-time'
                }
            }
        }
    });
}


document.getElementById('timeSelect_all_device_power_consumption_graph').addEventListener('change', function () {
    var selectedValue = this.value;
    var dateRangeContainer = document.getElementById('dateRangeContainer_all_device_power_consumption_graph');
    var dateDisplayDiv = document.getElementById('DateDisplay_css_all_device_power_consumption_graph_div');

    if (selectedValue === 'set-date') {
        isSetDateActive_all_device_power_consumption_graph = true;
        dateRangeContainer.style.display = 'block';  // Show date range selection
        dateDisplayDiv.style.display = 'flex';       // Show date display div
    } else {
        isSetDateActive_all_device_power_consumption_graph = false;
        dateRangeContainer.style.display = 'none';   // Hide date range selection
        dateDisplayDiv.style.display = 'none';       // Hide date display div
        updateGraph_all_device_power_consumption_graph(selectedValue, document.getElementById('graphSelect_all_device_power_consumption_graph').value);
    }
});


document.getElementById('graphSelect_all_device_power_consumption_graph').addEventListener('change', function () {
    if (isSetDateActive_all_device_power_consumption_graph) {
        updateGraph_all_device_power_consumption_graph('set-date', this.value, selectedStartDate_all_device_power_consumption_graph, selectedEndDate_all_device_power_consumption_graph);
    } else {
        updateGraph_all_device_power_consumption_graph(document.getElementById('timeSelect_all_device_power_consumption_graph').value, this.value);
    }
});

document.getElementById('applyDateRange_all_device_power_consumption_graph').addEventListener('click', function () {
    var dateRangePicker = document.getElementById('dateRange_all_device_power_consumption_graph')._flatpickr;
    selectedStartDate_all_device_power_consumption_graph = dateRangePicker.selectedDates[0];
    selectedEndDate_all_device_power_consumption_graph = dateRangePicker.selectedDates[1];

    // Update the display of start and end dates
    document.getElementById('startDateDisplay_all_device_power_consumption_graph').innerText = `Start Date: ${formatDate_all_device_power_consumption_graph(selectedStartDate_all_device_power_consumption_graph)}`;
    document.getElementById('endDateDisplay_all_device_power_consumption_graph').innerText = `End Date: ${formatDate_all_device_power_consumption_graph(selectedEndDate_all_device_power_consumption_graph)}`;

    updateGraph_all_device_power_consumption_graph('set-date', document.getElementById('graphSelect_all_device_power_consumption_graph').value, selectedStartDate_all_device_power_consumption_graph, selectedEndDate_all_device_power_consumption_graph);
});
// Initial graph load
updateGraph_all_device_power_consumption_graph('daily', 'power-consumption');
// ******************* all device power consumption graph script end *******************


// ******************* total saving  script start *******************
document.addEventListener('DOMContentLoaded', function () {
    const lightSelect_total_saving_values = document.getElementById('lightSelect_total_saving_values');
    const timeSelect_total_saving_values = document.getElementById('timeSelect_total_saving_values');
    const valueDisplay_total_saving_values = document.getElementById('valueDisplay_total_saving_values');
    const datePicker_total_saving_values = document.getElementById('datePicker_total_saving_values');
    const applyButton_total_saving_values = document.getElementById('applyButton_total_saving_values');
    let selectedDates_total_saving_values = [];

    // Numeric values for "Today" based on light type
    const todayValues_total_saving_values = {
        running_lights_total_saving_values: 100, // kWh value for running lights
        highbay_lights_total_saving_values: 200, // kWh value for highbay lights
        office_lights_total_saving_values: 150,  // kWh value for office lights
        ac_total_saving_values: 250 // kWh value for AC
    };

    // Function to generate random power consumption values
    function getRandomValue_total_saving_values(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // Function to update the displayed values
    function updateValues_total_saving_values() {
        const selectedLight_total_saving_values = lightSelect_total_saving_values.value;
        const selectedTime_total_saving_values = timeSelect_total_saving_values.value;

        if (selectedTime_total_saving_values === 'today_total_saving_values') {
            // Show today's numeric values for the selected light
            valueDisplay_total_saving_values.textContent = `${selectedLight_total_saving_values.replace('_total_saving_values', ' ')} - ${todayValues_total_saving_values[selectedLight_total_saving_values]} Rs (Today)`;
            datePicker_total_saving_values.style.display = 'none'; // Hide date picker
        } else if (selectedTime_total_saving_values === 'set_date_total_saving_values' && selectedDates_total_saving_values.length === 2) {
            // If Set Date is selected and a date range is already set, update the display
            const randomValue_total_saving_values = getRandomValue_total_saving_values(50, 300); // Random values between 50 and 300 kWh
            const startDate_total_saving_values = flatpickr.formatDate(selectedDates_total_saving_values[0], "d/m/Y");
            const endDate_total_saving_values = flatpickr.formatDate(selectedDates_total_saving_values[1], "d/m/Y");

            // Display the Set Date Range values
            valueDisplay_total_saving_values.textContent = `Values: ${selectedLight_total_saving_values.replace('_total_saving_values', ' ')} - ${randomValue_total_saving_values} Rs (from ${startDate_total_saving_values} to ${endDate_total_saving_values})`;
            datePicker_total_saving_values.style.display = 'block'; // Show date picker if it was already visible
        } else if (selectedTime_total_saving_values === 'set_date_total_saving_values') {
            // Prompt to select a date range if no date range has been set yet
            // valueDisplay_total_saving_values.textContent = `Select a date range to get custom values for ${selectedLight_total_saving_values.replace('_total_saving_values', ' ')}`;
            datePicker_total_saving_values.style.display = 'block'; // Show date picker
        }
    }

    // Flatpickr for date range selection
    flatpickr("#dateRange_total_saving_values", {
        mode: "range",
        dateFormat: "d/m/Y",
        onChange: function (dates) {
            // Store the selected date range
            selectedDates_total_saving_values = dates;
        }
    });

    // Function to display the values when "Apply" is clicked
    applyButton_total_saving_values.addEventListener('click', function () {
        if (selectedDates_total_saving_values.length === 2) {
            const selectedLight_total_saving_values = lightSelect_total_saving_values.value;
            const randomValue_total_saving_values = getRandomValue_total_saving_values(50, 300); // Random values between 50 and 300 kWh
            const startDate_total_saving_values = flatpickr.formatDate(selectedDates_total_saving_values[0], "d/m/Y");
            const endDate_total_saving_values = flatpickr.formatDate(selectedDates_total_saving_values[1], "d/m/Y");

            // Display the Set Date Range values after clicking Apply
            valueDisplay_total_saving_values.textContent = `${selectedLight_total_saving_values.replace('_total_saving_values', ' ')} - ${randomValue_total_saving_values} Rs (from ${startDate_total_saving_values} to ${endDate_total_saving_values})`;
        }
    });

    // Update values when light or time selection changes
    lightSelect_total_saving_values.addEventListener('change', updateValues_total_saving_values);
    timeSelect_total_saving_values.addEventListener('change', updateValues_total_saving_values);

    // Initial update to set default values for "Today"
    updateValues_total_saving_values();
});
// ******************* total saving  script end *******************

// ******************* TOTAL POWER CONSUMPTION script start *******************
document.addEventListener('DOMContentLoaded', function () {
    const lightSelect_total_power_consumption = document.getElementById('lightSelect_total_power_consumption');
    const timeSelect_total_power_consumption = document.getElementById('timeSelect_total_power_consumption');
    const valueDisplay_total_power_consumption = document.getElementById('valueDisplay_total_power_consumption');
    const datePicker_total_power_consumption = document.getElementById('datePicker_total_power_consumption');
    const applyButton_total_power_consumption = document.getElementById('applyButton_total_power_consumption');
    let selectedDates_total_power_consumption = [];

    // Numeric values for "Today" based on light type
    const todayValues_total_power_consumption = {
        running_lights_total_power_consumption: 100, 
        highbay_lights_total_power_consumption: 200, 
        office_lights_total_power_consumption: 150, 
        ac_total_power_consumption: 250 
    };

    // Function to generate random power consumption values
    function getRandomValue_total_power_consumption(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // Function to update the displayed values
    function updateValues_total_power_consumption() {
        const selectedLight_total_power_consumption = lightSelect_total_power_consumption.value;
        const selectedTime_total_power_consumption = timeSelect_total_power_consumption.value;

        if (selectedTime_total_power_consumption === 'today_total_power_consumption') {
        
            valueDisplay_total_power_consumption.textContent = `${selectedLight_total_power_consumption.replace('_total_power_consumption', ' ')} - ${todayValues_total_power_consumption[selectedLight_total_power_consumption]} Wh (Today)`;
            datePicker_total_power_consumption.style.display = 'none'; // Hide date picker
        } else if (selectedTime_total_power_consumption === 'set_date_total_power_consumption' && selectedDates_total_power_consumption.length === 2) {
          
            const randomValue_total_power_consumption = getRandomValue_total_power_consumption(50, 300); // Random values between 50 and 300 kWh
            const startDate_total_power_consumption = flatpickr.formatDate(selectedDates_total_power_consumption[0], "d/m/Y");
            const endDate_total_power_consumption = flatpickr.formatDate(selectedDates_total_power_consumption[1], "d/m/Y");

            // Display the Set Date Range values
            valueDisplay_total_power_consumption.textContent = `${selectedLight_total_power_consumption.replace('_total_power_consumption', ' ')} - ${randomValue_total_power_consumption} Wh (from ${startDate_total_power_consumption} to ${endDate_total_power_consumption})`;
            datePicker_total_power_consumption.style.display = 'block'; // Show date picker if it was already visible
        } else if (selectedTime_total_power_consumption === 'set_date_total_power_consumption') {
           
            datePicker_total_power_consumption.style.display = 'block'; // Show date picker
        }
    }

    // Flatpickr for date range selection
    flatpickr("#dateRange_total_power_consumption", {
        mode: "range",
        dateFormat: "d/m/Y",
        onChange: function (dates) {
            // Store the selected date range
            selectedDates_total_power_consumption = dates;
        }
    });

    // Function to display the values when "Apply" is clicked
    applyButton_total_power_consumption.addEventListener('click', function () {
        if (selectedDates_total_power_consumption.length === 2) {
            const selectedLight_total_power_consumption = lightSelect_total_power_consumption.value;
            const randomValue_total_power_consumption = getRandomValue_total_power_consumption(50, 300); // Random values between 50 and 300 kWh
            const startDate_total_power_consumption = flatpickr.formatDate(selectedDates_total_power_consumption[0], "d/m/Y");
            const endDate_total_power_consumption = flatpickr.formatDate(selectedDates_total_power_consumption[1], "d/m/Y");

            // Display the Set Date Range values after clicking Apply
            valueDisplay_total_power_consumption.textContent = `${selectedLight_total_power_consumption.replace('_total_power_consumption', ' ')} - ${randomValue_total_power_consumption} kWh (from ${startDate_total_power_consumption} to ${endDate_total_power_consumption})`;
        }
    });

    // Update values when light or time selection changes
    lightSelect_total_power_consumption.addEventListener('change', updateValues_total_power_consumption);
    timeSelect_total_power_consumption.addEventListener('change', updateValues_total_power_consumption);

    // Initial update to set default values for "Today"
    updateValues_total_power_consumption();
});


// ******************* TOTAL POWER CONSUMPTION script end *******************
// ******************* three phase script start *******************
let isSetDateActive_threephase_device_graph = false;
let selectedStartDate_threephase_device_graph, selectedEndDate_threephase_device_graph;

// Initialize Flatpickr for date range selection
function formatDate_threephase_device_graph(date) {
    if (!date) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

document.addEventListener('DOMContentLoaded', function () {
    flatpickr("#dateRange_threephase_device_graph", {
        mode: "range",
        dateFormat: "d/m/Y",  // Format the date as DD/MM/YYYY
        onChange: function (selectedDates) {
            const startDate_ac_device_graph = selectedDates[0];
            const endDate_ac_device_graph = selectedDates[1];

            // Update the display of start and end dates
            document.getElementById('startDateDisplay_threephase_device_graph').innerText = `Start Date: ${formatDate_threephathreephase_device_graph(startDate_threephase_device_graph)}`;
            document.getElementById('endDateDisplay_threephase_device_graph').innerText = `End Date: ${formatDate_threephase_device_graph(endDate_threephase_device_graph)}`;
        }
    });
});

// Chart.js context for the graph
var ctx_threephase_device_graph = document.getElementById('myChart_threephase_device_graph').getContext('2d');
var chart_threephase_device_graph;


const blueRedGradient_threephase_device_graph = ctx_threephase_device_graph.createLinearGradient(0, 0, 0, 400);
blueRedGradient_threephase_device_graph.addColorStop(0, '#2959FF');
blueRedGradient_threephase_device_graph.addColorStop(1, '#9EB3FC');


var greenGradient_threephase_device_graph = ctx_threephase_device_graph.createLinearGradient(0, 0, 0, 200);
greenGradient_threephase_device_graph.addColorStop(0, '#23D900');
greenGradient_threephase_device_graph.addColorStop(1, '#23D400');

var staticDailyLabels = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

function generateDateRangeData_threephase_device_graph(startDate, endDate, graphType) {
    var labels = [];
    var data = [];

    // Check if the start and end date are the same
    if (startDate.toDateString() === endDate.toDateString()) {
        // If the same, generate 24-hour labels for that day
        labels = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`); // Corrected string interpolation
        data = Array.from({ length: 24 }, () => Math.floor(Math.random() * 100));  // Simulating 24-hour data
    } else {
        var currentDate = new Date(startDate);
        while (currentDate <= endDate) { // Fixed comparison to endDate
            labels.push(currentDate.toLocaleDateString('en-GB')); // Format as DD/MM/YYYY
            data.push(Math.floor(Math.random() * 100));  // Simulating daily data
            currentDate.setDate(currentDate.getDate() + 1);
        }
    }

    return { labels: labels, data: data };
}



// Updated function to calculate active and inactive time for set-date option
function updateGraph_threephase_device_graph(timeSelect, graphSelect, startDate, endDate) {
    var labels = [];
    var data = [];
    var yAxisLabel = '';
    var backgroundColor = '';

    if (graphSelect === 'power-consumption') {
        if (timeSelect === 'set-date' && startDate && endDate) {
            const dateRangeData = generateDateRangeData_threephase_device_graph(startDate, endDate, graphSelect);
            labels = dateRangeData.labels;
            data = dateRangeData.data;
        } else {
            labels = staticDailyLabels;
            data = [3, 7, 4, 8, 5, 9, 6, 10, 7, 11, 8, 12, 9, 13, 10, 14, 11, 15, 12, 16, 13, 17, 14, 18];
        }
        yAxisLabel = 'Power Consumption (Wh)';
        backgroundColor = blueRedGradient_threephase_device_graph;
    } else if (graphSelect === 'power-saving') {
        if (timeSelect === 'set-date' && startDate && endDate) {
            const dateRangeData = generateDateRangeData_threephase_device_graph(startDate, endDate, graphSelect);
            labels = dateRangeData.labels;
            data = dateRangeData.data;
        } else {
            labels = staticDailyLabels;
            data = [2, 5, 3, 6, 4, 7, 5, 8, 6, 9, 7, 10, 8, 11, 9, 12, 10, 13, 11, 14, 12, 15, 13, 16];
        }
        yAxisLabel = 'Power Consumption (Rupees)';
        backgroundColor = greenGradient_threephase_device_graph;
    } else if (graphSelect === 'active-run-time') {
        var activeTime = [20, 25, 30, 35, 40, 45, 50, 55, 60, 30, 25, 20, 15, 10, 5, 30, 35, 40, 45, 50, 55, 60, 20, 15];
        var inactiveTime = activeTime.map(active => 60 - active);
        labels = staticDailyLabels;
        yAxisLabel = 'Power Consumption (Minutes)';

        if (timeSelect === 'set-date' && startDate && endDate) {
            const dateRangeData = generateDateRangeData_threephase_device_graph(startDate, endDate, graphSelect);
            labels = dateRangeData.labels;
            activeTime = dateRangeData.data;

            // Prevent inactiveTime from being negative
            inactiveTime = activeTime.map(active => Math.max(60 - active, 0));
        }

        data = {
            datasets: [
                {
                    label: 'Active Time',
                    data: activeTime,
                    backgroundColor: '#2959FF',
                    borderColor: '#2959FF',
                    borderWidth: 1,
                    stack: 'stack1',
                    borderRadius: 50
                },
                {
                    label: 'Inactive Time',
                    data: inactiveTime,
                    backgroundColor: '#9EB3FC',
                    borderColor: '#9EB3FC',
                    borderWidth: 1,
                    stack: 'stack1',
                    borderRadius: 50
                }
            ]
        };
    }

    if (chart_threephase_device_graph) chart_threephase_device_graph.destroy();

    chart_threephase_device_graph = new Chart(ctx_threephase_device_graph, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: graphSelect === 'active-run-time' ? data.datasets : [{
                label: yAxisLabel,
                data: data,
                backgroundColor: backgroundColor,
                borderColor: backgroundColor,
                borderWidth: 1,
                borderRadius: 50
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: (timeSelect === 'daily' || (isSetDateActive_threephase_device_graph && selectedStartDate_threephase_device_graph && selectedEndDate_threephase_device_graph && selectedStartDate_threephase_device_graph.toDateString() !== selectedEndDate_threephase_device_graph.toDateString())) ? '(Dates)' : '(Hours)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: yAxisLabel
                    },
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    display: graphSelect === 'active-run-time'
                }
            }
        }
    });
}


document.getElementById('timeSelect_threephase_device_graph').addEventListener('change', function () {
    var selectedValue = this.value;
    var dateRangeContainer = document.getElementById('dateRangeContainer_threephase_device_graph');
    var dateDisplayDiv = document.getElementById('DateDisplay_css_threephase_device_graph_div');

    if (selectedValue === 'set-date') {
        isSetDateActive_threephase_device_graph = true;
        dateRangeContainer.style.display = 'block';  // Show date range selection
        dateDisplayDiv.style.display = 'flex';       // Show date display div
    } else {
        isSetDateActive_threephase_device_graph = false;
        dateRangeContainer.style.display = 'none';   // Hide date range selection
        dateDisplayDiv.style.display = 'none';       // Hide date display div
        updateGraph_threephase_device_graph(selectedValue, document.getElementById('graphSelect_threephase_device_graph').value);
    }
});


document.getElementById('graphSelect_threephase_device_graph').addEventListener('change', function () {
    if (isSetDateActive_threephase_device_graph) {
        updateGraph_threephase_device_graph('set-date', this.value, selectedStartDate_threephase_device_graph, selectedEndDate_threephase_device_graph);
    } else {
        updateGraph_threephase_device_graph(document.getElementById('timeSelect_threephase_device_graph').value, this.value);
    }
});

document.getElementById('applyDateRange_threephase_device_graph').addEventListener('click', function () {
    var dateRangePicker = document.getElementById('dateRange_threephase_device_graph')._flatpickr;
    selectedStartDate_threephase_device_graph = dateRangePicker.selectedDates[0];
    selectedEndDate_threephase_device_graph = dateRangePicker.selectedDates[1];

    // Update the display of start and end dates
    document.getElementById('startDateDisplay_threephase_device_graph').innerText = `Start Date: ${formatDate_threephase_device_graph(selectedStartDate_threephase_device_graph)}`;
    document.getElementById('endDateDisplay_threephase_device_graph').innerText = `End Date: ${formatDate_threephase_device_graph(selectedEndDate_threephase_device_graph)}`;

    updateGraph_threephase_device_graph('set-date', document.getElementById('graphSelect_threephase_device_graph').value, selectedStartDate_threephase_device_graph, selectedEndDate_threephase_device_graph);
});

// Initial graph load
updateGraph_threephase_device_graph('daily', 'power-consumption');


// ******************* three phase script end *******************
