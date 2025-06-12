// seperate office light graph

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
    console.log("Connected to SocketIO server");
    const socket = io.connect(ip);
    socket.on('connect', function () {
        socket.emit('officelight_power');
        socket.emit('power_values');
    });
    var officepower = { daily: {}, weekly: {}, monthly: {} };
    // Socket listener for the new chart
    socket.on('officelight_power', function (data) {
        officepower = data;
        console.log("officepower   ", officepower);
        var officepowerselectedInterval1 = document.getElementById('officeTimeframe1').value;
        updateOfficeChart1(officepowerselectedInterval1, officepower[officepowerselectedInterval1]);
    });

    socket.on('power_values', function (data) {
        console.log("POWER ",data)
        if (data.result6 === "" || data.result6 === null) {
            document.getElementById('result6').innerText = '-';
        } else {
            document.getElementById('result6').innerText = data.result6 ;
        }
    })

    setInterval(() => {
        socket.emit('officelight_power');
        socket.emit('power_values');
    }, 60000)



    // Create context and gradient for the new chart
    var office_light_ctx1 = document.getElementById('officelight_power1').getContext('2d');
    var gradientoffice1 = office_light_ctx1.createLinearGradient(0, 0, 0, 600);
    gradientoffice1.addColorStop(0, '#3965FF');
    gradientoffice1.addColorStop(1, '#B8C6F6');

    // Initialize the new chart
    var office_light_myChart1 = new Chart(office_light_ctx1, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: gradientoffice1,
                borderColor: 'rgba(92, 184, 92, 1)',
                borderWidth: 1,
                borderRadius: 50,
            }]
        },
        options: {
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Power Consumption (Wh)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Hours'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false,
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return `${context.raw} Wh`;
                        }
                    }
                }
            }
        }
    });

    // Function to update the new chart
    function updateOfficeChart1(frequency, data) {
        var labelofficepower1, officepowerd1;
        if (frequency === 'daily') {
            // labelofficepower1 = Array.from({ length: 24 }, (_, i) => i + 'h');
            labelofficepower1 = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
            officepowerd1 = Array.from({ length: 24 }, (_, i) => data[i] || 0);
        } else if (frequency === 'weekly') {
            var startOfWeek1 = new Date();
            startOfWeek1.setDate(startOfWeek1.getDate() - startOfWeek1.getDay());
            labelofficepower1 = Array.from({ length: 7 }, (_, i) => {
                var currentDate1 = new Date(startOfWeek1);
                currentDate1.setDate(startOfWeek1.getDate() + i);
                return getWeekDayLabelforOffice(currentDate1);
            });
            officepowerd1 = labelofficepower1.map((label, index) => {
                var date1 = new Date();
                date1.setDate(startOfWeek1.getDate() + index);
                var dateString1 = date1.toISOString().split('T')[0];
                return data[dateString1] || 0;
            });
        } else if (frequency === 'monthly') {
            var startOfMonth1 = new Date();
            startOfMonth1.setDate(1);
            startOfMonth1.setHours(0, 0, 0, 0);
            var endOfMonth1 = new Date(startOfMonth1.getFullYear(), startOfMonth1.getMonth() + 1, 0);
            endOfMonth1.setHours(23, 59, 59, 999);
            labelofficepower1 = Array.from({ length: endOfMonth1.getDate() }, (_, i) => i + 1);
            officepowerd1 = labelofficepower1.map(day => {
                var date1 = new Date(startOfMonth1.getFullYear(), startOfMonth1.getMonth(), day + 1);
                var dateString1 = date1.toISOString().split('T')[0];
                return data[dateString1] || 0;
            });
        }

        office_light_myChart1.data.labels = labelofficepower1;
        office_light_myChart1.data.datasets[0].data = officepowerd1;
        office_light_myChart1.options.scales.x.title.text = frequency === 'daily' ? 'Hours' : 'Days';
        office_light_myChart1.update();
    }
    var officepower = { daily: {}, weekly: {}, monthly: {} };
    // Event listener for the new dropdown
    document.getElementById('officeTimeframe1').addEventListener('change', function () {
        var officepowerselectedInterval1 = this.value;
        updateOfficeChart1(officepowerselectedInterval1, officepower[officepowerselectedInterval1]);
    });

    function getWeekDayLabelforOffice(date) {
        var daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        var dayOfWeek = daysOfWeek[date.getDay()];
        var day = date.getDate();
        var month = date.getMonth() + 1;
        return `${dayOfWeek} -${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}`;
    }
}

// Fetch IP and setup Socket.IO connection
fetchIP()
    .then(ip => setupSocketConnection(ip))
    .catch(error => console.error('Error setting up socket connection:', error));