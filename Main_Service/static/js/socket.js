    const socket = io("http://192.168.0.225:5000");
    socket.on('connect', () => {
    console.log('Connected to server');
});

let isSetDateActive_running_light_graph = false;
let selectedStartDate_running_light_graph, selectedEndDate_running_light_graph;
function formatDate_running_light_graph(date) {
    if (!date) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}
function resetWeekdays(daySelect) {
    // Code to reset weekdays to default (all days selected)
    daySelect.value = 'all'; // Adjust according to how weekdays are represented in your select element
}

function clearDates(dateRangeId, startDateId, endDateId) {
    var dateRange = document.getElementById(dateRangeId);
    var startDate = document.getElementById(startDateId); 
    var endDate = document.getElementById(endDateId); 
    if (startDate && endDate && dateRange) { 
        dateRange.value = '';
        startDate.innerText = ''; 
        endDate.innerText = ''; 
    }
}

// for Running Light
document.addEventListener('DOMContentLoaded', function () {
    flatpickr("#dateRange_running_light_graph", {
        mode: "range",
        dateFormat: "d/m/Y",
        onChange: function (selectedDates) {
            console.log("selected_dates:", selectedDates)
            const daySelect = document.getElementById('daySelect_running_light_graph').value; 
            console.log("daySelect:", daySelect)
            const startDate_running_light_graph = selectedDates[0];
            console.log("startDate_running_light_graph", startDate_running_light_graph)
            const endDate_running_light_graph = selectedDates[1];
            console.log("endDate_running_light_graph", endDate_running_light_graph)
            document.getElementById('startDateDisplay_running_light_graph').innerText = `Start Date: ${formatDate_running_light_graph(startDate_running_light_graph)}`;
            document.getElementById('endDateDisplay_running_light_graph').innerText = `End Date: ${formatDate_running_light_graph(endDate_running_light_graph)}`;
        }
    });
});

document.getElementById("timeSelect_running_light_graph").addEventListener('change', function () {
    var selectedValue = this.value;
    var dateRangeContainer = document.getElementById('dateRangeContainer_running_light_graph');
    var dateDisplayDiv = document.getElementById('DateDisplay_css_running_light_graph_div');
    var daySelect = document.getElementById('daySelect_running_light_graph');

    if (selectedValue === 'set-date-running') {
        running_light.isSetDateActive_running_light_graph = true;
        dateRangeContainer.style.display = 'block';
        dateDisplayDiv.style.display = 'flex';
        // Set Weekdays to default (all days selected)
        resetWeekdays(daySelect);
        clearDates('dateRange_running_light_graph', 'startDateDisplay_running_light_graph', 'endDateDisplay_running_light_graph');
    } else {
        running_light.isSetDateActive_running_light_graph = false;
        dateRangeContainer.style.display = 'none';
        dateDisplayDiv.style.display = 'none';

        var date_today = new Date();
        console.log("Selected day:", daySelect.value);
        socket.emit(running_light.topic, { 
            startDate: formatDateToISO(date_today), 
            endDate: formatDateToISO(date_today), 
            timeSelect: selectedValue, 
            graphSelect: document.getElementById('graphSelect_running_light_graph').value, 
            daySelect: daySelect.value
        });
    }
});


// For Office Light
document.addEventListener('DOMContentLoaded', function () {
    flatpickr("#dateRange_office_light_graph", {
        mode: "range",
        dateFormat: "d/m/Y",
        onChange: function (selectedDates) {
            console.log("selected_dates:", selectedDates)
            const daySelect = document.getElementById('daySelect_office_light_graph').value; 
            console.log("daySelect:", daySelect)
            const startDate_office_light_graph = selectedDates[0];
            console.log("startDate_office_light_graph", startDate_office_light_graph)
            const endDate_office_light_graph = selectedDates[1];
            console.log("endDate_office_light_graph", endDate_office_light_graph)
            document.getElementById('startDateDisplay_office_light_graph').innerText = `Start Date: ${formatDate_running_light_graph(startDate_office_light_graph)}`;
            document.getElementById('endDateDisplay_office_light_graph').innerText = `End Date: ${formatDate_running_light_graph(endDate_office_light_graph)}`;
        }
    });
});

document.getElementById("timeSelect_office_light_graph").addEventListener('change', function () {
    var selectedValue = this.value;
    var dateRangeContainer = document.getElementById('dateRangeContainer_office_light_graph');
    var dateDisplayDiv = document.getElementById('DateDisplay_css_office_light_graph_div');
    var daySelect = document.getElementById('daySelect_office_light_graph');

    if (selectedValue === 'set-date') {
        office_light.isSetDateActive_office_light_graph = true;
        dateRangeContainer.style.display = 'block';
        dateDisplayDiv.style.display = 'flex';
        // Set Weekdays to default (all days selected)
        resetWeekdays(daySelect);
        clearDates('dateRange_office_light_graph', 'startDateDisplay_office_light_graph', 'endDateDisplay_office_light_graph');
    } else {
        office_light.isSetDateActive_office_light_graph = false;
        dateRangeContainer.style.display = 'none';
        dateDisplayDiv.style.display = 'none';

        var date_today = new Date();
        console.log("Selected day:", daySelect.value);
        socket.emit(office_light.topic, { 
            startDate: formatDateToISO(date_today), 
            endDate: formatDateToISO(date_today), 
            timeSelect: selectedValue, 
            graphSelect: document.getElementById('graphSelect_office_light_graph').value, 
            daySelect: daySelect.value 
        });
    }
});



