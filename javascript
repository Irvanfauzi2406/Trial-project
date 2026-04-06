entry: 67000, current: 67432.50, pnl: 216.25, pnlPercent: 0.64 },
                { id: 2, asset: 'ETH', type: 'short', size: 2.5, entry: 3500, current: 3456.78, pnl: 108.05, pnlPercent: 1.23 }
            ];
        }

        // Initialize trade history
        function initTradeHistory() {
            state.tradeHistory = [
                { id: 1, time: '14:32:05', asset: 'BTC', type: 'buy', amount: 0.05, price: 67150, ai: true },
                { id: 2, time: '14:28:12', asset: 'ETH', type: 'sell', amount: 1.2, price: 3480, ai: false },
                { id: 3, time: '14:15:33', asset: 'BTC', type: 'buy', amount: 0.02, price: 66890, ai: true },
                { id: 4, time: '13:58:21', asset: 'SOL', type: 'sell', amount: 5.5, price: 182, ai: false },
                { id: 5, time: '13:42:10', asset: 'BTC', type: 'sell', amount: 0.03, price: 67200, ai: true },
                { id: 6, time: '13:30:45', asset: 'ETH', type: 'buy', amount: 0.8, price: 3420, ai: false }
            ];
        }

        // ==================== CHART DRAWING ====================
        const canvas = document.getElementById('chartCanvas');
        const ctx = canvas.getContext('2d');
        let chartAnimationId = null;

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
            
            ctx.clearRect(0, 0, width, height);

            if (state.candles.length === 0) return;

            const padding = { top: 20, right: 60, bottom: 30, left: 10 };
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
            
            // Horizontal grid lines
            for (let i = 0; i <= 5; i++) {
                const y = padding.top + (chartHeight / 5) * i;
                ctx.beginPath();
                ctx.moveTo(padding.left, y);
                ctx.lineTo(width - padding.right, y);
                ctx.stroke();

                // Price labels
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
                const bgColor = isGreen ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)';

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

                ctx.fillStyle = isGreen ? color : color;
                ctx.fillRect(x - candleWidth / 2, bodyY, candleWidth, bodyHeight);

                // Glow effect for recent candles
                if (i > state.candles.length - 5) {
                    ctx.shadowColor = color;
                    ctx.shadowBlur = 8;
                    ctx.fillRect(x - candleWidth / 2, bodyY, candleWidth, bodyHeight);
                    ctx.shadowBlur = 0;
                }
            });

            // Draw current price line
            const currentPrice = state.candles[state.candles.length - 1].close;
            const currentY = padding.top + ((maxPrice - currentPrice) / (maxPrice - minPrice)) * chartHeight;
            
            ctx.strokeStyle = '#00d4aa';
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(padding.left, currentY);
            ctx.lineTo(width - padding.right, currentY);
            ctx.stroke();
            ctx.setLineDash([]);

            // Current price label
            ctx.fillStyle = '#00d4aa';
            ctx.fillRect(width - padding.right, currentY - 10, 55, 20);
            ctx.fillStyle = '#0a0e17';
            ctx.font = 'bold 10px JetBrains Mono';
            ctx.textAlign = 'left';
            ctx.fillText(formatPrice(currentPrice), width - padding.right + 4, currentY + 4);
        }

        function formatPrice(price) {
            if (price >= 1000) return (price / 1000).toFixed(2) + 'K';
            return price.toFixed(2);
        }

        // ==================== LIVE DATA SIMULATION ====================
        function updateLiveData() {
            if (state.candles.length === 0) return;

            const lastCandle = state.candles[state.candles.length - 1];
            const volatility = lastCandle.close * 0.001;
            const change = (Math.random() - 0.5) * volatility;
            
            // Update last candle
            lastCandle.close += change;
            lastCandle.high = Math.max(lastCandle.high, lastCandle.close);
            lastCandle.low = Math.min(lastCandle.low, lastCandle.close);

            // Update current price display
            const asset = assetData[state.currentAsset];
            asset.price = lastCandle.close;
            
            // Occasionally create new candle
            if (Math.random() > 0.95) {
                const newOpen = lastCandle.close;
                const newChange = (Math.random() - 0.5) * volatility * 2;
                const newClose = newOpen + newChange;
                const newHigh = Math.max(newOpen, newClose) + Math.random() * volatility;
                const newLow = Math.min(newOpen, newClose) - Math.random() * volatility;
                
                state.candles.push({
                    open: newOpen,
                    high: newHigh,
                    low: newLow,
                    close: newClose,
                    volume: Math.random() * 1000000
                });

                if (state.candles.length > 100) {
                    state.candles.shift();
                }
            }

            updateUI();
            drawChart();
        }

        // ==================== UI RENDERING ====================
        function updateUI() {
            const asset = assetData[state.currentAsset];
            
            // Update price displays
            document.getElementById('currentPrice').textContent = '$' + asset.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            document.getElementById('high24h').textContent = '$' + asset.high.toLocaleString();
            document.getElementById('low24h').textContent = '$' + asset.low.toLocaleString();
            document.getElementById('volume24h').textContent = '$' + asset.volume;
            document.getElementById('marketCap').textContent = '$' + asset.cap;
            document.getElementById('entryPrice').textContent = '$' + asset.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            
            // Update change
            const changeEl = document.getElementById('priceChange');
            changeEl.textContent = (asset.change >= 0 ? '+' : '') + asset.change.toFixed(2) + '%';
            changeEl.className = asset.change >= 0 ? 'text-[var(--success)] mono text-sm' : 'text-[var(--danger)] mono text-sm';

            // Update position size
            const posSize = state.amount * state.leverage;
            document.getElementById('positionSize').textContent = '$' + posSize.toLocaleString();
            
            // Calculate liquidation price
            const liqPrice = state.tradeType === 'buy' 
                ? asset.price * (1 - 0.9 / state.leverage)
                : asset.price * (1 + 0.9 / state.leverage);
            document.getElementById('liqPrice').textContent = '$' + liqPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

            // Update last update time
            document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString();

            // Update asset name
            document.getElementById('assetName').textContent = state.currentAsset + '/USDT';
        }

        function renderPositions() {
            const container = document.getElementById('positionsList');
            if (state.positions.length === 0) {
                container.innerHTML = '<div class="p-4 text-center text-[var(--text-muted)] text-sm">No open positions</div>';
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
                        <span class="text-[var(--text-muted)]">Size: ${pos.size}</span>
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
            container.innerHTML = state.tradeHistory.map(trade => `
                <div class="trade-item animate-slide-in">
                    <div class="flex items-center justify-between mb-1">
                        <div class="flex items-center gap-2">
                            <span class="text-xs font-semibold px-2 py-0.5 rounded ${trade.type === 'buy' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}">
                                ${trade.type.toUpperCase()}
                            </span>
                            <span class="font-medium text-sm">${trade.asset}</span>
                            ${trade.ai ? '<span class="text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent]/20 text-[var(--accent)]">AI</span>' : ''}
                        </div>
                        <span class="text-xs text-[var(--text-muted)] mono">${trade.time}</span>
                    </div>
                    <div class="flex justify-between text-sm">
                        <span class="text-[var(--text-muted)]">${trade.amount} @ $${trade.price.toLocaleString()}</span>
                    </div>
                </div>
            `).join('');

            document.getElementById('totalTrades').textContent = state.tradeHistory.length + ' trades';
        }

        // ==================== AI AGENT SIMULATION ====================
        function runAIAnalysis() {
            const signal = aiSignals[Math.floor(Math.random() * aiSignals.length)];
            
            // Update signal badge
            const signalEl = document.getElementById('aiSignal');
            signalEl.className = `signal-badge signal-${signal.type}`;
            signalEl.innerHTML = `
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="8"/>
                </svg>
                ${signal.type.toUpperCase()}
            `;

            // Update analysis
            document.getElementById('aiAnalysis').textContent = signal.analysis;
            document.getElementById('confidence').textContent = signal.confidence + '%';

            // Update risk level based on confidence
            const riskEl = document.getElementById('riskLevel');
            if (signal.confidence >= 80) {
                riskEl.textContent = 'LOW';
                riskEl.className = 'text-2xl font-bold text-[var(--success)] mono';
            } else if (signal.confidence >= 60) {
                riskEl.textContent = 'MED';
                riskEl.className = 'text-2xl font-bold text-[var(--warning)] mono';
            } else {
                riskEl.textContent = 'HIGH';
                riskEl.className = 'text-2xl font-bold text-[var(--danger)] mono';
            }

            return signal;
        }

        function executeAITrade() {
            if (state.aiRunning) return;
            
            state.aiRunning = true;
            const btn = document.getElementById('aiExecuteBtn');
            btn.innerHTML = `
                <svg class="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
                    <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/>
                </svg>
                Analyzing...
            `;

            // Simulate AI analysis delay
            setTimeout(() => {
                const signal = runAIAnalysis();
                
                // Execute trade based on signal
                if (signal.type !== 'hold') {
                    const asset = assetData[state.currentAsset];
                    const tradeAmount = (Math.random() * 0.1 + 0.01).toFixed(4);
                    
                    // Add to trade history
                    const newTrade = {
                        id: Date.now(),
                        time: new Date().toLocaleTimeString('en-US', { hour12: false }),
                        asset: state.currentAsset,
                        type: signal.type === 'buy' ? 'buy' : 'sell',
                        amount: parseFloat(tradeAmount),
                        price: asset.price,
                        ai: true
                    };
                    
                    state.tradeHistory.unshift(newTrade);
                    renderTradeHistory();

                    // Add position if buy
                    if (signal.type === 'buy') {
                        const newPosition = {
                            id: Date.now(),
                            asset: state.currentAsset,
                            type: 'long',
                            size: parseFloat(tradeAmount),
                            entry: asset.price,
                            current: asset.price,
                            pnl: 0,
                            pnlPercent: 0
                        };
                        state.positions.push(newPosition);
                        renderPositions();
                    }

                    showToast(
                        signal.type === 'buy' ? 'Trade Executed' : 'Position Closed',
                        `${signal.type.toUpperCase()} ${tradeAmount} ${state.currentAsset} @ $${asset.price.toLocaleString()}`,
                        signal.type === 'buy' ? 'success' : 'danger'
                    );
                } else {
                    showToast('AI Decision', 'Holding position - waiting for better entry', 'warning');
                }

                btn.innerHTML = `
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                    Execute AI Trade
                `;
                state.aiRunning = false;
            }, 2000);
        }

        // ==================== TRADE ACTIONS ====================
        function submitTrade() {
            const amount = parseFloat(document.getElementById('tradeAmount').value) || 0;
            if (amount <= 0) {
                showToast('Invalid Amount', 'Please enter a valid trade amount', 'error');
                return;
            }

            const asset = assetData[state.currentAsset];
            const tradeSize = amount / asset.price;

            const newTrade = {
                id: Date.now(),
                time: new Date().toLocaleTimeString('en-US', { hour12: false }),
                asset: state.currentAsset,
                type: state.tradeType,
                amount: parseFloat(tradeSize.toFixed(6)),
                price: asset.price,
                ai: false
            };

            state.tradeHistory.unshift(newTrade);
            renderTradeHistory();

            // Add position for buy
            if (state.tradeType === 'buy') {
                const newPosition = {
                    id: Date.now(),
                    asset: state.currentAsset,
                    type: 'long',
                    size: parseFloat(tradeSize.toFixed(6)),
                    entry: asset.price,
                    current: asset.price,
                    pnl: 0,
                    pnlPercent: 0
                };
                state.positions.push(newPosition);
                renderPositions();
            }

            showToast(
                'Order Placed',
                `${state.tradeType.toUpperCase()} ${tradeSize.toFixed(6)} ${state.currentAsset} @ $${asset.price.toLocaleString()}`,
                state.tradeType === 'buy' ? 'success' : 'danger'
            );
        }

        function closePosition(id) {
            const posIndex = state.positions.findIndex(p => p.id === id);
            if (posIndex === -1) return;

            const pos = state.positions[posIndex];
            const asset = assetData[pos.asset];

            // Add closing trade to history
            const closeTrade = {
                id: Date.now(),
                time: new Date().toLocaleTimeString('en-US', { hour12: false }),
                asset: pos.asset,
                type: 'sell',
                amount: pos.size,
                price: asset.price,
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
            updateUI();
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
                    state.currentAsset = btn.dataset.asset;
                    initCandles();
                    updateUI();
                    drawChart();
                    runAIAnalysis();
                });
            });

            // Timeframe selector
            document.querySelectorAll('.timeframe-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    document.querySelectorAll('.timeframe-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    state.timeframe = btn.dataset.tf;
                    initCandles();
                    drawChart();
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
                    updateUI();
                });
            });

            // Amount input
            document.getElementById('tradeAmount').addEventListener('input', (e) => {
                state.amount = parseFloat(e.target.value) || 0;
                updateUI();
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

            // Mobile menu
            const mobileMenuBtn = document.getElementById('mobileMenuBtn');
            if (mobileMenuBtn) {
                mobileMenuBtn.addEventListener('click', () => {
                    document.querySelector('.sidebar')?.classList.toggle('open');
                    document.getElementById('sidebarOverlay')?.classList.toggle('open');
                });
            }

            // Sidebar overlay click
            document.getElementById('sidebarOverlay')?.addEventListener('click', () => {
                document.querySelector('.sidebar')?.classList.remove('open');
                document.getElementById('sidebarOverlay')?.classList.remove('open');
            });
        }

        // ==================== INITIALIZATION ====================
        function init() {
            // Initialize data
            initCandles();
            initPositions();
            initTradeHistory();

            // Setup canvas
            resizeCanvas();
            drawChart();

            // Initial UI update
            updateUI();
            renderPositions();
            renderTradeHistory();
            runAIAnalysis();

            // Setup event listeners
            setupEventListeners();

            // Start live updates
            setInterval(updateLiveData, 1000);
            
            // Periodic AI analysis
            setInterval(runAIAnalysis, 30000);

            console.log('Openclaw AI Trading Terminal initialized');
        }

        // Start when DOM is ready
        document.addEventListener('DOMContentLoaded', init);
    </script>
</body>
</html>
