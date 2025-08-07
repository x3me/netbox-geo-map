function generateKML(locations, links) {
  const filteredLocations = locations.filter(
    (location) =>
      location.latitude !== 0 &&
      location.longitude !== 0 &&
      location.latitude !== null &&
      location.longitude !== null
  );

  function getIconHref(group) {
    switch (group) {
      case "access": return "http://maps.google.com/mapfiles/kml/paddle/ylw-circle.png";
      case "core": return "http://maps.google.com/mapfiles/kml/paddle/red-circle.png";
      case "distribution": return "http://maps.google.com/mapfiles/kml/paddle/purple-circle.png";
      case "pit": return "http://maps.google.com/mapfiles/kml/paddle/grn-circle.png";
      case "warehouse": return "http://maps.google.com/mapfiles/kml/paddle/blu-circle.png";
      default: return "http://maps.google.com/mapfiles/kml/paddle/wht-circle.png";
    }
  }

  function getLineStyleByStatus(status, colorHex) {
    const defaultColor = convertColorToKML(colorHex || "#000000");

    switch (status) {
      case "planned":
        return {
          color: defaultColor,
          width: 3,
        };
      default:
        return {
          color: defaultColor,
          width: 1,
        };
    }
  }

  const pointPlacemarks = filteredLocations.map((location) => {
    const iconHref = getIconHref(location.group);
    return `<Placemark>
      <name>${location.name}</name>
      <Style>
        <IconStyle>
          <Icon>
            <href>${iconHref}</href>
            <scale>0.3</scale>
          </Icon>
        </IconStyle>
      </Style>
      <Point>
        <coordinates>${location.longitude},${location.latitude}</coordinates>
      </Point>
    </Placemark>`;
  });

  const polylinePlacemarks = links
    .map((link) => {
      const siteA = locations.find((site) => site.id === link.termination_a_site);
      const siteZ = locations.find((site) => site.id === link.termination_z_site);
      if (!siteA || !siteZ) return null;

      const style = getLineStyleByStatus(link.status, link.provider_color);

      return `<Placemark>
  <name>Link ${link.id || "?"} (${link.status || "unknown"})</name>
  <description><![CDATA[
    Fiber link: ${link.status}<br/>
    A → Z: ${siteA.name} → ${siteZ.name}
  ]]></description>
  <Style>
    <LineStyle>
      <color>${style.color}</color>
      <width>${style.width}</width>
    </LineStyle>
  </Style>
  <LineString>
    <tessellate>1</tessellate>
    <coordinates>
      ${siteA.longitude},${siteA.latitude},0
      ${siteZ.longitude},${siteZ.latitude},0
    </coordinates>
  </LineString>
</Placemark>`;

    })
    .filter(Boolean);

  return `<?xml version="1.0" encoding="UTF-8"?>
  <kml xmlns="http://www.opengis.net/kml/2.2">
    <Document>
      ${pointPlacemarks.join("")}
      ${polylinePlacemarks.join("")}
    </Document>
  </kml>`;
}

function convertColorToKML(hex) {
  const hexClean = hex.replace("#", "");
  if (hexClean.length !== 6) return "ff0000ff";
  const r = hexClean.slice(0, 2);
  const g = hexClean.slice(2, 4);
  const b = hexClean.slice(4, 6);
  return `ff${b}${g}${r}`;
}


function exportKML(allSites, allLinks) {
  const kmlContent = generateKML(allSites, allLinks);
  const blob = new Blob([kmlContent], {
    type: "application/vnd.google-earth.kml+xml",
  });
  const blobUrl = URL.createObjectURL(blob);
  const downloadLink = document.createElement("a");
  downloadLink.href = blobUrl;
  downloadLink.download = "pops.kml";
  downloadLink.click();
  URL.revokeObjectURL(blobUrl);
  downloadLink.remove();
}