#!/bin/bash
scriptdir="$(dirname "$0")"
cd "$scriptdir"

echo ""
echo "  ----------------------------------------------------------- "
echo ""
echo "  --------  starting installing server  --------------------- "
echo ""
echo "  ----------------------------------------------------------- "

echo " working directory is " `pwd`

sudo apt-get update

echo "  --------  installing npm  --------------- "
sudo apt-get install npm -y

echo "  --------  installing npm packages  --------------- "
npm install

echo ""
echo "  ----------------------------------------------------------- "
echo ""
echo "  --------  done installing server  ------------------------- "
echo ""
echo "  ----------------------------------------------------------- "
