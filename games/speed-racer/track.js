console.log('🛣️ Loading Track class...');

class Track {
    constructor(canvasWidth, canvasHeight) {
        this.width = canvasWidth;
        this.height = canvasHeight;
        this.boundaries = [];
        this.checkpoints = [];
        this.startLine = { x: 0, y: 0, width: 0, height: 0 };
        this.decorations = [];
        
        this.setupTrack();
        this.setupDecorations();
    }
    
    setupTrack() {
        const margin = 50;
        const trackWidth = 80;
        
        // Outer boundaries
        this.boundaries = [
            // Top wall
            { x: 0, y: 0, width: this.width, height: margin },
            // Bottom wall
            { x: 0, y: this.height - margin, width: this.width, height: margin },
            // Left wall
            { x: 0, y: 0, width: margin, height: this.height },
            // Right wall
            { x: this.width - margin, y: 0, width: margin, height: this.height },
            
            // Inner track boundaries (creating a complex circuit)
            // Central island
            { x: this.width * 0.4, y: this.height * 0.3, width: this.width * 0.2, height: this.height * 0.4 },
            
            // Chicane obstacles
            { x: this.width * 0.2, y: this.height * 0.15, width: 40, height: 60 },
            { x: this.width * 0.75, y: this.height * 0.75, width: 40, height: 60 },
            
            // Corner obstacles
            { x: this.width * 0.15, y: this.height * 0.6, width: 60, height: 40 },
            { x: this.width * 0.75, y: this.height * 0.2, width: 60, height: 40 },
        ];
        
        // Setup checkpoints for lap counting
        this.setupCheckpoints();
        
        // Start/finish line
        this.startLine = {
            x: this.width * 0.1,
            y: this.height * 0.45,
            width: 4,
            height: trackWidth,
            passed: false
        };
    }
    
    setupCheckpoints() {
        // Checkpoints to ensure proper lap completion
        this.checkpoints = [
            {
                x: this.width * 0.85,
                y: this.height * 0.45,
                width: 20,
                height: 80,
                passed: false,
                id: 1
            },
            {
                x: this.width * 0.5,
                y: this.height * 0.85,
                width: 80,
                height: 20,
                passed: false,
                id: 2
            },
            {
                x: this.width * 0.15,
                y: this.height * 0.85,
                width: 20,
                height: 80,
                passed: false,
                id: 3
            }
        ];
    }
    
    setupDecorations() {
        const margin = 50; // Define margin locally for decorations
        
        // Track decorations for visual appeal
        this.decorations = [
            // Tire barriers
            { type: 'tires', x: this.width * 0.35, y: this.height * 0.25, count: 3 },
            { type: 'tires', x: this.width * 0.65, y: this.height * 0.75, count: 4 },
            
            // Sponsor banners
            { type: 'banner', x: this.width * 0.3, y: margin - 15, text: 'SPEED RACER' },
            { type: 'banner', x: this.width * 0.6, y: this.height - margin + 5, text: 'CHAMPIONSHIP' },
            
            // Racing cones
            { type: 'cone', x: this.width * 0.25, y: this.height * 0.4 },
            { type: 'cone', x: this.width * 0.8, y: this.height * 0.6 },
            { type: 'cone', x: this.width * 0.6, y: this.height * 0.2 },
            
            // Spectator stands
            { type: 'stands', x: margin + 10, y: this.height * 0.2, width: 30, height: 100 },
            { type: 'stands', x: this.width - margin - 40, y: this.height * 0.7, width: 30, height: 100 },
        ];
    }
    
