document.addEventListener('DOMContentLoaded', function () {
    const socket = io('http://192.168.1.12:5007');
    const deviceIds = Array.from(document.querySelectorAll('[data-device-id]')).map(el => el.dataset.deviceId);
    console.log("Device IDs:", deviceIds);

    // Initialize variables for each device
    let charts = {};
    let isSetDateActive = {};
    let selectedStartDate = {};
    let selectedEndDate = {};

    // Utility function to format date
    function formatDate(date) {
        if (!date) return null;
        const parsedDate = new Date(date);
        if (isNaN(parsedDate)) return null;
        const year = parsedDate.getFullYear();
        const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
        const day = String(parsedDate.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function getTodayDate() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today;
    }

    function formatPower(value) {
        return value < 1000
            ? `${value.toFixed(2)} Wh`
            : `${(value / 1000).toFixed(2)} kWh`;
    }

    // Initialize each device
    deviceIds.forEach(deviceId => {
        const timeSelectElem = document.getElementById(`timeSelect_running_${deviceId}`);
        const graphSelectElem = document.getElementById(`graphSelect_running_${deviceId}`);
        const chartElem = document.getElementById(`myChart_${deviceId}`);
        const ctx = chartElem ? chartElem.getContext('2d') : null;
        const dateRangeContainer = document.getElementById(`dateRangeContainer_running_${deviceId}`);
        const dateDisplayDiv = document.getElementById(`DateDisplay_css_running_${deviceId}`);
        const applyDateRangeBtn = document.getElementById(`applyDateRange_running_${deviceId}`);
        const daySelect = document.getElementById(`running_light_power_consumption_weekday_dropdown${deviceId}`);

        if (!ctx) {
            console.error(`Canvas context not found for device ${deviceId}`);
            return;
        }

        // Initialize chart for this device
        charts[deviceId] = null;
        isSetDateActive[deviceId] = false;
        selectedStartDate[deviceId] = null;
        selectedEndDate[deviceId] = null;

        // Initialize date picker
        const input = document.getElementById(`dateRange_running_${deviceId}`);
        if (input) {
            flatpickr(input, {
                mode: "range",
                dateFormat: "d/m/Y",
                onChange: function (selectedDates) {
                    const [startDate, endDate] = selectedDates;
                    if (startDate && endDate) {
                        document.getElementById(`startDateDisplay_running_${deviceId}`).innerText = `Start Date: ${formatDate(startDate)}`;
                        document.getElementById(`endDateDisplay_running_${deviceId}`).innerText = `End Date: ${formatDate(endDate)}`;
                    }
                }
            });
        }

        // Time select change handler
        if (timeSelectElem) {
            timeSelectElem.addEventListener('change', function () {
                const selectedValue = this.value;
                if (selectedValue === 'set-date-individual') {
                    isSetDateActive[deviceId] = true;
                    if (dateRangeContainer) dateRangeContainer.style.display = 'block';
                    if (dateDisplayDiv) dateDisplayDiv.style.display = 'flex';
                } else {
                    isSetDateActive[deviceId] = false;
                    if (dateRangeContainer) dateRangeContainer.style.display = 'none';
                    if (dateDisplayDiv) dateDisplayDiv.style.display = 'none';
                    if (daySelect) daySelect.value = 'all';
                    const selectedGraph = graphSelectElem ? graphSelectElem.value : 'power-consumption';
                    updateGraph(deviceId, selectedValue, selectedGraph);
                }
            });
        }

        // Graph select change handler
        if (graphSelectElem) {
            graphSelectElem.addEventListener('change', function () {
                if (isSetDateActive[deviceId]) {
                    const selectedWeekday = daySelect ? daySelect.value : "all";
                    updateGraph(deviceId, 'set-date-individual', this.value, selectedStartDate[deviceId], selectedEndDate[deviceId], selectedWeekday);
                } else {
                    const timeValue = timeSelectElem ? timeSelectElem.value : 'daily-individual';
                    updateGraph(deviceId, timeValue, this.value);
                }
            });
        }

        // Apply date range button handler
        if (applyDateRangeBtn) {
            applyDateRangeBtn.addEventListener('click', function () {
                const dateRangePicker = document.getElementById(`dateRange_running_${deviceId}`)._flatpickr;
                if (dateRangePicker && dateRangePicker.selectedDates.length === 2) {
                    selectedStartDate[deviceId] = dateRangePicker.selectedDates[0];
                    selectedEndDate[deviceId] = dateRangePicker.selectedDates[1];
                    document.getElementById(`startDateDisplay_running_${deviceId}`).innerText = `Start Date: ${formatDate(selectedStartDate[deviceId])}`;
                    document.getElementById(`endDateDisplay_running_${deviceId}`).innerText = `End Date: ${formatDate(selectedEndDate[deviceId])}`;
                    const selectedGraph = graphSelectElem ? graphSelectElem.value : 'power-consumption';
                    const selectedWeekday = daySelect ? daySelect.value : "all";
                    updateGraph(deviceId, 'set-date-individual', selectedGraph, selectedStartDate[deviceId], selectedEndDate[deviceId], selectedWeekday);
                }
            });
        }

        // Day select change handler
        if (daySelect) {
            daySelect.addEventListener('change', function () {
                const selectedWeekday = this.value;
                const selectedGraph = graphSelectElem ? graphSelectElem.value : 'power-consumption';
                if (selectedStartDate[deviceId] && selectedEndDate[deviceId]) {
                    updateGraph(deviceId, 'set-date-individual', selectedGraph, selectedStartDate[deviceId], selectedEndDate[deviceId], selectedWeekday);
                }
            });
        }

        // Initialize with default graph
        updateGraph(deviceId, 'daily-individual', 'power-consumption');
    });

    // Function to update graph data
    function updateGraph(deviceId, timeSelect, graphSelect, startDate = null, endDate = null, selectedWeekday = null) {
        let today = getTodayDate();

        if (timeSelect === 'daily-individual') {
            startDate = today;
            endDate = today;
        }

        if (timeSelect === 'set-date-individual' && startDate && endDate) {
            startDate = formatDate(startDate);
            endDate = formatDate(endDate);
        }

        const requestData = {
            deviceId: deviceId,
            timeSelect: timeSelect,
            graphSelect: graphSelect,
            startDate: startDate,
            endDate: endDate,
            selectedWeekday: selectedWeekday
        };

        console.log('Emitting graph_data request:', requestData);
        socket.emit('graph_data', requestData);
    }

    // Socket event handler for graph data
    socket.on('graph_data', function (data) {
        console.log('Received graph data:', data);

        // Validate data structure
        if (!data || !data.updatedData || !data.updatedData.deviceId) {
            console.error('Invalid data structure received');
            return;
        }

        if (!data.data || data.data.length === 0) {
            console.log('No data available for graph');
            return;
        }

        const backendDeviceId = data.updatedData.deviceId;
        
        // Check if data is for a valid device
        if (!deviceIds.includes(backendDeviceId)) {
            console.log(`Data received for unknown device: ${backendDeviceId}`);
            return;
        }

        // Update power consumption and savings display
        updatePowerDisplays(backendDeviceId, data.data);

        // Update the chart
        updateChart(backendDeviceId, data);
    });

    // Function to update power displays
    function updatePowerDisplays(deviceId, dataArray) {
        const powerSavingData = dataArray.map(item => item.power_saving || 0);
        const powerConsumptionData = dataArray.map(item => item.power_consumption || 0);
        
        const totalPowerSaving = powerSavingData.reduce((acc, saving) => acc + saving, 0);
        const totalPowerConsumption = powerConsumptionData.reduce((acc, consumption) => acc + consumption, 0);

        // Update power saving display
        const powerSavingElement = document.getElementById(`active_tube_indivisual_${deviceId}`);
        if (powerSavingElement) {
            powerSavingElement.textContent = formatPower(totalPowerSaving);
        }

        // Update power consumption display
        const powerConsumptionElement = document.getElementById(`tube_powerconsumption_${deviceId}`);
        if (powerConsumptionElement) {
            powerConsumptionElement.textContent = formatPower(totalPowerConsumption);
        }
    }

    // Function to update chart
    function updateChart(deviceId, data) {
        const graphSelectElem = document.getElementById(`graphSelect_running_${deviceId}`);
        if (!graphSelectElem) {
            console.error(`Graph select element not found for device ${deviceId}`);
            return;
        }

        const selectedGraph = graphSelectElem.value;
        const chartId = `myChart_${deviceId}`;
        const canvas = document.getElementById(chartId);
        
        if (!canvas) {
            console.error(`Canvas element not found for device ${deviceId}`);
            return;
        }

        const ctx = canvas.getContext('2d');

        // Destroy existing chart if it exists
        if (charts[deviceId]) {
            charts[deviceId].destroy();
        }

        // Process data based on structure
        let labels = [];
        let datasets = [];
        let xAxisLabel = '';
        let yAxisLabel = '';

        const hasHourData = data.data[0].hasOwnProperty('hour');
        const hasDateData = data.data[0].hasOwnProperty('date');

        if (hasHourData) {
            // Hour-based data (daily view)
            const fullHours = Array.from({ length: 24 }, (_, i) => i);
            const hoursWithData = fullHours.map(hour => {
                const hourData = data.data.find(item => item.hour === hour) || {
                    active_run_time: 0,
                    power_consumption: 0,
                    power_saving: 0,
                };
                return {
                    hour: hour,
                    active_run_time: hourData.active_run_time,
                    power_consumption: hourData.power_consumption,
                    power_saving: hourData.power_saving,
                };
            });

            labels = hoursWithData.map(item => `${item.hour}:00`);
            xAxisLabel = 'Hour';
            
            datasets = createDatasets(selectedGraph, hoursWithData, ctx);
        } else if (hasDateData) {
            // Date-based data (range view)
            labels = data.data.map(item => item.date);
            xAxisLabel = 'Date';
            
            datasets = createDatasets(selectedGraph, data.data, ctx);
        }

        // Create chart configuration
        const chartConfig = {
            type: 'bar',
            data: {
                labels: labels,
                datasets: datasets.map((dataset) => {
                    // Apply barThickness for datasets based on label length
                    if (labels.length < 5) {
                        dataset.barThickness = 70;
                    }
                    return dataset;
                }),
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                    },
                    tooltip: {
                        enabled: true,
                        callbacks: {
                            label: function (context) {
                                if (context.dataset.label && context.dataset.label.includes('Power Consumption')) {
                                    const unitLabel = context.dataset.label.includes('kWh') ? 'kWh' : 'Wh';
                                    return `${context.raw.toFixed(2)} ${unitLabel}`;
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
                                    return `${context.dataset.label}: ${formattedTime} (${minutes.toFixed(2)} min)`;
                                }
                                return `${context.dataset.label}: ${context.raw}`;
                            },
                        },
                    },
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: xAxisLabel,
                        },
                    },
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: getYAxisLabel(selectedGraph),
                        },
                    },
                },
            },
        };

        // Create new chart
        charts[deviceId] = new Chart(ctx, chartConfig);

        // Adjust wrapper width dynamically
        const wrapper = ctx.canvas.closest('.main_canvas_wrapper');
        if (wrapper) {
            if (labels.length < 5) {
                wrapper.style.width = '100%';
            } else {
                const calculatedWidth = Math.max(100, 6 * labels.length) + '%';
                wrapper.style.width = calculatedWidth;
            }
        }
    }

    // Function to create datasets based on graph type
    function createDatasets(graphType, dataArray, ctx) {
        const datasets = [];
        
        // Create gradient for power saving
        const greenGradient = ctx.createLinearGradient(0, 0, 0, 200);
        greenGradient.addColorStop(0, '#23D900');
        greenGradient.addColorStop(1, '#23D400');

        switch (graphType) {
            case 'power-consumption':
                const shouldConvertToKWh = dataArray.some(item => item.power_consumption > 1000);
                const convertedData = shouldConvertToKWh
                    ? dataArray.map(item => item.power_consumption / 1000)
                    : dataArray.map(item => item.power_consumption);

                datasets.push({
                    label: shouldConvertToKWh ? 'Power Consumption (kWh)' : 'Power Consumption (Wh)',
                    data: convertedData,
                    backgroundColor: '#2959FF',
                    borderColor: '#2959FF',
                    borderWidth: 1,
                    borderRadius: 50,
                });
                break;

            case 'power-saving':
                // Bar graph dataset
                datasets.push({
                    type: 'bar',
                    label: 'Power Saving (Wh)',
                    data: dataArray.map(item => item.power_saving),
                    backgroundColor: greenGradient,
                    borderColor: greenGradient,
                    borderWidth: 1,
                    borderRadius: 50,
                });

                // Line graph dataset for trend
                datasets.push({
                    type: 'line',
                    label: 'Power Saving Trend',
                    data: dataArray.map(item => item.power_saving),
                    borderColor: '#FF5733',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4,
                    backgroundColor: 'rgba(255, 99, 132, 0.1)',
                });
                break;

            case 'active-run-time':
                datasets.push({
                    label: 'Time (minutes)',
                    data: dataArray.map(item => item.active_run_time),
                    backgroundColor: '#2959FF',
                    borderColor: '#2959FF',
                    borderWidth: 1,
                    borderRadius: 50,
                });
                break;
        }

        return datasets;
    }

    // Function to get Y-axis label
    function getYAxisLabel(graphType) {
        switch (graphType) {
            case 'power-consumption':
                return 'Power Consumption';
            case 'power-saving':
                return 'Power Saving (Wh)';
            case 'active-run-time':
                return 'Time (minutes)';
            default:
                return '';
        }
    }

    // Socket connection handlers
    socket.on('connect', function() {
        console.log('Connected to socket server');
    });

    socket.on('disconnect', function() {
        console.log('Disconnected from socket server');
    });

    socket.on('error', function(error) {
        console.error('Socket error:', error);
    });
});

