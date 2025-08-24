const apiKey = 'e40252c787074202f9d8948cd83f1bd8';
const weatherContainer = document.getElementById('weatherContainer');
const cityInput = document.getElementById('cityInput');
const addCityBtn = document.getElementById('addCity');

// Function to update right-hand panel
function updateCityDetails(city, currentData, forecastData) {
    const cityNameElem = document.querySelector('.city_details .city_name .meteo h1');
    const chanceRainElem = document.querySelector('.city_details .city_name .meteo p');
    const tempElem = document.querySelector('.city_details .city_name .meteo h1:nth-of-type(2)');
    const forecastContainer = document.querySelector('.forecast_details .fore_name .meteo');

    cityNameElem.textContent = city;
    chanceRainElem.textContent = `Chance to rain: ${Math.round(currentData.pop ? currentData.pop * 100 : 0)}%`;
    tempElem.textContent = `${Math.round(currentData.main.temp)}°C`;

    // Clear old forecast tables
    forecastContainer.querySelectorAll('.table').forEach(e => e.remove());

    // 3-day forecast
    const forecastList = forecastData.list.filter(item => item.dt_txt.includes('12:00:00')).slice(0, 3);
    forecastList.forEach(day => {
        const date = new Date(day.dt * 1000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        const table = document.createElement('div');
        table.classList.add('table');
        table.innerHTML = `
            <div class="days"><p>${date}</p></div>
            <div class="gen">
                <p>
                    <img src="http://openweathermap.org/img/wn/${day.weather[0].icon}.png" alt="${day.weather[0].description}">
                    <span>${day.weather[0].description}</span>
                </p>
            </div>
            <div class="degrees"><p>${Math.round(day.main.temp)}°C</p></div>
        `;
        forecastContainer.appendChild(table);
    });
}

// Fetch weather data
async function fetchWeather(city, card) {
    const loading = document.createElement('div');
    loading.classList.add('loading');
    loading.textContent = 'Loading...';
    card.appendChild(loading);

    const errorElem = card.querySelector('.error');
    errorElem.textContent = '';

    try {
        // Current weather
        const currentRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`);
        if (!currentRes.ok) throw new Error('City not found');
        const currentData = await currentRes.json();

        // Forecast
        const forecastRes = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${apiKey}`);
        const forecastData = await forecastRes.json();

        // Display current weather on card
        const currentElem = card.querySelector('.current-weather');
        currentElem.innerHTML = `
            <img src="http://openweathermap.org/img/wn/${currentData.weather[0].icon}@2x.png" alt="${currentData.weather[0].description}">
            <p>${Math.round(currentData.main.temp)}°C</p>
            <p>${currentData.weather[0].description}</p>
        `;

        // Display forecast on card
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

        return { currentData, forecastData };

    } catch (error) {
        errorElem.textContent = error.message;
        return {};
    } finally {
        card.removeChild(loading);
    }
}

// Create city card
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

    fetchWeather(city, card).then(({ currentData, forecastData }) => {
        updateCityDetails(city, currentData, forecastData);
    });

    // Update right panel on click
    card.addEventListener('click', async () => {
        const { currentData, forecastData } = await fetchWeather(city, card);
        updateCityDetails(city, currentData, forecastData);
    });

    return card;
}

// Event listener for adding city
addCityBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) {
        createCityCard(city);
        cityInput.value = '';
    }
});

// Auto-fetch user location on load
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        const loading = document.createElement('div');
        loading.classList.add('loading');
        loading.textContent = 'Fetching your location weather...';
        weatherContainer.appendChild(loading);

        try {
            const currentRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${apiKey}`);
            const currentData = await currentRes.json();
            const city = currentData.name || 'Your Location';

            createCityCard(city);
        } catch (error) {
            console.error('Error fetching location weather:', error);
        } finally {
            weatherContainer.removeChild(loading);
        }
    }, (error) => console.error('Geolocation error:', error));
}
