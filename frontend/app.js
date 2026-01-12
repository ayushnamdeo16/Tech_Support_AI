/* ==================== COMMON UTILITIES ==================== */

function getUser() {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
}

function showAlert(message, type = 'info') {
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type}`;
  alertDiv.textContent = message;
  
  const container = document.querySelector('.dashboard') || document.querySelector('.container') || document.body;
  container.insertBefore(alertDiv, container.firstChild);
  
  setTimeout(() => {
    alertDiv.remove();
  }, 5000);
}

/* ==================== ROUTE PROTECTION ==================== */

const protectedRoutes = [
  'support-hub.html',
  'troubleshooting.html',
  'dashboard.html',
  'aboutus.html'
];

if (protectedRoutes.some(route => window.location.pathname.includes(route))) {
  if (!localStorage.getItem("isLoggedIn")) {
    window.location.href = "index.html";
  }
}

/* ==================== AI SUPPORT SUBMIT ==================== */

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("run-agent");
  const output = document.getElementById("output");
 
  if (btn && output) {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
 
      const issue = document.getElementById("issue")?.value || "";
      const logs = document.getElementById("logs")?.value || "";
      const user = getUser();
 
      if (!user || !user.id) {
        alert("Please login to continue");
        window.location.href = "index.html";
        return;
      }
 
      if (!issue.trim()) {
        showAlert("Please describe your issue", 'error');
        document.getElementById("issue")?.focus();
        return;
      }
 
      btn.disabled = true;
      btn.classList.add("loading");
      btn.textContent = "Analyzing...";
      output.textContent = "🤖 Analyzing issue, please wait...\n\nThis may take a few moments...";
 
      try {
        // Get uploaded image IDs if available
        const imageIds = window.getUploadedImageIds ? window.getUploadedImageIds() : [];
        
        const res = await fetch("http://localhost:3000/support", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            issue,
            logs,
            imageIds: imageIds
          })
        });
 
        const data = await res.json();
        
        if (res.ok) {
          output.textContent = data.solution || "No response received.";
          localStorage.setItem("lastAIResponse", output.textContent);
          showAlert("Issue analyzed successfully!", 'success');
          
          // Refresh the dropdown if we're on support-hub page
          if (window.location.pathname.includes("support-hub.html") || 
              window.location.href.includes("support-hub.html")) {
            loadIssuesDropdown();
          }
        } else {
          output.textContent = `❌ Error: ${data.solution || data.message || "Unknown error occurred."}`;
          showAlert(data.solution || data.message || "An error occurred", 'error');
        }
 
      } catch (err) {
        console.error(err);
        output.textContent = "❌ Error communicating with server. Please ensure the backend is running on http://localhost:3000";
        showAlert("Connection error. Please check if the server is running.", 'error');
      } finally {
        btn.disabled = false;
        btn.classList.remove("loading");
        btn.textContent = "Run Support Agent";
      }
    });
  }
 
  // Restore last response (if page reload happens)
  const saved = localStorage.getItem("lastAIResponse");
  if (output && saved) {
    output.textContent = saved;
  }
});

/* ==================== LOGIN ==================== */

async function login() {
  const email = document.getElementById("loginEmail")?.value;
  const password = document.getElementById("loginPassword")?.value;
 
  if (!email || !password) {
    alert("Please enter email and password");
    return;
  }
 
  const loginBtn = document.querySelector('.login-btn');
  if (loginBtn) {
    loginBtn.disabled = true;
    loginBtn.textContent = "Logging in...";
  }
 
  try {
    const res = await fetch("http://localhost:3000/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
 
    const data = await res.json();
 
    if (res.ok) {
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("user", JSON.stringify(data.user));
      window.location.href = "dashboard.html";
    } else {
      alert(data.message || "Login failed. Please check your credentials.");
    }
  } catch (err) {
    console.error(err);
    alert("Connection error. Please ensure the backend server is running.");
  } finally {
    if (loginBtn) {
      loginBtn.disabled = false;
      loginBtn.textContent = "Login";
    }
  }
}

/* ==================== SIGNUP ==================== */

async function signup() {
  const name = document.getElementById("signupName")?.value;
  const email = document.getElementById("signupEmail")?.value;
  const password = document.getElementById("signupPassword")?.value;
  const confirmPassword = document.getElementById("confirm-password")?.value;
 
  if (password !== confirmPassword) {
    alert("Passwords do not match");
    return;
  }
 
  if (!name || !email || !password) {
    alert("All fields are required");
    return;
  }

  if (password.length < 6) {
    alert("Password must be at least 6 characters long");
    return;
  }
 
  const signupBtn = document.querySelector('.login-btn');
  if (signupBtn) {
    signupBtn.disabled = true;
    signupBtn.textContent = "Registering...";
  }
 
  try {
    const res = await fetch("http://localhost:3000/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });

    const data = await res.json();

    if (res.ok) {
      alert("Signup successful! Please login.");
      window.location.href = "index.html";
    } else {
      alert(data.message || "Signup failed. Please try again.");
    }
  } catch (err) {
    console.error("Signup error:", err);
    alert("Connection error. Please ensure the backend server is running on http://localhost:3000");
  } finally {
    if (signupBtn) {
      signupBtn.disabled = false;
      signupBtn.textContent = "Register";
    }
  }
}

/* ==================== LOGOUT ==================== */

function logout() {
  if (confirm("Are you sure you want to logout?")) {
    localStorage.clear();
    window.location.href = "index.html";
  }
}

/* ==================== SUPPORT HUB ==================== */

async function loadIssuesDropdown() {
  const user = getUser();
  const dropdown = document.getElementById("issueDropdown");
 
  if (!user || !user.id) {
    console.error('User not found or user ID missing');
    return;
  }

  if (!dropdown) {
    console.error('Dropdown element not found');
    return;
  }
 
  // Show loading state
  dropdown.disabled = true;
  dropdown.innerHTML = `<option value="">Loading issues...</option>`;
 
  try {
    console.log(`Fetching issues for user ID: ${user.id}`);
    const res = await fetch(`http://localhost:3000/support-issues/${user.id}`);
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();
    console.log('Issues data received:', data);
    
    dropdown.innerHTML = `<option value="">-- Select an issue --</option>`;
 
    if (data.issues && data.issues.length > 0) {
      data.issues.forEach((item, index) => {
        const option = document.createElement("option");
        // Truncate long issue descriptions for dropdown display
        const displayText = item.issue.length > 60 
          ? item.issue.substring(0, 60) + '...' 
          : item.issue;
        option.textContent = displayText;
        option.value = item.id || index;
        option.dataset.response = item.ai_response || '';
        dropdown.appendChild(option);
      });
      console.log(`Loaded ${data.issues.length} issues into dropdown`);
    } else {
      const option = document.createElement("option");
      option.textContent = "No previous issues found";
      option.disabled = true;
      dropdown.appendChild(option);
      console.log('No issues found for user');
    }
  } catch (err) {
    console.error('Error loading issues:', err);
    dropdown.innerHTML = `<option value="">Error loading issues. Check console for details.</option>`;
    showAlert('Failed to load issues. Please try refreshing the page.', 'error');
  } finally {
    dropdown.disabled = false;
  }
}

