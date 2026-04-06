export default {
  site: "weather",
  name: "forecast",
  description: "Weather forecast from wttr.in (defaults to auto-detected location)",
  columns: ["day", "location", "temp_c", "temp_f", "feels_like_c", "condition", "humidity", "wind_kph", "wind_dir", "precip_mm", "uv_index"],
  url: "https://wttr.in/",
  args: {
    location: { type: "string", default: "", description: "City name or location (e.g. 'London', 'New+York')" }
  },

  run: async (tap, args) => {
    const location = args.location || ''
    const url = `https://wttr.in/${encodeURIComponent(location)}?format=j1`
    const resp = await tap.fetch(url, { headers: { 'User-Agent': 'curl/8.0' } })
    const data = JSON.parse(resp.body)

    const current = data.current_condition?.[0] || {}
    const area = data.nearest_area?.[0] || {}
    const areaName = area.areaName?.[0]?.value || location || 'Unknown'
    const country = area.country?.[0]?.value || ''

    const rows = []

    // Current conditions
    rows.push({
      day: 'Now',
      location: `${areaName}, ${country}`,
      temp_c: current.temp_C || '',
      temp_f: current.temp_F || '',
      feels_like_c: current.FeelsLikeC || '',
      condition: current.weatherDesc?.[0]?.value || '',
      humidity: current.humidity || '',
      wind_kph: current.windspeedKmph || '',
      wind_dir: current.winddir16Point || '',
      precip_mm: current.precipMM || '',
      uv_index: current.uvIndex || ''
    })

    // 3-day forecast
    const forecasts = data.weather || []
    forecasts.forEach(day => {
      rows.push({
        day: day.date || '',
        location: `${areaName}, ${country}`,
        temp_c: `${day.mintempC}-${day.maxtempC}`,
        temp_f: `${day.mintempF}-${day.maxtempF}`,
        feels_like_c: '',
        condition: day.hourly?.[4]?.weatherDesc?.[0]?.value || '',
        humidity: day.hourly?.[4]?.humidity || '',
        wind_kph: day.hourly?.[4]?.windspeedKmph || '',
        wind_dir: day.hourly?.[4]?.winddir16Point || '',
        precip_mm: day.hourly?.[4]?.precipMM || '',
        uv_index: day.hourly?.[4]?.uvIndex || ''
      })
    })

    return rows
  }
}
