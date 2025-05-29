window.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token || role !== "super-admin") {
    alert("You must be logged in as a super admin to access this page.");
    window.location.href = document.referrer || "/index.html";
    return;
  }

  loadUsers();
});

// Fetch and display all users with role: "user"
async function loadUsers() {
  const token = localStorage.getItem("token");

  try {
    const res = await fetch("/api/users?limit=100", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    const users = data.users.filter((user) => user.role === "user");

    const tbody = document.querySelector("table tbody");
    tbody.innerHTML = "";

    if (users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4">No users found.</td></tr>';
      return;
    }

    users.forEach((user, index) => {
      const row = document.createElement("tr");
      row.innerHTML = `
          <td>${index + 1}</td>
          <td>${user.name}</td>
          <td>${user.email}</td>
          <td>
            <button class="btn btn-danger btn-sm" onclick="deleteUser('${
              user._id
            }')">
              <i class="fas fa-trash"></i> Delete
            </button>
          </td>
        `;
      tbody.appendChild(row);
    });
  } catch (err) {
    console.error("Error loading users:", err);
    alert("Error loading users.");
  }
}

/* Delete user by ID
async function deleteUser(id) {
  const token = localStorage.getItem("token");

  if (!confirm("Are you sure you want to delete this user?")) return;

  try {
    const res = await fetch(`/api/users/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error("Failed to delete user");

    alert("User deleted successfully");
    loadUsers();
  } catch (err) {
    console.error("Error deleting user:", err);
    alert("Failed to delete user.");
  }
}
*/