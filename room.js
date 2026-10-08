// * გვერდი მთლიანად JS-ით შენდება (#roomMainContent-ში)

// ოთახის ნომრით ლამაზი დასახელება
const customRoomNames = {
  "VIP01": "Presidential Royal Villa",
  "V20": "Panoramic Lake Penthouse",
  "V11": "Family Lake Suite",
  "V10": "Family Garden Suite",
  "V02": "Deluxe King Terrace Room",
  "V01": "Deluxe Twin Resort Room",

  "207": "Kabadoni Family Superior Suite",
  "206": "Alazani Valley Family Suite",
  "205": "Comfort Family Suite",
  "104": "Deluxe King Wine-View Room",
  "103": "Deluxe City View Room",
  "102": "Panoramic Corner Deluxe Room",

  "302": "Presidential Forest Suite",
  "301": "Royal Borjomi Panorama Suite",
  "202": "Borjomi Park Family Suite",
  "201": "Executive Family Studio",
  "102": "Deluxe King Park View",
  "101": "Deluxe Spa & Bath Room",

  "1003": "Presidential Seafront Suite",
  "901": "Panoramic Black Sea Penthouse",
  "703": "Executive Family Studio",
  "702": "Family Suite with Sea Terrace",
  "502": "Deluxe King Sea Breeze",
  "501": "Business Deluxe Room",

  "1501": "Royal Presidential Suite",
  "1401": "Skyline Panorama Penthouse",
  "1202": "Seaside Family Suite with Balcony",
  "1201": "Modern Minimalist Family Suite",
  "302": "Deluxe Room with Lounge Nook",
  "301": "Deluxe Studio & Living Area",

  "SC7": "Fabrika Urban Family Suite",
  "SC6": "Artistic Loft Family Suite",
  "SD5": "Cozy Timber Family Room",
  "DD3": "Industrial Loft Deluxe Room",
  "DD2": "Vintage Studio Deluxe Room",
  "DD1": "Deluxe Apartment with Kitchenette",

  "601": "Grand Presidential Suite",
  "501": "Skyline View Penthouse",
  "307": "Metechi Royal Family Suite",
  "306": "Contemporary Family Suite",
  "106": "Executive Deluxe Living Room",
  "105": "Deluxe Suite with Dining Space",

  "901": "Biltmore Royal Presidential Suite",
  "801": "Grand Tower Panorama Penthouse",
  "206": "Executive High-Floor Family Suite",
  "205": "Family Suite with Private Dining",
  "102": "Deluxe Modern King Room",
  "101": "Deluxe City View Living Suite",

  "302": "Rooms Skyline Signature Penthouse",
  "301": "Urban Terrace Loft Penthouse",
  "202": "Bohemian Family Suite",
  "201": "Industrial Chic Family Suite",
  "102": "Signature King Deluxe",
  "101": "Urban Twin Deluxe Room"
};

function formatRoomName(room) {
  if (!room) return "Standard Room";

  const num = (room.roomNumber || "").replace("#", "").trim();
  if (customRoomNames[num]) return customRoomNames[num];
  if (customRoomNames[room.id]) return customRoomNames[room.id];

  const rawType = (room.roomType || room.name || "").trim();
  const nameMap = {
    "Deluxe": "Deluxe Room",
    "FamilySuite": "Family Suite",
    "Penthouse": "Luxury Penthouse",
    "Accessible": "Accessible Room",
    "Standard": "Standard Room",
    "Suite": "Executive Suite",
    "Single": "Single Room",
    "Double": "Double Room"
  };

  return nameMap[rawType] || rawType.replace(/([a-z])([A-Z])/g, '$1 $2').trim() || "Standard Room";
}

let currentActiveRoomId = null;
let editingReviewId = null;
let selectedRating = 0;

function getCurrentUserIdentifier() {
  const fName = localStorage.getItem("user_first_name") || "";
  const lName = localStorage.getItem("user_last_name") || "";
  const full = (fName + " " + lName).trim();
  return full || localStorage.getItem("user_email") || "Guest User";
}

