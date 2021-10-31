import {Component, OnDestroy, OnInit} from '@angular/core';
import {Loader} from '@googlemaps/js-api-loader';
import wifiObjects from '../../data/wifi_objects.json';
import accessibility from '../../data/accessibility.json';
import accidents from '../../data/accidents.json';
import {initialize} from '@ionic/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import aqi from '../..//data/aqi.json';

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

  selectedLayer = 'accessibility';

  poiMap: google.maps.Map;
  accessibilityMap: google.maps.Map;
  wifiMap: google.maps.Map;
  airMap: google.maps.Map;

  directionService: google.maps.DirectionsService;
  directionRenderer: google.maps.DirectionsRenderer;
  wifiPois: google.maps.Circle[] = [];
  accidentPois: google.maps.Circle[] = [];

  routeForm: FormGroup;
  placeForm: FormGroup;

  routeTolerance = 0.0004;
  placeRadius = 250;

  wifiStat;
  airStat;
  safetyStat;
  accStat = 20;
  poiStat = 15; //TODO: safetyScore

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
        center: { lat: this.lat, lng: this.lng },
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
    this.accStat = accessibility.length;
    this.airStat = "Perfect"
  }

  selectLayer($event) {
    this.selectedLayer = $event.target.value;
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

    this.directionService.route({
      origin,
      destination,
      travelMode: gmaps.TravelMode.DRIVING,
    }, (result) => {
      this.directionRenderer.setDirections(result);
      const path = gmaps.geometry.encoding.decodePath(result.routes[0].overview_polyline);
      const polyline = new gmaps.Polyline({path});

      // Check for accidents on route
      for (const accident of accidents) {
        const lat = parseFloat(accident['YGCSWGS84'].replace(',', '.'));
        const lng = parseFloat(accident['XGCSWGS84'].replace(',', '.'));
        const month = parseInt(accident['UMONAT']);
        const dayOfWeek = parseInt(accident['UWOCHENTAG']);
        const hour = parseInt(accident['USTUNDE']);
        const category = parseInt(accident['UKATEGORIE']);
        const location = new gmaps.LatLng(lat, lng);

        if (gmaps.geometry.poly.isLocationOnEdge(location, polyline, this.routeTolerance)) {
          this.accidentPois.push(this.createAccidentMarker(location, category));
        }
      }

      for (const wifiHotspot of wifiObjects) {
        const location = new gmaps.LatLng(wifiHotspot);
        if (gmaps.geometry.poly.isLocationOnEdge(location, polyline, this.routeTolerance)) {
          this.wifiPois.push(this.createWifiMarker(location, this.poiMap));
        }
      }
    });
  }

  showPlacePois() {
    this.clearPois();

    let place = this.placeForm.get('place').value;
    if (!place.includes('München')) place += ' München';
    const gmaps = google.maps;

    const geocoder = new gmaps.Geocoder();
    geocoder.geocode({'address': place}, (results, status) => {
      if (status === 'OK') {
        place = results[0].geometry.location;
        // Check for accidents on route
        for (const accident of accidents) {
          const lat = parseFloat(accident['YGCSWGS84'].replace(',', '.'));
          const lng = parseFloat(accident['XGCSWGS84'].replace(',', '.'));
          const month = parseInt(accident['UMONAT']);
          const dayOfWeek = parseInt(accident['UWOCHENTAG']);
          const hour = parseInt(accident['USTUNDE']);
          const category = parseInt(accident['UKATEGORIE']);
          const location = new gmaps.LatLng(lat, lng);

          if (gmaps.geometry.spherical.computeDistanceBetween(location, place) <= this.placeRadius) {
            this.accidentPois.push(this.createAccidentMarker(location, category));
          }
        }

        for (const wifiHotspot of wifiObjects) {
          const location = new gmaps.LatLng(wifiHotspot);
          if (gmaps.geometry.spherical.computeDistanceBetween(location, place) <= this.placeRadius) {
            this.wifiPois.push(this.createWifiMarker(location, this.poiMap));
          }
        }
      }
    });
  }

  private clearPois() {
    for (const wifiCircle of this.wifiPois) {
      wifiCircle.setMap(null);
    }

    for (const accidentCircle of this.accidentPois) {
      accidentCircle.setMap(null);
    }

    this.wifiPois = [];
    this.accidentPois = [];
  }

  private createAccidentMarker(location, category = 1) {
    let fillColor;
    switch (category) {
      case 1: fillColor = 'red'; break;
      case 2: fillColor = 'orangered'; break;
      case 3: fillColor = 'orange'; break;
    }
    return new google.maps.Circle({
      strokeColor:  fillColor,
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: fillColor,
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
        map: map,
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
      new google.maps.Circle({
        strokeColor: color,
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: color,
        fillOpacity: 0.35,
        map: this.airMap,
        center: pos,
        radius: 2500,
      });
    }
  }

  private translateAirQualityValueIntoColor(value: number) {
    if (value <= 50) {
      return 'green';
    }
    if (value <= 100) {
      return 'yellowgreen';
    }
    if (value <= 200) {
      return 'yellow';
    }
    if (value <= 300) {
      return 'orange';
    }
    if (value <= 400) {
      return 'red';
    }
    return 'darkred';
  }

  get dataLoaded() {
    return this.hotspots != null && this.accessibility != null;
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
}