// For HiBay Light

document.addEventListener('DOMContentLoaded', function () {
    flatpickr("#dateRange_hibay_light_graph", {
        mode: "range",
        dateFormat: "d/m/Y",
        onChange: function (selectedDates) {
            console.log("selected_dates:", selectedDates)
            const daySelect = document.getElementById('daySelect_hibay_light_graph').value; 
            console.log("daySelect:", daySelect)
            const startDate_hibay_light_graph = selectedDates[0];
            console.log("startDate_hibay_light_graph", startDate_hibay_light_graph)
            const endDate_hibay_light_graph = selectedDates[1];
            console.log("endDate_hibay_light_graph", endDate_hibay_light_graph)
            document.getElementById('startDateDisplay_hibay_light_graph').innerText = `Start Date: ${formatDate_running_light_graph(startDate_hibay_light_graph)}`;
            document.getElementById('endDateDisplay_hibay_light_graph').innerText = `End Date: ${formatDate_running_light_graph(endDate_hibay_light_graph)}`;
        }
    });
});

document.getElementById("timeSelect_hibay_light_graph").addEventListener('change', function () {
    var selectedValue = this.value;
    var dateRangeContainer = document.getElementById('dateRangeContainer_hibay_light_graph');
    var dateDisplayDiv = document.getElementById('DateDisplay_css_hibay_light_graph_div');
    var daySelect = document.getElementById('daySelect_hibay_light_graph');

    if (selectedValue === 'set-date') {
        hibay_light.isSetDateActive_hibay_light_graph = true;
        dateRangeContainer.style.display = 'block';
        dateDisplayDiv.style.display = 'flex';
        // Set Weekdays to default (all days selected)
        resetWeekdays(daySelect);
        clearDates('dateRange_hibay_light_graph', 'startDateDisplay_hibay_light_graph', 'endDateDisplay_hibay_light_graph');
    } else {
        hibay_light.isSetDateActive_hibay_light_graph = false;
        dateRangeContainer.style.display = 'none';
        dateDisplayDiv.style.display = 'none';

        var date_today = new Date();
        console.log("Selected day:", daySelect.value);
        socket.emit(hibay_light.topic, { 
            startDate: formatDateToISO(date_today), 
            endDate: formatDateToISO(date_today), 
            timeSelect: selectedValue, 
            graphSelect: document.getElementById('graphSelect_hibay_light_graph').value,
            daySelect: daySelect.value 
        });
    }
});


// For All Device Power Consumption

document.addEventListener('DOMContentLoaded', function () {
    flatpickr("#dateRange_all_device_power_consumption_graph", {
        mode: "range",
        dateFormat: "d/m/Y",
        onChange: function (selectedDates) {
            console.log("selected_dates:", selectedDates)
            const daySelect = document.getElementById('daySelect_all_light_graph').value; 
            console.log("daySelect:", daySelect)
            const startDate_all_device_power_consumption_graph = selectedDates[0];
            console.log("startDate_all_device_power_consumption_graph", startDate_all_device_power_consumption_graph)
            const endDate_all_device_power_consumption_graph = selectedDates[1];
            console.log("endDate_all_device_power_consumption_graph", endDate_all_device_power_consumption_graph)
            document.getElementById('startDateDisplay_all_device_power_consumption_graph').innerText = `Start Date: ${formatDate_running_light_graph(startDate_all_device_power_consumption_graph)}`;
            document.getElementById('endDateDisplay_all_device_power_consumption_graph').innerText = `End Date: ${formatDate_running_light_graph(endDate_all_device_power_consumption_graph)}`;
        }
    });
});

document.getElementById("timeSelect_all_device_power_consumption_graph").addEventListener('change', function () {
    var selectedValue = this.value;
    var dateRangeContainer = document.getElementById('dateRangeContainer_all_device_power_consumption_graph');
    var dateDisplayDiv = document.getElementById('DateDisplay_css_all_device_power_consumption_graph_div');
    var daySelect = document.getElementById('daySelect_all_light_graph');

    if (selectedValue === 'set-date') {
        console.log('Set date selected');
        all_device_power_consumption.isSetDateActive_all_device_power_consumption_graph = true;
        dateRangeContainer.style.display = 'block';
        dateDisplayDiv.style.display = 'flex';
        resetWeekdays(daySelect);
        clearDates('dateRange_all_device_power_consumption_graph', 'startDateDisplay_all_device_power_consumption_graph', 'endDateDisplay_all_device_power_consumption_graph');
    } else {
        console.log('Other option selected');
        all_device_power_consumption.isSetDateActive_all_device_power_consumption_graph = false;
        dateRangeContainer.style.display = 'none';
        dateDisplayDiv.style.display = 'none';
        
        var date_today = new Date();
        console.log("Selected day:", daySelect.value);
        socket.emit(all_device_power_consumption.topic, { 
            startDate: formatDateToISO(date_today), 
            endDate: formatDateToISO(date_today), 
            timeSelect: selectedValue, 
            graphSelect: document.getElementById('graphSelect_all_device_power_consumption_graph').value, 
            daySelect: daySelect.value 
        });
    }
    
});



// For AC Device Power Consumption

