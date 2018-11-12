echo ""
echo "  ----------------------------------------------------------- "
echo ""
echo "  --------  starting installing server  --------------------- "
echo ""
echo "  ----------------------------------------------------------- "

sudo apt-get update

echo "  --------  installing npm  --------------- "
sudo apt-get install npm -y

echo "  --------  installing npm packages  --------------- "
npm --prefix ./server install ./server

echo `pwd`

echo ""
echo "  ----------------------------------------------------------- "
echo ""
echo "  --------  done installing server  ------------------------- "
echo ""
echo "  ----------------------------------------------------------- "
