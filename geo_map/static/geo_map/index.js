let map;
let zoom;
let allSites = [];
let allLinks = [];
let selectedCitySites = [];
let displayedPolylines = [];
let displayedMarkers = [];

let initialLoad = true;
let storedMapCenter = null;
let storedZoomLevel = null;

const content = document.querySelector("#content");
const mapContainer = document.querySelector("#map");
const baseURL = window.location.origin;
const PROVIDERS_API_CALL = new URL(baseURL + "/api/plugins/geo_map/providers/");
const loader = document.getElementById("loader");
const container = document.getElementById("container");

const providerSelect = document.getElementById("provider-select");
let selectedTenants = [];

const fiberLinkSelect = document.getElementById("fiber-link-status");
const popsStatusSelect = document.getElementById("status-select");
const groupSelect = document.getElementById("group-select");
const citySelect = document.getElementById("city-select");
const exportButton = document.getElementById("export-kml");
const pageContent = document.getElementById("page-content");

function setMapHeight() {
  mapContainer.style.height = pageContent.clientHeight + "px";
}
setMapHeight();
window.addEventListener("resize", setMapHeight);

function resetSelections(selectElements, defaults = {}) {
  selectElements.forEach(({ element, value = null }) => {
    Array.from(element.options).forEach((option) => {
      option.selected = value ? option.value === value : false;
    });
    if (element.loadOptions) element.loadOptions();
  });
}

document.addEventListener("DOMContentLoaded", function () {
  const providerSelect = document.getElementById("provider-select");
  function fetchProviders() {
    fetch(PROVIDERS_API_CALL)
      .then((response) => response.json())
      .then((providers) => {
        providerSelect.innerHTML = "";
        providers.forEach((provider) => {
          const option = document.createElement("option");
          option.value = provider.id;
          option.text = provider.name;
          option.selected = true;
          option.dataset.color = provider.color;
          providerSelect.appendChild(option);
        });
        if (providerSelect.loadOptions) {
          providerSelect.loadOptions();
        }
        selectedTenants = providers.map((provider) => provider.value);
        initMap();
      })
      .catch((error) => console.error("Error fetching providers:", error));
  }
  fetchProviders();
});

async function initMap() {
  let selectedFiberLinkStatuses = ["active"];
  let selectedPopsStatuses = ["active"];
  let selectedGroups = ["access", "core", "distribution", "pit"];

  citySelect.addEventListener(
    "change",
    debounce(() => {
      selectedFiberLinkStatuses = ["active"];
      selectedCitySites = [];
      if (!citySelect.value) {
        clearDisplayedPolylines();
        clearDisplayedMarkers();
        if (storedMapCenter && storedZoomLevel) {
          map.setCenter(storedMapCenter);
          map.setZoom(storedZoomLevel);

          selectedFiberLinkStatuses = [];
          selectedPopsStatuses = [];
          selectedGroups = [];
          selectedTenants = [];

          resetSelections([
            { element: providerSelect },
            { element: fiberLinkSelect },
            { element: popsStatusSelect },
          ]);
          Array.from(groupSelect.options).forEach((option) => {
            option.selected = false;
          });
          if (groupSelect.loadOptions) groupSelect.loadOptions();
          return;
        }
      }

      selectedFiberLinkStatuses = ["active"];
      selectedPopsStatuses = ["active"];
      selectedGroups = ["access", "core", "distribution", "pit"];

      resetSelections([
        { element: fiberLinkSelect, value: "active" },
        { element: popsStatusSelect, value: "active" },
      ]);

      Array.from(groupSelect.options).forEach((option) => {
        option.selected = true;
      });
      if (groupSelect.loadOptions) groupSelect.loadOptions();

      const selectedCity = citySelect.value;
      if (selectedCity) {
        fetchSitesByRegion(
          selectedCity,
          selectedFiberLinkStatuses,
          selectedPopsStatuses,
          selectedGroups
        );
      }
    }, 1000)
  );

  popsStatusSelect.addEventListener(
    "change",
    debounce(() => {
      selectedPopsStatuses = Array.from(popsStatusSelect.selectedOptions).map(
        (option) => option.value
      );
      fetchDataAndCreateMap(
        selectedPopsStatuses,
        selectedGroups,
        selectedTenants,
        selectedFiberLinkStatuses
      );
    }, 1000)
  );

  groupSelect.addEventListener(
    "change",
    debounce(() => {
      selectedGroups = Array.from(groupSelect.selectedOptions).map((option) =>
        option.value.toLowerCase()
      );
      fetchDataAndCreateMap(
        selectedPopsStatuses,
        selectedGroups,
        selectedTenants,
        selectedFiberLinkStatuses
      );
    }, 1000)
  );

  fiberLinkSelect.addEventListener(
    "change",
    debounce(() => {
      selectedFiberLinkStatuses = Array.from(
        fiberLinkSelect.selectedOptions
      ).map((option) => option.value);
      if (!selectedFiberLinkStatuses.length) {
        clearDisplayedPolylines();
        return;
      }
      fetchAndDrawPolylinesOnMap(
        selectedTenants,
        selectedFiberLinkStatuses,
        selectedPopsStatuses,
        selectedGroups
      );
    }, 1000)
  );

  providerSelect.addEventListener(
    "change",
    debounce(() => {
      selectedTenants = Array.from(providerSelect.selectedOptions).map(
        (option) => option.value
      );
      if (!selectedTenants.length) {
        clearDisplayedPolylines();
        return;
      }
      fetchAndDrawPolylinesOnMap(
        selectedTenants,
        selectedFiberLinkStatuses,
        selectedPopsStatuses,
        selectedGroups
      );
    }, 1000)
  );

  exportButton.addEventListener("click", () => {
    exportKML(allSites);
  });

  fetchDataAndCreateMap(
    selectedPopsStatuses,
    selectedGroups,
    selectedTenants,
    selectedFiberLinkStatuses
  );

  if (initialLoad) {
    initialLoad = false;
    fetchAndDrawPolylinesOnMap(
      selectedTenants,
      selectedFiberLinkStatuses,
      selectedPopsStatuses,
      selectedGroups
    );
  }
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
  selectedFiberLinkStatuses,
  selectedTenants
) {
  clearDisplayedPolylines();
  if (!selectedFiberLinkStatuses.length || !selectedTenants.length) return;
  for (const id in combinedData) {
    const connection = combinedData[id];
    const { terminations } = connection;
    if (
      terminations.length > 1 &&
      connection.status &&
      selectedFiberLinkStatuses.includes(connection.status)
    ) {
      drawPolyline(terminations, connection);
    }
  }
}

