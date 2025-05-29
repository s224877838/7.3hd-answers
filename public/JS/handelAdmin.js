// handelAdmin.js

// Load admins on page load if the user is an admin
window.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token || role !== "super-admin") {
    alert("You must be logged in as a super admin to access this page.");
    window.location.href = document.referrer || "/index.html";
    return;
  }

  loadAdmins();
});

// Load Admins and render them in the table
async function loadAdmins() {
  const token = localStorage.getItem("token");

  try {
    const res = await fetch("/api/users?limit=100", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    console.log("All users fetched from API:", data.users);
    const admins = data.users.filter((user) => user.role === "admin");

    const tbody = document.querySelector("table tbody");
    tbody.innerHTML = "";

    if (admins.length === 0) {
      tbody.innerHTML = '<tr><td colspan="3">No admins found.</td></tr>';
      return;
    }

    admins.forEach((admin, index) => {
      const row = document.createElement("tr");
      row.innerHTML = `
          <td>${index + 1}</td>
          <td> ${admin.name} </td>
          <td>${admin.email}</td>
          <td>
            <button class="btn btn-warning btn-sm" onclick="editAdmin('${
              admin._id
            }', '${admin.name}', '${admin.email}')">
              <i class="fas fa-edit"></i> Edit
            </button>
            <button class="btn btn-danger btn-sm" onclick="deleteAdmin('${
              admin._id
            }')">
              <i class="fas fa-trash"></i> Delete
            </button>
          </td>
        `;
      tbody.appendChild(row);
    });
  } catch (err) {
    console.error("Error loading admins:", err);
    alert("Error loading admins.");
  }
}

/* Handle admin creation
async function submitAdminForm(event) {
  event.preventDefault();

  const name = document.getElementById("adminName").value.trim();
  const email = document.getElementById("adminEmail").value.trim();
  const password = document.getElementById("adminPassword").value;
  const confirmPassword = document.getElementById("adminConfirmPassword").value;

  if (password !== confirmPassword) {
    alert("Passwords do not match.");
    return;
  }

  const payload = { name, email, password, role: "admin" };
  const token = localStorage.getItem("token");

  try {
    const response = await fetch("/api/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to create admin user");
    }

    alert("Admin user created successfully!");
    event.target.reset();
    document.getElementById("admin-form").style.display = "none";
    loadAdmins();
  } catch (error) {
    console.error("Error creating admin:", error);
    alert(`Error: ${error.message}`);
  }
}

// Handle admin deletion
async function deleteAdmin(id) {
  if (!confirm("Are you sure you want to delete this admin?")) return;

  const token = localStorage.getItem("token");

  try {
    const res = await fetch(`/api/users/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error("Failed to delete admin");
    alert("Admin deleted successfully");
    loadAdmins();
  } catch (err) {
    console.error("Error deleting admin:", err);
    alert("Failed to delete admin");
  }
}

// Pre-fill admin form for editing
function editAdmin(id, name, email) {
  document.getElementById("adminName").value = name;
  document.getElementById("adminEmail").value = email;
  document.getElementById("adminPassword").value = "";
  document.getElementById("adminConfirmPassword").value = "";

  document.getElementById("admin-form").style.display = "block";
  document.getElementById("admin-form").setAttribute("data-id", id);
}
*/