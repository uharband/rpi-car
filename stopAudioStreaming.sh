# delete old sessions 
echo "deleting old capture screen sessions..."
screen -ls | grep 'stream\|capture' | cut -d. -f1 | awk '{print $1}' | xargs -r kill  
