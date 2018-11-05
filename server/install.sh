echo "installing server..."
cd ~
rm -rf rpi-car
sudo apt-get update
sudo apt-get install npm -y
cd rpi-car/server
npm install

echo "done installing server..."