document.addEventListener('DOMContentLoaded', function () {
    flatpickr("#dateRange_ac_device_graph", {
        mode: "range",
        dateFormat: "d/m/Y",
        onChange: function (selectedDates) {
            console.log("selected_dates:", selectedDates)
            const daySelect = document.getElementById('daySelect_ac_light_graph').value; 
            console.log("daySelect:", daySelect)
            const startDate_ac_device_graph = selectedDates[0];
            console.log("startDate_ac_device_graph", startDate_ac_device_graph)
            const endDate_ac_device_graph = selectedDates[1];
            console.log("endDate_ac_device_graph", endDate_ac_device_graph)
            document.getElementById('startDateDisplay_ac_device_graph').innerText = `Start Date: ${formatDate_running_light_graph(startDate_ac_device_graph)}`;
            document.getElementById('endDateDisplay_ac_device_graph').innerText = `End Date: ${formatDate_running_light_graph(endDate_ac_device_graph)}`;
        }
    });
});

document.getElementById("timeSelect_ac_device_graph").addEventListener('change', function () {
    var selectedValue = this.value;
    var dateRangeContainer = document.getElementById('dateRangeContainer_ac_device_graph');
    var dateDisplayDiv = document.getElementById('DateDisplay_css_ac_device_graph_div');
    var daySelect = document.getElementById('daySelect_ac_light_graph');

    if (selectedValue === 'set-date') {
        airconditioner.isSetDateActive_ac_device_graph = true;
        dateRangeContainer.style.display = 'block';
        dateDisplayDiv.style.display = 'flex';
        // Set Weekdays to default (all days selected)
        resetWeekdays(daySelect);
        clearDates('dateRange_ac_device_graph', 'startDateDisplay_ac_device_graph', 'endDateDisplay_ac_device_graph');
    } else {
        airconditioner.isSetDateActive_ac_device_graph = false;
        dateRangeContainer.style.display = 'none';
        dateDisplayDiv.style.display = 'none';

        var date_today = new Date();
        console.log("Selected day:", daySelect.value);
        socket.emit(airconditioner.topic, { 
            startDate: formatDateToISO(date_today), 
            endDate: formatDateToISO(date_today), 
            timeSelect: selectedValue, 
            graphSelect: document.getElementById('graphSelect_ac_device_graph').value, 
            daySelect: daySelect.value 
        });
    }
});


// For OEE Device Power Consumption

document.addEventListener('DOMContentLoaded', function () {
    flatpickr("#dateRange_machine_oee_stats", {
        mode: "range",
        dateFormat: "d/m/Y",
        onChange: function (selectedDates) {
            console.log("selected_dates:", selectedDates)
            const daySelect = document.getElementById('daySelect_oee_light_graph').value; 
            console.log("daySelect:", daySelect)
            const startDate_machine_oee_stats = selectedDates[0];
            console.log("startDate_machine_oee_stats", startDate_machine_oee_stats)
            const endDate_machine_oee_stats = selectedDates[1];
            console.log("endDate_machine_oee_stats", endDate_machine_oee_stats)
            document.getElementById('startDateDisplay_machine_oee_stats').innerText = `Start Date: ${formatDate_running_light_graph(startDate_machine_oee_stats)}`;
            document.getElementById('endDateDisplay_machine_oee_stats').innerText = `End Date: ${formatDate_running_light_graph(endDate_machine_oee_stats)}`;
        }
    });
});

document.getElementById("timeSelect_machine_oee_stats").addEventListener('change', function () {
    var selectedValue = this.value;
    var dateRangeContainer = document.getElementById('dateRangeContainer_machine_oee_stats');
    var dateDisplayDiv = document.getElementById('DateDisplay_css_machine_oee_stats_div');
    var daySelect = document.getElementById('daySelect_oee_light_graph');

    if (selectedValue === 'set-date') {
        oee.isSetDateActive_oee_stats = true;
        dateRangeContainer.style.display = 'block';
        dateDisplayDiv.style.display = 'flex';
        // Set Weekdays to default (all days selected)
        resetWeekdays(daySelect);
        clearDates('dateRange_machine_oee_stats', 'startDateDisplay_machine_oee_stats', 'endDateDisplay_machine_oee_stats');
    } else {
        oee.isSetDateActive_oee_stats = false;
        dateRangeContainer.style.display = 'none';
        dateDisplayDiv.style.display = 'none';

        var date_today = new Date();
        console.log("Selected day:", daySelect.value);
        socket.emit(oee.topic, { 
            startDate: formatDateToISO(date_today), 
            endDate: formatDateToISO(date_today), 
            timeSelect: selectedValue, 
            graphSelect: document.getElementById('graphSelect_machine_oee_stats').value, 
            daySelect: daySelect.value 
        });
    }
});


// For 3 Phase Meter Device Power Consumption

document.addEventListener('DOMContentLoaded', function () {
    flatpickr("#dateRange_threephase_device_graph", {
        mode: "range",
        dateFormat: "d/m/Y",
        onChange: function (selectedDates) {
            console.log("selected_dates:", selectedDates)
            const daySelect = document.getElementById('daySelect_threephase_light_graph').value; 
            console.log("daySelect:", daySelect)
            const startDate_threephase_device_graph = selectedDates[0];
            console.log("startDate_threephase_device_graph", startDate_threephase_device_graph)
            const endDate_threephase_device_graph = selectedDates[1];
            console.log("endDate_threephase_device_graph", endDate_threephase_device_graph)
            document.getElementById('startDateDisplay_threephase_device_graph').innerText = `Start Date: ${formatDate_running_light_graph(startDate_threephase_device_graph)}`;
            document.getElementById('endDateDisplay_threephase_device_graph').innerText = `End Date: ${formatDate_running_light_graph(endDate_threephase_device_graph)}`;
        }
    });
});

