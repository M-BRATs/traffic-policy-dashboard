import {Component, OnDestroy, OnInit} from '@angular/core';
import {Loader} from '@googlemaps/js-api-loader';
import wifiObjects from '../../data/wifi_objects.json';
import accessibility from '../../data/accessibility.json';
import accidents from '../../data/accidents.json';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import aqi from '../../data/aqi.json';
import {min} from "rxjs/operators";

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit, OnDestroy {
  // google maps zoom level
  zoom = 12;
  hotspots = wifiObjects;
  accessibility = accessibility;

  // initial center position for the map
  lat = 48.1351;
  lng = 11.5820;

  selectedLayer = 'poi';
  selectedAQI = null;

  modeOfTransport = 'bike';

  poiMap: google.maps.Map;
  accessibilityMap: google.maps.Map;
  wifiMap: google.maps.Map;
  airMap: google.maps.Map;

  directionService: google.maps.DirectionsService;
  directionRenderer: google.maps.DirectionsRenderer;
  wifiPois: google.maps.Circle[] = [];
  accidentPois: google.maps.Circle[] = [];
  placeMarker: google.maps.Marker;

  routeForm: FormGroup;
  placeForm: FormGroup;

  routeToleranceAccidents = 0.0002;
  routeToleranceWifi = 0.0009;
  placeRadius = 250;

  poiLightInjuryStat;
  poiSevereInjuryStat;
  poiDeathStat;
  poiWifiStat;
  wifiStat;
  accessibilityStat;
  routeDistanceStat;
  routeDurationStat;
  routeSafetyStat;

  constructor() {

  }

  ngOnDestroy(): void {

  }

  ngOnInit(): void {
    const loader = new Loader({
      apiKey: 'AIzaSyAF7D4-rsvOHRzDm-vbj9nLo5jFwW6BWD0',
      version: 'weekly',
    });

    loader.load().then(() => {
      this.directionService = new google.maps.DirectionsService();
      this.directionRenderer = new google.maps.DirectionsRenderer();

      this.accessibilityMap = new google.maps.Map(document.getElementById('accessibilityMap') as HTMLElement, {
        center: {lat: this.lat, lng: this.lng},
        zoom: this.zoom,
        streetViewControl: false,
      });

      this.wifiMap = new google.maps.Map(document.getElementById('wifiMap') as HTMLElement, {
        center: {lat: this.lat, lng: this.lng},
        zoom: this.zoom,
        streetViewControl: false,
      });

      this.airMap = new google.maps.Map(document.getElementById('airMap') as HTMLElement, {
        center: {lat: this.lat, lng: this.lng},
        zoom: this.zoom,
        streetViewControl: false,
      });

      this.poiMap = new google.maps.Map(document.getElementById('poiMap') as HTMLElement, {
        center: {lat: this.lat, lng: this.lng},
        zoom: this.zoom,
        streetViewControl: false,
      });

      this.directionRenderer.setMap(this.poiMap);

      this.initializeWifiMap();
      this.initializeAccessibilityLayer();
      this.initializeAirMap();
    });

    this.routeForm = new FormGroup({
      start: new FormControl(null, {
        updateOn: 'change',
        validators: [Validators.required],
      }),
      destination: new FormControl(null, {
        updateOn: 'change',
        validators: [Validators.required],
      }),
    });

    this.placeForm = new FormGroup({
      place: new FormControl(null, {
        updateOn: 'change',
        validators: [Validators.required],
      })
    });

    this.wifiStat = wifiObjects.length;
  }

  selectLayer($event) {
    this.selectedLayer = $event.target.value;
  }

  selectModeOfTransport($event) {
    this.modeOfTransport = $event.target.value;
  }

  displayRoute() {
    this.clearPois();

    let origin: string = this.routeForm.get('start').value;
    let destination: string = this.routeForm.get('destination').value;
    if (!origin.includes('München')) origin += ' München';
    if (!destination.includes('München')) destination += ' München';
    const filter = {
      // filter by month, day of week, etc...
    }
    const gmaps = google.maps;

    let travelMode: google.maps.TravelMode;
    if (this.modeOfTransport === 'bike') {
      travelMode = gmaps.TravelMode.BICYCLING;
    } else if (this.modeOfTransport === 'car') {
      travelMode = gmaps.TravelMode.DRIVING;
    } else {
      travelMode = gmaps.TravelMode.WALKING;
    }

    this.directionService.route({
      origin,
      destination,
      travelMode,
    }, (result) => {
      this.directionRenderer.setDirections(result);
      const path = gmaps.geometry.encoding.decodePath(result.routes[0].overview_polyline);
      const polyline = new gmaps.Polyline({path});

      let safetyscore = 0;
      let length = result.routes[0].legs[0].distance.value;
      let distanceText = result.routes[0].legs[0].distance.text;
      let durationText = result.routes[0].legs[0].duration.text;

      this.routeDistanceStat = distanceText;
      this.routeDurationStat = durationText;

      let lightInjuries = 0;
      let severeInjuries = 0;
      let deaths = 0;

      // Check for accidents on route
      for (const accident of accidents) {
        const lat = parseFloat(accident['YGCSWGS84'].replace(',', '.'));
        const lng = parseFloat(accident['XGCSWGS84'].replace(',', '.'));
        const month = parseInt(accident['UMONAT']);
        const dayOfWeek = parseInt(accident['UWOCHENTAG']);
        const hour = parseInt(accident['USTUNDE']);
        const category = parseInt(accident['UKATEGORIE']);
        const location = new gmaps.LatLng(lat, lng);

        if (gmaps.geometry.poly.isLocationOnEdge(location, polyline, this.routeToleranceAccidents)) {
          safetyscore += 4 - category;
          switch (category) {
            case 1:
              deaths++;
              break;
            case 2:
              severeInjuries++;
              break;
            case 3:
              lightInjuries++;
              break;
          }
          this.accidentPois.push(this.createAccidentMarker(location, category));
        }
      }

      this.poiLightInjuryStat = lightInjuries;
      this.poiSevereInjuryStat = severeInjuries;
      this.poiDeathStat = deaths;

      safetyscore /= length;
      safetyscore *= 1000;
      this.routeSafetyStat = safetyscore;

      let wifiHotspots = 0;

      for (const wifiHotspot of wifiObjects) {
        const location = new gmaps.LatLng(wifiHotspot);
        if (gmaps.geometry.poly.isLocationOnEdge(location, polyline, this.routeToleranceWifi)) {
          wifiHotspots++;
          this.wifiPois.push(this.createWifiMarker(location, this.poiMap));
        }
      }

      this.poiWifiStat = wifiHotspots;
    });
  }

  showPlacePois() {
    this.clearPois();
    this.selectedLayer = 'poi';

    let place = this.placeForm.get('place').value;
    if (!place.includes('München')) place += ' München';
    const gmaps = google.maps;

    const geocoder = new gmaps.Geocoder();
    geocoder.geocode({'address': place}, (results, status) => {
      if (status === 'OK') {
        place = results[0].geometry.location;

        this.poiMap.setCenter(place);
        this.poiMap.setZoom(18);

        this.placeMarker = new google.maps.Marker({
          position: place,
          map: this.poiMap,
          title: results[0].formatted_address,
        });

        let lightInjuries = 0;
        let severeInjuries = 0;
        let deaths = 0;

        // Check for accidents in vicinity
        for (const accident of accidents) {
          const lat = parseFloat(accident['YGCSWGS84'].replace(',', '.'));
          const lng = parseFloat(accident['XGCSWGS84'].replace(',', '.'));
          const month = parseInt(accident['UMONAT']);
          const dayOfWeek = parseInt(accident['UWOCHENTAG']);
          const hour = parseInt(accident['USTUNDE']);
          const category = parseInt(accident['UKATEGORIE']);
          const location = new gmaps.LatLng(lat, lng);

          if (gmaps.geometry.spherical.computeDistanceBetween(location, place) <= this.placeRadius) {
            switch (category) {
              case 1:
                deaths++;
                break;
              case 2:
                severeInjuries++;
                break;
              case 3:
                lightInjuries++;
                break;
            }
            this.accidentPois.push(this.createAccidentMarker(location, category));
          }
        }

        this.poiLightInjuryStat = lightInjuries;
        this.poiSevereInjuryStat = severeInjuries;
        this.poiDeathStat = deaths;

        let wifiHotspots = 0;

        for (const wifiHotspot of wifiObjects) {
          const location = new gmaps.LatLng(wifiHotspot);
          if (gmaps.geometry.spherical.computeDistanceBetween(location, place) <= this.placeRadius) {
            wifiHotspots++;
            this.wifiPois.push(this.createWifiMarker(location, this.poiMap));
          }
        }

        this.poiWifiStat = wifiHotspots;
      }
    });
  }

  private clearPois() {
    if (this.placeMarker) {
      this.poiMap.setZoom(this.zoom);
      this.placeMarker.setMap(null);
    }

    for (const wifiCircle of this.wifiPois) {
      wifiCircle.setMap(null);
    }

    for (const accidentCircle of this.accidentPois) {
      accidentCircle.setMap(null);
    }

    this.placeMarker = null;
    this.wifiPois = [];
    this.accidentPois = [];
  }

  private createAccidentMarker(location, category = 1) {
    let fillColor;
    switch (category) {
      case 1:
        fillColor = 'red';
        break;
      case 2:
        fillColor = 'orangered';
        break;
      case 3:
        fillColor = 'orange';
        break;
    }
    return new google.maps.Circle({
      strokeColor: fillColor,
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor,
      fillOpacity: 0.35,
      map: this.poiMap,
      center: location,
      radius: 10,
    });
  }

  private createWifiMarker(location: google.maps.LatLng, map: google.maps.Map) {
    return new google.maps.Circle({
      strokeColor: 'deepskyblue',
      strokeOpacity: 0.5,
      strokeWeight: 2,
      fillColor: 'DeepSkyBlue',
      fillOpacity: 0.35,
      map,
      center: location,
      radius: 100,
    });
  }


  private initializeAccessibilityLayer() {
    for (let i = 0; i < this.accessibility.length - 1; ++i) {
      for (let k = 1; k < this.accessibility[i].length; ++k) {
        const northEast = this.accessibility[i][k];
        const northWest = this.accessibility[i][k - 1];
        const southEast = this.accessibility[i + 1][k];
        const southWest = this.accessibility[i + 1][k - 1];
        const avgIntensity = (northEast.intensity + northWest.intensity + southEast.intensity + southWest.intensity) / 4;
        const color = this.pickHex(avgIntensity);
        const rectangleOptions = {
          clickable: true,
          strokeOpacity: 0,
          fillColor: 'rgb(' + color[0] + ',' + color[1] + ',' + color[2] + ')',
          fillOpacity: 0.4,
          bounds: new google.maps.LatLngBounds(
            new google.maps.LatLng(southWest.location[0], southWest.location[1]),
            new google.maps.LatLng(northEast.location[0], northEast.location[1]),
          ),
          map: this.accessibilityMap
        };
        const newRectangle = new google.maps.Rectangle(rectangleOptions);
        newRectangle.addListener('click', (event) => {
          let seconds = northEast.dist_seconds;
          if (seconds === -1) {
            this.accessibilityStat = "No Route";
          } else {
            const hours = Math.floor(seconds / 3600);
            seconds -= hours * 3600;
            const minutes = Math.floor(seconds / 60);
            seconds -= minutes * 60;
            this.accessibilityStat = hours + "h " + minutes + "m";
          }
        });
      }
    }
  }

  private pickHex(weight: number) {
    const split = 0.6;
    weight = 1 - weight;
    if (weight <= split) {
      weight *= (1 / split);
      return [255, 255 * weight, 0];
    } else {
      weight -= split;
      weight *= (1 / split);
      return [255 * (1 - weight), 255 - 75 * (weight), 0];
    }
  }

  private initializeWifiMap() {
    this.wifiStat = this.hotspots.length;
    for (const hotspot of this.hotspots) {
      const pos = new google.maps.LatLng(hotspot.lat, hotspot.lng);
      this.createWifiMarker(pos, this.wifiMap);
    }
  }

  private initializeAirMap() {
    for (const data of aqi) {
      const pos = {lat: parseFloat(data.lat), lng: parseFloat(data.lon)};
      const maxValue = Math.max(
        parseFloat(data.pm10),
        parseFloat(data.o3 ? data.o3 : '0'),
        parseFloat(data.no2 ? data.no2 : '0'),
        parseFloat(data.pm25 ? data.pm25 : '0')
      );
      const color = this.translateAirQualityValueIntoColor(maxValue);
      const circle = new google.maps.Circle({
        strokeColor: color,
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: color,
        fillOpacity: 0.35,
        map: this.airMap,
        center: pos,
        radius: 625,
        clickable: true,
      });
      circle.addListener('click', (event) => {
        this.selectedAQI = data;
      });
    }
  }

  private translateAirQualityValueIntoColor(value: number) {
    if (value <= 50) {
      return 'green';
    }
    if (value <= 100) {
      return 'yellow';
    }
    if (value <= 200) {
      return 'orange';
    }
    if (value <= 300) {
      return 'red';
    }
    if (value <= 400) {
      return 'darkred';
    }
    return 'black';
  }

  get wifiLayerActive() {
    return this.selectedLayer === 'wifi';
  }

  get safetyLayerActive() {
    return this.selectedLayer === 'safety';
  }

  get accessibilityLayerActive() {
    return this.selectedLayer === 'accessibility';
  }

  get airLayerActive() {
    return this.selectedLayer === 'air';
  }

  get poiLayerActive() {
    return this.selectedLayer === 'poi';
  }

  get routeActive() {
    return this.directionRenderer != null && this.directionRenderer.getDirections() != null
  }

  get placeActive() {
    return this.placeMarker != null;
  }

  get pm25Active() {
    return this.selectedAQI != null && 'pm25' in this.selectedAQI;
  }

  get pm10Active() {
    return this.selectedAQI != null && 'pm10' in this.selectedAQI;
  }

  get pm1Active() {
    return this.selectedAQI != null && 'pm1' in this.selectedAQI;
  }

  get o3Active() {
    return this.selectedAQI != null && 'o3' in this.selectedAQI;
  }

  get no2Active() {
    return this.selectedAQI != null && 'no2' in this.selectedAQI;
  }
}
