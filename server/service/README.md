# rpi-car service

first create a symlink to the service in  /etc/systemd/system 

cd /etc/systemd/system

sudo ln -s /home/pi/rpi-car/server/rpi-car.service rpi-car.service

then enable the service

sudo systemctl enable rpi-car.service

restart the service

sudo systemctl restart rpi-car.service