document.getElementById("timeSelect_threephase_device_graph").addEventListener('change', function () {
    var selectedValue = this.value;
    var dateRangeContainer = document.getElementById('dateRangeContainer_threephase_device_graph');
    var dateDisplayDiv = document.getElementById('DateDisplay_css_threephase_device_graph_div');
    var daySelect = document.getElementById('daySelect_threephase_light_graph');

    if (selectedValue === 'set-date') {
        threephase.isSetDateActive_threephase_device_graph = true;
        dateRangeContainer.style.display = 'block';
        dateDisplayDiv.style.display = 'flex';
        // Set Weekdays to default (all days selected)
        resetWeekdays(daySelect);
        clearDates('dateRange_threephase_device_graph', 'startDateDisplay_threephase_device_graph', 'endDateDisplay_threephase_device_graph');
    } else {
        threephase.isSetDateActive_threephase_device_graph = false;
        dateRangeContainer.style.display = 'none';
        dateDisplayDiv.style.display = 'none';

        var date_today = new Date();
        console.log("Selected day:", daySelect.value);
        socket.emit(threephase.topic, { 
            startDate: formatDateToISO(date_today), 
            endDate: formatDateToISO(date_today), 
            timeSelect: selectedValue, 
            graphSelect: document.getElementById('graphSelect_threephase_device_graph').value, 
            daySelect: daySelect.value 
        });
    }
});


function formatDateToISO(date) {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}


import { graph_name } from "./test_amit.js";

let running_light = new graph_name("myChart_running_light_graph", "graphSelect_running_light_graph", 'timeSelect_running_light_graph', 'running_light_graph_data', "running_light_graph_data_response", 'applyDateRange_running_light_graph', "dateRange_running_light_graph",'daySelect_running_light_graph');
// let OEE = new graph_name("myChart_machine_oee_stats");
let office_light = new graph_name("myChart_office_light_graph", "graphSelect_office_light_graph", "timeSelect_office_light_graph", "office_light_graph_data", "office_light_graph_data_response", 'applyDateRange_office_light_graph', "dateRange_office_light_graph", 'daySelect_office_light_graph');
let hibay_light = new graph_name("myChart_hibay_light_graph", "graphSelect_hibay_light_graph", "timeSelect_hibay_light_graph", "highbay_light_graph_data", "highbay_light_graph_data_response", 'applyDateRange_hibay_light_graph', "dateRange_hibay_light_graph", 'daySelect_hibay_light_graph');
let all_device_power_consumption = new graph_name("myChart_all_device_power_consumption_graph", "graphSelect_all_device_power_consumption_graph", "timeSelect_all_device_power_consumption_graph", "all_device_power_consumption_graph_data", "all_device_power_consumption_graph_data_response", 'applyDateRange_all_device_power_consumption_graph', "dateRange_all_device_power_consumption_graph", 'daySelect_all_light_graph');
let airconditioner = new graph_name("myChart_ac_device_graph", "graphSelect_ac_device_graph", "timeSelect_ac_device_graph", "ac_power_consumption_graph_data", "ac_power_consumption_graph_data_response", 'applyDateRange_ac_device_graph', "dateRange_ac_device_graph", 'daySelect_ac_light_graph');
let oee = new graph_name("myChart_machine_oee_stats", "graphSelect_machine_oee_stats", "timeSelect_machine_oee_stats", "oee_stats_graph_data", "oee_stats_graph_data_response", 'applyDateRange_machine_oee_stats', "dateRange_machine_oee_stats", 'daySelect_oee_light_graph');
let threephase = new graph_name("myChart_threephase_device_graph", "graphSelect_threephase_device_graph", "timeSelect_threephase_device_graph", "threephase_power_consumption_graph_data", "threephase_power_consumption_graph_data_response", 'applyDateRange_threephase_device_graph', "dateRange_threephase_device_graph", 'daySelect_threephase_light_graph');
// let total_power = new graph_name("myChart_total_power_stats", "lightSelect_total_power_consumption","timeSelect_total_power_stats" , "total_power_consumption", "total_power_consumption_response",'applyDateRange_total_power_stats',"dateRange_total_power_stats");

