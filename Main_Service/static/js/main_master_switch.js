
function runningmasterswitch() {
  const switchContainer = document.querySelector('.main_running_label');
  const switchInput = switchContainer.querySelector('.main_running_master_switch');
  const switchKnob = switchContainer.querySelector('.main_running_master_div');
  let isDragging = false;

  switchKnob.onmousedown = function (e) {
    isDragging = true;
    let startX = e.clientX;
    let isChecked = switchInput.checked;

    document.onmousemove = function (e) {
      if (isDragging) {
        let moveX = e.clientX - startX;
        switchContainer.classList.toggle('on', moveX > 7.5 || (moveX > -7.5 && isChecked));
        switchInput.checked = moveX > 7.5;
      }
    };

    document.onmouseup = function () {
      isDragging = false;
      document.onmousemove = null;
      document.onmouseup = null;
    };
  };

  switchContainer.onclick = function (e) {
    if (!isDragging) {
      switchInput.checked = !switchInput.checked;
      switchContainer.classList.toggle('on', switchInput.checked);
    }
  };
}

function officelightmasterswitch() {
  const switchContainer = document.querySelector('.main_office_light_label');
  const switchInput = switchContainer.querySelector('.main_office_master_switch');
  const switchKnob = switchContainer.querySelector('.main_office_master_div');
  let isDragging = false;

  switchKnob.onmousedown = function (e) {
    isDragging = true;
    let startX = e.clientX;
    let isChecked = switchInput.checked;

    document.onmousemove = function (e) {
      if (isDragging) {
        let moveX = e.clientX - startX;
        switchContainer.classList.toggle('on', moveX > 7.5 || (moveX > -7.5 && isChecked));
        switchInput.checked = moveX > 7.5;
      }
    };

    document.onmouseup = function () {
      isDragging = false;
      document.onmousemove = null;
      document.onmouseup = null;
    };
  };

  switchContainer.onclick = function (e) {
    if (!isDragging) {
      switchInput.checked = !switchInput.checked;
      switchContainer.classList.toggle('on', switchInput.checked);
    }
  };
}


function highbaymasterswitch() {
  const switchContainer = document.querySelector('.main_highbay_light_label');
  const switchInput = document.querySelector('.main_highbay_master_switch');
  const switchKnob = switchContainer.querySelector('.main_highbay_master_div');
  let isDragging = false;

  switchKnob.onmousedown = function (e) {
    isDragging = true;
    let startX = e.clientX;
    let isChecked = switchInput.checked;

    document.onmousemove = function (e) {
      if (isDragging) {
        let moveX = e.clientX - startX;
        switchContainer.classList.toggle('on', moveX > 7.5 || (moveX > -7.5 && isChecked));
        switchInput.checked = moveX > 7.5;
      }
    };

    document.onmouseup = function () {
      isDragging = false;
      document.onmousemove = null;
      document.onmouseup = null;
    };
  };

  switchContainer.onclick = function (e) {
    if (!isDragging) {
      switchInput.checked = !switchInput.checked;
      switchContainer.classList.toggle('on', switchInput.checked);
    }
  };
}

// *******************************autobrightness start************************************************
function runningbrightness() {
  const switchContainer = document.querySelector('.main_running_autobrightness_label');
  const switchInput = switchContainer.querySelector('.main_running_autobrightness_switch');
  const switchKnob = switchContainer.querySelector('.main_running_autobrigtness_div');
  const rangeInput = document.querySelector('.main_luxrange_running_light'); // Select the input range element
  let isDragging = false;

  // Set initial state of range input based on switch state
  rangeInput.disabled = !switchInput.checked;

  switchKnob.onmousedown = function (e) {
    isDragging = true;
    let startX = e.clientX;
    let isChecked = switchInput.checked;

    document.onmousemove = function (e) {
      if (isDragging) {
        let moveX = e.clientX - startX;
        const newCheckedState = moveX > 7.5 || (moveX > -7.5 && isChecked);
        switchContainer.classList.toggle('on', newCheckedState);
        switchInput.checked = newCheckedState;
        rangeInput.disabled = !newCheckedState; // Enable/disable the range input based on the new checked state
      }
    };

    document.onmouseup = function () {
      isDragging = false;
      document.onmousemove = null;
      document.onmouseup = null;
    };
  };

  switchContainer.onclick = function (e) {
    if (!isDragging) {
      switchInput.checked = !switchInput.checked;
      const isChecked = switchInput.checked;
      switchContainer.classList.toggle('on', isChecked);
      rangeInput.disabled = !isChecked; // Enable/disable the range input based on the new checked state
    }
  };
}



