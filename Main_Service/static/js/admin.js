function showProduct() {
    document.getElementById("adminForm").classList.remove("hidden");
    document.getElementById("registerForm").classList.add("hidden");
    document.getElementById("productBtn").classList.add("active");
    document.getElementById("registerBtn").classList.remove("active");
}

function showRegister() {
    document.getElementById("registerForm").classList.remove("hidden");
    document.getElementById("adminForm").classList.add("hidden");
    document.getElementById("registerBtn").classList.add("active");
    document.getElementById("productBtn").classList.remove("active");
}

let unitCount = 0;
let userCount = 0;
let units = [];

function addUnit(prefill = {}) {
    const unitId = `unit-${Date.now()}`;
    const unitDiv = document.createElement("div");
    unitDiv.classList.add("border", "p-2", "mb-2", "position-relative", "rounded-3");
    unitDiv.setAttribute("data-unit-id", unitId);

    const unitName = `prefill.name || Unit ${++unitCount}`;
    units.push({ id: unitId, name: unitName });

    unitDiv.innerHTML = `
      <button type="button" class="del_btn btn-close position-absolute end-0 top-0 m-2" aria-label="Delete" onclick="deleteUnit('${unitId}')"></button>
      <div class="row">
        <div class="col-md-6 mb-2">
          <label>Unit Name</label>
          <input type="text" class="form-control form-control-sm unit-name" placeholder="Unit Name" value="${prefill.name || ''}">
        </div>
        <div class="col-md-6 mb-2">
          <label>Unit Address</label>
          <input type="text" class="form-control form-control-sm" placeholder="Unit Address" value="${prefill.address || ''}">
        </div>
        <div class="col-md-6 mb-2">
          <label class="">GST No.</label>
          <input type="text" class="form-control form-control-sm" placeholder="Enter GST No.">
        </div>
      </div>
    `;
    document.getElementById("unitContainer").appendChild(unitDiv);

    const nameInput = unitDiv.querySelector(".unit-name");
    nameInput.addEventListener("input", () => {
        const unit = units.find(u => u.id === unitId);
        if (unit) {
            unit.name = nameInput.value;
            updateUnitDropdowns();
        }
    });

    updateUnitDropdowns();
}

function deleteUnit(id) {
    const unitDiv = document.querySelector(`[data-unit-id="${id}"]`);
    if (unitDiv) unitDiv.remove();
    units = units.filter(unit => unit.id !== id);
    updateUnitDropdowns();
}

function addUser() {
    const userId = `user-${Date.now()}`;
    const hasUnits = units.length > 0;

    const userDiv = document.createElement("div");
    userDiv.classList.add("border", "p-2", "mb-2", "position-relative", "rounded-3");
    userDiv.setAttribute("data-user-id", userId);
    userDiv.innerHTML = `
      <button type="button" class="del_btn btn-close position-absolute end-0 top-0 m-2" aria-label="Delete" onclick="deleteUser('${userId}')"></button>
      <div class="row">
        <div class="col-md-6 mb-2">
            <label>User Name</label>
            <input type="text" class="form-control form-control-sm mb-2" placeholder="User Name">
        </div>
        <div class="col-md-6 mb-2">
            <label>Unit Name</label>
            <select class="form-control mb-2 mt-2 unit-dropdown" ${hasUnits ? '' : 'disabled'}>
                ${hasUnits ? units.map(unit => `<option>${unit.name}</option>`).join("") : '<option></option>'}
            </select>
        </div>
        <div class="col-md-6 mb-2">
            <label>Contact No.</label>
            <input type="text" class="form-control form-control-sm mb-2" placeholder="Contact Number">
        </div>
        <div class="col-md-6 mb-2">
            <label>Email</label>
            <input type="email" class="form-control form-control-sm mb-2" placeholder="User Email">
        </div>
        <div class="col-md-6 mb-2">
            <label>Set Password</label>
            <input type="password" class="form-control form-control-sm" placeholder="Set Password">
        </div>
      </div>
    `;
    document.getElementById("userContainer").appendChild(userDiv);
    userCount++;
}

function deleteUser(id) {
    const userDiv = document.querySelector(`[data-user-id="${id}"]`);
    if (userDiv) userDiv.remove();
}

function updateUnitDropdowns() {
    const dropdowns = document.querySelectorAll(".unit-dropdown");
    dropdowns.forEach(dropdown => {
        dropdown.innerHTML = units.map(unit => `<option>${unit.name}</option>`).join("");
    });
}

// =================== Register Form Submission ===================

document.getElementById("registerFormElement").addEventListener("submit", function (e) {
    e.preventDefault();

    const companyName = document.getElementById("company_name").value.trim();
    const companyAddress = document.getElementById("company_address").value.trim();
    const gstNo = document.getElementById("gst_no").value.trim();

    if (!companyName || !companyAddress || !gstNo) {
        alert("Please fill in Company Name, Address, and GST No.");
        return;
    }

    const contactName = document.querySelector("input[placeholder='Name']")?.value.trim();
    const contactNumber = document.querySelector("input[placeholder='Contact Number']")?.value.trim();
    const contactEmail = document.querySelector("input[placeholder='Email Address']")?.value.trim();
    const contactPassword = document.querySelector("input[placeholder='Set Password']")?.value;

    if (!contactName || !contactNumber || !contactEmail || !contactPassword) {
        alert("Please fill in all contact person fields.");
        return;
    }

    const unitData = [];
    document.querySelectorAll("#unitContainer > div").forEach(unitDiv => {
        const unitName = unitDiv.querySelector(".unit-name")?.value.trim();
        const unitAddress = unitDiv.querySelector("input[placeholder='Unit Address']")?.value.trim();
        const unitGst = unitDiv.querySelector("input[placeholder='Enter GST No.']")?.value.trim();

        if (unitName && unitAddress && unitGst) {
            unitData.push({
                unit_name: unitName,
                unit_address: unitAddress,
                unit_gst: unitGst
            });
        }
    });

    const users = [{
        username: contactName,
        contact: contactNumber,
        email: contactEmail,
        password: contactPassword,
        unit_name: unitData.length ? unitData[0].unit_name : ''
    }];

    document.querySelectorAll("#userContainer > div").forEach(userDiv => {
        const username = userDiv.querySelector("input[placeholder='User Name']")?.value.trim();
        const unit = userDiv.querySelector(".unit-dropdown")?.value;
        const contact = userDiv.querySelector("input[placeholder='Contact Number']")?.value.trim();
        const email = userDiv.querySelector("input[placeholder='User Email']")?.value.trim();
        const password = userDiv.querySelector("input[placeholder='Set Password']")?.value;

        if (username && unit && contact && email && password) {
            users.push({
                username,
                unit_name: unit,
                contact,
                email,
                password
            });
        }
    });

    fetch("/company-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            company_name: companyName,
            company_address: companyAddress,
            gst_no: gstNo,
            units: unitData,
            users: users
            
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === "success") {
            alert("Company Registered Successfully!");
            document.getElementById("registerFormElement").reset();
            document.getElementById("unitContainer").innerHTML = "";
            document.getElementById("userContainer").innerHTML = "";
            units.length = 0;
            updateUnitDropdowns();
        } else {
            alert("Error: " + data.message);
        }
    })
    .catch(error => {
        console.error("Submission Error:", error);
        alert("Failed to register company. See console for error.");
    });
});
