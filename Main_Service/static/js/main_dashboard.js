
let debounceTimeoutRunning;
function RunningSendLuxValue(inputElementR) {
    const deviceId = inputElementR.id.split('-')[0];
    const value = parseInt(inputElementR.value, 10);
    const alertMessage = document.getElementById('alertMessage_running_light_control_lux');
    alertMessage.textContent = '';
    if (value < 0 || value > 1500 || isNaN(value)) {
        alertMessage.textContent = "Please enter a number between 0 and 1500.";
        clearTimeout(debounceTimeoutRunning);
        return;
    }
    clearTimeout(debounceTimeoutRunning);
    debounceTimeoutRunning = setTimeout(() => {
        sendLuxValueRunning(deviceId, value);
    }, 2000);
}
function sendLuxValueRunning(deviceId, value) {
    fetch('/updateLuxValue_running', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            id: deviceId,
            lux_value: value
        }),
    })
        .then(response => response.json())
        .then(data => {
            console.log("API Response:", data.message);
        })
        .catch(error => {
            console.error("Error:", error);
        });
}


let debounceTimeoutOffice;
function officeSendLuxValue(inputElement) {
    const deviceId = inputElement.id.split('-')[0];
    const value = parseInt(inputElement.value, 10);
    const alertMessage = document.getElementById('alertMessage_office_light_control_intensity');
    alertMessage.textContent = '';
    if (value < 0 || value > 100 || isNaN(value)) {
        alertMessage.textContent = "Please enter a number between 0 and 100.";
        clearTimeout(debounceTimeoutOffice);
        return;
    }
    clearTimeout(debounceTimeoutOffice);
    debounceTimeoutOffice = setTimeout(() => {
        sendLuxValueOffice(deviceId, value);
    }, 2000);
}
function sendLuxValueOffice(deviceId, value) {
    fetch('/updateLuxValue_office', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            id: deviceId,
            lux_value: value
        }),
    })
        .then(response => response.json())
        .then(data => {
            console.log("API Response:", data.message);
        })
        .catch(error => {
            console.error("Error:", error);
        });
}



function toggleCheckboxOffice(deviceId) {
    const checkbox = document.getElementById(deviceId);
    const action = checkbox.checked ? 'turnonMasterOffice' : 'turnoffMasterOffice';


    console.log('Toggling intensity for:', id, 'Action:', action);

    // Send the request to the backend
    fetch('/turnMasterOffice', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: deviceId, action: action }),
    })
        .then(response => response.json())
        .then(data => {
            console.log(data.message);
        })
        .catch(error => {
            console.error('Error:', error);
        });
}
//   toggleCheckboxOffice(deviceId)


// autobrightness....
function toggleCheckboxBrightnessOffice(deviceId) {
    const checkbox = document.getElementById(deviceId);
    const action = checkbox.checked ? 'turnonBrightnessOffice' : 'turnoffBrightnessOffice';
    fetch('/AutoBrightnessOffice', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: deviceId, action: action }),
    })
        .then(response => response.json())
        .then(data => {
            console.log(data.message);
        })
        .catch(error => {
            console.error('Error:', error);
        });
}
// toggleCheckboxBrightnessOffice(deviceId)




function toggleCheckboxHigh(deviceId) {
    const checkbox = document.getElementById(deviceId);
    const action = checkbox.checked ? 'turnonMasterHigh' : 'turnoffMasterHigh';
    // Send the request to the backend
    fetch('/turnMasterHigh', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: deviceId, action: action }),
    })
        .then(response => response.json())
        .then(data => {
            console.log(data.message);
        })
        .catch(error => {
            console.error('Error:', error);
        });
}
//   toggleCheckboxHigh(deviceId)





// highbay automotion......
function autoMotionDetectionHigh(deviceId) {
    const checkbox = document.getElementById(deviceId);
    const action = checkbox.checked ? 'turnonautoMotionDetection' : 'turnoffautoMotionDetection';
    fetch('/autoMotionDetectionHigh', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: deviceId, action: action }),
    })
        .then(response => response.json())
        .then(data => {
            console.log(data.message);
        })
        .catch(error => {
            console.error('Error:', error);
        });
}
// autoMotionDetectionHigh(deviceId)




function toggleCheckboxRunning(deviceId) {
    const checkbox = document.getElementById(deviceId);
    const action = checkbox.checked ? 'turnonMasterRunning' : 'turnoffMasterRunning';

    // Log deviceId to debug
    console.log('Toggling device:', deviceId);

    // Send the request to the backend
    fetch('/turnMasterRunning', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: deviceId, action: action }),
    })
        .then(response => response.json())
        .then(data => {
            console.log(data.message);
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

function AutobrightnessRunning(deviceIdAutoRunning) {
    const checkboxAutoRunning = document.getElementById(deviceIdAutoRunning);
    const action = checkboxAutoRunning.checked ? 'AutoOnBrightnessRunning' : 'AutoOffBrightnessRunning';
    fetch('/AutoBrightnessRunning', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: deviceIdAutoRunning, action: action }),
    })
        .then(response => response.json())
        .then(data => {
            console.log(data.message);
        })
        .catch(error => {
            console.error('Error:', error);
        });
}
// AutobrightnessRunning(deviceIdAutoRunning)


