const button = document.getElementById("ping-btn");
const status = document.getElementById("status");

button?.addEventListener("click", () => {
  const now = new Date().toLocaleString();
  status.textContent = `Passed at ${now}`;
  status.classList.add("is-success");
});
