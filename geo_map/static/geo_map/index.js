let map;
let zoom;
let layer;
let allSites = [];
let allLinks = [];
const displayedPolylines = [];
const content = document.querySelector("#content");
const mapContainer = document.querySelector("#map");
const baseURL = window.location.origin;
const loader = document.getElementById("loader");
const container = document.getElementById("container");

function setMapHeight() {
  mapContainer.style.height = content.clientHeight + "px";
}
setMapHeight();
window.addEventListener("resize", setMapHeight);

function initMap() {
  const mapOptions = {
    center: [23.5, 78.6677428],
    zoom: 6,
  };
  map = L.map("map", mapOptions);

  layer = new L.TileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png");
  map.addLayer(layer);

  const providerSelect = document.getElementById("providerSelect");
  const linkStatusSelect = document.getElementById("fiberLinkStatus");
  const statusSelect = document.getElementById("statusSelect");
  const groupSelect = document.getElementById("groupSelect");

  const actions = document.getElementById("actions");
  const actionsContent = document.getElementById("actions-content");

  let selectedTenants = [];
  let selectedLinkStatuses = [];
  let selectedStatuses = [];
  let selectedGroups = ["pit"];

  statusSelect.addEventListener(
    "change",
    debounce(function () {
      selectedStatuses = Array.from(statusSelect.selectedOptions).map(
        (option) => option.value
      );
      fetchDataAndCreateMap(
        selectedStatuses,
        selectedGroups,
        selectedTenants,
        selectedLinkStatuses
      );
    }, 1000)
  );
  groupSelect.addEventListener(
    "change",
    debounce(function () {
      selectedGroups = Array.from(groupSelect.selectedOptions).map((option) =>
        option.value.toLowerCase()
      );
      fetchDataAndCreateMap(
        selectedStatuses,
        selectedGroups,
        selectedTenants,
        selectedLinkStatuses
      );
    }, 1000)
  );

  linkStatusSelect.addEventListener(
    "change",
    debounce(function () {
      selectedLinkStatuses = Array.from(linkStatusSelect.selectedOptions).map(
        (option) => option.value
      );
      if (!selectedLinkStatuses.length) {
        clearDisplayedPolylines();
        return;
      }
      fetchAndDrawPolylinesOnMap(selectedTenants, selectedLinkStatuses);
    }, 1000)
  );

  providerSelect.addEventListener(
    "change",
    debounce(function () {
      selectedTenants = Array.from(providerSelect.selectedOptions).map(
        (option) => option.value
      );
      if (!selectedTenants.length) {
        clearDisplayedPolylines();
        return;
      }
      fetchAndDrawPolylinesOnMap(selectedTenants, selectedLinkStatuses);
    }, 1000)
  );

  actions.addEventListener("click", function (event) {
    actionsContent.style.display = "block";
    actions.disabled = true;
    event.stopPropagation();
  });
  actionsContent.addEventListener("click", function () {
    exportKML(allSites);
    actionsContent.style.display = "none";
    actions.disabled = false;
  });
  document.addEventListener("click", function (event) {
    if (!actionsContent.contains(event.target)) {
      actionsContent.style.display = "none";
      actions.disabled = false;
    }
  });
  fetchDataAndCreateMap(
    selectedStatuses,
    selectedGroups,
    selectedTenants,
    selectedLinkStatuses
  );
}

function combineData(linksArray, sitesArray) {
  const combinedData = {};
  if (!linksArray.length || !sitesArray.length) return null;
  linksArray.forEach((connection) => {
    const {
      id,
      status,
      termination_a_site,
      termination_z_site,
      provider_color,
    } = connection;
    const siteDetails = sitesArray.filter(
      (site) => termination_a_site === site.id || termination_z_site === site.id
    );
    if (siteDetails.length < 2) return;
    const combinedObject = {
      id,
      status,
      color: provider_color,
      terminations: siteDetails,
    };
    combinedData[id] = combinedObject;
  });
  return combinedData;
}
function visualizeCombinedData(
  combinedData,
  selectedLinkStatuses,
  selectedTenants
) {
  clearDisplayedPolylines();
  if (!selectedLinkStatuses.length || !selectedTenants.length) return;
  for (const id in combinedData) {
    const connection = combinedData[id];
    const { terminations } = connection;
    if (
      terminations.length > 1 &&
      connection.status &&
      selectedLinkStatuses.includes(connection.status)
    ) {
      drawPolyline(terminations, connection);
    }
  }
}

