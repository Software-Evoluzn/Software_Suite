document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('adminForm');
  const companyNameInput = document.getElementById('company_name');
  // const deviceInput = document.getElementById('device_name');
  // const deviceTypeSelect = document.getElementById('device_type');
  // const deviceduration = document.getElementById('device_duration');
  const deviceContainer = document.querySelector('.device_container');
  const addProductForm = document.getElementById('addProductForm');
  const unitSelect = document.getElementById('unitSelect');

  let productFormCount = 0;
  let lastUnitValue = unitSelect.value;

  // ✅ Handle form submission
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    console.log("here comes the data");
    const companyName = companyNameInput.value.trim();
    // const deviceName = deviceInput.value.trim();
    // const deviceType = deviceTypeSelect.value;
    // const deviceDuration = deviceduration.value;

    const deviceData = [];

    const productForms = document.querySelectorAll('.form-box');
    const productData = [];

    productForms.forEach(formBox => {
      const productType = formBox.querySelector('select').value;
      const dateOfPurchase = formBox.querySelector('input[type="date"]').value;
      const warrantyPeriod = formBox.querySelector('input[placeholder^="e.g."]').value;

      const serials = [];
      const serialRows = formBox.querySelectorAll('.serial-row');

      serialRows.forEach(row => {
        const serialNumber = row.querySelector('input[type="text"]').value.trim();
        if (!serialNumber) return;

        const userCheckboxes = row.querySelectorAll('input[type="checkbox"].form-check-input');
        const selectedUsers = [];

        userCheckboxes.forEach(checkbox => {
          if (
            checkbox.checked &&
            checkbox.id.includes('-user') && // avoid the "-all" checkbox
            !checkbox.id.endsWith('-all')
          ) {
            const label = formBox.querySelector(`label[for="${checkbox.id}"]`);
            if (label) {
              selectedUsers.push(label.textContent.trim());
            }
          }
        });

        serials.push({
          serial_number: serialNumber,
          user_access: selectedUsers
        });
      });

      if (productType && serials.length > 0) {
        productData.push({
          product_type: productType,
          date_of_purchase: dateOfPurchase,
          warranty_period: warrantyPeriod,
          serials: serials
        });
      }
    });


    // if (deviceName) {
    //   deviceData.push({ device_type: deviceType, device_name: deviceName });
    // }

    // deviceContainer.querySelectorAll('div.mt-2').forEach(deviceDiv => {
    //   const select = deviceDiv.querySelector('select');
    //   const input = deviceDiv.querySelector('input');
    //   if (select && input && input.value.trim()) {
    //     deviceData.push({ device_type: select.value, device_name: input.value.trim() });
    //   }
    // });

    console.log("Company Name:", companyName);
    // console.log("Device Data:", deviceData);
    console.log("unitSelect Value:", unitSelect.value);
    console.log("Product Data:", productData);

    fetch('/add_device', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company_name: companyName,
        unit_name: unitSelect.value,
        product_data: productData
      })
    })
      .then(response => response.json())
      .then(data => {
        if (data.status === 'success') {
          alert("Successfully Added!!!");
          companyNameInput.value = '';
          deviceInput.value = '';
          deviceTypeSelect.selectedIndex = 0;
          addedDeviceDivs.forEach(deviceDiv => deviceDiv.remove());
        } else {
          alert("Error: " + data.message);
        }
      })
      .catch(error => {
        console.error("Error:", error);
        alert("An error occurred. Check console for details.");
      });
  });

  // ✅ Add Product Form
  addProductForm.addEventListener('click', function () {
    const container = document.getElementById("productFormsContainer");
    const formId = `product-form-${productFormCount++}`;
    const serialContainerId = `${formId}-serials`;
    const productTypeSelectId = `${formId}-product-type`;

    const html = `
      <div class="form-box" id="${formId}">
        <div class="d-flex justify-content-between align-items-center">
          <h6>Product Category</h6>
          <button type="button" class="btn-close p-0" style="margin-top: -20px; margin-right: -5px;" onclick="document.getElementById('${formId}').remove()"></button>
        </div>

        <div class="row mb-2 mt-3">
          <div class="col-md-4">
            <label>Product Type</label>
            <select id="${productTypeSelectId}" class="form-select form-select-sm" onchange="handleProductTypeChange('${productTypeSelectId}', '${serialContainerId}')">
              <option value="">Select Type</option>
              ${availableProducts.map(p =>
      `<option value="${p.product_name}">${p.product_name}</option>`
    ).join('')}
            </select>
          </div>

          <div class="col-md-4">   
            <label>Date of Purchase</label>
            <input type="date" class="form-control form-control-sm">
          </div>

          <div class="col-md-4">
            <label>Warranty Period</label>
            <input type="text" class="form-control form-control-sm" placeholder="e.g. 12 months">
          </div>
        </div>

        <div class="mb-2">
          <div class="text-end mt-3 mb-3">
            <button type="button" class="btn btn-secondary btn-sm" onclick="addSerialRow('${serialContainerId}', '${productTypeSelectId}')">+ Add Serial Number</button>
          </div>
          <div id="${serialContainerId}" class="mt-2"></div>
        </div>
      </div>
    `;

    container.insertAdjacentHTML('beforeend', html);
    addSerialRow(serialContainerId, productTypeSelectId);
  });

  // ✅ Add Serial Row
  window.addSerialRow = function (containerId, productTypeSelectId) {
    const rowId = `serial-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

    // ✅ Get latest selected unit name
    const currentUnitName = document.getElementById('unitSelect')?.value || '';
    const filteredUsers = availableUsers.filter(user => user.unit_name === currentUnitName);

    console.log("Current Unit:", currentUnitName);
    console.log("Filtered Users:", filteredUsers);

    const html = `
      <div class="serial-row" id="${rowId}">
        <span class="remove-serial text-danger" onclick="document.getElementById('${rowId}').remove()">✖</span>
        <div class="row">
          <div class="col-md-6 mb-2">
            <label>Serial Number</label>
            <input type="text" class="form-control form-control-sm" placeholder="Enter Serial No.">
          </div>

          <div class="col-md-6 mb-2">
            <label class="form-label">User Access</label>
            <div class="p-3 rounded" style="background-color: #f0f5ff;">
              <div class="form-check d-flex align-items-center mb-2">
                <input class="form-check-input user-access me-2" type="checkbox" id="${rowId}-all" onchange="toggleAllUsers('${rowId}')" style="width: 1em; height: 1em;">
                <label class="form-check-label fw-semibold text-primary mb-0" for="${rowId}-all">All Users</label>
              </div>
              <hr class="my-2">
              <div class="row row-cols-2 g-2">
                ${filteredUsers.map(user => `
                  <div class="col">
                    <div class="form-check d-flex align-items-center">
                      <input class="form-check-input user-access me-2 ${rowId}-user" 
                             type="checkbox" 
                             id="${rowId}-user${user.id}" 
                             onchange="checkIfAllSelected('${rowId}')" 
                             style="width: 1em; height: 1em;">
                      <label class="form-check-label mb-0 text-primary" for="${rowId}-user${user.id}">${user.name}</label>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById(containerId).insertAdjacentHTML('beforeend', html);
  };

  // ✅ Refresh serials on product type change
  window.handleProductTypeChange = function (productTypeSelectId, serialContainerId) {
    const serialContainer = document.getElementById(serialContainerId);
    serialContainer.innerHTML = ''; // Clear previous
    addSerialRow(serialContainerId, productTypeSelectId);
  };

  // ✅ Toggle all users
  window.toggleAllUsers = function (rowId) {
    const isChecked = document.getElementById(`${rowId}-all`).checked;
    document.querySelectorAll(`.${rowId}-user`).forEach(cb => cb.checked = isChecked);
  };

  // ✅ Check if all individual checkboxes are selected
  window.checkIfAllSelected = function (rowId) {
    const allCheckbox = document.getElementById(`${rowId}-all`);
    const userCheckboxes = document.querySelectorAll(`.${rowId}-user`);
    allCheckbox.checked = Array.from(userCheckboxes).every(cb => cb.checked);
  };


  // ✅ Update all serial rows when unit changes
  unitSelect?.addEventListener('change', function () {
    const newUnit = this.value;

    if (document.querySelectorAll('.serial-row').length > 0) {
      const confirmed = confirm("Changing the unit will reset user access checkboxes. Proceed?");
      if (!confirmed) {
        this.value = lastUnitValue;
        return;
      }
    }

    lastUnitValue = newUnit;
    updateAllUserListsForUnit(newUnit);
  });

  // ✅ Replace user access in existing serial rows
  function updateAllUserListsForUnit(unitName) {
    const serialRows = document.querySelectorAll('.serial-row');
    const filteredUsers = availableUsers.filter(user => user.unit_name === unitName);

    serialRows.forEach(row => {
      const rowId = row.id;
      const container = row.querySelector('.row.row-cols-2.g-2');
      if (!container) return;

      container.innerHTML = filteredUsers.map(user => `
        <div class="col">
          <div class="form-check d-flex align-items-center">
            <input class="form-check-input ${rowId}-user me-2"  style="width: 1em; height: 1em;" type="checkbox" id="${rowId}-user${user.id}" onchange="checkIfAllSelected('${rowId}')">
            <label class="form-check-label mb-0 text-primary" for="${rowId}-user${user.id}">${user.name}</label>
          </div>
        </div>
      `).join('');
    });
  }
});
