    const buildings = {
      library: "Main Library",
      science: "Science Hall",
      student: "Student Center",
      arts: "Arts & Humanities",
      admin: "Administration"
    };

    const sampleLots = [
      { id: "north", name: "North Garage", address: "120 College Ave · Covered", spaces: 184, capacity: 320, permit: "Student permit", permits: ["student", "commuter"], type: "available", walks: { library: 4, science: 5, student: 8, arts: 9, admin: 7 } },
      { id: "east", name: "East Surface Lot", address: "45 Science Way · Open air", spaces: 32, capacity: 210, permit: "Commuter permit", permits: ["commuter"], type: "limited", walks: { library: 9, science: 3, student: 10, arts: 8, admin: 6 } },
      { id: "library", name: "Library Lot", address: "8 Scholars Walk · Open air", spaces: 0, capacity: 95, permit: "Student or commuter", permits: ["student", "commuter"], type: "full", walks: { library: 2, science: 8, student: 5, arts: 6, admin: 10 } },
      { id: "west", name: "West Commuter Lot", address: "300 West Campus Dr · Open air", spaces: 146, capacity: 280, permit: "Commuter permit", permits: ["commuter"], type: "available", walks: { library: 8, science: 10, student: 5, arts: 4, admin: 9 } },
      { id: "visitor", name: "Visitor Lot", address: "12 University Plaza · Open air", spaces: 8, capacity: 45, permit: "Visitor pass required", permits: ["visitor"], type: "limited", walks: { library: 6, science: 7, student: 3, arts: 9, admin: 4 } }
    ];

    const list = document.getElementById("lot-list");
    const destination = document.getElementById("building-select");
    const permitSelect = document.getElementById("permit-select");
    const routePanel = document.getElementById("route-panel");
    const dialog = document.getElementById("lot-dialog");
    const form = document.getElementById("lot-form");
    const message = document.getElementById("crud-message");
    const mapMarkers = document.getElementById("map-markers");
    const storageKey = "campuspark-lots-v1";
    const permitOptions = {
      student: { permit: "Student permit", permits: ["student"] },
      commuter: { permit: "Commuter permit", permits: ["commuter"] },
      visitor: { permit: "Visitor pass required", permits: ["visitor"] },
      both: { permit: "Student or commuter", permits: ["student", "commuter"] }
    };
    const mapPositions = [
      { left: 65, top: 11 }, { left: 83, top: 44 }, { left: 17, top: 57 },
      { left: 45, top: 83 }, { left: 4, top: 10 }, { left: 39, top: 15 },
      { left: 71, top: 78 }, { left: 25, top: 37 }
    ];
    let activeFilter = "all";
    let selectedLot = null;
    let lots = loadLots();

    function notify(text, isError) {
      message.textContent = text;
      message.classList.toggle("error", Boolean(isError));
    }

    function isValidLot(lot) {
      return lot && typeof lot.id === "string" && lot.id.length > 0 &&
        typeof lot.name === "string" && lot.name.trim().length > 0 &&
        typeof lot.address === "string" && lot.address.trim().length > 0 &&
        typeof lot.permit === "string" && lot.permit.length > 0 &&
        Number.isInteger(lot.capacity) &&
        Number.isInteger(lot.spaces) && lot.capacity > 0 && lot.spaces >= 0 &&
        lot.spaces <= lot.capacity && Array.isArray(lot.permits) && lot.permits.length > 0 &&
        lot.permits.every(permit => ["student", "commuter", "visitor"].includes(permit)) &&
        lot.walks && typeof lot.walks === "object" && !Array.isArray(lot.walks) &&
        Object.keys(buildings).every(key =>
          Number.isInteger(lot.walks[key]) && lot.walks[key] >= 1 && lot.walks[key] <= 60);
    }

    function loadLots() {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved === null) return sampleLots;
        const parsed = JSON.parse(saved);
        if (!Array.isArray(parsed) || !parsed.every(isValidLot) ||
            new Set(parsed.map(lot => lot.id)).size !== parsed.length) {
          throw new Error("Saved parking data is invalid.");
        }
        parsed.forEach(updateLotStatus);
        return parsed;
      } catch (error) {
        notify(`Could not load saved lots (${error.message}). Showing sample data instead.`, true);
        return sampleLots;
      }
    }

    function saveLots() {
      try {
        localStorage.setItem(storageKey, JSON.stringify(lots));
        notify("Parking lot changes saved in this browser.");
        return true;
      } catch (error) {
        notify(`Changes are visible, but could not be saved (${error.message}).`, true);
        return false;
      }
    }

    function escapeHtml(value) {
      return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
      })[character]);
    }

    function updateLotStatus(lot) {
      lot.type = lot.spaces === 0 ? "full" : lot.spaces / lot.capacity <= 0.2 ? "limited" : "available";
    }

    const icons = {
      walk: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="13" cy="5" r="2" stroke="currentColor" stroke-width="1.7"/><path d="m10 21 2-6-2-3 3-3 3 3 3 1M7 11l3-3m0 6-4 2-1 4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      spaces: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 19V6.5A1.5 1.5 0 0 1 6.5 5H17a2 2 0 0 1 2 2v12M3 19h18M9 9h5.5a2.5 2.5 0 0 1 0 5H9V9Z" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      permit: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3 5 6v5c0 4.5 3 7.8 7 10 4-2.2 7-5.5 7-10V6l-7-3Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="m9 12 2 2 4-4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    };

    function statusText(lot) {
      if (lot.spaces === 0) return "Full";
      if (lot.type === "limited") return "Filling up";
      return "Spaces available";
    }

    function getVisibleLots() {
      const permit = permitSelect.value;
      return lots
        .filter(lot => activeFilter !== "available" || lot.spaces > 0)
        .filter(lot => activeFilter !== "visitor" || lot.permits.includes("visitor"))
        .filter(lot => permit === "any" || lot.permits.includes(permit))
        .sort((a, b) => a.walks[destination.value] - b.walks[destination.value]);
    }

    function render() {
      const visible = getVisibleLots();
      list.innerHTML = "";
      document.getElementById("result-count").textContent = `${visible.length} ${visible.length === 1 ? "lot" : "lots"}`;
      document.getElementById("open-lots").textContent = visible.filter(lot => lot.spaces > 0).length;
      document.getElementById("open-spaces").textContent = visible.reduce((total, lot) => total + lot.spaces, 0).toLocaleString();
      const nearestAvailable = visible.find(lot => lot.spaces > 0);
      document.getElementById("nearest-distance").textContent = nearestAvailable ? `${nearestAvailable.walks[destination.value]} min` : "—";

      if (!visible.length) {
        list.innerHTML = '<div class="empty-state">No lots match those filters. Try a different permit or filter.</div>';
      }

      visible.forEach(lot => {
        const card = document.createElement("article");
        card.className = `lot-card${selectedLot === lot.id ? " selected" : ""}`;
        card.innerHTML = `
          <div class="lot-top">
            <div><h3 class="lot-name">${escapeHtml(lot.name)}</h3><p class="lot-address">${escapeHtml(lot.address)}</p></div>
            <span class="status ${lot.type}"><i class="status-dot"></i>${statusText(lot)}</span>
          </div>
          <div class="lot-meta">
            <span class="meta-item">${icons.walk}<span>${lot.walks[destination.value]} min walk</span></span>
            <span class="meta-item">${icons.spaces}<span class="spaces">${lot.spaces}</span><span>of ${lot.capacity} spaces</span></span>
          </div>
          <div class="lot-bottom">
            <span class="permit">${icons.permit}${escapeHtml(lot.permit)}</span>
            <div class="lot-actions">
              <button class="edit-button" type="button" data-edit="${escapeHtml(lot.id)}">Edit</button>
              <button class="delete-button" type="button" data-delete="${escapeHtml(lot.id)}">Delete</button>
              <button class="directions-button" type="button"${lot.spaces > 0 ? ` data-directions="${escapeHtml(lot.id)}"` : " disabled"}>${lot.spaces > 0 ? 'Directions <span aria-hidden="true">→</span>' : "Full right now"}</button>
            </div>
          </div>`;
        list.appendChild(card);
      });

      mapMarkers.replaceChildren();
      lots.forEach((lot, index) => {
        const marker = document.createElement("button");
        const position = mapPositions[index % mapPositions.length];
        marker.type = "button";
        marker.className = "marker";
        marker.dataset.lot = lot.id;
        marker.textContent = lot.name;
        marker.style.left = `${position.left}%`;
        marker.style.top = `${position.top}%`;
        marker.classList.toggle("active", selectedLot === lot.id);
        marker.classList.toggle("limited", lot.type === "limited");
        marker.classList.toggle("full", lot.spaces === 0);
        marker.disabled = lot.spaces === 0;
        marker.setAttribute("aria-label", `${lot.name}, ${lot.spaces} spaces available`);
        mapMarkers.appendChild(marker);
      });

      document.querySelectorAll(".marker").forEach(marker => {
        const lot = lots.find(item => item.id === marker.dataset.lot);
        if (!lot) return;
        marker.classList.toggle("active", selectedLot === marker.dataset.lot);
        marker.classList.toggle("limited", lot.type === "limited");
        marker.classList.toggle("full", lot.spaces === 0);
        marker.disabled = lot.spaces === 0;
        marker.setAttribute("aria-label", `${lot.name}, ${lot.spaces} spaces available`);
      });

      document.querySelectorAll(".building").forEach(building => {
        building.style.outline = building.dataset.building === destination.value ? "2px solid #479467" : "none";
      });
    }

    function openLotDialog(lot) {
      form.reset();
      document.getElementById("dialog-error").textContent = "";
      document.getElementById("walk-building-label").textContent = buildings[destination.value];
      document.getElementById("dialog-title").textContent = lot ? "Edit parking lot" : "Add a parking lot";
      form.querySelector(".save-button").textContent = lot ? "Save changes" : "Add lot";
      document.getElementById("lot-id").value = lot ? lot.id : "";
      document.getElementById("lot-name-input").value = lot ? lot.name : "";
      document.getElementById("lot-address-input").value = lot ? lot.address : "";
      document.getElementById("lot-capacity-input").value = lot ? lot.capacity : "";
      document.getElementById("lot-spaces-input").value = lot ? lot.spaces : "";
      document.getElementById("lot-spaces-input").max = lot ? String(lot.capacity) : "10000";
      document.getElementById("lot-walk-input").value = lot ? lot.walks[destination.value] : 5;
      const permit = lot ? Object.keys(permitOptions).find(key =>
        JSON.stringify(permitOptions[key].permits) === JSON.stringify(lot.permits)) || "both" : "student";
      document.getElementById("lot-permit-input").value = permit;
      dialog.showModal();
      document.getElementById("lot-name-input").focus();
    }

    function hideDirections() {
      selectedLot = null;
      routePanel.classList.remove("visible");
    }

    function showDirections(lotId) {
      const lot = lots.find(item => item.id === lotId);
      if (!lot || lot.spaces === 0) return;
      const building = buildings[destination.value];
      const minutes = lot.walks[destination.value];
      selectedLot = lot.id;
      routePanel.classList.add("visible");
      document.getElementById("route-title").textContent = `${lot.name} → ${building}`;
      document.getElementById("route-detail").textContent = `${minutes} minute walk · ${lot.spaces} spaces available · ${lot.permit}. Head toward the central campus walkway and follow signs to ${building}.`;
      document.getElementById("route-link").href = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(lot.name + ", Northwood University")}&destination=${encodeURIComponent(building + ", Northwood University")}&travelmode=walking`;
      document.getElementById("map-path").style.width = `${Math.max(65, 195 - minutes * 10)}px`;
      document.getElementById("map-path").style.transform = `rotate(${lotId === "east" ? "135deg" : lotId === "west" ? "-15deg" : lotId === "visitor" ? "35deg" : "-40deg"})`;
      render();
    }

    document.getElementById("find-button").addEventListener("click", () => {
      selectedLot = null;
      routePanel.classList.remove("visible");
      render();
      const closest = getVisibleLots().find(lot => lot.spaces > 0);
      if (closest) showDirections(closest.id);
    });

    document.getElementById("add-lot-button").addEventListener("click", () => openLotDialog(null));
    document.getElementById("dialog-close").addEventListener("click", () => dialog.close());
    document.getElementById("dialog-cancel").addEventListener("click", () => dialog.close());
    document.getElementById("lot-capacity-input").addEventListener("input", event => {
      document.getElementById("lot-spaces-input").max = event.target.value || "10000";
    });

    form.addEventListener("submit", event => {
      event.preventDefault();
      const id = document.getElementById("lot-id").value;
      const name = document.getElementById("lot-name-input").value.trim();
      const address = document.getElementById("lot-address-input").value.trim();
      const capacity = Number(document.getElementById("lot-capacity-input").value);
      const spaces = Number(document.getElementById("lot-spaces-input").value);
      const walk = Number(document.getElementById("lot-walk-input").value);
      const permitChoice = permitOptions[document.getElementById("lot-permit-input").value];
      const error = document.getElementById("dialog-error");

      if (!name || !address) {
        error.textContent = "Enter a name and location for the lot.";
        return;
      }
      if (!document.getElementById("lot-capacity-input").value ||
          !document.getElementById("lot-spaces-input").value ||
          !Number.isInteger(capacity) || capacity < 1 || capacity > 10000 ||
          !Number.isInteger(spaces) || spaces < 0 || spaces > capacity) {
        error.textContent = "Available spaces must be a whole number from 0 to the total capacity.";
        return;
      }
      if (!permitChoice) {
        error.textContent = "Choose a valid permit requirement.";
        return;
      }
      if (!Number.isInteger(walk) || walk < 1 || walk > 60) {
        error.textContent = "Walking time must be a whole number between 1 and 60 minutes.";
        return;
      }

      const existing = lots.find(lot => lot.id === id);
      const walks = existing ? { ...existing.walks } :
        Object.fromEntries(Object.keys(buildings).map(building => [building, 5]));
      walks[destination.value] = walk;
      const lot = {
        id: existing ? existing.id : `lot-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name, address, capacity, spaces, permit: permitChoice.permit,
        permits: [...permitChoice.permits], walks, type: "available"
      };
      updateLotStatus(lot);

      if (existing) {
        lots = lots.map(item => item.id === existing.id ? lot : item);
      } else {
        lots.push(lot);
      }

      hideDirections();
      dialog.close();
      render();
      saveLots();
    });

    document.querySelectorAll(".filter").forEach(button => {
      button.addEventListener("click", () => {
        activeFilter = button.dataset.filter;
        document.querySelectorAll(".filter").forEach(filter => {
          const isActive = filter === button;
          filter.classList.toggle("active", isActive);
          filter.setAttribute("aria-pressed", String(isActive));
        });
        selectedLot = null;
        routePanel.classList.remove("visible");
        render();
      });
    });

    destination.addEventListener("change", () => {
      routePanel.classList.remove("visible");
      selectedLot = null;
      render();
    });
    permitSelect.addEventListener("change", () => {
      routePanel.classList.remove("visible");
      selectedLot = null;
      render();
    });
    list.addEventListener("click", event => {
      const button = event.target.closest("[data-directions]");
      if (button) {
        showDirections(button.dataset.directions);
        return;
      }
      const editButton = event.target.closest("[data-edit]");
      if (editButton) {
        const lot = lots.find(item => item.id === editButton.dataset.edit);
        if (lot) openLotDialog(lot);
        return;
      }
      const deleteButton = event.target.closest("[data-delete]");
      if (deleteButton) {
        const lot = lots.find(item => item.id === deleteButton.dataset.delete);
        if (!lot || !window.confirm(`Delete ${lot.name}? This cannot be undone.`)) return;
        lots = lots.filter(item => item.id !== lot.id);
        hideDirections();
        render();
        saveLots();
      }
    });
    mapMarkers.addEventListener("click", event => {
      const marker = event.target.closest("[data-lot]");
      if (marker) showDirections(marker.dataset.lot);
    });

    render();
