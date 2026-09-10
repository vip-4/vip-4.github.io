class Car {
    constructor(x, y, angle, carType = 0) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.velocity = 0;
        this.maxSpeed = 8;
        this.acceleration = 0.3;
        this.friction = 0.95;
        this.turnSpeed = 0.04;
        this.width = 20;
        this.height = 40;
        
        // Car types with different characteristics
        this.carTypes = [
            {
                name: "Sport Car",
                color: "#ff3333",
                accentColor: "#ffffff",
                maxSpeed: 8,
                acceleration: 0.3,
                turnSpeed: 0.04,
                width: 20,
                height: 40
            },
            {
                name: "Race Car",
                color: "#3333ff",
                accentColor: "#ffff00",
                maxSpeed: 10,
                acceleration: 0.25,
                turnSpeed: 0.05,
                width: 18,
                height: 42
            },
            {
                name: "Classic Car",
                color: "#33ff33",
                accentColor: "#ffffff",
                maxSpeed: 6,
                acceleration: 0.4,
                turnSpeed: 0.035,
                width: 22,
                height: 38
            }
        ];
        
        this.setCarType(carType);
        
        // Physics properties
        this.velocityX = 0;
        this.velocityY = 0;
        this.damaged = false;
        
        // Visual effects
        this.skidMarks = [];
        this.exhaustParticles = [];
        
        // Sound simulation (visual feedback)
        this.enginePitch = 0;
    }
    
    setCarType(type) {
        const carConfig = this.carTypes[type];
        this.carType = type;
        this.color = carConfig.color;
        this.accentColor = carConfig.accentColor;
        this.maxSpeed = carConfig.maxSpeed;
        this.acceleration = carConfig.acceleration;
        this.turnSpeed = carConfig.turnSpeed;
        this.width = carConfig.width;
        this.height = carConfig.height;
    }
    
    update(controls) {
        this.move(controls);
        this.updateVisualEffects();
        this.enginePitch = Math.abs(this.velocity) / this.maxSpeed;
    }
    
    move(controls) {
        // Handle acceleration and braking
        if (controls.up) {
            this.velocity += this.acceleration;
        }
        if (controls.down) {
            this.velocity -= this.acceleration * 0.7; // Braking is slightly less powerful
        }
        
        // Apply friction
        this.velocity *= this.friction;
        
        // Limit speed
        if (this.velocity > this.maxSpeed) {
            this.velocity = this.maxSpeed;
        }
        if (this.velocity < -this.maxSpeed * 0.5) {
            this.velocity = -this.maxSpeed * 0.5; // Reverse speed is limited
        }
        
        // Handle turning (only when moving)
        if (Math.abs(this.velocity) > 0.1) {
            if (controls.left) {
                this.angle -= this.turnSpeed * (this.velocity / this.maxSpeed);
            }
            if (controls.right) {
                this.angle += this.turnSpeed * (this.velocity / this.maxSpeed);
            }
        }
        
        // Calculate movement based on angle
        this.velocityX = Math.sin(this.angle) * this.velocity;
        this.velocityY = -Math.cos(this.angle) * this.velocity;
        
        // Update position
        this.x += this.velocityX;
        this.y += this.velocityY;
        
        // Add skid marks for hard turning
        if ((controls.left || controls.right) && Math.abs(this.velocity) > 3) {
            this.addSkidMark();
        }
        
        // Add exhaust particles when accelerating
        if (controls.up && this.velocity > 0) {
            this.addExhaustParticle();
        }
    }
    
    addSkidMark() {
        this.skidMarks.push({
            x: this.x,
            y: this.y,
            life: 100,
            alpha: 0.3
        });
        
        // Limit skid marks array size
        if (this.skidMarks.length > 50) {
            this.skidMarks.shift();
        }
    }
    
    addExhaustParticle() {
        const exhaustX = this.x - Math.sin(this.angle) * this.height * 0.6;
        const exhaustY = this.y + Math.cos(this.angle) * this.height * 0.6;
        
        this.exhaustParticles.push({
            x: exhaustX + (Math.random() - 0.5) * 5,
            y: exhaustY + (Math.random() - 0.5) * 5,
            vx: (Math.random() - 0.5) * 2 - Math.sin(this.angle) * 2,
            vy: (Math.random() - 0.5) * 2 + Math.cos(this.angle) * 2,
            life: 30,
            maxLife: 30,
            size: Math.random() * 3 + 2
        });
        
        // Limit particles
        if (this.exhaustParticles.length > 20) {
            this.exhaustParticles.shift();
        }
    }
    
    updateVisualEffects() {
        // Update skid marks
        this.skidMarks = this.skidMarks.filter(mark => {
            mark.life--;
            mark.alpha = mark.life / 100 * 0.3;
            return mark.life > 0;
        });
        
        // Update exhaust particles
        this.exhaustParticles = this.exhaustParticles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life--;
            particle.vx *= 0.95;
            particle.vy *= 0.95;
            return particle.life > 0;
        });
    }
    
    getCorners() {
        const cos = Math.cos(this.angle);
        const sin = Math.sin(this.angle);
        const halfWidth = this.width / 2;
        const halfHeight = this.height / 2;
        
        const corners = [
            { x: -halfWidth, y: -halfHeight },
            { x: halfWidth, y: -halfHeight },
            { x: halfWidth, y: halfHeight },
            { x: -halfWidth, y: halfHeight }
        ];
        
        return corners.map(corner => ({
            x: this.x + (corner.x * cos - corner.y * sin),
            y: this.y + (corner.x * sin + corner.y * cos)
        }));
    }
    
    checkCollision(boundaries) {
        const corners = this.getCorners();
        
        for (const corner of corners) {
            for (const boundary of boundaries) {
                if (this.pointInBoundary(corner, boundary)) {
                    this.handleCollision();
                    return true;
                }
            }
        }
        return false;
    }
    
    pointInBoundary(point, boundary) {
        return point.x >= boundary.x && 
               point.x <= boundary.x + boundary.width &&
               point.y >= boundary.y && 
               point.y <= boundary.y + boundary.height;
    }
    
    handleCollision() {
        // Bounce back and reduce speed
        this.velocity *= -0.3;
        this.x -= this.velocityX * 2;
        this.y -= this.velocityY * 2;
        
        // Add damage effect
        this.damaged = true;
        setTimeout(() => {
            this.damaged = false;
        }, 200);
    }
    
    draw(ctx) {
        ctx.save();
        
        // Draw skid marks first (behind car)
        this.drawSkidMarks(ctx);
        
        // Draw exhaust particles
        this.drawExhaustParticles(ctx);
        
        // Move to car position and rotate
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        // Apply damage effect
        if (this.damaged) {
            ctx.globalAlpha = 0.7;
            ctx.translate(Math.random() * 2 - 1, Math.random() * 2 - 1);
        }
        
        // Draw car shadow
        ctx.save();
        ctx.translate(2, 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.drawCarShape(ctx);
        ctx.restore();
        
        // Draw main car body
        ctx.fillStyle = this.color;
        this.drawCarShape(ctx);
        
        // Draw car details
        this.drawCarDetails(ctx);
        
        ctx.restore();
    }
    
    drawCarShape(ctx) {
        const halfWidth = this.width / 2;
        const halfHeight = this.height / 2;
        
        // Create rounded rectangle manually for browser compatibility
        const radius = 4;
        ctx.beginPath();
        ctx.moveTo(-halfWidth + radius, -halfHeight);
        ctx.lineTo(halfWidth - radius, -halfHeight);
        ctx.quadraticCurveTo(halfWidth, -halfHeight, halfWidth, -halfHeight + radius);
        ctx.lineTo(halfWidth, halfHeight - radius);
        ctx.quadraticCurveTo(halfWidth, halfHeight, halfWidth - radius, halfHeight);
        ctx.lineTo(-halfWidth + radius, halfHeight);
        ctx.quadraticCurveTo(-halfWidth, halfHeight, -halfWidth, halfHeight - radius);
        ctx.lineTo(-halfWidth, -halfHeight + radius);
        ctx.quadraticCurveTo(-halfWidth, -halfHeight, -halfWidth + radius, -halfHeight);
        ctx.closePath();
        ctx.fill();
    }
    
    drawCarDetails(ctx) {
        const halfWidth = this.width / 2;
        const halfHeight = this.height / 2;
        
        // Windshield
        ctx.fillStyle = 'rgba(135, 206, 235, 0.7)';
        const windshieldWidth = this.width * 0.7;
        const windshieldHeight = this.height * 0.3;
        const windshieldRadius = 2;
        
        ctx.beginPath();
        ctx.moveTo(-halfWidth * 0.7 + windshieldRadius, -halfHeight * 0.6);
        ctx.lineTo(-halfWidth * 0.7 + windshieldWidth - windshieldRadius, -halfHeight * 0.6);
        ctx.quadraticCurveTo(-halfWidth * 0.7 + windshieldWidth, -halfHeight * 0.6, -halfWidth * 0.7 + windshieldWidth, -halfHeight * 0.6 + windshieldRadius);
        ctx.lineTo(-halfWidth * 0.7 + windshieldWidth, -halfHeight * 0.6 + windshieldHeight - windshieldRadius);
        ctx.quadraticCurveTo(-halfWidth * 0.7 + windshieldWidth, -halfHeight * 0.6 + windshieldHeight, -halfWidth * 0.7 + windshieldWidth - windshieldRadius, -halfHeight * 0.6 + windshieldHeight);
        ctx.lineTo(-halfWidth * 0.7 + windshieldRadius, -halfHeight * 0.6 + windshieldHeight);
        ctx.quadraticCurveTo(-halfWidth * 0.7, -halfHeight * 0.6 + windshieldHeight, -halfWidth * 0.7, -halfHeight * 0.6 + windshieldHeight - windshieldRadius);
        ctx.lineTo(-halfWidth * 0.7, -halfHeight * 0.6 + windshieldRadius);
        ctx.quadraticCurveTo(-halfWidth * 0.7, -halfHeight * 0.6, -halfWidth * 0.7 + windshieldRadius, -halfHeight * 0.6);
        ctx.closePath();
        ctx.fill();
        
        // Headlights
        ctx.fillStyle = this.accentColor;
        ctx.beginPath();
        ctx.ellipse(-halfWidth * 0.6, -halfHeight * 0.9, 3, 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(halfWidth * 0.6, -halfHeight * 0.9, 3, 2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Taillights
        ctx.fillStyle = '#ff3333';
        ctx.beginPath();
        ctx.ellipse(-halfWidth * 0.6, halfHeight * 0.9, 2, 1.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(halfWidth * 0.6, halfHeight * 0.9, 2, 1.5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Racing stripes for race car
        if (this.carType === 1) {
            ctx.strokeStyle = this.accentColor;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, -halfHeight);
            ctx.lineTo(0, halfHeight);
            ctx.stroke();
        }
        
        // Chrome bumper for classic car
        if (this.carType === 2) {
            ctx.fillStyle = '#c0c0c0';
            ctx.fillRect(-halfWidth, halfHeight * 0.7, this.width, 3);
            ctx.fillRect(-halfWidth, -halfHeight * 0.9, this.width, 3);
        }
    }
    
    drawSkidMarks(ctx) {
        ctx.save();
        for (const mark of this.skidMarks) {
            ctx.globalAlpha = mark.alpha;
            ctx.fillStyle = '#333';
            ctx.beginPath();
            ctx.ellipse(mark.x, mark.y, 3, 1, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
    
    drawExhaustParticles(ctx) {
        ctx.save();
        for (const particle of this.exhaustParticles) {
            ctx.globalAlpha = particle.life / particle.maxLife * 0.6;
            ctx.fillStyle = '#666';
            ctx.beginPath();
            ctx.ellipse(particle.x, particle.y, particle.size, particle.size, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
    
    getSpeed() {
        return Math.abs(this.velocity);
    }
    
    getSpeedKmh() {
        return Math.round(this.getSpeed() * 15); // Convert to km/h for display
    }
    
    reset(x, y, angle) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.velocity = 0;
        this.velocityX = 0;
        this.velocityY = 0;
        this.damaged = false;
        this.skidMarks = [];
        this.exhaustParticles = [];
        this.enginePitch = 0;
    }
} 