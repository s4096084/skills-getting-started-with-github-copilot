document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  function showMessage(message, type) {
    messageDiv.textContent = message;
    messageDiv.className = type;
    messageDiv.classList.remove("hidden");

    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  function addParticipantItem(listElement, participant, activityName) {
    const item = document.createElement("li");
    item.className = "participant-item";

    const participantText = document.createElement("span");
    participantText.className = "participant";
    participantText.textContent = participant;

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "participant-delete";
    deleteButton.setAttribute("aria-label", `Remove ${participant} from ${activityName}`);
    deleteButton.title = `Remove ${participant}`;
    deleteButton.innerHTML = "🗑️";

    deleteButton.addEventListener("click", async () => {
      try {
        const response = await fetch(
          `/activities/${encodeURIComponent(activityName)}/participants/${encodeURIComponent(participant)}`,
          { method: "DELETE" }
        );
        const result = await response.json();

        if (response.ok) {
          showMessage(result.message, "success");
          await fetchActivities();
        } else {
          showMessage(result.detail || "Unable to remove participant.", "error");
        }
      } catch (error) {
        showMessage("Failed to remove participant. Please try again.", "error");
        console.error("Error removing participant:", error);
      }
    });

    item.appendChild(participantText);
    item.appendChild(deleteButton);
    listElement.appendChild(item);
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;
        const participantsList = document.createElement("ul");
        participantsList.className = "participants-list";

        if (details.participants.length === 0) {
          const emptyItem = document.createElement("li");
          emptyItem.className = "participant participant-empty";
          emptyItem.textContent = "No participants yet";
          participantsList.appendChild(emptyItem);
        } else {
          details.participants.forEach((participant) => {
            addParticipantItem(participantsList, participant, name);
          });
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        const participantsSection = document.createElement("div");
        participantsSection.className = "participants-section";

        const title = document.createElement("p");
        title.className = "participants-title";
        title.innerHTML = `<strong>Participants (${details.participants.length}):</strong>`;

        participantsSection.appendChild(title);
        participantsSection.appendChild(participantsList);
        activityCard.appendChild(participantsSection);
        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        signupForm.reset();
        await fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
