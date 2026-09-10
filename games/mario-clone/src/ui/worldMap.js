// World Map for level selection
// Classic NES overworld map style with level nodes

export class WorldMap {
    constructor() {
        // Level data: positions and connections
        // Positions are in a grid (not pixel positions)
        this.levels = [
            { id: '1-1', name: '1-1', gridX: 0, gridY: 0, unlocked: true, completed: false, x: 64, y: 80 },
            { id: '1-2', name: '1-2', gridX: 1, gridY: 0, unlocked: false, completed: false, x: 112, y: 80 },
            { id: '1-3', name: '1-3', gridX: 2, gridY: 0, unlocked: false, completed: false, x: 160, y: 80 },
            { id: '1-4', name: '1-4', gridX: 1, gridY: 1, unlocked: false, completed: false, x: 112, y: 120 },
            { id: '1-C', name: '1-C', gridX: 1, gridY: 2, unlocked: false, completed: false, x: 112, y: 160 }
        ];

        // Connections between levels (which levels connect to which)
        this.connections = [
            { from: '1-1', to: '1-2' },
            { from: '1-2', to: '1-3' },
            { from: '1-2', to: '1-4' },
            { from: '1-4', to: '1-C' }
        ];

        // Current selection index
        this.selectedIndex = 0;

        // Animation
        this.pulseTimer = 0;
        this.pulsePhase = 0;
    }

    /**
     * Update world map state
     */
    update(input) {
        // Update pulse animation
        this.pulseTimer += 16;
        if (this.pulseTimer > 500) {
            this.pulseTimer = 0;
            this.pulsePhase = 1 - this.pulsePhase;
        }

        // Handle navigation
        const currentLevel = this.levels[this.selectedIndex];
        let newIndex = this.selectedIndex;

        if (input.isJustPressed('left')) {
            // Find connected level to the left
            const leftLevel = this.findLevelAt(currentLevel.gridX - 1, currentLevel.gridY);
            if (leftLevel !== null) {
                newIndex = leftLevel;
            }
        } else if (input.isJustPressed('right')) {
            // Find connected level to the right
            const rightLevel = this.findLevelAt(currentLevel.gridX + 1, currentLevel.gridY);
            if (rightLevel !== null) {
                newIndex = rightLevel;
            }
        } else if (input.isJustPressed('up')) {
            // Find connected level above
            const upLevel = this.findLevelAt(currentLevel.gridX, currentLevel.gridY - 1);
            if (upLevel !== null) {
                newIndex = upLevel;
            }
        } else if (input.isJustPressed('down')) {
            // Find connected level below
            const downLevel = this.findLevelAt(currentLevel.gridX, currentLevel.gridY + 1);
            if (downLevel !== null) {
                newIndex = downLevel;
            }
        }

        if (newIndex !== this.selectedIndex) {
            this.selectedIndex = newIndex;
        }

        // Return true if selection was made (Enter/Space pressed on unlocked level)
        if (input.isJumpPressed()) {
            const selected = this.levels[this.selectedIndex];
            if (selected && selected.unlocked) {
                return true;
            }
        }

        return false;
    }

    /**
     * Find level at given grid position
     */
    findLevelAt(gridX, gridY) {
        for (let i = 0; i < this.levels.length; i++) {
            const level = this.levels[i];
            if (level.gridX === gridX && level.gridY === gridY) {
                // Check if levels are connected
                if (this.areConnected(this.levels[this.selectedIndex], level)) {
                    return i;
                }
            }
        }
        return null;
    }

