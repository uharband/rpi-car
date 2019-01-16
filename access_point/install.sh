curl -sSL https://raw.githubusercontent.com/uharband/rpi-car/master/access_point/rPi3-ap-setup.sh | sudo bash $0 password rPi3AP
sudo wget -q https://raw.githubusercontent.com/uharband/rpi-car/master/access_point/dhcpcd.sh -O /usr/lib/dhcpcd5/dhcpcd
sudo chmod +x /usr/lib/dhcpcd5/dhcpcd
