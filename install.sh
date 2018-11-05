./server/install.sh
./acccess_point/install.sh
./audio/install.sh
./video/install.sh

sed -i -e '/exit 0/{r add-to-rc.local.txt' -e 'd' -e '}' /etc/rc.local
