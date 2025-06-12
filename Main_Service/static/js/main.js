// document.addEventListener("DOMContentLoaded", function() {
//   const autoBrightnessCheckbox = document.querySelector('.auto-brightness');
//   const intensityControlInput = document.querySelector('.dashboard_intensity_control_input');

//   function toggleIntensityControl() {
//       if (autoBrightnessCheckbox.checked) {
//           intensityControlInput.disabled = false;
//       } else {
//           intensityControlInput.disabled = true;
//       }
//   }

//   // Initial check
//   toggleIntensityControl();

//   // Add event listener to the checkbox
//   autoBrightnessCheckbox.addEventListener('change', toggleIntensityControl);
// });


// JavaScript to handle sidebar toggling
function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  const isVisible = getComputedStyle(sidebar).transform === "none";

  if (isVisible) {
    sidebar.style.transform = "translateX(-100%)";
  } else {
    sidebar.style.transform = "none";
  }
}


// NOTIFICATION BOX

function toggleNotification() {
    var notificationBox = document.getElementById("notificationBox");
    if (notificationBox.style.display === "none" || notificationBox.style.display === "") {
        notificationBox.style.display = "block";
    } else {
        notificationBox.style.display = "none";
    }
}


// ***********************************
function closeAlert(btn) {
  var alertBox = btn.closest(".dashboard_alert_main_div2");
  alertBox.style.display = "none";
}
document.addEventListener("DOMContentLoaded", function() {
  var closebtns = document.querySelectorAll(" .dashboard_close_btn");

  closebtns.forEach(function(btn) {
      btn.addEventListener("click", function () {
          // Get the alert ID from the data attribute of the parent element
          var alertId = this.parentElement.getAttribute('data-alert-id');

          // Ensure the alert ID is fetched correctly
          console.log("Alert ID:", alertId);

          if (alertId) {
              // Hide the alert
              this.parentElement.style.display = 'none';

              // Send an AJAX request to update the delete time in the database
              var xhr = new XMLHttpRequest();
              xhr.open("POST", "/close_alert", true);
              xhr.setRequestHeader("Content-Type", "application/json");
              xhr.onreadystatechange = function () {
                  if (xhr.readyState === 4) {
                      if (xhr.status === 200) {
                          console.log("Alert closed successfully");
                      } else {
                          console.error("Error closing alert:", xhr.responseText);
                      }
                  }
              };
              xhr.send(JSON.stringify({ alert_id: alertId }));
          } else {
              console.error("Alert ID not found for element:", this);
          }
     });
});
});

 
