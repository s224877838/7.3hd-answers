window.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token || (role !== "super-admin" && role !== "admin")) {
    alert("Page Restricted");
    window.location.href = document.referrer || "/";
    return;
  }
  function loadAdmins() {
    // Your logic to load admins
    console.log("Loading admins in unauthorized page...");
  }
  loadAdmins();
});
