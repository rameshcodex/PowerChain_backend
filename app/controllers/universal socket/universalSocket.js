/**
 * UniversalSocket (Browser/React)
 * - ticker-only
 * - supports Binance and Bybit public ticker streams
 * - auto reconnects and resubscribes
 *
 * Example:
 *   const ws = new UniversalSocket({ type: "binance" });
 *   ws.onOpen(() => ws.subscribeTicker(["BTCUSDT", "LTCUSDT"]));
 *   ws.ticker((data) => console.log("ticker:", data));
 */

export default class UniversalSocket {
  constructor({ type = "binance", autoConnect = true, tradeType = "spot", token = "" } = {}) {
    this.type = String(type).toLowerCase();
    this.tradeType = String(tradeType).toLowerCase();
    this.ws = null;
    this.callbacks = {
      ticker: new Set(),
      open: new Set(),
      markettrade: new Set(),
      orderbook: new Set()
    };
    this.currentSocketToken = token
    this.subscribedTopics = new Set();
    this.ready = false;
    this._reconnectTimeout = 2000;
    this.localOrderBook = {};
    this.orderBookLimit = 20

    if (autoConnect) this.connect();
  }

  connect() {
    if (this.ws && (this.ws.readyState === 1 || this.ws.readyState === 0)) return;

    let url;
    if (this.type === "binance" && this.tradeType == "spot") url = "wss://stream.binance.com:9443/ws";
    else if (this.type === "binance" && this.tradeType == "futures") url = "wss://fstream.binance.com/ws";
    else if (this.type === "bybit" && this.tradeType == "spot") url = "wss://stream.bybit.com/v5/public/spot";
    else if (this.type === "bybit" && this.tradeType == "futures") url = "wss://stream.bybit.com/v5/public/linear";
    else if (this.type === "bitget") url = "wss://ws.bitget.com/v2/ws/public";
    else if (this.type === "valr") url = "wss://api.valr.com/ws/trade";
    else if (this.type === "kucoin" && this.tradeType == "spot") url = `wss://ws-api-spot.kucoin.com?token=${this.currentSocketToken}`
    else if (this.type === "kucoin" && this.tradeType == "futures") url = `wss://ws-api-futures.kucoin.com?token=${this.currentSocketToken}`
    else throw new Error("Unsupported exchange type: " + this.type);

    this.ws = new WebSocket(url);

    this.ws.addEventListener("open", () => {
      this.ready = true;
      this._emit("open");
    });

    this.ws.addEventListener("message", (ev) => this._onMessage(ev.data));

    this.ws.addEventListener("close", () => {
      this.ready = false;
      // setTimeout(() => this.connect(), this._reconnectTimeout);
    });

    this.ws.addEventListener("error", () => {
      try {
        this.ws.close();
      } catch (_) { }
    });
  }

  // --- Public API ---

  onOpen(callback) {
    if (typeof callback !== "function") throw new Error("callback must be function");
    this.callbacks.open.add(callback);
    if (this.ready) callback(); // call immediately if already open
    return () => this.callbacks.open.delete(callback);
  }

  waitForOpen() {
    return new Promise((resolve) => {
      if (this.ready) return resolve();
      const off = this.onOpen(() => {
        off();
        resolve();
      });
    });
  }

  // symbols: array like ["BTCUSDT","LTCUSDT"]
  subscribeTicker(symbols = []) {
    if (!Array.isArray(symbols)) symbols = [symbols];
    var normalized = symbols.map((s) => s.replace(/\W/g, "").toUpperCase());
    console.log("🚀 ~ UniversalSocket ~ subscribeTicker ~ normalized:", normalized)

    if (this.type == "valr") {
      if (this.tradeType === "futures") {
        normalized = symbols.map((s) => s.replace(/\W/g, "").toUpperCase() + "PERP");
      }
      this._sendSubscribe({
        "type": "SUBSCRIBE",
        "subscriptions": [
          {
            "event": "MARKET_SUMMARY_UPDATE",
            "pairs":
              normalized

          }
        ]
      });
    }
    else if (this.type == "kucoin") {

      if (this.tradeType === "spot") {
        normalized = symbols?.join(",")
        normalized = `/market/snapshot:${normalized}`
        this._sendSubscribe(normalized);
      } else {
        normalized = symbols.map((s) => s.replace(/\W/g, "").toUpperCase() + "M");
        normalized = normalized?.join(",")
        normalized = `/contractMarket/snapshot:${normalized}`
        this._sendSubscribe(normalized);
      }

    }
    else {
      normalized.forEach((sym) => {
        const topic =
          this.type === "binance"
            ? `${sym.toLowerCase()}@ticker` :
            this.type === "bybit" ?
              `tickers.${sym}` :
              this.type === "bitget" ?
                {
                  "instType": this.tradeType == "spot" ? "SPOT" : "USDT-FUTURES",
                  "channel": "ticker",
                  "instId": sym
                } :
                sym
        this._sendSubscribe(topic);
      });
    }
  }