// Download function (outside of DOMContentLoaded to maintain global scope)
function downloadFileRunning(buttonElement) {
    const deviceId = buttonElement.getAttribute('data-device-id');
    if (!deviceId) {
        alert("Device ID not found.");
        return;
    }

    const timeSelect = document.getElementById(`timeSelect_running_${deviceId}`).value;
    const graphSelect = document.getElementById(`graphSelect_running_${deviceId}`).value;

    let startDate, endDate;

    if (timeSelect === 'set-date-individual') {
        const startDateElement = document.getElementById(`startDateDisplay_running_${deviceId}`);
        const endDateElement = document.getElementById(`endDateDisplay_running_${deviceId}`);

        if (startDateElement && endDateElement) {
            const startDateText = startDateElement.textContent.trim();
            const endDateText = endDateElement.textContent.trim();

            startDate = startDateText.split(': ')[1];
            endDate = endDateText.split(': ')[1];
        } else {
            alert("Date range elements not found. Please select a valid date range.");
            return;
        }
    } else if (timeSelect === 'daily-individual') {
        const today = new Date();
        startDate = formatDate(today);
        endDate = startDate;
    } else {
        alert("Invalid time selection.");
        return;
    }

    if (new Date(startDate) > new Date(endDate)) {
        alert("Start date cannot be later than end date.");
        return;
    }

    const params = {
        startDate: startDate,
        endDate: endDate,
        timeSelect: timeSelect,
        graphSelect: graphSelect,
        device_id: deviceId
    };

    console.log('Download request params:', params);

    fetch('/download_xlsx_individual_office_light', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
    })
    .then(response => {
        if (response.status === 200) {
            return response.blob();
        } else if (response.status === 404) {
            return response.text().then(data => {
                alert(data);
                throw new Error(data);
            });
        } else {
            throw new Error("Unexpected error occurred.");
        }
    })
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `running_light_data_${deviceId}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    })
    .catch(error => {
        console.error("Error downloading file:", error);
        alert("An error occurred while downloading the file.");
    });
}

// Utility function to format date (moved outside for global access)
function formatDate(date) {
    if (!date) return null;
    const parsedDate = new Date(date);
    if (isNaN(parsedDate)) return null;
    return parsedDate.toISOString().split('T')[0];
}