echo "  --------  starting installing  ---------------

cd "$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )"

echo current directory is `pwd`
./access_point/install.sh
./server/install.sh
./audio/install.sh
./video/install.sh

sudo sed -i -e '/exit 0/{r rc.local/add-to-rc.local.txt' -e 'd' -e '}' /etc/rc.local

echo "  --------  after updating /etc/rc.local, the content of rc.local is:  ----------

cat /etc/rc.local

echo "  --------  finished installing  ---------------