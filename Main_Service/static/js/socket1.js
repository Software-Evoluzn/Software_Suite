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


    socket.on('tube', function (data) {
        if (typeof data === 'string') {
            const deviceID = data.split(":");
        console.log('tubedeviceID',deviceID)
        if (deviceID.length >= 8) {
            const Mastertube = deviceID[3];
            console.log("Mastertube....",Mastertube)
            const Autotube = deviceID[6];
            console.log("Autotube....",Autotube)
            const Idtube = deviceID[10];
            console.log("Idtube....",Idtube)
            const Intensitytube = deviceID[2]
            console.log("Intensitytube....",typeof(Intensitytube),Intensitytube)
            console.log("Intensitytube:", Intensitytube);
            // Here, trigger the slider update code:
            const Lux = deviceID[8];
            console.log("Lux....",Lux)
            updateSlider(Idtube, Intensitytube,Lux,Autotube);
            const deviceId = 'tubeGlobalTest';
            updateCheckboxState(deviceId, Mastertube, Intensitytube,Autotube);

        }
    
        } 
    });
        
        
    function updateSlider(Idtube,Intensitytube,Lux,Autotube) {
        const rangeInput = document.getElementById(`rangeValueIndividual_${Idtube}`);
        const rangeDisplay = document.getElementById(`rangeDisplayIndividual_${Idtube}`);
        if (rangeInput && rangeDisplay) {
            const intensityValue = parseInt(Intensitytube, 10);
            console.log('Intensity Value:', intensityValue, typeof(intensityValue));
            rangeInput.value = intensityValue;
            rangeDisplay.textContent = `${intensityValue}lux`;
    
            rangeInput.addEventListener('input', () => {
                rangeDisplay.textContent = `${rangeInput.value}%`;
            });
        }  else if (Lux) {
            // document.getElementById('rangeDisplayTube').innerText = Lux;
        }
        
        else {
            console.error(`Slider or display element not found for Idtube: ${Idtube}`);
        }
    
    }
        
    
    function updateCheckboxState(deviceId, Mastertube, Intensitytube,Autotube) {
        const checkbox = document.getElementById(deviceId + '/control');
        const checkbox_Auto = document.getElementById(deviceId);
        
        if (checkbox,checkbox_Auto) {
            if (parseInt(Mastertube) > 0 || parseInt(Intensitytube) > 0) {
                checkbox.checked = true;
            } else {
                checkbox.checked = false;
            }
    
            if (parseInt(Autotube) > 0 || parseInt(Intensitytube) > 0) {
                checkbox_Auto.checked = true;
            } else {
                checkbox_Auto.checked = false;
            }
            
        } else {
            console.error('Checkbox not found for deviceId:', deviceId);
        }
    }
    
    
    // Socket listener for incoming data
    socket.on('office', function (data_office) { 
        if (typeof data_office === 'string') {
            const deviceID_office = data_office.split(":");
            console.log('officedeviceID', deviceID_office);
    
            if (deviceID_office.length >= 8) {
                const Masteroffice = deviceID_office[3];
                console.log("Masteroffice....", Masteroffice);
                const Autooffice = deviceID_office[6];
                console.log("Autooffice....", Autooffice);
                const Idoffice = deviceID_office[8];
                console.log("Idoffice....", Idoffice);
                const Intensityoffice = deviceID_office[2];
                console.log("Intensityoffice....", typeof(Intensityoffice), Intensityoffice);
                console.log("Intensityoffice:", Intensityoffice);
    
                const Luxoffice = deviceID_office[8];
                console.log("Luxoffice....", Luxoffice);
    
                // Trigger the slider update code:
                updateSlider_office(Idoffice, Intensityoffice, Luxoffice,Autooffice);
    
                const deviceId_office = 'officeF0BF19';
                updateCheckboxState_office(deviceId_office, Masteroffice, Intensityoffice,Autooffice);
    
            }
        } 
    });
    
    function updateSlider_office(Idoffice, Intensityoffice, Autooffice) {
        const rangeInput = document.getElementById(`rangeValueIndividual_${Idoffice}`);
        const rangeDisplay = document.getElementById(`rangeDisplayIndividual_${Idoffice}`);
    
        if (rangeInput && rangeDisplay) {
            const intensityValue = parseInt(Intensityoffice, 10);
            console.log('Intensity Value:', intensityValue, typeof(intensityValue));
            rangeInput.value = intensityValue;
            rangeDisplay.textContent = `${intensityValue}%`;
    
            rangeInput.addEventListener('input', () => {
                rangeDisplay.textContent = `${rangeInput.value}%`;
            });
        } else if (Intensityoffice) {
            document.getElementById('rangeDisplayOffice').innerText = Intensityoffice;
        } else {
            console.error(`Slider or display element not found for Idoffice: ${Idoffice}`);
        }
    }
    
    function updateCheckboxState_office(deviceId_office, Masteroffice, Intensityoffice,Autooffice) {
        const checkbox = document.getElementById(deviceId_office + '/control');
        const checkbox_Auto = document.getElementById(deviceId_office);
        
        if (checkbox,checkbox_Auto) {
            if (parseInt(Masteroffice) > 0 || parseInt(Intensityoffice) > 0) {
                checkbox.checked = true;
            } else {
                checkbox.checked = false;
            }
    
            if (parseInt(Autooffice) > 0 || parseInt(Intensityoffice) > 0) {
                checkbox_Auto.checked = true;
            } else {
                checkbox_Auto.checked = false;
            }
        } else {
            console.error('Checkbox not found for deviceId_office:', deviceId_office);
        }
    }

socket.on('highbay', function (data) {
    if (typeof data === 'string') { 
        const deviceID = data.split(":");
    if (deviceID.length >= 4) {

        const highbayId = deviceID[1];
        console.log("highbayId....",highbayId)
        const SwitchStatus = deviceID[2];
        console.log("SwitchStatus....",SwitchStatus)
        const autoMotionDetection = deviceID[3]
        console.log("autoMotionDetection....",autoMotionDetection)
    
        // Master Switch: If master !== '0', check the box; otherwise, uncheck it
        if (SwitchStatus !== "0" || SwitchStatus > "0") {
            document.getElementById(`${highbayId}/control`).checked = true;
        } else {
            document.getElementById(`${highbayId}/control`).checked = false; 
        }
    
        if (autoMotionDetection !== "0" || autoMotionDetection > "0") {
            document.getElementById(`${highbayId}`).checked = true; 
        } else {
            document.getElementById(`${highbayId}`).checked = false; 
        }
    
    }
    
    } 
});
    



let isOn = false;
socket.on('plug', function (data) {
    if (typeof data === 'string') {
        console.log('plugSDATAAA', data);
        const deviceID = data.split(":");
        const ac_status = deviceID[5]; 
        console.log('ac_status', ac_status);
        const iconElement = document.querySelector(`#main_ac_icon`);
        if (iconElement && ac_status !== undefined) {
            const spanElement = document.querySelector('.main_sc_img_span'); 
        
            if (ac_status > '0') { 
                iconElement.style.color = '#f9f9f9';
                if (spanElement) {
                    spanElement.style.backgroundColor = '#3965ff'; 
                }
                isOn = true;
            } else {
                iconElement.style.color = '#f9f9f9';
                if (spanElement) {
                    spanElement.style.backgroundColor = '#FA8072';
                }
                isOn = false;
            }
        }
        
    }
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
    
}

// Fetch IP and setup Socket.IO connection
fetchIP()
    .then(ip => setupSocketConnection(ip))
    .catch(error => console.error('Error setting up socket connection:', error));