  UnsubscribeTicker(symbols = []) {
    if (!Array.isArray(symbols)) symbols = [symbols];
    var normalized = symbols.map((s) => s.replace(/\W/g, "").toUpperCase());

    if (this.type == "valr") {
      this._unsendSubscribe({
        "type": "UNSUBSCRIBE",
        "subscriptions": [
          {
            "event": "MARKET_SUMMARY_UPDATE",
            "pairs":
              normalized

          }
        ]
      });
    }
    else if (this.type == "kucoin") {
      if (this.tradeType === "spot") {
        normalized = symbols?.join(",")
        normalized = `/market/snapshot:${normalized}`
        this._unsendSubscribe(normalized);
      } else {
        normalized = symbols.map((s) => s.replace(/\W/g, "").toUpperCase() + "M");
        normalized = normalized?.join(",")
        normalized = `/contractMarket/snapshot:${normalized}`
        this._unsendSubscribe(normalized);
      }
    }
    else {
      normalized.forEach((sym) => {
        const topic =
          this.type === "binance"
            ? `${sym.toLowerCase()}@ticker` :
            this.type === "bybit" ?
              `tickers.${sym}` :
              this.type === "bitget" ?
                {
                  "instType": this.tradeType == "spot" ? "SPOT" : "USDT-FUTURES",
                  "channel": "ticker",
                  "instId": sym
                } :
                sym
        this._unsendSubscribe(topic);
      });
    }
  }


  subscribeMarketTrade(symbols = []) {
    if (!Array.isArray(symbols)) symbols = [symbols];
    var normalized = symbols.map((s) => s.replace(/\W/g, "").toUpperCase());
    console.log("🚀 ~ UniversalSocket ~ subscribeTicker ~ normalized:", normalized)

    if (this.type == "valr") {
      if (this.tradeType === "futures") {
        normalized = symbols.map((s) => s.replace(/\W/g, "").toUpperCase() + "PERP");
      }
      this._sendSubscribe({
        "type": "SUBSCRIBE",
        "subscriptions": [
          {
            "event": "NEW_TRADE",
            "pairs":
              normalized

          }
        ]
      });
    } else if (this.type == "kucoin") {
      if (this.tradeType === "spot") {
        normalized = symbols?.join(",")
        normalized = `/market/match:${normalized}`
        this._sendSubscribe(normalized);
      } else {
        normalized = symbols.map((s) => s.replace(/\W/g, "").toUpperCase() + "M");
        normalized = normalized?.join(",")
        normalized = `/contractMarket/execution:${normalized}`
        this._sendSubscribe(normalized);
      }
    }
    else {
      normalized.forEach((sym) => {
        const topic =
          this.type === "binance"
            ? `${sym.toLowerCase()}@trade` :
            this.type === "bybit" ?
              `publicTrade.${sym}` :
              this.type === "bitget" ?
                {
                  "instType": this.tradeType == "spot" ? "SPOT" : "USDT-FUTURES",
                  "channel": "trade",
                  "instId": sym
                } :
                sym
        this._sendSubscribe(topic);
      });
    }
  }

