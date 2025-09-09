const passwordInput = document.getElementById("password");
const strengthBar = document.getElementById("strength-bar");
const feedbackText = document.getElementById("feedback");
const availabilityText = document.getElementById("availability");
const suggestionsBox = document.getElementById("suggestions");
const suggestionsWrapper = document.getElementById("suggestions-box");

passwordInput.addEventListener("input", async () => {
  const password = passwordInput.value;
  const result = zxcvbn(password);
  const strength = result.score;

  const colors = ["#e74c3c", "#e67e22", "#f1c40f", "#2ecc71", "#00ffcc"];
  const messages = ["Very Weak", "Weak", "Fair", "Strong", "Very Strong"];

  // Update strength bar & feedback
  strengthBar.style.width = `${(strength + 1) * 20}%`;
  strengthBar.style.background = colors[strength];
  feedbackText.style.color = colors[strength];
  feedbackText.textContent = password
    ? `${messages[strength]}${
        result.feedback.suggestions.length
          ? " – " + result.feedback.suggestions.join(" ")
          : ""
      }`
    : "";

  availabilityText.textContent = "";
  suggestionsBox.innerHTML = "";
  suggestionsWrapper.classList.remove("visible");

  if (password) {
    const taken = await isPasswordPwned(password);

    if (taken) {
      availabilityText.textContent = "❌ This password has been used before!";
      availabilityText.className = "taken";

      const generated = generateSuggestions(password);
      if (generated.length > 0) {
        suggestionsWrapper.classList.add("visible"); // fade in
        generated.forEach(s => {
          const item = document.createElement("span");
          item.textContent = s;
          item.classList.add("suggestion-item");
          item.addEventListener("click", () => {
            passwordInput.value = s;
            passwordInput.dispatchEvent(new Event("input"));
          });
          suggestionsBox.appendChild(item);
        });
      }
    } else {
      availabilityText.textContent = "✅ This password is available. You can continue.";
      availabilityText.className = "available";
    }
  }
});

// Suggestions generator
function generateSuggestions(base) {
  const variations = [];
  if (!base) return variations;
  variations.push(base.charAt(0).toUpperCase() + base.slice(1));
  variations.push(base + Math.floor(100 + Math.random() * 900));
  variations.push(base + "!" + Math.floor(Math.random() * 99));
  let mixed = "";
  for (let c of base) mixed += Math.random() > 0.5 ? c.toUpperCase() : c.toLowerCase();
  variations.push(mixed);
  return [...new Set(variations)].slice(0, 3);
}

// Password leak check
async function isPasswordPwned(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-1", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("").toUpperCase();
  const prefix = hashHex.slice(0, 5);
  const suffix = hashHex.slice(5);
  const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
  const text = await response.text();
  return text.includes(suffix);
}