// Setup dropdown change event listener and load issues when page loads
document.addEventListener("DOMContentLoaded", () => {
  // Check if we're on the support-hub page
  const isSupportHubPage = window.location.pathname.includes("support-hub.html") || 
                          window.location.href.includes("support-hub.html") ||
                          document.querySelector('#issueDropdown') !== null;

  if (isSupportHubPage) {
    console.log('Support Hub page detected, loading issues...');
    
    // Load issues dropdown after a small delay to ensure DOM is fully ready
    setTimeout(() => {
      loadIssuesDropdown();
    }, 100);
    
    // Setup dropdown change event listener
    const issueDropdown = document.getElementById("issueDropdown");
    if (issueDropdown) {
      issueDropdown.addEventListener("change", (e) => {
        const selected = e.target.selectedOptions[0];
        const responseBox = document.getElementById("savedResponse");
     
        if (!responseBox) return;
     
        if (selected && selected.dataset.response) {
          responseBox.textContent = selected.dataset.response;
        } else {
          responseBox.textContent = "Select an issue to view the AI solution.";
        }
      });
    }
  }
});

/* ==================== IMAGE UPLOAD AND COMPRESSION ==================== */

async function compressImage(file, maxWidth = 1920, maxHeight = 1080, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Calculate new dimensions
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = width * ratio;
          height = height * ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to blob with compression
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Image compression failed'));
            }
          },
          file.type || 'image/jpeg',
          quality
        );
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target.result;
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

async function uploadAndCompressImage(file) {
  try {
    // Compress image
    const compressedBlob = await compressImage(file, 1920, 1080, 0.85);
    
    // Get user for user ID header
    const user = getUser();
    
    // Create FormData for upload
    const formData = new FormData();
    formData.append('image', compressedBlob, file.name);
    formData.append('originalSize', file.size);
    formData.append('compressedSize', compressedBlob.size);
    formData.append('mimeType', file.type);
    
    // Upload to backend
    const headers = {};
    if (user && user.id) {
      headers['X-User-ID'] = user.id;
    }
    
    const response = await fetch('http://localhost:3000/upload-image', {
      method: 'POST',
      headers: headers,
      body: formData
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Upload failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return {
      imageId: data.imageId,
      previewUrl: data.previewUrl || `http://localhost:3000/image/${data.imageId}`,
      compressedSize: compressedBlob.size,
      originalSize: file.size
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}

// Make functions globally accessible
window.uploadAndCompressImage = uploadAndCompressImage;
window.compressImage = compressImage;

/* ==================== NAVIGATION ==================== */

function goToNewIssue() {
  window.location.href = "troubleshooting.html";
}
 
/* ==================== PASSWORD RESET ==================== */

const passwordInput = document.getElementById("reset_password");

if (passwordInput) {
  const bars = document.querySelectorAll(".bar");
  const strengthText = document.getElementById("reset_strengthText");
  const confirmPasswordInput = document.getElementById("confirmPassword");
  const errorMsg = document.getElementById("errorMsg");
 
  passwordInput.addEventListener("input", () => {
    const val = passwordInput.value;
    let strength = 0;
 
    if (val.length >= 6) strength++;
    if (/[A-Z]/.test(val)) strength++;
    if (/[0-9]/.test(val)) strength++;
    if (/[^A-Za-z0-9]/.test(val)) strength++;
 
    bars.forEach((bar, index) =>
      bar.classList.toggle("active", index < strength)
    );
 
    const labels = ["Weak", "Fair", "Good", "Excellent"];
    strengthText.textContent =
      strength ? `Password strength: ${labels[strength - 1]}` : "";

    // Check password match if confirm password is filled
    if (confirmPasswordInput && confirmPasswordInput.value) {
      if (val !== confirmPasswordInput.value) {
        if (errorMsg) errorMsg.style.display = 'block';
      } else {
        if (errorMsg) errorMsg.style.display = 'none';
      }
    }
  });

  if (confirmPasswordInput) {
    confirmPasswordInput.addEventListener("input", () => {
      if (passwordInput.value !== confirmPasswordInput.value) {
        if (errorMsg) errorMsg.style.display = 'block';
      } else {
        if (errorMsg) errorMsg.style.display = 'none';
      }
    });
  }
}
