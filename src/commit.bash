#!/bin/bash
#git diff 
git config --global user.name "Sir. Automation"
git config --global user.email "auto@mate.com"
git commit -am "Reporting for duty" || exit 0
git push
