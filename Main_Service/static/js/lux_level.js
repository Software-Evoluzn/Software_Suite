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
    
    socket.emit('runninglight_lux', { timeSelect: currentTimeSelect });
  });

  socket.on('tube', function (data) {
    if (typeof data === 'string') {
      const deviceID = data.split(":");
      console.log('tubedeviceID', deviceID)
      if (deviceID.length >= 8) {
        const Mastertube = deviceID[3];
        console.log("Mastertube....", Mastertube)
        const Autotube = deviceID[6];
        console.log("Autotube....", Autotube)
        const Idtube = deviceID[11];
        console.log("Idtube....", Idtube)
        const Intensitytube = deviceID[2]
        console.log("Intensitytube....", typeof (Intensitytube), Intensitytube)
        console.log("Intensitytube:", Intensitytube);
        // Here, trigger the slider update code:
        const Lux = deviceID[8];
        console.log("Lux....", Lux)
        updateSlider(Idtube, Intensitytube, Lux);
        const deviceId = 'tubeGlobal';
        updateCheckboxState(deviceId, Mastertube, Intensitytube);


        // Master Switch: If master !== '0', check the box; otherwise, uncheck it
        if (Mastertube !== "0" || Mastertube > "0" || Intensitytube > "0") {
          document.getElementById(`${Idtube}/control`).checked = true;
          document.getElementById(`tube_${Idtube}`).style.background = '#3965ff'
        } else {
          document.getElementById(`${Idtube}/control`).checked = false;
          document.getElementById(`tube_${Idtube}`).style.background = '#F3F3F3'
        }

      }

    }
  });

  function updateSlider(Idtube, Intensitytube, Lux) {
    const rangeInput = document.getElementById(`rangeValueIndividual_${Idtube}`);
    const rangeDisplay = document.getElementById(`rangeDisplayIndividual_${Idtube}`);


    if (rangeInput && rangeDisplay) {
      const intensityValue = parseInt(Intensitytube, 10);
      console.log('Intensity Value:', intensityValue, typeof (intensityValue));
      rangeInput.value = intensityValue;
      rangeDisplay.textContent = `${intensityValue}%`;

      rangeInput.addEventListener('input', () => {
        rangeDisplay.textContent = `${rangeInput.value}%`;
      });
    } 
  }

  function updateCheckboxState(deviceId, Mastertube, Intensitytube) {
    const checkbox = document.getElementById(deviceId + '/control');

    if (checkbox) {
      if (parseInt(Mastertube) > 0 || parseInt(Intensitytube) > 0) {
        checkbox.checked = true;
      } else {
        checkbox.checked = false;
      }

    }
  }


  let actualLuxGlobal = [];
  let setLuxGlobal = [];

  document.addEventListener('DOMContentLoaded', () => {
    const today = new Date().toISOString().split('T')[0];
    socket.emit('runninglight_lux', {
      startDate: today,
      endDate: today,
      timeSelect: 'daily',
      graphSelect: 'lux'
    });
  });

 



  socket.on('runninglight_lux_response', function (data) {
    console.log('Lux data response-------', data);


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

    updateGraph_running_light_line_graph('set-date', labels, setLuxGlobal, actualLuxGlobal);
  });



}
// ******************* running light line graph script start *******************

let isSetDateActive_running_light_line_graph = false;
let selectedStartDate_running_light_line_graph, selectedEndDate_running_light_line_graph;

// Initialize Flatpickr for date range selection
function formatDate_running_light_line_graph(date) {
  if (!date) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}


flatpickr("#dateRange_running_light_line_graph", {
  dateFormat: "d/m/Y",
  onChange: function (selectedDates) {
    if (selectedDates.length > 0) {
      const selectedDate = selectedDates[0];
      const formattedDate = formatDate_running_light_line_graph(selectedDate);
      const formattedStartDate = formatDateToYYYYMMDD(selectedDate);
      emitRunningLightLux({ startDate: formattedStartDate, endDate: formattedStartDate, timeSelect: 'set-date' });
      updateGraph_running_light_line_graph('set-date', [formattedDate], [0], [0]);

      document.getElementById('startDateInput').innerText = `Start Date: ${formatDateToYYYYMMDD(selectedDate)}`;
      document.getElementById('endDateInput').innerText = `End Date: ${formatDateToYYYYMMDD(selectedDate)}`;
    }
  }
});


