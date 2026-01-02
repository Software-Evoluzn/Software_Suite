let apiUrl = "";
let device = "";
const singleMasterSwitch = document.getElementById("singleMasterSwitch");

const btbSwitches = document.querySelectorAll(".btbSwitch");
const urlParams = new URLSearchParams(window.location.search);
const device_id = urlParams.get("device_id");

async function loadApiUrl() {
    try {
        const res = await fetch("static/js/ip.json");
        const data = await res.json();
        apiUrl = data.ip;
        fetchDevices();
    } catch (err) {
        console.error("Error loading API URL:", err);
    }
}

const socket = io.connect(apiUrl)

// ✅ When connected
socket.on('connect', () => {
    console.log("✅ Connected to server");
});

// MASTER SWITCH ON/OFF
singleMasterSwitch.addEventListener("change", async function () {

    console.log("Master Switch Toggled");
    const isOn = this.checked;
    const intensity = isOn ? 100 : 0;

    const deviceId = singleMasterSwitch.dataset.device;

    console.log("Device ID:", deviceId);

    console.log("Master Switch Toggled:", deviceId, intensity);

    socket.emit("toggle_device_single", { device: deviceId, intensity });

});

// Initial load
if (device_data && device_id && device_data[device_id]) {

    console.log("Device Data:", device_data);

    const Single_Phase = device_data[device_id];

    if (Single_Phase.device_type === "Single_Phase") {
        const isOn = Single_Phase.load_status === "1";

        singleMasterSwitch.checked = isOn;
        updateSwitchUI(isOn);

        console.log("Initial load_status:", Single_Phase.load_status);
    }
}

function updateSwitchUI(isOn) {
    const container = singleMasterSwitch.closest(".switch-container");

    if (!container) return;

    container.classList.toggle("on", isOn);
    container.classList.toggle("off", !isOn);
}

// 🔹 Setup chart
const powerChartctx = document.getElementById('powerChart').getContext('2d');
const hours = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);

const powerChart = new Chart(powerChartctx, {
    type: 'bar',
    data: {
        labels: hours,
        datasets: [{
            label: 'Power',
            data: [],
            backgroundColor: '#FF5733',
            borderRadius: { topLeft: 15, topRight: 15 },
            borderSkipped: 'bottom'
        }]
    },
    options: {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
                labels: { color: '#222', font: { size: 14, weight: '600' } }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                title: { display: true, text: 'Power (W)', color: '#444', font: { size: 12 } },
                grid: { color: '#ccc' }
            },
            x: {
                title: { display: true, text: 'Time (Hours)', color: '#444', font: { size: 12 } },
                grid: { color: '#ccc' },
                ticks: { color: '#222' }
            }
        }
    }
});

// 🔹 Fetch data from backend
function fetchGraphData() {
    const modeSelect = document.getElementById('modeSelect').value;
    const graphSelect = document.getElementById('graphType').value;
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');

    let startDate, endDate;

    if (modeSelect === "today") {
        const today = new Date().toISOString().split('T')[0];
        startDate = today;
        endDate = today;
    } else {
        startDate = startDateInput.value;
        endDate = endDateInput.value;

        // ✅ Prevent invalid request
        if (!startDate || !endDate) {
            console.log("here aahe")
            alert("Please select both start and end dates.");
            return;
        }
    }

    console.log(`Fetching data: ${graphSelect} from ${startDate} → ${endDate}`);

    socket.emit('single_graph_data', {
        startDate,
        endDate,
        device_id: device_id,
        timeSelect: modeSelect,
        graphSelect
    });
}

//  handle backend response singlephase main code 
socket.on('single_graph_data_response', (data) => {
    if (!data || data.error) {
        console.error("Error fetching Singlephase data:", data?.error);
        alert("Error fetching data");
        return;
    }

    const graphSelect = document.getElementById('graphType').value;
    const modeSelect = document.getElementById('modeSelect').value;

    let labels = [];
    let values = [];

    if (modeSelect === "today" || (data[0] && data[0].hour !== undefined)) {
        // 🕒 Hourly data
        const fullHours = Array.from({ length: 24 }, (_, i) => i);
        const hourDataMap = Object.fromEntries(data.map(item => [item.hour, item.value]));

        labels = fullHours.map(h => `${h.toString().padStart(2, '0')}:00`);
        values = fullHours.map(h => hourDataMap[h] ?? 0);

        powerChart.options.scales.x.title.text = "Time (Hours)";
    } else {
        // 📅 Range data (date-wise)
        labels = data.map(item => item.date);
        values = data.map(item => item.value);
        powerChart.options.scales.x.title.text = "Date";
    }

    const labelMap = {
        power: { text: 'Average Power (W)', color: '#4B74FE' },
        voltage: { text: 'Average Voltage (V)', color: '#FF9800' },
        current: { text: 'Average Current (A)', color: '#2196F3' }
    };

    const meta = labelMap[graphSelect];

    powerChart.data.labels = labels;
    powerChart.data.datasets[0].label = `BTB ${graphSelect.charAt(0).toUpperCase() + graphSelect.slice(1)}`;
    powerChart.data.datasets[0].data = values;
    powerChart.data.datasets[0].backgroundColor = meta.color;
    powerChart.options.scales.y.title.text = meta.text;

    powerChart.update();

    // Update label under chart
    document.getElementById('chartLabelText').innerText =
        `4 Channel BTB - ${meta.text}`;
});

// 🔹 UI Elements
const modeSelect = document.getElementById('modeSelect');
const graphSelect = document.getElementById('graphType');
const applyRangeBtn = document.getElementById('applyRangeBtn');
const dateRangeInputs = document.getElementById('dateRangeInputs');

// 🔸 Mode change (Today ↔ Range)
modeSelect.addEventListener('change', () => {
    if (modeSelect.value === "range") {
        dateRangeInputs.style.display = "block";
    } else {
        dateRangeInputs.style.display = "none";
        fetchGraphData();
    }
});

// 🔸 Graph type change (Power/Voltage/Current)
graphSelect.addEventListener('change', () => {
    const mode = modeSelect.value;
    if (mode === "range") {
        const start = document.getElementById('startDate').value;
        const end = document.getElementById('endDate').value;
        if (start && end) {
            fetchGraphData();
        }
    } else {
        fetchGraphData();
    }
});

// 🔸 Apply button (for range mode)
applyRangeBtn.addEventListener('click', fetchGraphData);

// 🔹 Auto-refresh every 5 minutes (300,000 ms)
setInterval(() => {
    console.log("⏰ Auto-refreshing graph...");
    fetchGraphData();
}, 5 * 60 * 1000);


fetchGraphData();
