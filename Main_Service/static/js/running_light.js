// master intensity
const ranges1 = document.querySelectorAll(".dashboard_intensity_control_input");
const percents1 = document.querySelectorAll(".dashboard_intensity_percent");

ranges1.forEach((ranges1, index) => {
  ranges1.addEventListener("input", () => {
    percents1[index].textContent = ranges1.value + " lux";
  });
});


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




function toggleSwitch1(id) {
  const checkbox = document.querySelector('.dashboard_main_checkbox1');
  const action = checkbox.checked ? 'turnonMaster1' : 'turnoffMaster1';
  const data = {
      id: id,
      action: action
  };

  fetch('/turnMaster1', {
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



function toggleSwitch2(id) {
  const checkbox = document.querySelector('.dashboard_main_checkbox2');
  const action = checkbox.checked ? 'turnonMaster1' : 'turnoffMaster1';
  const data = {
      id: id,
      action: action
  };

  fetch('/turnMaster1', {
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

function toggleSwitch3(id) {
  const checkbox = document.querySelector('.dashboard_main_checkbox3');
  const action = checkbox.checked ? 'turnonMaster1' : 'turnoffMaster1';
  const data = {
      id: id,
      action: action
  };

  fetch('/turnMaster1', {
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



function toggleSwitch4(id) {
  const checkbox = document.querySelector('.dashboard_main_checkbox4');
  const action = checkbox.checked ? 'turnonMaster1' : 'turnoffMaster1';
  const data = {
      id: id,
      action: action
  };

  fetch('/turnMaster1', {
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



function toggleSwitch5(id) {
  const checkbox = document.querySelector('.dashboard_main_checkbox5');
  const action = checkbox.checked ? 'turnonMaster1' : 'turnoffMaster1';
  const data = {
      id: id,
      action: action
  };

  fetch('/turnMaster1', {
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



function toggleSwitch6(id) {
  const checkbox = document.querySelector('.dashboard_main_checkbox6');
  const action = checkbox.checked ? 'turnonMaster1' : 'turnoffMaster1';
  const data = {
      id: id,
      action: action
  };

  fetch('/turnMaster1', {
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


document.addEventListener("DOMContentLoaded", () => {
  const slider = document.querySelectorAll(".dashboard_intensity_control_input");
  const percentage = document.querySelectorAll(".dashboard_intensity_percent");
    slider.forEach((RangeGlobal, index) => {
    RangeGlobal.addEventListener("input", () => {
      percentage[index].textContent = RangeGlobal.value + "%";
    });

    RangeGlobal.addEventListener("change", () => {
      const topic = RangeGlobal.getAttribute('data-device-id');
      const ledIntensity = RangeGlobal.value;

      fetch('/update_global_lux', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic: topic + 'control', ledIntensity: ledIntensity }),
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        console.log('Flask API response:', data);
      })
      .catch(error => {
        console.error('There was a problem with the fetch operation:', error);
      });
    });
  });
});


// ***********sarang****************
document.addEventListener("DOMContentLoaded", () => {
  const ranges1 = document.querySelectorAll(".dashboard_smart_led1_range1");
  const percents1 = document.querySelectorAll(".dashboard_percent1");
    ranges1.forEach((range1, index) => {
    range1.addEventListener("input", () => {
      percents1[index].textContent = range1.value + "%";
    });

    range1.addEventListener("change", () => {
      const topic = range1.getAttribute('data-device-id');
      const ledIntensity = range1.value;

      fetch('/intensity_running_individual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic: topic + '/control', ledIntensity: ledIntensity }),
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        console.log('Flask API response:', data);
      })
      .catch(error => {
        console.error('There was a problem with the fetch operation:', error);
      });
    });
  });
});


  document.addEventListener("DOMContentLoaded", () => {
    const ranges2 = document.querySelectorAll(".dashboard_smart_led1_range2");
    const percents2 = document.querySelectorAll(".dashboard_percent2");
      ranges2.forEach((range2, index) => {
      range2.addEventListener("input", () => {
        percents2[index].textContent = range2.value + "%";
      });
  
      range2.addEventListener("change", () => {
        const topic = range2.getAttribute('data-device-id');
        const ledIntensity = range2.value;
  
        fetch('/intensity_running_individual', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ topic: topic + '/control', ledIntensity: ledIntensity }),
        })
        .then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return response.json();
        })
        .then(data => {
          console.log('Flask API response:', data);
        })
        .catch(error => {
          console.error('There was a problem with the fetch operation:', error);
        });
      });
    });
  });
  



  document.addEventListener("DOMContentLoaded", () => {
    const ranges3 = document.querySelectorAll(".dashboard_smart_led1_range3");
    const percents3 = document.querySelectorAll(".dashboard_percent3");
      ranges3.forEach((range3, index) => {
      range3.addEventListener("input", () => {
        percents3[index].textContent = range3.value + "%";
      });
  
      range3.addEventListener("change", () => {
        const topic = range3.getAttribute('data-device-id');
        const ledIntensity = range3.value;
  
        fetch('/intensity_running_individual', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ topic: topic + '/control', ledIntensity: ledIntensity }),
        })
        .then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return response.json();
        })
        .then(data => {
          console.log('Flask API response:', data);
        })
        .catch(error => {
          console.error('There was a problem with the fetch operation:', error);
        });
      });
    });
  });
  

  document.addEventListener("DOMContentLoaded", () => {
    const ranges4 = document.querySelectorAll(".dashboard_smart_led1_range4");
    const percents4 = document.querySelectorAll(".dashboard_percent4");
      ranges4.forEach((range4, index) => {
      range4.addEventListener("input", () => {
        percents4[index].textContent = range4.value + "%";
      });
  
      range4.addEventListener("change", () => {
        const topic = range4.getAttribute('data-device-id');
        const ledIntensity = range4.value;
  
        fetch('/intensity_running_individual', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ topic: topic + '/control', ledIntensity: ledIntensity }),
        })
        .then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return response.json();
        })
        .then(data => {
          console.log('Flask API response:', data);
        })
        .catch(error => {
          console.error('There was a problem with the fetch operation:', error);
        });
      });
    });
  });
  

  document.addEventListener("DOMContentLoaded", () => {
    const ranges5 = document.querySelectorAll(".dashboard_smart_led1_range5");
    const percents5 = document.querySelectorAll(".dashboard_percent5");
      ranges5.forEach((range5, index) => {
      range5.addEventListener("input", () => {
        percents5[index].textContent = range5.value + "%";
      });
  
      range5.addEventListener("change", () => {
        const topic = range5.getAttribute('data-device-id');
        const ledIntensity = range5.value;
  
        fetch('/intensity_running_individual', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ topic: topic + '/control', ledIntensity: ledIntensity }),
        })
        .then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return response.json();
        })
        .then(data => {
          console.log('Flask API response:', data);
        })
        .catch(error => {
          console.error('There was a problem with the fetch operation:', error);
        });
      });
    });
  });


  document.addEventListener("DOMContentLoaded", () => {
    const ranges6 = document.querySelectorAll(".dashboard_smart_led1_range6");
    const percents6 = document.querySelectorAll(".dashboard_percent6");
      ranges6.forEach((range6, index) => {
      range6.addEventListener("input", () => {
        percents6[index].textContent = range6.value + "%";
      });
  
      range6.addEventListener("change", () => {
        const topic = range6.getAttribute('data-device-id');
        const ledIntensity = range6.value;
  
        fetch('/intensity_running_individual', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ topic: topic + '/control', ledIntensity: ledIntensity }),
        })
        .then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return response.json();
        })
        .then(data => {
          console.log('Flask API response:', data);
        })
        .catch(error => {
          console.error('There was a problem with the fetch operation:', error);
        });
      });
    });
  });
