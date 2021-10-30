import { Component, OnDestroy, OnInit } from '@angular/core';
import { Loader } from '@googlemaps/js-api-loader';
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
export class HomePage implements OnInit, OnDestroy{
  // google maps zoom level
  zoom = 11;
  hotspots = wifiObjects;
  accessibility = accessibility;
  colorAccessibility = '#219653';
  radiusAccessibility = '50';
  rectangleSet = [];
  // private heatmapAcc: google.maps.visualization.HeatmapLayer = null;
  // private map;


  // initial center position for the map
  lat = 48.1351;
  lng = 11.5820;

  selectedLayer = 'accessibility';

  poiMap: google.maps.Map;
  accessibilityMap: google.maps.Map;
  wifiMap: google.maps.Map;
  airMap: google.maps.Map;

  departure: string;
  destination: string;

  routeForm: FormGroup;


  routeTolerance: number = 0.0004;
  placeRadius: number = 250;

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
      // this.map = new google.maps.Map(document.getElementById('map') as HTMLElement, {
      //   center: { lat: this.lat, lng: this.lng },
      //   zoom: this.zoom,
      // });

      this.accessibilityMap = new google.maps.Map(document.getElementById('accessibilityMap') as HTMLElement, {
        center: { lat: this.lat, lng: this.lng },
        zoom: this.zoom,
      });
      this.createAccessibilityLayer();

      this.wifiMap = new google.maps.Map(document.getElementById('wifiMap') as HTMLElement, {
        center: { lat: this.lat, lng: this.lng },
        zoom: this.zoom,
      });

      this.airMap = new google.maps.Map(document.getElementById('airMap') as HTMLElement, {
        center: { lat: this.lat, lng: this.lng },
        zoom: this.zoom,
      });
      this.initializeWifiMap();
      this.initializeAirMap();

      this.poiMap = new google.maps.Map(document.getElementById('poiMap') as HTMLElement, {
        center: { lat: this.lat, lng: this.lng },
        zoom: this.zoom,
      });
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
  }

  selectLayer($event) {
    this.selectedLayer = $event.target.value;
  }

  displayRoute() {
    let origin : string = this.routeForm.get('start').value;
    let destination : string = this.routeForm.get('destination').value;
    if(!origin.includes('München')) origin += ' München';
    if(!destination.includes('München')) destination += ' München';
    const filter = {
      // filter by month, day of week, etc...
    }
    const gmaps = google.maps;

    const directionService = new gmaps.DirectionsService();
    const directionRenderer = new gmaps.DirectionsRenderer();
    directionRenderer.setMap(this.poiMap);

    directionService.route({
      origin,
      destination,
      travelMode: gmaps.TravelMode.DRIVING,
    }, (result) => {
      directionRenderer.setDirections(result);
      const path = gmaps.geometry.encoding.decodePath(result.routes[0].overview_polyline);
      const polyline = new gmaps.Polyline({path});

      // Check for accidents on route
      for (const accident of accidents) {
        const lat = parseFloat(accident['YGCSWGS84'].replace(',', '.'));
        const lng = parseFloat(accident['XGCSWGS84'].replace(',', '.'));
        const month = parseInt(accident['UMONAT']);
        const dayOfWeek = parseInt(accident['UWOCHENTAG']);
        const hour = parseInt(accident['USTUNDE']);
        const location = new gmaps.LatLng(lat, lng);

        if (gmaps.geometry.poly.isLocationOnEdge(location, polyline, this.routeTolerance)) {
          this.createAccidentMarker(location);
        }
      }

      for (const wifiHotspot of wifiObjects) {
        const location = new gmaps.LatLng(wifiHotspot)
        if (gmaps.geometry.poly.isLocationOnEdge(location, polyline, this.routeTolerance)) {
          this.createWifiMarker(location);
        }
      }
    });
  }

  private createAccidentMarker(location) {
    new google.maps.Circle({
        strokeColor: 'red',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: 'red',
        fillOpacity: 0.35,
        map: this.poiMap,
        center: location,
        radius: 10,
      });
  }

  private createWifiMarker(location : google.maps.LatLng) {
    const circle = new google.maps.Circle({
        strokeColor: 'blue',
        strokeOpacity: 0.5,
        strokeWeight: 2,
        fillColor: 'blue',
        fillOpacity: 0.35,
        map: this.poiMap,
        center: location,
        radius: 100,
      });
  }

  showPlacePois() {
    console.log(this.placeForm.get('place').value);
  }

  private createAccessibilityLayer() {
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
    weight = 1 - weight;
    if (weight <= 0.5) {
      weight *= 2;
      return [255, 255 * weight, 0];
    } else {
      weight -= 0.5;
      weight *= 2;
      return [255 * (1 - weight), 255, 0];
    }
  }

  private initializeWifiMap() {
    for (const data of wifiObjects) {
      const pos = {lat: data.lat, lng: data.lng};
      const circle = new google.maps.Circle({
        strokeColor: 'red',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: 'red',
        fillOpacity: 0.35,
        map: this.wifiMap,
        center: pos,
        radius: 100,
      });
    }
  }

  private initializeAirMap() {
    for (const data of aqi) {
      const pos = {lat: parseFloat(data.lat), lng: parseFloat(data.lon)};
      const circle = new google.maps.Circle({
        strokeColor: this.translateValueIntoColor(Math.max(parseFloat(data.pm10), parseFloat(data.o3 ? data.o3 : '0'), parseFloat(data.no2 ? data.no2 : '0'), parseFloat(data.pm25 ? data.pm25 : '0'))),
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: this.translateValueIntoColor(Math.max(parseFloat(data.pm10), parseFloat(data.o3 ? data.o3 : '0'), parseFloat(data.no2 ? data.no2 : '0'), parseFloat(data.pm25 ? data.pm25 : '0'))),
        fillOpacity: 0.35,
        map: this.airMap,
        center: pos,
        radius: 2500,
      });
    }
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

  translateValueIntoColor(value: number) {
    if (value <= 50) {
      return 'green'
    }
    if (value <= 100) {
      return 'greenyellow'
    }
    if (value <= 200) {
      return 'yellow'
    }
    if (value <= 300) {
      return 'orange'
    }
    if (value <= 400) {
      return 'red'
    }
    return 'darkred'
  }

  get poiLayerActive() {
    return this.selectedLayer === 'poi';
  }
}
