#!/bin/bash
scriptdir="$(dirname "$0")"
cd "$scriptdir"

echo ""
echo "  ----------------------------------------------------------- "
echo ""
echo "  --------  starting installing access point  --------------------- "
echo ""
echo "  ----------------------------------------------------------- "

echo " working directory is " `pwd`

sudo ./rPi3-ap-setup.sh password rPi3AP
sudo cp dhcpcd.sh /usr/lib/dhcpcd5/dhcpcd
sudo chmod +x /usr/lib/dhcpcd5/dhcpcd

echo ""
echo "  ----------------------------------------------------------- "
echo ""
echo "  --------  done installing access point  ------------------------- "
echo ""
echo "  ----------------------------------------------------------- "
