# Trip-Planner

**Trip-Planner** is an all-in-one travel assistant designed to simplify and enhance your journey. This early version provides dynamic route planning, real-time GPS tracking, and detailed points-of-interest search to help you plan your trips. With features like voice-guided navigation and a dark mode toggle for night trips, Trip-Planner aims to deliver an intuitive and modern travel experience.

## Features

- **Dynamic Route Planning:**  
  Enter your start and destination, add stops, and generate multiple alternative routes with detailed directions.
  
- **Live GPS Tracking:**  
  View your real-time location on an interactive Google Map, with automatic centering and custom markers.
  Discover nearby gas stations, restaurants, and hotels along your route using the Google Places API.
  
- **Voice-Guided Navigation:**  
  Receive turn-by-turn voice instructions for a hands-free navigation experience.

- **Interactive User Interface:**  
  Enjoy an intuitive sidebar with quick access icons and an expandable panel for route details and directions.

## Installation

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/your-username/trip-planner.git
   ```

2. **Configure Your API Key:**

   - Create a file named `config.js` in the root directory.
   - Add the following code to `config.js` (replace `YOUR_API_KEY` with your actual Google Maps API key):

     ```js
     const GOOGLE_API_KEY = 'YOUR_API_KEY';
     ```

   - **Important:** Add `config.js` to your `.gitignore` so your API key remains private.

3. **Open or Deploy the Project:**

   - Open the HTML file in your browser.
   - Alternatively, deploy the project on a web server to test it live.

## Technologies Used

- **HTML, CSS, JavaScript** – Core web technologies.
- **Google Maps API** – For interactive maps, directions, and places search.
- **Web Speech API** – For voice-guided navigation.

## Roadmap

- **Additional Features:**  
  More comprehensive trip planning tools, enhanced UI/UX, and expanded points-of-interest searches.
  
- **Performance Improvements:**  
  Optimize map interactions and GPS tracking.
  
- **User Feedback Integration:**  
  Implement features based on community feedback and suggestions.

## Contributing

Contributions and feedback are welcome!  
Please fork the repository and open a pull request with your improvements.

## License

This project is open-source and available under the [MIT License](LICENSE).
