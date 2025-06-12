const annotationValue = document.getElementById('annotationInput');
const applyButton = document.getElementById('applyAnnotation');
const errorMessage_threshold = document.getElementById('errorMessage_threshold');
const wrapper = document.getElementById('tempGraphWrapper');
// const device_id = wrapper.dataset.deviceId;
var url = new URL(window.location.href);
var pathname = url.pathname;
var device_id = pathname.split('/').pop();
console.log("Device ID:!!!!!!!!!!!!", device_id);
console.log("annotationValue---------------", annotationValue);
applyButton.addEventListener('click', () => {
    let value = parseInt(annotationValue.value, 10);

    if (!device_id) {
        console.error("Missing device_id");
        return;
    }

    if (isNaN(value)) {
        errorMessage_threshold.textContent = "Please enter a number";
        return;
    }

    if (value > 100) {
        annotationValue.value = 100;
        value = 100;
        errorMessage_threshold.textContent = "Error: The number cannot exceed 100";
        return;
    } else if (value <= 0) {
        annotationValue.value = 1;
        value = 1;
        errorMessage_threshold.textContent = "Error: The number must be greater than 0";
        return;
    } else {
        errorMessage_threshold.textContent = "";
    }

    fetch('/publish-threshold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: value, device_id: device_id })
    })
        .then(response => response.json())
        .then(data => {
            console.log("Published:", data);
            alert("Threshold updated successfully");
        })
        .catch(error => {
            console.error("Error publishing:", error);
            alert("Failed to update threshold");
        });
});


function updateGraph() {
    let today = new Date();
    let formattedTodayDate = formatDateToYYYYMMDD(today);

    emitTemperatureData({
        startDate: formattedTodayDate,
        endDate: formattedTodayDate,
        timeSelect: 'daily'
    });
    updateGraph_temp_r_y_b('daily', formattedTodayDate, formattedTodayDate);
}

var graphControl = document.getElementById('controlPanelSelect_temp_r_y_b').value;

let socket;
function fetchIP() {
    return fetch("../static/js/ip.json")
        .then((res) => {
            if (!res.ok) {
                throw new Error('Failed to fetch IP address');
            }
            return res.json();
        })
        .then((data) => data.ip)
        .catch((error) => {
            console.error('Error fetching IP address:', error);
            throw error;
        });
}

let totalPoints;
let stepSeconds;

let temp1;
let temp2;
let temp3;
let temp4;

let timerRef = null;

function scheduleNextFetch() {
    if (!sleeping || sleeping <= 0) {
        console.warn("Invalid 'sleeping' time. Retry will not be scheduled.");
        return;
    }

    timerRef = setTimeout(() => {
        let today = new Date();
        let dateRangePicker = document.getElementById('dateRange_temp_r_y_b')._flatpickr;
        const currentTimeSelect = document.getElementById('timeframeSelect_temp_r_y_b').value;
        var graphControl = document.getElementById('controlPanelSelect_temp_r_y_b').value;

        let selectedStartDate = dateRangePicker.selectedDates[0];
        let selectedEndDate = dateRangePicker.selectedDates[1] || selectedStartDate;

        if (currentTimeSelect !== 'set-date') {
            selectedStartDate = '';
            selectedEndDate = '';

            emitTemperatureData({
                startDate: formatDateToYYYYMMDD(selectedStartDate || today),
                endDate: formatDateToYYYYMMDD(selectedEndDate || today),
                timeSelect: 'daily',
                controlGraph: graphControl
            });
        }

        console.log("Requested latest temperature data.");

        // Schedule the next call
        scheduleNextFetch();
    }, sleeping);
}

let array_define;
let email;
let NeutralAvailable = 0;

