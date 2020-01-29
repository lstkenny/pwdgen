#!/bin/bash
if [ $# -gt 0 ]; then
if [ $1 = "chrome" ] || [ $1 = "opera" ] || [ $1 = "firefox" ]; then
dest=../$1
echo "preparing directory $dest"
if [ -d $dest ]; then
rm -r $dest/
fi #[ -d "../$1" ]
mkdir $dest
echo "copying files"
rsync -arv --exclude=.git --exclude=index.html --exclude=make.sh --exclude=manifest* --exclude=readme* ./ $dest
echo "copying manifest"
cp "manifest.json.$1" $dest/manifest.json
fi #[ $1 = "chrome" ] || [ $1 = "opera" ] || [ $1 = "firefox" ]
fi #[ $# -gt 0 ]

