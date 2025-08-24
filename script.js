const apiKey = 'e40252c787074202f9d8948cd83f1bd8';
const weatherContainer = document.getElementById('weatherContainer');
const cityInput = document.getElementById('cityInput');
const addCityBtn = document.getElementById('addCity');
const suggestedCitiesContainer = document.getElementById('suggestedCities');

// List of suggested cities
const suggestedCitiesList = ["Madrid", "Paris", "Tokyo", "London", "New York", "Sydney", "Dubai"];

// Pick 3 random cities for suggested cities
function pickRandomCities(list, count) {
    const copy = [...list];
    const result = [];
    for (let i = 0; i < count; i++) {
        const index = Math.floor(Math.random() * copy.length);
        result.push(copy.splice(index, 1)[0]);
    }
    return result;
}

// Update right-hand panel
function updateCityDetails(city, currentData, forecastData) {
    const cityNameElem = document.querySelector('.city_details .city_name .meteo h1');
    const chanceRainElem = document.querySelector('.city_details .city_name .meteo p');
    const tempElem = document.querySelector('.city_details .city_name .meteo h1:nth-of-type(2)');
    const currentIcon = document.getElementById('currentIcon');
    const forecastContainer = document.querySelector('.forecast_details .fore_name .meteo');
    const hourlyContainer = document.getElementById('hourlyForecast');

    cityNameElem.textContent = city;
    chanceRainElem.textContent = `Chance to rain: ${Math.round(currentData.pop ? currentData.pop * 100 : 0)}%`;
    tempElem.textContent = `${Math.round(currentData.main.temp)}°C`;
    currentIcon.innerHTML = `<img src="http://openweathermap.org/img/wn/${currentData.weather[0].icon}@2x.png" alt="${currentData.weather[0].description}">`;

    // 3-day forecast
    forecastContainer.querySelectorAll('.table').forEach(e => e.remove());
    const forecastList = forecastData.list.filter(item => item.dt_txt.includes('12:00:00')).slice(0, 3);
    forecastList.forEach(day => {
        const date = new Date(day.dt * 1000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        const table = document.createElement('div');
        table.classList.add('table');
        table.innerHTML = `
            <div class="days"><p>${date} </p></div>
            <div class="gen">
                <p><img src="http://openweathermap.org/img/wn/${day.weather[0].icon}.png" alt="${day.weather[0].description}"> <span>${day.weather[0].description}</span></p>
            </div>
            <div class="degrees"><p>${Math.round(day.main.temp)}°C</p></div>
        `;
        forecastContainer.appendChild(table);
    });

    // Today's hourly forecast (next 3 hours)
    hourlyContainer.innerHTML = '';
    const now = new Date();
    const hourly = forecastData.list.filter(item => {
        const dt = new Date(item.dt * 1000);
        return dt.getDate() === now.getDate();
    }).slice(0, 3);

    hourly.forEach(hour => {
        const dt = new Date(hour.dt * 1000);
        const timeStr = dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        const tableHour = document.createElement('div');
        tableHour.classList.add('hour1');
        tableHour.innerHTML = `
            <p>${timeStr}</p>
            <p>${hour.weather[0]?.icon ? `<img src="http://openweathermap.org/img/wn/${hour.weather[0].icon}.png" alt="${hour.weather[0].description}">` : "N/A"}</p>
            <p>${hour.main?.temp ? Math.round(hour.main.temp) + '°C' : "N/A"}</p>
        `;
        hourlyContainer.appendChild(tableHour);
    });

    if (hourly.length === 0) {
        const tableHour = document.createElement('div');
        tableHour.classList.add('hour1');
        tableHour.innerHTML = `<p>N/A</p><p>N/A</p><p>N/A</p>`;
        hourlyContainer.appendChild(tableHour);
    }
}

// Fetch weather data
async function fetchWeather(city, card = null) {
    if (card) {
        const loading = document.createElement('div');
        loading.classList.add('loading');
        loading.textContent = 'Loading...';
        card.appendChild(loading);
    }

    try {
        const currentRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`);
        if (!currentRes.ok) throw new Error('City not found');
        const currentData = await currentRes.json();

        const forecastRes = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${apiKey}`);
        const forecastData = await forecastRes.json();

        if (card) {
            const currentElem = card.querySelector('.current-weather');
            currentElem.innerHTML = `
                <img src="http://openweathermap.org/img/wn/${currentData.weather[0].icon}@2x.png" alt="${currentData.weather[0].description}">
                <p>${Math.round(currentData.main.temp)}°C</p>
                <p>${currentData.weather[0].description}</p>
            `;
            // ⛔ Removed forecast from searched city cards
        }

        return { currentData, forecastData };

    } catch (error) {
        if (card) card.querySelector('.error').textContent = error.message;
        return {};
    } finally {
        if (card) card.querySelector('.loading')?.remove();
    }
}

// Create city card
function createCityCard(city, isMyLocation = false) {
    const card = document.createElement('div');
    card.classList.add('city-card');
    card.innerHTML = `<h2>${city}${isMyLocation ? " (My Location)" : ""}</h2><div class="current-weather"></div><div class="forecast"></div><div class="error"></div>`;
    weatherContainer.appendChild(card);

    fetchWeather(city, card).then(({ currentData, forecastData }) => {
        if (currentData && forecastData) {
            updateCityDetails(city + (isMyLocation ? " (My Location)" : ""), currentData, forecastData);
        }
    });

    card.addEventListener('click', async () => {
        const { currentData, forecastData } = await fetchWeather(city, card);
        if (currentData && forecastData) updateCityDetails(city + (isMyLocation ? " (My Location)" : ""), currentData, forecastData);
    });

    return card;
}

// Event listener
addCityBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) createCityCard(city);
    cityInput.value = '';
});

// Suggested cities
pickRandomCities(suggestedCitiesList, 3).forEach(city => {
    const div = document.createElement('div');
    div.classList.add('city1');
    div.innerHTML = `<p>${city}</p><p id="icon">Loading...</p><p id="temp">--°C</p>`;
    suggestedCitiesContainer.appendChild(div);

    fetchWeather(city).then(({ currentData }) => {
        if (currentData) {
            div.querySelector('#icon').innerHTML = `<img src="http://openweathermap.org/img/wn/${currentData.weather[0].icon}.png" alt="${currentData.weather[0].description}">`;
            div.querySelector('#temp').textContent = `${Math.round(currentData.main.temp)}°C`;
        }
    });

    div.addEventListener('click', async () => {
        const { currentData, forecastData } = await fetchWeather(city);
        if (currentData && forecastData) updateCityDetails(city, currentData, forecastData);
    });
});

// Auto-fetch user location
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        const loading = document.createElement('div');
        loading.classList.add('loading');
        loading.textContent = 'Fetching your location weather...';
        weatherContainer.appendChild(loading);
        try {
            const currentRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${apiKey}`);
            const currentData = await currentRes.json();
            const city = currentData.name || 'Your Location';
            createCityCard(city, true); // ✅ Mark my location
        } catch (e) { console.error(e); }
        finally { weatherContainer.removeChild(loading); }
    });
}
