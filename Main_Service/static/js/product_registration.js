let productFormCount = 0;

function addProductForm() {
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
            <option value="Laptop">Laptop</option>
            <option value="Mobile">Mobile</option>
            <option value="Printer">Printer</option>
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
    addSerialRow(serialContainerId, productTypeSelectId); // Add one serial by default
}

function addSerialRow(containerId, productTypeSelectId) {
    const rowId = `serial-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const productType = document.getElementById(productTypeSelectId)?.value;
    const showDuration = productType === "Mobile";

    const html = `
  <div class="serial-row" id="${rowId}">
    <span class="remove-serial text-danger" onclick="document.getElementById('${rowId}').remove()">✖</span>
    <div class="row">
      <div class="col-md-6 mb-2">
        <label>Unit Name</label>
        <input type="text" class="form-control form-control-sm" placeholder="Unit Name (optional)">
      </div>
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
            ${[1, 2, 3, 4, 5].map(i => `
                <div class="col">
                <div class="form-check d-flex align-items-center">
                    <input class="form-check-input user-access me-2 ${rowId}-user" type="checkbox" id="${rowId}-user${i}" onchange="checkIfAllSelected('${rowId}')" style="width: 1em; height: 1em;">
                    <label class="form-check-label mb-0 text-primary" for="${rowId}-user${i}">User ${i}</label>
                </div>
                </div>
            `).join('')}
            </div>
        </div>
        </div>

        
        ${showDuration ? `
            <div class="col-md-6 mb-2">
                    <label>Usage Duration (for Mobile)</label>
                    <select class="form-select">
                        <option value="">Select Duration</option>
                        <option>5 sec</option>
                        <option>10 sec</option>
                        <option>1 min</option>
                        <option>10 min</option>
                    </select>
            </div>` : ''}
        </div>
  </div>
`;

    document.getElementById(containerId).insertAdjacentHTML('beforeend', html);
}

function handleProductTypeChange(productTypeSelectId, serialContainerId) {
    const type = document.getElementById(productTypeSelectId).value;
    const serialContainer = document.getElementById(serialContainerId);
    serialContainer.innerHTML = ''; // clear previous serials
    addSerialRow(serialContainerId, productTypeSelectId);
}

function toggleAllUsers(rowId) {
    const isChecked = document.getElementById(`${rowId}-all`).checked;
    const userCheckboxes = document.querySelectorAll(`.${rowId}-user`);
    userCheckboxes.forEach(cb => cb.checked = isChecked);
}

function checkIfAllSelected(rowId) {
    const allCheckbox = document.getElementById(`${rowId}-all`);
    const userCheckboxes = document.querySelectorAll(`.${rowId}-user`);
    const allChecked = Array.from(userCheckboxes).every(cb => cb.checked);
    allCheckbox.checked = allChecked;
}
