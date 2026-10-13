# CampusPark

CampusPark is a small, responsive campus parking helper built with plain HTML, CSS, and JavaScript. It uses sample Northwood University parking data and requires no package installation or build step.

## Run it

Open `index.html` in a modern browser. For the most consistent browser storage behavior, serve the project directory with a local static web server and open its `index.html` URL.

## Features

- Browse sample lots, parking availability, and permit requirements.
- Sort lots by walking distance to a selected campus building.
- Filter the list by availability or visitor parking.
- View lots on an illustrative campus map and open walking directions.
- Create, edit, and delete parking lots.
- Save lot changes in the current browser with `localStorage`.
- Validate lot details before saving.

## Project files

- `index.html` — page structure and accessible form controls.
- `styles.css` — responsive layout and visual styles.
- `script.js` — sample data, filtering, directions, and parking-lot CRUD behavior.

## Data and limitations

The initial parking lot data is fictional demo data. Changes made through the app are stored locally in the browser and are not shared with other users or devices. Clearing this site's browser storage removes saved changes and restores the sample data. Parking availability and the campus map are illustrative, not live campus information.

Walking directions open Google Maps in a new tab using the lot and building names.
