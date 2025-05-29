// handelReport.js

document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  //const role = localStorage.getItem("role");

  try {
    const response = await fetch("/api/questions", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();
    const questions = result.data || [];

    const feedContainer = document.querySelector(".post-feed .row");
    feedContainer.innerHTML = "";

    const reportedQuestions = questions.filter(
      (q) => Array.isArray(q.reports) && q.reports.length > 0
    );

    if (reportedQuestions.length === 0) {
      feedContainer.innerHTML = "<p>No reported questions found.</p>";
      return;
    }

    for (const question of reportedQuestions) {
      const authorName = question.author?.name || "Unknown";
      const reportedReason =
        question.reports[0]?.reason || "This post is reported.";
      const createdDate = new Date(question.createdAt).toLocaleDateString();

      const col = document.createElement("div");
      col.className = "col-md-8";

      col.innerHTML = `
        <div class="feed-box">
          <div class="feed-top">
            <div><i class="fas fa-user-circle"></i> ${authorName}</div>
            <div class="post-date">${createdDate}</div>
          </div>
          <div class="feed-title">Title: ${question.title}</div>
          <div class="feed-mid">${question.body}</div>
          <div class="feed-report" style="color: red">${reportedReason}</div>
          <div class="feed-bottom">
            <button class="btn restore" data-id="${question._id}">Restore</button>
            <button class="btn delete" data-id="${question._id}">Delete</button>
          </div>
        </div>
      `;

      feedContainer.appendChild(col);
    }

    // Restore handler
    document.querySelectorAll(".btn.restore").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const id = e.target.dataset.id;

        try {
          const res = await fetch(`/api/questions/${id}`, {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ reports: [] }),
          });

          if (res.ok) {
            alert("Reports removed successfully.");
            location.reload();
          } else {
            alert("Failed to restore post.");
          }
        } catch (err) {
          console.error("Restore error:", err);
          alert("An error occurred while restoring the post.");
        }
      });
    });

    // Delete handler
    document.querySelectorAll(".btn.delete").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const id = e.target.dataset.id;
        if (!confirm("Are you sure you want to delete this post?")) return;

        try {
          const res = await fetch(`/api/questions/${id}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (res.ok) {
            alert("Post deleted successfully.");
            location.reload();
          } else {
            alert("Failed to delete post.");
          }
        } catch (err) {
          console.error("Delete error:", err);
          alert("An error occurred while deleting the post.");
        }
      });
    });
  } catch (error) {
    console.error("Failed to load reported posts:", error);
    alert("Error loading reported posts.");
  }
});
