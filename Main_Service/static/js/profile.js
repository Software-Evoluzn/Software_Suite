document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.getElementById("searchInput");
    const tableRows = document.querySelectorAll("tbody tr");

    function filterTable() {
        const searchValue = searchInput.value.toLowerCase();

        tableRows.forEach(row => {
            const rowText = row.textContent.toLowerCase();

            const matchesSearch = rowText.includes(searchValue);

            if (matchesSearch) {
                row.style.display = "";
            } else {
                row.style.display = "none";
            }
        });
    }

    searchInput.addEventListener("keyup", filterTable);


    const deleteIcons = document.querySelectorAll('.delete_img');
    document.getElementById("profileImg").addEventListener("click", function () {
        document.getElementById("fileUpload").click();
    });

    // Optional: preview selected image
    document.getElementById("fileUpload").addEventListener("change", function (event) {
        if (event.target.files && event.target.files[0]) {
            document.getElementById("profileImg").src = URL.createObjectURL(event.target.files[0]);

            document.getElementById("uploadForm").submit();
        }
    });

    deleteIcons.forEach(icon => {
        icon.addEventListener('click', async function () {
            const deviceName = this.getAttribute('data-name');
            const row = this.closest('tr');

            if (confirm("Are you sure you want to delete this device?")) {
                try {
                    const response = await fetch(`/delete_device/${deviceName}`, {
                        method: 'DELETE'
                    });

                    const data = await response.json();
                    if (data.success) {
                        row.remove(); // Remove row from UI
                        window.location.reload(); // Reload the page to reflect changes
                    } else {
                        alert('Failed to delete: ' + (data.message || 'Unknown error'));
                    }
                } catch (error) {
                    console.error('Error:', error);
                    alert('An error occurred while deleting the device.');
                }
            }
        });
    });

});