  UnsubscribeMarketTrade(symbols = []) {
    if (!Array.isArray(symbols)) symbols = [symbols];
    var normalized = symbols.map((s) => s.replace(/\W/g, "").toUpperCase());

    if (this.type == "valr") {
      this._unsendSubscribe({
        "type": "UNSUBSCRIBE",
        "subscriptions": [
          {
            "event": "NEW_TRADE",
            "pairs":
              normalized
          }
        ]
      });
    }
    else if (this.type == "kucoin") {
      if (this.tradeType === "spot") {
        normalized = symbols?.join(",")
        normalized = `/market/match:${normalized}`
        this._unsendSubscribe(normalized);
      } else {
        normalized = symbols.map((s) => s.replace(/\W/g, "").toUpperCase() + "M");
        normalized = normalized?.join(",")
        normalized = `/contractMarket/execution:${normalized}`
        this._unsendSubscribe(normalized);
      }
    }
    else {
      normalized.forEach((sym) => {
        const topic =
          this.type === "binance"
            ? `${sym.toLowerCase()}@trade` :
            this.type === "bybit" ?
              `publicTrade.${sym}` :
              this.type === "bitget" ?
                {
                  "instType": this.tradeType == "spot" ? "SPOT" : "USDT-FUTURES",
                  "channel": "trade",
                  "instId": sym
                } :
                sym
        this._unsendSubscribe(topic);
      });
    }
  }

  subscribeOrderBook(symbol, localOrderBook, limit) {
    this.localOrderBook = localOrderBook
    this.orderBookLimit = limit

    var normalized = symbol.replace(/\W/g, "".toUpperCase());


    if (this.type == "valr") {
      if (this.tradeType === "futures") {
        normalized = symbol.replace(/\W/g, "").toUpperCase() + "PERP"
      }
      this._sendSubscribe({
        "type": "SUBSCRIBE",
        "subscriptions": [
          {
            "event": "OB_L1_D20_SNAPSHOT",
            "pairs":
              [normalized]

          }
        ]
      });
    }
    else if (this.type == "kucoin") {
      if (this.tradeType === "spot") {
        normalized = `/spotMarket/level2Depth50:${symbol}`
        this._sendSubscribe(normalized);
      } else {
        normalized = symbol.replace(/\W/g, "").toUpperCase() + "M"
        normalized = `/contractMarket/level2Depth50:${normalized}`
        this._sendSubscribe(normalized);
      }
    }
    else {
      const topic =
        this.type === "binance"
          ? `${normalized.toLowerCase()}@depth`
          : this.type === "bybit" ?
            `orderbook.1000.${normalized}`
            : this.type === "bitget" ?
              {
                "instType": this.tradeType == "spot" ? "SPOT" : "USDT-FUTURES",
                "channel": "books5",
                "instId": normalized
              } :
              normalized

      this._sendSubscribe(topic);
    }
  }

  unSubscribeOrderBook(symbol) {
    var normalized = symbol.replace(/\W/g, "".toUpperCase());
    if (this.type == "valr") {
      if (this.tradeType === "futures") {
        normalized = symbol.replace(/\W/g, "").toUpperCase() + "PERP"
      }
      this._unsendSubscribe({
        "type": "UNSUBSCRIBE",
        "subscriptions": [
          {
            "event": "OB_L1_D20_SNAPSHOT",
            "pairs":
              [normalized]

          }
        ]
      });
    } else {
      const topic =
        this.type === "binance"
          ? `${normalized.toLowerCase()}@depth`
          : this.type === "bybit" ?
            `orderbook.1000.${normalized}`
            : this.type === "bitget" ?
              {
                "instType": this.tradeType == "spot" ? "SPOT" : "USDT-FUTURES",
                "channel": "books5",
                "instId": normalized
              } :
              normalized

      this._unsendSubscribe(topic);
    }
  }


  ticker(callback) {
    if (typeof callback !== "function")
      throw new Error("callback must be function");
    this.callbacks.ticker.add(callback);
    return () => this.callbacks.ticker.delete(callback);
  }


  markettrade(callback) {
    if (typeof callback !== "function")
      throw new Error("callback must be function");
    this.callbacks.markettrade.add(callback);
    return () => this.callbacks.markettrade.delete(callback);
  }

  orderbook(callback) {
    if (typeof callback !== "function") return;
    this.callbacks.orderbook.add(callback);
    return () => this.callbacks.orderbook.delete(callback);
  }

  close() {
    try {
      if (this.ws) this.ws.close();
    } catch (_) { }
    this.ws = null;
    this.ready = false;
  }

  // --- Internal helpers ---

