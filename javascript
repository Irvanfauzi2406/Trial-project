            state.ws.onerror = () => {
                document.getElementById('connectionStatus').textContent = 'Error';
                document.getElementById('connectionStatus').className = 'text-[var(--danger)]';
                document.getElementById('liveIndicator').style.background = 'var(--danger)';
            };

            state.ws.onclose = () => {
                document.getElementById('connectionStatus').textContent = 'Reconnecting...';
                document.getElementById('connectionStatus').className = 'text-[var(--warning)]';
                // Attempt reconnect
                setTimeout(() => connectWebSocket(state.currentSymbol, state.timeframe), 3000);
            };

            // Ticker WebSocket for 24h stats
            state.tickerWs = new WebSocket(`${BINANCE_WS}/${tickerStream}`);
            state.tickerWs.onmessage = (event) => {
                const data = JSON.parse(event.data);
                updateTickerUI(data);
            };
        }

        function handleKlineUpdate(kline) {
            const newCandle = {
                openTime: kline.t,
                open: parseFloat(kline.o),
                high: parseFloat(kline.h),
                low: parseFloat(kline.l),
                close: parseFloat(kline.c),
                volume: parseFloat(kline.v),
                closeTime: kline.T
            };

            state.currentPrice = newCandle.close;

            // Update or add candle
            const lastCandle = state.candles[state.candles.length - 1];
            if (lastCandle && lastCandle.openTime === newCandle.openTime) {
                // Update existing candle
                state.candles[state.candles.length - 1] = newCandle;
            } else {
                // Add new candle
                state.candles.push(newCandle);
                if (state.candles.length > 100) state.candles.shift();
            }

            drawChart();
            updatePriceDisplay();
            document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString();
        }

        function updateTickerUI(data) {
            const changePercent = parseFloat(data.P);
            const priceChangeEl = document.getElementById('priceChange');
            
            priceChangeEl.textContent = (changePercent >= 0 ? '+' : '') + changePercent.toFixed(2) + '%';
            priceChangeEl.className = changePercent >= 0 ? 'text-[var(--success)] mono text-sm' : 'text-[var(--danger)] mono text-sm';

            document.getElementById('high24h').textContent = '$' + parseFloat(data.h).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            document.getElementById('low24h').textContent = '$' + parseFloat(data.l).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            document.getElementById('volume24h').textContent = parseFloat(data.v).toLocaleString('en-US', { maximumFractionDigits: 0 });
            document.getElementById('tradeCount').textContent = parseInt(data.n).toLocaleString();
        }

        function updatePriceDisplay() {
            const price = state.currentPrice;
            if (!price) return;

            document.getElementById('currentPrice').textContent = '$' + price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            document.getElementById('entryPrice').textContent = '$' + price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            
            // Update position sizes and PnL
            updatePositionPnL();
        }

        // ==================== CHART DRAWING ====================
        const canvas = document.getElementById('chartCanvas');
        const ctx = canvas.getContext('2d');

        function resizeCanvas() {
            const container = canvas.parentElement;
            const dpr = window.devicePixelRatio || 1;
            canvas.width = container.clientWidth * dpr;
            canvas.height = container.clientHeight * dpr;
            canvas.style.width = container.clientWidth + 'px';
            canvas.style.height = container.clientHeight + 'px';
            ctx.scale(dpr, dpr);
        }

        function drawChart() {
            const width = canvas.clientWidth;
            const height = canvas.clientHeight;
            
            ctx.clearRect(0, 0, width, width);

            if (state.candles.length === 0) return;

            const padding = { top: 20, right: 70, bottom: 30, left: 10 };
            const chartWidth = width - padding.left - padding.right;
            const chartHeight = height - padding.top - padding.bottom;

            // Calculate price range
            let minPrice = Math.min(...state.candles.map(c => c.low));
            let maxPrice = Math.max(...state.candles.map(c => c.high));
            const priceRange = maxPrice - minPrice;
            const pricePadding = priceRange * 0.1;
            minPrice -= pricePadding;
            maxPrice += pricePadding;

            // Draw grid
            ctx.strokeStyle = 'rgba(42, 53, 72, 0.5)';
            ctx.lineWidth = 1;
            
            for (let i = 0; i <= 5; i++) {
                const y = padding.top + (chartHeight / 5) * i;
                ctx.beginPath();
                ctx.moveTo(padding.left, y);
                ctx.lineTo(width - padding.right, y);
                ctx.stroke();

                const price = maxPrice - ((maxPrice - minPrice) / 5) * i;
                ctx.fillStyle = '#64748b';
                ctx.font = '11px JetBrains Mono';
                ctx.textAlign = 'left';
                ctx.fillText(formatPrice(price), width - padding.right + 5, y + 4);
            }

            // Candle width
            const candleWidth = Math.max(2, (chartWidth / state.candles.length) - 2);
            const candleSpacing = chartWidth / state.candles.length;

            // Draw candles
            state.candles.forEach((candle, i) => {
                const x = padding.left + candleSpacing * i + candleSpacing / 2;
                
                const yOpen = padding.top + ((maxPrice - candle.open) / (maxPrice - minPrice)) * chartHeight;
                const yClose = padding.top + ((maxPrice - candle.close) / (maxPrice - minPrice)) * chartHeight;
                const yHigh = padding.top + ((maxPrice - candle.high) / (maxPrice - minPrice)) * chartHeight;
                const yLow = padding.top + ((maxPrice - candle.low) / (maxPrice - minPrice)) * chartHeight;

                const isGreen = candle.close >= candle.open;
                const color = isGreen ? '#22c55e' : '#ef4444';

                // Draw wick
                ctx.strokeStyle = color;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(x, yHigh);
                ctx.lineTo(x, yLow);
                ctx.stroke();

                // Draw body
                const bodyHeight = Math.max(1, Math.abs(yClose - yOpen));
                const bodyY = Math.min(yOpen, yClose);

                ctx.fillStyle = color;
                ctx.fillRect(x - candleWidth / 2, bodyY, candleWidth, bodyHeight);

                // Glow for recent candles
                if (i > state.candles.length - 3) {
                    ctx.shadowColor = color;
                    ctx.shadowBlur = 6;
                    ctx.fillRect(x - candleWidth / 2, bodyY, candleWidth, bodyHeight);
                    ctx.shadowBlur = 0;
                }
            });

            // Current price line
            if (state.currentPrice) {
                const currentY = padding.top + ((maxPrice - state.currentPrice) / (maxPrice - minPrice)) * chartHeight;
                
                ctx.strokeStyle = '#00d4aa';
                ctx.lineWidth = 1;
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.moveTo(padding.left, currentY);
                ctx.lineTo(width - padding.right, currentY);
                ctx.stroke();
                ctx.setLineDash([]);

                ctx.fillStyle = '#00d4aa';
                ctx.fillRect(width - padding.right, currentY - 10, 60, 20);
                ctx.fillStyle = '#0a0e17';
                ctx.font = 'bold 10px JetBrains Mono';
                ctx.textAlign = 'left';
                ctx.fillText(formatPrice(state.currentPrice), width - padding.right + 4, currentY + 4);
            }
        }

        function formatPrice(price) {
            if (price >= 1000) return (price / 1000).toFixed(1) + 'K';
            if (price >= 1) return price.toFixed(2);
            return price.toFixed(4);
        }

        // ==================== AI AGENT LOGIC ====================
        function runAIAnalysis() {
            if (state.candles.length < 10) return;

            const recentCandles = state.candles.slice(-10);
            const closes = recentCandles.map(c => c.close);
            
            // Simple Moving Average calculation
            const sma5 = closes.slice(-5).reduce((a, b) => a + b, 0) / 5;
            const sma10 = closes.reduce((a, b) => a + b, 0) / 10;
            const currentPrice = closes[closes.length - 1];

            let signal = 'hold';
            let confidence = 50;
            let analysis = '';

            // Trend detection
            if (sma5 > sma10 && currentPrice > sma5) {
                signal = 'buy';
                confidence = 70 + Math.random() * 20;
                analysis = `Bullish trend detected. SMA(5) ${formatPrice(sma5)} > SMA(10) ${formatPrice(sma10)}. Price momentum strong. Recommending LONG position.`;
            } else if (sma5 < sma10 && currentPrice < sma5) {
                signal = 'sell';
                confidence = 70 + Math.random() * 20;
                analysis = `Bearish trend detected. SMA(5) ${formatPrice(sma5)} < SMA(10) ${formatPrice(sma10)}. Downward pressure increasing. Recommending SHORT position.`;
            } else {
                confidence = 50 + Math.random() * 20;
                analysis = `Market consolidating. SMA values converging. Waiting for clear breakout direction. Current risk/reward unfavorable.`;
            }

            // Update UI
            const signalEl = document.getElementById('aiSignal');
            signalEl.className = `signal-badge signal-${signal}`;
            signalEl.textContent = signal.toUpperCase();

            document.getElementById('aiAnalysis').textContent = analysis;
            document.getElementById('confidence').textContent = Math.round(confidence) + '%';

            const riskEl = document.getElementById('riskLevel');
            if (confidence >= 80) {
                riskEl.textContent = 'LOW';
                riskEl.className = 'text-2xl font-bold text-[var(--success)] mono';
            } else if (confidence >= 60) {
                riskEl.textContent = 'MED';
                riskEl.className = 'text-2xl font-bold text-[var(--warning)] mono';
            } else {
                riskEl.textContent = 'HIGH';
                riskEl.className = 'text-2xl font-bold text-[var(--danger)] mono';
            }

            return { signal, confidence };
        }

        function executeAITrade() {
            if (state.aiRunning || !state.currentPrice) return;
            
            state.aiRunning = true;
            const btn = document.getElementById('aiExecuteBtn');
            btn.innerHTML = `
                <svg class="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
                    <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/>
                </svg>
                Analyzing...
            `;

            setTimeout(() => {
                const result = runAIAnalysis();
                
                if (result && result.signal !== 'hold') {
                    const tradeAmount = (Math.random() * 0.05 + 0.01).toFixed(4);
                    
                    const newTrade = {
                        id: Date.now(),
                        time: new Date().toLocaleTimeString('en-US', { hour12: false }),
                        asset: state.currentAsset,
                        type: result.signal,
                        amount: parseFloat(tradeAmount),
                        price: state.currentPrice,
                        ai: true
                    };
                    
                    state.tradeHistory.unshift(newTrade);
                    renderTradeHistory();

                    if (result.signal === 'buy') {
                        const newPosition = {
                            id: Date.now(),
                            asset: state.currentAsset,
                            type: 'long',
                            size: parseFloat(tradeAmount),
                            entry: state.currentPrice,
                            current: state.currentPrice,
                            pnl: 0,
                            pnlPercent: 0
                        };
                        state.positions.push(newPosition);
                        renderPositions();
                    }

                    showToast(
                        'AI Trade Executed',
                        `${result.signal.toUpperCase()} ${tradeAmount} ${state.currentAsset} @ $${state.currentPrice.toLocaleString()}`,
                        result.signal === 'buy' ? 'success' : 'danger'
                    );
                } else {
                    showToast('AI Decision', 'Holding position - market conditions unclear', 'warning');
                }

                btn.innerHTML = `
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                    Execute AI Trade
                `;
                state.aiRunning = false;
            }, 1500);
        }

        // ==================== TRADING FUNCTIONS ====================
        function submitTrade() {
            const amount = parseFloat(document.getElementById('tradeAmount').value) || 0;
            if (amount <= 0 || !state.currentPrice) {
                showToast('Invalid Amount', 'Please enter a valid trade amount', 'error');
                return;
            }

            const tradeSize = amount / state.currentPrice;

            const newTrade = {
                id: Date.now(),
                time: new Date().toLocaleTimeString('en-US', { hour12: false }),
                asset: state.currentAsset,
                type: state.tradeType,
                amount: parseFloat(tradeSize.toFixed(6)),
                price: state.currentPrice,
                ai: false
            };

            state.tradeHistory.unshift(newTrade);
            renderTradeHistory();

            if (state.tradeType === 'buy') {
                const newPosition = {
                    id: Date.now(),
                    asset: state.currentAsset,
                    type: 'long',
                    size                    size: parseFloat(tradeSize.toFixed(6)),
                    entry: state.currentPrice,
                    current: state.currentPrice,
                    pnl: 0,
                    pnlPercent: 0
                };
                state.positions.push(newPosition);
                renderPositions();
            }

            showToast(
                'Order Placed',
                `${state.tradeType.toUpperCase()} ${tradeSize.toFixed(6)} ${state.currentAsset} @ $${state.currentPrice.toLocaleString()}`,
                state.tradeType === 'buy' ? 'success' : 'danger'
            );
        }

        function updatePositionPnL() {
            if (!state.currentPrice) return;

            state.positions.forEach(pos => {
                if (pos.asset === state.currentAsset) {
                    pos.current = state.currentPrice;
                    const diff = pos.current - pos.entry;
                    pos.pnl = diff * pos.size;
                    pos.pnlPercent = (diff / pos.entry) * 100;
                }
            });
            renderPositions();
        }

        function closePosition(id) {
            const posIndex = state.positions.findIndex(p => p.id === id);
            if (posIndex === -1) return;

            const pos = state.positions[posIndex];
            
            // Add closing trade to history
            const closeTrade = {
                id: Date.now(),
                time: new Date().toLocaleTimeString('en-US', { hour12: false }),
                asset: pos.asset,
                type: 'sell',
                amount: pos.size,
                price: state.currentPrice,
                ai: false
            };
            state.tradeHistory.unshift(closeTrade);

            // Remove position
            state.positions.splice(posIndex, 1);
            
            renderPositions();
            renderTradeHistory();

            showToast('Position Closed', `Realized PnL: ${pos.pnl >= 0 ? '+' : ''}$${pos.pnl.toFixed(2)}`, pos.pnl >= 0 ? 'success' : 'danger');
        }

        function setMaxAmount() {
            document.getElementById('tradeAmount').value = 10000;
            state.amount = 10000;
            updateTradeCalculations();
        }

        function updateTradeCalculations() {
            const posSize = state.amount * state.leverage;
            document.getElementById('positionSize').textContent = '$' + posSize.toLocaleString();
            
            if (state.currentPrice) {
                const liqPrice = state.tradeType === 'buy' 
                    ? state.currentPrice * (1 - 0.9 / state.leverage)
                    : state.currentPrice * (1 + 0.9 / state.leverage);
                document.getElementById('liqPrice').textContent = '$' + liqPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            }
        }

        // ==================== UI RENDERING ====================
        function renderPositions() {
            const container = document.getElementById('positionsList');
            if (state.positions.length === 0) {
                container.innerHTML = '<div class="p-4 text-center text-[var(--text-muted)] text-sm">No open positions</div>';
                document.getElementById('positionCount').textContent = '0 active';
                return;
            }

            container.innerHTML = state.positions.map(pos => `
                <div class="trade-item">
                    <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center gap-2">
                            <span class="text-xs font-semibold px-2 py-1 rounded ${pos.type === 'long' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}">
                                ${pos.type.toUpperCase()}
                            </span>
                            <span class="font-medium">${pos.asset}</span>
                        </div>
                        <button class="text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors" onclick="closePosition(${pos.id})">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"/>
                                <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                        </button>
                    </div>
                    <div class="flex justify-between text-sm">
                        <span class="text-[var(--text-muted)]">Size: ${pos.size.toFixed(4)}</span>
                        <span class="mono ${pos.pnl >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}">
                            ${pos.pnl >= 0 ? '+' : ''}$${pos.pnl.toFixed(2)}
                        </span>
                    </div>
                    <div class="flex justify-between text-xs text-[var(--text-muted)] mt-1">
                        <span>Entry: $${pos.entry.toLocaleString()}</span>
                        <span class="${pos.pnlPercent >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}">
                            ${pos.pnlPercent >= 0 ? '+' : ''}${pos.pnlPercent.toFixed(2)}%
                        </span>
                    </div>
                </div>
            `).join('');

            document.getElementById('positionCount').textContent = state.positions.length + ' active';
        }

        function renderTradeHistory() {
            const container = document.getElementById('tradeHistoryList');
            if (state.tradeHistory.length === 0) {
                container.innerHTML = '<div class="p-4 text-center text-[var(--text-muted)] text-sm">No trade history</div>';
                document.getElementById('totalTrades').textContent = '0 trades';
                return;
            }

            container.innerHTML = state.tradeHistory.map(trade => `
                <div class="trade-item">
                    <div class="flex items-center justify-between mb-1">
                        <div class="flex items-center gap-2">
                            <span class="text-xs font-semibold px-2 py-0.5 rounded ${trade.type === 'buy' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}">
                                ${trade.type.toUpperCase()}
                            </span>
                            <span class="font-medium text-sm">${trade.asset}</span>
                            ${trade.ai ? '<span class="text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent)]/20 text-[var(--accent)]">AI</span>' : ''}
                        </div>
                        <span class="text-xs text-[var(--text-muted)] mono">${trade.time}</span>
                    </div>
                    <div class="flex justify-between text-sm">
                        <span class="text-[var(--text-muted)]">${trade.amount.toFixed(4)} @ $${trade.price.toLocaleString()}</span>
                    </div>
                </div>
            `).join('');

            document.getElementById('totalTrades').textContent = state.tradeHistory.length + ' trades';
        }

        // ==================== TOAST NOTIFICATION ====================
        function showToast(title, message, type = 'success') {
            const toast = document.getElementById('toast');
            const iconEl = document.getElementById('toastIcon');
            
            const icons = {
                success: `<div class="w-10 h-10 rounded-full bg-[var(--success)]/20 flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"/>
                    </svg>
                </div>`,
                danger: `<div class="w-10 h-10 rounded-full bg-[var(--danger)]/20 flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </div>`,
                warning: `<div class="w-10 h-10 rounded-full bg-[var(--warning)]/20 flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                        <line x1="12" y1="9" x2="12" y2="13"/>
                        <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                </div>`,
                error: `<div class="w-10 h-10 rounded-full bg-[var(--danger)]/20 flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="15" y1="9" x2="9" y2="15"/>
                        <line x1="9" y1="9" x2="15" y2="15"/>
                    </svg>
                </div>`
            };

            iconEl.innerHTML = icons[type] || icons.success;
            document.getElementById('toastTitle').textContent = title;
            document.getElementById('toastMessage').textContent = message;

            toast.classList.remove('translate-y-20', 'opacity-0');
            toast.classList.add('translate-y-0', 'opacity-100');

            setTimeout(() => {
                toast.classList.add('translate-y-20', 'opacity-0');
                toast.classList.remove('translate-y-0', 'opacity-100');
            }, 4000);
        }

        // ==================== EVENT LISTENERS ====================
        function setupEventListeners() {
            // Asset selector
            document.querySelectorAll('.asset-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    document.querySelectorAll('.asset-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    
                    state.currentSymbol = btn.dataset.symbol;
                    state.currentAsset = btn.dataset.asset;
                    
                    document.getElementById('assetName').textContent = btn.dataset.asset + '/USDT';
                    document.getElementById('submitTradeBtn').textContent = (state.tradeType === 'buy' ? 'Buy ' : 'Sell ') + btn.dataset.asset;

                    // Reconnect WebSocket and fetch new data
                    fetchKlines(state.currentSymbol, state.timeframe);
                    fetch24hrTicker(state.currentSymbol);
                    connectWebSocket(state.currentSymbol, state.timeframe);
                });
            });

            // Timeframe selector
            document.querySelectorAll('.timeframe-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    document.querySelectorAll('.timeframe-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    
                    state.timeframe = btn.dataset.tf;
                    fetchKlines(state.currentSymbol, state.timeframe);
                    connectWebSocket(state.currentSymbol, state.timeframe);
                });
            });

            // Trade type toggle
            document.querySelectorAll('.trade-type-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    document.querySelectorAll('.trade-type-btn').forEach(b => {
                        b.classList.remove('active-buy', 'active-sell');
                    });
                    
                    state.tradeType = btn.dataset.type;
                    btn.classList.add(state.tradeType === 'buy' ? 'active-buy' : 'active-sell');
                    
                    const submitBtn = document.getElementById('submitTradeBtn');
                    submitBtn.textContent = (state.tradeType === 'buy' ? 'Buy ' : 'Sell ') + state.currentAsset;
                    submitBtn.className = `w-full py-4 rounded-xl font-semibold text-lg transition-all ${state.tradeType === 'buy' ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg hover:shadow-green-500/30' : 'bg-gradient-to-r from-red-500 to-rose-600 text-white hover:shadow-lg hover:shadow-red-500/30'}`;
                });
            });

            // Leverage selector
            document.querySelectorAll('.leverage-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    document.querySelectorAll('.leverage-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    state.leverage = parseInt(btn.dataset.lev);
                    updateTradeCalculations();
                });
            });

            // Amount input
            document.getElementById('tradeAmount').addEventListener('input', (e) => {
                state.amount = parseFloat(e.target.value) || 0;
                updateTradeCalculations();
            });

            // Submit trade
            document.getElementById('submitTradeBtn').addEventListener('click', submitTrade);

            // AI execute button
            document.getElementById('aiExecuteBtn').addEventListener('click', executeAITrade);

            // AI stop button
            document.getElementById('aiStopBtn').addEventListener('click', () => {
                showToast('AI Stopped', 'Autonomous trading paused', 'warning');
            });

            // Window resize
            window.addEventListener('resize', () => {
                resizeCanvas();
                drawChart();
            });
        }

        // ==================== INITIALIZATION ====================
        async function init() {
            // Setup canvas
            resizeCanvas();
            
            // Initial UI setup
            renderPositions();
            renderTradeHistory();
            setupEventListeners();

            // Fetch initial data
            await fetchKlines(state.currentSymbol, state.timeframe);
            await fetch24hrTicker(state.currentSymbol);

            // Connect WebSocket
            connectWebSocket(state.currentSymbol, state.timeframe);

            // Run initial AI analysis
            setTimeout(runAIAnalysis, 2000);
            
            // Periodic AI analysis
            setInterval(runAIAnalysis, 30000);

            console.log('Openclaw AI Trading Terminal initialized with Live Data');
        }

        // Start
        document.addEventListener('DOMContentLoaded', init);
    </script>
</body>
</html>