function setupSocketConnection(ip) {
    console.log("Connected to SocketIO server");
    socket = io.connect(ip);

    socket.on('connect', function () {
        console.log("ANJaLI")

        email = localStorage.getItem("email");
        console.log("Emitting user_connected with email:", email);

        // Emit the email to backend
        socket.emit("user_connected", { email });

        let today = new Date();
        let formattedTodayDate = formatDateToYYYYMMDD(today);
        console.log("emiting start");
        array_define = 0;
        emitTemperatureData({
            startDate: formattedTodayDate,
            endDate: formattedTodayDate,
            timeSelect: 'daily',
            controlGraph: graphControl

        });
    });

    socket.on('send_temperature_graph_data', function (data) {
        console.log('Received temperature data:', data);
        thresholdValue = data.threshold
        phase_values = data.phase_values;
        graph_duration = data.graph_duration;
        data = data.data;

        // Graph duration in seconds from backend
        stepSeconds = graph_duration;
        totalPoints = Math.floor(86400 / stepSeconds); // 86400 seconds in a day

        sleeping = stepSeconds * 1000;


        if (timerRef) clearTimeout(timerRef);

        scheduleNextFetch()

        const currentTimeSelect = document.getElementById('timeframeSelect_temp_r_y_b').value;
        let labels = generateTimeLabels(stepSeconds);

        // console.log("labels-->", labels);
        // console.log("total points", totalPoints)

        if (array_define === 0) {

            // Initialize arrays dynamically based on totalPoints
            temp1 = Array(totalPoints).fill(null);
            temp2 = Array(totalPoints).fill(null);
            temp3 = Array(totalPoints).fill(null);
            temp4 = Array(totalPoints).fill(null);
        }

        // To show values of phases in boxes 
        for (let deviceId in phase_values) {
            const panels = phase_values[deviceId];

            for (let panelName in panels) {
                const sensors = panels[panelName];

                // Construct the base class or ID selectors
                const panelContainer = document.querySelector(`div[data-device-id="${deviceId}"][data-panel-name="${panelName}"]`);

                if (!panelContainer) {
                    console.log("Panel container not found for device:", deviceId, "panel:", panelName);
                    continue;
                }

                // Find all phase sensor blocks in this panel
                const sensorBlocks = panelContainer.querySelectorAll('.lux_graph_level_indv_div');

                sensorBlocks.forEach(block => {
                    const sensorTitle = block.querySelector('.lux_graph_level_title_img_main_div h4');
                    const sensorValueDiv = block.querySelector('.lux_graph_level_temp_value_div');

                    if (!sensorTitle || !sensorValueDiv) return;
                    const sensorName = sensorTitle.innerText.trim();  // e.g., 'R1', 'Y1', 'B1', 'N'
                    const newValue = sensors[sensorName];  // Get the corresponding value from the sensors data

                    if (newValue !== undefined) {
                        if (newValue === null) {
                            sensorValueDiv.innerText = `-°C`;
                        } else {
                            sensorValueDiv.innerText = `${newValue}°C`;  // Update the temperature value
                        }
                    }
                });
            }
        }

        // Process data and map it to the correct time intervals
        if (currentTimeSelect === 'set-date') {
            const dateRangePicker = document.getElementById('dateRange_temp_r_y_b')._flatpickr;
            const startDate = dateRangePicker.selectedDates[0];
            const endDate = dateRangePicker.selectedDates[0];

            if (startDate && endDate) {

                data.forEach((row) => {
                    // const timeIndex = getTimeIndex(row.minute);
                    const timeIndex = getTimeIndex(row.minute, stepSeconds);
                    if (timeIndex === -1) return;

                    Object.entries(row).forEach(([key, value]) => {
                        if (typeof value !== 'number') return;

                        if (key.startsWith('temperature_R')) {
                            temp1[timeIndex] = value;
                        } else if (key.startsWith('temperature_Y')) {
                            temp2[timeIndex] = value;
                        } else if (key.startsWith('temperature_B')) {
                            temp3[timeIndex] = value;
                        } else if (key.startsWith('temperature_N')) {
                            temp4[timeIndex] = value;
                            NeutralAvailable = 1;
                        }
                    });
                });

                updateGraph_temp_r_y_b(labels, temp1, temp2, temp3, temp4);
            } else {
                console.error('Start or end date is not selected.');
            }
        } else if (currentTimeSelect === 'daily') {
            console.log("data is ", data);

            // Check if any data exists
            // const anyDataExists = [temp1, temp2, temp3, temp4].some(arr =>
            //     arr.some(val => val !== null && val !== undefined)
            // );


            const anyDataExists = [temp1, temp2, temp3, temp4].some(arr =>
                arr.some(val => val !== null)
            );
            console.log("anyDataExists", anyDataExists)


            if (!anyDataExists) {
                data.forEach((row) => {
                    const timeIndex = getTimeIndex(row.minute, stepSeconds);
                    if (timeIndex === -1) return;

                    Object.entries(row).forEach(([key, value]) => {
                        if (typeof value !== 'number') return;

                        if (key.startsWith('temperature_R')) {
                            temp1[timeIndex] = value;
                        } else if (key.startsWith('temperature_Y')) {
                            temp2[timeIndex] = value;
                        } else if (key.startsWith('temperature_B')) {
                            temp3[timeIndex] = value;
                        } else if (key.startsWith('temperature_N')) {
                            temp4[timeIndex] = value;
                            NeutralAvailable = 1;
                        }
                    });
                });

                array_define = 1;
                updateGraph_temp_r_y_b(labels, temp1, temp2, temp3, temp4);
            } else {
                const lastRow = data[data.length - 1];
                // const timeIndex = getTimeIndex(lastRow.minute);
                const timeIndex = getTimeIndex(lastRow.minute, stepSeconds);

                // Only update unset values at the last index
                Object.entries(lastRow).forEach(([key, value]) => {
                    if (typeof value !== 'number') return;

                    if (key.startsWith('temperature_R') && (temp1[timeIndex] === null || temp1[timeIndex] === undefined)) {
                        temp1[timeIndex] = value;
                    } else if (key.startsWith('temperature_Y') && (temp2[timeIndex] === null || temp2[timeIndex] === undefined)) {
                        temp2[timeIndex] = value;
                    } else if (key.startsWith('temperature_B') && (temp3[timeIndex] === null || temp3[timeIndex] === undefined)) {
                        temp3[timeIndex] = value;
                    } else if (key.startsWith('temperature_N') && (temp4[timeIndex] === null || temp4[timeIndex] === undefined)) {
                        temp4[timeIndex] = value;
                    }
                });

                chart_temp_r_y_b.update();

            }

        } else {
            console.error('Invalid time selection type.');
        }
    });

    const url = window.location.href;

    const device_id = url.split('/').filter(Boolean).pop();
    const currentDeviceSuffix = device_id.slice(-6);  // e.g., F0BF2F

    // const shownAlerts = new Map();

    socket.on('new_alert', function (data) {
        console.log("New Alert Received:", data);

        const alertSuffix = data.device_name.slice(-6);

        if (alertSuffix !== currentDeviceSuffix) {
            console.log("Alert ignored for other device:", data.device_name);
            return;
        }

        console.log("formattedTimestamp-->")

        // Format timestamp
        const date = new Date(data.timestamp);
        const options = {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        };

        const formattedTimestamp = date.toLocaleString('en-GB', options)
            .replace(',', '')
            .replace(/(\d{2}:\d{2}:\d{2})/, ', $1');

        console.log("formattedTimestamp-->", formattedTimestamp)

        const container = document.querySelector('.temp_alert_box_main_div');
        if (!container) {
            console.error("Alert container not found!");
            return;
        }

        // Check if an alert with same message and device already exists
        const existingAlert = container.querySelector(
            `.alert-box[data-device-name="${data.device_name}"][data-alert-message="${data.message}"]`
        );

        if (existingAlert) {
            console.log("Duplicate alert found. Updating timestamp...");
            const timestampDiv = existingAlert.querySelector('.temp_alert_time');
            if (timestampDiv) {
                timestampDiv.textContent = formattedTimestamp;
            }
            return; // Skip inserting a new alert
        }

        // Insert new alert block if not already shown
        const alertHTML = `
        <div class="mt-4 p-1 temp_r_y_b_alert_box_div">
            <div class="alert-box" data-alert-message="${data.message}" data-device-name="${data.device_name}">
                <div class="d-flex justify-content-end">
                    <img class="temp_alert_box_close" src="../static/img/alert_cross_close.svg" onclick="deleteAlert(this)">
                </div>
                <div class="text-center temp_r_y_b_alert_box_title">
                    <img class="temp_alert_icon" src="../static/img/alert.svg">
                    Alert (${data.exceeded_phases})
                </div>
                <div class="text-center temp_r_y_b_alert_box_description mt-2">${data.message}</div>
                <div class="mt-2 pb-3 temp_alert_time">${formattedTimestamp}</div>
            </div>
        </div>
    `;

        container.insertAdjacentHTML('afterbegin', alertHTML);
    });




    // Generate 24-hour labels with 1-minute intervals
    // function generateTimeLabels() {
    //     const labels = [];
    //     for (let hour = 0; hour < 24; hour++) {
    //         for (let minute = 0; minute < 60; minute++) {
    //             const timeLabel = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    //             labels.push(timeLabel);
    //         }
    //     }
    //     return labels;
    // }

    function generateTimeLabels(stepSeconds) {
        const labels = [];
        for (let i = 0; i < 86400; i += stepSeconds) {
            const totalMinutes = Math.floor(i / 60);
            const hour = Math.floor(totalMinutes / 60);
            const minute = totalMinutes % 60;
            const second = i % 60;

            let label;
            if (stepSeconds >= 60) {
                // If interval is 1 minute or more, show HH:MM
                label = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
            } else {
                // If interval is less than 1 minute, show HH:MM:SS
                label = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
            }

            labels.push(label);
        }
        return labels;
    }



    function getTimeIndex(time, stepSeconds) {
        if (!time || typeof time !== 'string') {
            console.warn('Invalid time value passed to getTimeIndex:', time);
            return -1;
        }

        const parts = time.split(':').map(Number);
        const hour = parts[0] || 0;
        const minute = parts[1] || 0;
        const second = parts[2] || 0;

        const totalSeconds = hour * 3600 + minute * 60 + second;
        const index = Math.floor(totalSeconds / stepSeconds);

        return index >= 0 && index < totalPoints ? index : -1;
    }


    // setInterval(function () {
    //     let today = new Date();
    //     let dateRangePicker = document.getElementById('dateRange_temp_r_y_b')._flatpickr;
    //     const currentTimeSelect = document.getElementById('timeframeSelect_temp_r_y_b').value;

    //     let selectedStartDate = dateRangePicker.selectedDates[0];
    //     let selectedEndDate = dateRangePicker.selectedDates[1] || selectedStartDate;

    //     if (currentTimeSelect !== 'set-date') {
    //         selectedStartDate = '';
    //         selectedEndDate = '';

    //         emitTemperatureData({
    //             startDate: formatDateToYYYYMMDD(selectedStartDate || today),
    //             endDate: formatDateToYYYYMMDD(selectedEndDate || today),
    //             timeSelect: 'daily',
    //             controlGraph: graphControl
    //         });
    //     }
    //     console.log("Requested latest temperature data.");
    // }, sleeping);
}