function fetchAndDrawPolylinesOnMap(
  selectedTenants,
  selectedFiberLinkStatuses,
  selectedPopsStatuses,
  selectedGroups
) {
  if (!selectedTenants.length || !selectedFiberLinkStatuses.length) return;
  const LINKS_API_CALL = new URL(baseURL + "/api/plugins/geo_map/links/");
  if (selectedTenants.length !== providerSelect.children.length) {
    LINKS_API_CALL.searchParams.set("provider__in", selectedTenants.join(","));
    LINKS_API_CALL.search = LINKS_API_CALL.searchParams.toString();
  }
  LINKS_API_CALL.searchParams.set(
    "status__in",
    selectedFiberLinkStatuses.join(",")
  );

  LINKS_API_CALL.search = LINKS_API_CALL.searchParams.toString();

  fetch(LINKS_API_CALL)
    .then((response) => response.json())
    .then((data) => {
      allLinks = JSON.parse(JSON.stringify(data));
      const combinedData = combineData(allLinks, allSites);
      visualizeCombinedData(
        combinedData,
        selectedFiberLinkStatuses,
        selectedTenants
      );
      addMarkersForFilteredSites(
        selectedCitySites,
        selectedPopsStatuses,
        selectedGroups
      );
    })
    .catch((error) => {
      console.error("Error fetching site data:", error);
    });
}

function fetchSitesByRegion(
  regionId,
  selectedFiberLinkStatuses,
  selectedPopsStatuses,
  selectedGroups
) {
  const CALL = new URL(baseURL + "/api/dcim/sites/");
  CALL.searchParams.set("region_id", regionId);
  let arr = [];

  fetch(CALL)
    .then((response) => response.json())
    .then((data) => {
      let d = JSON.parse(JSON.stringify(data));
      if (!d.results.length) return [];
      const siteCoordinates = d.results.map((site) => ({
        lat: site.latitude,
        lng: site.longitude,
      }));

      if (siteCoordinates.length >= 2) {
        const centerCoordinates = calculateCenterBetweenTwoSites(
          siteCoordinates[0],
          siteCoordinates[1]
        );
        map.setCenter(centerCoordinates);
        map.setZoom(11);
      } else if (siteCoordinates.length === 1) {
        map.setCenter(siteCoordinates[0]);
        map.setZoom(13);
      }

      clearDisplayedMarkers();

      allLinks.forEach((link) => {
        const { termination_a_site, termination_z_site } = link;
        d.results.forEach((site) => {
          if (
            site.id === termination_a_site ||
            site.id === termination_z_site
          ) {
            arr.push(link);
          }
        });
      });

      let regionSites = allSites.filter((site) =>
        d.results.some((s) => s.id === site.id)
      );

      return regionSites;
    })
    .then((regionSites) => {
      const PROVIDERS_API_CALL = new URL(
        baseURL + "/api/plugins/geo_map/providers/"
      );
      fetch(PROVIDERS_API_CALL)
        .then((response) => response.json())
        .then((data) => {
          allVendors = JSON.parse(JSON.stringify(data));
          let povidersByRegion = allVendors.filter(
            (vendor) =>
              vendor.regions.length && vendor.regions.includes(Number(regionId))
          );

          selectedTenants = povidersByRegion.map((tenant) => String(tenant.id));

          Array.from(providerSelect.options).forEach((option) => {
            option.selected = false;
          });

          Array.from(providerSelect.options).forEach((option) => {
            if (selectedTenants.includes(option.value)) {
              option.selected = true;
            }
          });

          providerSelect.loadOptions();

          // Find the corresponding dropdown container and call refresh on it
          const dropdownDiv = providerSelect.nextSibling;
          if (dropdownDiv && dropdownDiv.refresh) {
            dropdownDiv.refresh();
          }
          if (!selectedTenants.length) {
            clearDisplayedPolylines();
            return;
          }

          const combo = combineData(arr, regionSites);
          visualizeCombinedData(
            combo,
            selectedFiberLinkStatuses,
            selectedTenants
          );
          addMarkersForFilteredSites(
            regionSites,
            selectedPopsStatuses,
            selectedGroups
          );
        });
    })
    .catch((error) => {
      console.error("Error fetching site data:", error);
      return [];
    });
}

