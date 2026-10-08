(function () {
  if (window.__aiAssistantLoaded) return;
  window.__aiAssistantLoaded = true;

  // 1. Navbar ავატარის სინქრონიზაცია
  function syncGlobalNavAvatar() {
    const token = localStorage.getItem("token");
    if (!token) return;

    const navAvatar = document.querySelector(
      "#navAvatarTop, .user-avatar-btn, .nav-avatar, a[href*='profile']"
    );
    if (!navAvatar) return;

    const savedAvatar = localStorage.getItem("user_profile_avatar");
    const savedInitials = localStorage.getItem("user_initials") || "GG";

    if (savedAvatar && savedAvatar.trim().length > 5) {
      if (
        !navAvatar.querySelector("img") ||
        navAvatar.querySelector("img").src !== savedAvatar.trim()
      ) {
        navAvatar.innerHTML = `<img src="${savedAvatar.trim()}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;">`;
        navAvatar.style.padding = "0";
        navAvatar.style.overflow = "hidden";
      }
    } else {
      if (navAvatar.textContent.trim() !== savedInitials) {
        navAvatar.textContent = savedInitials;
      }
    }
  }

  function initNavAvatar() {
    syncGlobalNavAvatar();
    setTimeout(syncGlobalNavAvatar, 300);
    const observer = new MutationObserver(() => syncGlobalNavAvatar());
    const navContainer = document.querySelector(".navbar, header, #navAuth");
    if (navContainer) {
      observer.observe(navContainer, { childList: true, subtree: true });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initNavAvatar);
  } else {
    initNavAvatar();
  }

  // 2. სასტუმროების ლოკალური ქეში UI ქარდებისთვის
  let localHotelsMap = {};

  async function loadHotelsForCards() {
    try {
      const res = await fetch(
        "https://bookingapi.stepacademy.ge/api/hotels?Take=30&Page=1"
      );
      const json = await res.json();
      const items = json.items || json.data?.items || [];
      items.forEach((h) => {
        localHotelsMap[h.id] = h;
      });
    } catch (e) {
      console.warn("Hotels prefetch error", e);
    }
  }
  loadHotelsForCards();

  // 3. პრემიუმ ვიზუალის სასტუმროს ქარდი
  function buildCardHTML(id) {
    const hotel = localHotelsMap[id] || {};
    const name = hotel.name || `სასტუმრო #${id}`;
    const city = hotel.address?.city || hotel.city || "თბილისი, საქართველო";
    const stars = Math.min(5, Math.max(1, parseInt(hotel.starRating || 5, 10)));
    const price = hotel.pricePerNight || stars * 35;
    const img =
      hotel.featuredImage ||
      hotel.imageUrl ||
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600";

    const starsHtml = Array(stars)
      .fill('<i class="fa-solid fa-star" style="color:#fbbf24; font-size:0.7rem;"></i>')
      .join("");

    return `
      <div style="background:#ffffff; border-radius:16px; overflow:hidden; margin-top:10px; border:1px solid #e8eef5; box-shadow:0 8px 20px rgba(0, 102, 255, 0.08); text-align:left; font-family:inherit;">
        <div style="position:relative; width:100%; height:120px; overflow:hidden;">
          <img src="${img}" alt="${name}" style="width:100%; height:100%; object-fit:cover; display:block;" onerror="this.src='https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600'">
          <div style="position:absolute; inset:0; background:linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.55) 100%);"></div>
          
          <div style="position:absolute; top:8px; left:8px; background:rgba(255,255,255,0.92); backdrop-filter:blur(4px); padding:3px 8px; border-radius:20px; display:inline-flex; align-items:center; gap:3px; box-shadow:0 2px 6px rgba(0,0,0,0.15);">
            <i class="fa-solid fa-star" style="color:#f59e0b; font-size:0.75rem;"></i>
            <span style="font-size:0.75rem; font-weight:700; color:#0f172a;">${stars}.0</span>
          </div>

          <div style="position:absolute; bottom:8px; left:10px; color:#ffffff; font-size:0.75rem; font-weight:500; display:flex; align-items:center; gap:4px; text-shadow:0 1px 3px rgba(0,0,0,0.8);">
            <i class="fa-solid fa-location-dot" style="font-size:0.7rem; color:#60a5fa;"></i> ${city}
          </div>
        </div>

        <div style="padding:12px 14px;">
          <h4 style="margin:0 0 4px 0; font-size:0.95rem; font-weight:700; color:#0f172a; line-height:1.3; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${name}">${name}</h4>
          
          <div style="display:flex; align-items:center; gap:2px; margin-bottom:10px;">
            ${starsHtml}
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px dashed #e2e8f0; padding-top:10px; margin-top:4px;">
            <div>
              <div style="font-size:0.68rem; color:#64748b; font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">ფასი</div>
              <div>
                <span style="font-size:1.15rem; font-weight:800; color:#0066ff;">$${price}</span>
                <span style="font-size:0.72rem; color:#94a3b8; font-weight:500;">/ღამე</span>
              </div>
            </div>

            <a href="hotel.html?id=${id}" style="background:linear-gradient(135deg, #0066ff 0%, #0052cc 100%); color:#ffffff; padding:8px 14px; border-radius:10px; text-decoration:none; font-size:0.8rem; font-weight:700; display:inline-flex; align-items:center; gap:6px; box-shadow:0 4px 10px rgba(0,102,255,0.25);">
              დაჯავშნა <i class="fa-solid fa-arrow-right" style="font-size:0.7rem;"></i>
            </a>
          </div>
        </div>
      </div>
    `;
  }

  // 4. შეტყობინების ფორმატირება
  function formatAiMessage(text) {
    if (!text) return "";
    let html = text;

    html = html.replace(/HOTEL_CARD:\[(\d+)\]/g, (match, hotelId) => {
      return buildCardHTML(hotelId.trim());
    });

    html = html.replace(/HOTEL_CARD:\[([0-9]+)[^\]]*\]/g, (match, hotelId) => {
      return buildCardHTML(hotelId.trim());
    });

    html = html.replace(/CARD:\[([0-9]+)[^\]]*\]/g, (match, hotelId) => {
      return buildCardHTML(hotelId.trim());
    });

    return html.replace(/\n/g, "<br>");
  }

  function appendMessageUI(content, sender) {
    const box = document.getElementById("aiChatMessages");
    if (!box) return null;
    const msgEl = document.createElement("div");
    msgEl.className = `ai-msg ${sender}`;
    msgEl.innerHTML = content;
    box.appendChild(msgEl);
    box.scrollTop = box.scrollHeight;
    return msgEl;
  }

  function openChat() {
    const win = document.getElementById("aiChatWindow");
    const input = document.getElementById("aiInputText");
    if (!win) return;
    win.classList.remove("hidden");
    win.style.display = "flex";
    if (input) setTimeout(() => input.focus(), 60);
  }

  function closeChat() {
    const win = document.getElementById("aiChatWindow");
    if (!win) return;
    win.classList.add("hidden");
    win.style.display = "none";
  }

  // 5. ივენთები
  document.addEventListener("click", (e) => {
    if (e.target.closest("#aiLauncher")) {
      e.stopPropagation();
      const win = document.getElementById("aiChatWindow");
      if (!win) return;
      if (win.classList.contains("hidden")) openChat();
      else closeChat();
      return;
    }

    if (e.target.closest("#closeAiChat")) {
      e.stopPropagation();
      closeChat();
    }
  });

  document.addEventListener("submit", async (e) => {
    if (e.target.id !== "aiChatForm") return;
    e.preventDefault();

    const input = document.getElementById("aiInputText");
    if (!input) return;

    const rawText = input.value.trim();
    if (!rawText) return;

    appendMessageUI(rawText.replace(/</g, "&lt;").replace(/>/g, "&gt;"), "user");
    input.value = "";

    const loadingEl = appendMessageUI(
      '<i class="fa-solid fa-spinner fa-spin"></i> ასისტენტი ეძებს...',
      "bot"
    );

    try {
      const res = await fetch("http://localhost:3000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: rawText }),
      });

      const data = await res.json();
      const answer = data.reply || "ინფორმაცია ვერ მოიძებნა.";

      loadingEl.innerHTML = formatAiMessage(answer);
    } catch (err) {
      console.error(err);
      loadingEl.innerHTML = "სერვერთან კავშირი ვერ დამყარდა.";
    }

    const box = document.getElementById("aiChatMessages");
    if (box) box.scrollTop = box.scrollHeight;
  });
})();