function graph_change(Object, name) {
    var powerValues = [];
    var yAxisLabel;
    var backgroundColor;
    var staticDailyLabels;
    try {
        // var val1 = Object.power_consumption[0].hour
        // console.log(val1.length)
        if ((Object.power_consumption[0].hour + 1) && document.getElementById(name).value == 'power-consumption') {
            console.log("this got executed")
            staticDailyLabels = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
            Object.power_consumption.forEach(item => {
                powerValues[item.hour] = item.power_consumption;
            });
            yAxisLabel = "Power Consumption (Wh)";
            backgroundColor = "blue";

        }
        else if ((Object.power_consumption[0].date) && document.getElementById(name).value == 'power-consumption') {
            console.log("camer here")
            staticDailyLabels = Object.power_consumption.map(item => item.date);
            powerValues = Object.power_consumption.map(item => item.power_consumption);
            yAxisLabel = "Power Consumption (Wh)";
            backgroundColor = "blue";
        }
        else if ((Object.power_consumption[0].hour + 1) && document.getElementById(name).value == 'power-saving') {
            Object.power_consumption.forEach(item => {
                powerValues[item.hour] = item.power_saving;
            });
            staticDailyLabels = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
            yAxisLabel = "Power Savings (Wh)";
            backgroundColor = "green";
        }
        else if ((Object.power_consumption[0].date) && document.getElementById(name).value == 'power-saving') {
            console.log("came in power saving date")
            staticDailyLabels = Object.power_consumption.map(item => item.date);
            powerValues = Object.power_consumption.map(item => item.power_saving);
            yAxisLabel = "Power Savings (Wh)";
            backgroundColor = "green";
        }
        else if ((Object.power_consumption[0].date) && document.getElementById(name).value == 'active-run-time') {
            console.log("came to Active Run Time")
            staticDailyLabels = Object.power_consumption.map(item => item.date);
            try {
                
                if (Object.power_consumption[0].active_run_time_in_sec) {
                    // powerValues = Object.power_consumption.map(item => Math.floor((Number(item.active_run_time_in_sec) % 3600) / 60));
                    powerValues = Object.power_consumption.map(item => item.active_run_time_in_min_accurate)
                    console.log("came inside if of date before",powerValues)
                }
                else {
                    powerValues = Object.power_consumption.map(item => item.active_run_time);
                    console.log("came inside if of date after",powerValues)
                }
            }
            catch {

            }
            yAxisLabel = "Time";
            backgroundColor = "blue";
        }
        else if ((Object.power_consumption[0].hour + 1) && document.getElementById(name).value == 'active-run-time') {
            console.log("came to Active Run Time")
            staticDailyLabels = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
           
            try {

                if (Object.power_consumption[0].active_run_time_in_sec) {
                    Object.power_consumption.forEach(item => {
                        // powerValues[item.hour] = Math.floor((Number(item.active_run_time_in_sec) % 3600) / 60);
                       
                        powerValues[item.hour]=item.active_run_time_in_min_accurate;
                    });
                    console.log("came inside if",powerValues[item.hour])
                }
                else {
                    Object.power_consumption.forEach(item => {
                        powerValues[item.hour] = item.active_run_time;
                    });
                }

            }
            catch {
                console.log("came to catch")
                Object.power_consumption.forEach(item => {
                    // powerValues[item.hour] = item.active_run_time;
                    powerValues[item.hour]=item.active_run_time_in_min_accurate;

                });
            }

            yAxisLabel = "Time";
            backgroundColor = "blue";
        }
        //active_run_time_in_sec


        else {
            staticDailyLabels = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
            powerValues = new Array(24).fill(0);
            yAxisLabel = "Power Consumption (Wh)";
            backgroundColor = "blue";
        }
        var labels = staticDailyLabels;
        var data = powerValues;
        Object.createChart(labels, data, yAxisLabel = yAxisLabel, backgroundColor);
    }
    catch {
        staticDailyLabels = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
        powerValues = new Array(24).fill(0);
        yAxisLabel = "Power Consumption (Wh)";
        backgroundColor = "blue";
        var labels = staticDailyLabels;
        var data = powerValues;
        Object.createChart(labels, data, yAxisLabel = yAxisLabel, backgroundColor);

    }
}

document.getElementById(running_light.graph_name).addEventListener('change', function () {
    graph_change(running_light, running_light.graph_name)
});

document.getElementById(office_light.graph_name).addEventListener('change', function () {
    graph_change(office_light, office_light.graph_name)
});
document.getElementById(hibay_light.graph_name).addEventListener('change', function () {
    graph_change(hibay_light, hibay_light.graph_name)
});
document.getElementById(all_device_power_consumption.graph_name).addEventListener('change', function () {
    graph_change(all_device_power_consumption, all_device_power_consumption.graph_name)
});

document.getElementById(airconditioner.graph_name).addEventListener('change', function () {
    graph_change(all_device_power_consumption, all_device_power_consumption.graph_name)
});

document.getElementById(oee.graph_name).addEventListener('change', function () {
    graph_change(oee, oee.graph_name)
});

document.getElementById(threephase.graph_name).addEventListener('change', function () {
    graph_change(threephase, threephase.graph_name)
});


//Special for total power
document.getElementById('lightSelect_total_power_consumption').addEventListener('change', function () {
    if (tota_power_date_flag == true) {
        socket.emit("total_power_consumption", { startDate: formatDateToISO(startDate_power_consumption), endDate: formatDateToISO(endDate_power_consumption), timeSelect: document.getElementById("timeSelect_total_power_consumption").value, graphSelect: document.getElementById("lightSelect_total_power_consumption").value });
    }
    else {
        socket.emit("total_power_consumption", { startDate: formatDateToISO(date_today), endDate: formatDateToISO(date_today), timeSelect: document.getElementById("timeSelect_total_power_consumption").value, graphSelect: document.getElementById("lightSelect_total_power_consumption").value });
    }

});

