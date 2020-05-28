function DigitalOutput(pin){
    return {
        write: function (value) {
            console.log(value);
        }
    };
}

module.exports.DigitalOutput = DigitalOutput;