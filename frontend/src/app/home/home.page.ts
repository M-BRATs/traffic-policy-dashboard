import { Component, OnDestroy, OnInit } from '@angular/core';
import { Loader } from '@googlemaps/js-api-loader';
import wifiObjects from '../../data/wifi_objects.json';
import accessibility from '../../data/accessibility.json';
import { initialize } from '@ionic/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import aqi from "../../../../backend/data/aqi.json"

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

      this.poiMap = new google.maps.Map(document.getElementById('accessibilityMap') as HTMLElement, {
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
  }

  selectLayer($event) {
    this.selectedLayer = $event.target.value;
  }

  displayRoute() {
    console.log(this.routeForm.get('start').value);
    console.log(this.routeForm.get('destination').value);
  }

  private createAccessibilityLayer() {
    for (let i = 0; i < this.accessibility.length -1; ++i) {
        for (let k = 1; k < this.accessibility[i].length; ++k) {
          const northEast = this.accessibility[i][k];
          const northWest = this.accessibility[i][k-1];
          const southEast = this.accessibility[i+1][k];
          const southWest = this.accessibility[i+1][k-1];
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

  // public onMapLoad(mapInstance: google.maps.Map) {
  //   this.map = mapInstance;
  //   var heatmapData = [];
  //   for (let entry of this.accessbility) {
  //     heatmapData.push({location: new google.maps.LatLng(entry.location[0], entry.location[1]), weight: 1-entry.intensity})
  //   }

  //   this.heatmapAcc = new google.maps.visualization.HeatmapLayer({
  //     map: mapInstance,
  //     data: heatmapData,
  //     radius: 20
  //   });

  //   google.maps.event.addListener(mapInstance, 'zoom_changed', function () {
  //     this.heatmap.setOptions({radius: Math.floor(100*10)});
  //   });
  // }

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
        strokeColor: this.translateValueIntoColor(Math.max(parseFloat(data.pm10), parseFloat(data.o3 ? data.o3 : "0"), parseFloat(data.no2 ? data.no2 : "0"), parseFloat(data.pm25 ? data.pm25 : "0"))),
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: this.translateValueIntoColor(Math.max(parseFloat(data.pm10), parseFloat(data.o3 ? data.o3 : "0"), parseFloat(data.no2 ? data.no2 : "0"), parseFloat(data.pm25 ? data.pm25 : "0"))),
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
      return "green"
    }
    if (value <= 100) {
      return "greenyellow"
    }
    if (value <= 200) {
      return "yellow"
    }
    if (value <= 300) {
      return "orange"
    }
    if (value <= 400) {
      return "red"
    }
    return "darkred"
  }
}