//Special for total power savings
document.getElementById('lightSelect_total_saving_values').addEventListener('change', function () {
    if (tota_power_savings_date_flag == true) {
        socket.emit("total_power_savings", { startDate: formatDateToISO(startDate_power_savings), endDate: formatDateToISO(endDate_power_savings), timeSelect: document.getElementById("timeSelect_total_saving_values").value, graphSelect: document.getElementById("lightSelect_total_saving_values").value });
    }
    else {
        socket.emit("total_power_savings", { startDate: formatDateToISO(date_today), endDate: formatDateToISO(date_today), timeSelect: document.getElementById("timeSelect_total_saving_values").value, graphSelect: document.getElementById("lightSelect_total_saving_values").value });
    }

});

// Function to update the graph
function updateGraph(device, dateRangePickerId, daySelectId) {
    const dateRangePicker = document.getElementById(dateRangePickerId)._flatpickr;
    const start_date = formatDateToISO(dateRangePicker.selectedDates[0]);
    const end_date = formatDateToISO(dateRangePicker.selectedDates[1]);
    const daySelect = document.getElementById(daySelectId).value;

    console.log(`Device: ${device}, Start Date: ${start_date}, End Date: ${end_date}, Selected Day: ${daySelect}`);

    socket.emit(device.topic, {
        startDate: start_date,
        endDate: end_date,
        timeSelect: document.getElementById(device.time_select).value,
        graphSelect: document.getElementById(device.graph_name).value,
        daySelect: daySelect
    });
}


// Attach event listeners for "Apply" buttons
document.getElementById("applyDateRange_running_light_graph").addEventListener('click', function () {
    updateGraph(running_light, "dateRange_running_light_graph", "daySelect_running_light_graph");
});

document.getElementById("applyDateRange_office_light_graph").addEventListener('click', function () {
    updateGraph(office_light, "dateRange_office_light_graph", "daySelect_office_light_graph");
});

document.getElementById("applyDateRange_hibay_light_graph").addEventListener('click', function () {
    updateGraph(hibay_light, "dateRange_hibay_light_graph", "daySelect_hibay_light_graph");
});

document.getElementById("applyDateRange_all_device_power_consumption_graph").addEventListener('click', function () {
    updateGraph(all_device_power_consumption, "dateRange_all_device_power_consumption_graph", "daySelect_all_light_graph");
});

document.getElementById("applyDateRange_ac_device_graph").addEventListener('click', function () {
    updateGraph(airconditioner, "dateRange_ac_device_graph", "daySelect_ac_light_graph");
});

document.getElementById("applyDateRange_machine_oee_stats").addEventListener('click', function () {
    updateGraph(oee, "dateRange_machine_oee_stats", "daySelect_oee_light_graph");
});

document.getElementById("applyDateRange_threephase_device_graph").addEventListener('click', function () {
    updateGraph(threephase, "dateRange_threephase_device_graph", "daySelect_threephase_light_graph");
});

// Attach event listeners for dropdown changes
document.getElementById("daySelect_running_light_graph").addEventListener('change', function () {
    updateGraph(running_light, "dateRange_running_light_graph", "daySelect_running_light_graph");
});

document.getElementById("daySelect_office_light_graph").addEventListener('change', function () {
    updateGraph(office_light, "dateRange_office_light_graph", "daySelect_office_light_graph");
});

document.getElementById("daySelect_hibay_light_graph").addEventListener('change', function () {
    updateGraph(hibay_light, "dateRange_hibay_light_graph", "daySelect_hibay_light_graph");
});

document.getElementById("daySelect_all_light_graph").addEventListener('change', function () {
    updateGraph(all_device_power_consumption, "dateRange_all_device_power_consumption_graph", "daySelect_all_light_graph");
});

document.getElementById("daySelect_ac_light_graph").addEventListener('change', function () {
    updateGraph(airconditioner, "dateRange_ac_device_graph", "daySelect_ac_light_graph");
});

document.getElementById("daySelect_oee_light_graph").addEventListener('change', function () {
    updateGraph(oee, "dateRange_machine_oee_stats", "daySelect_oee_light_graph");
});

document.getElementById("daySelect_threephase_light_graph").addEventListener('change', function () {
    updateGraph(threephase, "dateRange_threephase_device_graph", "daySelect_threephase_light_graph");
});



function formatPower(value) {
    return value < 1000
        ? `${value.toFixed(2)} Wh`
        : `${(value / 1000).toFixed(2)} kWh`;
}

