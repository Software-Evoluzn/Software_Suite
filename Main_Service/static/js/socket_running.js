document.addEventListener('DOMContentLoaded', function () {
    const socket = io('http://192.168.0.225:5000');
    const deviceIds = Array.from(document.querySelectorAll('[data-device-id]')).map(el => el.dataset.deviceId);
    console.log("deviceIdsdeviceIdsdeviceIds", deviceIds)

    deviceIds.forEach(deviceId => {
        const timeSelectElem = document.getElementById(`timeSelect_running_${deviceId}`);
        const graphSelectElem = document.getElementById(`graphSelect_running_${deviceId}`);
        const startDateElem = document.getElementById(`startDate_running_${deviceId}`);
        const endDateElem = document.getElementById(`endDate_running_${deviceId}`);
        const chartElem = document.getElementById(`myChart_${deviceId}`);
        const ctx = chartElem ? chartElem.getContext('2d') : null;
        const dateRangeContainer = document.getElementById(`dateRangeContainer_running_${deviceId}`);
        const dateDisplayDiv = document.getElementById(`DateDisplay_css_running_${deviceId}`);
        const applyDateRangeBtn = document.getElementById(`applyDateRange_running_${deviceId}`);
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
        const input = document.getElementById(`dateRange_running_${deviceId}`);
        if (input) {
            flatpickr(input, {
                mode: "range",
                dateFormat: "d/m/Y",
                onChange: function (selectedDates) {
                    const [startDate, endDate] = selectedDates;
                    document.getElementById(`startDateDisplay_running_${deviceId}`).innerText = `Start Date: ${formatDate(startDate)}`;
                    document.getElementById(`endDateDisplay_running_${deviceId}`).innerText = `End Date: ${formatDate(endDate)}`;
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
                const dateRangePicker = document.getElementById(`dateRange_running_${deviceId}`)._flatpickr;
                selectedStartDate[deviceId] = dateRangePicker.selectedDates[0];
                selectedEndDate[deviceId] = dateRangePicker.selectedDates[1];
                document.getElementById(`startDateDisplay_running_${deviceId}`).innerText = `Start Date: ${formatDate(selectedStartDate[deviceId])}`;
                document.getElementById(`endDateDisplay_running_${deviceId}`).innerText = `End Date: ${formatDate(selectedEndDate[deviceId])}`;
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

            socket.emit('graph_data', {
                deviceId: deviceId,
                timeSelect: timeSelect,
                graphSelect: graphSelect,
                startDate: startDate,
                endDate: endDate,
                selectedWeekday: selectedWeekday
            });
        }

        socket.on('graph_data', function (data) {

            // console.log('Received data:', data);
            if (!data.updatedData || !data.updatedData.deviceId) {
                return;
            }
            if (!data || !data.data || data.data.length === 0) {
                // console.log('No valid data found.');
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
                            label: `${yAxisLabel}`,
                            data: dataSource.map(item => item.power_saving),
                            borderColor: '#FF5733', // Trend line color
                            borderWidth: 2,
                            fill: false, // Do not fill under the line
                            tension: 0, // Smooth curve for the line
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
                            type: 'bar', // Bar graph type
                            label: yAxisLabel,
                            data: hoursWithData.map(item => item.power_saving),
                            backgroundColor: greenGradient,
                            borderColor: greenGradient,
                            borderWidth: 1,
                            borderRadius: 50,
                        });

                        // Line graph dataset
                        datasets.push({
                            type: 'line', // Line graph type
                            label: `${yAxisLabel}`,
                            data: hoursWithData.map(item => item.power_saving),
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
                const graphSelectElem = document.getElementById(`graphSelect_running_${deviceId}`);
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
                            max: 48,
                            ticks: {
                                stepSize: 4,
                                callback: function (value) {
                                    return value;
                                },
                            },
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
                        datasets: datasets.map((dataset) => {
                            // Apply barThickness for datasets based on label length
                            if (labels.length < 5) {
                                dataset.barThickness = 70;
                            } else {
                                delete dataset.barThickness; // Ensure no barThickness override for larger labels
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

                // Adjust the wrapper width dynamically
                const wrapper = ctx.canvas.closest('.main_canvas_wrapper');
                if (labels.length < 5) {
                    wrapper.style.width = '100%';
                } else {
                    const calculatedWidth = Math.max(100, 6 * labels.length) + '%'; // Dynamic width calculation
                    wrapper.style.width = calculatedWidth;
                }

            }
        });



        const daySelect = document.getElementById(`running_light_power_consumption_weekday_dropdown${deviceId}`);
        daySelect.addEventListener('change', function () {
            const selectedWeekday = daySelect.value;
            console.log(selectedWeekday, "selectedWeekday")
            const selectedGraph = document.getElementById(`graphSelect_running_${deviceId}`).value;
            const dateRangePicker = document.getElementById(`dateRange_running_${deviceId}`)._flatpickr;
            selectedStartDate[deviceId] = dateRangePicker.selectedDates[0];
            selectedEndDate[deviceId] = dateRangePicker.selectedDates[1];
            document.getElementById(`startDateDisplay_running_${deviceId}`).innerText = `Start Date: ${formatDate(selectedStartDate[deviceId])}`;
            document.getElementById(`endDateDisplay_running_${deviceId}`).innerText = `End Date: ${formatDate(selectedEndDate[deviceId])}`;
            updateGraph('set-date-individual', selectedGraph, selectedStartDate[deviceId], selectedEndDate[deviceId], selectedWeekday);
        });


        document.getElementById(`timeSelect_running_${deviceId}`).addEventListener('change', function () {
            const selectedValue = this.value;
            const dateRangeContainer = document.getElementById(`dateRangeContainer_running_${deviceId}`);
            const dateDisplayDiv = document.getElementById(`DateDisplay_css_running_${deviceId}`);

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
                updateGraph(selectedValue, document.getElementById(`graphSelect_running_${deviceId}`).value);
            }
        });


        document.getElementById(`graphSelect_running_${deviceId}`).addEventListener('change', function () {
            if (isSetDateActive[deviceId]) {
                const selectedWeekday = daySelect ? daySelect.value : "all";
                updateGraph('set-date-individual', this.value, selectedStartDate[deviceId], selectedEndDate[deviceId], selectedWeekday);
            } else {
                updateGraph(document.getElementById(`timeSelect_running_${deviceId}`).value, this.value);
            };
        });
        document.getElementById(`applyDateRange_running_${deviceId}`).addEventListener('click', function () {
            const dateRangePicker = document.getElementById(`dateRange_running_${deviceId}`)._flatpickr;
            selectedStartDate[deviceId] = dateRangePicker.selectedDates[0];
            selectedEndDate[deviceId] = dateRangePicker.selectedDates[1];
            document.getElementById(`startDateDisplay_running_${deviceId}`).innerText = `Start Date: ${formatDate(selectedStartDate[deviceId])}`;
            document.getElementById(`endDateDisplay_running_${deviceId}`).innerText = `End Date: ${formatDate(selectedEndDate[deviceId])}`;
            const selectedWeekday = daySelect ? daySelect.value : "all"; // Ensure `daySelect` is checked
            updateGraph('set-date-individual', document.getElementById(`graphSelect_running_${deviceId}`).value, selectedStartDate[deviceId], selectedEndDate[deviceId], selectedWeekday);
        });
        updateGraph('daily-individual', 'power-consumption');
    });


    socket.on('office', function (data_office) {
        console.log('Received office data:', data_office);
        handleOfficeData(data_office);
    });

    function handleOfficeData(data_office) {
        console.log('officeDATA', data_office);

        // 🚨 Only handle valid payloads that start with 'device_id:'
        if (typeof data_office === 'string' && data_office.startsWith("device_id:")) {
            const deviceData = data_office.split(":");

            if (deviceData.length >= 9) {
                const intensityValue = deviceData[2];
                const switchStatus = deviceData[3];   // e.g. 1 or 0
                const deviceId = deviceData[8];       // e.g. officeF0BF09

                const checkbox = document.getElementById(`${deviceId}/control`);
                if (checkbox) {
                    checkbox.checked = switchStatus === "1";

                    const statusBox = document.getElementById(`office_${deviceId}`);
                    if (statusBox) {
                        statusBox.style.backgroundColor = checkbox.checked ? '#3965ff' : '#f3f3f3';
                    }

                    console.log("inside toggle switch", checkbox.checked, deviceId);
                } else {
                    console.warn(`Checkbox not found for ID: ${deviceId}/control`);
                }



                // 🔁 Update range slider
                const rangeSlider = document.getElementById(`officerangeValueIndividual_${deviceId}`);
                if (rangeSlider) {
                    rangeSlider.value = intensityValue;
                } else {
                    console.warn(`Range slider not found: officerangeValueIndividual_${deviceId}`);
                }

                // 🔁 Update intensity percentage display
                const percentDisplay = document.getElementById(`officerangeDisplayIndividual_${deviceId}`);
                if (percentDisplay) {
                    percentDisplay.textContent = `${intensityValue}%`;
                } else {
                    console.warn(`Percent display not found: officerangeDisplayIndividual_${deviceId}`);
                }

                // ✅ Remove the listener only after successful toggle
                socket.off('office', handleOfficeData);
            } else {
                console.warn("deviceData format unexpected:", deviceData);
            }
        } else {
            console.warn("Skipped invalid office data:", data_office);
        }
    }

    // 🔁 Range slider for individual office light intensity
    const sliders = document.querySelectorAll(".dashboard_smart_led1_range2");

    sliders.forEach((slider) => {
        const sliderId = slider.id;
        const deviceId = sliderId.replace("officerangeValueIndividual_", "");

        // Live UI feedback
        slider.addEventListener("input", function () {
            const intensity = slider.value;
            const display = document.getElementById(`rangeDisplayIndividual_${deviceId}`);
            const percentDisplay = document.getElementById(`officerangeDisplayIndividual_${deviceId}`);

            if (display) display.textContent = `${intensity}%`;
            if (percentDisplay) percentDisplay.textContent = `${intensity}%`;
        });

        // Backend update only when change is complete
        slider.addEventListener("change", function () {
            const intensity = slider.value;
            updateIntensity(deviceId, intensity);
        });
    });



    function updateIntensity(deviceId, intensityValue) {

        const cleanDeviceId = deviceId.replace(/^officeoffice/, "office");
        const topic = `${cleanDeviceId}/control`; // Adjust based on your MQTT topic structure

        fetch("/intensity_office_individual", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                topic: topic,
                ledIntensity: intensityValue,
            }),
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.success) {
                    console.log(`✅ Intensity updated for ${deviceId}`);
                } else {
                    console.error(`❌ Error for ${deviceId}:`, data.error);
                }
            })
            .catch((error) => {
                console.error(`❌ Fetch failed for ${deviceId}:`, error);
            });
    }

});


function downloadFileRunning(buttonElement) {
    const deviceId = buttonElement.getAttribute('data-device-id');
    if (!deviceId) {
        alert("Device ID not found.");
        return;
    }

    const timeSelect = document.getElementById(`timeSelect_running_${deviceId}`).value;
    console.log('timeselect', timeSelect);
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

    console.log('Final Params:', {
        startDate: startDate,
        endDate: endDate,
        timeSelect: timeSelect,
        graphSelect: graphSelect,
        device_id: deviceId
    });

    const params = {
        startDate: startDate,
        endDate: endDate,
        timeSelect: timeSelect,
        graphSelect: graphSelect,
        device_id: deviceId
    };
    console.log('Request Params:', params);

    const urlEndpoint = '/download_xlsx_individual_office_light';

    fetch(urlEndpoint, {
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
                    console.log('datatattatatata', data)
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
            console.log('a', a)
            a.href = url;

            a.download = `running_light_data_${deviceId}.xlsx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        })
        .catch(error => {
            console.error("Error downloading file:", error);
            alert("An error occurred while downloading the file.");
        });
}

// Utility function to format the date
function formatDate(date) {
    if (!date) return null;
    const parsedDate = new Date(date);
    if (isNaN(parsedDate)) return null;
    return parsedDate.toISOString().split('T')[0];
}