document.addEventListener("DOMContentLoaded", async () => {
  renderNavbarAuth();

  const content = document.getElementById("roomMainContent");
  const params = new URLSearchParams(window.location.search);
  const roomId = params.get("id");
  currentActiveRoomId = roomId;

  if (!roomId) {
    content.innerHTML = "<p style='text-align: center; color: red;'>ოთახის ID ვერ მოიძებნა!</p>";
    return;
  }

  const token = localStorage.getItem("token");

  try {
    const roomRes = await fetch(`https://bookingapi.stepacademy.ge/api/rooms/details/${roomId}`, {
      headers: { "accept": "application/json" }
    });

    if (!roomRes.ok) throw new Error("Room not found");

    const result = await roomRes.json();
    const room = result.data;
    const hotel = room.hotel;
    const cleanRoomName = formatRoomName(room);

    const galleryHtml = (room.gallery || [])
      .map(img => `<img src="${img}" alt="${cleanRoomName}" class="gallery-side-img">`)
      .join("");

    let starsHtml = "";
    for (let i = 0; i < 5; i++) {
      starsHtml += i < Math.floor(room.averageRating || 0)
        ? '<i class="fa-solid fa-star"></i>'
        : '<i class="fa-regular fa-star"></i>';
    }

    const specs = room.specifications || {};
    let specsHtml = "";
    for (const [key, value] of Object.entries(specs)) {
      specsHtml += `
        <div class="spec-row">
          <span class="spec-key">${key}:</span>
          <span class="spec-val">${value}</span>
        </div>
      `;
    }

    const bookingActionHtml = token
      ? `<button class="btn btn-primary btn-book-action" style="width: 100%; padding: 14px; font-size: 1rem; font-weight: 600; border-radius: 8px;" onclick="handleBookAction(${room.id})">Book this room</button>`
      : `<a href="login.html" class="btn btn-primary btn-book-action" style="display: block; text-align: center; width: 100%; padding: 14px; font-size: 1rem; font-weight: 600; border-radius: 8px; text-decoration: none;">Login to book</a>`;

    const reviewActionHtml = token
      ? `<button class="btn btn-primary btn-sm" id="writeReviewBtn" onclick="openReviewModal()">Write a Review</button>`
      : `<button class="btn btn-primary btn-sm" onclick="handleReviewLoginRedirect()">Login to Write a Review</button>`;

    content.innerHTML = `
      <section class="hotel-gallery-grid">
        <div class="main-image-wrapper">
          <img src="${room.thumbnail}" alt="${cleanRoomName}" class="main-hotel-img">
        </div>
        <div class="side-images-wrapper">
          ${galleryHtml}
        </div>
      </section>

      <div class="room-details-layout">
        <div class="room-main-info">
          <div class="room-back-link">
            <a href="hotel.html?id=${hotel.id}">← ${hotel.name}</a>
          </div>

          <div class="room-title-row">
            <h1 class="room-heading">${cleanRoomName}</h1>
            ${room.isAvailable ? '<span class="badge-available-pill">Available</span>' : ''}
          </div>

          <div class="room-sub-id">Room #${room.roomNumber}</div>

          <div class="room-metrics-bar">
            <div class="metric-item">
              <span class="metric-label">CAPACITY</span>
              <span class="metric-value">${room.capacity} guests</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">BEDS</span>
              <span class="metric-value">${room.bedCount}</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">RATING</span>
              <span class="metric-value">
                <span class="stars-gold">${starsHtml}</span>
                <span class="metric-num">${Number(room.averageRating).toFixed(1)}</span>
              </span>
            </div>
            <div class="metric-item">
              <span class="metric-label">REVIEWS</span>
              <span class="metric-value" id="roomReviewsCountDisplay">${room.reviewCount}</span>
            </div>
          </div>

          <div class="specs-section">
            <h2 class="specs-heading">Specifications</h2>
            <div class="specs-table">
              ${specsHtml}
            </div>
          </div>

          <div class="reviews-section">
            <div class="reviews-header" style="display: flex; justify-content: space-between; align-items: center;">
              <h2 class="specs-heading">Guest Reviews</h2>
              <div id="reviewActionContainer">${reviewActionHtml}</div>
            </div>
            <div id="roomReviewsList">
              <p class="no-reviews-text">Loading reviews...</p>
            </div>
          </div>
        </div>

        <div class="room-sidebar">
          <div class="booking-card" style="padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0; background: #ffffff;">
            <div class="price-header" style="margin-bottom: 20px;">
              <span class="price-amount" style="font-size: 1.8rem; font-weight: 800; color: #0f172a;">$${room.pricePerNight}</span>
              <span class="price-sub" style="color: #64748b; font-size: 0.95rem;"> / night</span>
            </div>

            ${bookingActionHtml}
          </div>
        </div>
      </div>
    `;

    await loadAndRenderServerReviews(roomId);
    initModalLogic(roomId);
  } catch (error) {
    console.error(error);
    content.innerHTML = "<p style='text-align: center; color: red;'>ოთახის მონაცემების წამოღება ვერ მოხერხდა.</p>";
  }
});

