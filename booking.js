document.addEventListener("DOMContentLoaded", async () => {
  renderNavbarAuth();

  const token = localStorage.getItem("token");
  if (!token) {
    localStorage.setItem("redirectAfterLogin", window.location.href);
    window.location.replace("login.html");
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const roomId = params.get("id");
  const checkInParam = params.get("checkIn");
  const checkOutParam = params.get("checkOut");

  if (!roomId) {
    alert("Room ID not found!");
    window.location.href = "index.html";
    return;
  }

  const backToRoomLink = document.getElementById("backToRoomLink");
  if (backToRoomLink) backToRoomLink.href = `room.html?id=${roomId}`;

  const checkInInput = document.getElementById("bookingCheckIn");
  const checkOutInput = document.getElementById("bookingCheckOut");
  const guestsInput = document.getElementById("bookingGuests");
  const nightsBadge = document.getElementById("nightsBadge");
  const maxCapacityText = document.getElementById("maxCapacityText");

  const summaryRoomImg = document.getElementById("summaryRoomImg");
  const summaryRoomName = document.getElementById("summaryRoomName");
  const summaryHotelName = document.getElementById("summaryHotelName");
  const summaryStars = document.getElementById("summaryStars");
  const summaryPricePerNight = document.getElementById("summaryPricePerNight");
  const summaryNightsCount = document.getElementById("summaryNightsCount");
  const summaryGuestsCount = document.getElementById("summaryGuestsCount");
  const summaryTotalPrice = document.getElementById("summaryTotalPrice");
  const confirmBookingBtn = document.getElementById("confirmBookingBtn");

  let roomPrice = 0;
  let maxCapacity = 2;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfterTomorrow = new Date();
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

  const formatD = (d) => d.toISOString().split("T")[0];

  if (checkInInput) checkInInput.value = checkInParam || formatD(tomorrow);
  if (checkOutInput) checkOutInput.value = checkOutParam || formatD(dayAfterTomorrow);

  if (checkInInput) checkInInput.min = formatD(new Date());
  if (checkOutInput) checkOutInput.min = formatD(tomorrow);

  try {
    const res = await fetch(`https://bookingapi.stepacademy.ge/api/rooms/details/${roomId}`, {
      headers: { "accept": "application/json" }
    });

    if (!res.ok) throw new Error("Room not found");
    const json = await res.json();
    const room = json.data || json;

    roomPrice = room.pricePerNight || 0;
    maxCapacity = room.capacity || 2;

    if (summaryRoomImg) {
      const validThumb = (room.thumbnail && room.thumbnail.startsWith("http")) 
        ? room.thumbnail 
        : (room.images && room.images[0] && room.images[0].startsWith("http"))
          ? room.images[0]
          : "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=300";
      summaryRoomImg.src = validThumb;
    }

    if (summaryRoomName) summaryRoomName.textContent = room.roomType || `Room #${room.roomNumber}`;
    if (summaryHotelName) summaryHotelName.textContent = room.hotel?.name || "Hotel";
    if (summaryPricePerNight) summaryPricePerNight.textContent = `$${roomPrice}`;

    if (maxCapacityText) {
      maxCapacityText.innerHTML = `<i class="fa-solid fa-circle-info"></i> Max capacity: ${maxCapacity} guests`;
    }
    if (guestsInput) guestsInput.max = maxCapacity;

    if (summaryStars) {
      let starsHtml = "";
      for (let i = 0; i < 5; i++) {
        starsHtml += '<i class="fa-solid fa-star" style="color: #f59e0b; margin-right: 2px;"></i>';
      }
      summaryStars.innerHTML = starsHtml;
    }

    recalculateSummary();
  } catch (err) {
    console.error(err);
  }

  function recalculateSummary() {
    if (!checkInInput || !checkOutInput) return;
    const inDate = new Date(checkInInput.value);
    const outDate = new Date(checkOutInput.value);

    let diffDays = Math.ceil((outDate - inDate) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) diffDays = 1;

    if (nightsBadge) nightsBadge.innerHTML = `<i class="fa-solid fa-moon"></i> ${diffDays} night${diffDays > 1 ? 's' : ''}`;
    if (summaryNightsCount) summaryNightsCount.textContent = diffDays;
    if (summaryGuestsCount && guestsInput) summaryGuestsCount.textContent = guestsInput.value || 1;

    const total = roomPrice * diffDays;
    if (summaryTotalPrice) summaryTotalPrice.textContent = `$${total}`;
  }

  if (checkInInput) {
    checkInInput.addEventListener("change", () => {
      if (new Date(checkOutInput.value) <= new Date(checkInInput.value)) {
        const nextD = new Date(checkInInput.value);
        nextD.setDate(nextD.getDate() + 1);
        checkOutInput.value = formatD(nextD);
      }
      recalculateSummary();
    });
  }

  if (checkOutInput) checkOutInput.addEventListener("change", recalculateSummary);
  if (guestsInput) guestsInput.addEventListener("input", recalculateSummary);

  if (confirmBookingBtn) {
    confirmBookingBtn.addEventListener("click", async () => {
      confirmBookingBtn.disabled = true;
      confirmBookingBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Booking...`;

      const checkInVal = checkInInput.value;
      const checkOutVal = checkOutInput.value;

      if (!checkInVal || !checkOutVal) {
        alert("გთხოვთ აირჩიოთ თარიღები!");
        confirmBookingBtn.disabled = false;
        confirmBookingBtn.innerHTML = `<i class="fa-solid fa-check"></i> Confirm Booking`;
        return;
      }

      const guestsCountVal = Number(guestsInput.value) || 1;

      // სერვერის მიერ მოთხოვნილი ზუსტი სტრუქტურა: numberOfGuests
      const payload = {
        roomId: Number(roomId),
        checkInDate: `${checkInVal}T14:00:00Z`,
        checkOutDate: `${checkOutVal}T12:00:00Z`,
        numberOfGuests: guestsCountVal,
        guestCount: guestsCountVal
      };

      try {
        const res = await fetch("https://bookingapi.stepacademy.ge/api/reservations", {
          method: "POST",
          headers: {
            "accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        const resData = await res.json().catch(() => ({}));

        if (!res.ok) {
          alert("ჯავშნის შექმნა ვერ მოხერხდა: " + (resData.detail || resData.message || res.statusText));
          confirmBookingBtn.disabled = false;
          confirmBookingBtn.innerHTML = `<i class="fa-solid fa-check"></i> Confirm Booking`;
          return;
        }

        // სერვერის ნამდვილი ID
        const realId = resData.data?.id || resData.data || resData.id || resData.reservationId;

        const inDate = new Date(checkInVal);
        const outDate = new Date(checkOutVal);
        let diffDays = Math.ceil((outDate - inDate) / (1000 * 60 * 60 * 24));
        if (diffDays <= 0) diffDays = 1;

        const newBooking = {
          id: realId,
          isFromServer: true,
          hotelName: summaryHotelName ? summaryHotelName.textContent : "Hotel Stay",
          roomName: summaryRoomName ? summaryRoomName.textContent : "Room",
          roomThumbnail: summaryRoomImg ? summaryRoomImg.src : "",
          checkInDate: checkInVal,
          checkOutDate: checkOutVal,
          totalPrice: roomPrice * diffDays,
          guestCount: guestsCountVal,
          status: "Pending"
        };

        const localList = JSON.parse(localStorage.getItem("user_custom_bookings") || "[]");
        localList.unshift(newBooking);
        localStorage.setItem("user_custom_bookings", JSON.stringify(localList));

        sessionStorage.setItem("activeProfileTab", "reservationsTab");
        window.location.href = "profile.html";

      } catch (err) {
        console.error(err);
        alert("ქსელური შეცდომა ჯავშნისას.");
        confirmBookingBtn.disabled = false;
        confirmBookingBtn.innerHTML = `<i class="fa-solid fa-check"></i> Confirm Booking`;
      }
    });
  }
});

function renderNavbarAuth() {
  const navAuth = document.getElementById("navAuth");
  if (!navAuth) return;

  const token = localStorage.getItem("token");
  if (!token) {
    navAuth.innerHTML = '<a href="login.html" class="btn btn-primary btn-sm">Sign In</a>';
    return;
  }

  const savedAvatar = localStorage.getItem("user_profile_avatar");
  const savedInitials = localStorage.getItem("user_initials") || "GG";

  let innerContent = savedInitials;
  if (savedAvatar && savedAvatar.trim().length > 5) {
    innerContent = `<img src="${savedAvatar.trim()}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;">`;
  }

  navAuth.innerHTML = `
    <a href="profile.html" class="user-avatar-btn" style="overflow:hidden; display:flex; align-items:center; justify-content:center; padding:0;">${innerContent}</a>
  `;
}