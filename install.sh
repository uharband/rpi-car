cd "$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )"

echo current directory is `pwd`

./server/install.sh
./access_point/install.sh
./audio/install.sh
./video/install.sh

sed -i -e '/exit 0/{r add-to-rc.local.txt' -e 'd' -e '}' /etc/rc.local
