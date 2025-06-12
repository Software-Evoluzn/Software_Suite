// Fetch IP address from ip.json
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

// Setup Socket.IO connection and handle events
function setupSocketConnection(ip) {
    const socket = io.connect(ip);
    const alertsContainer = document.getElementById('alerts-container');

    socket.on('connect', function () {
        console.log("Connected to SocketIO server");
        socket.emit('oee_stats', { start_date_oee: "", end_date_oee: "" });
        socket.emit('active_run_oee_stats');
        socket.emit('power_values_date', { start_date: "", end_date: "" });
        socket.emit('power_values');
        socket.emit('oee_values');
        socket.emit('acpowerconsumption', { startdate: '', enddate: '' })

        fetchAlerts(); // Initial fetch
        setInterval(fetchAlerts, 60000); // Fetch alerts every 3 seconds
    });


    var acpower = {};
    socket.on('acpowerconsumption', function (data) {
        acpower = data;
        console.log('Received AC power consumption data:', acpower.daily);
        console.log('Received custom', acpower.custom_data);

        const selectedTimeframe = document.getElementById('timeSelect_ac_device_graph').value;
        const selectedGraphType = document.getElementById('graphSelect_ac_device_graph').value;

        if (!acpower || (!acpower.daily && !acpower.custom_data)) {
            console.error('No valid data received.');
            return;
        }

        if (selectedTimeframe === 'set-date-ac' && acpower.custom_data) {
            const customData = acpower.custom_data;
            console.log('customData---', customData);


            updateGraph_ac_device_graph(selectedTimeframe, selectedGraphType, selectedStartDate_ac_device_graph, selectedEndDate_ac_device_graph, customData);
        } else {

            updateGraph_ac_device_graph('daily', 'power-consumption', null, null, acpower.daily);
        }
    });


    function formatPower(value) {
        if (value === "" || value === null) {
            return '- Wh'; // Default for empty or null values
        }

        // Convert to number if it's a string
        const numericValue = parseFloat(value);

        if (isNaN(numericValue)) {
            return '- Wh';
        }

        // Format the value
        if (numericValue >= 1000) {
            return (numericValue / 1000).toFixed(2) + ' kWh'; // Convert to kWh
        } else {
            return numericValue.toFixed(2) + ' Wh'; // Keep in Wh
        }
    }

    socket.on('oee_values', function (data) {
        // console.log("OEE_VALUES", data)
        if (data.active === "" || data.active === null) {
            document.getElementById('active').innerText = '-';
        } else {
            document.getElementById('active').innerText = data.active;
        }
        if (data.ideal === "" || data.ideal === null) {
            document.getElementById('ideal').innerText = '-';
        } else {
            document.getElementById('ideal').innerText = data.ideal;
        }
        if (data.active_tube === "" || data.active_tube === null) {
            document.getElementById('active_tube').innerText = '-';
        } else {
            document.getElementById('active_tube').innerText = data.active_tube;
        }
        if (data.active_hibay === "" || data.active_hibay === null) {
            document.getElementById('active_hibay').innerText = '-';
        } else {
            document.getElementById('active_hibay').innerText = data.active_hibay;
        }
        if (data.active_office === "" || data.active_office === null) {
            document.getElementById('active_office').innerText = '-';
        } else {
            document.getElementById('active_office').innerText = data.active_office;
        }
    });

    // this socket for office lite
    socket.on('office', function (data) {
        const deviceID = data.split(":");
        const master = deviceID[3]
        // console.log("master", master)
        const auto = deviceID[6]
        // console.log("auto", auto)
        const id = deviceID[8]
        // console.log("id", id)
        const intensity = deviceID[2]
        // console.log("intensity", intensity)

        // this code for intensity slider........
        const rangeInput = document.querySelector('.main_luxrange_office_light');
        const percentageDisplay = document.getElementById('main_office_light_lux_value');
        if (rangeInput && percentageDisplay) {
            rangeInput.value = intensity;
            percentageDisplay.textContent = intensity + '';
        }

        // this code for master on off ........
        const switchContainer = document.querySelector('.main_office_light_label');
        const switchInput = switchContainer.querySelector('.main_office_master_switch');
        if (switchContainer && switchInput) {
            if (master !== '0') {
                // console.log("on")
                switchInput.checked = !switchInput.checked;
                switchContainer.classList.add('on');
                switchContainer.classList.remove('off');
            } else {
                // console.log("off")
                switchInput.checked = false;
                switchContainer.classList.remove('on');
                switchContainer.classList.add('off');
            }
        }

        // this code for auto on off ....
        const switchContainerAuto = document.querySelector('.main_autobrightness_label');
        const switchInputAuto = switchContainerAuto.querySelector('.main_office_autobrightness');
        if (switchContainerAuto && switchInputAuto) {
            if (auto !== '0') {
                switchInputAuto.checked = !switchInputAuto.checked;
                switchContainerAuto.classList.add('on');
                switchContainerAuto.classList.remove('off');
            } else {
                switchInputAuto.checked = false;
                switchContainerAuto.classList.remove('on');
                switchContainerAuto.classList.add('off');
            }
        }

    });
    //   this for highbay light.....
    socket.on('highbay', function (data) {
        if (Array.isArray(data) && data.length === 4) {
            // console.log("highbay...", data);

            const [deviceId, highbayId, SwitchStatus, autoMotionDetection] = data;

            updateSwitch('.main_highbay_light_label', SwitchStatus, '.main_highbay_master_switch');
            updateSwitch('.main_highbay_officeauto_motion_label', autoMotionDetection, '.main_highbay_auto_motion');
        }
    });

    function updateSwitch(containerSelector, status, inputSelector) {
        const container = document.querySelector(containerSelector);
        const input = container?.querySelector(inputSelector);

        if (container && input) {
            input.checked = status !== '0';
            container.classList.toggle('on', status !== '0');
            container.classList.toggle('off', status === '0');
        }
    }

    // this for running light....
    socket.on('tube', function (data) {
        // console.log(data)
        if (data !== undefined) {
            // console.log("ledF0BE96", data)
            const deviceID = data.split(":");
            const masterRunning = deviceID[2]
            // console.log("masterledF0BE96", masterRunning)
            const autoRunning = deviceID[6]
            const id = deviceID[8]
            // console.log("idlledF0BE96", id)
            const intensityRunning = deviceID[2]
            // console.log("intensityledF0BE96", intensityRunning)


            const switchInputRunning = document.querySelector('.main_running_master_switch');
            const switchContainerRunning = document.querySelector('.main_running_label');
            const AutoInputRunning = document.querySelector('.main_running_autobrightness_switch');
            const AutoInputRunningAuto = document.querySelector('.main_running_autobrightness_label');

            if (switchInputRunning && switchContainerRunning) {
                if (masterRunning !== '0') {
                    switchInputRunning.checked = true;
                    switchContainerRunning.classList.add('on');
                    switchContainerRunning.classList.remove('off');
                } else {
                    switchInputRunning.checked = false;
                    switchContainerRunning.classList.remove('on');
                    switchContainerRunning.classList.add('off');
                }
            }

            if (AutoInputRunning && AutoInputRunningAuto) {
                if (autoRunning !== '0') {
                    AutoInputRunning.checked = true;
                    AutoInputRunningAuto.classList.add('on');
                    AutoInputRunningAuto.classList.remove('off');
                } else {
                    AutoInputRunning.checked = false;
                    AutoInputRunningAuto.classList.remove('on');
                    AutoInputRunningAuto.classList.add('off');
                }
            }


            // intensity slider running.....
            const rangeInputRunning = document.querySelector('.main_luxrange_running_light');
            const percentageDisplay = document.getElementById('main_running_light_lux_value');
            if (rangeInputRunning && percentageDisplay) {
                rangeInputRunning.value = intensityRunning;
                percentageDisplay.textContent = intensityRunning + '';
            }
        }

    });

    // Initial state for SmartPlug function
    let isOn = false;

    // Function to handle smart plug actions
    function SmartPlug(id) {
        const action = isOn ? 'SmartPlugOff' : 'SmartPlugOn';
        isOn = !isOn;

        const data = {
            id: id,
            action: action
        };

        fetch('/turnSmartPlug', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
            .then(response => response.json())
            .then(data => {
                // console.log('Success:', data);
            })
            .catch((error) => {
                console.error('Error:', error);
            });
    }

    // Socket.IO event handler for 'plug' event
    socket.on('plug', function (data) {
        // console.log('plug', data);
    });

    socket.on('get_alerts_response', function (alert_list) {
        // console.log("Received alert list:", alert_list);
        updateAlertsUI(alert_list); // Update UI with received alert list
    });

    function fetchAlerts() {
        socket.emit('get_alerts'); // Request current alerts from server
    }

    function updateAlertsUI(alert_list) {
        alertsContainer.innerHTML = ''; // Clear existing alerts

        alert_list.forEach(alert => {
            const alertDiv = document.createElement('div');
            alertDiv.classList.add('main_alert_main_div2');
            alertDiv.id = `alert-${alert.id}`;
            alertDiv.innerHTML = `
                <div class="main_main1">
                    <div class="main_alert1">
                        <div class="main_main2">
                            <img class="main_alert" src="../static/img/alert.png" />
                            <div data-alertnew-id="${alert.id}">Alert ${alert.id}</div>
                        </div>
                        <div data-alert-id="${alert.id}">
                            <button class="main_close_btn" data-alert-id="${alert.id}">
                                <img class="main_close_btn_img" src="../static/img/close_btn_alert.png" />
                            </button>
                        </div>
                    </div>
                    <div class="main_attention_alert">${alert.name}</div>
                    <div class="main_statement_alert">
                        ${alert.message}:${alert.id}
                    </div>
                </div>
            `;
            alertsContainer.appendChild(alertDiv);

            // Attach event listener for each close button
            const closeBtn = alertDiv.querySelector('.main_close_btn');
            closeBtn.addEventListener('click', function () {
                closeAlert_main(alert.id);
            });
        });
    }

    function closeAlert_main(alertId) {
        var xhr = new XMLHttpRequest();
        xhr.open("POST", "/close_alert", true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    // console.log("Alert closed successfully");
                    fetchAlerts(); // Request a refresh after closing
                } else {
                    console.error("Error closing alert:", xhr.responseText);
                    // Handle error scenario here if needed
                }
            }
        };
        xhr.send(JSON.stringify({ alert_id: alertId }));
    }
    setInterval(() => {
        console.log('Requesting power data');
        socket.emit('oee_stats');
        socket.emit('active_run_oee_stats');
        socket.emit('oee_values');
    }, 60000)


    // total power consumption start 

    socket.on('power_values', function (data) {
        // console.log("........",data)
        const resultElement = document.getElementById('result');
        const result1Element = document.getElementById('result1');
        const result2Element = document.getElementById('result2');
        const result3Element = document.getElementById('result3');
        const result4Element = document.getElementById('result4');
        const savingElement = document.getElementById('saving');

        if (resultElement) resultElement.innerText = formatPower(data.result);
        if (result1Element) result1Element.innerText = formatPower(data.result1);
        if (result3Element) result3Element.innerText = formatPower(data.result3);
        if (result4Element) result4Element.innerText = formatPower(data.result4);

        if (result2Element) {
            result2Element.innerText = (data.result2 === "" || data.result2 === null) ? '- kWh' : `${data.result2} kWh`;
        }

        if (savingElement) {
            savingElement.innerText = (data.saveresult === "" || data.saveresult === null) ? 'Rs' : `${data.saveresult} Rs`;
        }
    });
    let todayValues_total_power_consumption = {};
    socket.on('power_values_date', function (data) {
        // console.log("data111111111", data);
        todayValues_total_power_consumption = {
            Total_Power: data.result_all + ' kWh' || 0,
            Running_Lights_total_power_consumption: formatPower(data.result_tube) || 0,
            Highbay_Lights_total_power_consumption: formatPower(data.result_highbay) || 0,
            Office_Lights_total_power_consumption: formatPower(data.result_office) || 0,
            AC_total_power_consumption: formatPower(data.result_plug) || 0
        };
        updateValues_total_power_consumption();
    });

    const lightSelect_total_power_consumption = document.getElementById('lightSelect_total_power_consumption');
    const timeSelect_total_power_consumption = document.getElementById('timeSelect_total_power_consumption');
    const valueDisplay_total_power_consumption = document.getElementById('valueDisplay_total_power_consumption');
    const datePicker_total_power_consumption = document.getElementById('datePicker_total_power_consumption');
    const applyButton_total_power_consumption = document.getElementById('applyButton_total_power_consumption');
    let selectedDates_total_power_consumption = [];

    function updateValues_total_power_consumption() {
        const selectedLight_total_power_consumption = lightSelect_total_power_consumption.value;
        const selectedTime_total_power_consumption = timeSelect_total_power_consumption.value;

        if (selectedTime_total_power_consumption === 'today_total_power_consumption') {
            valueDisplay_total_power_consumption.textContent = `${selectedLight_total_power_consumption.replace('_total_power_consumption', ' ')} : ${todayValues_total_power_consumption[selectedLight_total_power_consumption]} (Today)`;
            datePicker_total_power_consumption.style.display = 'none';
            // Emit request for today's data
            socket.emit('power_values_date', { start_date: null, end_date: null });
        } else if (selectedTime_total_power_consumption === 'set_date_total_power_consumption' && selectedDates_total_power_consumption.length === 2) {
            const startDate_total_power_consumption = flatpickr.formatDate(selectedDates_total_power_consumption[0], "Y-m-d");
            const endDate_total_power_consumption = flatpickr.formatDate(selectedDates_total_power_consumption[1], "Y-m-d");

            valueDisplay_total_power_consumption.textContent = `${selectedLight_total_power_consumption.replace('_total_power_consumption', ' ')} : ${todayValues_total_power_consumption[selectedLight_total_power_consumption]}`;
            datePicker_total_power_consumption.style.display = 'block';
            // Emit request for date range data
            socket.emit('power_values_date', { start_date: startDate_total_power_consumption, end_date: endDate_total_power_consumption });
        } else if (selectedTime_total_power_consumption === 'set_date_total_power_consumption') {
            datePicker_total_power_consumption.style.display = 'block';
        }
    }

    flatpickr("#dateRange_total_power_consumption", {
        mode: "range",
        dateFormat: "d/m/Y",
        onChange: function (dates) {
            selectedDates_total_power_consumption = dates;
        }
    });

    applyButton_total_power_consumption.addEventListener('click', function () {
        if (selectedDates_total_power_consumption.length === 2) {
            const startDate_total_power_consumption = flatpickr.formatDate(selectedDates_total_power_consumption[0], "Y-m-d");
            const endDate_total_power_consumption = flatpickr.formatDate(selectedDates_total_power_consumption[1], "Y-m-d");

            valueDisplay_total_power_consumption.textContent = `Power Consumption - from ${startDate_total_power_consumption} to ${endDate_total_power_consumption}`;
            socket.emit('power_values_date', { start_date: startDate_total_power_consumption, end_date: endDate_total_power_consumption });
        }
    });

    lightSelect_total_power_consumption.addEventListener('change', updateValues_total_power_consumption);
    timeSelect_total_power_consumption.addEventListener('change', updateValues_total_power_consumption);
    updateValues_total_power_consumption();
    // total power consumption end

    socket.on('oee_stats', function (data) {
        power = data.today || data.power_data;  // Handle both today and selected range
        console.log("Power Data", power);
        updateGraph_machine_oee_stats(
            document.getElementById('timeSelect_machine_oee_stats').value,
            'power-consumption',
            selectedStartDate_machine_oee_stats,
            selectedEndDate_machine_oee_stats,
            power
        );
    });

    socket.on('active_run_oee_stats', function (data) {
        active = data;
        console.log("Active Data", active);
        updateGraph_machine_oee_stats(
            document.getElementById('timeSelect_machine_oee_stats').value,
            'active-run-time',
            selectedStartDate_machine_oee_stats,
            selectedEndDate_machine_oee_stats,
            active
        );
    });

    // Initialize Flatpickr for date range selection
    let isSetDateActive_machine_oee_stats = false;
    let selectedStartDate_machine_oee_stats, selectedEndDate_machine_oee_stats;

    // Chart.js context for the graph
    var ctx_machine_oee_stats = document.getElementById('myChart_machine_oee_stats').getContext('2d');
    var chart_machine_oee_stats;

    // Gradient settings
    const blueRedGradient_machine_oee_stats = ctx_machine_oee_stats.createLinearGradient(0, 0, 0, 400);
    blueRedGradient_machine_oee_stats.addColorStop(0, '#2959FF');
    blueRedGradient_machine_oee_stats.addColorStop(1, '#9EB3FC');

    const greenGradient_machine_oee_stats = ctx_machine_oee_stats.createLinearGradient(0, 0, 0, 200);
    greenGradient_machine_oee_stats.addColorStop(0, '#23D900');
    greenGradient_machine_oee_stats.addColorStop(1, '#23D400');

    // Date formatting function
    function formatDate_machine_oee_stats(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Generate labels and data for the chart based on date range
    function generateDateRangeData_machine_oee_stats(startDate, endDate) {
        var labels = [];
        var data = [];

        if (startDate.toDateString() === endDate.toDateString()) {
            labels = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
            data = Array.from({ length: 24 }, () => 0);  // Initialize with 0 to handle empty hours
        } else {
            var currentDate = new Date(startDate);
            while (currentDate <= endDate) {
                labels.push(currentDate.toLocaleDateString('en-GB'));
                data.push(0);  // Initialize with 0 for daily data
                currentDate.setDate(currentDate.getDate() + 1);
            }
        }
        return { labels: labels, data: data };
    }

    // Update the graph based on the selected options
    function updateGraph_machine_oee_stats(timeSelect, graphSelect, startDate, endDate, newdata = "") {
        var staticDailyLabels = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
        var labels = [];
        var data = [];
        var yAxisLabel = '';
        var backgroundColor = '';

        console.log(newdata);

        // Ensure newdata is initialized correctly for power consumption
        if (graphSelect === 'power-consumption') {
            if (timeSelect === 'set-date' && startDate && endDate) {
                const dateRangeData = generateDateRangeData_machine_oee_stats(startDate, endDate, graphSelect);
                labels = dateRangeData.labels;
                data = dateRangeData.data;
            } else {
                // Fallback in case newdata is not defined properly
                labels = staticDailyLabels;
                // data = newdata;
                data = labels.map(label => newdata[label] || 0);  // Initialize to 0 if newdata is missing for that label
            }
            yAxisLabel = 'Power Consumption (Wh)';
            backgroundColor = blueRedGradient_machine_oee_stats;
        } else if (graphSelect === 'active-run-time') {
            var activeTime = newdata;
            labels = staticDailyLabels;
            yAxisLabel = 'Run Time (Minutes)';

            if (timeSelect === 'set-date' && startDate && endDate) {
                const dateRangeData = generateDateRangeData_machine_oee_stats(startDate, endDate, graphSelect);
                labels = dateRangeData.labels;
                activeTime = dateRangeData.data;
            }

            data = {
                datasets: [
                    {
                        label: 'Active Time',
                        data: activeTime,  // Initialize to 0 if no data
                        backgroundColor: '#2959FF',
                        borderColor: '#2959FF',
                        borderWidth: 1,
                        stack: 'stack1',
                        borderRadius: 50
                    },
                    {
                        label: 'Inactive Time',
                        data: labels.map(label => Math.max(60 - (newdata[label] || 0), 0)),  // Ensure no negative values
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
                            text: (timeSelect === 'daily' || (isSetDateActive_machine_oee_stats && selectedStartDate_machine_oee_stats && selectedEndDate_machine_oee_stats && selectedStartDate_machine_oee_stats.toDateString() !== selectedEndDate_machine_oee_stats.toDateString())) ? 'Hours' : 'Dates'
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

        // Emit the event for the selected time range
        socket.emit('oee_stats', {
            start_date_oee: formatDate_machine_oee_stats(selectedStartDate_machine_oee_stats || new Date()), // Use selected or default to today
            end_date_oee: formatDate_machine_oee_stats(selectedEndDate_machine_oee_stats || new Date())       // Use selected or default to today
        });

        var dateRangeContainer = document.getElementById('dateRangeContainer_machine_oee_stats');
        var dateDisplayDiv = document.getElementById('DateDisplay_css_machine_oee_stats_div');

        console.log("Time Select Changed:", selectedValue);

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
        var selectedGraph = this.value;
        console.log("Graph Select Changed:", selectedGraph);
        if (isSetDateActive_machine_oee_stats) {
            updateGraph_machine_oee_stats('set-date', selectedGraph, selectedStartDate_machine_oee_stats, selectedEndDate_machine_oee_stats);
        } else {
            updateGraph_machine_oee_stats(document.getElementById('timeSelect_machine_oee_stats').value, selectedGraph);
        }
    });

    // Apply date range for custom selection
    document.getElementById('applyDateRange_machine_oee_stats').addEventListener('click', function () {
        var dateRangePicker = document.getElementById('dateRange_machine_oee_stats')._flatpickr;
        selectedStartDate_machine_oee_stats = dateRangePicker.selectedDates[0];
        selectedEndDate_machine_oee_stats = dateRangePicker.selectedDates[1];

        document.getElementById('startDateDisplay_machine_oee_stats').innerText = `Start Date: ${formatDate_machine_oee_stats(selectedStartDate_machine_oee_stats)}`;
        document.getElementById('endDateDisplay_machine_oee_stats').innerText = `End Date: ${formatDate_machine_oee_stats(selectedEndDate_machine_oee_stats)}`;

        socket.emit('oee_stats', {
            start_date_oee: formatDate_machine_oee_stats(selectedStartDate_machine_oee_stats),
            end_date_oee: formatDate_machine_oee_stats(selectedEndDate_machine_oee_stats)
        });

        updateGraph_machine_oee_stats('set-date', document.getElementById('graphSelect_machine_oee_stats').value, selectedStartDate_machine_oee_stats, selectedEndDate_machine_oee_stats);
    });

    // Initial graph load
    updateGraph_machine_oee_stats('daily', 'power-consumption');
    // ******************* machine_oee_stats script end *******************

    // Nikkys code for running light 
    // *******************running_light graph script start *******************
    let isSetDateActive_running_light_graph = false;
    let selectedStartDate_running_light_graph, selectedEndDate_running_light_graph;
    function formatDate_running_light_graph(date) {
        if (!date) return '';
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }

    // Chart.js context for the graph
    var ctx_running_light_graph = document.getElementById('myChart_running_light_graph').getContext('2d');
    var chart_running_light_graph;
    const blueRedGradient_running_light_graph = ctx_running_light_graph.createLinearGradient(0, 0, 0, 400);
    blueRedGradient_running_light_graph.addColorStop(0, '#2959FF');
    blueRedGradient_running_light_graph.addColorStop(1, '#9EB3FC');
    var greenGradient_running_light_graph = ctx_running_light_graph.createLinearGradient(0, 0, 0, 200);
    greenGradient_running_light_graph.addColorStop(0, '#23D900');
    greenGradient_running_light_graph.addColorStop(1, '#23D400');
    var staticDailyLabels = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);


    let activeTime = [];
    let dateRangeData = { labels: [], data: [] };
    function updateGraph_running_light_graph(timeSelect, graphSelect, startDate, endDate) {
        var labels = [];
        var data = [];
        var yAxisLabel = '';
        var backgroundColor = '';

        if (graphSelect === 'power-consumption') {
            if (timeSelect === 'set-date-running' && startDate && endDate) {
                labels = dateRangeData.labels;
                data = dateRangeData.data;
            } else {
                socket.emit('get_power_consumption');
            }
            yAxisLabel = 'Power Consumption (Wh)';
            backgroundColor = blueRedGradient_running_light_graph;
        } else if (graphSelect === 'power-saving') {
            if (timeSelect === 'set-date-running' && startDate && endDate) {
                labels = dateRangeData.labels;
                data = dateRangeData.data;
            } else {
                socket.emit('get_power_saving');
            }
            yAxisLabel = 'Power Savings (Rupees)';
            backgroundColor = greenGradient_running_light_graph;
        }

        else if (graphSelect === 'active-run-time') {
            if (timeSelect === 'set-date-running' && startDate && endDate) {
                data = activeTime.length > 0 ? activeTime : Array(30).fill(0);
                labels = dateRangeData.labels;
            } else {
                socket.emit('get_active_runtime');
                labels = staticDailyLabels;
                yAxisLabel = 'Active Time (Minutes)';
                data = activeTime.length > 0 ? activeTime : Array(24).fill(0);
            }
        }
        function createChart(labels, data, yAxisLabel, backgroundColor) {
            if (chart_running_light_graph) chart_running_light_graph.destroy();

            chart_running_light_graph = new Chart(ctx_running_light_graph, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
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
                                text: (timeSelect === 'daily' || (isSetDateActive_running_light_graph && selectedStartDate_running_light_graph && selectedEndDate_running_light_graph && selectedStartDate_running_light_graph.toDateString() !== selectedEndDate_running_light_graph.toDateString())) ? '(Dates)' : '(Hours)'
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
        socket.on('power_consumption_data', (data) => {
            const powerValues = Array(24).fill(0);
            data.forEach(item => {
                powerValues[item.hour] = item.power;
            });
            if (graphSelect === 'power-consumption') {
                labels = staticDailyLabels;
                data = powerValues;
                createChart(labels, data, yAxisLabel, backgroundColor);
            }
        });

        socket.on('power_saving_response', function (data) {
            const savingsValues = Array(24).fill(0);
            console.log('Power Saving Data:', data);
            data.forEach(item => {
                savingsValues[item.hour] = item.power;
            });

            if (graphSelect === 'power-saving') {
                const labels = staticDailyLabels;
                console.log('Updated Savings Data for Chart:', savingsValues);
                createChart(labels, savingsValues, 'Power Savings (Rupees)', greenGradient_running_light_graph);
            }
        });

        socket.on('active_runtime_data', (data) => {
            const runtimeValues = Array(24).fill(0);
            data.forEach(item => {
                runtimeValues[item.hour] = item.total_runtime_minutes;
            });
            activeTime = runtimeValues;
            if (document.getElementById('graphSelect_running_light_graph').value === 'active-run-time') {
                createChart(staticDailyLabels, activeTime, 'Active Time (Minutes)', blueRedGradient_running_light_graph);
            }
        });

        socket.on('power_consumption_data_datewise', (data) => {
            console.log('custom power consuption :', data);
            const labels = data.map(item => item.day);
            const powerValues = data.map(item => item.power);
            if (document.getElementById('graphSelect_running_light_graph').value === 'power-consumption') {
                createChart(labels, powerValues, 'Power Consumption (Wh)', blueRedGradient_running_light_graph);
            }
        });

        socket.on('power_saving_custom_data', function (data) {
            const labels = data.map(item => item.date);
            const values = data.map(item => item.powersaving);
            console.log('custom power saving :', data);
            if (document.getElementById('graphSelect_running_light_graph').value === 'power-saving') {
                createChart(labels, values, 'Power Savings (Rupees)', greenGradient_running_light_graph);
            }
        });

        socket.on('Active_Run_custom_data', function (data) {
            const labels = data.map(item => item.date);
            const runtimes = data.map(item => item.total_runtime_minutes);
            if (document.getElementById('graphSelect_running_light_graph').value === 'active-run-time') {
                createChart(labels, runtimes, 'Active Time (Minutes)', blueRedGradient_running_light_graph);
            }
        });

        socket.on('power_consumption_single_response', function (data) {
            if (data.length > 0) {
                const labels = data.map(item => item.hour);
                const powerValues = data.map(item => item.power);
                createChart(labels, powerValues, 'Power Consumption (Wh)', blueRedGradient_running_light_graph);
            } else {
                console.log('No power consumption data received for this date.');
            }
        });

        socket.on('power_saving_single_response', function (data) {
            if (data.length > 0) {
                const labels = data.map(item => item.hour);
                const powerSavingValues = data.map(item => item.power_saving);
                createChart(labels, powerSavingValues, 'Power Saving (Rupees)', greenGradient_running_light_graph);
            } else {
                console.log('No power saving data received for this date.');
            }
        });

        socket.on('active_runtime_single_response', function (data) {
            if (data.length > 0) {
                const labels = data.map(item => item.hour);
                const runtimeValues = data.map(item => item.total_runtime_minutes);
                createChart(labels, runtimeValues, 'Active Run Time (Minutes)', blueRedGradient_running_light_graph);
            } else {
                console.log('No active runtime data received for this date.');
            }
        });


    }

    document.getElementById('timeSelect_running_light_graph').addEventListener('change', function () {
        var selectedValue = this.value;
        var dateRangeContainer = document.getElementById('dateRangeContainer_running_light_graph');
        var dateDisplayDiv = document.getElementById('DateDisplay_css_running_light_graph_div');

        if (selectedValue === 'set-date-running') {
            isSetDateActive_running_light_graph = true;
            dateRangeContainer.style.display = 'block';
            dateDisplayDiv.style.display = 'flex';
        } else {
            isSetDateActive_running_light_graph = false;
            dateRangeContainer.style.display = 'none';
            dateDisplayDiv.style.display = 'none';
            updateGraph_running_light_graph(selectedValue, document.getElementById('graphSelect_running_light_graph').value);
        }
    });

    document.getElementById('graphSelect_running_light_graph').addEventListener('change', function () {
        if (isSetDateActive_running_light_graph) {
            updateGraph_running_light_graph('set-date-running', this.value, selectedStartDate_running_light_graph, selectedEndDate_running_light_graph);
        } else {
            updateGraph_running_light_graph(document.getElementById('timeSelect_running_light_graph').value, this.value);
        }
    });

    document.getElementById('applyDateRange_running_light_graph').addEventListener('click', function () {
        var dateRangePicker = document.getElementById('dateRange_running_light_graph')._flatpickr;
        selectedStartDate_running_light_graph = dateRangePicker.selectedDates[0];
        selectedEndDate_running_light_graph = dateRangePicker.selectedDates[1];
        const formattedStartDate = formatDateToISO(selectedStartDate_running_light_graph);
        const formattedEndDate = formatDateToISO(selectedEndDate_running_light_graph);

        socket.emit('get_data_for_date_range', { startDate: formattedStartDate, endDate: formattedEndDate });
        socket.emit('get_custom_active_run_time', { startDate: formattedStartDate, endDate: formattedEndDate });
        socket.emit('get_custom_power_saving', { startDate: formattedStartDate, endDate: formattedEndDate });


        if (selectedStartDate_running_light_graph.toDateString() === selectedEndDate_running_light_graph.toDateString()) {
            socket.emit('power_consumption_single_date', { selected_date: formattedStartDate });
            socket.emit('power_saving_single_date', { selected_date: formattedStartDate });
            socket.emit('active_runtime_single_date', { selected_date: formattedStartDate });
        }


        document.getElementById('startDateDisplay_running_light_graph').innerText = `Start Date: ${formatDate_running_light_graph(selectedStartDate_running_light_graph)}`;
        document.getElementById('endDateDisplay_running_light_graph').innerText = `End Date: ${formatDate_running_light_graph(selectedEndDate_running_light_graph)}`;
    });

    function formatDateToISO(date) {
        if (!date) return '';
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    // Initial graph load
    updateGraph_running_light_graph('daily', 'power-consumption');
    updateGraph_running_light_graph('daily', 'power-saving');
    updateGraph_running_light_graph('daily', 'active-run-time');
    // ******************* running_light graph script end *******************


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



    // Chart.js context for the graph
    var ctx_ac_device_graph = document.getElementById('myChart_ac_device_graph').getContext('2d');
    var chart_ac_device_graph;


    const blueRedGradient_ac_device_graph = ctx_ac_device_graph.createLinearGradient(0, 0, 0, 400);
    blueRedGradient_ac_device_graph.addColorStop(0, '#2959FF');
    blueRedGradient_ac_device_graph.addColorStop(1, '#9EB3FC');


    var greenGradient_ac_device_graph = ctx_ac_device_graph.createLinearGradient(0, 0, 0, 200);
    greenGradient_ac_device_graph.addColorStop(0, '#23D900');
    greenGradient_ac_device_graph.addColorStop(1, '#23D400');

    var staticDailyLabels = [];

    function generateDateRangeData_ac_device_graph(startDate, endDate, graphType) {
        var labels = [];
        var data = [];


        if (startDate.toDateString() === endDate.toDateString()) {

            labels = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
            data = Array.from({ length: 24 }, () => Math.floor(Math.random() * 100));
        } else {
            var currentDate = new Date(startDate);
            while (currentDate <= endDate) {
                labels.push(currentDate.toLocaleDateString('en-GB'));
                data.push(Math.floor(Math.random() * 100));
                currentDate.setDate(currentDate.getDate() + 1);
            }
        }

        return { labels: labels, data: data };
    }



    // Updated function to calculate active and inactive time for set-date option
    function updateGraph_ac_device_graph(timeSelect, graphSelect, startDate, endDate, customData) {
        var labels = [];
        var data = [];
        var yAxisLabel = '';
        var backgroundColor = '';
        console.log('customData-------------', customData)
        if (graphSelect === 'power-consumption') {
            if (timeSelect === 'set-date-ac' && customData) {

                console.log('customData!!!!!', customData)
                const dateRangeData = generateDateRangeData_ac_device_graph(startDate, endDate, graphSelect, acpower);
                labels = dateRangeData.labels;


                const formatDateToCustomDataKey = (label) => {
                    const parts = label.split('/');
                    // Rearrange parts to 'YYYY-MM-DD'
                    return `${parts[2]}-${parts[1]}-${parts[0]}`;
                };

                data = labels.map(label => {
                    const formattedLabel = formatDateToCustomDataKey(label);

                    return customData[formattedLabel] !== undefined ? customData[formattedLabel] : null;
                });

                console.log('data', data)
            } else {

                labels = staticDailyLabels;
                data = acpower.daily || Array.from({ length: 24 }, () => 0);
            }
            yAxisLabel = 'Power Consumption (Wh)';
            backgroundColor = blueRedGradient_ac_device_graph;
        } else if (graphSelect === 'power-saving') {
            if (timeSelect === 'set-date-ac' && startDate && endDate) {

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

            if (timeSelect === 'set-date-ac' && startDate && endDate) {
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
                            text: (timeSelect === 'daily' || (isSetDateActive_ac_device_graph && selectedStartDate_ac_device_graph && selectedEndDate_ac_device_graph && selectedStartDate_ac_device_graph.toDateString() !== selectedEndDate_ac_device_graph.toDateString())) ? 'Hours' : 'Dates'
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

        if (selectedValue === 'set-date-ac') {
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
            updateGraph_ac_device_graph('set-date-ac', this.value, selectedStartDate_ac_device_graph, selectedEndDate_ac_device_graph);
        } else {
            updateGraph_ac_device_graph(document.getElementById('timeSelect_ac_device_graph').value, this.value);
        }
    });



    function formatDateToISO(date) {
        if (date) {
            return date.toISOString();
        }
        return null;
    }

    document.getElementById('applyDateRange_ac_device_graph').addEventListener('click', function () {
        var dateRangePicker = document.getElementById('dateRange_ac_device_graph')._flatpickr;
        selectedStartDate_ac_device_graph = dateRangePicker.selectedDates[0];
        selectedEndDate_ac_device_graph = dateRangePicker.selectedDates[1];

        console.log('selectedStartDate_ac_device_graph111111111111', selectedStartDate_ac_device_graph)
        console.log('selectedStartDate_ac_device_graph22222222222', selectedEndDate_ac_device_graph)

        const formattedStartDateac = formatDateToISO(selectedStartDate_ac_device_graph);
        const formattedEndDateac = formatDateToISO(selectedEndDate_ac_device_graph);
        socket.emit('acpowerconsumption', { startDate: formattedStartDateac, endDate: formattedEndDateac });
        document.getElementById('startDateDisplay_ac_device_graph').innerText = `Start Date: ${formatDate_ac_device_graph(selectedStartDate_ac_device_graph)}`;
        document.getElementById('endDateDisplay_ac_device_graph').innerText = `End Date: ${formatDate_ac_device_graph(selectedEndDate_ac_device_graph)}`;


    });

    // Initial graph load
    updateGraph_ac_device_graph('daily', 'power-consumption');


    // ******************* air conditioner script start *******************



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
    flatpickr("#dateRange_running_light_graph", {
        mode: "range",
        dateFormat: "d/m/Y",
        onChange: function (selectedDates) {
            console.log("selected_dates:", selectedDates)
            const startDate_running_light_graph = selectedDates[0];
            console.log("startDate_running_light_graph", startDate_running_light_graph)
            const endDate_running_light_graph = selectedDates[1];
            console.log("endDate_running_light_graph", endDate_running_light_graph)
            document.getElementById('startDateDisplay_running_light_graph').innerText = `Start Date: ${formatDate_running_light_graph(startDate_running_light_graph)}`;
            document.getElementById('endDateDisplay_running_light_graph').innerText = `End Date: ${formatDate_running_light_graph(endDate_running_light_graph)}`;
        }
    });
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
    function formatDate_ac_device_graph(date) {
        if (!date) return '';
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }
    
    // Fetch IP and setup Socket.IO connection
    fetchIP()
        .then(ip => setupSocketConnection(ip))
        .catch(error => console.error('Error setting up socket connection:', error));
});








