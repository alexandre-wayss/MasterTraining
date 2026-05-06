# VolumeLab

VolumeLab is a React + TypeScript web app for building, organizing, and analyzing strength training routines with local persistence.

The project is designed to feel like a clean, practical workout hub for planning and weekly tracking, without a backend, authentication, or automatic workout generation.

## Overview

With VolumeLab, you can:

- build workouts manually from an internal exercise library
- organize a weekly training schedule
- start in-progress workouts and log sets in real time
- track completed volume, muscle frequency, adherence, and weekly history
- export workouts to PDF
- store everything locally in the browser with `localStorage`

## Tech Stack

- React
- TypeScript
- Vite
- Plain CSS
- `localStorage` for persistence

## Main Features

- Dashboard with weekly completed-volume summary
- Workout list with create, duplicate, edit, and delete actions
- Workout editor with:
  - exercise order
  - sets, reps, load, and notes
  - per-exercise rest
  - warmups, RPE, and RIR
  - PDF export
- Weekly schedule by day
- Performed log by weekday
- In-progress workout mode with:
  - set checklist
  - modal editing
  - warmups always shown first
  - set removal
  - rest timer
  - extra exercises
- Planner with targets, emphasis muscles, and muscle-level analysis
- Weekly history, comparisons, and heatmap
- Internal exercise library with search and filters
- JSON import and export

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

## Scripts

- `npm run dev` - start Vite in development mode
- `npm run build` - type-check and build the production bundle
- `npm run preview` - preview the production build locally

## Project Structure

- `src/pages` - main application screens
- `src/components` - reusable UI components
- `src/utils` - calculations, formatting, and domain helpers
- `src/data` - internal exercise library and demo data
- `src/hooks` - persisted app state and active workout session state
- `src/styles.css` - global application styles

## Persistence

The app automatically saves the following in the browser:

- workouts
- weekly schedule
- settings
- weekly targets
- emphasis muscles
- weekly history
- active workout session

## Notes

- The app is 100% frontend.
- No data is sent to a server.
- Saved data depends on the browser's `localStorage`.
- Clearing local data resets the app back to the demo state.

## License

Internal / personal project. Adjust as needed for your repository.
