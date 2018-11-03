to install mjpg_steamer

1. run: chmod +x install_video.sh
2. run: ./install_video
3. reboot to allow the video driver to load: sudo reboot

to run mjpg_steamer

run: 

mjpg_streamer -o "output_http.so -w /usr/local/share/mjpg-streamer/www" -i "input_raspicam.so -vf"

html should be available on port 8080