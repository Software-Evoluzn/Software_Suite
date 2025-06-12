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

function setupSocketConnection(ip) {
    console.log("Connected to SocketIO server");
    socket = io.connect(ip); // Initialize socket globally
    let currentTimeSelect;

    socket.on('connect', function () {
        socket.emit('highbaylight_lux', { timeSelect: currentTimeSelect });
    });

    let actualLuxGlobal = [];
    let setLuxGlobal = [];

    document.addEventListener('DOMContentLoaded', () => {
        const today = new Date().toISOString().split('T')[0];
        socket.emit('highbaylight_lux', {
            startDate: today,
            endDate: today,
            timeSelect: 'daily',
            graphSelect: 'lux'
        });
    });

    socket.on('highbaylight_lux_response', function (data) {
        console.log('Lux data response', data);

        const setLuxValues = data.map(item => item.set_lux);
        let labels = [];
        let actualLux = [];
        let setLux = setLuxValues.length > 0 ? setLuxValues.slice() : new Array(data.length).fill(0);

        if (data.length > 0 && data[0].date && data[0].date.includes('-')) {
            console.log('Data is daily', data[0]);
            labels = data.map(item => item.date);
            actualLux = data.map(item => item.avg_lux);
            if (setLux.length === 0) {
                setLux = new Array(actualLux.length).fill(0);
            }
        } else {
            labels = Array.from({ length: 144 }, (_, i) => {
                const hour = Math.floor(i / 6);
                const minute = (i % 6) * 10;
                return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
            });

            const avgLux = Array(144).fill(0);
            const setLuxExpanded = Array(144).fill(0);
            const actualLuxExpanded = Array(144).fill(0);

            data.forEach((item) => {
                const intervalIndex = labels.indexOf(item.hr);
                if (intervalIndex !== -1) {
                    avgLux[intervalIndex] = item.avg_lux;
                }
            });

            actualLux = avgLux;
            setLux = setLuxExpanded;

            const lastSetLuxValue = setLuxValues.length > 0 ? setLuxValues[setLuxValues.length - 1] : 0;

            for (let i = 0; i < setLuxExpanded.length; i++) {
                if (setLuxExpanded[i] === 0) {
                    setLuxExpanded[i] = lastSetLuxValue;
                }
            }

            actualLux = avgLux;
            setLux = setLuxExpanded;
        }

        actualLuxGlobal = actualLux.slice();
        setLuxGlobal = setLux.slice();

        updateGraph_highbay_light_line_graph('set-date', labels, setLuxGlobal, actualLuxGlobal);
    });



}
// ******************* highbay light line graph script start *******************

let isSetDateActive_highbay_light_line_graph = false;
let selectedStartDate_highbay_light_line_graph, selectedEndDate_highbay_light_line_graph;

// Initialize Flatpickr for date range selection
function formatDate_highbay_light_line_graph(date) {
    if (!date) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}


flatpickr("#dateRange_highbay_light_line_graph", {
    dateFormat: "d/m/Y",
    onChange: function (selectedDates) {
        if (selectedDates.length > 0) {
            const selectedDate = selectedDates[0];
            const formattedDate = formatDate_highbay_light_line_graph(selectedDate);
            const formattedStartDate = formatDateToYYYYMMDD(selectedDate);
            emithighbayLightLux({ startDate: formattedStartDate, endDate: formattedStartDate, timeSelect: 'set-date' });
            updateGraph_highbay_light_line_graph('set-date', [formattedDate], [0], [0]);

            document.getElementById('startDateInput').innerText = `Start Date: ${formatDateToYYYYMMDD(selectedDate)}`;
            document.getElementById('endDateInput').innerText = `End Date: ${formatDateToYYYYMMDD(selectedDate)}`;
        }
    }
});


// Chart.js context for the graph
var ctx_highbay_light_line_graph = document.getElementById('myChart_highbay_light_line_graph').getContext('2d');
var chart_highbay_light_line_graph;

const blueGradient = ctx_highbay_light_line_graph.createLinearGradient(0, 0, 0, 400);
blueGradient.addColorStop(0, '#2959FF');
blueGradient.addColorStop(1, '#9EB3FC');

const redGradient = ctx_highbay_light_line_graph.createLinearGradient(0, 0, 0, 400);
redGradient.addColorStop(0, '#FF5B5B');
redGradient.addColorStop(1, '#FFB2B2');

const yellowGradient = ctx_highbay_light_line_graph.createLinearGradient(0, 0, 0, 400);
yellowGradient.addColorStop(0, '#37ce00');
yellowGradient.addColorStop(1, '#37ce00');

var staticDailyLabels = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