let isSetDateActive_temp_r_y_b = false;
let selectedStartDate_temp_r_y_b, selectedEndDate_temp_r_y_b;

function formatDate(date) {
    const d = new Date(date);
    let month = (d.getMonth() + 1).toString().padStart(2, '0');
    let day = d.getDate().toString().padStart(2, '0');
    let year = d.getFullYear();
    return `${year}-${month}-${day}`;
}

// Function to format date to YYYY-MM-DD 
function formatDateToYYYYMMDD(date) {
    if (!date) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${year}-${month}-${day}`;
}

document.addEventListener('DOMContentLoaded', function () {
    flatpickr("#dateRange_temp_r_y_b", {
        mode: "single", // single mode
        dateFormat: "d/m/Y",
        onChange: function (selectedDates) {
            if (selectedDates.length === 1) {
                const startDate_temp_r_y_b = selectedDates[0];
                const endDate_temp_r_y_b = selectedDates[0];
                // Displaying selected date as both start and end
                document.getElementById('startDateDisplay_temp_r_y_b').innerText = `Start Date: ${formatDate(startDate_temp_r_y_b)}`;
                document.getElementById('endDateDisplay_temp_r_y_b').innerText = `End Date: ${formatDate(endDate_temp_r_y_b)}`;
            }
        }
    });
});
var ctx_temp_r_y_b = document.getElementById('myChart_temp_r_y_b').getContext('2d');
var chart_temp_r_y_b;

const blueGradient = ctx_temp_r_y_b.createLinearGradient(0, 0, 0, 400);
blueGradient.addColorStop(0, '#2959FF');
blueGradient.addColorStop(1, '#9EB3FC');

const redGradient = ctx_temp_r_y_b.createLinearGradient(0, 0, 0, 400);
redGradient.addColorStop(0, '#FF5B5B');
redGradient.addColorStop(1, '#FFB2B2');

const yellowGradient = ctx_temp_r_y_b.createLinearGradient(0, 0, 0, 400);
yellowGradient.addColorStop(0, '#FFC107');
yellowGradient.addColorStop(1, '#FFE082');

const blackGradient = ctx_temp_r_y_b.createLinearGradient(0, 0, 0, 400);
blackGradient.addColorStop(0, '#000000');
blackGradient.addColorStop(1, '#000000');

var staticDailyLabels = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

let annotationLine = null;
let thresholdValue;


function getCurrentTimeRange() {
    const now = new Date();
    now.setSeconds(0, 0); // clear seconds & milliseconds
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const next = new Date(now.getTime() + 60 * 1000); // add 1 minute
    const nextTime = `${String(next.getHours()).padStart(2, '0')}:${String(next.getMinutes()).padStart(2, '0')}`;

    return { minTime: currentTime, maxTime: nextTime };
}


function updateGraph_temp_r_y_b(labels, temp1, temp2, temp3, temp4) {
    temp1 = Array.isArray(temp1) ? temp1 : [];
    temp2 = Array.isArray(temp2) ? temp2 : [];
    temp3 = Array.isArray(temp3) ? temp3 : [];
    temp4 = Array.isArray(temp4) ? temp4 : [];

    if (chart_temp_r_y_b) chart_temp_r_y_b.destroy();

    var currentTimeSelect = document.getElementById('timeframeSelect_temp_r_y_b').value;

    const isTemperatureDataEmpty = temp1.length === 0 && temp2.length === 0 && temp3.length === 0 && temp4.length === 0;

    const now = new Date();

    var min, max;

    // Ensure the min and max values are formatted correctly for mobile
    if (stepSeconds < 60) {
        min = `${String(now.getHours()).padStart(2, '0')}:00:00`;
        max = `${String((now.getHours() + 1) % 24).padStart(2, '0')}:00:00`;

    } else {
        min = `${String(now.getHours()).padStart(2, '0')}:00`;
        max = `${String((now.getHours() + 1) % 24).padStart(2, '0')}:00`;
    }

    // min = `${String(now.getHours()).padStart(2, '0')}:00`;
    // max = `${String((now.getHours() + 1) % 24).padStart(2, '0')}:00`;


    if (temp1.length !== labels.length) temp1 = new Array(labels.length).fill(0);
    if (temp2.length !== labels.length) temp2 = new Array(labels.length).fill(0);
    if (temp3.length !== labels.length) temp3 = new Array(labels.length).fill(0);
    if (temp4.length !== labels.length) temp4 = new Array(labels.length).fill(0);

    chart_temp_r_y_b = new Chart(ctx_temp_r_y_b, {
        type: 'line',
        data: {
            labels: labels,
            datasets: isTemperatureDataEmpty
                ? [

                ]
                : [
                    {
                        label: 'Temperature 1 (R)',
                        data: temp1,
                        backgroundColor: redGradient,
                        borderColor: redGradient,
                        borderWidth: 1
                    },
                    {
                        label: 'Temperature 2 (Y)',
                        data: temp2,
                        backgroundColor: yellowGradient,
                        borderColor: yellowGradient,
                        borderWidth: 1
                    },
                    {
                        label: 'Temperature 3 (B)',
                        data: temp3,
                        backgroundColor: blueGradient,
                        borderColor: blueGradient,
                        borderWidth: 1
                    },
                    ...(NeutralAvailable === 1 ? [{
                        label: 'Temperature 4 (N)',
                        data: temp4,
                        backgroundColor: blackGradient,
                        borderColor: blackGradient,
                        borderWidth: 1
                    }] : []),
                    {
                        label: 'Threshold',
                        data: thresholdValue,
                        backgroundColor: '#A9A9A9',
                        borderColor: '#A9A9A9',
                        borderWidth: 1
                    }
                ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Time'
                    },
                    ticks: {
                        autoSkip: true
                    },
                    // min: min,
                    // max: max
                    ...(currentTimeSelect === 'daily' ? { min: min, max: max } : {})
                },
                y: {
                    title: {
                        display: true,
                        text: 'Temperature (°C)'
                    },
                }
            },
            plugins: {
                legend: {
                    display: true,
                },
                annotation: {
                    annotations: thresholdValue ? [{
                        id: 'threshold',
                        type: 'line',
                        yMin: thresholdValue,
                        yMax: thresholdValue,
                        borderColor: '#D3D0C9',
                        borderWidth: 5,
                        // borderDash: [2, 6], 
                        borderDashOffset: 0,
                        label: {
                            display: false
                        }
                    }] : []
                },
                zoom: {
                    pan: {
                        enabled: true,
                        mode: 'xy', // Panning for both axes (x and y)
                    },
                    zoom: {
                        wheel: {
                            enabled: true // Zooming with mouse wheel
                        },
                        pinch: {
                            enabled: true // Zooming with pinch-to-zoom gesture on mobile
                        },
                        mode: "xy", // Enable zooming in both directions (x and y)
                    },
                    limits: {
                        y: { min: 0 }, // Ensuring the y-axis doesn't go below zero
                    }
                }
            }
        }
    });
}



// Handle the annotation input
document.getElementById('applyAnnotation').addEventListener('click', function () {
    var annotationValue = parseFloat(document.getElementById('annotationInput').value);

    if (!isNaN(annotationValue)) {
        const newAnnotation = {
            type: 'line',
            yMin: annotationValue,
            yMax: annotationValue,
            borderColor: '#D3D0C9',
            borderWidth: 4,
            label: {
                content: `Y = ${annotationValue}`,
                enabled: true,
                position: 'center'
            }
        };
        chart_temp_r_y_b.options.plugins.annotation.annotations = [newAnnotation];

        // console.log("chart_temp_r_y_b.options.plugins.annotation.annotations", chart_temp_r_y_b.options.plugins.annotation.annotations)

        chart_temp_r_y_b.update();
    }
});


document.getElementById('timeframeSelect_temp_r_y_b').addEventListener('change', function () {
    var selectedValue = this.value;
    console.log('Selected timeframe:', selectedValue);
    var dateRangeContainer = document.getElementById('dateRangeContainer_temp_r_y_b');
    var daterange_start = document.getElementById('startDateDisplay_temp_r_y_b');
    var daterange_end = document.getElementById('endDateDisplay_temp_r_y_b');
    // var graphControl = document.getElementById('controlPanelSelect_temp_r_y_b').value;

    array_define = 0;

    if (array_define === 0) {

        // Initialize arrays dynamically based on totalPoints
        temp1 = Array(totalPoints).fill(null);
        temp2 = Array(totalPoints).fill(null);
        temp3 = Array(totalPoints).fill(null);
        temp4 = Array(totalPoints).fill(null);
    }

    if (selectedValue === 'set-date') {
        isSetDateActive_temp_r_y_b = true;
        dateRangeContainer.style.display = 'block';
        daterange_start.style.display = 'block';
        daterange_end.style.display = 'block';
    } else if (selectedValue === 'daily') {
        isSetDateActive_temp_r_y_b = false;
        dateRangeContainer.style.display = 'none';
        daterange_start.style.display = 'none';
        daterange_end.style.display = 'none';

        let today = new Date();
        let formattedTodayDate = formatDateToYYYYMMDD(today);

        emitTemperatureData({ startDate: formattedTodayDate, endDate: formattedTodayDate, timeSelect: 'daily', controlGraph: graphControl });

    } else {
        isSetDateActive_temp_r_y_b = false;
        dateRangeContainer.style.display = 'none';
        console.log('Other selection made. No action taken.');
    }
});

document.getElementById('applyDateRange_temp_r_y_b').addEventListener('click', function () {
    if (isSetDateActive_temp_r_y_b) {
        var dateRangeInput = document.getElementById('dateRange_temp_r_y_b').value;
        // console.log('Date Range Input:', dateRangeInput);
        var [startDate, endDate] = dateRangeInput.split(' to ').map(dateStr => {
            var [day, month, year] = dateStr.split('/');
            return new Date(year, month - 1, day);
        });
        var currentTimeSelect = document.getElementById('timeframeSelect_temp_r_y_b').value;

        // var graphControl = document.getElementById('controlPanelSelect_temp_r_y_b').value;

        if (currentTimeSelect === 'daily') {
            let today = new Date();
            let formattedTodayDate = formatDateToYYYYMMDD(today);

            emitTemperatureData({ startDate: formattedStartDate, endDate: formattedTodayDate, timeSelect: 'daily', controlGraph: graphControl });
        } else {
            var dateRangePicker = document.getElementById('dateRange_temp_r_y_b')._flatpickr;
            var selectedStartDate = dateRangePicker.selectedDates[0];
            var selectedEndDate = dateRangePicker.selectedDates[0];

            var formattedStartDate = formatDateToYYYYMMDD(selectedStartDate);
            var formattedEndDate = formatDateToYYYYMMDD(selectedEndDate);
            console.log('selectedStartDate_temp_r_y_b', formattedStartDate, formattedEndDate)

            emitTemperatureData({ startDate: formattedStartDate, endDate: formattedEndDate, timeSelect: 'set-date', controlGraph: graphControl });

        }

    }
});

document.getElementById('controlPanelSelect_temp_r_y_b').addEventListener('change', function () {
    var currentTimeSelect = document.getElementById('timeframeSelect_temp_r_y_b').value;
    var graphControl = document.getElementById('controlPanelSelect_temp_r_y_b').value;

    if (currentTimeSelect === 'daily') {
        let today = new Date();
        console.log('today', today)
        let formattedTodayDate = formatDateToYYYYMMDD(today);
        array_define = 0

        emitTemperatureData({ startDate: formattedTodayDate, endDate: formattedTodayDate, timeSelect: 'daily', controlGraph: graphControl });
    } else {
        var dateRangePicker = document.getElementById('dateRange_temp_r_y_b')._flatpickr;
        var selectedStartDate = dateRangePicker.selectedDates[0];
        var selectedEndDate = dateRangePicker.selectedDates[0];
        var formattedStartDate = formatDateToYYYYMMDD(selectedStartDate);
        var formattedEndDate = formatDateToYYYYMMDD(selectedEndDate);
        console.log('selectedStartDate_temp_r_y_b', formattedStartDate, formattedEndDate)
        array_define = 0

        emitTemperatureData({ startDate: formattedStartDate, endDate: formattedEndDate, timeSelect: 'set-date', controlGraph: graphControl });
    }
});

function emitTemperatureData(data) {
    var url = new URL(window.location.href);
    var pathname = url.pathname;
    var device_id = pathname.split('/').pop();
    const finalData = {
        startDate: data.startDate,
        endDate: data.endDate,
        timeSelect: data.timeSelect,
        controlGraph: data.controlGraph,
        device_id: device_id,
        email: email
    };

    console.log("device_id---------------", device_id, finalData)

    if (socket) {
        console.log("sending data")
        try {
            socket.emit('temperature_graph_data', finalData, (ack) => {
                console.log("? Data sent successfully, server ack:", ack);
            });
            console.log("?? Emit call made for temperature_graph_data");
        } catch (error) {
            console.error("? Error emitting temperature_graph_data:", error);
        }

    }
}


const timeframeSelect = document.getElementById('timeframeSelect_temp_r_y_b');
const annotationDiv = document.querySelector('.temp_annotation_div');


// Function to toggle visibility based on selection
function toggleAnnotationDiv() {
    if (timeframeSelect.value === 'daily') {
        annotationDiv.style.display = 'block'; // Show for "Today"
    } else {
        annotationDiv.style.display = 'none'; // Hide for "Set Date"
    }
}

timeframeSelect.addEventListener('change', toggleAnnotationDiv);

toggleAnnotationDiv();


fetchIP()
    .then(ip => setupSocketConnection(ip))
    .catch(error => console.error('Error setting up socket connection:', error));
