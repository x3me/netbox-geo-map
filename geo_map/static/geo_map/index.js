let map;
let zoom;
let allSites = [];
let allLinks = [];
let allVendors = [];
let selectedCityIdSites = [];
let displayedPolylines = [];
let displayedMarkers = [];
let selectedCityId = null;
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
        selectedTenants = providers.map((provider) => provider.id);
        allVendors = JSON.parse(JSON.stringify(providers));
        initMap();
      })
      .catch((error) => console.error("Error fetching providers:", error));
  }
  fetchProviders();
});

async function fetchAndCreateMapData(
  selectedPopsStatuses,
  selectedGroups,
  selectedTenants,
  selectedFiberLinkStatuses
) {
  const currentZoom = map ? map.getZoom() : 6;
  const currentCenter = map ? map.getCenter() : null;
  storedMapCenter = currentCenter;
  storedZoomLevel = currentZoom;

  const SITES_API_CALL = new URL(baseURL + "/api/plugins/geo_map/sites/");
  const LINKS_API_CALL = new URL(baseURL + "/api/plugins/geo_map/links/");

  if (selectedPopsStatuses.length) {
    SITES_API_CALL.searchParams.set("status__in", selectedPopsStatuses.join(","));
  }
  if (selectedGroups.length && selectedPopsStatuses.length) {
    SITES_API_CALL.searchParams.set("group__in", selectedGroups.join(","));
  }
  if (selectedTenants.length) {
    LINKS_API_CALL.searchParams.set("provider__in", selectedTenants.join(","));
  }
  if (selectedFiberLinkStatuses.length) {
    LINKS_API_CALL.searchParams.set("status__in", selectedFiberLinkStatuses.join(","));
  }

  try {
    const [sitesResponse, linksResponse] = await Promise.all([
      fetch(SITES_API_CALL),
      fetch(LINKS_API_CALL)
    ]);

    const sitesData = await sitesResponse.json();
    const linksData = await linksResponse.json();

    allSites = sitesData
    allLinks = linksData

    const centerCoordinates = calculateCenter(sitesData);
    if (!currentCenter) storedMapCenter = centerCoordinates;
    if (!currentZoom) storedZoomLevel = currentZoom;
    map = new google.maps.Map(document.getElementById("map"), {
      center: centerCoordinates,
      zoom: 6,
      mapId: "Netbox_MAP_ID",
    });

    if (currentCenter) {
      map.setCenter(currentCenter);
    }
    if (!selectedFiberLinkStatuses.length) clearDisplayedPolylines();
    if (!selectedTenants.length) clearDisplayedPolylines();
    if (selectedTenants && selectedFiberLinkStatuses) {
      const combinedData = combineData(allLinks, allSites);
      visualizeCombinedData(
        combinedData,
        selectedFiberLinkStatuses,
        selectedTenants
      );
    }
    if (selectedPopsStatuses.length && selectedGroups.length) return addMarkersForFilteredSites(allSites, selectedPopsStatuses, selectedGroups);
    else clearDisplayedMarkers();
  } catch (error) {
    console.error("Error fetching data:", error);
  } finally {
    loader.classList.add("d-none");
    container.style.display = "block";
  }
}

