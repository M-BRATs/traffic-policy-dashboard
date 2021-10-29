import os
import urllib.request
from bs4 import BeautifulSoup
from geopy import Nominatim
from functional import seq
from pathlib import Path
import googlemaps
import json
from datetime import datetime


EXT = seq([[48.248187866242496, 11.500626523398886],
           [48.159406204100904, 11.362610772210829],
           [48.06266997152855, 11.504746396568677],
           [48.13649938883739, 11.721726383511097]])
NORTH_WEST = [max(EXT.map(lambda p: p[0])), min(EXT.map(lambda p: p[1]))]
NORTH_EAST = [max(EXT.map(lambda p: p[0])), max(EXT.map(lambda p: p[1]))]
SOUTH_WEST = [min(EXT.map(lambda p: p[0])), min(EXT.map(lambda p: p[1]))]
SOUTH_EAST = [min(EXT.map(lambda p: p[0])), max(EXT.map(lambda p: p[1]))]

MAX_Y_TILES = 2
MAX_X_TILES = 2


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
def distance_to_center(origins):
    # centre_str = f"{MARIENPLATZ},{MARIENPLATZ[1]}"
    gmaps = googlemaps.Client(key=os.getenv('GMAPS_KEY'))
    response = gmaps.distance_matrix(
        origins=origins,
        destinations=[MARIENPLATZ],
        mode='transit',
        departure_time=DEPARTURE_TIME,
    )
    eoi = [response['rows'][i]['elements'][0]['duration']['value'] for i in range(0, len(origins))]
    return eoi

# run script
if __name__ == '__main__':
    #    print(os.getenv('GMAPS_KEY'))
    tiles = tile_munich()
    closest = nearest_train_station(tiles)
    dists_to_station = distances_to_transit(tiles, closest)
    dists_to_centre = distance_to_center(tiles)
    print(dists_to_centre)

