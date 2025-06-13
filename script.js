// API Configuration
const API_KEY = '7bdd4eb7e6d8a3b97bb1a668f187a1eb'; // Replace with your actual API key
const BASE_URL = 'https://api.openweathermap.org/data/2.5';
const ICON_URL = 'https://openweathermap.org/img/wn/';

// DOM Elements
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const searchHistory = document.getElementById('search-history');
const currentCity = document.getElementById('current-city');
const currentDate = document.getElementById('current-date');
const currentIcon = document.getElementById('current-icon');
const currentTemp = document.getElementById('current-temp');
const currentHumidity = document.getElementById('current-humidity');
const currentWind = document.getElementById('current-wind');
const forecastContainer = document.getElementById('forecast-container');
const weatherChart = document.getElementById('weather-chart');

// Chart initialization
let temperatureChart = new Chart(weatherChart, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Temperature (°C)',
            data: [],
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1,
            fill: false
        }]
    },
    options: {
        responsive: true,
        scales: {
            y: {
                beginAtZero: false
            }
        }
    }
});

// Load search history from local storage
let searches = JSON.parse(localStorage.getItem('weatherSearches')) || [];

// Display search history
function displaySearchHistory() {
    searchHistory.innerHTML = '';
    searches.forEach(city => {
        const historyItem = document.createElement('div');
        historyItem.classList.add('history-item');
        historyItem.textContent = city;
        historyItem.addEventListener('click', () => {
            cityInput.value = city;
            fetchWeatherData(city);
        });
        searchHistory.appendChild(historyItem);
    });
}

// Fetch weather data from API
async function fetchWeatherData(city) {
    try {
        // Fetch current weather
        const currentResponse = await fetch(`${BASE_URL}/weather?q=${city}&units=metric&appid=${API_KEY}`);
        const currentData = await currentResponse.json();
        
        if (currentData.cod !== 200) {
            alert(currentData.message);
            return;
        }
        
        // Fetch 5-day forecast
        const forecastResponse = await fetch(`${BASE_URL}/forecast?q=${city}&units=metric&appid=${API_KEY}`);
        const forecastData = await forecastResponse.json();
        
        // Update UI
        updateCurrentWeather(currentData);
        updateForecast(forecastData);
        updateChart(forecastData);
        
        // Add to search history if not already there
        if (!searches.includes(city)) {
            searches.unshift(city);
            if (searches.length > 5) searches.pop();
            localStorage.setItem('weatherSearches', JSON.stringify(searches));
            displaySearchHistory();
        }
    } catch (error) {
        console.error('Error fetching weather data:', error);
        alert('Failed to fetch weather data. Please try again.');
    }
}

// Update current weather display
function updateCurrentWeather(data) {
    const date = new Date(data.dt * 1000);
    currentCity.textContent = `${data.name}, ${data.sys.country}`;
    currentDate.textContent = date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    currentIcon.innerHTML = `<img src="${ICON_URL}${data.weather[0].icon}@2x.png" alt="${data.weather[0].description}">`;
    currentTemp.textContent = `Temperature: ${Math.round(data.main.temp)}°C (Feels like ${Math.round(data.main.feels_like)}°C)`;
    currentHumidity.textContent = `Humidity: ${data.main.humidity}%`;
    currentWind.textContent = `Wind: ${Math.round(data.wind.speed * 3.6)} km/h`;
}

// Update 5-day forecast display
function updateForecast(data) {
    forecastContainer.innerHTML = '';
    
    // Group forecast by day
    const dailyForecasts = {};
    data.list.forEach(item => {
        const date = new Date(item.dt * 1000).toLocaleDateString();
        if (!dailyForecasts[date]) {
            dailyForecasts[date] = [];
        }
        dailyForecasts[date].push(item);
    });
    
    // Get the next 5 days (excluding today)
    const forecastDates = Object.keys(dailyForecasts).slice(1, 6);
    
    forecastDates.forEach(date => {
        const dayData = dailyForecasts[date];
        const avgTemp = Math.round(dayData.reduce((sum, item) => sum + item.main.temp, 0) / dayData.length);
        const dayName = new Date(dayData[0].dt * 1000).toLocaleDateString('en-US', { weekday: 'short' });
        const icon = dayData[Math.floor(dayData.length / 2)].weather[0].icon;
        
        const forecastDay = document.createElement('div');
        forecastDay.classList.add('forecast-day');
        forecastDay.innerHTML = `
            <h4>${dayName}</h4>
            <div class="forecast-icon">
                <img src="${ICON_URL}${icon}.png" alt="${dayData[0].weather[0].description}">
            </div>
            <div>Temp: ${avgTemp}°C</div>
            <div>Humidity: ${dayData[0].main.humidity}%</div>
            <div>Wind: ${Math.round(dayData[0].wind.speed * 3.6)} km/h</div>
        `;
        forecastContainer.appendChild(forecastDay);
    });
}

// Update temperature chart
function updateChart(data) {
    const labels = [];
    const temps = [];
    
    // Get data points for the next 5 days (every 3 hours)
    data.list.slice(0, 40).forEach(item => {
        const date = new Date(item.dt * 1000);
        labels.push(date.toLocaleTimeString([], { hour: '2-digit' }));
        temps.push(Math.round(item.main.temp));
    });
    
    temperatureChart.data.labels = labels;
    temperatureChart.data.datasets[0].data = temps;
    temperatureChart.update();
}

// Event Listeners
searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) {
        fetchWeatherData(city);
    }
});

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const city = cityInput.value.trim();
        if (city) {
            fetchWeatherData(city);
        }
    }
});

// Initialize
displaySearchHistory();