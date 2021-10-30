console.log(accMatrix)

let map = new google.maps.Map(
    document.getElementById("map"), {
        center: {lng: 11.613991700121016, lat: 48.2296360767711},
        zoom: 8,
    }
);

function pickHex(weight) {
    weight = 1 - weight;
    if (weight <= 0.5) {
        weight *= 2;
        return [255, 255 * weight, 0]
    } else {
        weight -= 0.5;
        weight *= 2;
        return [255 * (1 - weight), 255, 0]
    }
}

const RED = [255, 0, 0];
const YELLOW = [255, 255, 0];
const GREEN = [0, 255, 0];
for (let i = 0; i < accMatrix.length - 1; i++) {
    for (let j = 1; j < accMatrix.length; j++) {
        let ne = accMatrix[i][j];
        let nw = accMatrix[i][j - 1];
        let se = accMatrix[i + 1][j];
        let sw = accMatrix[i + 1][j - 1];
        const ne_loc = ne.location;
        const sw_loc = sw.location;
        const avgIntensity = (nw.intensity + ne.intensity + se.intensity + sw.intensity) / 4;
        const color = pickHex(avgIntensity)
        const rectangleOptions = {
            bounds: new google.maps.LatLngBounds(
                new google.maps.LatLng(sw_loc[0], sw_loc[1]),
                new google.maps.LatLng(ne_loc[0], ne_loc[1]),
            ),
            fillColor: "rgb(" + color[0] + "," + color[1] + "," + color[2] + ")",
            fillOpacity: 0.4,
            strokeOpacity: 0,
            map: map,
        }
        const newRectangle = new google.maps.Rectangle(rectangleOptions);
    }
}

const MONTH = 1;
const DAY_OF_WEEK = 7;
const HOUR = 8;

const LOC = new google.maps.LatLng(48.2296360767711, 11.613991700121016)
const IS_ROUTE = false;
const IS_PLACE = true;
const RADIUS = 1000;


const directionsService = new google.maps.DirectionsService()
const directionsRenderer = new google.maps.DirectionsRenderer()
directionsRenderer.setMap(map);
directionsService.route({
    origin: 'Innsbrucker Ring München',
    destination: 'Garching bei München',
    travelMode: google.maps.TravelMode.DRIVING,
}, (result) => {
    console.log(result);
    directionsRenderer.setDirections(result);
    const path = google.maps.geometry.encoding.decodePath(result.routes[0].overview_polyline)
    const polyline = new google.maps.Polyline({path: path});
    let safetyscore = 0;
    for (const accident of accidents) {
        const lat = parseFloat(accident['YGCSWGS84'].replace(',', '.'))
        const lng = parseFloat(accident['XGCSWGS84'].replace(',', '.'))
        const month = parseInt(accident['UMONAT']);
        const dayOfWeek = parseInt(accident['UWOCHENTAG']);
        const hour = parseInt(accident['USTUNDE']);
        const accidentLoc = new google.maps.LatLng(lat, lng);
        console.log(google.maps.geometry.spherical.computeDistanceBetween(accidentLoc, LOC))
        if (//month === MONTH &&
            //dayOfWeek === DAY_OF_WEEK &&
            //hour === HOUR &&
            ((IS_ROUTE &&
                google.maps.geometry.poly.isLocationOnEdge(accidentLoc, polyline, 0.0004)) ||
            (IS_PLACE && google.maps.geometry.spherical.computeDistanceBetween (accidentLoc, LOC) <= RADIUS))) {
            new google.maps.Marker({
                position: accidentLoc,
                map: map,
            });
            safetyscore += 4 - parseInt(accident['UKATEGORIE']);
        }
    }
    const length = result.routes[0].legs[0].distance.value / 1000;
    safetyscore /= length;
    console.log(safetyscore);
})