// შეფასებების ჩატვირთვა
async function loadAndRenderServerReviews(roomId) {
  const container = document.getElementById("roomReviewsList");
  const countDisplay = document.getElementById("roomReviewsCountDisplay");
  const actionContainer = document.getElementById("reviewActionContainer");
  if (!container) return;

  const currentUserName = getCurrentUserIdentifier();
  const token = localStorage.getItem("token");

  // 1. წამოვიღოთ ლოკალური შეფასებები
  const localKey = `room_reviews_${roomId}`;
  let localReviews = [];
  try {
    localReviews = JSON.parse(localStorage.getItem(localKey)) || [];
    // მხოლოდ 1 შეფასება ამ მომხმარებლისთვის
    const myReviews = localReviews.filter(r => r.userName === currentUserName);
    if (myReviews.length > 1) {
      const otherReviews = localReviews.filter(r => r.userName !== currentUserName);
      localReviews = [myReviews[0], ...otherReviews];
      localStorage.setItem(localKey, JSON.stringify(localReviews));
    }
  } catch (e) {
    localReviews = [];
  }

  // 2. წამოვიღოთ სერვერიდან
  let serverReviews = [];
  try {
    const headers = { "accept": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`https://bookingapi.stepacademy.ge/api/reviews/room/${roomId}`, { headers });
    if (res.ok) {
      const resData = await res.json();
      if (Array.isArray(resData)) serverReviews = resData;
      else if (resData?.data && Array.isArray(resData.data)) serverReviews = resData.data;
      else if (resData?.reviews && Array.isArray(resData.reviews)) serverReviews = resData.reviews;
      else if (resData?.items && Array.isArray(resData.items)) serverReviews = resData.items;
    }
  } catch (error) {
    console.warn("API reviews fetch warning:", error);
  }

  const allReviews = [...localReviews, ...serverReviews];

  if (countDisplay) {
    countDisplay.textContent = allReviews.length;
  }

  // შევამოწმოთ უკვე დაწერილი აქვს თუ არა შეფასება ამ მომხმარებელს
  const userHasReview = token && allReviews.some(r => {
    const rName = r.userName || r.author || (r.user ? `${r.user.firstName} ${r.user.lastName}`.trim() : "");
    return rName === currentUserName;
  });

  if (actionContainer && token) {
    if (userHasReview) {
      actionContainer.innerHTML = `<span style="font-size: 0.85rem; color: #16a34a; font-weight: 600;"><i class="fa-solid fa-check"></i> Review Submitted</span>`;
    } else {
      actionContainer.innerHTML = `<button class="btn btn-primary btn-sm" id="writeReviewBtn" onclick="openReviewModal()">Write a Review</button>`;
    }
  }

  if (allReviews.length === 0) {
    container.innerHTML = '<p class="no-reviews-text">No reviews yet — be the first to share your experience!</p>';
    return;
  }

  container.innerHTML = allReviews.map((rev) => {
    const rateVal = Number(rev.rate || rev.rating || rev.score || 5);

    let stars = "";
    for (let i = 1; i <= 5; i++) {
      stars += i <= rateVal
        ? '<i class="fa-solid fa-star" style="color: #f59e0b; margin-right: 2px;"></i>'
        : '<i class="fa-regular fa-star" style="color: #cbd5e1; margin-right: 2px;"></i>';
    }

    let userName = "Guest";
    if (rev.userName) userName = rev.userName;
    else if (rev.author) userName = rev.author;
    else if (rev.user) {
      userName = `${rev.user.firstName || ''} ${rev.user.lastName || ''}`.trim() || rev.user.userName || "Guest";
    } else if (rev.customer) {
      userName = `${rev.customer.firstName || ''} ${rev.customer.lastName || ''}`.trim() || "Guest";
    }

    const isMyReview = token && (userName === currentUserName);

    const initials = userName
      .split(" ")
      .filter(Boolean)
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2) || "GG";

    const dateText = (rev.createdAt || rev.date || rev.createdDate || new Date().toISOString()).split("T")[0] || "";
    const reviewText = rev.text || rev.comment || rev.content || rev.review || `Rated ${rateVal} out of 5 stars.`;

    const actionsHtml = isMyReview ? `
      <div style="display: flex; gap: 8px; margin-left: 10px;">
        <button onclick="editMyReview('${rev.id || 'my_rev'}', ${rateVal})" title="Edit" style="background: none; border: none; cursor: pointer; color: #0284c7; font-size: 14px; padding: 2px 6px;">
          <i class="fa-solid fa-pen-to-square"></i>
        </button>
        <button onclick="deleteMyReview('${rev.id || 'my_rev'}')" title="Delete" style="background: none; border: none; cursor: pointer; color: #ef4444; font-size: 14px; padding: 2px 6px;">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
    ` : '';

    return `
      <div class="review-item-card" style="display: flex; gap: 14px; background: #ffffff; border: 1px solid #e2e8f0; padding: 16px; border-radius: 12px; margin-bottom: 12px; box-shadow: 0 2px 6px rgba(0,0,0,0.02);">
        <div style="width: 44px; height: 44px; border-radius: 50%; background: #0066ff; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 15px;">${initials}</div>
        <div style="flex: 1;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <h4 style="margin: 0; font-size: 0.95rem; font-weight: 700; color: #0f172a;">${userName}</h4>
            <div style="display: flex; align-items: center;">
              <span style="font-size: 0.78rem; color: #64748b;">${dateText}</span>
              ${actionsHtml}
            </div>
          </div>
          <div style="margin-bottom: 6px;">${stars}</div>
          <p style="margin: 0; font-size: 0.88rem; color: #334155; line-height: 1.4;">${reviewText}</p>
        </div>
      </div>
    `;
  }).join("");
}