let isOn = false;
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
            console.log('Success:', data);
        })
        .catch((error) => {
            console.error('Error:', error);
        });
}




function toggleCheckboxMaster(id) {
    const checkbox = document.querySelector('.dashboard_main_checkbox.master-switch');
    const action = checkbox.checked ? 'turnonMaster' : 'turnoffMaster';
    const data = {
        id: id,
        action: action
    };

    fetch('/turnMaster', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
        .then(response => response.json())
        .then(data => {
            console.log('Success:', data);
        })
        .catch((error) => {
            console.error('Error:', error);
        });
}




//  this api for autobrightness......
function toggleCheckboxBrightness(id) {
    const checkbox = document.querySelector('.dashboard_main_checkbox.auto-brightness');
    const action = checkbox.checked ? 'turnonBrightness' : 'turnoffBrightness';

    const data = {
        id: id,
        action: action
    };

    fetch('/AutoBrightness', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
        .then(response => response.json())
        .then(data => {
            console.log('Success:', data);
        })
        .catch((error) => {
            console.error('Error:', error);
        });
}




function toggleSwitch(id) {
    const checkbox = document.getElementById(id);
    const action = checkbox.checked ? 'turnonMaster' : 'turnoffMaster';
    const data = {
        id: id,
        action: action
    };

    fetch('/turnMaster', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
        .then(response => response.json())
        .then(data => {
            console.log('Success:', data);
        })
        .catch((error) => {
            console.error('Error:', error);
        });
}

// Generalized download change and graph update function
function formatDate(dateString) {
    // Assuming dateString is in format 'DD/MM/YYYY' or 'Start Date: DD/MM/YYYY'
    const parts = dateString.replace(/Start Date: |End Date: /, '').trim().split('/');
    // Reformat to YYYY-MM-DD
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
}


function downloadFile(elementId) {
    // Map element ID to the appropriate device type and start/end date IDs
    const deviceTypes = {
        "graphSelect_running_light_graph": {
            deviceType: "tube",
            startDateId: 'startDateDisplay_running_light_graph',
            endDateId: 'endDateDisplay_running_light_graph'
        },
        "graphSelect_office_light_graph": {
            deviceType: "office",
            startDateId: 'startDateDisplay_office_light_graph',
            endDateId: 'endDateDisplay_office_light_graph'
        },
        "graphSelect_hibay_light_graph": {
            deviceType: "highbay",
            startDateId: 'startDateDisplay_hibay_light_graph',
            endDateId: 'endDateDisplay_hibay_light_graph'
        },
        "graphSelect_all_device_power_consumption_graph": {
            deviceType: "all_device_power",
            startDateId: 'startDateDisplay_all_device_power_consumption_graph',
            endDateId: 'endDateDisplay_all_device_power_consumption_graph'
        },
        "graphSelect_ac_device_graph": {
            deviceType: "plug",
            startDateId: 'startDateDisplay_ac_device_graph',
            endDateId: 'endDateDisplay_ac_device_graph'
        },
        "graphSelect_machine_oee_stats": {
            deviceType: "oeestats",
            startDateId: 'startDateDisplay_machine_oee_stats',
            endDateId: 'endDateDisplay_machine_oee_stats'
        },
        "graphSelect_threephase_device_graph": {
            deviceType: "energymeter",
            startDateId: 'startDateDisplay_threephase_device_graph',
            endDateId: 'endDateDisplay_threephase_device_graph'
        }
    };

    const deviceInfo = deviceTypes[elementId];

    if (!deviceInfo) {
        alert("Invalid graph element selected.");
        return;
    }

    const { deviceType, startDateId, endDateId } = deviceInfo;


    const timeSelect = document.getElementById(`timeSelect_${elementId.replace("graphSelect_", "")}`).value;

    let startDate, endDate;

    if (timeSelect.startsWith('set-date')) {

        startDate = document.getElementById(startDateId).innerText.trim();
        endDate = document.getElementById(endDateId).innerText.trim();


        startDate = formatDate(startDate);
        endDate = formatDate(endDate);

    } else {

        startDate = new Date().toISOString().split('T')[0]; // Set to today
        endDate = startDate;
    }


    if (!startDate || !endDate) {
        alert("Please select both start and end dates.");
        return;
    }

    if (new Date(startDate) > new Date(endDate)) {
        alert("Start date cannot be later than end date.");
        return;
    }


    let urlEndpoint = '/download_xlsx';


    if (deviceType === "oeestats") {
        urlEndpoint = '/download_xlsxoee';
    } else if (deviceType === "energymeter") {
        urlEndpoint = '/download_xlsx_threephase';
    }


    const params = {
        startDate: startDate,
        endDate: endDate,
        timeSelect: timeSelect,
        deviceType: deviceType,
        graphSelect: elementId.replace("graphSelect_", "")
    };

    fetch(urlEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(params)
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
                throw new Error('Unexpected error occurred');
            }
        })
        .then(blob => {
            // Create a URL and download the Excel file
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${deviceType}_data.xlsx`; // Set file name dynamically
            document.body.appendChild(a);
            a.click();
            a.remove();
        })
        .catch(error => console.error('Error downloading Excel file:', error));

}

function toggleSwitch_intensity(id) {
    const checkbox = document.getElementById(id);
    const action = checkbox.checked ? 'turnonMaster_intensity' : 'turnoffMaster_intensity';
    const data = {
        id: id,
        action: action
    };


    fetch('/turnMaster_intensity', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
        .then(response => response.json())
        .then(data => {
            console.log('Success:', data);
        })
        .catch((error) => {
            console.error('Error:', error);
        });
}




function toggleSwitch_autoBrightness(id) {
    const checkbox = document.getElementById(id);
    const action = checkbox.checked ? 'turnonMaster_autoBrightness' : 'turnoffMaster_autoBrightness';
    const data = {
        id: id,
        action: action
    };

    fetch('/turnMaster_autoBrightness', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
        .then(response => response.json())
        .then(data => {
            console.log('Success:', data);
        })
        .catch((error) => {
            console.error('Error:', error);
        });
}



function toggleSwitch_autoMotion(id) {
    const checkbox = document.getElementById(id);
    const action = checkbox.checked ? 'turnonMaster_autoMotion' : 'turnoffMaster_autoMotion';
    const data = {
        id: id,
        action: action
    };

    fetch('/turnMaster_autoMotion', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
        .then(response => response.json())
        .then(data => {
            console.log('Success:', data);
        })
        .catch((error) => {
            console.error('Error:', error);
        });
}

document.addEventListener('DOMContentLoaded', function () {
    const sliders = document.querySelectorAll('.dashboard_smart_led1_range2');
    sliders.forEach(slider => {
        // Get the device_id from the slider's id
        const device_id = slider.id.split('_')[1]; // Assuming the format is rangeValueIndividual_deviceID
        console.log("device_id:", device_id);

        // Select the range input and display elements using the device_id
        const rangeInput = document.getElementById(`rangeValueIndividual_${device_id}`);
        const rangeDisplay = document.getElementById(`rangeDisplayIndividual_${device_id}`);

        // Set up the event listeners
        rangeInput.addEventListener('input', () => {
            rangeDisplay.textContent = `${rangeInput.value}%`;
        });

        rangeInput.addEventListener('change', function () {
            const topic = `${device_id}`;
            const value = rangeInput.value;

            fetch('/highbay_intensity_Individual', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    topic: topic,
                    ledIntensity: value
                })
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Flask API response:', data.message);
                })
                .catch(error => {
                    console.error('There was a problem with the fetch operation:', error);
                });
        });
    });
});

function highbay_intensity_lora_global(id) {
    const checkbox = document.getElementById(id);
    const action = checkbox.checked ? 'highbay_intensity_lora_global_on' : 'highbay_intensity_lora_global_off';
    const data = {
        id: id,
        action: action
    };

    fetch('/highbay_intensity_lora_global', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
        .then(response => response.json())
        .then(data => {
            console.log('Success:', data);
        })
        .catch((error) => {
            console.error('Error:', error);
        });
}




function highbay_autoBrightness_lora_global(id) {
    const checkbox = document.getElementById(id);
    const action = checkbox.checked ? 'highbay_autoBrightness_lora_global_on' : 'highbay_autoBrightness_lora_global_off';
    const data = {
        id: id,
        action: action
    };

    fetch('/highbay_autoBrightness_lora_global', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
        .then(response => response.json())
        .then(data => {
            console.log('Success:', data);
        })
        .catch((error) => {
            console.error('Error:', error);
        });
}



function highbay_autoMotion_lora_global(id) {
    const checkbox = document.getElementById(id);
    const action = checkbox.checked ? 'highbay_autoMotion_lora_global_on' : 'highbay_autoMotion_lora_global_off';
    const data = {
        id: id,
        action: action
    };
    fetch('/highbay_autoMotion_lora_global', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
        .then(response => response.json())
        .then(data => {
            console.log('Success:', data);
        })
        .catch((error) => {
            console.error('Error:', error);
        });
}


// let timeout = null;
// document.querySelector('.hibay_running_light_contol_lux_input').addEventListener('input', function () {
//     let inputValue = this.value;
//     let errorDiv = document.querySelector('.hibay_running_light_contol_lux_input_error');
//     if (inputValue < 0) {
//         this.value = 0;
//     } else if (inputValue > 1500) {
//         this.value = 1500;
//     }
//     if (inputValue === "" || inputValue < 0 || inputValue > 1500) {
//         errorDiv.style.display = 'block';
//     } else {
//         errorDiv.style.display = 'none';
//         clearTimeout(timeout);
//         timeout = setTimeout(() => {
//             fetch('/update_lux', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json'
//                 },
//                 body: JSON.stringify({
//                     lux: parseInt(inputValue),
//                 })
//             })
//             .then(response => response.json())
//             .then(data => {
//                 if (data.success) {
//                     console.log("Lux value updated successfully");
//                 }
//             })
//             .catch(error => console.error("Error updating lux:", error));
//         }, 3000);
//     }
// });