  _formatTime(dateInput) {
    if (!dateInput) return null;
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return null;

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  _sendSubscribe(topic) {
    console.log("🚀 ~ UniversalSocket ~ _sendSubscribe ~ topic:", topic)
    if (!this.ws || this.ws.readyState !== 1) return;
    try {
      if (this.type === "binance") {
        this.ws.send(
          JSON.stringify({ method: "SUBSCRIBE", params: [topic], id: Date.now() })
        );
      } else if (this.type === "bybit") {
        this.ws.send(JSON.stringify({ op: "subscribe", args: [topic] }));
      } else if (this.type === "bitget") {
        this.ws.send(JSON.stringify({ op: "subscribe", args: [topic] }));
      } else if (this.type === "valr") {
        this.ws.send(JSON.stringify(topic));
      } else if (this.type === "kucoin") {
        this.ws.send(JSON.stringify({
          "id": Date.now(),
          "type": "subscribe",
          "topic": topic,
          "response": true
        }));
      }
    } catch (_) { }
  }

  _unsendSubscribe(topic) {
    console.log("🚀 ~ UniversalSocket ~ _unsendSubscribe ~ topic:", topic)
    if (!this.ws || this.ws.readyState !== 1) return;
    try {
      if (this.type === "binance") {
        this.ws.send(
          JSON.stringify({ method: "UNSUBSCRIBE", params: [topic], id: Date.now() })
        );
      } else if (this.type === "bybit") {
        this.ws.send(JSON.stringify({ op: "unsubscribe", args: [topic] }));
      } else if (this.type === "bitget") {
        this.ws.send(JSON.stringify({ op: "unsubscribe", args: [topic] }));
      } else if (this.type === "valr") {
        this.ws.send(JSON.stringify(topic));
      } else if (this.type === "kucoin") {
        this.ws.send(JSON.stringify({
          "id": Date.now(),
          "type": "unsubscribe",
          "topic": topic,
          "response": true
        }));
      }
    } catch (_) { }
  }

  _onMessage(raw) {
    let data;
    try {
      data = JSON.parse(raw);
    } catch (_) {
      return;
    }

    if (this.type === "binance" && data?.e === "depthUpdate") {

      // Create empty orderbook if not exists
      if (!this.localOrderBook) {
        this.localOrderBook = {
          bids: [],
          asks: [],
          lastUpdateId: 0
        };
      }

      const ob = this.localOrderBook;

      const U = data.U;
      const u = data.u;

      // If first time receiving update → just set lastUpdateId and continue
      if (ob.lastUpdateId === 0) {
        ob.lastUpdateId = u;
      }

      // Ignore old updates
      if (u <= ob.lastUpdateId) return;

      // ---------- APPLY BIDS ----------
      data.b.forEach(([price, qty]) => {
        if (Number(qty) === 0) {
          ob.bids = ob.bids.filter(([p]) => p !== price);
        } else {
          const idx = ob.bids.findIndex(([p]) => p === price);
          if (idx >= 0) ob.bids[idx] = [price, qty];
          else ob.bids.push([price, qty]);
        }
      });

      // ---------- APPLY ASKS ----------
      data.a.forEach(([price, qty]) => {
        if (Number(qty) === 0) {
          ob.asks = ob.asks.filter(([p]) => p !== price);
        } else {
          const idx = ob.asks.findIndex(([p]) => p === price);
          if (idx >= 0) ob.asks[idx] = [price, qty];
          else ob.asks.push([price, qty]);
        }
      });

      // Sort orderbook
      ob.bids.sort((a, b) => Number(b[0]) - Number(a[0]));
      ob.asks.sort((a, b) => Number(a[0]) - Number(b[0]));

      ob.lastUpdateId = u;

      // Emit updated depth
      this._emit("orderbook", {
        bids: ob.bids.slice(0, this.orderBookLimit),
        asks: ob.asks.slice(0, this.orderBookLimit)
      });
    }

    // Binance format
    if (this.type === "binance" && data.e === "24hrTicker") {
      const normalized = {
        exchange: "binance",
        symbol: data?.s,
        price: Number(data?.c),
        high: Number(data?.h),
        low: Number(data?.l),
        open: Number(data?.o),
        volumebase: Number(data?.v)?.toFixed(2),
        volumequote: Number(data?.q)?.toFixed(2),
        changePercent: (Number(data?.P))?.toFixed(2),
      };
      this._emit("ticker", normalized);
      return;
    }

    if (this.type === "binance" && data.e === "trade") {
      const normalized = {
        exchange: "binance",
        symbol: data?.s,
        price: Number(data?.p),
        quantity: Number(data?.q),
        marketMaker: data?.m, // is true then show red if false then show green
        TradeTime: this._formatTime(data?.T),
        Eventtime: this._formatTime(data?.T),
        tradeId: data?.t,
      };
      this._emit("markettrade", [normalized]);
      return;
    }

    // Bybit format
    if (this.type === "bybit" && typeof data.topic === "string" && data.topic.startsWith("tickers.")) {
      const d = data.data;
      const payload = Array.isArray(d) ? d[0] : d;
      const normalized = {
        exchange: "bybit",

        symbol: payload?.symbol,
        price: Number(payload?.lastPrice),
        high: Number(payload?.highPrice24h),
        low: Number(payload?.lowPrice24h),
        volumebase: Number(payload?.volume24h)?.toFixed(2),
        volumequote: Number(payload?.turnover24h)?.toFixed(2),
        changePercent: (Number(payload?.price24hPcnt) * 100)?.toFixed(2),
      };
      if (normalized?.price) {
        this._emit("ticker", normalized);
      }
      return;
    }

    if (this.type === "bybit" && typeof data.topic === "string" && data.topic.startsWith("publicTrade.")) {
      const d = data.data;
      const payload = Array.isArray(d) ? d[0] : d;
      const normalized = {
        exchange: "bybit",
        symbol: payload?.s,
        price: Number(payload?.p),
        quantity: Number(payload?.v),
        marketMaker: payload?.S === "Buy" ? false : true, // is true then show red if false then show green
        TradeTime: this._formatTime(payload?.T),
        Eventtime: this._formatTime(payload?.E),
        tradeId: payload?.i,

      };
      if (normalized?.price) {
        this._emit("markettrade", [normalized]);
      }
      return;
    }

    if (this.type === "bybit" && typeof data.topic === "string" && data.topic.startsWith("orderbook.")) {

      // Create orderbook if first time
      if (!this.localOrderBook) {
        this.localOrderBook = {
          bids: [],
          asks: [],
          lastUpdateId: 0
        };
      }

      const ob = this.localOrderBook;

      const updateId = data?.data?.u; // Bybit update ID

      // First update → just set last id
      if (ob.lastUpdateId === 0) {
        ob.lastUpdateId = updateId;
      }

      // Ignore out-of-order updates
      if (updateId <= ob.lastUpdateId) return;

      // ---------- APPLY BIDS ----------
      data?.data?.b.forEach(([price, qty]) => {
        if (Number(qty) === 0) {
          ob.bids = ob.bids.filter(([p]) => p !== price);
        } else {
          const idx = ob.bids.findIndex(([p]) => p === price);
          if (idx >= 0) ob.bids[idx] = [price, qty];
          else ob.bids.push([price, qty]);
        }
      });

      // ---------- APPLY ASKS ----------
      data?.data?.a.forEach(([price, qty]) => {
        if (Number(qty) === 0) {
          ob.asks = ob.asks.filter(([p]) => p !== price);
        } else {
          const idx = ob.asks.findIndex(([p]) => p === price);
          if (idx >= 0) ob.asks[idx] = [price, qty];
          else ob.asks.push([price, qty]);
        }
      });

      // Sort orderbook
      ob.bids.sort((a, b) => Number(b[0]) - Number(a[0])); // high → low
      ob.asks.sort((a, b) => Number(a[0]) - Number(b[0])); // low → high

      // Update last id
      ob.lastUpdateId = updateId;

      // Emit updated orderbook
      this._emit("orderbook", {
        bids: ob.bids.slice(0, this.orderBookLimit),
        asks: ob.asks.slice(0, this.orderBookLimit)
      });
    }

    // Biget format
    if (this.type === "bitget" && data?.action == "snapshot" && data?.arg?.channel == "ticker") {
      const d = data.data;
      const payload = Array.isArray(d) ? d[0] : d;

      const normalized = {
        exchange: "bitget",

        symbol: payload?.instId,
        price: Number(payload?.lastPr),
        changePercent: (Number(payload?.change24h) * 100)?.toFixed(2),
        high: Number(payload?.high24h),
        low: Number(payload?.low24h),
        open: Number(payload?.open24h),
        volumebase: Number(payload?.baseVolume)?.toFixed(2),
        volumequote: Number(payload?.quoteVolume)?.toFixed(2),

      };
      this._emit("ticker", normalized);
      return;
    }

    // Biget format
    if (this.type === "bitget" && data?.action == "update" && data?.arg?.channel == "trade") {
      const d = data.data;
      // const payload = Array.isArray(d) ? d[0] : d;
      var normalized = []
      for (let i = 0; i < d.length; i++) {
        const payload = d[i];
        var normalizedObj = {
          exchange: "bitget",
          symbol: data?.arg?.instId,
          price: Number(payload?.price),
          quantity: Number(payload?.size),
          marketMaker: payload?.side === "buy" ? false : true, // is true then show red if false then show green
          TradeTime: this._formatTime(Number(payload?.ts)),
          Eventtime: this._formatTime(Number(payload?.ts)),
          tradeId: payload?.tradeId,

        };

        normalized.push(normalizedObj)
      }

      this._emit("markettrade", normalized);
      return;
    }
    if (this.type === "bitget" && data?.arg?.channel === "books5") {

      const update = data.data?.[0];
      if (!update) return;

      // Create orderbook if not exists
      if (!this.localOrderBook) {
        this.localOrderBook = {
          bids: [],
          asks: []
        };
      }

      const ob = this.localOrderBook;

      // Bitget books5 = always full top-N snapshot ✔
      ob.bids = update.bids;
      ob.asks = update.asks;

      // Sort orderbook correctly
      ob.bids.sort((a, b) => Number(b[0]) - Number(a[0])); // high → low
      ob.asks.sort((a, b) => Number(a[0]) - Number(b[0])); // low → high

      this._emit("orderbook", {
        bids: ob.bids.slice(0, this.orderBookLimit),
        asks: ob.asks.slice(0, this.orderBookLimit)
      });
    }

    if (this.type === "valr" && data?.type == "MARKET_SUMMARY_UPDATE") {
      const d = data.data;
      const payload = d

      const normalized = {
        exchange: "valr",

        symbol: payload?.currencyPairSymbol,
        price: Number(payload?.lastTradedPrice),
        markPrice: Number(payload?.markPrice),
        changePercent: (Number(payload?.changeFromPrevious))?.toFixed(2),
        high: Number(payload?.highPrice),
        low: Number(payload?.lowPrice),
        volumebase: Number(payload?.baseVolume)?.toFixed(2),
        volumequote: Number(payload?.quoteVolume)?.toFixed(2),
      };
      this._emit("ticker", normalized);
      return;
    }

    if (this.type === "valr" && data?.type == "NEW_TRADE") {
      const d = data.data;
      const payload = d
      const normalized = {
        exchange: "valr",

        symbol: payload?.currencyPair,
        price: Number(payload?.price),
        quantity: Number(payload?.quantity),
        marketMaker: payload?.takerSide === "buy" ? false : true, // is true then show red if false then show green
        TradeTime: payload?.tradedAt?.split('T')[1]?.split('.')[0],
        Eventtime: payload?.tradedAt?.split('T')[1]?.split('.')[0],
        tradeId: payload?.id,
      };
      this._emit("markettrade", [normalized]);
      return;

    }

    if (this.type === "valr" && data?.type === "OB_L1_D20_SNAPSHOT") {

      const obData = data.d;
      if (!obData) return;

      // Initialize orderbook if needed
      if (!this.localOrderBook) {
        this.localOrderBook = {
          bids: [],
          asks: [],
          lastUpdateId: 0
        };
      }

      const ob = this.localOrderBook;

      // Replace entire book (top 20)
      ob.bids = obData.b;   // [["96887","0.05"], ...]
      ob.asks = obData.a;

      // Sort the data to be safe
      ob.bids.sort((a, b) => Number(b[0]) - Number(a[0]));   // high → low
      ob.asks.sort((a, b) => Number(a[0]) - Number(b[0]));   // low → high

      // Update sequence using timestamp (optional)
      ob.lastUpdateId = obData.lc;

      // Emit the updated book
      this._emit("orderbook", {
        bids: ob.bids.slice(0, this.orderBookLimit),
        asks: ob.asks.slice(0, this.orderBookLimit)
      });
    }

    if (this.type === "kucoin" && data?.subject == "trade.snapshot") {
      const payload = data.data?.data?.marketChange24h;
      // const payload = Array.isArray(d) ? d[0] : d;
      const normalized = {
        exchange: "kucoin",

        symbol: data.data?.data?.symbol,
        price: Number(data.data?.data?.close),
        high: Number(payload?.high),
        low: Number(payload?.low),
        open: Number(payload?.open),
        volumebase: Number(payload?.vol)?.toFixed(2),
        volumequote: Number(payload?.volValue)?.toFixed(2),
        changePercent: (Number(payload?.changeRate) * 100)?.toFixed(2),
      };
      if (normalized?.price) {
        this._emit("ticker", normalized);
      }
      return;
    }

    if (this.type === "kucoin" && data?.subject == "snapshot.24h") {
      const payload = data.data;
      // const payload = Array.isArray(d) ? d[0] : d;
      const normalized = {
        exchange: "kucoin",

        symbol: payload?.symbol,
        price: Number(payload?.lastPrice),
        high: Number(payload?.highPrice),
        low: Number(payload?.lowPrice),
        volumebase: Number(payload?.volume)?.toFixed(2),
        volumequote: Number(payload?.turnover)?.toFixed(2),
        changePercent: (Number(payload?.priceChgPct) * 100)?.toFixed(2),
      };
      if (normalized?.price) {
        this._emit("ticker", normalized);
      }
      return;
    }

    if (this.type === "kucoin" && data?.subject == "trade.l3match") {
      const d = data.data;
      // const payload = Array.isArray(d) ? d[0] : d;
      var normalized = []
      // for (let i = 0; i < d.length; i++) {
      const payload = d
      var normalizedObj = {
        exchange: "kucion",
        symbol: payload?.symbol,
        price: Number(payload?.price),
        quantity: Number(payload?.size),
        marketMaker: payload?.side === "buy" ? false : true, // is true then show red if false then show green
        TradeTime: this._formatTime(Number(payload?.time) / 1e6),
        Eventtime: this._formatTime(Number(payload?.time) / 1e6),
        tradeId: payload?.tradeId,
        takerOrderId: payload?.takerOrderId,
        makerOrderId: payload?.makerOrderId,
        sequence: payload?.sequence
      };

      normalized.push(normalizedObj)
      // }

      this._emit("markettrade", normalized);
      return;
    }

    if (this.type === "kucoin" && data?.subject == "match") {
      const d = data.data;
      // const payload = Array.isArray(d) ? d[0] : d;
      var normalized = []
      // for (let i = 0; i < d.length; i++) {
      const payload = d
      var normalizedObj = {
        exchange: "kucion",
        symbol: payload?.symbol,
        price: Number(payload?.price),
        quantity: Number(payload?.size),
        marketMaker: payload?.side === "buy" ? false : true, // is true then show red if false then show green
        TradeTime: this._formatTime(Number(payload?.ts) / 1e6),
        Eventtime: this._formatTime(Number(payload?.ts) / 1e6),
        tradeId: payload?.tradeId,
        takerOrderId: payload?.takerOrderId,
        makerOrderId: payload?.makerOrderId,
        sequence: payload?.sequence
      };

      normalized.push(normalizedObj)
      // }

      this._emit("markettrade", normalized);
      return;
    }

    if (
      this.type === "kucoin" &&
      data?.topic?.includes("level2Depth50") &&
      data.type === "message"
    ) {

      const obData = data.data;
      if (!obData) return;

      // Initialize if needed
      if (!this.localOrderBook) {
        this.localOrderBook = {
          bids: [],
          asks: [],
          lastUpdateId: 0
        };
      }

      const ob = this.localOrderBook;

      // Replace full top-50
      ob.bids = obData.bids;
      ob.asks = obData.asks;

      // Sort for safety
      ob.bids.sort((a, b) => Number(b[0]) - Number(a[0])); // high → low
      ob.asks.sort((a, b) => Number(a[0]) - Number(b[0])); // low → high

      // Use timestamp as lastUpdateId
      ob.lastUpdateId = obData.timestamp;

      // Emit limited depth
      this._emit("orderbook", {
        bids: ob.bids.slice(0, this.orderBookLimit),
        asks: ob.asks.slice(0, this.orderBookLimit)
      });
    }

  }

  _emit(type, data) {
    const cbs = this.callbacks[type];
    if (!cbs) return;
    for (const cb of cbs) {
      try {
        cb(data);
      } catch (_) { }
    }
  }
}
