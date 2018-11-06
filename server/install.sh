echo "installing server..."

sudo apt-get update
sudo apt-get install npm -y

npm --prefix ./server install ./server

echo `pwd`
echo "done installing server..."