    /**
     * Check if two levels are connected
     */
    areConnected(levelA, levelB) {
        for (const conn of this.connections) {
            if ((conn.from === levelA.id && conn.to === levelB.id) ||
                (conn.from === levelB.id && conn.to === levelA.id)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Get the currently selected level
     */
    getSelectedLevel() {
        return this.levels[this.selectedIndex];
    }

    /**
     * Mark a level as completed and unlock the next level
     */
    completeLevel(id) {
        for (let i = 0; i < this.levels.length; i++) {
            if (this.levels[i].id === id) {
                this.levels[i].completed = true;

                // Find and unlock the next level
                for (const conn of this.connections) {
                    if (conn.from === id) {
                        this.unlockLevel(conn.to);
                    }
                }
                break;
            }
        }
    }

    /**
     * Unlock a specific level
     */
    unlockLevel(id) {
        for (const level of this.levels) {
            if (level.id === id) {
                level.unlocked = true;
                break;
            }
        }
    }

    /**
     * Render the world map
     */
    render(ctx) {
        const ctx2d = ctx;

        // Dark blue background
        ctx2d.fillStyle = '#000000';
        ctx2d.fillRect(0, 0, 256, 240);

        // Draw some decorative ground/grass pattern
        ctx2d.fillStyle = '#00A800';
        for (let x = 0; x < 256; x += 16) {
            // Small grass tufts
            ctx2d.fillRect(x, 200, 8, 4);
            ctx2d.fillRect(x + 4, 196, 4, 4);
        }

        // Draw paths between levels
        ctx2d.strokeStyle = '#FFFFFF';
        ctx2d.lineWidth = 2;
        ctx2d.setLineDash([]);

        for (const conn of this.connections) {
            const fromLevel = this.getLevelById(conn.from);
            const toLevel = this.getLevelById(conn.to);
            if (fromLevel && toLevel) {
                ctx2d.beginPath();
                ctx2d.moveTo(fromLevel.x + 12, fromLevel.y + 12);
                ctx2d.lineTo(toLevel.x + 12, toLevel.y + 12);
                ctx2d.stroke();
            }
        }

        // Draw level nodes
        for (let i = 0; i < this.levels.length; i++) {
            const level = this.levels[i];
            this.drawLevelNode(ctx2d, level, i === this.selectedIndex);
        }

        // Draw "SELECT" label near selected level
        const selected = this.levels[this.selectedIndex];
        if (selected && selected.unlocked) {
            ctx2d.fillStyle = '#FFFFFF';
            ctx2d.font = '8px monospace';
            ctx2d.textAlign = 'center';
            ctx2d.fillText('SELECT', selected.x + 12, selected.y - 8);
        }
    }

    /**
     * Get level by its ID
     */
    getLevelById(id) {
        for (const level of this.levels) {
            if (level.id === id) return level;
        }
        return null;
    }

    /**
     * Draw a level node
     */
    drawLevelNode(ctx, level, isSelected) {
        const x = level.x;
        const y = level.y;
        const size = 24;

        // Glow effect for selected level
        if (isSelected && level.unlocked) {
            // Pulsing glow
            const glowSize = 4 + this.pulsePhase * 2;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.fillRect(x - glowSize, y - glowSize, size + glowSize * 2, size + glowSize * 2);

            // White outline
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.strokeRect(x - 2, y - 2, size + 4, size + 4);
        }

        // Dimmed for locked
        if (!level.unlocked) {
            ctx.fillStyle = '#404040';
            ctx.fillRect(x, y, size, size);
            ctx.strokeStyle = '#606060';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, size, size);

            // Draw lock icon
            ctx.fillStyle = '#808080';
            ctx.fillRect(x + 8, y + 10, 8, 8);
            ctx.strokeStyle = '#808080';
            ctx.beginPath();
            ctx.arc(x + 12, y + 10, 4, Math.PI, 0);
            ctx.stroke();
        } else {
            // Normal unlocked node
            ctx.fillStyle = '#303030';
            ctx.fillRect(x, y, size, size);
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, size, size);

            // Level name
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '8px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(level.name, x + size / 2, y + size / 2);
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
        }

        // Flag for completed levels
        if (level.completed) {
            this.drawFlag(ctx, x + size + 2, y - 4);
        }
    }

    /**
     * Draw a flag icon
     */
    drawFlag(ctx, x, y) {
        // Pole
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x, y, 2, 16);

        // Flag
        ctx.fillStyle = '#00A800';
        ctx.fillRect(x + 2, y, 8, 6);
    }

    /**
     * Get count of unlocked levels
     */
    getUnlockedCount() {
        let count = 0;
        for (const level of this.levels) {
            if (level.unlocked) count++;
        }
        return count;
    }

    /**
     * Get count of completed levels
     */
    getCompletedCount() {
        let count = 0;
        for (const level of this.levels) {
            if (level.completed) count++;
        }
        return count;
    }
}
