# rpi-car
raspberrypi car controller


add to /etc/rc.local before the last line:


# start the access point. named raspberry, pw raspberry
/home/pi/PNP_RPi3_AP/ap.sh raspberry raspberry

# add the raspberry camera as a /dev/video0 device
# the mgpeg-streamer will look for that device
# by default it doesn't get added. the usb webcam however DOES get registered as video0 device
sudo modprobe bcm2835-v4l2

# start the server in the background
# needs sudo to use the pwm  capabilities
runuser -l pi -c 'cd /home/pi/rpi-car; sudo node server.js'


