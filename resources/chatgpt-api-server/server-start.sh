#!/bin/bash

# init pyenv q&d -- this is all a hack / poc, don't forget.. ;)
based=$(dirname $0)
echo Entering $based
cd $based
. pyenv/bin/activate 
python3 server.py