    checkLapProgress(car) {
        let results = {
            lapCompleted: false,
            checkpointPassed: false
        };
        
        // Check start/finish line
        if (this.isCarInArea(car, this.startLine)) {
            if (!this.startLine.passed && this.allCheckpointsPassed()) {
                this.startLine.passed = true;
                results.lapCompleted = true;
                this.resetCheckpoints();
            }
        } else {
            this.startLine.passed = false;
        }
        
        // Check checkpoints
        for (const checkpoint of this.checkpoints) {
            if (this.isCarInArea(car, checkpoint) && !checkpoint.passed) {
                checkpoint.passed = true;
                results.checkpointPassed = true;
                break;
            }
        }
        
        return results;
    }
    
    isCarInArea(car, area) {
        const carCorners = car.getCorners();
        
        for (const corner of carCorners) {
            if (corner.x >= area.x && 
                corner.x <= area.x + area.width &&
                corner.y >= area.y && 
                corner.y <= area.y + area.height) {
                return true;
            }
        }
        return false;
    }
    
    allCheckpointsPassed() {
        return this.checkpoints.every(checkpoint => checkpoint.passed);
    }
    
    resetCheckpoints() {
        this.checkpoints.forEach(checkpoint => {
            checkpoint.passed = false;
        });
    }
    
    getStartPosition() {
        return {
            x: this.width * 0.12,
            y: this.height * 0.5,
            angle: 0
        };
    }
    
    draw(ctx) {
        this.drawTrackBase(ctx);
        this.drawTrackLines(ctx);
        this.drawBoundaries(ctx);
        this.drawDecorations(ctx);
        this.drawStartLine(ctx);
        this.drawCheckpoints(ctx);
    }
    
    drawTrackBase(ctx) {
        // Draw grass background
        ctx.fillStyle = '#2d5016';
        ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw track surface
        ctx.fillStyle = '#333333';
        ctx.fillRect(50, 50, this.width - 100, this.height - 100);
        
        // Create track pattern
        for (let x = 50; x < this.width - 50; x += 40) {
            for (let y = 50; y < this.height - 50; y += 40) {
                if (Math.random() > 0.9) {
                    ctx.fillStyle = '#2a2a2a';
                    ctx.fillRect(x, y, 3, 3);
                }
            }
        }
    }
    
