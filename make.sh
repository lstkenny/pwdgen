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
rsync -arvq --exclude=.git --exclude=index.html --exclude=make.sh --exclude=manifest* --exclude=*.md ./ $dest
echo "copying manifest"
cp "manifest.json.$1" $dest/manifest.json
pushd $dest > /dev/null
echo "creating zip archive"
zip -r -q $1.zip .
popd > /dev/null
echo "done"
fi #[ $1 = "chrome" ] || [ $1 = "opera" ] || [ $1 = "firefox" ]
fi #[ $# -gt 0 ]

