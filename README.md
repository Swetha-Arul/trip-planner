# Trip Planner 🗺️

Trip Planner is a modern travel planning web application designed to make road trips smarter, easier, and more interactive. Users can generate optimized routes, explore nearby places, monitor live weather conditions, and navigate using an interactive Google Maps interface with real-time guidance.

Built using HTML, CSS, JavaScript, PHP, MySQL, Google Maps APIs, and OpenWeather API.


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

## 🛠️ Tech Stack

### Frontend
- HTML
- CSS
- JavaScript

### Backend
- PHP

### Database
- MySQL

### APIs Used
- Google Maps JavaScript API
- Google Places API
- Google Directions API
- OpenWeather API

---

## 📂 Project Structure

```bash
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
│   ├── darkmode.css
│   ├── darkmode.js
│   └── darkmodemap.js
│
├── signuplogin/
│
├── screenshots/
│
├── pics/
│
├── config.sample.js
└── README.md
```

---

## ▶️ Running the Project with XAMPP

### 1️⃣ Move Project Folder

Move the project into your XAMPP `htdocs` directory:

```bash
C:\xampp\htdocs\trip-planner
```

---

### 2️⃣ Start Apache and MySQL

Open the XAMPP Control Panel and start:

- Apache
- MySQL

---

### 3️⃣ Create Database

Open:

```bash
http://localhost/phpmyadmin
```

Create a database named:

```bash
trip_planner
```

Run this SQL query:

```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    username VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    password VARCHAR(255)
);
```

---

### 4️⃣ Configure Database Credentials

Inside:

```bash
Backend/login.php
Backend/signup.php
```

Replace the placeholder values:

```php
$dbPassword = "YourPassword";
$dbname = "YourDatabaseName";
```

with your actual MySQL database credentials.

---

### 5️⃣ Configure API Keys

Create a file named:

```bash
config.js
```

Add your API keys:

```javascript
const GOOGLE_API_KEY = "YOUR_GOOGLE_API_KEY";
const WEATHER_API_KEY = "YOUR_OPENWEATHER_API_KEY";
```

---

### 6️⃣ Run the Application

Open in browser:

```bash
http://localhost/trip-planner/Mainpage/MainPage.html
```

---

## 📸 Highlights

- Interactive Google Maps integration
- Dark mode support
- Responsive UI
- Real-time navigation
- Route preference customization
- Nearby places discovery
- Weather-aware trip planning
- Authentication system

---

## 🚀 Future Improvements

- AI-based trip recommendations
- Saved trip history
- Expense tracking
- Collaborative trip planning
- Public transport integration
- Real-time travel assistant

---

## 🤝 Contributing

Contributions are welcome.

1. Fork the repository
2. Create a new branch
3. Commit your changes
4. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 👩‍💻 Developer

Created by [Swetha-Arul](https://github.com/Swetha-Arul)