socket.onAny((event, ...args) => {
    // console.log(event)
    if (event == 'power_consumption_data') {
        var data1 = args[0];
        const powerValues = Array(24).fill(0);
        data1.forEach(item => {
            powerValues[item.hour] = item.power;
        });
        var labels = staticDailyLabels;
        var data = powerValues;
        running_light.createChart(labels, data);
    }
    else if (event == running_light.response_topic) {
        console.log("New Response", args[0]);
        var data = args[0];
        running_light.power_consumption = data
        console.log("ANJALI===========",data)
        try {
            const totalPowerSavings = data.reduce((total, entry) => total + Number(entry.power_saving), 0);
            document.getElementById('active_tube').innerText = formatPower(totalPowerSavings);
            console.log("Total Power Savings :", totalPowerSavings);
            const totalPowerConsumption = data.reduce((total, entry) => total + Number(entry.power_consumption), 0);
            document.getElementById('result1').innerText = formatPower(totalPowerConsumption);

        }
        catch (error) {
            console.error("Error processing", error);
        }
        graph_change(running_light, running_light.graph_name)
    }
    else if (event == office_light.response_topic) {
        console.log("New Response", args[0]);
        var data = args[0];
        office_light.power_consumption = data
        try {

            const totalPowerSavings = data.reduce((total, entry) => total + Number(entry.power_saving), 0);
            const totalPowerConsumption = data.reduce((total, entry) => total + Number(entry.power_consumption), 0);
            document.getElementById('active_office').innerText = formatPower(totalPowerSavings);
            document.getElementById('result4').innerText = formatPower(totalPowerConsumption);

        }
        catch (error) {
            console.error("Error processing", error);
        }
        graph_change(office_light, office_light.graph_name)
    }
    else if (event == hibay_light.response_topic) {
        console.log("New Response", args[0]);
        var data = args[0];
        hibay_light.power_consumption = data
        try {

            const totalPowerSavings = data.reduce((total, entry) => total + Number(entry.power_saving), 0);
            const totalPowerConsumption = data.reduce((total, entry) => total + Number(entry.power_consumption), 0);
            document.getElementById('active_hibay').innerText = formatPower(totalPowerSavings);
            document.getElementById('result3').innerText = formatPower(totalPowerConsumption);

        }
        catch (error) {
            console.error("Error processing", error);

        }
        graph_change(hibay_light, hibay_light.graph_name)
    }
    else if (event == all_device_power_consumption.response_topic) {
        console.log("New Response", args[0]);
        var data = args[0];
        all_device_power_consumption.power_consumption = data
        graph_change(all_device_power_consumption, all_device_power_consumption.graph_name)
    }
    else if (event == airconditioner.response_topic) {
        console.log("New Response", args[0]);
        var data = args[0];
        airconditioner.power_consumption = data
        try {

            const totalPowerConsumption = data.reduce((total, entry) => total + Number(entry.power_consumption), 0);
            document.getElementById('result').innerText = formatPower(totalPowerConsumption);

        }
        catch (error) {
            console.error("Error processing", error);
        }

        graph_change(airconditioner, airconditioner.graph_name)
    }
    else if (event == oee.response_topic) {
        console.log("New Response", args[0]);
        var data = args[0];
        oee.power_consumption = data
        try {
            var sec = convertSeconds(data.reduce((total, entry) => total + Number(entry.active_run_time_in_sec), 0))
            var idle = convertSeconds(data.reduce((total, entry) => total + Number(entry.idle_time_in_sec), 0))

            document.getElementById('active').innerText = " " + String(sec.hours) + " Hours " + String(sec.minutes) + " Minutes " + String(sec.seconds) + " Seconds ";
            document.getElementById('ideal').innerText = " " + String(idle.hours) + " Hours " + String(idle.minutes) + " Minutes " + String(idle.seconds) + " Seconds ";
        }
        catch (error) {
            console.error("Error processing", error);
        }
        graph_change(oee, oee.graph_name)
    }
    else if (event == threephase.response_topic) {
        console.log("New Response", args[0]);
        var data = args[0];
        threephase.power_consumption = data
        try {

            const totalPowerConsumption = data.reduce((total, entry) => total + Number(entry.power_consumption), 0);
            document.getElementById('threephase').innerText = formatPower(totalPowerConsumption);

        }
        catch (error) {
            console.error("Error processing", error);
        }

        graph_change(threephase, threephase.graph_name)
    }

    else if (event == "total_power_consumption_data_response") {
        console.log("Total Power Consumption Data", args[0]);
        var data = args[0];
        try {
            const totalPowerConsumption = data.reduce((total, entry) => total + Number(entry.power_consumption), 0);
            document.getElementById('valueDisplay_total_power_consumption').innerText = ` ${formatPower(totalPowerConsumption)}`;
        }
        catch (error) {
            console.error("Error processing", error);
        }
        // graph_change(oee,oee.graph_name)
    }

    else if (event == "total_power_saving_data_response") {
        console.log("total_power_saving_data_response", args[0]);
        var data = args[0];
        try {
            const totalPowerSavings = data.reduce((total, entry) => total + Number(entry.power_saving), 0);
            const displayValue = totalPowerSavings / 1000 * 15;
            document.getElementById('saving').innerText = " Rs. " + displayValue.toFixed(2) + "/-";
        }
        catch (error) {
            console.error("Error processing", error);
        }
        // graph_change(oee,oee.graph_name)
    }
});

