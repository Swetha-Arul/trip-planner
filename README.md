# Trip Planner 🗺️
![PHP](https://img.shields.io/badge/PHP-8.2-blue)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED)
![AWS](https://img.shields.io/badge/AWS-EC2-orange)
![License](https://img.shields.io/badge/License-MIT-green)

Trip Planner is a modern travel planning web application designed to make road trips smarter, easier, and more interactive. Users can generate optimized routes, explore nearby places, monitor live weather conditions, and navigate using an interactive Google Maps interface with real-time guidance.

Built using HTML, CSS, JavaScript, PHP, MySQL, Google Maps APIs, and OpenWeather API.
<img width="2856" height="1456" alt="HomePage" src="https://github.com/user-attachments/assets/3d8efabc-e0ac-4a9a-acdc-cda691a33f05" />



## ✨ Features

### 🚗 Smart Route Planning
- Generate optimized routes between locations
- Add multiple stops during trips
- View alternate routes
- Live traffic visualization
- Interactive turn-by-turn directions

### 📍 Real-Time Navigation
- GPS location tracking
- Distance and travel-time calculation
- Voice-guided navigation
- Route instruction panel

### 🌦️ Weather Integration
- Live weather information using OpenWeather API
- Weather-aware route filtering
- Avoid rainy or extreme-temperature areas

### 🍽️ Nearby Place Discovery
- Restaurants
- Hotels
- Fuel stations
- Tourist attractions

### 🎨 Modern UI/UX
- Responsive landing page
- Mobile-friendly sidebar navigation
- Smooth animations and transitions
- Fully functional dark mode

### 🔐 User Authentication
- Login and Signup system
- Password hashing using PHP
- MySQL database integration

---
## Screenshots

<img width="2870" height="1464" alt="Signup page" src="https://github.com/user-attachments/assets/5b020a35-0880-4ebe-8edb-ed5cea3a42ee" /> 

> *Sign up Page*
---

<img width="2880" height="1348" alt="map" src="https://github.com/user-attachments/assets/1c8c0b6b-af57-45d9-b052-1b1b1dafd8fb" />

> *Map*
---

<img width="2862" height="1314" alt="filters" src="https://github.com/user-attachments/assets/e1f7ba85-20c5-43b6-91f5-667979bd495b" />

> *filters*
---

## 🛠️ Tech Stack

### Frontend
- HTML
- CSS
- JavaScript

### Backend
- PHP
- Composer
- `vlucas/phpdotenv`

### Database
- MariaDB

### APIs
- Google Maps JavaScript API
- Google Places API
- Google Directions API
- OpenWeather API

### DevOps & Deployment
- Docker
- Docker Compose
- Apache
- AWS EC2

---
## 🏗️ Architecture

```text
                     ┌─────────────────────┐
                     │       Browser       │
                     │  HTML / CSS / JS    │
                     └──────────┬──────────┘
                                │
              ┌─────────────────┼─────────────────┐
              │                 │                 │
              ▼                 ▼                 ▼
       Google Maps API    OpenWeather API    PHP Backend
                                                │
                                                ▼
                                           MariaDB
```

### Docker Deployment

```text
AWS EC2
│
└── Docker Compose
    │
    ├── tripplanner-app
    │   ├── Apache
    │   ├── PHP
    │   └── Trip Planner
    │
    └── tripplanner-db
        └── MariaDB
```

Docker Compose manages the application and database containers, their networking, and persistent database storage.

---

## 📂 Project Structure

```text
trip-planner/
│
├── Backend/
│   ├── login.php
│   └── signup.php
│
├── Mainpage/
│   ├── MainPage.html
│   └── MainPage.css
│
├── map/
│   ├── map.html
│   ├── map.css
│   └── map.js
│
├── darkmode/
│
├── signuplogin/
│
├── database/
│   └── init.sql
│
├── pics/
│
├── screenshots/
│
├── Dockerfile
├── docker-compose.yml
├── composer.json
├── composer.lock
├── config.sample.js
└── README.md
```

---

## 🐳 Running with Docker

### Prerequisites

Install:

- Docker
- Docker Compose
- Git

---

### 1. Clone the Repository

```bash
git clone https://github.com/Swetha-Arul/trip-planner.git
cd trip-planner
```

---

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```env
DB_HOST=db
DB_NAME=RoadTrip
DB_USER=root
DB_PASSWORD=your_password_here
```

The database password must match the MariaDB root password configured for Docker Compose.

> `.env` should not be committed to the repository.

---

### 3. Configure MariaDB

In `docker-compose.yml`, set your own MariaDB root password:

```yaml
environment:
  MYSQL_ROOT_PASSWORD: rootpassword 
  MYSQL_DATABASE: RoadTrip
```

Make sure this password matches `DB_PASSWORD` in `.env`.

---

### 4. Configure API Keys

Copy:

```text
config.sample.js
```

and create:

```text
config.js
```

Add your API keys:

```javascript
const GOOGLE_API_KEY = "YOUR_GOOGLE_API_KEY";
const WEATHER_API_KEY = "YOUR_OPENWEATHER_API_KEY";
```

> Do not commit `config.js` containing real API keys.

---

### 5. Install PHP Dependencies

```bash
composer install
```

This installs the dependencies defined in `composer.json`, including `vlucas/phpdotenv`.

---

### 6. Build and Start

```bash
docker compose up -d --build
```

The application will be available through port `80`.

Open:

```text
http://localhost/Mainpage/MainPage.html
```

---

### 7. Stop the Application

```bash
docker compose down
```

To remove the database volume as well:

```bash
docker compose down -v
```

> Removing the volume deletes the stored database data.

---

## ☁️ Deployment

Trip Planner has been containerized using Docker Compose and deployed on an AWS EC2 instance.

The deployment consists of two Docker containers:

- **Application Container** — Apache + PHP + application files
- **Database Container** — MariaDB

Docker networking allows the PHP application to communicate with MariaDB internally using:

```text
DB_HOST=db
```

The application container exposes port `80` for HTTP access, while the MariaDB port is kept internal to the Docker network.

---

## 🔒 Security

The project includes several basic security practices:

- Passwords are hashed using PHP `password_hash()`
- Login verification uses `password_verify()`
- Database queries use prepared statements
- Database credentials are loaded through environment variables
- `.env` is excluded from version control
- API credentials can be excluded using `config.js`
- MariaDB is not directly exposed publicly in the Docker deployment

API keys used by browser-side JavaScript should additionally be restricted through their respective API provider settings.

---

## ⚠️ Known Limitations

- Nearby place results depend on the results returned by the external APIs and do not represent every possible establishment in an area.
- Weather-based route preferences are relatively basic.
- The application is a project/demo deployment rather than a production-scale navigation service.
- HTTPS is not currently configured for the EC2 deployment.
- API keys must be configured separately before map and weather functionality can be used.

---

## 🚀 Future Improvements

- HTTPS support
- Saved trips and trip history
- AI-based trip recommendations
- Expense tracking
- Collaborative trip planning
- Improved route optimization
- CI/CD using GitHub Actions
- Improved mobile compatibility

---

## 🤝 Contributing

Contributions are welcome.

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push the branch
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---