function updateGraph_highbay_light_line_graph(timeSelect, labels, setLux, actualLux) {
    let diffLux = [];
    let xAxisTitle = '';

    if (timeSelect === 'set-date' && labels.length > 0) {
        setLux = Array.isArray(setLux) ? setLux : [];
        actualLux = Array.isArray(actualLux) ? actualLux : [];

        const maxLength = Math.max(setLux.length, actualLux.length);

        const adjustedSetLux = setLux.slice(0, maxLength).concat(new Array(maxLength - setLux.length).fill(0));
        const adjustedActualLux = actualLux.slice(0, maxLength).concat(new Array(maxLength - actualLux.length).fill(0));

        // diffLux = adjustedSetLux.map((set, i) => Math.max(0, set - adjustedActualLux[i]));

        diffLux = adjustedSetLux.map((set, i) => Math.max(0, set - adjustedActualLux[i]));
        diffLux = diffLux.map((diff, i) => (diff === adjustedSetLux[i] ? 0 : diff));
        // console.log('NEWdiffLux:', diffLux);


        const isSingleDay = labels.length === 144 && !labels[0].includes('-');

        if (isSingleDay) {
            labels = [];
            for (let hour = 0; hour < 24; hour++) {
                for (let min = 0; min < 60; min += 10) {
                    labels.push(`${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`);
                }
            }
            xAxisTitle = 'Hours (10-min Intervals)';
        }

    } else {
        setLux = setLux || [];
        actualLux = actualLux || [];
        if (setLux.length === actualLux.length) {
            diffLux = setLux.map((set, i) => Math.max(0, set - actualLux[i]));
        } else {
            diffLux = [];
        }
        xAxisTitle = 'Dates';
    }

    if (chart_highbay_light_line_graph) chart_highbay_light_line_graph.destroy();

    chart_highbay_light_line_graph = new Chart(ctx_highbay_light_line_graph, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Set Lux',
                    data: setLux,
                    backgroundColor: blueGradient,
                    borderColor: blueGradient,
                    borderWidth: 2
                },
                {
                    label: 'Natural Lux',
                    data: actualLux,
                    backgroundColor: yellowGradient,
                    borderColor: yellowGradient,
                    borderWidth: 2
                },
                {
                    label: 'Highbay Light Lux',
                    data: diffLux,
                    backgroundColor: redGradient,
                    borderColor: redGradient,
                    borderWidth: 2
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
                        text: xAxisTitle
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Lux Value'
                    },
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    display: true
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
                  }
            }
        }
    });
}



// Attach event listener for dropdown change
document.getElementById('timeframeSelect_highbay_light_line_graph').addEventListener('change', function () {
    var selectedValue = this.value;
    var dateRangeContainer = document.getElementById('dateRangeContainer_highbay_light_line_graph');
    var dateRangeContainer_today_highbay_light_line_graph = document.getElementById('dateRangeContainer_today_highbay_light_line_graph');
    var dateRangePicker = document.getElementById('dateRange_highbay_light_line_graph')._flatpickr;
    var selectedDeviceId = document.getElementById('highbay_individual');
    selectedDeviceId.value = ""
    if (selectedValue === 'set-date') {
        currentTimeSelect = 'set-date';
        dateRangeContainer.style.display = 'block';
        dateRangeContainer_today_highbay_light_line_graph.style.display = 'block';
        if (dateRangePicker) {
            dateRangePicker.clear();
            document.getElementById('startDateInput').innerText = '';
            document.getElementById('endDateInput').innerText = '';
        }
    } else {
        currentTimeSelect = 'daily';
        dateRangeContainer.style.display = 'none';
        dateRangeContainer_today_highbay_light_line_graph.style.display = 'none';

        // Optionally clear fields here too if needed
        document.getElementById('startDateInput').innerText = '';
        document.getElementById('endDateInput').innerText = '';

        let today = new Date();
        let formattedTodayDate = formatDateToYYYYMMDD(today);
        emithighbayLightLux({ startDate: formattedTodayDate, endDate: formattedTodayDate, timeSelect: 'daily',deviceId: selectedDeviceId });
        updateGraph_highbay_light_line_graph('daily', formattedTodayDate, formattedTodayDate);
    }
});

document.getElementById('highbay_individual').addEventListener('change', function() {
    var selectedValue = this.value;
    console.log('Selected value:', selectedValue);
  
    var dateRangePicker = document.getElementById('dateRange_highbay_light_line_graph')._flatpickr;
    let startDate, endDate;
  
    // Check if dateRangePicker is initialized and has selected dates
    if (dateRangePicker && dateRangePicker.selectedDates.length > 0) {
      startDate = formatDateToYYYYMMDD(dateRangePicker.selectedDates[0]); // Start date
      endDate = formatDateToYYYYMMDD(dateRangePicker.selectedDates[1] || dateRangePicker.selectedDates[0]); // Use same date if single date is picked
    } else {
      let today = new Date();
      startDate = formatDateToYYYYMMDD(today);
      endDate = formatDateToYYYYMMDD(today);
    }
  
    emithighbayLightLux({
        startDate: startDate, 
        endDate: endDate,   
        timeSelect: 'daily',
        deviceId: selectedValue 
    });
  });


function emithighbayLightLux(data) {
    const finalData = {
        startDate: data.startDate,
        endDate: data.endDate,
        timeSelect: data.timeSelect,
        selectedDay: data.selectedDay,
        deviceId: data.deviceId 
    };

    if (socket) {
        socket.emit('highbaylight_lux', finalData);
    }

}

function formatDateToYYYYMMDD(date) {
    if (!date) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${year}-${month}-${day}`;
}


updateGraph_highbay_light_line_graph('daily');


// ******************* highbay light line graph script end *******************

fetchIP()
    .then(ip => setupSocketConnection(ip))
    .catch(error => console.error('Error setting up socket connection:', error));
