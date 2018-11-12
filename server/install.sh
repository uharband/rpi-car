echo "  --------  starting installing server  ---------------

sudo apt-get update

echo "  --------  installing npm  ---------------
sudo apt-get install npm -y

echo "  --------  installing npm packages  ---------------
npm --prefix ./server install ./server

echo `pwd`

echo "  --------  done installing server  ---------------
