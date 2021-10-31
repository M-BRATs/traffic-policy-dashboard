import math
import os
import sys
import urllib.request
from bs4 import BeautifulSoup
from geopy import Nominatim
from functional import seq
from pathlib import Path
import googlemaps
import json
from datetime import datetime
import openrouteservice

ORS_URL = 'https://localhost:8080/ors/v2'

PATH_TO_SCRIPTS = Path(__file__).parent
PATH_TO_ACCESSIBILITY = (PATH_TO_SCRIPTS / "../data/accessibility_very_large.json").resolve()
PATH_TO_GRID = (PATH_TO_SCRIPTS / "../data/grid.json").resolve()


EXT = seq([[48.021621, 11.847382],
           [48.279994, 11.317978],
           [48.021621, 11.847382],
           [48.279994, 11.317978]])
NORTH_WEST = [max(EXT.map(lambda p: p[0])), min(EXT.map(lambda p: p[1]))]
NORTH_EAST = [max(EXT.map(lambda p: p[0])), max(EXT.map(lambda p: p[1]))]
SOUTH_WEST = [min(EXT.map(lambda p: p[0])), min(EXT.map(lambda p: p[1]))]
SOUTH_EAST = [min(EXT.map(lambda p: p[0])), max(EXT.map(lambda p: p[1]))]

MAX_Y_TILES = 200
MAX_X_TILES = 200

def tile_munich():
    y_diff = NORTH_WEST[0] - SOUTH_WEST[0]
    x_diff = NORTH_EAST[1] - NORTH_WEST[1]

    y_inc = y_diff / MAX_Y_TILES
    x_inc = x_diff / MAX_X_TILES

    coords = []
    # row by row
    for row in range(0, MAX_Y_TILES):
        for col in range(0, MAX_X_TILES):
            x = SOUTH_WEST[0] + row * y_inc
            y = SOUTH_WEST[1] + col * x_inc
            coords.append([x, y])

    return coords


def nearest_train_station(origins):
    coordinates = []
    gmaps = googlemaps.Client(key=os.getenv('GMAPS_KEY'))
    for point in origins:
        point_str = f"{point[0]},{point[1]}"
        response = gmaps.places_nearby(
            location=point_str,
            type='train_station',
            rank_by='distance',
        )
        poi = response['results'][0]
        poi_loc = poi['geometry']['location']
        coordinates.append([poi_loc['lat'], poi_loc['lng']])
    return coordinates


def distances_to_transit(origins, destinations):
    gmaps = googlemaps.Client(key=os.getenv('GMAPS_KEY'))
    response = gmaps.distance_matrix(
        origins=origins,
        destinations=destinations,
        mode='walking',
        departure_time='now',
    )
    eoi = [response['rows'][i]['elements'][i]['distance']['value'] for i in range(0, len(origins))]
    return eoi


MARIENPLATZ = [48.137131, 11.575669]
DEPARTURE_TIME = datetime.strptime('Nov 2 2021 12:00PM', '%b %d %Y %I:%M%p')

call_counter = 0


def distance_to_center(origins):
    global call_counter
    # centre_str = f"{MARIENPLATZ},{MARIENPLATZ[1]}"
    gmaps = googlemaps.Client(key=os.getenv('GMAPS_KEY'))
    result = []
    for i in range(0, math.ceil(len(origins) / 25)):
        slice = origins[i * 25:(i + 1) * 25]
        call_counter += 1
        print(call_counter)
        response = gmaps.distance_matrix(
            origins=slice,
            destinations=[MARIENPLATZ],
            mode='transit',
            departure_time=DEPARTURE_TIME,
        )
        eoi = []
        for row in response['rows']:
            if 'duration' in row['elements'][0]:
                eoi.append(row['elements'][0]['duration']['value'])
            else:
                eoi.append(-1)
        result.extend(eoi)
    return result


def swap_lat_lng(location):
    return [location[1], location[0]]


def point_distance(origin, destination):
    # Use ORS API
    client = openrouteservice.Client(base_url='http://localhost:8080/ors')
    origin = swap_lat_lng(origin)
    print(f"{origin[0]},{origin[1]}")
    destination = swap_lat_lng(destination)
    print(f"{destination[0]},{destination[1]}")
    response = client.distance_matrix(
        locations=[origin, destination],
        profile='foot-walking',
        metrics=['duration'],
    )
    return response


def normalize(values):
    max_val = max(values)
    return (seq(values)
            .map(lambda v: v if v < 0 else v / max_val)
            .list())


def split(values, divisions):
    # create copy
    values = values[:]
    pos_values = []
    # retain indices
    for i in range(0, len(values)):
        pos_values.append({'index': i, 'val': values[i] if values[i] >= 0 else sys.maxsize})
    # sort ascending by value
    pos_values.sort(key=lambda d: d['val'])
    size = len(values) / divisions
    result = []
    prev = 0
    # construct divisions
    for i in range(1, divisions + 1):
        end = min(len(values), math.floor(i * size) + 1)
        chunk = [(i - 1) * (1 / (divisions - 1)) for j in range(prev, end)]
        result.extend(chunk)
        prev = end
    # update original elements
    for i, d in enumerate(pos_values):
        values[d['index']] = result[i]
    return values


def to_matrix(values, rows, cols):
    result = []
    for i in range(0, rows):
        result.append(values[cols * i:cols * (i + 1)])
    return result

INTENSITY_DIVISIONS = 11

# run script
if __name__ == '__main__':
    print(os.getenv('GMAPS_KEY'))
    tiles = tile_munich()
    with open(PATH_TO_GRID, 'w') as file:
        json.dump(to_matrix(tiles, MAX_Y_TILES, MAX_X_TILES), file)
    dists_to_centre = distance_to_center(tiles)
    heat = split(dists_to_centre, INTENSITY_DIVISIONS)
    arr = [{'location': tiles[i], 'dist_seconds': dists_to_centre[i], 'intensity': heat[i]} for i in
           range(0, len(tiles))]
    arr = to_matrix(arr, MAX_Y_TILES, MAX_X_TILES)
    with open(PATH_TO_ACCESSIBILITY, 'w') as file:
        json.dump(arr, file)