    drawTrackLines(ctx) {
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 10]);
        
        // Center line segments
        ctx.beginPath();
        
        // Horizontal segments
        ctx.moveTo(50, this.height * 0.5);
        ctx.lineTo(this.width * 0.4, this.height * 0.5);
        
        ctx.moveTo(this.width * 0.6, this.height * 0.5);
        ctx.lineTo(this.width - 50, this.height * 0.5);
        
        // Vertical segments
        ctx.moveTo(this.width * 0.5, 50);
        ctx.lineTo(this.width * 0.5, this.height * 0.3);
        
        ctx.moveTo(this.width * 0.5, this.height * 0.7);
        ctx.lineTo(this.width * 0.5, this.height - 50);
        
        ctx.stroke();
        ctx.setLineDash([]);
    }
    
    drawBoundaries(ctx) {
        ctx.fillStyle = '#8B4513';
        
        for (const boundary of this.boundaries) {
            ctx.fillRect(boundary.x, boundary.y, boundary.width, boundary.height);
            
            // Add border effect
            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 2;
            ctx.strokeRect(boundary.x, boundary.y, boundary.width, boundary.height);
        }
    }
    
    drawStartLine(ctx) {
        // Checkered pattern for start/finish line
        ctx.save();
        const squareSize = 8;
        const squares = Math.ceil(this.startLine.height / squareSize);
        
        for (let i = 0; i < squares; i++) {
            ctx.fillStyle = (i % 2 === 0) ? '#ffffff' : '#000000';
            ctx.fillRect(
                this.startLine.x,
                this.startLine.y + i * squareSize,
                this.startLine.width,
                squareSize
            );
        }
        
        // Start/Finish text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Orbitron';
        ctx.save();
        ctx.translate(this.startLine.x + 10, this.startLine.y + this.startLine.height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('START/FINISH', -30, 0);
        ctx.restore();
        
        ctx.restore();
    }
    
    drawCheckpoints(ctx) {
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        
        for (const checkpoint of this.checkpoints) {
            ctx.globalAlpha = checkpoint.passed ? 0.3 : 0.7;
            ctx.strokeRect(checkpoint.x, checkpoint.y, checkpoint.width, checkpoint.height);
            
            // Checkpoint number
            ctx.fillStyle = checkpoint.passed ? '#666666' : '#00ff00';
            ctx.font = 'bold 14px Orbitron';
            ctx.fillText(
                checkpoint.id.toString(),
                checkpoint.x + checkpoint.width / 2 - 5,
                checkpoint.y + checkpoint.height / 2 + 5
            );
        }
        
        ctx.globalAlpha = 1;
        ctx.setLineDash([]);
    }
    
    drawDecorations(ctx) {
        for (const decoration of this.decorations) {
            switch (decoration.type) {
                case 'tires':
                    this.drawTires(ctx, decoration);
                    break;
                case 'banner':
                    this.drawBanner(ctx, decoration);
                    break;
                case 'cone':
                    this.drawCone(ctx, decoration);
                    break;
                case 'stands':
                    this.drawStands(ctx, decoration);
                    break;
            }
        }
    }
    
    drawTires(ctx, decoration) {
        ctx.fillStyle = '#1a1a1a';
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        
        for (let i = 0; i < decoration.count; i++) {
            const x = decoration.x + i * 12;
            const y = decoration.y;
            
            ctx.beginPath();
            ctx.ellipse(x, y, 8, 8, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            // Tire tread
            ctx.strokeStyle = '#666666';
            ctx.lineWidth = 1;
            for (let j = 0; j < 8; j++) {
                const angle = (j / 8) * Math.PI * 2;
                const startX = x + Math.cos(angle) * 5;
                const startY = y + Math.sin(angle) * 5;
                const endX = x + Math.cos(angle) * 7;
                const endY = y + Math.sin(angle) * 7;
                
                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.lineTo(endX, endY);
                ctx.stroke();
            }
        }
    }
    
    drawBanner(ctx, decoration) {
        ctx.fillStyle = '#ff6b00';
        ctx.fillRect(decoration.x, decoration.y, 200, 20);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Orbitron';
        ctx.fillText(decoration.text, decoration.x + 10, decoration.y + 14);
        
        // Banner posts
        ctx.fillStyle = '#666666';
        ctx.fillRect(decoration.x - 2, decoration.y, 4, 30);
        ctx.fillRect(decoration.x + 198, decoration.y, 4, 30);
    }
    
    drawCone(ctx, decoration) {
        ctx.fillStyle = '#ff4500';
        ctx.beginPath();
        ctx.moveTo(decoration.x, decoration.y - 10);
        ctx.lineTo(decoration.x - 6, decoration.y + 4);
        ctx.lineTo(decoration.x + 6, decoration.y + 4);
        ctx.closePath();
        ctx.fill();
        
        // Orange stripes
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(decoration.x - 3, decoration.y - 2);
        ctx.lineTo(decoration.x + 3, decoration.y - 2);
        ctx.stroke();
    }
    
    drawStands(ctx, decoration) {
        // Main structure
        ctx.fillStyle = '#666666';
        ctx.fillRect(decoration.x, decoration.y, decoration.width, decoration.height);
        
        // Seating rows
        ctx.fillStyle = '#4444ff';
        for (let i = 0; i < 5; i++) {
            ctx.fillRect(
                decoration.x + 2,
                decoration.y + i * 18 + 5,
                decoration.width - 4,
                12
            );
        }
        
        // Support pillars
        ctx.fillStyle = '#888888';
        ctx.fillRect(decoration.x, decoration.y + decoration.height, 6, 20);
        ctx.fillRect(decoration.x + decoration.width - 6, decoration.y + decoration.height, 6, 20);
    }
}

console.log('✅ Track class loaded successfully!'); 