// შეფასების წაშლა
window.deleteMyReview = async function(reviewId) {
  if (!confirm("დარწმუნებული ხართ, რომ გსურთ შეფასების წაშლა?")) return;

  const currentUserName = getCurrentUserIdentifier();
  const localKey = `room_reviews_${currentActiveRoomId}`;
  let localReviews = JSON.parse(localStorage.getItem(localKey) || "[]");

  localReviews = localReviews.filter(r => {
    if (reviewId && String(r.id) === String(reviewId)) return false;
    return r.userName !== currentUserName;
  });
  localStorage.setItem(localKey, JSON.stringify(localReviews));

  const numId = Number(reviewId);
  if (numId && numId < 2147483647) {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        await fetch(`https://bookingapi.stepacademy.ge/api/reviews/room/${numId}`, {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${token}` }
        });
      }
    } catch (e) {
      console.warn("Delete API warning:", e);
    }
  }

  showToast("Review deleted successfully.", "success");
  await loadAndRenderServerReviews(currentActiveRoomId);
};

// შეფასების რედაქტირება
window.editMyReview = function(reviewId, currentRate) {
  editingReviewId = reviewId || "edit_mode";
  openReviewModal(currentRate);
};

function handleBookAction(roomId) {
  window.location.href = `booking.html?id=${roomId}`;
}

function handleReviewLoginRedirect() {
  localStorage.setItem("redirectAfterLogin", window.location.href);
  window.location.href = "login.html";
}

function openReviewModal(initialRate = 0) {
  const token = localStorage.getItem("token");
  if (!token) {
    handleReviewLoginRedirect();
    return;
  }

  const reviewModal = document.getElementById("reviewModal");
  const submitModalReviewBtn = document.getElementById("submitModalReviewBtn");
  const modalTitle = reviewModal ? reviewModal.querySelector(".modal-header h3") : null;
  const stars = document.querySelectorAll(".star-btn");

  if (initialRate > 0) {
    selectedRating = initialRate;
    stars.forEach(s => s.classList.toggle("active", Number(s.dataset.rate) <= initialRate));
    if (submitModalReviewBtn) {
      submitModalReviewBtn.disabled = false;
      submitModalReviewBtn.textContent = "Update Review";
    }
    if (modalTitle) modalTitle.textContent = "Edit Your Review";
  } else {
    editingReviewId = null;
    selectedRating = 0;
    stars.forEach(s => s.classList.remove("active", "hovered"));
    if (submitModalReviewBtn) {
      submitModalReviewBtn.disabled = true;
      submitModalReviewBtn.textContent = "Submit Review";
    }
    if (modalTitle) modalTitle.textContent = "Write a Review";
  }

  if (reviewModal) reviewModal.classList.remove("hidden");
}

function closeReviewModalWindow() {
  const reviewModal = document.getElementById("reviewModal");
  if (reviewModal) reviewModal.classList.add("hidden");
  editingReviewId = null;
}

function initModalLogic(roomId) {
  const closeBtn = document.getElementById("closeReviewModal");
  const cancelBtn = document.getElementById("cancelReviewBtn");
  const submitBtn = document.getElementById("submitModalReviewBtn");
  const stars = document.querySelectorAll(".star-btn");

  if (closeBtn) closeBtn.onclick = closeReviewModalWindow;
  if (cancelBtn) cancelBtn.onclick = closeReviewModalWindow;

  stars.forEach(star => {
    star.onmouseenter = () => {
      const rate = Number(star.dataset.rate);
      stars.forEach(s => s.classList.toggle("hovered", Number(s.dataset.rate) <= rate));
    };

    star.onmouseleave = () => {
      stars.forEach(s => s.classList.remove("hovered"));
    };

    star.onclick = () => {
      selectedRating = Number(star.dataset.rate);
      stars.forEach(s => s.classList.toggle("active", Number(s.dataset.rate) <= selectedRating));
      if (submitBtn) submitBtn.disabled = false;
    };
  });

  if (submitBtn) {
    submitBtn.onclick = async () => {
      if (!selectedRating) return;

      const isEditing = Boolean(editingReviewId);
      submitBtn.disabled = true;
      submitBtn.textContent = isEditing ? "Updating..." : "Submitting...";

      const currentUserName = getCurrentUserIdentifier();
      const localKey = `room_reviews_${roomId}`;
      let localReviews = JSON.parse(localStorage.getItem(localKey) || "[]");

      // მხოლოდ ახალი შეფასებისას იგზავნება POST სერვერზე. 
      // Edit-ის დროს POST-ს არ ვუშვებთ, რათა 400 Bad Request (Already Reviewed) არ ამოვარდეს!
      if (!isEditing) {
        try {
          await fetch("https://bookingapi.stepacademy.ge/api/reviews/room", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${localStorage.getItem("token")}`
            },
            body: JSON.stringify({ roomId: Number(roomId), rate: selectedRating })
          });
        } catch (err) {
          console.warn("API submit warning:", err);
        }
      } else {
        // თუ ბექენდს აქვს PUT მეთოდი შეფასების განახლებისთვის
        const numId = Number(editingReviewId);
        if (numId && numId < 2147483647) {
          try {
            await fetch(`https://bookingapi.stepacademy.ge/api/reviews/room`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`
              },
              body: JSON.stringify({ reviewId: numId, rate: selectedRating })
            });
          } catch (e) {}
        }
      }

      // წავშალოთ ძველი ჩანაწერი და ჩავწეროთ განახლებული
      localReviews = localReviews.filter(r => r.userName !== currentUserName);

      const newReviewObj = {
        id: (isEditing && Number(editingReviewId) < 2147483647) ? Number(editingReviewId) : Date.now(),
        roomId: Number(roomId),
        rate: selectedRating,
        userName: currentUserName,
        createdAt: new Date().toISOString(),
        text: `Rated ${selectedRating} out of 5 stars.`
      };

      localReviews.unshift(newReviewObj);
      localStorage.setItem(localKey, JSON.stringify(localReviews));

      await loadAndRenderServerReviews(roomId);

      submitBtn.disabled = false;
      submitBtn.textContent = "Submit Review";
      closeReviewModalWindow();
      showToast(isEditing ? "Review updated successfully." : "Review added successfully.", "success");
      editingReviewId = null;
    };
  }
}

function renderNavbarAuth() {
  const navAuth = document.getElementById("navAuth");
  if (!navAuth) return;

  const token = localStorage.getItem("token");

  if (!token) {
    navAuth.innerHTML = '<a href="login.html" class="btn btn-primary btn-sm">Sign In</a>';
    return;
  }

  const savedAvatar = localStorage.getItem("user_profile_avatar");
  const savedInitials = localStorage.getItem("user_initials");
  const savedFirstName = localStorage.getItem("user_first_name");
  const savedLastName = localStorage.getItem("user_last_name");

  let initials = savedInitials;

  if (!initials && (savedFirstName || savedLastName)) {
    const f = (savedFirstName || "").trim();
    const l = (savedLastName || "").trim();
    if (f && l) initials = (f[0] + l[0]).toUpperCase();
    else if (f) initials = f.substring(0, 2).toUpperCase();
  }

  if (!initials) initials = "GG";

  let innerContent = initials;
  if (savedAvatar && savedAvatar.trim().length > 5) {
    innerContent = `<img src="${savedAvatar.trim()}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;">`;
  }

  navAuth.innerHTML = `
    <a href="profile.html" class="user-avatar-btn" style="overflow:hidden; display:flex; align-items:center; justify-content:center; padding:0;">${innerContent}</a>
  `;
}

function showToast(message, type = "success") {
  let toast = document.getElementById("toastSuccessBox");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toastSuccessBox";
    toast.className = "toast-success-box";
    document.body.appendChild(toast);
  }

  const isError = type === "error";
  const icon = isError ? "fa-circle-xmark" : "fa-circle-check";
  const borderColor = isError ? "#ef4444" : "#10b981";
  const iconColor = isError ? "#ef4444" : "#10b981";

  toast.style.borderColor = borderColor;

  toast.innerHTML = `
    <i class="fa-regular ${icon} toast-icon" style="color: ${iconColor};"></i>
    <span class="toast-text">${message}</span>
    <button type="button" class="toast-close" onclick="this.parentElement.classList.remove('show')">&times;</button>
  `;

  setTimeout(() => toast.classList.add("show"), 10);

  clearTimeout(toast.hideTimeout);
  toast.hideTimeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 4000);
}