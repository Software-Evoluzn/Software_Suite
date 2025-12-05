document.addEventListener('DOMContentLoaded', function () {
    const socket = io('http://192.168.0.225:5002');

    // Global dictionary to track each SlaveId's status
    let deviceStatus = {};
    deviceStatus_autoBrightness = {};
    deviceStatus_autoMotion = {};

    socket.on('loraTx', function (data) {
        if (data && data.length >= 16) {
            console.log("Extracted data:", data);

            const MasterId = data[1];
            const SlaveId = data[2];
            const intensity = parseInt(data[4]);
            const autoBrightness = parseInt(data[7]);
            const autoMotion = parseInt(data[8]);

            console.log("MasterId....", MasterId);
            console.log("SlaveId....", SlaveId);
            console.log("intensity.....", intensity);
            console.log("autoBrightness", autoBrightness);
            console.log("autoMotion", autoMotion);

            updateSlider(SlaveId, intensity, autoBrightness);

            deviceStatus[SlaveId] = intensity;
            deviceStatus_autoBrightness[SlaveId] = autoBrightness;
            deviceStatus_autoMotion[SlaveId] = autoMotion;


            updateGlobalCheckbox();
            const checkbox = document.getElementById(`${SlaveId}`);
            const checkbox_Auto = document.getElementById(`${SlaveId}:I`);
            const checkbox_Auto_Motion = document.getElementById(`${SlaveId}:M`);

            if (checkbox) {
                checkbox.checked = intensity > 0;
                document.getElementById(`tube_${SlaveId}`).style.backgroundColor = intensity > 0 ? '#3965ff' : '#f9f9f9';
            }
            if (checkbox_Auto) {
                checkbox_Auto.checked = autoBrightness > 0;
            }
            if (checkbox_Auto_Motion) {
                checkbox_Auto_Motion.checked = autoMotion > 0;
            }
        }
    });

    function updateGlobalCheckbox() {
        let globalOn = Object.values(deviceStatus).some(status => status > 0); 
        let globalOn_autoBrightness = Object.values(deviceStatus_autoBrightness).some(status => status > 0);
        let globalOn_autoMotion = Object.values(deviceStatus_autoMotion).some(status => status > 0);

        const globalCheckbox = document.getElementById("T:02:GG:I:0:");
        if (globalCheckbox) {
            globalCheckbox.checked = globalOn;
        }

        const checkbox_autoBrightness = document.getElementById('T:02:GG:I:1:');
         if (checkbox_autoBrightness) {
            checkbox_autoBrightness.checked = globalOn_autoBrightness;
            } 


        // const checkbox_globalOn_autoMotion = document.getElementById('T:02:GG:M:');
        // if (checkbox_globalOn_autoMotion) {
        //     checkbox_globalOn_autoMotion.checked = globalOn_autoMotion;
        // }
    }

    function updateSlider(SlaveId,intensity,autoBrightness) {
        const rangeInput = document.getElementById(`rangeValueIndividual_${SlaveId}`);
        const rangeDisplay = document.getElementById(`rangeDisplayIndividual_${SlaveId}`);
        if (rangeInput && rangeDisplay) {
            const intensityValue = parseInt(intensity, 10);
            console.log('Intensity Value:', intensityValue, typeof(intensityValue));
            rangeInput.value = intensityValue;
            rangeDisplay.textContent = `${intensityValue} %`;
            rangeInput.addEventListener('input', () => {
                rangeDisplay.textContent = `${rangeInput.value} %`;
            });
        }  
        
    
    }
    
        const deviceIds = Array.from(document.querySelectorAll('[data-device-id]')).map(el => el.dataset.deviceId);
        console.log("deviceIdsdeviceIdsdeviceIds", deviceIds)
        deviceIds.forEach(deviceId => {
            const timeSelectElem = document.getElementById(`timeSelect_hi_bay_${deviceId}`);
            const graphSelectElem = document.getElementById(`graphSelect_hi_bay_${deviceId}`);
            const startDateElem = document.getElementById(`startDate_hi_bay_${deviceId}`);
            const endDateElem = document.getElementById(`endDate_hi_bay_${deviceId}`);
            const chartElem = document.getElementById(`myChart_${deviceId}`);
            const ctx = chartElem ? chartElem.getContext('2d') : null;
            const dateRangeContainer = document.getElementById(`dateRangeContainer_hi_bay_${deviceId}`);
            const dateDisplayDiv = document.getElementById(`DateDisplay_css_hi_bay_${deviceId}`);
            const applyDateRangeBtn = document.getElementById(`applyDateRange_hi_bay_${deviceId}`);
            const greenGradient = ctx.createLinearGradient(0, 0, 0, 200);
            greenGradient.addColorStop(0, '#23D900');
            greenGradient.addColorStop(1, '#23D400');
    
            let chart = null;
            let isSetDateActive = {};
            let selectedStartDate = {};
            let selectedEndDate = {};
    
            function formatDate(date) {
                const d = new Date(date);
                let month = (d.getMonth() + 1).toString().padStart(2, '0');
                let day = d.getDate().toString().padStart(2, '0');
                let year = d.getFullYear();
                return `${year}-${month}-${day}`;
            }
            function getTodayDate() {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return today;
            }
            const input = document.getElementById(`dateRange_hi_bay_${deviceId}`);
            if (input) {
                flatpickr(input, {
                    mode: "range",
                    dateFormat: "d/m/Y",
                    onChange: function (selectedDates) {
                        const [startDate, endDate] = selectedDates;
                        document.getElementById(`startDateDisplay_hi_bay_${deviceId}`).innerText = `Start Date: ${formatDate(startDate)}`;
                        document.getElementById(`endDateDisplay_hi_bay_${deviceId}`).innerText = `End Date: ${formatDate(endDate)}`;
                    }
                });
            }
            if (timeSelectElem) {
                timeSelectElem.addEventListener('change', function () {
                    const selectedValue = this.value;
                    if (selectedValue === 'set-date-individual') {
                        isSetDateActive[deviceId] = true;
                        dateRangeContainer.style.display = 'block';
                        dateDisplayDiv.style.display = 'flex';
                    } else {
                        isSetDateActive[deviceId] = false;
                        dateRangeContainer.style.display = 'none';
                        dateDisplayDiv.style.display = 'none';
                        const selectedGraph = graphSelectElem ? graphSelectElem.value : 'power-consumption';
                        updateGraph(selectedValue, selectedGraph);
                    };
                });
            }
            if (applyDateRangeBtn) {
                applyDateRangeBtn.addEventListener('click', function () {
                    const dateRangePicker = document.getElementById(`dateRange_hi_bay_${deviceId}`)._flatpickr;
                    selectedStartDate[deviceId] = dateRangePicker.selectedDates[0];
                    selectedEndDate[deviceId] = dateRangePicker.selectedDates[1];
                    document.getElementById(`startDateDisplay_hi_bay_${deviceId}`).innerText = `Start Date: ${formatDate(selectedStartDate[deviceId])}`;
                    document.getElementById(`endDateDisplay_hi_bay_${deviceId}`).innerText = `End Date: ${formatDate(selectedEndDate[deviceId])}`;
                    const selectedGraph = graphSelectElem ? graphSelectElem.value : 'power-consumption';
                    updateGraph('set-date-individual', selectedGraph, selectedStartDate[deviceId], selectedEndDate[deviceId]);
                });
            }
    
    
            function updateGraph(timeSelect, graphSelect, startDate = null, endDate = null, selectedWeekday = null) {
                let today = getTodayDate();
    
                if (timeSelect === 'daily-individual') {
                    startDate = today;
                    endDate = today;
                }
    
                if (timeSelect === 'set-date-individual' && startDate && endDate) {
                    startDate = formatDate(startDate);
                    endDate = formatDate(endDate);
                } else {
                    startDate = null;
                    endDate = null;
                }
    
                socket.emit('highbay_light_graph_data_individual', {
                    deviceId: deviceId,
                    timeSelect: timeSelect,
                    graphSelect: graphSelect,
                    startDate: startDate,
                    endDate: endDate,
                    selectedWeekday: selectedWeekday
    
                });
    
            }
            
            // socket.off('highbay_light_graph_data_individual');
            socket.on('highbay_light_graph_data_individual', function (data) {
                console.log('Received data:', data);
                // console.log('data.length',data.length)


                if (!data.updatedData || !data.updatedData.deviceId) {
                    console.log('data.length', data.length);
                    return;
                }
                if (!data || !data.data || data.data.length === 0) {
                    console.log('No valid data found.',data);
                    return;
                }
                const backendDeviceId = data.updatedData.deviceId;
                if (backendDeviceId !== deviceId) {
                    // console.log(`Data received for device ${backendDeviceId}, but current device is ${deviceId}`);
                    return;
                }
                const powerSavingData = data.data.map(item => item.power_saving || 0);
                const powerConsumptionData = data.data.map(item => item.power_consumption || 0);
                const totalPowerSaving = powerSavingData.reduce((acc, saving) => acc + saving, 0);
                const totalPowerConsumption = powerConsumptionData.reduce((acc, consumption) => acc + consumption, 0);
                function formatPower(value) {
                    return value < 1000
                        ? `${value.toFixed(2)} Wh`
                        : `${(value / 1000).toFixed(2)} kWh`;
                }
                const powerSavingElement = document.getElementById(`active_tube_indivisual_${deviceId}`);
                if (powerSavingElement) {
                    powerSavingElement.textContent = formatPower(totalPowerSaving);
                } else {
                    console.log(`Element with ID active_tube_indivisual_${deviceId} not found.`);
                }
                const powerConsumptionElement = document.getElementById(`tube_powerconsumption_${deviceId}`);
                if (powerConsumptionElement) {
                    powerConsumptionElement.textContent = formatPower(totalPowerConsumption);
                } else {
                    console.log(`Element with ID tube_powerconsumption_${deviceId} not found.`);
                }
                let graphData;
                let labels = [];
                const datasets = [];
                let yAxisLabel = '';
                let xAxisLabel = 'Hour';
                let yAxisConfig;
                if (data.data[0].hasOwnProperty('hour')) {
                    graphData = data.data.map(item => ({
                        hour: item.hour,
                        active_run_time: item.active_run_time,
                        power_consumption: item.power_consumption,
                        power_saving: item.power_saving,
                    }));
                    const fullHours = Array.from({ length: 24 }, (_, i) => i);
                    const hoursWithData = fullHours.map(hour => {
                        const hourData = graphData.find(item => item.hour === hour) || {
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
                    if (graphSelectElem) {
                        const selectedGraph = graphSelectElem.value;
                        if (selectedGraph === 'power-consumption') {
                            const shouldConvertToKWh = hoursWithData.some(item => item.power_consumption > 1000);
                            const convertedData = shouldConvertToKWh
                                ? hoursWithData.map(item => item.power_consumption / 1000)
                                : hoursWithData.map(item => item.power_consumption);
                            const unitLabel = shouldConvertToKWh ? 'kWh' : 'Wh';
                            yAxisLabel = `Power Consumption (${unitLabel})`;
    
                            datasets.push({
                                label: yAxisLabel,
                                data: convertedData,
                                backgroundColor: '#2959FF',
                                borderColor: '#2959FF',
                                borderWidth: 1,
                                borderRadius: 50,
                            });
                        } else if (selectedGraph === 'power-saving') {
                            yAxisLabel = 'Power Saving (Wh)';
    
                            // Determine if data is from set range
                            const dataSource = data.data[0].hasOwnProperty('date') ? graphData : hoursWithData;
    
                            // Bar graph dataset
                            datasets.push({
                                type: 'bar', // Bar graph type
                                label: yAxisLabel,
                                data: dataSource.map(item => item.power_saving),
                                backgroundColor: greenGradient,
                                borderColor: greenGradient,
                                borderWidth: 1,
                                borderRadius: 50,
                            });
    
                            // Line graph dataset
                            datasets.push({
                                type: 'line', // Line graph type
                                label: `${yAxisLabel} (Trend)`,
                                data: dataSource.map(item => item.power_saving),
                                borderColor: '#FF5733', // Trend line color
                                borderWidth: 2,
                                fill: false, // Do not fill under the line
                                tension: 0.4, // Smooth curve for the line
                                backgroundColor: 'rgba(255, 99, 132, 1)',
                            });
    
                        } else if (selectedGraph === 'active-run-time') {
                            yAxisLabel = 'Time (minutes)';
                            datasets.push({
                                label: yAxisLabel,
                                data: hoursWithData.map(item => item.active_run_time),
                                backgroundColor: '#2959FF',
                                borderColor: '#2959FF',
                                borderWidth: 1,
                                borderRadius: 50,
                            });
                        };
                    }
                } else if (data.data[0].hasOwnProperty('date')) {
                    graphData = data.data.map(item => ({
                        date: item.date,
                        active_run_time: item.active_run_time,
                        power_consumption: item.power_consumption,
                        power_saving: item.power_saving,
                    }));
                    labels = graphData.map(item => item.date);
                    xAxisLabel = 'Date';
                    if (graphSelectElem) {
                        const selectedGraph = graphSelectElem.value;
                        if (selectedGraph === 'power-consumption') {
                            const shouldConvertToKWh = graphData.some(item => item.power_consumption > 1000);
                            const convertedData = shouldConvertToKWh
                                ? graphData.map(item => item.power_consumption / 1000)
                                : graphData.map(item => item.power_consumption);
    
                            const unitLabel = shouldConvertToKWh ? 'kWh' : 'Wh';
                            yAxisLabel = `Power Consumption (${unitLabel})`;
                            datasets.push({
                                label: yAxisLabel,
                                data: convertedData,
                                backgroundColor: '#2959FF',
                                borderColor: '#2959FF',
                                borderWidth: 1,
                                borderRadius: 50,
                            });
                        } else if (selectedGraph === 'power-saving') {
                            yAxisLabel = 'Power Saving (Wh)';
    
                            // Determine if data is from set range
                            const dataSource = data.data[0].hasOwnProperty('date') ? graphData : hoursWithData;
    
                            // Bar graph dataset
                            datasets.push({
                                type: 'bar', // Bar graph type
                                label: yAxisLabel,
                                data: dataSource.map(item => item.power_saving),
                                backgroundColor: greenGradient,
                                borderColor: greenGradient,
                                borderWidth: 1,
                                borderRadius: 50,
                            });
    
                            // Line graph dataset
                            datasets.push({
                                type: 'line', // Line graph type
                                label: `${yAxisLabel} (Trend)`,
                                data: dataSource.map(item => item.power_saving),
                                borderColor: '#FF5733',
                                borderWidth: 2,
                                fill: false,
                                tension: 0.4,
                                backgroundColor: 'rgba(255, 99, 132, 1)',
                            });
    
                        } else if (selectedGraph === 'active-run-time') {
                            yAxisLabel = 'Time (minutes)';
                            datasets.push({
                                label: yAxisLabel,
                                data: graphData.map(item => item.active_run_time),
                                backgroundColor: '#2959FF',
                                borderColor: '#2959FF',
                                borderWidth: 1,
                                borderRadius: 50,
    
                            });
                        };
                    }
                }
                else if (filteredData[0].hasOwnProperty('date')) {
                    graphData = filteredData.map(item => ({
                        date: item.date,
                        active_run_time: item.active_run_time,
                        power_consumption: item.power_consumption,
                        power_saving: item.power_saving,
                    }));
                    labels = graphData.map(item => item.date);
                    xAxisLabel = 'Date';
                    if (graphSelectElem) {
                        const selectedGraph = graphSelectElem.value;
                        if (selectedGraph === 'power-consumption') {
                            const shouldConvertToKWh = graphData.some(item => item.power_consumption > 1000);
                            const convertedData = shouldConvertToKWh
                                ? graphData.map(item => item.power_consumption / 1000)
                                : graphData.map(item => item.power_consumption);
    
                            const unitLabel = shouldConvertToKWh ? 'kWh' : 'Wh';
                            yAxisLabel = `Power Consumption (${unitLabel})`;
                            datasets.push({
                                label: yAxisLabel,
                                data: convertedData,
                                backgroundColor: '#2959FF',
                                borderColor: '#2959FF',
                                borderWidth: 1,
                                borderRadius: 50,
                            });
                        } else if (selectedGraph === 'power-saving') {
                            yAxisLabel = 'Power Saving (Wh)';
    
                            // Bar graph dataset
                            datasets.push({
                                type: 'bar',
                                label: yAxisLabel,
                                data: hoursWithData.map(item => item.power_saving),
                                backgroundColor: greenGradient,
                                borderColor: greenGradient,
                                borderWidth: 1,
                                borderRadius: 50,
                            });
    
                            // Line graph dataset
                            datasets.push({
                                type: 'line',
                                label: `${yAxisLabel} (Trend)`,
                                data: hoursWithData.map(item => item.power_saving),
                                borderColor: '#FF5733',
                                borderWidth: 2,
                                fill: false,
                                tension: 0.4,
                                backgroundColor: 'rgba(255, 99, 132, 1)',
                            });
    
                        } else if (selectedGraph === 'active-run-time') {
                            yAxisLabel = 'Time (minutes)';
                            datasets.push({
                                label: yAxisLabel,
                                data: graphData.map(item => item.active_run_time),
                                backgroundColor: '#2959FF',
                                borderColor: '#2959FF',
                                borderWidth: 1,
                                borderRadius: 50,
                            });
                        };
                    };
                };
    
                const newChartData = {
                    labels: data.labels,
                    datasets: data.datasets
                };
                updateChart(newChartData, deviceId);
    
                function updateChart(newChartData, deviceId) {
                    const graphSelectElem = document.getElementById(`graphSelect_hi_bay_${deviceId}`);
                    if (!graphSelectElem) {
                        console.error('Graph select element not found.');
                        return;
                    }
                    const selectedGraph = graphSelectElem.value;
                    var chartId = 'myChart_' + deviceId;
                    var canvas = document.getElementById(chartId);
                    if (!canvas) {
                        console.error("Canvas element not found for device ID:", deviceId);
                        return;
                    }
                    var ctx = canvas.getContext('2d');
                    if (Chart.getChart(chartId)) {
                        Chart.getChart(chartId).destroy();
                    }
                    let yAxisConfig = {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: yAxisLabel,
                        },
                    };
                    if (data.data[0].hasOwnProperty('hour')) {
                        if (selectedGraph === 'power-consumption' || selectedGraph === 'power-saving') {
                            yAxisConfig = {
                                yAxisConfig,
                                min: 0,
                                // max: 200,
                                // ticks: {
                                //     stepSize: 4,
                                //     callback: function (value) {
                                //         return value;
                                //     },
                                // },
                            };
                        }
                    } else if (data.data[0].hasOwnProperty('date')) {
                        graphData = data.data.map(item => ({
                            date: item.date,
                            active_run_time: item.active_run_time,
                            power_consumption: item.power_consumption,
                            power_saving: item.power_saving,
                        }));
                    }
                    chart = new Chart(ctx, {
                        type: 'bar',
                        data: {
                            labels: labels,
                            datasets: datasets,
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    display: true,
                                    position: 'top',
                                },
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
                                    enabled: true,
                                    callbacks: {
                                        label: function (context) {
                                            if (context.dataset.label.includes('Power Consumption')) {
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
                                                return `${context.dataset.label}: ${formattedTime} /(${minutes.toFixed(2)} min)`;
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
                                y: yAxisConfig,
                            },
                        },
                    });
                }
            });
    
            const daySelect = document.getElementById(`hi_bay_light_power_consumption_weekday_dropdown${deviceId}`);
            daySelect.addEventListener('change', function () {
                const selectedWeekday = daySelect.value;
                console.log(selectedWeekday, "selectedWeekday")
                const selectedGraph = document.getElementById(`graphSelect_hi_bay_${deviceId}`).value;
                const dateRangePicker = document.getElementById(`dateRange_hi_bay_${deviceId}`)._flatpickr;
                selectedStartDate[deviceId] = dateRangePicker.selectedDates[0];
                selectedEndDate[deviceId] = dateRangePicker.selectedDates[1];
                document.getElementById(`startDateDisplay_hi_bay_${deviceId}`).innerText = `Start Date: ${formatDate(selectedStartDate[deviceId])}`;
                document.getElementById(`endDateDisplay_hi_bay_${deviceId}`).innerText = `End Date: ${formatDate(selectedEndDate[deviceId])}`;
                updateGraph('set-date-individual', selectedGraph, selectedStartDate[deviceId], selectedEndDate[deviceId], selectedWeekday);
            });
    
    
            document.getElementById(`timeSelect_hi_bay_${deviceId}`).addEventListener('change', function () {
                const selectedValue = this.value;
                const dateRangeContainer = document.getElementById(`dateRangeContainer_hi_bay_${deviceId}`);
                const dateDisplayDiv = document.getElementById(`DateDisplay_css_hi_bay_${deviceId}`);
    
                if (selectedValue === 'set-date-individual') {
                    isSetDateActive[deviceId] = true;
                    dateRangeContainer.style.display = 'block';
                    dateDisplayDiv.style.display = 'flex';
                } else {
                    isSetDateActive[deviceId] = false;
                    dateRangeContainer.style.display = 'none';
                    dateDisplayDiv.style.display = 'none';
                    if (daySelect) { daySelect.value = 'all'; }
                }
    
                if (selectedValue !== 'set-date-individual') {
                    updateGraph(selectedValue, document.getElementById(`graphSelect_hi_bay_${deviceId}`).value);
                }
            });

            document.getElementById(`graphSelect_hi_bay_${deviceId}`).addEventListener('change', function () {
                if (isSetDateActive[deviceId]) {
                    const selectedWeekday = daySelect ? daySelect.value : "all";
                    updateGraph('set-date-individual', this.value, selectedStartDate[deviceId], selectedEndDate[deviceId], selectedWeekday);
                } else {
                    updateGraph(document.getElementById(`timeSelect_hi_bay_${deviceId}`).value, this.value);
                };
            });
            document.getElementById(`applyDateRange_hi_bay_${deviceId}`).addEventListener('click', function () {
                const dateRangePicker = document.getElementById(`dateRange_hi_bay_${deviceId}`)._flatpickr;
                selectedStartDate[deviceId] = dateRangePicker.selectedDates[0];
                selectedEndDate[deviceId] = dateRangePicker.selectedDates[1];
                document.getElementById(`startDateDisplay_hi_bay_${deviceId}`).innerText = `Start Date: ${formatDate(selectedStartDate[deviceId])}`;
                document.getElementById(`endDateDisplay_hi_bay_${deviceId}`).innerText = `End Date: ${formatDate(selectedEndDate[deviceId])}`;
                const selectedWeekday = daySelect ? daySelect.value : "all"; // Ensure `daySelect` is checked
                updateGraph('set-date-individual', document.getElementById(`graphSelect_hi_bay_${deviceId}`).value, selectedStartDate[deviceId], selectedEndDate[deviceId], selectedWeekday);
            });
            updateGraph('daily-individual', 'power-consumption');
        });
    });
    
    // downloadFilehi_bay................................................
    function downloadFilehi_bay(buttonElement) {
        const deviceId = buttonElement.getAttribute('data-device-id');
        if (!deviceId) {
            alert("Device ID not found.");
            return;
        }
        const timeSelect = document.getElementById(`timeSelect_hi_bay_${deviceId}`).value;
        console.log('timeselect-----', timeSelect);
        const graphSelect = document.getElementById(`graphSelect_hi_bay_${deviceId}`).value;
        let startDate, endDate;
        if (timeSelect === 'set-date-individual') {
            const startDateElement = document.getElementById(`startDateDisplay_hi_bay_${deviceId}`);
            const endDateElement = document.getElementById(`endDateDisplay_hi_bay_${deviceId}`);
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
    
        console.log('Final Params:', {
            startDate: startDate,
            endDate: endDate,
            timeSelect: timeSelect,
            graphSelect: graphSelect,
            slave_id: deviceId
        });
    
        const params = {
            startDate: startDate,
            endDate: endDate,
            timeSelect: timeSelect,
            graphSelect: graphSelect,
            slave_id: deviceId
        };
        console.log('Request Params:', params);
    
        const urlEndpoint = '/download_xlsx_indivisual_hi_bay_light';
    
        fetch(urlEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(params),
        })
            .then(response => {
                if (response.status === 200) {
                    console.log('response....',response)
                    return response.blob();
                } else if (response.status === 404) {
                    return response.text().then(data => {
                        console.log('datatattatatata', data)
                        alert(data);
                        throw new Error(data);
                    });
                } else {
                    throw new Error("For Single Date Pdf Not Download Try to Debug the code and solve the proble bro Nikky...");
                }
            })
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                console.log('a', a)
                a.href = url;
    
                a.download = `hi_bay_light_data_${deviceId}.xlsx`;
                document.body.appendChild(a);
                a.click();
                a.remove();
            })
            .catch(error => {
                console.error("Error downloading file:", error);
                alert(error.message || "An error occurred while downloading the file.");
            });
            
    }
    
    // Utility function to format the date
    function formatDate(date) {
        if (!date) return null;
        const parsedDate = new Date(date);
        if (isNaN(parsedDate)) return null;
        return parsedDate.toISOString().split('T')[0];
    }
