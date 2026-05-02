const axios = require("axios");

const get24HrTicker = async () => {
  try {
  const response = await axios.get("https://api.binance.com/api/v3/ticker/24hr", {
        headers: { "User-Agent": "Mozilla/5.0" },
        timeout: 5000,
      });

    return response.data;
  } catch (error) {
    console.error("Binance API error:", error.response?.data || error.message);
    return null; 
  }
};

module.exports = { get24HrTicker };
