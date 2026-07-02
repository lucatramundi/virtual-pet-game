// Game Constants
const EGGS = {
    red: { name: 'Rabbit', emoji: '🐰', type: 'rabbit' },
    orange: { name: 'Budgie', emoji: '🐦', type: 'budgie' },
    yellow: { name: 'Dog', emoji: '🐕', type: 'dog' },
    green: { name: 'Cat', emoji: '🐱', type: 'cat' },
    blue: { name: 'Guinea Pig', emoji: '🐹', type: 'guinea_pig' },
    purple: { name: 'Hamster', emoji: '🐹', type: 'hamster' },
    pink: { name: 'Fish', emoji: '🐠', type: 'fish' }
};

const SIZES = {
    small: { width: 150, height: 150, name: 'Small' },
    medium: { width: 250, height: 250, name: 'Medium' },
    large: { width: 350, height: 350, name: 'Large' },
    extra_large: { width: 450, height: 450, name: 'Extra Large' }
};

const NEEDS = ['food', 'drink', 'toys'];
const GAME_STATE = {
    SELECTING_EGG: 'selecting_egg',
    NAMING_PET: 'naming_pet',
    SELECTING_SIZE: 'selecting_size',
    PLACING_CAGE: 'placing_cage',
    PLAYING: 'playing'
};

const LOCATIONS = {
    HOME: 'home',
    FOOD_SHOP: 'food_shop',
    DRINK_SHOP: 'drink_shop',
    GAME_CENTRE: 'game_centre',
    TOY_SHOP: 'toy_shop',
    PARK: 'park'
};

