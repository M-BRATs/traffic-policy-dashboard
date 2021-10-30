from scripts import wifi_locations

from flask import Flask

app = Flask(__name__)

@app.route('/')
def hello_world():
    return 'Hello, World!'


if __name__ == '__main__':
    app.run()

wifi_locations.scrape_wifi_hotspots()