// Chart.js context for the graph
var ctx_running_light_line_graph = document.getElementById('myChart_running_light_line_graph').getContext('2d');
var chart_running_light_line_graph;

const blueGradient = ctx_running_light_line_graph.createLinearGradient(0, 0, 0, 400);
blueGradient.addColorStop(0, '#2959FF');
blueGradient.addColorStop(1, '#9EB3FC');

const redGradient = ctx_running_light_line_graph.createLinearGradient(0, 0, 0, 400);
redGradient.addColorStop(0, '#FF5B5B');
redGradient.addColorStop(1, '#FFB2B2');

const yellowGradient = ctx_running_light_line_graph.createLinearGradient(0, 0, 0, 400);
yellowGradient.addColorStop(0, '#37ce00');
yellowGradient.addColorStop(1, '#37ce00');

var staticDailyLabels = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

function updateGraph_running_light_line_graph(timeSelect, labels, setLux, actualLux) {
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
    console.log('NEWdiffLux:', diffLux);


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

  if (chart_running_light_line_graph) chart_running_light_line_graph.destroy();

  chart_running_light_line_graph = new Chart(ctx_running_light_line_graph, {
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
          label: 'Running Light Lux',
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
        }
      },
      plugins: {
        legend: {
          display: true
        },
      }
    }
  });
}



// Attach event listener for dropdown change
document.getElementById('timeframeSelect_running_light_line_graph').addEventListener('change', function () {
  var selectedValue = this.value;
  var dateRangeContainer = document.getElementById('dateRangeContainer_running_light_line_graph');
  var dateRangeContainer_today_running_light_line_graph = document.getElementById('dateRangeContainer_today_running_light_line_graph');
  var dateRangePicker = document.getElementById('dateRange_running_light_line_graph')._flatpickr;
  var selectedDeviceId = document.getElementById('individualrunning_lightlux');

  selectedDeviceId.value = ""

  if (selectedValue === 'set-date') {
    currentTimeSelect = 'set-date';    
    dateRangeContainer.style.display = 'block';
    dateRangeContainer_today_running_light_line_graph.style.display = 'block';

    if (dateRangePicker) {
      dateRangePicker.clear();
      document.getElementById('startDateInput').innerText = '';
      document.getElementById('endDateInput').innerText = '';
    }
  } else {
    currentTimeSelect = 'daily';
    dateRangeContainer.style.display = 'none';
    dateRangeContainer_today_running_light_line_graph.style.display = 'none';

    // Optionally clear fields here too if needed
    document.getElementById('startDateInput').innerText = '';
    document.getElementById('endDateInput').innerText = '';

    let today = new Date();
    let formattedTodayDate = formatDateToYYYYMMDD(today);

  
    emitRunningLightLux({ startDate: formattedTodayDate, endDate: formattedTodayDate, timeSelect: 'daily',deviceId: "" });
    updateGraph_running_light_line_graph('daily', formattedTodayDate, formattedTodayDate);
  }
});



document.getElementById('individualrunning_lightlux').addEventListener('change', function() {
  var selectedValue = this.value;
  console.log('Selected value:', selectedValue);

  var dateRangePicker = document.getElementById('dateRange_running_light_line_graph')._flatpickr;
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

  emitRunningLightLux({
      startDate: startDate, 
      endDate: endDate,   
      timeSelect: document.getElementById('timeframeSelect_running_light_line_graph').value,
      deviceId: selectedValue 
  });
});

function emitRunningLightLux(data) {
  const finalData = {
    startDate: data.startDate,
    endDate: data.endDate,
    timeSelect: data.timeSelect,
    selectedDay: data.selectedDay,
    deviceId: data.deviceId

  };
  if (socket) {
    socket.emit('runninglight_lux', finalData);
  }

}

function formatDateToYYYYMMDD(date) {
  if (!date) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${year}-${month}-${day}`;
}


updateGraph_running_light_line_graph('daily');


// ******************* running light line graph script end *******************

fetchIP()
  .then(ip => setupSocketConnection(ip))
  .catch(error => console.error('Error setting up socket connection:', error));