// Game Class
class VirtualPetGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.gameState = GAME_STATE.SELECTING_EGG;
        this.currentLocation = LOCATIONS.HOME;
        this.pet = null;
        this.isDraggingCage = false;
        this.cagePosition = { x: 400, y: 300 };
        this.menuOpen = false;
        this.lastThoughtBubbleChange = Date.now();
        this.selectedEggData = null;
        this.selectedEggSize = null;
        
        this.setupEventListeners();
        this.loadGame();
        this.gameLoop();
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    }

    loadGame() {
        const savedGame = localStorage.getItem('petGame');
        if (savedGame) {
            const data = JSON.parse(savedGame);
            this.pet = data.pet;
            this.cagePosition = data.cagePosition;
            this.currentLocation = data.currentLocation;
            this.gameState = GAME_STATE.PLAYING;
            
            // Check if pet is dead
            if (this.pet.isDead) {
                this.showDeadPet();
            }
        } else {
            this.showEggSelection();
        }
    }

    saveGame() {
        const data = {
            pet: this.pet,
            cagePosition: this.cagePosition,
            currentLocation: this.currentLocation
        };
        localStorage.setItem('petGame', JSON.stringify(data));
    }

    showEggSelection() {
        this.gameState = GAME_STATE.SELECTING_EGG;
        const overlay = document.getElementById('ui-overlay');
        overlay.innerHTML = `
            <div class="modal">
                <div class="modal-content">
                    <h1>Pick Your Egg! 🥚</h1>
                    <div class="egg-grid">
                        <div class="egg-option" onclick="game.selectEgg('red')">
                            <div class="egg-color">🔴</div>
                            <div class="egg-name">Rabbit</div>
                        </div>
                        <div class="egg-option" onclick="game.selectEgg('orange')">
                            <div class="egg-color">🟠</div>
                            <div class="egg-name">Budgie</div>
                        </div>
                        <div class="egg-option" onclick="game.selectEgg('yellow')">
                            <div class="egg-color">🟡</div>
                            <div class="egg-name">Dog</div>
                        </div>
                        <div class="egg-option" onclick="game.selectEgg('green')">
                            <div class="egg-color">🟢</div>
                            <div class="egg-name">Cat</div>
                        </div>
                        <div class="egg-option" onclick="game.selectEgg('blue')">
                            <div class="egg-color">🔵</div>
                            <div class="egg-name">Guinea Pig</div>
                        </div>
                        <div class="egg-option" onclick="game.selectEgg('purple')">
                            <div class="egg-color">🟣</div>
                            <div class="egg-name">Hamster</div>
                        </div>
                        <div class="egg-option" onclick="game.selectEgg('pink')">
                            <div class="egg-color">💗</div>
                            <div class="egg-name">Fish</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    selectEgg(eggColor) {
        const eggData = EGGS[eggColor];
        this.selectedEggData = eggData;
        this.showPetNaming(eggData);
    }

    showPetNaming(eggData) {
        this.gameState = GAME_STATE.NAMING_PET;
        const overlay = document.getElementById('ui-overlay');
        overlay.innerHTML = `
            <div class="modal">
                <div class="modal-content">
                    <h1>Name Your ${eggData.name}! 🏷️</h1>
                    <div style="margin: 30px 0;">
                        <div style="font-size: 60px; margin-bottom: 20px;">${eggData.emoji}</div>
                        <div class="naming-input">
                            <input type="text" id="petNameInput" placeholder="Enter your pet's name..." maxlength="20" autofocus>
                            <button class="naming-button" onclick="game.confirmPetName()">Confirm Name</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Allow Enter key to confirm
        setTimeout(() => {
            const input = document.getElementById('petNameInput');
            if (input) {
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        game.confirmPetName();
                    }
                });
            }
        }, 100);
    }

    confirmPetName() {
        const petNameInput = document.getElementById('petNameInput');
        const petName = petNameInput.value.trim();
        
        if (petName === '') {
            alert('Please enter a name for your pet!');
            return;
        }
        
        const petType = this.selectedEggData.type;
        
        // Fish don't need cage size selection
        if (petType === 'fish') {
            this.createPet(this.selectedEggData, petName);
            this.gameState = GAME_STATE.PLAYING;
            this.currentLocation = LOCATIONS.HOME;
            this.saveGame();
            document.getElementById('ui-overlay').innerHTML = '';
        } else if (petType === 'cat' || petType === 'dog') {
            // Cats and dogs don't need cages
            this.createPet(this.selectedEggData, petName);
            this.gameState = GAME_STATE.PLAYING;
            this.currentLocation = LOCATIONS.HOME;
            this.saveGame();
            document.getElementById('ui-overlay').innerHTML = '';
        } else {
            this.showSizeSelection(this.selectedEggData, petName);
        }
    }

    showSizeSelection(eggData, petName) {
        this.gameState = GAME_STATE.SELECTING_SIZE;
        this.selectedEggData = eggData;
        this.petName = petName;
        const overlay = document.getElementById('ui-overlay');
        overlay.innerHTML = `
            <div class="modal">
                <div class="modal-content">
                    <h1>Pick Tank/Cage Size for ${petName}</h1>
                    <div class="size-grid">
                        <div class="size-option" onclick="game.selectSize('small')">
                            <div>Small</div>
                            <div style="font-size: 12px; color: #666;">150x150</div>
                        </div>
                        <div class="size-option" onclick="game.selectSize('medium')">
                            <div>Medium</div>
                            <div style="font-size: 12px; color: #666;">250x250</div>
                        </div>
                        <div class="size-option" onclick="game.selectSize('large')">
                            <div>Large</div>
                            <div style="font-size: 12px; color: #666;">350x350</div>
                        </div>
                        <div class="size-option" onclick="game.selectSize('extra_large')">
                            <div>Extra Large</div>
                            <div style="font-size: 12px; color: #666;">450x450</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    selectSize(size) {
        this.createPet(this.selectedEggData, this.petName, size);
        this.gameState = GAME_STATE.PLACING_CAGE;
        document.getElementById('ui-overlay').innerHTML = `
            <div style="position: absolute; top: 10px; left: 10px; background: white; padding: 15px; border-radius: 10px; z-index: 100;">
                <p>Drag the cage/tank to place it where you want!</p>
                <button onclick="game.finishPlacing()" style="margin-top: 10px;">Done Placing</button>
            </div>
        `;
    }

    createPet(eggData, customName, size = null) {
        const petType = eggData.type;
        this.pet = {
            type: petType,
            species: eggData.name,
            customName: customName,
            emoji: eggData.emoji,
            hunger: 50,
            thirst: 50,
            happiness: 50,
            money: 0,
            lastFed: Date.now(),
            lastDrank: Date.now(),
            currentNeed: this.getRandomNeed(),
            isDead: false,
            timesRevived: 0,
            cageSize: size,
            toys: []
        };
        
        if (size) {
            this.pet.cageWidth = SIZES[size].width;
            this.pet.cageHeight = SIZES[size].height;
        }
        
        this.cagePosition = { x: 400, y: 300 };
    }

    finishPlacing() {
        this.gameState = GAME_STATE.PLAYING;
        this.currentLocation = LOCATIONS.HOME;
        document.getElementById('ui-overlay').innerHTML = '';
        this.saveGame();
    }

    handleMouseDown(e) {
        if (this.gameState !== GAME_STATE.PLAYING || this.menuOpen) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        if (this.gameState === GAME_STATE.PLACING_CAGE) {
            if (this.isMouseOnCage(x, y)) {
                this.isDraggingCage = true;
            }
        }
    }

    handleMouseMove(e) {
        if (!this.isDraggingCage) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.cagePosition.x = x - this.pet.cageWidth / 2;
        this.cagePosition.y = y - this.pet.cageHeight / 2;
        
        this.cagePosition.x = Math.max(0, Math.min(this.cagePosition.x, this.canvas.width - this.pet.cageWidth));
        this.cagePosition.y = Math.max(0, Math.min(this.cagePosition.y, this.canvas.height - this.pet.cageHeight));
    }

    handleMouseUp() {
        this.isDraggingCage = false;
    }

    isMouseOnCage(x, y) {
        const cageX = this.cagePosition.x;
        const cageY = this.cagePosition.y;
        const cageW = this.pet.cageWidth;
        const cageH = this.pet.cageHeight;
        
        return x >= cageX && x <= cageX + cageW && y >= cageY && y <= cageY + cageH;
    }

    getRandomNeed() {
        return NEEDS[Math.floor(Math.random() * NEEDS.length)];
    }

    updatePet() {
        if (!this.pet || this.pet.isDead) return;
        
        const now = Date.now();
        const timeSinceLastFed = (now - this.pet.lastFed) / 1000 / 60; // minutes
        const timeSinceLastDrank = (now - this.pet.lastDrank) / 1000 / 60; // minutes
        
        // Increase hunger and thirst over time
        this.pet.hunger = Math.min(100, this.pet.hunger + timeSinceLastFed * 0.01);
        this.pet.thirst = Math.min(100, this.pet.thirst + timeSinceLastDrank * 0.01);
        
        // Decrease happiness if needs aren't met
        if (this.pet.hunger > 80 || this.pet.thirst > 80) {
            this.pet.happiness = Math.max(0, this.pet.happiness - 0.1);
        } else {
            this.pet.happiness = Math.min(100, this.pet.happiness + 0.05);
        }
        
        // Check if pet died (3 days without food or water)
        const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
        if (timeSinceLastFed > threeDaysMs || timeSinceLastDrank > threeDaysMs) {
            this.pet.isDead = true;
            this.showDeadPet();
        }
        
        // Change thought bubble every hour
        if (now - this.lastThoughtBubbleChange > 3600000) {
            this.pet.currentNeed = this.getRandomNeed();
            this.lastThoughtBubbleChange = now;
        }
        
        this.saveGame();
    }

    drawHome() {
        // Draw background
        this.ctx.fillStyle = '#E0F6FF';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw house
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(100, 200, 250, 250);
        
        // Draw roof
        this.ctx.fillStyle = '#A0522D';
        this.ctx.beginPath();
        this.ctx.moveTo(100, 200);
        this.ctx.lineTo(225, 50);
        this.ctx.lineTo(350, 200);
        this.ctx.fill();
        
        // Draw door
        this.ctx.fillStyle = '#654321';
        this.ctx.fillRect(200, 350, 50, 100);
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillRect(235, 385, 10, 10);
        
        // Draw garden area
        this.ctx.fillStyle = '#90EE90';
        this.ctx.fillRect(450, 300, 500, 200);
        
        // Draw flowers in garden
        this.drawFlower(550, 350);
        this.drawFlower(650, 360);
        this.drawFlower(750, 340);
        
        // Draw cage/tank if pet has one
        if (this.pet.cageSize) {
            this.drawCage();
        } else {
            this.drawPet(700, 250);
        }
        
        // Draw thought bubble with current need
        this.drawThoughtBubble();
        
        // Draw HUD
        this.drawHUD();
        
        // Draw menu button
        this.drawMenuButton();
    }

    drawCage() {
        const x = this.cagePosition.x;
        const y = this.cagePosition.y;
        const w = this.pet.cageWidth;
        const h = this.pet.cageHeight;
        
        // Draw cage outline
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(x, y, w, h);
        
        // Draw cage background
        this.ctx.fillStyle = 'rgba(255, 255, 200, 0.8)';
        this.ctx.fillRect(x, y, w, h);
        
        // Draw water bottle
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(x + 20, y + 20, 20, 40);
        
        // Draw pet
        const petX = x + w / 2;
        const petY = y + h / 2;
        this.drawPetAtPosition(petX, petY);
    }

    drawPet(x, y) {
        this.drawPetAtPosition(x, y);
    }

    drawPetAtPosition(x, y) {
        this.ctx.save();
        this.ctx.font = 'bold 60px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(this.pet.emoji, x, y);
        this.ctx.restore();
    }

    drawFlower(x, y) {
        this.ctx.fillStyle = '#FF69B4';
        this.ctx.beginPath();
        this.ctx.arc(x, y, 8, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#228B22';
        this.ctx.fillRect(x - 2, y + 8, 4, 20);
    }

    drawThoughtBubble() {
        const bubbleX = 750;
        const bubbleY = 100;
        const bubbleW = 200;
        const bubbleH = 80;
        const tailX = 700;
        const tailY = 180;
        
        // Draw bubble
        this.ctx.fillStyle = 'white';
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.roundRect(bubbleX, bubbleY, bubbleW, bubbleH, 10);
        this.ctx.fill();
        this.ctx.stroke();
        
        // Draw tail
        this.ctx.beginPath();
        this.ctx.moveTo(bubbleX - 20, bubbleY + 60);
        this.ctx.lineTo(tailX, tailY);
        this.ctx.lineTo(bubbleX - 10, bubbleY + 50);
        this.ctx.fill();
        
        // Draw text
        this.ctx.fillStyle = '#333';
        this.ctx.font = 'bold 30px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        const needEmoji = {
            food: '🍖',
            drink: '💧',
            toys: '🎮'
        };
        
        this.ctx.fillText(needEmoji[this.pet.currentNeed], bubbleX + bubbleW / 2, bubbleY + bubbleH / 2);
    }

    drawHUD() {
        this.ctx.save();
        
        const hudX = 10;
        const hudY = 10;
        const hudW = 250;
        const hudH = 180;
        
        // Draw HUD background
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        this.ctx.fillRect(hudX, hudY, hudW, hudH);
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(hudX, hudY, hudW, hudH);
        
        // Pet name
        this.ctx.fillStyle = '#333';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(this.pet.customName, hudX + 10, hudY + 25);
        
        // Pet species
        this.ctx.font = '12px Arial';
        this.ctx.fillStyle = '#666';
        this.ctx.fillText('(' + this.pet.species + ')', hudX + 10, hudY + 42);
        
        // Stats
        let statsY = hudY + 60;
        const statHeight = 25;
        
        // Hunger
        this.ctx.fillStyle = '#666';
        this.ctx.font = '12px Arial';
        this.ctx.fillText('Hunger:', hudX + 10, statsY);
        this.drawStatBar(hudX + 80, statsY - 8, 160, 12, this.pet.hunger);
        
        // Thirst
        statsY += statHeight;
        this.ctx.fillText('Thirst:', hudX + 10, statsY);
        this.drawStatBar(hudX + 80, statsY - 8, 160, 12, this.pet.thirst);
        
        // Happiness
        statsY += statHeight;
        this.ctx.fillText('Happiness:', hudX + 10, statsY);
        this.drawStatBar(hudX + 80, statsY - 8, 160, 12, this.pet.happiness);
        
        // Money
        statsY += statHeight + 10;
        this.ctx.fillStyle = '#4CAF50';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.fillText('💰 ' + this.pet.money, hudX + 10, statsY);
        
        this.ctx.restore();
    }

    drawStatBar(x, y, width, height, value) {
        this.ctx.fillStyle = '#ddd';
        this.ctx.fillRect(x, y, width, height);
        
        let color = '#4CAF50';
        if (value > 75) color = '#4CAF50';
        else if (value > 50) color = '#FFC107';
        else if (value > 25) color = '#FF9800';
        else color = '#f44336';
        
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, width * (value / 100), height);
        
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, width, height);
    }

    drawMenuButton() {
        this.ctx.save();
        
        this.ctx.fillStyle = '#667eea';
        this.ctx.beginPath();
        this.ctx.arc(950, 30, 25, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('☰', 950, 30);
        
        this.ctx.restore();
    }

    handleMenuClick(x, y) {
        if (Math.sqrt((x - 950) ** 2 + (y - 30) ** 2) < 25) {
            this.openMenu();
        }
    }

    openMenu() {
        this.menuOpen = true;
        const overlay = document.getElementById('ui-overlay');
        const menuHTML = `
            <div class="menu-panel">
                <button class="close-menu" onclick="game.closeMenu()">✕</button>
                <h2 style="margin-bottom: 20px;">Menu</h2>
                <button class="menu-option" onclick="game.goToLocation('home')">🏠 Home</button>
                <button class="menu-option" onclick="game.goToLocation('food_shop')">🍖 Food Shop</button>
                <button class="menu-option" onclick="game.goToLocation('drink_shop')">💧 Drink Shop</button>
                <button class="menu-option" onclick="game.goToLocation('game_centre')">🎮 Game Centre</button>
                <button class="menu-option" onclick="game.goToLocation('toy_shop')">🧸 Toy Shop</button>
                ${(this.pet.type === 'dog' || this.pet.type === 'cat') ? '<button class="menu-option" onclick="game.goToLocation(\'park\')">🌳 Park</button>' : ''}
            </div>
        `;
        overlay.innerHTML = menuHTML;
        overlay.style.pointerEvents = 'auto';
    }

    closeMenu() {
        this.menuOpen = false;
        document.getElementById('ui-overlay').innerHTML = '';
        document.getElementById('ui-overlay').style.pointerEvents = 'none';
    }

    goToLocation(location) {
        this.currentLocation = location;
        this.closeMenu();
    }

    drawPark() {
        // Draw background
        this.ctx.fillStyle = '#90EE90';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw trees
        this.drawTree(100, 100);
        this.drawTree(200, 80);
        this.drawTree(800, 120);
        this.drawTree(900, 100);
        
        // Draw path
        this.ctx.fillStyle = '#D2B48C';
        this.ctx.fillRect(0, 300, this.canvas.width, 100);
        
        // Draw pet walking
        this.ctx.save();
        this.ctx.font = 'bold 80px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(this.pet.emoji, 500, 350);
        this.ctx.restore();
        
        // Draw HUD and Menu Button
        this.drawHUD();
        this.drawMenuButton();
        
        // Draw back button instruction
        this.ctx.fillStyle = '#333';
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Click Menu to go back', this.canvas.width / 2, this.canvas.height - 20);
    }

    drawTree(x, y) {
        // Trunk
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(x - 15, y + 30, 30, 60);
        
        // Leaves
        this.ctx.fillStyle = '#228B22';
        this.ctx.beginPath();
        this.ctx.arc(x, y, 40, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawFoodShop() {
        this.drawShopBackground();
        
        const overlay = document.getElementById('ui-overlay');
        overlay.innerHTML = `
            <div class="shop-panel">
                <button class="close-menu" onclick="game.goToLocation('home')">✕</button>
                <h2>🍖 Food Shop</h2>
                <div class="money-display">💰 ${this.pet.money}</div>
                <div class="shop-item">
                    <div class="item-info">
                        <div class="item-name">Carrot</div>
                        <div class="item-price">Cost: 10</div>
                    </div>
                    <button class="buy-button" onclick="game.buyFood(10, 'carrot')">Buy</button>
                </div>
                <div class="shop-item">
                    <div class="item-info">
                        <div class="item-name">Berries</div>
                        <div class="item-price">Cost: 15</div>
                    </div>
                    <button class="buy-button" onclick="game.buyFood(15, 'berries')">Buy</button>
                </div>
                <div class="shop-item">
                    <div class="item-info">
                        <div class="item-name">Meat</div>
                        <div class="item-price">Cost: 25</div>
                    </div>
                    <button class="buy-button" onclick="game.buyFood(25, 'meat')">Buy</button>
                </div>
                <div class="shop-item">
                    <div class="item-info">
                        <div class="item-name">Premium Food</div>
                        <div class="item-price">Cost: 50</div>
                    </div>
                    <button class="buy-button" onclick="game.buyFood(50, 'premium')">Buy</button>
                </div>
            </div>
        `;
        overlay.style.pointerEvents = 'auto';
        
        this.drawHUD();
        this.drawMenuButton();
    }

    drawDrinkShop() {
        this.drawShopBackground();
        
        const overlay = document.getElementById('ui-overlay');
        overlay.innerHTML = `
            <div class="shop-panel">
                <button class="close-menu" onclick="game.goToLocation('home')">✕</button>
                <h2>💧 Drink Shop</h2>
                <div class="money-display">💰 ${this.pet.money}</div>
                <div class="shop-item">
                    <div class="item-info">
                        <div class="item-name">Water</div>
                        <div class="item-price">Cost: 5</div>
                    </div>
                    <button class="buy-button" onclick="game.buyDrink(5, 'water')">Buy</button>
                </div>
                <div class="shop-item">
                    <div class="item-info">
                        <div class="item-name">Juice</div>
                        <div class="item-price">Cost: 15</div>
                    </div>
                    <button class="buy-button" onclick="game.buyDrink(15, 'juice')">Buy</button>
                </div>
                <div class="shop-item">
                    <div class="item-info">
                        <div class="item-name">Milk</div>
                        <div class="item-price">Cost: 20</div>
                    </div>
                    <button class="buy-button" onclick="game.buyDrink(20, 'milk')">Buy</button>
                </div>
                <div class="shop-item">
                    <div class="item-info">
                        <div class="item-name">Premium Drink</div>
                        <div class="item-price">Cost: 40</div>
                    </div>
                    <button class="buy-button" onclick="game.buyDrink(40, 'premium')">Buy</button>
                </div>
            </div>
        `;
        overlay.style.pointerEvents = 'auto';
        
        this.drawHUD();
        this.drawMenuButton();
    }

    drawToyShop() {
        this.drawShopBackground();
        
        const overlay = document.getElementById('ui-overlay');
        overlay.innerHTML = `
            <div class="shop-panel">
                <button class="close-menu" onclick="game.goToLocation('home')">✕</button>
                <h2>🧸 Toy Shop</h2>
                <div class="money-display">💰 ${this.pet.money}</div>
                <div class="shop-item">
                    <div class="item-info">
                        <div class="item-name">Ball</div>
                        <div class="item-price">Cost: 20</div>
                    </div>
                    <button class="buy-button" onclick="game.buyToy(20, 'ball')">Buy</button>
                </div>
                <div class="shop-item">
                    <div class="item-info">
                        <div class="item-name">Rope Toy</div>
                        <div class="item-price">Cost: 30</div>
                    </div>
                    <button class="buy-button" onclick="game.buyToy(30, 'rope')">Buy</button>
                </div>
                <div class="shop-item">
                    <div class="item-info">
                        <div class="item-name">Wheel</div>
                        <div class="item-price">Cost: 35</div>
                    </div>
                    <button class="buy-button" onclick="game.buyToy(35, 'wheel')">Buy</button>
                </div>
                <div class="shop-item">
                    <div class="item-info">
                        <div class="item-name">Premium Toy Set</div>
                        <div class="item-price">Cost: 60</div>
                    </div>
                    <button class="buy-button" onclick="game.buyToy(60, 'premium')">Buy</button>
                </div>
            </div>
        `;
        overlay.style.pointerEvents = 'auto';
        
        this.drawHUD();
        this.drawMenuButton();
    }

    drawGameCentre() {
        this.drawShopBackground();
        
        const overlay = document.getElementById('ui-overlay');
        overlay.innerHTML = `
            <div class="shop-panel">
                <button class="close-menu" onclick="game.goToLocation('home')">✕</button>
                <h2>🎮 Game Centre</h2>
                <div class="money-display">💰 ${this.pet.money}</div>
                <div class="game-grid">
                    <div class="game-card" onclick="game.playGame('pong')">
                        <div class="game-icon">🎾</div>
                        <div>Pong</div>
                        <div style="font-size: 12px; margin-top: 5px;">Win: 30 💰</div>
                    </div>
                    <div class="game-card" onclick="game.playGame('maze')">
                        <div class="game-icon">🌀</div>
                        <div>Maze</div>
                        <div style="font-size: 12px; margin-top: 5px;">Win: 25 💰</div>
                    </div>
                    <div class="game-card" onclick="game.playGame('numbers')">
                        <div class="game-icon">🔢</div>
                        <div>Numbers</div>
                        <div style="font-size: 12px; margin-top: 5px;">Win: 20 💰</div>
                    </div>
                    <div class="game-card" onclick="game.playGame('memory')">
                        <div class="game-icon">🧠</div>
                        <div>Memory</div>
                        <div style="font-size: 12px; margin-top: 5px;">Win: 35 💰</div>
                    </div>
                    <div class="game-card" onclick="game.playGame('flappy')">
                        <div class="game-icon">🐦</div>
                        <div>Flappy</div>
                        <div style="font-size: 12px; margin-top: 5px;">Win: 28 💰</div>
                    </div>
                    <div class="game-card" onclick="game.playGame('snake')">
                        <div class="game-icon">🐍</div>
                        <div>Snake</div>
                        <div style="font-size: 12px; margin-top: 5px;">Win: 40 💰</div>
                    </div>
                </div>
            </div>
        `;
        overlay.style.pointerEvents = 'auto';
        
        this.drawHUD();
        this.drawMenuButton();
    }

    drawShopBackground() {
        this.ctx.fillStyle = '#E0F6FF';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw shop counter
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(100, 200, 800, 300);
    }

    buyFood(cost, type) {
        if (this.pet.money >= cost) {
            this.pet.money -= cost;
            this.pet.hunger = Math.max(0, this.pet.hunger - 30);
            this.pet.lastFed = Date.now();
            this.showNotification('Fed ' + this.pet.customName + ' with ' + type + '! 🍖');
            this.saveGame();
            this.drawFoodShop();
        } else {
            this.showNotification('Not enough money! 💰');
        }
    }

    buyDrink(cost, type) {
        if (this.pet.money >= cost) {
            this.pet.money -= cost;
            this.pet.thirst = Math.max(0, this.pet.thirst - 30);
            this.pet.lastDrank = Date.now();
            this.showNotification('Gave ' + this.pet.customName + ' a drink! 💧');
            this.saveGame();
            this.drawDrinkShop();
        } else {
            this.showNotification('Not enough money! 💰');
        }
    }

    buyToy(cost, type) {
        if (this.pet.money >= cost) {
            this.pet.money -= cost;
            this.pet.toys.push(type);
            this.showNotification(this.pet.customName + ' got a new toy! 🧸');
            this.saveGame();
            this.drawToyShop();
        } else {
            this.showNotification('Not enough money! 💰');
        }
    }

    playGame(gameName) {
        this.showNotification(this.pet.customName + ' played ' + gameName + ' and won! +💰');
        
        const rewards = {
            pong: 30,
            maze: 25,
            numbers: 20,
            memory: 35,
            flappy: 28,
            snake: 40
        };
        
        this.pet.money += rewards[gameName] || 20;
        this.pet.happiness = Math.min(100, this.pet.happiness + 10);
        this.saveGame();
        
        setTimeout(() => {
            this.drawGameCentre();
        }, 2000);
    }

    showNotification(message) {
        const overlay = document.getElementById('ui-overlay');
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        overlay.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    showDeadPet() {
        this.menuOpen = true;
        const overlay = document.getElementById('ui-overlay');
        overlay.innerHTML = `
            <div class="dead-overlay">
                <div class="dead-panel">
                    <h1>😢 ${this.pet.customName} Has Died!</h1>
                    <p>Your ${this.pet.species} needs food and water to survive!</p>
                    ${this.pet.timesRevived < 1 ? '<button class="revive-button" onclick="game.revivePet()">Revive ' + this.pet.customName + ' (1 time only)</button>' : '<p style="color: #ff6b6b; font-weight: bold;">You cannot revive again!</p>'}
                    <button class="revive-button" style="background: #2196F3;" onclick="game.startNewGame()">Start New Game</button>
                </div>
            </div>
        `;
        overlay.style.pointerEvents = 'auto';
    }

    revivePet() {
        this.pet.isDead = false;
        this.pet.timesRevived += 1;
        this.pet.hunger = 30;
        this.pet.thirst = 30;
        this.pet.happiness = 50;
        this.pet.lastFed = Date.now();
        this.pet.lastDrank = Date.now();
        this.menuOpen = false;
        document.getElementById('ui-overlay').innerHTML = '';
        document.getElementById('ui-overlay').style.pointerEvents = 'none';
        this.showNotification(this.pet.customName + ' has been revived! 🎉');
        this.saveGame();
    }

    startNewGame() {
        localStorage.removeItem('petGame');
        location.reload();
    }

    gameLoop() {
        this.updatePet();
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.gameState === GAME_STATE.PLAYING) {
            switch(this.currentLocation) {
                case LOCATIONS.HOME:
                    this.drawHome();
                    break;
                case LOCATIONS.FOOD_SHOP:
                    this.drawFoodShop();
                    break;
                case LOCATIONS.DRINK_SHOP:
                    this.drawDrinkShop();
                    break;
                case LOCATIONS.GAME_CENTRE:
                    this.drawGameCentre();
                    break;
                case LOCATIONS.TOY_SHOP:
                    this.drawToyShop();
                    break;
                case LOCATIONS.PARK:
                    this.drawPark();
                    break;
            }
            
            // Handle menu button click
            this.canvas.addEventListener('click', (e) => {
                const rect = this.canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                this.handleMenuClick(x, y);
            });
        }
        
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Polyfill for roundRect if needed
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        this.beginPath();
        this.moveTo(x + r, y);
        this.arcTo(x + w, y, x + w, y + h, r);
        this.arcTo(x + w, y + h, x, y + h, r);
        this.arcTo(x, y + h, x, y, r);
        this.arcTo(x, y, x + w, y, r);
        this.closePath();
        return this;
    }
}

// Start the game
const game = new VirtualPetGame();