function fetchAndDrawPolylinesOnMap(selectedTenants, selectedLinkStatuses) {
  if (!selectedTenants.length || !selectedLinkStatuses.length) return;
  const LINKS_API_CALL = new URL(baseURL + "/api/plugins/geo_map/links/");
  if (selectedTenants.length !== providerSelect.children.length) {
    LINKS_API_CALL.searchParams.set("provider__in", selectedTenants.join(","));
    LINKS_API_CALL.search = LINKS_API_CALL.searchParams.toString();
  }
  LINKS_API_CALL.searchParams.set("status__in", selectedLinkStatuses.join(","));
  LINKS_API_CALL.search = LINKS_API_CALL.searchParams.toString();

  fetch(LINKS_API_CALL)
    .then((response) => response.json())
    .then((data) => {
      allLinks = JSON.parse(JSON.stringify(data));
      const combinedData = combineData(allLinks, allSites);
      visualizeCombinedData(
        combinedData,
        selectedLinkStatuses,
        selectedTenants
      );
    })
    .catch((error) => {
      console.error("Error fetching site data:", error);
    });
}

function fetchDataAndCreateMap(
  selectedStatuses,
  selectedGroups,
  selectedTenants,
  selectedLinkStatuses
) {
  const API_CALL = new URL(baseURL + "/api/plugins/geo_map/sites/");
  if (selectedStatuses.length) {
    API_CALL.searchParams.set("status__in", selectedStatuses.join(","));
    API_CALL.search = API_CALL.searchParams.toString();
  }
  if (selectedGroups.length && selectedStatuses.length) {
    API_CALL.searchParams.set("?group__in", selectedGroups.join(","));
    API_CALL.search = API_CALL.searchParams.toString();
  }

  fetch(API_CALL)
    .then((response) => response.json())
    .then((data) => {
      allSites = JSON.parse(JSON.stringify(data));
      // const centerCoordinates = calculateCenter(data);

      if (selectedTenants && selectedLinkStatuses) {
        const combinedData = combineData(allLinks, allSites);
        visualizeCombinedData(
          combinedData,
          selectedLinkStatuses,
          selectedTenants
        );
      }
      if (selectedStatuses.length && selectedGroups.length) {
        data.forEach((site) => {
          if (
            selectedGroups.includes(site.group) &&
            selectedStatuses.includes(site.status)
          ) {
            addMarker({
              location: { lat: site.latitude, lng: site.longitude },
              icon: `/static/geo_map/assets/icons/${site.group}_${site.status}.svg`,
              content: generateSiteHTML(site),
            });
          }
        });
      } else if (selectedStatuses.length) {
        data.forEach((site) => {
          if (selectedStatuses.includes(site.status)) {
            addMarker({
              location: { lat: site.latitude, lng: site.longitude },
              icon: `/static/geo_map/assets/icons/${site.group}_${site.status}.svg`,
              content: generateSiteHTML(site),
            });
          }
        });
      } else if (selectedGroups.length) {
        data.forEach((site) => {
          if (selectedGroups.includes(site.group)) {
            addMarker({
              location: { lat: site.latitude, lng: site.longitude },
              icon: `/static/geo_map/assets/icons/${site.group}_${site.status}.svg`,
              content: generateSiteHTML(site),
            });
          }
        });
      }
    })
    .catch((error) => {
      console.error("Error fetching site data:", error);
    })
    .finally(() => {
      loader.classList.add("d-none");
      container.style.display = "block";
    });
}
function addMarker(data) {
  if (data.location.lat === 0 || data.location.lng === 0) return;

  let icon = L.icon({
    iconUrl: data.icon,
    iconSize: [12, 12],
    iconAnchor: [7, 7],
    popupAnchor: [0, -7],
  });

  const marker = L.marker([data.location.lat, data.location.lng], {
    draggable: false,
    icon,
  })
    .addTo(map)
    .bindPopup(data.content)
    .openPopup();
}
function generateSiteHTML(site) {
  return "<a target='_blank' href=" + site.url + ">" + site.name + "</a>";
}
function drawPolyline(terminations, connection) {
  const lineSymbolPath = {
    active: [
      {
        //solid line
        icon: {
          path: "M 0,1 0,-1",
          strokeOpacity: 1,
          scale: 2,
          strokeWeight: 1.5,
          strokeColor: connection.color,
        },
        offset: "0",
        repeat: "1px",
      },
    ],
    planned: [
      {
        //dashed line
        icon: {
          path: "M 0,-2 0,1",
          strokeOpacity: 1,
          scale: 2,
          strokeWeight: 1.5,
          strokeColor: connection.color,
        },
        offset: "0",
        repeat: "15px",
      },
    ],
    offline: [
      {
        //dotted line
        icon: {
          path: "M 0,3 0,2",
          strokeOpacity: 1,
          scale: 2,
          strokeWeight: 1.5,
          strokeColor: connection.color,
        },
        offset: "0",
        repeat: "10px",
      },
    ],
    provisioning: [
      {
        //longdash
        icon: {
          path: "M 0,-5 0,5",
          strokeOpacity: 1,
          scale: 1,
          strokeWeight: 1.5,
          strokeColor: connection.color,
        },
        offset: "0",
        repeat: "30px",
      },
    ],
    decommissioned: [
      {
        //twodash
        icon: {
          path: "M 0,3 0,2",
          strokeOpacity: 1,
          scale: 2,
          strokeWeight: 1.5,
          strokeColor: connection.color,
        },
        offset: "0",
        repeat: "15px",
      },
      {
        icon: {
          path: "M 0,-2 0,1",
          strokeOpacity: 1,
          scale: 2,
          strokeWeight: 1.5,
          strokeColor: connection.color,
        },
        offset: "0",
        repeat: "15px",
      },
    ],
    deprovisioning: [
      {
        //dotdash
        icon: {
          path: "M 0,3 0,2",
          strokeOpacity: 1,
          scale: 2,
          strokeWeight: 1.5,
          strokeColor: connection.color,
        },
        offset: "0",
        repeat: "10px",
      },
      {
        icon: {
          path: "M 0,-2 0,1",
          strokeOpacity: 1,
          scale: 2,
          strokeWeight: 1.5,
          strokeColor: connection.color,
        },
        offset: "0",
        repeat: "20px",
      },
    ],
  };
  const paths = terminations.map((t) => {
    if (t.latitude === 0 || t.longitude === 0) return null;
    return [t.latitude, t.longitude];
  });
  // console.log(paths);
  if (connection.status && !paths.includes(null)) {
    const polyline = L.polyline(paths, {
      color: connection.color,
      weight: 2,
      opacity: 0.5,
      dashArray: lineSymbolPath[connection.status][0].repeat,
    }).addTo(map);
    map.fitBounds(polyline.getBounds());
  }
}

function clearDisplayedPolylines() {
  for (const polyline of displayedPolylines) {
    polyline.remove();
  }
  displayedPolylines.length = 0;
}
// function calculateCenter(data) {
//   const totalSites = data.length;
//   const sumLat = data.reduce((sum, site) => sum + site.latitude, 0);
//   const sumLng = data.reduce((sum, site) => sum + site.longitude, 0);
//   const averageLat = sumLat / totalSites;
//   const averageLng = sumLng / totalSites;

//   if (isNaN(averageLat) || isNaN(averageLng)) {
//     return { lat: 23.5, lng: 78.6677428 };
//   }
//   return { lat: averageLat, lng: averageLng };
// }
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
window.initMap = initMap;