var date_today = new Date()
socket.emit(running_light.topic, { startDate: formatDateToISO(date_today), endDate: formatDateToISO(date_today), timeSelect: document.getElementById(running_light.time_select).value, graphSelect: document.getElementById(running_light.graph_name).value , daySelect: document.getElementById('daySelect_running_light_graph').value});
socket.emit(office_light.topic, { startDate: formatDateToISO(date_today), endDate: formatDateToISO(date_today), timeSelect: document.getElementById(office_light.time_select).value, graphSelect: document.getElementById(office_light.graph_name).value, daySelect: document.getElementById('daySelect_office_light_graph').value });
socket.emit(hibay_light.topic, { startDate: formatDateToISO(date_today), endDate: formatDateToISO(date_today), timeSelect: document.getElementById(hibay_light.time_select).value, graphSelect: document.getElementById(hibay_light.graph_name).value, daySelect: document.getElementById('daySelect_hibay_light_graph').value });
socket.emit(airconditioner.topic, { startDate: formatDateToISO(date_today), endDate: formatDateToISO(date_today), timeSelect: document.getElementById(airconditioner.time_select).value, graphSelect: document.getElementById(airconditioner.graph_name).value, daySelect: document.getElementById('daySelect_ac_light_graph').value });
socket.emit(all_device_power_consumption.topic, { startDate: formatDateToISO(date_today), endDate: formatDateToISO(date_today), timeSelect: document.getElementById(all_device_power_consumption.time_select).value, graphSelect: document.getElementById(all_device_power_consumption.graph_name).value, daySelect: document.getElementById('daySelect_all_light_graph').value });
socket.emit(oee.topic, { startDate: formatDateToISO(date_today), endDate: formatDateToISO(date_today), timeSelect: document.getElementById(oee.time_select).value, graphSelect: document.getElementById(oee.graph_name).value, daySelect: document.getElementById('daySelect_oee_light_graph').value });
socket.emit(threephase.topic, { startDate: formatDateToISO(date_today), endDate: formatDateToISO(date_today), timeSelect: document.getElementById(threephase.time_select).value, graphSelect: document.getElementById(threephase.graph_name).value, daySelect: document.getElementById('daySelect_threephase_light_graph').value });
socket.emit("total_power_consumption", { startDate: formatDateToISO(date_today), endDate: formatDateToISO(date_today), timeSelect: document.getElementById("timeSelect_total_power_consumption").value, graphSelect: document.getElementById("lightSelect_total_power_consumption").value });
socket.emit("total_power_savings", { startDate: formatDateToISO(date_today), endDate: formatDateToISO(date_today), timeSelect: document.getElementById("timeSelect_total_saving_values").value, graphSelect: document.getElementById("lightSelect_total_saving_values").value });

function convertSeconds(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    return {
        hours: hours,
        minutes: minutes,
        seconds: remainingSeconds
    };
}

// **********Total power consumption start**************
var startDate_power_consumption = null;
var endDate_power_consumption = null;
var tota_power_date_flag = false;
document.addEventListener('DOMContentLoaded', function () {
    // Initialize the date picker with Flatpickr
    flatpickr("#dateRange_total_power_consumption", {
        mode: "range",
        dateFormat: "d/m/Y",  // Adjust the date format here
        onChange: function (selectedDates, dateStr, instance) {
            // Triggered after selecting the date range
            startDate_power_consumption = selectedDates[0];
            endDate_power_consumption = selectedDates[1];
        }
    });

    // Toggle visibility of the date picker based on dropdown selection
    document.getElementById('timeSelect_total_power_consumption').addEventListener('change', function () {
        const datePicker = document.getElementById('datePicker_total_power_consumption');
        if (this.value === 'set_date_total_power_consumption') {
            datePicker.style.display = 'block';
            tota_power_date_flag = true;
        } else {
            tota_power_date_flag = false;
            datePicker.style.display = 'none';
            socket.emit("total_power_consumption", { startDate: formatDateToISO(date_today), endDate: formatDateToISO(date_today), timeSelect: document.getElementById("timeSelect_total_power_consumption").value, graphSelect: document.getElementById("lightSelect_total_power_consumption").value });
        }
    });

    // Handle Apply button click
    document.getElementById('applyButton_total_power_consumption').addEventListener('click', function () {
        socket.emit("total_power_consumption", { startDate: formatDateToISO(startDate_power_consumption), endDate: formatDateToISO(endDate_power_consumption), timeSelect: document.getElementById("timeSelect_total_power_consumption").value, graphSelect: document.getElementById("lightSelect_total_power_consumption").value });
    });
});

// **********Total power consumption end**************



// **********Total saving start**************

var startDate_power_savings = null;
var endDate_power_savings = null;
var tota_power_savings_date_flag = false;
document.addEventListener('DOMContentLoaded', function () {
    // Initialize the date picker with Flatpickr
    flatpickr("#dateRange_total_saving_values", {
        mode: "range",
        dateFormat: "d/m/Y",  // Adjust the date format here
        onChange: function (selectedDates, dateStr, instance) {
            // Triggered after selecting the date range
            startDate_power_savings = selectedDates[0];
            endDate_power_savings = selectedDates[1];
        }
    });

    // Toggle visibility of the date picker based on dropdown selection
    document.getElementById('timeSelect_total_saving_values').addEventListener('change', function () {
        const datePicker = document.getElementById('datePicker_total_saving_values');
        if (this.value === 'set_date_total_saving_values') {
            datePicker.style.display = 'block';
            tota_power_savings_date_flag = true
        } else {
            tota_power_savings_date_flag = false
            datePicker.style.display = 'none';
            socket.emit("total_power_savings", { startDate: formatDateToISO(date_today), endDate: formatDateToISO(date_today), timeSelect: document.getElementById("timeSelect_total_saving_values").value, graphSelect: document.getElementById("lightSelect_total_saving_values").value });
        }
    });

    // Handle Apply button click for Total Saving
    document.getElementById('applyButton_total_saving_values').addEventListener('click', function () {
        socket.emit("total_power_savings", { startDate: formatDateToISO(startDate_power_savings), endDate: formatDateToISO(endDate_power_savings), timeSelect: document.getElementById("timeSelect_total_saving_values").value, graphSelect: document.getElementById("lightSelect_total_saving_values").value });
    });
});

// **********Total saving end**************