async function initMap() {
  let selectedFiberLinkStatuses = ["active"];
  let selectedPopsStatuses = ["active"];
  let selectedGroups = Array.from(groupSelect.options).map((option) =>
    option.value
  );

  citySelect.addEventListener(
    "change",
    debounce(() => {
      selectedFiberLinkStatuses = ["active"];
      selectedCityIdSites = [];
      if (!citySelect.value) {
        selectedTenants = allVendors.map((vendor) => String(vendor.id));
        Array.from(providerSelect.options).forEach((option) => {
          option.selected = true;
        });
        providerSelect.loadOptions();
        fetchAndCreateMapData(
          selectedPopsStatuses,
          selectedGroups,
          selectedTenants,
          selectedFiberLinkStatuses
        )
      }

      selectedFiberLinkStatuses = ["active"];
      selectedPopsStatuses = ["active"];

      selectedGroups = Array.from(groupSelect.options).map((option) =>
        option.value
      );

      resetSelections([
        { element: fiberLinkSelect, value: "active" },
        { element: popsStatusSelect, value: "active" },
      ]);

      Array.from(groupSelect.options).forEach((option) => {
        option.selected = true;
      });
      if (groupSelect.loadOptions) groupSelect.loadOptions();

      selectedCityId = citySelect.value;
      if (selectedCityId) {
        fetchSitesByRegion(
          selectedCityId,
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
      if (selectedCityId) {
        return fetchSitesByRegion(
          selectedCityId,
          selectedFiberLinkStatuses,
          selectedPopsStatuses,
          selectedGroups
        );
      }
      fetchAndCreateMapData(
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
      if (selectedCityId) {
        return fetchSitesByRegion(
          selectedCityId,
          selectedFiberLinkStatuses,
          selectedPopsStatuses,
          selectedGroups
        );
      }
      fetchAndCreateMapData(
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

      if (selectedCityId) {
        return fetchSitesByRegion(
          selectedCityId,
          selectedFiberLinkStatuses,
          selectedPopsStatuses,
          selectedGroups
        );
      }
      if (!selectedFiberLinkStatuses.length) {
        clearDisplayedPolylines();
        return;
      }
      fetchAndCreateMapData(
        selectedPopsStatuses,
        selectedGroups,
        selectedTenants,
        selectedFiberLinkStatuses
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
      fetchAndCreateMapData(
        selectedPopsStatuses,
        selectedGroups,
        selectedTenants,
        selectedFiberLinkStatuses
      );
    }, 1000)
  );

  exportButton.addEventListener("click", () => {
    exportKML(allSites);
  });

  fetchAndCreateMapData(
    selectedPopsStatuses,
    selectedGroups,
    selectedTenants,
    selectedFiberLinkStatuses
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

function fetchSitesByRegion(
  regionId,
  selectedFiberLinkStatuses,
  selectedPopsStatuses,
  selectedGroups
) {
  const CALL = new URL(baseURL + "/api/dcim/sites/");
  CALL.searchParams.set("region_id", regionId);
  let sites = [];
  let arr = [];

  function fetchPaginatedSites(url) {
    return fetch(url)
      .then((response) => response.json())
      .then((data) => {
        sites = sites.concat(data.results);

        if (data.next) {
          return fetchPaginatedSites(data.next);
        } else {
          selectedCityIdSites = sites;
          return sites;
        }
      })
      .catch((error) => {
        console.error("Error fetching site data:", error);
        return [];
      });
  }

  fetchPaginatedSites(CALL)
    .then((sitesData) => {
      if (!sitesData.length) return [];

      selectedCityIdSites = sitesData;

      const siteCoordinates = sitesData.map((site) => ({
        lat: site.latitude,
        lng: site.longitude,
      }));

      const coordinates = calculateCenterBetweenSites(siteCoordinates);
      if (coordinates) {
        map.setCenter(coordinates);
        map.setZoom(10);
      } else {
        map.setCenter(storedMapCenter);
        map.setZoom(storedZoomLevel);
      }

      clearDisplayedMarkers();

      allLinks.forEach((link) => {
        const { termination_a_site, termination_z_site } = link;
        sitesData.forEach((site) => {
          if (
            site.id === termination_a_site ||
            site.id === termination_z_site
          ) {
            arr.push(link);
          }
        });
      });

      return allSites.filter((site) =>
        sitesData.some((s) => s.id === site.id)
      );
    })
    .then((regionSites) => {
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

      const dropdownDiv = providerSelect.nextSibling;
      if (dropdownDiv && dropdownDiv.refresh) {
        dropdownDiv.refresh();
      }

      const combo = combineData(arr, regionSites);

      if (!arr.length && (!combo || !Object.keys(combo).length)) {
        if (storedMapCenter && storedZoomLevel) {
          map.setCenter(storedMapCenter);
          map.setZoom(storedZoomLevel);
          clearDisplayedPolylines();
          clearDisplayedMarkers();
          return;
        }
      }

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
    })
    .catch((error) => {
      console.error("Error processing site data:", error);
      return [];
    });
}

function addMarkersForFilteredSites(
  sites,
  selectedPopsStatuses,
  selectedGroups
) {
  sites.forEach((site) => {
    let localSelectedGroups = Array.from(groupSelect.selectedOptions).map(
      (option) => option.text.toLowerCase()
    );
    if (
      (!selectedGroups.length || localSelectedGroups.includes(site.group)) &&
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
