console.log(accMatrix)

let map = new google.maps.Map(
    document.getElementById("map"), {
        center: {lng: 11.613991700121016, lat:  48.2296360767711},
        zoom: 8,
    }
);

function pickHex(weight) {
    if (weight <= 0.5) {
        weight *= 2;
        return [255 , 255 *  weight, 0]
    } else {
        weight -= 0.5;
        weight *= 2;
        return [255 * (1 - weight), 255,0]
    }
}

const RED = [255,0,0];
const YELLOW = [255,255,0];
const GREEN = [0,255,0];
for (let i = 0; i < accMatrix.length - 1; i++) {
    for (let j = 1; j < accMatrix.length; j++) {
        let ne = accMatrix[i][j];
        let sw = accMatrix[i + 1][j - 1];
        const ne_loc = ne.location;
        const sw_loc = sw.location;
        const color = pickHex( 1- ne.intensity)
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