function officelightbrightness() {
  const switchContainer = document.querySelector('.main_autobrightness_label');
  const switchInput = switchContainer.querySelector('.main_office_autobrightness');
  const switchKnob = switchContainer.querySelector('.main_office_autobrightness_div');
  const rangeInput = document.querySelector('.main_luxrange_office_light'); // Select the input range element
  let isDragging = false;

  // Set initial state of range input based on switch state
  rangeInput.disabled = !switchInput.checked;

  switchKnob.onmousedown = function (e) {
    isDragging = true;
    let startX = e.clientX;
    let isChecked = switchInput.checked;

    document.onmousemove = function (e) {
      if (isDragging) {
        let moveX = e.clientX - startX;
        const newCheckedState = moveX > 7.5 || (moveX > -7.5 && isChecked);
        switchContainer.classList.toggle('on', newCheckedState);
        switchInput.checked = newCheckedState;
        rangeInput.disabled = !newCheckedState; // Enable/disable the range input based on the new checked state
      }
    };

    document.onmouseup = function () {
      isDragging = false;
      document.onmousemove = null;
      document.onmouseup = null;
    };
  };

  switchContainer.onclick = function (e) {
    if (!isDragging) {
      switchInput.checked = !switchInput.checked;
      const isChecked = switchInput.checked;
      switchContainer.classList.toggle('on', isChecked);
      rangeInput.disabled = !isChecked; // Enable/disable the range input based on the new checked state
    }
  };
}



function hibaybrightness() {
  const switchContainer = document.querySelector('.main_highbay_officeauto_motion_label');
  const switchInput = switchContainer.querySelector('.main_highbay_auto_motion');
  const switchKnob = switchContainer.querySelector('.main_highbay_auto_motion_div');
  let isDragging = false;

  switchKnob.onmousedown = function (e) {
    isDragging = true;
    let startX = e.clientX;
    let isChecked = switchInput.checked;

    document.onmousemove = function (e) {
      if (isDragging) {
        let moveX = e.clientX - startX;
        switchContainer.classList.toggle('on', moveX > 7.5 || (moveX > -7.5 && isChecked));
        switchInput.checked = moveX > 7.5;
      }
    };

    document.onmouseup = function () {
      isDragging = false;
      document.onmousemove = null;
      document.onmouseup = null;
    };
  };

  switchContainer.onclick = function (e) {
    if (!isDragging) {
      switchInput.checked = !switchInput.checked;
      switchContainer.classList.toggle('on', switchInput.checked);
    }
  };
}




// master switch function call

runningmasterswitch();
officelightmasterswitch();
highbaymasterswitch();


// ***********************

// brightness switch function call 

runningbrightness();
officelightbrightness();
hibaybrightness();

document.querySelector('.main_sc_img_span').addEventListener('click', function() {
  var span = this;
  var icon = span.querySelector('.main_ac_icon');
  var text = document.querySelector('.main_on_off_text');

  var computedStyle = window.getComputedStyle(span);
  var backgroundColor = computedStyle.getPropertyValue('background-color');

  if (backgroundColor === 'rgb(228, 235, 255)') {
      span.style.backgroundColor = '#DBDBDB';
      icon.style.color = '#BABABA';
      text.textContent = 'OFF';
  } else {
      span.style.backgroundColor = '#E4EBFF';
      icon.style.color = '#3965FF';
      text.textContent = 'ON';
  }
});