function addMarkersForFilteredSites(
  sites,
  selectedPopsStatuses,
  selectedGroups
) {
  sites.forEach((site) => {
    if (
      (!selectedGroups.length || selectedGroups.includes(site.group)) &&
      (!selectedPopsStatuses.length ||
        selectedPopsStatuses.includes(site.status))
    ) {
      addMarker({
        location: { lat: site.latitude, lng: site.longitude },
        icon: `/static/geo_map/assets/icons/${site.group}_${site.status}.svg`,
        content: generateSiteHTML(site),
      });
    }
  });
}

function fetchDataAndCreateMap(
  selectedPopsStatuses,
  selectedGroups,
  selectedTenants,
  selectedFiberLinkStatuses
) {
  const currentZoom = map ? map.getZoom() : 6;
  const currentCenter = map ? map.getCenter() : null;
  storedMapCenter = currentCenter;
  storedZoomLevel = currentZoom;

  const API_CALL = new URL(baseURL + "/api/plugins/geo_map/sites/");
  if (selectedPopsStatuses.length) {
    API_CALL.searchParams.set("status__in", selectedPopsStatuses.join(","));
    API_CALL.search = API_CALL.searchParams.toString();
  }
  if (selectedGroups.length && selectedPopsStatuses.length) {
    API_CALL.searchParams.set("?group__in", selectedGroups.join(","));
    API_CALL.search = API_CALL.searchParams.toString();
  }

  fetch(API_CALL)
    .then((response) => response.json())
    .then((data) => {
      allSites = JSON.parse(JSON.stringify(data));
      const centerCoordinates = calculateCenter(data);
      if (!currentCenter) storedMapCenter = centerCoordinates;

      map = new google.maps.Map(document.getElementById("map"), {
        center: centerCoordinates,
        zoom: currentZoom,
        mapId: "Netbox_MAP_ID",
      });

      if (currentCenter) {
        map.setCenter(currentCenter);
      }

      if (selectedTenants && selectedFiberLinkStatuses) {
        const combinedData = combineData(allLinks, allSites);
        visualizeCombinedData(
          combinedData,
          selectedFiberLinkStatuses,
          selectedTenants
        );
      }
      addMarkersForFilteredSites(data, selectedPopsStatuses, selectedGroups);
    })
    .catch((error) => {
      console.error("Error fetching site data:", error);
    })
    .finally(() => {
      loader.classList.add("d-none");
      container.style.display = "block";
    });
}

async function addMarker(data) {
  const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
  if (data.location.lat === 0 || data.location.lng === 0) return;

  const markerElement = document.createElement("img");
  markerElement.src = data.icon;

  const marker = new AdvancedMarkerElement({
    position: new google.maps.LatLng(
      parseFloat(data.location.lat),
      parseFloat(data.location.lng)
    ),
    map: map,
    content: markerElement,
    gmpClickable: true,
  });

  displayedMarkers.push(marker);

  if (data.content) {
    const infoWindowContent = document.createElement("div");
    infoWindowContent.style.paddingBottom = "10px";
    infoWindowContent.style.color = "black";
    infoWindowContent.style.paddingRight = "20px";
    infoWindowContent.innerHTML = data.content;

    const infoWindow = new google.maps.InfoWindow({
      content: infoWindowContent,
    });

    marker.addListener("click", () => {
      infoWindow.open({ anchor: marker, map: map, shouldFocus: false });
    });

    marker.content.addEventListener("click", () => {
      infoWindow.open({ anchor: marker, map: map, shouldFocus: false });
    });

    marker.addListener("mouseover", () => {
      infoWindow.open({ anchor: marker, map: map, shouldFocus: false });
    });

    marker.content.addEventListener("mouseover", () => {
      infoWindow.open({ anchor: marker, map: map, shouldFocus: false });
    });

    marker.content.addEventListener("mouseout", () => {
      setTimeout(() => {
        infoWindow.close();
      }, 2000);
    });
  }
}

window.initMap = initMap;
