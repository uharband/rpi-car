#!/bin/bash
scriptdir="$(dirname "$0")"
cd "$scriptdir"

echo ""
echo "  ----------------------------------------------------------- "
echo ""
echo "  --------  starting installing video (mjpg-streamer) ------- "
echo ""
echo "  ----------------------------------------------------------- "

echo " working directory is " `pwd`

rm -rf /tmp/mjpg-streamer
mkdir /tmp
cd /tmp

# clone mjpg-streamer
git clone https://github.com/jacksonliam/mjpg-streamer.git

# install packages
sudo apt-get update
sudo apt-get install cmake libjpeg8-dev -y

cd mjpg-streamer/mjpg-streamer-experimental/
make
sudo make install

# update modules 
sudo /bin/su -c "echo 'bcm2835-v4l2' >> /etc/modules"

echo ""
echo "  ----------------------------------------------------------- "
echo ""
echo "  --------  done installing video  -------------------------- "
echo ""
echo "  ----------------------------------------------------------- "

