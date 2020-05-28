if(dryMode){
    require("./mock");
}

let raspi = require('raspi');

const MotorMode = {
    Static: "Static",
    PWM: "PWM"
};

class Motor{
    constructor() {
        this.active = false;
    }
    setup(mode, pin1, pin2) {
        this.pin1Name = pin1;
        this.pin2Name = pin2;
        this.mode = mode;
        this.pwmSpan = 20;

        //let raspi = require('raspi');

        switch (mode) {
            case MotorMode.Static:
                let gpio = require('raspi-gpio');
                raspi.init(() => {
                    this.pin1 = new gpio.DigitalOutput(this.pin1Name);
                    this.pin2 = new gpio.DigitalOutput(this.pin2Name);
                });
                break;
            case MotorMode.PWM:
                let pwm = require('raspi-soft-pwm');
                raspi.init(() => {
                    this.pin1 = new pwm.SoftPWM(this.pin1Name);
                    this.pin2 = new pwm.SoftPWM(this.pin2Name);
                });
                break;
        }
        this.active = true;
    }

    forward(speed){
        if(!this.active){
            return;
        }
        this.move(speed, this.pin1, this.pin2);
    }

    backwards(speed){
        if(!this.active){
            return;
        }
        this.move(speed, this.pin2, this.pin1);
    }

    stop(){
        if(!this.active){
            return;
        }
        this.pin1.write(0);
        this.pin2.write(0);
    }

    move(speed, activePin, inactivePin){
        inactivePin.write(0);
        speed = this.normalizeSpeed(speed);
        switch(this.mode){
            case MotorMode.Static:
                activePin.write(1);
                break;
            case MotorMode.PWM:
                activePin.write(speed);
                break;
        }
    }

    normalizeSpeed(speed){
        return ((speed/100 * this.pwmSpan) + 100 - this.pwmSpan)/100;
    }

}

module.exports.Motor = Motor;
module.exports.MotorMode = MotorMode;