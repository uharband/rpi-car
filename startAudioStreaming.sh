# delete old sessions 
echo "deleting old capture screen sessions..."
screen -ls | grep 'stream\|capture' | cut -d. -f1 | awk '{print $1}' | xargs -r kill  


echo "starting capturing audio..."
# start capturing 
screen -d -m -S capture bash -c 'arecord -D plughw:1,0 -r 44100 -c 2 -f S16_LE | ffmpeg -i - -acodec mp2 -ab 128k -ac 2 -f rtp rtp://127.0.0.1:1234' 
 
echo "waiting 10 sec for the capture to start..."
# wait for capture to start 
sleep 5
 
echo "starting http streaming in a screen session..."
# start http streaming 
screen -d -m -S stream bash -c "vlc --intf dummy rtp://127.0.0.1:1234 :sout='#transcode{vcodec=none,acodec=mp3,ab=128,channels=2,samplerate=44100}:http{mux=mp3,dst=:8080/}' :sout-keep" 