// ***********sarang*****

// individual intensity
// const ranges = document.querySelectorAll(".dashboard_smart_led1_range");
// const percents = document.querySelectorAll(".dashboard_percent");

// ranges.forEach((range, index) => {
//   range.addEventListener("input", () => {
//     percents[index].textContent = range.value + "%";
//   });
// });


  
// const rangeInputs = document.querySelectorAll('.intensity-bar');

ranges.forEach(input => {
    input.addEventListener('change', function() {
        const topic = this.id;
        console.log("topic...:",topic);
        const value = this.value;
        console.log("value...:",value);

        fetch('/update_intensity', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ topic: topic + '/control', ledIntensity: value }),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Flask API response:', data);
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
    });
});
});





const rangesRunning1 = document.querySelectorAll(".dashboard_intensity_control_input");
const percentsRunning1 = document.querySelectorAll(".dashboard_intensity_percent");

rangesRunning1.forEach((percentsRunning1, index) => {
    rangesRunning1.addEventListener("input", () => {
        percentsRunning1[index].textContent = percentsRunning1.value + " lux";
  });
});

// var slider = document.querySelector('.dashboard_intensity_control_input');
// var percentage = document.querySelector('.dashboard_intensity_percent');

// slider.addEventListener('change', function () {
//     percentage.textContent = this.value + ' lux';

//     var luxValue = this.value;
//     var requestData = {
//         lux_value: luxValue
//     };

//     fetch('/update_global_lux', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json'
//         },
//         body: JSON.stringify(requestData)
//     })
//         .then(response => {
//             if (response.ok) {
//                 return response.json();
//             }
//             throw new Error('Network response was not ok.');
//         })
//         .then(data => {
//             console.log(data.message);
//         })
//         .catch(error => {
//             console.error('Error:', error);
//         });
// });