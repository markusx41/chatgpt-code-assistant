#!/bin/bash

# init pyenv q&d -- this is all a hack / poc, don't forget.. ;)
based=$(dirname $0)
cd $based
virtualenv -p $(which python3) pyenv
. pyenv/bin/activate 
pip install -r requirements.txt
python3 server.py
