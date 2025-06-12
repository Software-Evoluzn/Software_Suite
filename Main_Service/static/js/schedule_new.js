document.addEventListener('DOMContentLoaded', function () {
    // Initialize flatpickr for date range
    flatpickr("#dateRange", {
      mode: "range",
      dateFormat: "d/m/Y",
    });
  
    // Listen for changes in the date selection dropdown
    document.getElementById('dateSelect').addEventListener('change', function () {
      const dateRangeContainer = document.getElementById('dateRangeContainer');
      const weekly_day_range = document.getElementById('weekly_day_range');
  
      if (this.value === 'setDate') {
        dateRangeContainer.style.display = 'block';
        weekly_day_range.style.display = 'none'; // Hide weekly range
      } else if (this.value === 'weekly') {
        weekly_day_range.style.display = 'block';
        dateRangeContainer.style.display = 'none'; // Hide date range
      } else {
        dateRangeContainer.style.display = 'none';
        weekly_day_range.style.display = 'none';
      }
    });
  
    // Checkboxes logic for "Every Day"
    document.getElementById('everyday-checkbox').addEventListener('change', function () {
      const checkboxes = document.querySelectorAll('.day-checkbox');
      checkboxes.forEach(checkbox => checkbox.checked = false); // Uncheck all individual checkboxes
    });
  
    // Event listener for individual day checkboxes
    document.querySelectorAll('.day-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', function () {
        const everydayCheckbox = document.getElementById('everyday-checkbox');
        everydayCheckbox.checked = false; // Uncheck "Every Day" if any day is selected
      });
    });
  
    // Set button click event
    document.getElementById('setScheduleBtn').addEventListener('click', function () {
      const device = document.getElementById('deviceSelect').value;
      const dateOption = document.getElementById('dateSelect').value;
      const fromTime = document.getElementById('fromTime').value;
      const toTime = document.getElementById('toTime').value;
  
      // Clear the alerts div
      const alertsDiv = document.getElementById('alerts');
      alertsDiv.innerHTML = '';
  
      // Validate inputs
      let errors = validateInputs(device, dateOption, fromTime, toTime);
  
      // Handle errors
      if (errors.length > 0) {
        const errorList = '<ul>' + errors.map(error => `<li>${error}</li>`).join('') + '</ul>';
        alertsDiv.innerHTML = errorList;
        return; // Stop the function from proceeding
      }
  
      let days = [];
      if (dateOption === 'weekly') {
        days = Array.from(document.querySelectorAll('#weekly_day_range input[type="checkbox"]:checked')).map(cb => Number(cb.value));
        if (days.length === 0) {
          errors.push("Please select at least one day for the weekly schedule.");
          return; // Stop if no days selected
        }
      }
  
      const selectedDate = getSelectedDate(dateOption);
  
      const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      let selectday = [];
      let newsDate = selectedDate;
  
      if (newsDate === "0123456") {
        selectday = ["Everyday"];
      } else {
        for (let char of newsDate) {
          const dayIndex = parseInt(char, 10);
          if (dayIndex >= 0 && dayIndex <= 6) {
            selectday.push(weekdays[dayIndex]);
          }
        }
      }
  
      const template = document.getElementById('scheduleTemplate');
      const scheduleItem = template.querySelector('.schedule-item').cloneNode(true);
  
      // Set dynamic values
      scheduleItem.querySelector('.device-name').textContent = device;
      if (dateOption === 'weekly') {
        scheduleItem.querySelector('.schedule_device_date').textContent = selectday.join(', ');
      } else {
        scheduleItem.querySelector('.schedule_device_date').textContent = selectedDate;
      }
  
      const formattedFromTime = `${fromTime}:00`;
      const formattedToTime = `${toTime}:00`;
      
      const fromDate = new Date(`1970-01-01T${fromTime}:00`);
      const toDate = new Date(`1970-01-01T${toTime}:00`);
  
      if (fromDate >= toDate) {
        alert("Please select a 'From' time that is earlier than the 'To' time.");
      } else {
        scheduleItem.querySelector('.schedule-time').textContent = `${formattedFromTime} - ${formattedToTime}`;
      }
  
      const scheduleContainer = document.getElementById('scheduleContainer');
      if (scheduleContainer && fromDate <= toDate) {
        scheduleContainer.appendChild(scheduleItem);
      } else {
        console.error("scheduleContainer not found!");
      }
  
      const deleteButton = scheduleItem.querySelector('.schedule_delete_list');
      deleteButton.addEventListener('click', function () {
        scheduleItem.remove();
      });
  
      resetInputs();
  
      // Send schedule data
      sendScheduleData(device, dateOption, fromTime, toTime, selectedDate, days)
        .then(() => {
          // Refresh the page after scheduling
          location.reload();
        })
        .catch(error => {
          console.error('Error sending schedule data:', error);
        });
    });
  
    document.getElementById('scheduleList').addEventListener('click', function (event) {
      if (event.target.classList.contains('schedule_delete_list')) {
        event.target.closest('.schedule-item').remove();
      }
    });
  
    function validateInputs(device, dateOption, fromTime, toTime) {
      let errors = [];
      if (!device) errors.push("Please select a device.");
  
      if (dateOption === 'setDate') {
        const dateRangeInput = document.getElementById('dateRange')._flatpickr.selectedDates;
        if (dateRangeInput.length !== 2) errors.push("Please select a date range.");
      }
  
      if (!fromTime) errors.push("Please select a 'From' time.");
      if (!toTime) errors.push("Please select a 'To' time.");
  
      if (dateOption === 'weekly') {
        let days = Array.from(document.querySelectorAll('#weekly_day_range input[type="checkbox"]:checked'))
          .map(cb => cb.value)
          .join('');
        if (days.length === 0) {
          errors.push("Please select at least one day for the weekly schedule.");
        }
      }
      return errors;
    }
  
    function getSelectedDate(dateOption) {
      if (dateOption === 'today') {
        return new Date().toLocaleDateString('en-GB'); // Get today's date in 'DD/MM/YYYY' format
      } else if (dateOption === 'setDate') {
        const dateRangeInput = document.getElementById('dateRange')._flatpickr.selectedDates;
        return dateRangeInput.length === 2
          ? `${dateRangeInput[0].toLocaleDateString('en-GB')} - ${dateRangeInput[1].toLocaleDateString('en-GB')}`
          : 'Invalid date range';
      } else if (dateOption === 'weekly') {
        const days = Array.from(document.querySelectorAll('#weekly_day_range input[type="checkbox"]:checked'))
          .map(cb => cb.value)
          .join('');
        if (days.length === 0) {
          return 'No days selected';
        }
        return days;
      }
    }
  
    function resetInputs() {
      document.getElementById('deviceSelect').value = '';
      document.getElementById('fromTime').value = '';
      document.getElementById('toTime').value = '';
      document.querySelectorAll('.day-checkbox').forEach(checkbox => checkbox.checked = false); // Reset checkboxes
    }
  
    function sendScheduleData(device, dateOption, fromTime, toTime, selectedDate, days) {
      if (dateOption === 'weekly' && days.length === 0) {
        console.error('No days selected for weekly schedule.');
        return Promise.reject('No days selected for weekly schedule.');
      }
      const requestData = {
        deviceSelect: device,
        scheduling: dateOption,
        fromTime: fromTime,
        toTime: toTime,
        selectedDate: selectedDate,
        day: days
      };
  
      console.log('Sending data:', requestData);
      return fetch('/deviceScheduling', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      })
        .then(response => response.json())
        .then(data => {
          console.log('Response:', data); // Log server response
          return data;
        })
        .catch(error => {
          console.error('Error:', error);
          throw error;
        });
    }
  
    $(document).ready(function () {
      $("#dateSelect").on("change", function () {
        const selectedOption = $(this).val();
        if (selectedOption === "weekly") {
          $("#weekly_day_range").show();
        } else {
          $("#weekly_day_range").hide();
        }
      });
    });
      // *****delete shedule******
  $(document).on('click', '.schedule_delete_list', function (e) {
    e.preventDefault();
    var scheduleId = $(this).data('id');
    console.log('Schedule ID:', scheduleId);

    if (!scheduleId) {
      alert('Schedule ID is undefined.');
      return;
    }

    if (confirm('Are you sure you want to delete this schedule?')) {
      $.ajax({
        url: '/delete_schedule/' + scheduleId,
        type: 'DELETE',
        success: function (result) {
          // alert('Schedule deleted successfully.');
          $(e.target).closest('.schedule-item').remove();
        },
        error: function (xhr, status, error) {
          alert('Error deleting schedule: ' + xhr.responseText);
        }
      });
    }
  });

  });
  