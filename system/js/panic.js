document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("nes-btn");
  if (!btn) return;

  const img = btn.querySelector("img");
  const DEFAULT_PANIC_URL = "https://google.com";

  if (!localStorage.getItem("panicUrl")) {
    localStorage.setItem("panicUrl", DEFAULT_PANIC_URL);
  }

  let nesState = localStorage.getItem("nesState") || "norm";

  function updateUI() {
    img.src = nesState === "cartage"
      ? "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAABGElEQVR42u2awQ7CMAxD26r//8vlAhKHTWyscb3lvSsI1U6aGFgpAAAAAACQkRr54WOMEXr4Wi+fv2XvgPQGdNldu9CukVepO1cneobYGqAQbjkDxpvIqW/ZAb8qHiH8FjMgUri1AQrhtjlAKZ4ghAEYgAEyA5TpzsKALcFHTFAbxRXIuPvpAIUBW1VdWenlHeAoPuzL0N4GqLXW79ccTGkK8c5ZoKnEP34InhXvMhNa1sovzQFOG6FnFE0SxAAMwICpBtQ3d1yVYUHI9e/wZWvwrDCVCSEzwHXnE4XVV+DTCUd/A9h735bBs7qsK9r/38PuddbMK2abAxTiSwl+UHL2LHnsIzIrt0rLLN7eAEWeaJnFAwBAdl4txnx7W3QlGgAAAABJRU5ErkJggg=="
      : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAABm0lEQVR42u1aSxLDIAiNjLdwnfsfqGvPka4643RiVAQEw1v2o/DgKaLH4XA4HA6H460IkpN9UrpavzlzDtsQ0OPwakKCpOM9zsz8dzkBd8bPGE49HisBpbEc0eIaP1BHnVOztbl+n2PmDpqjLrFOgDXna/NhbQBrzlMDqCOhpaBiI2BmweHYDf4XQlYCKJnnkB7GPrCS+k/Oz9gDFlK/Z9HFSgEO5eDecUCz9rHOj9gLWrWPcV60ErSc9iWi1IEF+z334gu9DkmkP2UHqXesyOVMLbKtiI/+f+lZYAeoIuApumXdb4KAT0pXS4cajtVROroSjU4VBHAWL9usAWfOoUcqvZJST4DGVloYMRxzs9MqTGpjYtvto/UCSEdeGyKHrinSXkoirD1Bac2z9QQxxmu7OBFdAyxdnMAoq1rLW+xpESi1pu2ylJyAJ6c0pL1IT/BOCiudn22URMrUW+W8+FmA8n5+9U5jsiVGKblAnXor3ggtI6A04LWvxFqZ8Zp3gj0S2f6lKMc2ZfKt8Awh1l+dORwOh8PhcJjBF7dOaCzJ+XiLAAAAAElFTkSuQmCC";
  }

  updateUI();

  btn.addEventListener("click", () => {
    nesState = nesState === "norm" ? "cartage" : "norm";
    localStorage.setItem("nesState", nesState);
    updateUI();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && nesState === "cartage") {
      const panicUrl = localStorage.getItem("panicUrl") || DEFAULT_PANIC_URL;
      window.location.href = panicUrl;
    }
  });
});
