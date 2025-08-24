const apiKey = 'YOUR_API_KEY_HERE'; // Replace with your OpenWeatherMap API key
const weatherContainer = document.getElementById('weatherContainer');
const cityInput = document.getElementById('cityInput');
const addCityBtn = document.getElementById('addCity');

// Function to create a city card
function createCityCard(city) {
    const card = document.createElement('div');
    card.classList.add('city-card');
    card.innerHTML = `
        <h2>${city}</h2>
        <div class="current-weather"></div>
        <div class="forecast"></div>
        <div class="error"></div>
    `;
    weatherContainer.appendChild(card);
    fetchWeather(city, card);
    return card;
}

// Function to fetch weather data
async function fetchWeather(city, card) {
    const loading = document.createElement('div');
    loading.classList.add('loading');
    loading.textContent = 'Loading...';
    card.appendChild(loading);

    const errorElem = card.querySelector('.error');
    errorElem.textContent = '';

    try {
        // Fetch current weather
        const currentRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`);
        if (!currentRes.ok) throw new Error('City not found');
        const currentData = await currentRes.json();

        // Fetch forecast
        const forecastRes = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${apiKey}`);
        const forecastData = await forecastRes.json();

        // Display current weather
        const currentElem = card.querySelector('.current-weather');
        currentElem.innerHTML = `
            <img src="http://openweathermap.org/img/wn/${currentData.weather[0].icon}@2x.png" alt="${currentData.weather[0].description}">
            <p>${Math.round(currentData.main.temp)}°C</p>
            <p>${currentData.weather[0].description}</p>
        `;

        // Process 3-day forecast (next 3 days at 12:00)
        const forecastList = forecastData.list.filter(item => item.dt_txt.includes('12:00:00')).slice(0, 3);
        const forecastElem = card.querySelector('.forecast');
        forecastElem.innerHTML = '';
        forecastList.forEach(day => {
            const date = new Date(day.dt * 1000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            forecastElem.innerHTML += `
                <div class="forecast-day">
                    <p>${date}</p>
                    <img src="http://openweathermap.org/img/wn/${day.weather[0].icon}.png" alt="${day.weather[0].description}">
                    <p>${Math.round(day.main.temp)}°C</p>
                </div>
            `;
        });
    } catch (error) {
        errorElem.textContent = error.message;
    } finally {
        card.removeChild(loading);
    }
}

// Event listener for adding city
addCityBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) {
        createCityCard(city);
        cityInput.value = '';
    }
});

// Bonus: Auto-fetch user's current location on load
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        const loading = document.createElement('div');
        loading.classList.add('loading');
        loading.textContent = 'Fetching your location weather...';
        weatherContainer.appendChild(loading);

        try {
            // Fetch current weather by lat/lon
            const currentRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${apiKey}`);
            const currentData = await currentRes.json();
            const city = currentData.name || 'Your Location';

            // Create card for current location
            createCityCard(city);
        } catch (error) {
            console.error('Error fetching location weather:', error);
        } finally {
            weatherContainer.removeChild(loading);
        }
    }, (error) => {
        console.error('Geolocation error:', error);
        // Ignore if denied
    });
}