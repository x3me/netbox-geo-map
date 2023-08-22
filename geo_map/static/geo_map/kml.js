function generateKML(locations) {

    const filteredLocations = locations.filter(location => location.group === 'pit');

    const placemarks = filteredLocations.map((location) => {
        return `<Placemark><name>${location.name}</name><Style><IconStyle><Icon><href>http://maps.google.com/mapfiles/kml/paddle/grn-circle.png</href><scale>0.3</scale></Icon></IconStyle></Style><Point><coordinates>${location.longitude},${location.latitude}</coordinates></Point></Placemark>`
    });
    return `<?xml version="1.0" encoding="UTF-8"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document>${placemarks.join('')}</Document></kml>`;
}

function exportKML() {
    const kmlContent = generateKML(allSites);
    const blob = new Blob([kmlContent], { type: 'application/vnd.google-earth.kml+xml' });
    const blobUrl = URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');
    downloadLink.href = blobUrl;
    downloadLink.download = 'pops.kml';
    downloadLink.click();
    URL.revokeObjectURL(blobUrl);
  }
